import { SKINS } from './models.js';
let sequence = 0;
export function petSVG({
  skinId = 'ocean',
  accessoryId = 'none',
  state = 'normal',
  exporting = false,
} = {}) {
  const skin = SKINS.find((s) => s.id === skinId) || SKINS[0],
    id = `pet${sequence++}`;
  const sleepy = state === 'dehydrated',
    thirsty = state === 'thirsty',
    happy = state === 'hydrated',
    over = state === 'overHydrated';
  const eyes = sleepy
    ? '<path d="m107 171 15 2m36 0 15-2" stroke="#23547a" stroke-width="6" stroke-linecap="round"/>'
    : `<ellipse cx="117" cy="169" rx="${happy ? 7 : 9}" ry="${happy ? 9 : 13}" fill="#20486b"/><ellipse cx="163" cy="169" rx="${happy ? 7 : 9}" ry="${happy ? 9 : 13}" fill="#20486b"/><circle cx="119" cy="165" r="3" fill="white"/><circle cx="165" cy="165" r="3" fill="white"/>`;
  let extras = '';
  if (skinId === 'dragon')
    extras +=
      '<path d="m80 131-28-23 9 50m137-27 28-23-9 50" fill="#79d2a3" stroke="#38a877" stroke-width="3"/><path d="m115 72 6-25 13 15m16 14 18-15-1 31" fill="#d7f6ad"/>';
  if (skinId === 'cloud')
    extras +=
      '<g fill="white" opacity=".55"><ellipse cx="94" cy="120" rx="26" ry="19"/><ellipse cx="109" cy="112" rx="20" ry="16"/></g>';
  if (accessoryId === 'crown' || happy || skinId === 'gold')
    extras +=
      '<path d="m116 61-5-26 20 11 10-23 11 23 19-11-5 26Z" fill="#ffd566" stroke="#e8b441" stroke-width="2"/><circle cx="141" cy="47" r="4" fill="#fff2c6"/>';
  if (accessoryId === 'flower')
    extras +=
      '<g transform="translate(189 114)"><g fill="#fff9de" stroke="#e9ddad" stroke-width="1"><ellipse cy="-10" rx="7" ry="11"/><ellipse cx="10" rx="11" ry="7"/><ellipse cy="10" rx="7" ry="11"/><ellipse cx="-10" rx="11" ry="7"/></g><circle r="6" fill="#efc95b"/></g>';
  if (thirsty && accessoryId !== 'boba')
    extras +=
      '<g transform="translate(189 203) rotate(9)"><path d="m0-18 4 31h23l4-31Z" fill="#eaf7ff" fill-opacity=".7" stroke="#79a9c9" stroke-width="2"/><path d="M9 7h13" stroke="#a9d6f0" stroke-width="2"/></g>';
  if (sleepy)
    extras +=
      '<path d="m85 205 6 4-4 8 7 4m82-104-4 10 6 6-5 8" stroke="#5b9bc4" stroke-opacity=".45" stroke-width="2" fill="none" stroke-linecap="round"/>';
  if (accessoryId === 'boba')
    extras +=
      '<g transform="translate(186 204) rotate(12)"><path d="m0-20 4 35h25l4-35Z" fill="#e6c29d" stroke="#916748" stroke-width="2"/><path d="M16-10v-27l10-7" fill="none" stroke="#87606d" stroke-width="6"/><g fill="#735064"><circle cx="10" cy="7" r="3"/><circle cx="20" cy="9" r="3"/><circle cx="16" cy="0" r="3"/></g></g>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 290" class="pet-svg ${exporting ? '' : `state-${state}`}" role="img" aria-label="Drippy, người bạn giọt nước">
    <defs><linearGradient id="${id}" x1=".3" y1="0" x2=".7" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="${skin.colors[0]}"/><stop offset=".52" stop-color="${skin.colors[1]}"/><stop offset="1" stop-color="${skin.colors[2]}"/></linearGradient><radialGradient id="${id}shine"><stop stop-color="white" stop-opacity=".75"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient></defs>
    <ellipse class="pet-shadow" cx="140" cy="271" rx="68" ry="9" fill="#7db4d4" opacity=".2"/>
    <g class="pet-body" transform="${sleepy ? 'translate(0 34) scale(1 .85)' : over ? 'translate(-7 0) scale(1.05 1)' : ''}">
      <path d="M87 197q-28-2-33 17M193 196q28-1 33-17" fill="none" stroke="${skin.colors[1]}" stroke-width="13" stroke-linecap="round"/>
      <ellipse cx="109" cy="249" rx="17" ry="8" fill="${skin.colors[2]}"/><ellipse cx="171" cy="249" rx="17" ry="8" fill="${skin.colors[2]}"/>
      <path d="M140 59C126 86 62 121 62 184c0 47 33 71 78 71s78-24 78-71c0-54-56-100-78-125Z" fill="url(#${id})" stroke="${skin.colors[2]}" stroke-opacity=".2" stroke-width="2"/>
      <ellipse cx="111" cy="130" rx="42" ry="40" fill="url(#${id}shine)"/><path d="M91 136q7-14 17-20" stroke="white" stroke-width="8" opacity=".64" fill="none" stroke-linecap="round"/>
      <ellipse cx="96" cy="190" rx="13" ry="7" fill="#f5a9b8" opacity=".63"/><ellipse cx="185" cy="190" rx="13" ry="7" fill="#f5a9b8" opacity=".63"/>
      ${eyes}
      ${sleepy || thirsty ? '<path d="M131 198q9-8 18 0" fill="none" stroke="#23547a" stroke-width="3.5" stroke-linecap="round"/>' : over ? '<ellipse cx="140" cy="197" rx="7" ry="9" fill="#23547a"/>' : '<path d="M128 191q12 19 24 0Z" fill="#23547a"/><path d="M133 198q7-4 14 0" stroke="#f3a8b4" stroke-width="4"/>'}
      ${extras}
    </g></svg>`;
}
