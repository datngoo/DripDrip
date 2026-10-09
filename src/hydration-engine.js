import { localDay, shiftDay } from './models.js';
export function petState(ratio) {
  if (ratio > 1.5) return 'overHydrated';
  if (ratio >= 1) return 'hydrated'; // Exactly 150% stays hydrated; >150% is overHydrated.
  if (ratio >= 0.5) return 'normal';
  if (ratio >= 0.2) return 'thirsty';
  return 'dehydrated';
}
export const intakeFor = (state, day = localDay()) =>
  state.logs.filter((l) => l.dayKey === day).reduce((sum, l) => sum + l.amountMl, 0);
export const goalFor = (state, day = localDay()) =>
  state.records.find((r) => r.date === day)?.goalMl ?? state.profile.dailyGoalMl;
export const progressFor = (state, day = localDay()) => intakeFor(state, day) / goalFor(state, day);
export function weekStats(state, now = new Date()) {
  const today = localDay(now);
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = shiftDay(today, i - 6);
    return {
      day,
      total: intakeFor(state, day),
      goal: goalFor(state, day),
      record: state.records.find((r) => r.date === day),
    };
  });
  const total = days.reduce((s, d) => s + d.total, 0);
  const activeDays = days.filter((d) => d.day >= state.createdDay).length;
  return {
    days,
    total,
    average: Math.round(total / Math.max(1, activeDays)),
    goals: days.filter((d) => d.total >= d.goal).length,
    activeDays,
  };
}
export function estimatedGoal(weight, activity, hot) {
  if (
    !Number.isFinite(weight) ||
    weight < 20 ||
    weight > 300 ||
    !Number.isFinite(activity) ||
    activity < 0 ||
    activity > 300
  )
    throw new Error('Kiểm tra lại cân nặng và thời gian vận động.');
  return Math.round((weight * 35 + (activity / 30) * 350 + (hot ? 500 : 0)) / 50) * 50;
}
