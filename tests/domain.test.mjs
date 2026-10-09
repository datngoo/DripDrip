import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, localDay, shiftDay, validDay } from '../src/models.js';
import { petState, weekStats, intakeFor, estimatedGoal } from '../src/hydration-engine.js';
import { reconcileDays, displayStreak } from '../src/streak-manager.js';
import { logWater, removeLog, buyOrEquip, saveSettings } from '../src/actions.js';
import { validateBackup } from '../src/storage.js';
import { escapeHTML } from '../src/ui.js';
const at = (day, h = 12) => new Date(2026, 2, day, h),
  fresh = () => reconcileDays(createState(at(1)), at(1));
const achieve = (s, day) => logWater(s, 2000, at(day));
test('all pet thresholds including exactly 150%', () => {
  for (const [ratio, mood] of [
    [0, 'dehydrated'],
    [0.1999, 'dehydrated'],
    [0.2, 'thirsty'],
    [0.4999, 'thirsty'],
    [0.5, 'normal'],
    [0.9999, 'normal'],
    [1, 'hydrated'],
    [1.4999, 'hydrated'],
    [1.5, 'hydrated'],
    [1.50001, 'overHydrated'],
  ])
    assert.equal(petState(ratio), mood);
});
test('new user starts with zero logs, coins, streak and one freeze', () => {
  const s = fresh();
  assert.equal(s.logs.length, 0);
  assert.equal(s.profile.waterCoins, 0);
  assert.equal(s.profile.currentStreak, 0);
  assert.equal(s.profile.streakFreezesAvailable, 1);
});
test('goal preview updates instantly; settlement awards coins exactly once', () => {
  const s = fresh();
  achieve(s, 1);
  assert.equal(displayStreak(s, localDay(at(1))), 1);
  assert.equal(s.profile.waterCoins, 0);
  reconcileDays(s, at(2));
  assert.equal(s.profile.currentStreak, 1);
  assert.equal(s.profile.waterCoins, 10);
  reconcileDays(s, at(2));
  assert.equal(s.profile.waterCoins, 10);
});
test('drinking past goal grants no extra coins', () => {
  const s = fresh();
  achieve(s, 1);
  achieve(s, 1);
  reconcileDays(s, at(2));
  assert.equal(s.profile.waterCoins, 10);
});
test('undo removes provisional goal and prevents reward', () => {
  const s = fresh();
  const id = logWater(s, 2000, at(1));
  removeLog(s, id, at(1));
  assert.equal(displayStreak(s, localDay(at(1))), 0);
  reconcileDays(s, at(2));
  assert.equal(s.profile.waterCoins, 0);
});
test('cannot delete settled history', () => {
  const s = fresh();
  const id = logWater(s, 2000, at(1));
  assert.throws(() => removeLog(s, id, at(2)));
  assert.equal(s.logs.length, 1);
});
test('one missed day consumes one freeze, preserves streak, grants no coins', () => {
  const s = fresh();
  achieve(s, 1);
  reconcileDays(s, at(3));
  assert.equal(s.profile.currentStreak, 1);
  assert.equal(s.profile.waterCoins, 10);
  assert.equal(s.profile.streakFreezesAvailable, 0);
  assert.equal(s.records.find((r) => r.date === localDay(at(2))).isFrozen, true);
});
test('multiple missed days reset streak after freeze is exhausted', () => {
  const s = fresh();
  achieve(s, 1);
  reconcileDays(s, at(5));
  assert.equal(s.profile.currentStreak, 0);
  assert.equal(s.profile.streakFreezesAvailable, 0);
  assert.equal(s.records.filter((r) => r.isFrozen).length, 1);
});
test('a freeze is not consumed without an existing streak', () => {
  const s = fresh();
  reconcileDays(s, at(3));
  assert.equal(s.profile.streakFreezesAvailable, 1);
});
test('seven completed days award neon and one freeze only once', () => {
  const s = fresh();
  for (let day = 1; day <= 7; day++) achieve(s, day);
  reconcileDays(s, at(8));
  assert.equal(s.profile.currentStreak, 7);
  assert.equal(s.profile.waterCoins, 70);
  assert.equal(s.profile.streakFreezesAvailable, 2);
  assert.deepEqual(s.ownedSkins, ['ocean', 'neon']);
  reconcileDays(s, at(8));
  assert.equal(s.profile.streakFreezesAvailable, 2);
});
test('30 days unlock all milestones and cap freeze inventory at 3', () => {
  const s = fresh();
  for (let day = 1; day <= 30; day++) achieve(s, day);
  reconcileDays(s, at(31));
  assert.equal(s.profile.currentStreak, 30);
  assert.equal(s.profile.waterCoins, 300);
  assert.equal(s.profile.streakFreezesAvailable, 3);
  assert.ok(s.ownedSkins.includes('gold'));
  assert.ok(s.ownedAccessories.includes('boba'));
});
test('a frozen day breaks the 7-successful-day freeze earning chain', () => {
  const s = fresh();
  for (let day = 1; day <= 6; day++) achieve(s, day);
  achieve(s, 8);
  reconcileDays(s, at(9));
  assert.equal(s.profile.currentStreak, 7);
  assert.equal(s.profile.consecutiveGoalDays, 1);
  assert.equal(s.profile.streakFreezesAvailable, 0);
});
test('days are local dates across DST and month boundaries', () => {
  assert.equal(shiftDay('2026-03-08', 1), '2026-03-09');
  assert.equal(shiftDay('2026-11-01', 1), '2026-11-02');
  assert.equal(shiftDay('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftDay('2028-02-28', 1), '2028-02-29');
  assert.equal(validDay('2026-02-30'), false);
  assert.equal(localDay(new Date(2026, 0, 1, 0, 1)), '2026-01-01');
});
test('late-night log belongs to previous day; new day reconciles it', () => {
  const now = new Date(2026, 2, 1, 23, 59, 59),
    s = createState(now);
  logWater(s, 2000, now);
  logWater(s, 200, new Date(2026, 2, 2, 0, 0, 1));
  assert.equal(s.profile.waterCoins, 10);
  assert.equal(intakeFor(s, '2026-03-02'), 200);
  assert.equal(intakeFor(s, '2026-03-01'), 2000);
});
test('goal changes preserve started day and apply to next day', () => {
  const s = fresh();
  logWater(s, 200, at(1));
  saveSettings(
    s,
    { name: 'Drippy', dailyGoalMl: 1000, notificationModeRaw: 'gentle', reminderMinutes: 60 },
    at(1),
  );
  assert.equal(s.records[0].goalMl, 2000);
  reconcileDays(s, at(2));
  assert.equal(s.records[1].goalMl, 1000);
  assert.equal(s.profile.waterCoins, 0);
});
test('goal changes apply immediately to an empty day', () => {
  const s = fresh();
  saveSettings(
    s,
    { name: '  ', dailyGoalMl: 1000, notificationModeRaw: 'gentle', reminderMinutes: 60 },
    at(1),
  );
  assert.equal(s.records[0].goalMl, 1000);
  assert.equal(s.profile.name, 'bạn');
});
test('invalid amount, settings and item are rejected', () => {
  const s = fresh();
  for (const amount of [-1, 0, NaN, Infinity, 24, 2001, 1.5])
    assert.throws(() => logWater(s, amount, at(1)));
  assert.throws(() => saveSettings(s, { dailyGoalMl: 0 }, at(1)));
  assert.throws(() => buyOrEquip(s, 'bad', 'skin', at(1)));
  assert.throws(() => buyOrEquip(s, 'gold', 'skin', at(1)));
});
test('purchases debit once, grant ownership and equip', () => {
  const s = fresh();
  s.profile.waterCoins = 150;
  buyOrEquip(s, 'cloud', 'skin', at(1));
  assert.equal(s.profile.waterCoins, 50);
  assert.equal(s.profile.selectedSkinId, 'cloud');
  buyOrEquip(s, 'cloud', 'skin', at(1));
  assert.equal(s.profile.waterCoins, 50);
  assert.equal(s.purchases.length, 1);
  buyOrEquip(s, 'flower', 'accessory', at(1));
  assert.equal(s.profile.waterCoins, 20);
  assert.equal(s.profile.selectedAccessoryId, 'flower');
});
test('insufficient funds cannot buy a cosmetic', () => {
  const s = fresh();
  assert.throws(() => buyOrEquip(s, 'cloud', 'skin', at(1)));
  assert.equal(s.profile.waterCoins, 0);
  assert.equal(s.ownedSkins.length, 1);
});
test('weekly stats include rolling seven days and true active-day average', () => {
  const s = fresh();
  logWater(s, 500, at(1));
  const stats = weekStats(s, at(1));
  assert.equal(stats.total, 500);
  assert.equal(stats.average, 500);
  assert.equal(stats.activeDays, 1);
  assert.equal(stats.days.length, 7);
  reconcileDays(s, at(10));
  assert.equal(weekStats(s, at(10)).total, 0);
});
test('calculator follows PRD formula and validates ranges', () => {
  assert.equal(estimatedGoal(60, 30, true), 2950);
  assert.throws(() => estimatedGoal(NaN, 30, true));
  assert.throws(() => estimatedGoal(0, 30, true));
});
test('backup round trip retains data and rejects duplicate IDs and missing history', () => {
  const s = fresh();
  achieve(s, 1);
  reconcileDays(s, at(2));
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(s)), at(2)), s);
  const clone = structuredClone(s);
  clone.logs.push(clone.logs[0]);
  assert.throws(() => validateBackup(clone, at(2)));
  const broken = structuredClone(s);
  broken.records = [];
  assert.throws(() => validateBackup(broken, at(2)));
});
test('corrupt and future backups are rejected', () => {
  for (const bad of [null, {}, [], { version: 5 }]) assert.throws(() => validateBackup(bad));
  const s = fresh();
  s.profile.waterCoins = -1;
  assert.throws(() => validateBackup(s, at(1)));
  const future = fresh();
  future.createdDay = '2099-01-01';
  assert.throws(() => validateBackup(future, at(1)));
});
test('render boundary escapes untrusted names and log ids', () => {
  assert.equal(
    escapeHTML('<img src=x onerror="alert(1)">'),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
  );
});
test('backward device clock does not settle days twice', () => {
  const s = fresh();
  achieve(s, 1);
  reconcileDays(s, at(3));
  assert.throws(() => reconcileDays(s, at(2)));
  assert.equal(s.profile.waterCoins, 10);
});
