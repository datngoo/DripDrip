import { localDay, PET_STATES, shiftDay } from './models.js';
import { intakeFor, goalFor, progressFor, petState, weekStats } from './hydration-engine.js';
import { displayStreak } from './streak-manager.js';
import { petSVG } from './pet-mascot.js';
import { icon, number, liters, escapeHTML, emptyState } from './ui.js';
export function chart(state) {
  const { days } = weekStats(state),
    max = Math.max(...days.map((d) => Math.max(d.total, d.goal)), 1);
  return `<div class="chart" role="img" aria-label="Lượng nước 7 ngày gần nhất">${days.map((d, i) => `<div class="chart-day ${i === 6 ? 'current' : ''}" aria-label="${d.day}: ${d.total} trên ${d.goal} ml"><span class="chart-value">${d.total ? liters(d.total) + 'L' : '—'}</span><div class="bar-track"><div class="bar-goal" style="bottom:${(d.goal / max) * 100}%"></div><div class="bar-fill ${d.total >= d.goal ? 'met' : ''}" style="height:${Math.max(2, (d.total / max) * 100)}%"></div></div><span class="day-label">${i === 6 ? 'H.nay' : new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(new Date(d.day + 'T12:00:00'))}</span></div>`).join('')}</div>`;
}
export function logList(state, all = false) {
  const logs = state.logs
    .filter((l) => all || l.dayKey === localDay())
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  if (!logs.length)
    return emptyState(
      'Bắt đầu bằng một ngụm nhỏ',
      'Những lần uống nước của bạn sẽ xuất hiện ở đây.',
    );
  return `<div class="log-list">${logs
    .slice(0, all ? 100 : 4)
    .map(
      (l) =>
        `<div class="log-row"><span class="log-icon">${icon(l.amountMl >= 500 ? 'bottle' : 'glass')}</span><div><strong>${number(l.amountMl)} <span>ml nước</span></strong><small>${all ? new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'numeric' }).format(new Date(l.dayKey + 'T12:00:00')) + ' · ' : ''}${new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(l.timestamp))}</small></div>${l.dayKey === localDay() ? `<button class="icon-button delete-log" data-action="delete-log" data-id="${escapeHTML(l.id)}" aria-label="Xóa lần uống ${l.amountMl} ml">${icon('trash')}</button>` : icon('check', 'muted')}</div>`,
    )
    .join(
      '',
    )}</div>${all && logs.length > 100 ? '<p class="caption">Hiển thị 100 lần gần nhất. Bản sao lưu chứa toàn bộ nhật ký.</p>' : ''}`;
}
export function dashboardView(state) {
  const p = state.profile,
    total = intakeFor(state),
    goal = goalFor(state),
    ratio = progressFor(state),
    mood = petState(ratio),
    copy = PET_STATES[mood],
    stats = weekStats(state);
  return `<section class="page-heading"><div><div class="eyebrow">A LITTLE SIP. A LITTLE HAPPIER.</div><h1>Chào ${escapeHTML(p.name)}<span class="hello-sun">☀</span></h1><p>Chăm mình một chút. Drippy vui cả ngày.</p></div><button class="button secondary heading-action" data-action="navigate" data-page="wrapped">${icon('share')} Water Wrapped</button></section>
  ${!p.onboarded ? `<div class="welcome-banner"><span>${icon('heart')} Một người bạn nhỏ, một thói quen tốt.</span><button data-action="settings">Làm quen với Drippy ${icon('arrow')}</button></div>` : ''}
  <div class="dashboard-grid"><section class="card pet-card"><div class="pet-card-top"><span class="eyebrow">NGƯỜI BẠN CỦA BẠN</span><span class="pet-status ${mood}"><i></i>${copy.label}</span></div><div class="pet-scene"><span class="scene-star star-one">✧</span><span class="scene-star star-two">✦</span><span class="scene-bubble bubble-one"></span><span class="scene-bubble bubble-two"></span><div class="speech-bubble">${copy.message}</div><button class="pet-touch" data-action="pet" aria-label="Chạm để chơi với Drippy">${petSVG({ skinId: p.selectedSkinId, accessoryId: p.selectedAccessoryId, state: mood })}</button><div class="scene-ripple"></div></div><div class="pet-card-bottom"><div><h2>Drippy <span>♡</span></h2><p>${copy.hint}</p></div><button class="icon-button" data-action="navigate" data-page="store" aria-label="Thay trang phục cho Drippy">${icon('sparkles')}</button></div></section>
  <section class="card hydration-card"><div class="section-label"><h2>Hôm nay bạn đã uống</h2><span class="tag">${icon('drop')} MỖI NGỤM ĐỀU TÍNH</span></div><div class="intake-count">${number(total)} <span>/ ${number(goal)} ml</span></div><div class="progress-label"><span>${ratio >= 1 ? 'Mục tiêu hôm nay đã hoàn thành ✨' : `Còn ${number(Math.max(0, goal - total))} ml đến mục tiêu`}</span><strong>${Math.round(ratio * 100)}%</strong></div><div class="progress-track" role="progressbar" aria-label="Tiến độ uống nước" aria-valuenow="${Math.min(100, Math.round(ratio * 100))}" aria-valuemin="0" aria-valuemax="100" aria-valuetext="${total} trên ${goal} ml"><span style="width:${Math.min(100, ratio * 100)}%"></span></div><div class="quick-log-heading"><h3>Thêm một ngụm nào</h3><span>Chạm để ghi lại</span></div><div class="quick-log">${[
    [200, 'glass', 'Ly nhỏ'],
    [350, 'cup', 'Ly vừa'],
    [500, 'bottle', 'Bình nước'],
  ]
    .map(
      ([amount, image, label]) =>
        `<button data-action="log" data-amount="${amount}" aria-label="Thêm ${amount} ml">${icon(image)}<strong>${amount}<small> ml</small></strong><span>${label}</span></button>`,
    )
    .join(
      '',
    )}<button data-action="custom" aria-label="Ghi lượng nước tùy chọn">${icon('plus')}<strong>Tùy chọn</strong><span>Theo ý bạn</span></button></div><div class="hydration-note">${icon('leaf')} Một thói quen nhỏ. Một phiên bản tươi hơn.</div></section>
  <div class="mini-stats"><section class="card mini-stat"><span class="stat-icon amber">${icon('fire')}</span><div><strong>${displayStreak(state)} <span>ngày</span></strong><p>Streak hiện tại</p></div></section><section class="card mini-stat"><span class="stat-icon mint">${icon('drop')}</span><div><strong>${liters(stats.average)} <span>lít</span></strong><p>Trung bình mỗi ngày${stats.activeDays < 7 ? ' đã tham gia' : ''}</p></div></section></div>
  <section class="card freeze-card"><span class="stat-icon blue">${icon('snow')}</span><div><h3>Có hôm quên? Có mình đây.</h3><p>Bạn có <strong>${p.streakFreezesAvailable} Streak Freeze</strong> bảo vệ chuỗi ngày.</p></div><button class="icon-button" data-action="streak-info" aria-label="Tìm hiểu về Streak Freeze">${icon('arrow')}</button></section>
  <section class="card weekly-card"><div class="section-label"><div><div class="eyebrow">TỪNG CHÚT MỘT, MỖI NGÀY</div><h2>Nhịp uống nước của bạn</h2></div><span class="subtle-badge">7 ngày qua</span></div>${chart(state)}<div class="chart-footer"><span><i></i> Lượng nước đã uống <i class="legend-goal"></i> Mục tiêu</span><strong>${stats.goals}/7 ngày đạt mục tiêu</strong></div></section>
  <section class="card history-card"><div class="section-label"><h2>Những ngụm hôm nay</h2><button class="text-button" data-action="navigate" data-page="history">Xem tất cả ${icon('arrow')}</button></div>${logList(state)}</section></div><footer class="page-footer">${icon('heart')} Made for you & your little water buddy. <span>Dữ liệu chỉ ở trên thiết bị của bạn.</span></footer>`;
}
export function historyView(state) {
  const stats = weekStats(state);
  return `<section class="page-heading"><div><div class="eyebrow">SMALL SIPS, BIG LITTLE WINS.</div><h1>Hành trình của bạn</h1><p>Từng ngụm nhỏ đều xứng đáng được ghi nhớ.</p></div><button class="button secondary" data-action="backup">${icon('download')} Sao lưu dữ liệu</button></section><div class="history-summary"><section class="card"><span>Tổng 7 ngày</span><strong>${liters(stats.total)} <small>lít</small></strong></section><section class="card"><span>Ngày đạt mục tiêu</span><strong>${stats.goals}<small> / 7</small></strong></section><section class="card"><span>Streak dài nhất</span><strong>${Math.max(state.profile.longestStreak, displayStreak(state))}<small> ngày</small></strong></section></div><section class="card weekly-card"><div class="section-label"><h2>7 ngày gần nhất</h2><span class="subtle-badge">${stats.activeDays} ngày đã tham gia</span></div>${chart(state)}</section><section class="card full-history"><div class="section-label"><h2>Nhật ký uống nước</h2><span class="caption">${state.logs.length} lần ghi nhận</span></div>${logList(state, true)}</section>`;
}
