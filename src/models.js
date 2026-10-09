/** @typedef {{id:string,timestamp:string,dayKey:string,amountMl:number}} WaterLog */
/** @typedef {{id:string,date:string,goalMl:number,metGoal:boolean,isFrozen:boolean,settled:boolean}} StreakRecord */
export const SCHEMA_VERSION = 1;
export const localDay = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export function shiftDay(key, amount) {
  const [y, m, d] = key.split('-').map(Number);
  return localDay(new Date(y, m - 1, d + amount, 12));
}
export const validDay = (key) =>
  typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key) && shiftDay(key, 0) === key;
export function createState(now = new Date()) {
  return {
    version: SCHEMA_VERSION,
    createdDay: localDay(now),
    lastSettledDay: shiftDay(localDay(now), -1),
    profile: {
      name: 'bạn',
      dailyGoalMl: 2000,
      currentStreak: 0,
      longestStreak: 0,
      consecutiveGoalDays: 0,
      waterCoins: 0,
      streakFreezesAvailable: 1,
      selectedSkinId: 'ocean',
      selectedAccessoryId: 'none',
      notificationModeRaw: 'gentle',
      remindersEnabled: false,
      reminderMinutes: 90,
      lastReminderAt: 0,
      onboarded: false,
    },
    ownedSkins: ['ocean'],
    ownedAccessories: ['none'],
    logs: [],
    records: [],
    purchases: [],
  };
}
export const SKINS = [
  {
    id: 'ocean',
    name: 'Ocean Drippy',
    description: 'Một giọt biển xanh, một người bạn nhỏ.',
    cost: 0,
    colors: ['#a4e6ff', '#57b5ed', '#168cd3'],
    tag: 'NGƯỜI BẠN ĐẦU TIÊN',
  },
  {
    id: 'neon',
    name: 'Neonglow Drippy',
    description: 'Một chút nổi bật cho ngày thường.',
    cost: 70,
    colors: ['#d4c4ff', '#a386f7', '#7452da'],
    tag: '7 NGÀY STREAK',
  },
  {
    id: 'cloud',
    name: 'Cloud Drippy',
    description: 'Nhẹ tênh như một đám mây.',
    cost: 100,
    colors: ['#fff', '#e0edf9', '#a5c6e4'],
    tag: 'TRÊN CHÍN TẦNG MÂY',
  },
  {
    id: 'dragon',
    name: 'Dragon Drippy',
    description: 'Bé rồng xanh với trái tim mềm xíu.',
    cost: 150,
    colors: ['#bdf4d7', '#75d5a4', '#30a877'],
    tag: 'MỘT CHÚT PHÉP THUẬT',
  },
  {
    id: 'gold',
    name: 'Golden Drippy',
    description: 'Ánh vàng dành cho sự kiên trì.',
    cost: null,
    colors: ['#fff2b2', '#f4ce68', '#d69b2e'],
    tag: '30 NGÀY STREAK',
  },
];
export const ACCESSORIES = [
  { id: 'none', name: 'Tự nhiên là đẹp', cost: 0, icon: 'sparkles' },
  { id: 'flower', name: 'Hoa cúc bé xíu', cost: 30, icon: 'flower' },
  { id: 'boba', name: 'Ống hút Boba', cost: 60, icon: 'cup' },
  { id: 'crown', name: 'Vương miện', cost: 100, icon: 'crown' },
];
export const PET_STATES = {
  dehydrated: {
    label: 'Đang khát lắm',
    message: 'Một ngụm nước cho mình nhé?',
    hint: 'Bắt đầu nhẹ nhàng, từng ngụm nhỏ thôi.',
  },
  thirsty: {
    label: 'Cần thêm chút nước',
    message: 'Một chút nữa là tươi tỉnh rồi!',
    hint: 'Từng ngụm nhỏ đang tạo nên thói quen lớn.',
  },
  normal: {
    label: 'Đang tươi tỉnh',
    message: 'Có bạn chăm, mình vui hẳn!',
    hint: 'Bạn đang làm rất tốt. Cứ theo nhịp của mình nhé.',
  },
  hydrated: {
    label: 'Đã đủ nước',
    message: 'Hôm nay chúng mình làm được rồi!',
    hint: 'Đã đạt mục tiêu. Không cần cố uống thêm để lấy thưởng.',
  },
  overHydrated: {
    label: 'Đã vượt mục tiêu',
    message: 'Mình nghỉ một chút nhé!',
    hint: 'Không có thêm phần thưởng khi vượt mục tiêu.',
  },
};
