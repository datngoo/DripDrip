export const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export const number = (value) => new Intl.NumberFormat('vi-VN').format(value);
export const liters = (value) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value / 1000);
const paths = {
  drop: '<path d="M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12Z"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  chart: '<path d="M4 3v17h17M8 15v-4m5 4V7m5 8V4"/>',
  bag: '<rect x="4" y="7" width="16" height="14" rx="3"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
  sparkles: '<path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4ZM20 2v4m-2-2h4"/>',
  settings:
    '<path d="m10 3-1 3-3 1-3 3 2 2-1 4 3 3 3-1 2 3 4-1 1-3 3-1 1-4-3-2 1-3-3-3-3 1Z"/><circle cx="12" cy="12" r="3"/>',
  fire: '<path d="M13 2c1 6-6 6-4 11 2 1 4-1 4-3 5 4 7 6 4 10-2 3-8 3-11 0-5-6 0-11 2-12-1 4 3 1 5-6Z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 9v6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  cup: '<path d="m5 5 2 16h10l2-16ZM4 5h16M14 5l2-3h4"/>',
  bottle: '<path d="M9 3h6v4l3 3v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V10l3-3ZM9 14h6"/>',
  glass: '<path d="m5 3 2 18h10l2-18ZM6 11h12"/>',
  dial: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
  snow: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M3 11l4-1-1-4m12 12-1-4 4-1M3 13l4 1-1 4m12-12-1 4 4 1"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 8-3 8-3 9h18c0-1-3-1-3-9M9 21h6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  share: '<path d="M12 16V3m-4 4 4-4 4 4M7 10H4v11h16V10h-3"/>',
  flower:
    '<path d="M12 8c-8-12-14 2-5 4-11 5 1 15 5 4 4 11 16 1 5-4 9-2 3-16-5-4Z"/><circle cx="12" cy="12" r="2"/>',
  crown: '<path d="m3 6 5 5 4-8 4 8 5-5-2 14H5ZM5 16h14"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  heart: '<path d="M20 4c-3-3-7-1-8 2-1-3-5-5-8-2-6 6 8 16 8 16S26 10 20 4Z"/>',
  wifi: '<path d="M3 8a14 14 0 0 1 18 0M6 12a9 9 0 0 1 12 0M9 16a4 4 0 0 1 6 0M12 20h.01"/>',
  leaf: '<path d="M20 3C5 2 0 15 8 19s13-4 12-16ZM5 22 16 9"/>',
};
export const icon = (name, cls = '') =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.drop}</svg>`;
export const emptyState = (heading, body) =>
  `<div class="empty-state">${icon('drop')}<h3>${heading}</h3><p>${body}</p></div>`;
