import { weekStats } from './hydration-engine.js';
import { displayStreak } from './streak-manager.js';
import { petSVG } from './pet-mascot.js';
import { icon, liters } from './ui.js';
export function shareStoryView(state) {
  const stats = weekStats(state),
    streak = displayStreak(state);
  return `<section class="page-heading"><div><div class="eyebrow">YOUR WEEK, WITH A LITTLE SPLASH.</div><h1>Water Wrapped</h1><p>Một tuần chăm mình, gói lại thành một chiếc story.</p></div><span class="subtle-badge">${stats.days[0].day.slice(8)}/${stats.days[0].day.slice(5, 7)} — ${stats.days[6].day.slice(8)}/${stats.days[6].day.slice(5, 7)}</span></section><div class="wrapped-layout"><div class="story-preview" id="story-preview"><div class="story-brand">${icon('drop')} dripdrip</div><span class="story-label">MY WATER WRAPPED</span><h2>Từng ngụm nhỏ.<br>Một tuần tươi hơn.</h2><div class="story-pet">${petSVG({ skinId: state.profile.selectedSkinId, accessoryId: state.profile.selectedAccessoryId, state: stats.goals ? 'hydrated' : 'normal' })}</div><div class="story-big">${liters(stats.total)}<span> lít</span></div><p>đã uống trong 7 ngày qua</p><div class="story-stats"><div><strong>${streak}</strong><span>ngày streak</span></div><div><strong>${stats.goals}/7</strong><span>ngày đạt mục tiêu</span></div></div><div class="story-signoff">a little sip. a little happier. ♡</div></div><div class="wrapped-details"><span class="pill">${icon('sparkles')} MADE TO BE SHARED</span><h2>Thói quen tốt.<br>Năng lượng dễ thương.</h2><p>Drippy đã sẵn sàng lên sóng cùng bạn. Lưu ảnh dọc 9:16, rồi đăng lên Instagram Story, TikTok hoặc gửi cho một người bạn.</p><div class="export-spec"><span>${icon('check')} 1080 × 1920 px</span><span>${icon('check')} Trang phục hiện tại của Drippy</span><span>${icon('check')} Số liệu thật của bạn</span></div><button class="button primary" data-action="download-story">${icon('download')} Lưu ảnh story</button><button class="button secondary" data-action="share-story">${icon('share')} Chia sẻ với bạn bè</button><span class="caption">Ảnh được tạo ngay trên thiết bị. Không tải dữ liệu lên máy chủ.</span><p class="caption" id="story-status" role="status">Đang chuẩn bị ảnh…</p></div></div>`;
}
export async function createStoryBlob(state) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ xuất ảnh.');
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, '#e3f4ff');
  gradient.addColorStop(0.55, '#c9e9fb');
  gradient.addColorStop(1, '#91cbef');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = '#ffffff44';
  ctx.beginPath();
  ctx.arc(920, 830, 390, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(90, 1010, 300, 0, Math.PI * 2);
  ctx.fill();
  const text = (value, y, size = 40, weight = 600, color = '#23465f') => {
    ctx.font = `${weight} ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(value, 540, y);
  };
  const stats = weekStats(state);
  text('dripdrip', 125, 52, 800);
  text('MY WATER WRAPPED', 235, 25, 600, '#507b99');
  text('Từng ngụm nhỏ.', 350, 73, 800);
  text('Một tuần tươi hơn.', 440, 73, 800);
  const img = new Image(),
    url = URL.createObjectURL(
      new Blob(
        [
          petSVG({
            skinId: state.profile.selectedSkinId,
            accessoryId: state.profile.selectedAccessoryId,
            state: stats.goals ? 'hydrated' : 'normal',
            exporting: true,
          }),
        ],
        { type: 'image/svg+xml' },
      ),
    );
  try {
    img.src = url;
    await img.decode();
    ctx.drawImage(img, 240, 480, 600, 621);
  } finally {
    URL.revokeObjectURL(url);
  }
  text(liters(stats.total) + ' lít', 1230, 136, 800);
  text('đã uống trong 7 ngày qua', 1305, 35, 500);
  ctx.fillStyle = '#ffffff6e';
  ctx.beginPath();
  ctx.roundRect(90, 1415, 900, 235, 40);
  ctx.fill();
  ctx.fillStyle = '#284a63';
  ctx.font = '800 83px system-ui, sans-serif';
  ctx.fillText(String(displayStreak(state)), 315, 1530);
  ctx.fillText(stats.goals + '/7', 765, 1530);
  ctx.font = '500 28px system-ui, sans-serif';
  ctx.fillText('ngày streak', 315, 1590);
  ctx.fillText('ngày đạt mục tiêu', 765, 1590);
  const dateLabel = (day) => `${day.slice(8)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;
  text(dateLabel(stats.days[0].day) + ' — ' + dateLabel(stats.days[6].day), 1735, 25, 500);
  text('a little sip. a little happier. ♡', 1815, 29, 500);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Không tạo được ảnh.'))),
      'image/png',
    ),
  );
}
export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
