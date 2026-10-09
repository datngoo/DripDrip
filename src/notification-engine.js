export const notificationCopy = {
  sarcastic: [
    'Cây xương rồng gọi: đến lượt bạn uống nước rồi đó. 🌵',
    'Bạn lướt feed rồi. Giờ lướt qua bình nước nhé? 💧',
  ],
  gentle: [
    'Dừng lại một chút, uống một ngụm. Drippy đợi bạn nhé. 💙',
    'Một ngụm nhỏ cũng là một cách chăm mình. 🌿',
  ],
  aesthetic: [
    'A little sip, a little glow. Đến giờ refresh rồi ✨',
    'Mood hôm nay: đủ nước, đủ chill. 🫧',
  ],
};
export const reminderText = (mode) => {
  const lines = notificationCopy[mode] || notificationCopy.gentle;
  return lines[Math.floor(Math.random() * lines.length)];
};
export async function requestNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator))
    throw new Error(
      'Trình duyệt này chưa hỗ trợ thông báo. Trên iPhone, hãy thêm app vào Màn hình chính rồi mở lại.',
    );
  const permission = await Notification.requestPermission();
  if (permission !== 'granted')
    throw new Error('Thông báo chưa được cho phép. Bạn có thể bật lại trong cài đặt trình duyệt.');
  return permission;
}
export async function showReminder(mode) {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration || !('Notification' in window) || Notification.permission !== 'granted')
    return false;
  await registration.showNotification('Drippy đang đợi bạn 💧', {
    body: reminderText(mode),
    icon: new URL('../assets/icon-192.png', import.meta.url).href,
    tag: 'dripdrip-reminder',
  });
  return true;
}
