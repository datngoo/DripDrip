import { SKINS, ACCESSORIES } from './models.js';
import { petSVG } from './pet-mascot.js';
import { icon, number } from './ui.js';
export function storeView(state) {
  const p = state.profile;
  return `<section class="page-heading"><div><div class="eyebrow">SAME DRIPPY. A LITTLE MORE YOU.</div><h1>Tủ đồ của Drippy</h1><p>Biến những ngày chăm mình thành một chút đáng yêu.</p></div><span class="coin-balance">${icon('coin')} ${number(p.waterCoins)} <small>Water Coins</small></span></section><div class="store-note">${icon('sparkles')} Mỗi ngày đạt mục tiêu nhận 10 xu khi ngày kết thúc. Chăm đều, mặc xinh.</div><div class="section-label store-section"><h2>Một diện mạo mới</h2><span class="caption">Chọn người bạn của hôm nay</span></div><div class="skin-grid">${SKINS.map(
    (s) => {
      const owned = state.ownedSkins.includes(s.id),
        equipped = p.selectedSkinId === s.id;
      return `<article class="card skin-card ${equipped ? 'equipped' : ''}" style="--skin-tint:${s.colors[0]}"><div class="skin-preview">${equipped ? `<span class="equipped-tag">${icon('check')} Đang mặc</span>` : ''}${petSVG({ skinId: s.id, state: 'normal', accessoryId: equipped ? p.selectedAccessoryId : 'none' })}</div><div class="skin-details"><div class="eyebrow">${s.tag}</div><h3>${s.name}</h3><p>${s.description}</p><button class="button ${equipped ? 'soft' : 'secondary'}" data-action="item" data-type="skin" data-id="${s.id}" ${equipped || (!owned && s.cost === null) ? 'disabled' : ''}>${equipped ? icon('check') + ' Đang mặc' : owned ? 'Mặc cho Drippy' : s.cost === null ? icon('lock') + ' Mốc 30 ngày' : icon('coin') + ` ${s.cost} xu · Mở khóa`}</button></div></article>`;
    },
  ).join(
    '',
  )}</div><div class="section-label store-section"><h2>Thêm một chút cá tính</h2><span class="caption">Phụ kiện nhỏ, niềm vui to</span></div><div class="accessory-grid">${ACCESSORIES.map(
    (a) => {
      const owned = state.ownedAccessories.includes(a.id),
        equipped = p.selectedAccessoryId === a.id;
      return `<article class="card accessory-card"><span class="accessory-art">${icon(a.icon)}</span><div><h3>${a.name}</h3><p>${equipped ? 'Đang sử dụng' : owned ? 'Đã sở hữu' : a.cost + ' Water Coins'}</p></div><button class="icon-button ${equipped ? 'selected' : ''}" data-action="item" data-type="accessory" data-id="${a.id}" aria-label="${equipped ? 'Đang dùng' : owned ? 'Dùng' : 'Mua'} ${a.name}" ${equipped ? 'disabled' : ''}>${icon(equipped ? 'check' : owned ? 'arrow' : 'plus')}</button></article>`;
    },
  ).join(
    '',
  )}</div><div class="milestone-strip"><div>${icon('sparkles')}<strong>7 ngày</strong><span>Neonglow Drippy</span></div><div>${icon('cup')}<strong>14 ngày</strong><span>Ống hút Boba</span></div><div>${icon('crown')}<strong>30 ngày</strong><span>Golden Drippy</span></div></div><p class="caption center">Quà cột mốc được mở miễn phí khi chốt ngày. Không có mua hàng bằng tiền thật.</p>`;
}
