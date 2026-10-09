import {
  createState,
  SCHEMA_VERSION,
  SKINS,
  ACCESSORIES,
  validDay,
  localDay,
  shiftDay,
} from './models.js';
import { reconcileDays } from './streak-manager.js';
const DB_NAME = 'dripdrip',
  STORE = 'app',
  KEY = 'state';
let database;
export function openDatabase() {
  if (database) return database;
  database = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => {
      request.result.onversionchange = () => {
        request.result.close();
        database = null;
      };
      resolve(request.result);
    };
    request.onerror = () => {
      database = null;
      reject(new Error('Không mở được bộ nhớ. Hãy cho phép lưu dữ liệu trong trình duyệt.'));
    };
    request.onblocked = () => reject(new Error('Hãy đóng các tab DripDrip khác rồi tải lại.'));
  });
  return database;
}
/** One read-write transaction serializes mutations across tabs, including purchases and rewards. */
export async function transact(mutator = () => {}, now = new Date()) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite'),
      store = tx.objectStore(STORE),
      req = store.get(KEY);
    let state, result, failure;
    req.onsuccess = () => {
      try {
        state = req.result ?? createState(now);
        if (state.version !== SCHEMA_VERSION)
          throw new Error('Dữ liệu thuộc phiên bản mới hơn. Hãy cập nhật ứng dụng.');
        reconcileDays(state, now);
        result = mutator(state);
        store.put(state, KEY);
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve({ state, result });
    tx.onerror = tx.onabort = () =>
      reject(failure || new Error('Không lưu được dữ liệu. Bộ nhớ thiết bị có thể đã đầy.'));
  });
}
export async function replaceState(state) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(state, KEY);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(new Error('Không khôi phục được dữ liệu.'));
  });
}
export function validateBackup(input, now = new Date()) {
  const bad = () => {
    throw new Error('Bản sao lưu không hợp lệ hoặc không tương thích.');
  };
  if (
    !input ||
    input.version !== 1 ||
    !input.profile ||
    !Array.isArray(input.logs) ||
    !Array.isArray(input.records) ||
    !Array.isArray(input.purchases)
  )
    bad();
  const p = input.profile,
    integer = (x, min, max) => Number.isInteger(x) && x >= min && x <= max;
  if (
    !validDay(input.createdDay) ||
    !validDay(input.lastSettledDay) ||
    input.createdDay > '9999-01-01' ||
    input.createdDay < shiftDay(localDay(now), -36525) ||
    input.createdDay > localDay(now) ||
    input.lastSettledDay < shiftDay(input.createdDay, -1) ||
    input.lastSettledDay >= localDay(now)
  )
    bad();
  if (
    !integer(p.dailyGoalMl, 500, 8000) ||
    !integer(p.currentStreak, 0, 36525) ||
    !integer(p.longestStreak, p.currentStreak, 36525) ||
    !integer(p.waterCoins, 0, 10000000) ||
    !integer(p.streakFreezesAvailable, 0, 3) ||
    !integer(p.consecutiveGoalDays, 0, 36525) ||
    !integer(p.lastReminderAt, 0, Date.now() + 86400000) ||
    typeof p.name !== 'string' ||
    p.name.length > 30
  )
    bad();
  if (
    !['gentle', 'sarcastic', 'aesthetic'].includes(p.notificationModeRaw) ||
    typeof p.onboarded !== 'boolean' ||
    typeof p.remindersEnabled !== 'boolean' ||
    ![30, 60, 90, 120].includes(p.reminderMinutes)
  )
    bad();
  if (
    !Array.isArray(input.ownedSkins) ||
    !Array.isArray(input.ownedAccessories) ||
    input.ownedSkins.some((id) => !SKINS.some((s) => s.id === id)) ||
    input.ownedAccessories.some((id) => !ACCESSORIES.some((s) => s.id === id)) ||
    !input.ownedSkins.includes('ocean') ||
    !input.ownedAccessories.includes('none') ||
    !input.ownedSkins.includes(p.selectedSkinId) ||
    !input.ownedAccessories.includes(p.selectedAccessoryId)
  )
    bad();
  if (input.logs.length > 200000 || input.records.length > 36526 || input.purchases.length > 20)
    bad();
  const ids = new Set(),
    days = new Set();
  for (const l of input.logs) {
    if (
      typeof l.id !== 'string' ||
      ids.has(l.id) ||
      !integer(l.amountMl, 25, 2000) ||
      !validDay(l.dayKey) ||
      l.dayKey < input.createdDay ||
      l.dayKey > localDay(now) ||
      typeof l.timestamp !== 'string' ||
      !Number.isFinite(Date.parse(l.timestamp)) ||
      Date.parse(l.timestamp) > now.getTime() + 60000
    )
      bad();
    ids.add(l.id);
  }
  for (const r of input.records) {
    if (
      typeof r.id !== 'string' ||
      !validDay(r.date) ||
      days.has(r.date) ||
      r.date < input.createdDay ||
      r.date > localDay(now) ||
      !integer(r.goalMl, 500, 8000) ||
      typeof r.metGoal !== 'boolean' ||
      typeof r.isFrozen !== 'boolean' ||
      typeof r.settled !== 'boolean' ||
      (r.metGoal && r.isFrozen) ||
      r.settled !== r.date <= input.lastSettledDay
    )
      bad();
    days.add(r.date);
  }
  for (let day = input.createdDay; day <= input.lastSettledDay; day = shiftDay(day, 1))
    if (!days.has(day)) bad();
  for (const item of input.purchases)
    if (
      !item ||
      typeof item.id !== 'string' ||
      !['skin', 'accessory'].includes(item.type) ||
      !integer(item.cost, 0, 10000) ||
      !Number.isFinite(Date.parse(item.timestamp)) ||
      !(item.type === 'skin' ? SKINS : ACCESSORIES).some((s) => s.id === item.itemId)
    )
      bad();
  // Only return known fields; imported strings are always escaped at the rendering boundary.
  return {
    version: 1,
    createdDay: input.createdDay,
    lastSettledDay: input.lastSettledDay,
    profile: { ...createState(now).profile, ...p },
    ownedSkins: [...new Set(input.ownedSkins)],
    ownedAccessories: [...new Set(input.ownedAccessories)],
    logs: input.logs,
    records: input.records,
    purchases: input.purchases,
  };
}
