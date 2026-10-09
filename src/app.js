import { createState, localDay, SKINS, ACCESSORIES } from './models.js';
import { transact, replaceState, validateBackup } from './storage.js';
import { logWater, removeLog, buyOrEquip, saveSettings } from './actions.js';
import { displayStreak } from './streak-manager.js';
import { progressFor, goalFor, estimatedGoal } from './hydration-engine.js';
import { dashboardView, historyView } from './dashboard-view.js';
import { storeView } from './store-view.js';
import { shareStoryView, createStoryBlob, downloadBlob } from './share-story-view.js';
import { requestNotifications, showReminder, reminderText } from './notification-engine.js';
import { petSVG } from './pet-mascot.js';
import { icon, number, escapeHTML } from './ui.js';
const app = document.querySelector('#app'),
  modal = document.querySelector('#modal'),
  toastElement = document.querySelector('#toast');
modal.addEventListener('close', () => document.body.append(toastElement));
let state,
  page = 'today',
  busy = false,
  storyBlob = null,
  storyRevision = 0,
  toastTimer,
  installPrompt = null,
  readyForOffline = false;
let lastDay = localDay();
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('dripdrip-updates') : null;
const navigation = [
  ['today', 'home', 'Hôm nay'],
  ['history', 'chart', 'Hành trình'],
  ['store', 'bag', 'Tủ đồ'],
  ['wrapped', 'sparkles', 'Water Wrapped'],
];
function render() {
  const p = state.profile;
  app.innerHTML = `<aside class="sidebar"><a class="brand" href="#today" aria-label="DripDrip trang chính"><span class="brand-drop">${icon('drop')}</span>dripdrip<span class="brand-dot">.</span></a><div class="sidebar-caption">YOUR LITTLE WATER BUDDY</div><nav aria-label="Điều hướng chính">${navigation.map(([key, img, label]) => `<button data-action="navigate" data-page="${key}" ${page === key ? 'aria-current="page"' : ''} class="nav-item ${page === key ? 'active' : ''}">${icon(img)}<span>${label}</span>${page === key ? '<i></i>' : ''}</button>`).join('')}</nav><div class="sidebar-bottom"><div class="sidebar-buddy">${petSVG({ state: 'normal' })}<h3>Small sips.<br>Happy you.</h3><p>Mỗi ngày một chút,<br>mình cùng tốt hơn.</p></div><button class="nav-item" data-action="settings">${icon('settings')}<span>Cài đặt</span></button><button class="install-button" data-action="install">${icon('download')} Thêm vào màn hình chính</button></div></aside><div class="app-body"><header class="topbar"><span class="mobile-brand">${icon('drop')} dripdrip.</span><div class="date-label">${new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</div><div class="topbar-right"><span class="connection-status"><i class="${navigator.onLine ? '' : 'offline'}"></i>${navigator.onLine ? 'Lưu trên thiết bị' : 'Đang offline'}</span><button class="counter streak-counter" data-action="streak-info" aria-label="Streak ${displayStreak(state)} ngày">${icon('fire')} ${displayStreak(state)} <span>ngày</span></button><button class="counter coin-counter" data-action="navigate" data-page="store" aria-label="${p.waterCoins} Water Coins">${icon('coin')} ${number(p.waterCoins)}</button><button class="avatar" data-action="settings" aria-label="Mở cài đặt">${escapeHTML(p.name.charAt(0).toUpperCase())}</button></div></header><main id="main" tabindex="-1">${{ today: dashboardView, history: historyView, store: storeView, wrapped: shareStoryView }[page](state)}</main></div><nav class="mobile-nav" aria-label="Điều hướng điện thoại">${navigation.map(([key, img, label]) => `<button class="${page === key ? 'active' : ''}" data-action="navigate" data-page="${key}" ${page === key ? 'aria-current="page"' : ''}>${icon(img)}<span>${key === 'wrapped' ? 'Wrapped' : label}</span></button>`).join('')}</nav>`;
  if (page === 'wrapped') prepareStory();
}
async function prepareStory() {
  const revision = ++storyRevision;
  storyBlob = null;
  try {
    const blob = await createStoryBlob(state);
    if (revision !== storyRevision) return;
    storyBlob = blob;
    const s = document.querySelector('#story-status');
    if (s) s.textContent = 'Ảnh đã sẵn sàng để lưu và chia sẻ.';
  } catch (error) {
    toast(error.message);
  }
}
function toast(message, undoId) {
  clearTimeout(toastTimer);
  const el = toastElement;
  (modal.open ? modal : document.body).append(el);
  el.innerHTML = `<span>${escapeHTML(message)}</span>${undoId ? `<button data-action="undo" data-id="${escapeHTML(undoId)}">Hoàn tác</button>` : ''}`;
  el.classList.add('show');
  toastTimer = setTimeout(() => el.classList.remove('show'), undoId ? 8500 : 5000);
}
function showModal(title, content) {
  document.body.append(toastElement);
  modal.innerHTML = `<div class="modal-header"><h2 id="modal-title">${title}</h2><button class="icon-button" data-action="close" aria-label="Đóng">${icon('close')}</button></div>${content}`;
  if (!modal.open) modal.showModal();
}
async function update(mutator, message) {
  if (busy) return;
  busy = true;
  app.setAttribute('aria-busy', 'true');
  try {
    const response = await transact(mutator);
    state = response.state;
    render();
    channel?.postMessage('changed');
    if (message) toast(message);
    return response.result;
  } catch (error) {
    toast(error.message);
    throw error;
  } finally {
    busy = false;
    app.removeAttribute('aria-busy');
  }
}
function navigate(target) {
  page = navigation.some((n) => n[0] === target) ? target : 'today';
  location.hash = page;
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.querySelector('#main').focus({ preventScroll: true });
}
function settings() {
  const p = state.profile;
  showModal(
    'Một chút về bạn',
    `<form id="settings-form"><p class="modal-intro">Chọn nhịp uống nước phù hợp với bạn. Drippy sẽ đồng hành.</p><label>Tên của bạn<input name="name" maxlength="30" value="${escapeHTML(p.name === 'bạn' ? '' : p.name)}" placeholder="Drippy gọi bạn là gì?" autocomplete="given-name"></label><label>Mục tiêu mỗi ngày <span>ml</span><input type="number" name="goal" min="500" max="8000" step="50" required value="${p.dailyGoalMl}"></label><p class="caption">Nếu hôm nay đã ghi nước, mục tiêu mới áp dụng từ ngày mai. Hôm nay: ${number(goalFor(state))} ml.</p><details class="calculator"><summary>Ước tính mục tiêu theo PRD</summary><p class="caption">Ước tính để tùy chỉnh, không phải chỉ định y tế. Nhu cầu của mỗi người khác nhau.</p><div class="form-grid"><label>Cân nặng (kg)<input id="weight" type="number" min="20" max="300" value="60"></label><label>Vận động (phút)<input id="activity" type="number" min="0" max="300" value="0"></label></div><label class="checkbox-label"><input id="hot" type="checkbox"> Thời tiết nóng / ẩm</label><button type="button" class="button secondary" data-action="calculate">Tính gợi ý</button><p class="caption" id="calculator-result" role="status"></p></details><label>Giọng nhắc nhở<select name="mode"><option value="gentle" ${p.notificationModeRaw === 'gentle' ? 'selected' : ''}>💙 Dịu dàng — Gentle</option><option value="sarcastic" ${p.notificationModeRaw === 'sarcastic' ? 'selected' : ''}>🌵 Cà khịa nhẹ — Sarcastic</option><option value="aesthetic" ${p.notificationModeRaw === 'aesthetic' ? 'selected' : ''}>✨ Chill một chút — Aesthetic</option></select></label><label>Khoảng nhắc khi app đang mở<select name="interval">${[30, 60, 90, 120].map((n) => `<option value="${n}" ${p.reminderMinutes === n ? 'selected' : ''}>${n} phút</option>`).join('')}</select></label><p class="caption">Nhắc trong khoảng 08:00–22:00 khi app mở và chưa đạt mục tiêu. Đóng app sẽ ngừng lịch nhắc; web không có lịch thông báo nền như iOS.</p><button class="button primary full" type="submit">${icon('check')} Lưu tùy chỉnh</button></form><div class="settings-tools"><button class="button secondary full" data-action="notifications">${icon('bell')} ${p.remindersEnabled ? 'Tắt nhắc uống nước' : 'Bật nhắc uống nước'}</button><button class="text-button" data-action="test-reminder">Nghe thử giọng của Drippy</button><div class="form-grid"><button class="button secondary" data-action="backup">${icon('download')} Sao lưu</button><button class="button secondary" data-action="restore">${icon('upload')} Khôi phục</button></div><button class="button secondary full" data-action="install">${icon('plus')} Cài lên màn hình chính</button><p class="caption">Không tài khoản. Không theo dõi. Dữ liệu ở riêng trong trình duyệt này; hãy sao lưu trước khi đổi thiết bị hoặc xóa dữ liệu trình duyệt.</p><button class="text-button danger" data-action="reset-confirm">Xóa toàn bộ dữ liệu trên thiết bị</button></div>`,
  );
}
async function handleAction(button) {
  const action = button.dataset.action;
  if (action === 'navigate') return navigate(button.dataset.page);
  if (action === 'close') return modal.close();
  if (action === 'settings') return settings();
  if (action === 'pet') {
    button.classList.remove('boop');
    void button.offsetWidth;
    button.classList.add('boop');
    navigator.vibrate?.(15);
    return toast(
      [
        'Drippy gửi bạn một cái ôm nước 💙',
        'Chạm một cái, vui cả ngày!',
        'Bạn ở đây là mình vui rồi. 🫧',
      ][Math.floor(Math.random() * 3)],
    );
  }
  if (action === 'log') {
    const before = progressFor(state),
      amount = Number(button.dataset.amount);
    const id = await update((s) => logWater(s, amount));
    if (!id) return;
    if (modal.open) modal.close();
    navigator.vibrate?.(before < 1 && progressFor(state) >= 1 ? [30, 40, 70] : 20);
    toast(
      before < 1 && progressFor(state) >= 1
        ? 'Đạt mục tiêu! 10 xu sẽ được cộng khi chốt ngày.'
        : `Đã ghi ${number(amount)} ml. Drippy cảm ơn bạn!`,
      id,
    );
    return;
  }
  if (action === 'undo') {
    await update((s) => removeLog(s, button.dataset.id), 'Đã hoàn tác lần ghi nước.');
    return;
  }
  if (action === 'delete-log') {
    showModal(
      'Xóa lần ghi nước này?',
      `<p>Tiến độ hôm nay sẽ được tính lại. Những ngày đã chốt không thay đổi.</p><button class="button primary full" data-action="confirm-delete" data-id="${escapeHTML(button.dataset.id)}">Xóa lần ghi này</button>`,
    );
    return;
  }
  if (action === 'confirm-delete') {
    await update((s) => removeLog(s, button.dataset.id), 'Đã xóa lần ghi nước.');
    modal.close();
    return;
  }
  if (action === 'custom') {
    showModal(
      'Một ngụm theo ý bạn',
      `<p class="modal-intro">Chọn lượng nước bạn vừa uống.</p><form id="custom-form"><div class="custom-amount"><input type="number" id="custom-amount" name="amount" min="25" max="2000" step="1" value="250" required aria-label="Lượng nước ml"><span>ml</span></div><input type="range" id="custom-range" min="25" max="2000" step="25" value="250" aria-label="Chọn lượng nước"><div class="range-labels"><span>25 ml</span><span>2.000 ml</span></div><button type="submit" class="button primary full">${icon('plus')} Ghi lại ngụm này</button></form>`,
    );
    return;
  }
  if (action === 'streak-info') {
    showModal(
      'Từng ngày nhỏ, một streak dài',
      `<div class="info-illustration">${icon('fire')}</div><p>Đạt 100% mục tiêu trong ngày để nhận <strong>1 ngày streak và 10 Water Coins</strong>. Xu được cộng một lần sau khi ngày kết thúc, khi app đang mở hoặc vào lần mở tiếp theo.</p><p>Nếu bỏ lỡ một ngày, Streak Freeze tự dùng để giữ chuỗi đang có. Ngày đóng băng không tăng streak và không tặng xu.</p><p>Cứ 7 ngày liên tiếp đạt mục tiêu, bạn nhận 1 Freeze (tối đa 3). Một ngày đóng băng ngắt chuỗi 7 ngày kiếm Freeze, nhưng giữ streak chính.</p><p class="caption">Không cần mở app đúng nửa đêm. Những ngày đã qua được đối soát khi bạn trở lại.</p><button class="button primary full" data-action="close">Mình hiểu rồi</button>`,
    );
    return;
  }
  if (action === 'item') {
    const type = button.dataset.type,
      id = button.dataset.id,
      item = (type === 'skin' ? SKINS : ACCESSORIES).find((i) => i.id === id),
      owned = (type === 'skin' ? state.ownedSkins : state.ownedAccessories).includes(id);
    if (owned) return update((s) => buyOrEquip(s, id, type), 'Diện mạo mới, niềm vui mới!');
    if (state.profile.waterCoins < item.cost)
      return toast(
        `Cần ${item.cost - state.profile.waterCoins} xu nữa. Mỗi ngày đạt mục tiêu nhận 10 xu.`,
      );
    showModal(
      `Mở khóa ${item.name}?`,
      `<p>Dùng <strong>${item.cost} Water Coins</strong> để mở khóa và mặc ngay cho Drippy. Vật phẩm sẽ ở trong tủ đồ của bạn.</p><button class="button primary full" data-action="confirm-buy" data-id="${id}" data-type="${type}">${icon('coin')} Mở khóa · ${item.cost} xu</button>`,
    );
    return;
  }
  if (action === 'confirm-buy') {
    await update(
      (s) => buyOrEquip(s, button.dataset.id, button.dataset.type),
      'Đã mở khóa và trang bị!',
    );
    modal.close();
    return;
  }
  if (action === 'calculate') {
    const amount = estimatedGoal(
      Number(document.querySelector('#weight').value),
      Number(document.querySelector('#activity').value),
      document.querySelector('#hot').checked,
    );
    document.querySelector('#calculator-result').textContent =
      `Công thức PRD: cân nặng × 35 + vận động / 30 × 350 + thời tiết. Kết quả: ${number(amount)} ml. Bạn có thể chỉnh lại trước khi lưu.`;
    if (amount >= 500 && amount <= 8000) document.querySelector('[name="goal"]').value = amount;
    return;
  }
  if (action === 'notifications') {
    if (state.profile.remindersEnabled) {
      await update((s) => {
        s.profile.remindersEnabled = false;
      }, 'Đã tắt lời nhắc.');
      settings();
      return;
    }
    await requestNotifications();
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration)
      throw new Error('Chế độ offline chưa sẵn sàng. Hãy tải lại trang rồi thử lại.');
    await update((s) => {
      s.profile.remindersEnabled = true;
      s.profile.lastReminderAt = Date.now();
    }, 'Đã bật nhắc khi ứng dụng đang mở.');
    settings();
    return;
  }
  if (action === 'test-reminder') {
    const mode =
      document.querySelector('[name="mode"]')?.value || state.profile.notificationModeRaw;
    return toast(reminderText(mode));
  }
  if (action === 'backup') {
    const latest = await transact();
    state = latest.state;
    downloadBlob(
      new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }),
      `dripdrip-backup-${localDay()}.json`,
    );
    return toast('Đã tạo bản sao lưu.');
  }
  if (action === 'restore') {
    document.querySelector('#restore-file').click();
    return;
  }
  if (action === 'reset-confirm') {
    showModal(
      'Xóa dữ liệu DripDrip?',
      `<p>Nhật ký, streak, xu và trang phục trên thiết bị này sẽ bị xóa. Hãy tạo bản sao lưu nếu bạn muốn giữ lại.</p><button class="button secondary full" data-action="backup">${icon('download')} Sao lưu trước</button><button class="button destructive full" data-action="reset">Xóa toàn bộ và bắt đầu lại</button>`,
    );
    return;
  }
  if (action === 'reset') {
    await replaceState(createState());
    state = (await transact()).state;
    modal.close();
    channel?.postMessage('changed');
    navigate('today');
    return toast('Đã bắt đầu hành trình mới.');
  }
  if (action === 'download-story') {
    if (!storyBlob) return toast('Ảnh đang được chuẩn bị, hãy thử lại sau giây lát.');
    downloadBlob(storyBlob, `DripDrip-Wrapped-${localDay()}.png`);
    return toast('Story đã sẵn sàng trong phần tải xuống.');
  }
  if (action === 'share-story') {
    if (!storyBlob) return toast('Ảnh đang được chuẩn bị, hãy thử lại sau giây lát.');
    const file = new File([storyBlob], 'DripDrip-Wrapped.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'My Water Wrapped' });
      } catch (e) {
        if (e.name !== 'AbortError') throw e;
      }
    } else {
      downloadBlob(storyBlob, `DripDrip-Wrapped-${localDay()}.png`);
      toast('Trình duyệt không chia sẻ ảnh trực tiếp. Đã tải ảnh để bạn đăng story.');
    }
    return;
  }
  if (action === 'install') {
    if (installPrompt) {
      await installPrompt.prompt();
      installPrompt = null;
      return;
    }
    showModal(
      'Mang Drippy theo bạn',
      `<div class="install-pet">${petSVG({ state: 'normal' })}</div><p><strong>iPhone / iPad:</strong> mở bằng Safari → Chia sẻ → Thêm vào Màn hình chính.</p><p><strong>Android / máy tính:</strong> mở menu trình duyệt → Cài đặt ứng dụng hoặc Thêm vào màn hình chính.</p><p class="caption">${readyForOffline ? 'Tài nguyên đã được lưu để dùng offline.' : 'Hãy mở app một lần khi có mạng để chuẩn bị chế độ offline.'} Nút ghi nhanh thay cho widget iOS trong phiên bản web này.</p><button class="button primary full" data-action="close">Mình hiểu rồi</button>`,
    );
    return;
  }
}
document.addEventListener('click', (event) => {
  const b = event.target.closest('[data-action]');
  if (b && !b.disabled) handleAction(b).catch((error) => toast(error.message));
});
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    const rect = modal.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    )
      modal.close();
  }
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'custom-range')
    document.querySelector('#custom-amount').value = e.target.value;
  if (e.target.id === 'custom-amount')
    document.querySelector('#custom-range').value = e.target.value;
});
document.addEventListener('submit', async (event) => {
  if (!['custom-form', 'settings-form'].includes(event.target.id)) return;
  event.preventDefault();
  if (busy) return;
  try {
    const form = new FormData(event.target);
    if (event.target.id === 'custom-form') {
      const amount = Number(form.get('amount')),
        id = await update((s) => logWater(s, amount));
      modal.close();
      if (id) toast(`Đã ghi ${number(amount)} ml.`, id);
      navigator.vibrate?.(20);
    } else {
      await update(
        (s) =>
          saveSettings(s, {
            name: form.get('name'),
            dailyGoalMl: Number(form.get('goal')),
            notificationModeRaw: form.get('mode'),
            reminderMinutes: Number(form.get('interval')),
          }),
        'Đã lưu tùy chỉnh.',
      );
      modal.close();
    }
  } catch (error) {
    toast(error.message);
  }
});
document.querySelector('#restore-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    if (file.size > 20_000_000) throw new Error('Tệp sao lưu vượt giới hạn 20 MB.');
    const imported = validateBackup(JSON.parse(await file.text()));
    showModal(
      'Khôi phục bản sao lưu?',
      `<p>Bản sao lưu có <strong>${imported.logs.length} lần ghi nước</strong>. Khôi phục sẽ thay toàn bộ dữ liệu hiện tại trên thiết bị này.</p><button class="button secondary full" data-action="backup">Sao lưu dữ liệu hiện tại</button><button class="button primary full" id="confirm-restore">Khôi phục dữ liệu</button>`,
    );
    document.querySelector('#confirm-restore').addEventListener(
      'click',
      async () => {
        try {
          await replaceState(imported);
          state = (await transact()).state;
          channel?.postMessage('changed');
          modal.close();
          render();
          toast('Đã khôi phục bản sao lưu.');
        } catch (error) {
          toast(error.message);
        }
      },
      { once: true },
    );
  } catch (error) {
    toast(error instanceof SyntaxError ? 'Tệp JSON không hợp lệ.' : error.message);
  }
});
async function refresh() {
  if (!state || busy) return;
  try {
    state = (await transact()).state;
    render();
    lastDay = localDay();
  } catch (error) {
    toast(error.message);
  }
}
if (channel) channel.onmessage = () => refresh();
window.addEventListener('hashchange', () => {
  const target = location.hash.slice(1);
  if (target !== page) navigate(target);
});
window.addEventListener('online', () => {
  if (state) render();
});
window.addEventListener('offline', () => {
  if (state) render();
});
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refresh();
});
setInterval(async () => {
  if (!state || busy) return;
  if (localDay() !== lastDay) await refresh();
  const p = state.profile,
    hour = new Date().getHours();
  if (
    document.visibilityState !== 'visible' ||
    !p.remindersEnabled ||
    hour < 8 ||
    hour >= 22 ||
    progressFor(state) >= 1 ||
    Date.now() - p.lastReminderAt < p.reminderMinutes * 60000
  )
    return;
  try {
    const { state: latest, result: claimed } = await transact((s) => {
      if (Date.now() - s.profile.lastReminderAt < s.profile.reminderMinutes * 60000) return false;
      s.profile.lastReminderAt = Date.now();
      return true;
    });
    state = latest;
    if (claimed) {
      channel?.postMessage('changed');
      await showReminder(p.notificationModeRaw);
    }
  } catch {
    /* Foreground reminder failures never prevent logging. */
  }
}, 30000);
try {
  state = (await transact()).state;
  const initialHash = location.hash.slice(1);
  page = navigation.some((n) => n[0] === initialHash) ? initialHash : 'today';
  render();
  // A shortcut opens a confirmation control, avoiding repeat logs on refresh or link previews.
  if (new URLSearchParams(location.search).get('quick') === '200')
    showModal(
      'Ghi nhanh một ly nước',
      `<p>Bạn vừa uống 200 ml? Chạm để ghi nhận.</p><button class="button primary full" data-action="log" data-amount="200">${icon('plus')} Ghi 200 ml</button><button class="text-button" data-action="close">Đóng</button>`,
    );
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
      await navigator.serviceWorker.ready;
      readyForOffline = true;
    } catch {
      toast('Chưa lưu được chế độ offline. Bạn vẫn có thể ghi nước khi đang mở trang.');
    }
  }
} catch (error) {
  app.innerHTML = `<div class="loading-screen"><h1>Drippy chưa mở được bộ nhớ</h1><p>${escapeHTML(error.message)}</p><p>Hãy cho phép lưu dữ liệu trang web rồi tải lại.</p><button class="button primary" id="retry">Thử lại</button></div>`;
  document.querySelector('#retry').onclick = () => location.reload();
}
