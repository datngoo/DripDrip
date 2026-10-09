import { localDay, shiftDay } from './models.js';
import { intakeFor } from './hydration-engine.js';
function reward(state) {
  const p = state.profile;
  p.currentStreak++;
  p.consecutiveGoalDays++;
  p.waterCoins += 10;
  p.longestStreak = Math.max(p.longestStreak, p.currentStreak);
  if (p.consecutiveGoalDays % 7 === 0)
    p.streakFreezesAvailable = Math.min(3, p.streakFreezesAvailable + 1);
  if (p.currentStreak >= 7 && !state.ownedSkins.includes('neon')) state.ownedSkins.push('neon');
  if (p.currentStreak >= 14 && !state.ownedAccessories.includes('boba'))
    state.ownedAccessories.push('boba');
  if (p.currentStreak >= 30 && !state.ownedSkins.includes('gold')) state.ownedSkins.push('gold');
}
/** Finalize each elapsed local calendar day once. A frozen day preserves, never increases, a streak. */
export function reconcileDays(state, now = new Date()) {
  const today = localDay(now);
  if (today < state.createdDay || today <= state.lastSettledDay)
    throw new Error('Ngày trên thiết bị đang lùi. Hãy kiểm tra cài đặt ngày giờ.');
  const totals = new Map();
  for (const log of state.logs)
    totals.set(log.dayKey, (totals.get(log.dayKey) || 0) + log.amountMl);
  const byDay = new Map(state.records.map((r) => [r.date, r]));
  for (let day = shiftDay(state.lastSettledDay, 1); day < today; day = shiftDay(day, 1)) {
    let record = byDay.get(day);
    if (!record) {
      record = {
        id: crypto.randomUUID(),
        date: day,
        goalMl: state.profile.dailyGoalMl,
        metGoal: false,
        isFrozen: false,
        settled: false,
      };
      state.records.push(record);
    }
    if (!record.settled) {
      record.metGoal = (totals.get(day) || 0) >= record.goalMl;
      if (record.metGoal) reward(state);
      else {
        state.profile.consecutiveGoalDays = 0;
        if (state.profile.currentStreak > 0 && state.profile.streakFreezesAvailable > 0) {
          record.isFrozen = true;
          state.profile.streakFreezesAvailable--;
        } else state.profile.currentStreak = 0;
      }
      record.settled = true;
    }
    state.lastSettledDay = day;
  }
  let current = state.records.find((r) => r.date === today);
  if (!current) {
    current = {
      id: crypto.randomUUID(),
      date: today,
      goalMl: state.profile.dailyGoalMl,
      metGoal: false,
      isFrozen: false,
      settled: false,
    };
    state.records.push(current);
  }
  current.metGoal = intakeFor(state, today) >= current.goalMl;
  return state;
}
export function displayStreak(state, day = localDay()) {
  return (
    state.profile.currentStreak +
    (state.records.some((r) => r.date === day && r.metGoal && !r.settled) ? 1 : 0)
  );
}
