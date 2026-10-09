import { SKINS, ACCESSORIES, localDay } from './models.js';
import { reconcileDays } from './streak-manager.js';
import { intakeFor } from './hydration-engine.js';
export function logWater(state, amount, now = new Date()) {
  if (!Number.isInteger(amount) || amount < 25 || amount > 2000)
    throw new Error('Mỗi lần ghi nhận từ 25 đến 2.000 ml.');
  reconcileDays(state, now);
  const log = {
    id: crypto.randomUUID(),
    timestamp: now.toISOString(),
    dayKey: localDay(now),
    amountMl: amount,
  };
  state.logs.push(log);
  reconcileDays(state, now);
  return log.id;
}
export function removeLog(state, id, now = new Date()) {
  reconcileDays(state, now);
  const log = state.logs.find((l) => l.id === id);
  if (!log || log.dayKey !== localDay(now))
    throw new Error('Chỉ có thể sửa nhật ký trong ngày hôm nay.');
  state.logs = state.logs.filter((l) => l.id !== id);
  reconcileDays(state, now);
}
export function buyOrEquip(state, id, type, now = new Date()) {
  reconcileDays(state, now);
  const skin = type === 'skin',
    item = (skin ? SKINS : ACCESSORIES).find((i) => i.id === id);
  if (!item) throw new Error('Không tìm thấy vật phẩm.');
  const owned = skin ? state.ownedSkins : state.ownedAccessories;
  if (!owned.includes(id)) {
    if (item.cost === null) throw new Error('Vật phẩm này được mở bằng cột mốc streak.');
    if (state.profile.waterCoins < item.cost)
      throw new Error('Chưa đủ Water Coins. Mỗi ngày đạt mục tiêu nhận 10 xu.');
    state.profile.waterCoins -= item.cost;
    owned.push(id);
    state.purchases.push({
      id: crypto.randomUUID(),
      itemId: id,
      type,
      cost: item.cost,
      timestamp: now.toISOString(),
    });
  }
  state.profile[skin ? 'selectedSkinId' : 'selectedAccessoryId'] = id;
}
export function saveSettings(state, settings, now = new Date()) {
  reconcileDays(state, now);
  if (
    !Number.isInteger(settings.dailyGoalMl) ||
    settings.dailyGoalMl < 500 ||
    settings.dailyGoalMl > 8000
  )
    throw new Error('Mục tiêu cần nằm trong khoảng 500–8.000 ml.');
  if (!['gentle', 'sarcastic', 'aesthetic'].includes(settings.notificationModeRaw))
    throw new Error('Chọn giọng nhắc hợp lệ.');
  if (![30, 60, 90, 120].includes(settings.reminderMinutes))
    throw new Error('Chọn khoảng nhắc hợp lệ.');
  Object.assign(state.profile, {
    name:
      String(settings.name || 'bạn')
        .trim()
        .slice(0, 30) || 'bạn',
    dailyGoalMl: settings.dailyGoalMl,
    notificationModeRaw: settings.notificationModeRaw,
    reminderMinutes: settings.reminderMinutes,
  });
  // Preserve an in-progress day's goal. Empty days may adopt the new goal immediately.
  if (intakeFor(state, localDay(now)) === 0)
    state.records.find((r) => r.date === localDay(now)).goalMl = settings.dailyGoalMl;
  state.profile.onboarded = true;
}
