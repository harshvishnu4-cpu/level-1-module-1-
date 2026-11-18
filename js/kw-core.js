/* Communicate · Segment 1: code shared by reading.html (Stage 5) and quick-check.html (Stage 8).
   Plain script (no modules): its top-level names are shared with the stage script loaded after it.
   Copied from index.html (Stage 4 + the learning path), which keeps its own copy. */
/* =========================================================
   Helpers
   ========================================================= */
const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (RM) gsap.globalTimeline.timeScale(5);
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const shuffle = list => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const announce = msg => { const l = $('#live'); l.textContent = ''; requestAnimationFrame(() => { l.textContent = msg; }); };
const shake = (els, amp = 7) => gsap.to(els, { keyframes: { x: [0, -amp, amp, -amp * .7, amp * .7, -amp * .3, 0] }, duration: .45, ease: 'none' });

/* =========================================================
   UI icons
   ========================================================= */
const STAR_PATH = 'M12 2.6l2.85 5.95 6.5.85-4.75 4.5 1.2 6.45L12 17.25 6.2 20.35l1.2-6.45L2.65 9.4l6.5-.85z';
const UI = {
  back: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  speaker: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9.5v5h3.6L12.5 19V5L7.6 9.5z" fill="currentColor"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
  checkBig: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
  star: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_PATH}" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  clock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  doorIn: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="13" y="3" width="8" height="18" rx="1.5"/><path d="M2 12h8M7 8.5l3.5 3.5L7 15.5"/></svg>',
  doorOut: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="8" height="18" rx="1.5"/><path d="M13 12h9M18.5 8.5L22 12l-3.5 3.5"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" fill="#FFD55C"/><path d="M9.5 19h5M10.5 22h3"/></svg>',
  moon: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1z" fill="#8B7CF6"/></svg>',
  mic: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"/></svg>',
  replay: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" stroke="#C98A00" stroke-width="2"/><path d="M8 4h8v5a4 4 0 0 1-8 0z" fill="#FFC21A" stroke="#C98A00" stroke-width="2"/><path d="M12 13v3" stroke="#C98A00" stroke-width="2"/><path d="M9 20h6l-1-4h-4z" fill="#FFC21A" stroke="#C98A00" stroke-width="2"/></svg>',
  trophyBig: '<svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" stroke="#C98A00" stroke-width="1.8"/><path d="M8 4h8v5a4 4 0 0 1-8 0z" fill="#FFC21A" stroke="#C98A00" stroke-width="1.8"/><path d="M12 13v3" stroke="#C98A00" stroke-width="1.8"/><path d="M9 20h6l-1-4h-4z" fill="#FFC21A" stroke="#C98A00" stroke-width="1.8"/></svg>',
  hourglass: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#B07A00" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12M6 21h12"/><path d="M7.5 3v2.5c0 2.6 4.5 4 4.5 6.5s-4.5 3.9-4.5 6.5V21M16.5 3v2.5c0 2.6-4.5 4-4.5 6.5s4.5 3.9 4.5 6.5V21"/><path d="M9 20.2h6c-.4-1.8-1.6-2.8-3-3.4-1.4.6-2.6 1.6-3 3.4z" fill="#FFC21A" stroke="none"/></svg>',
  grid: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',
  chat: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9l-4.5 3.5V16.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"/><path d="M7.5 10h9M7.5 13h6" stroke-linecap="round"/></svg>',
  checkCircle: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#14805A"/><path d="M8 12.3l2.7 2.7L16 9.6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  done: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#14805A"/><path d="M7.5 12.4l3 3L16.6 9.3" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  pad: '<svg viewBox="0 0 32 24" width="36" height="27" aria-hidden="true"><path d="M9 3h14a8 8 0 0 1 8 8v2a6 6 0 0 1-10.6 3.9L19 15h-6l-1.4 1.9A6 6 0 0 1 1 13v-2a8 8 0 0 1 8-8z" fill="#E8476F"/><path d="M9 8v6M6 11h6" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="22" cy="9.5" r="1.9" fill="#fff"/><circle cx="25.6" cy="13" r="1.9" fill="#fff"/></svg>',
  cardBack: '<svg viewBox="0 0 48 44" aria-hidden="true"><path d="M8 3h32a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H22l-9 8v-8H8a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6z" fill="#fff"/><text x="24" y="26.5" text-anchor="middle" font-family="Roboto, system-ui, sans-serif" font-weight="700" font-size="20" fill="#1F2540">?</text></svg>'
};

/* =========================================================
   Illustration kit (flat SVG, drawn in code)
   ========================================================= */
const r1 = n => Math.round(n * 10) / 10;
const rays = (cx, cy, a, b, angles) => angles.map(d => { const t = d * Math.PI / 180; return `<path d="M${r1(cx + a * Math.cos(t))} ${r1(cy - a * Math.sin(t))}L${r1(cx + b * Math.cos(t))} ${r1(cy - b * Math.sin(t))}"/>`; }).join('');
const sparkle = (cx, cy, s) => `M${cx} ${cy - s}Q${cx} ${cy} ${cx + s} ${cy}Q${cx} ${cy} ${cx} ${cy + s}Q${cx} ${cy} ${cx - s} ${cy}Q${cx} ${cy} ${cx} ${cy - s}Z`;
const stars = (pts, r) => pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? r * .7 : r}" fill="#FFF6D0"/>`).join('');
const CRESCENT = 'M51.4 28.3A34 34 0 1 0 87.5 74.8A30 30 0 0 1 51.4 28.3Z';

/* Lighten (amt > 0) or darken (amt < 0) a #rrggbb colour */
const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  return '#' + [n >> 16, (n >> 8) & 255, n & 255]
    .map(c => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt))
    .map(c => c.toString(16).padStart(2, '0')).join('');
};

/* An adult, feet at (x,y), about 115 units tall (head ~1/7 of height), facing right when face = 1.
   style:  short | bun | long | braid          outfit: shirt | blazer | polo | kurta
   extras: lanyard (ID card), bag ('laptop' | 'tote' | 'pack'), wave, look (head turned back)
   Animation hooks: .leg (x2), .arm-f / .arm-b (hanging arms), .arm-w (raised arm; data-origin, data-dir) */
function person(o) {
  const { x = 0, y = 0, s = 1, face = 1, skin = '#B9774F', top = '#DCE3EC', bottom = '#2B3245', hair = '#231A15',
          style = 'short', outfit = 'shirt', jacket = '#334155', trim = null, wave = false, look = false,
          bag = null, bagType = 'laptop', lanyard = null, stride = 0, shoe = '#1E1E24' } = o;
  const ink = '#1B1B22';
  const skinD = shade(skin, -.16), topD = shade(top, -.14), botD = shade(bottom, -.3), hairL = shade(hair, .35);
  const sleeveCol = outfit === 'blazer' ? jacket : top;
  const sleeveColD = shade(sleeveCol, -.16);
  // where the sleeve ends on a hanging arm (y); full sleeves cover the forearm
  const sleeveEnd = { shirt: -56, blazer: -56, polo: -74, kurta: -63 }[outfit] ?? -60;

  const leg = (hx, deg, col) => `<g class="leg"${deg ? ` transform="rotate(${deg} ${hx} -54)"` : ''}><path d="M${hx} -54V-6.5" stroke="${col}" stroke-width="8.5" stroke-linecap="round"/><path d="M${hx - 4} -1Q${hx - 4} -6.8 ${hx + 1} -6.8Q${hx + 7.5} -6.8 ${hx + 8.5} -2.6V0H${hx - 4}Z" fill="${shoe}"/></g>`;
  const armHang = (cls, sx, sk, sl) => {
    const d = sx < 0 ? -1 : 1, wx = sx + 1.8 * d;
    return `<g class="${cls}"><path d="M${sx} -84L${wx} -54" stroke="${sk}" stroke-width="5.6" stroke-linecap="round"/><path d="M${sx} -85L${sx + .9 * d} ${sleeveEnd}" stroke="${sl}" stroke-width="8" stroke-linecap="round"/><circle cx="${wx + .2 * d}" cy="-51.5" r="3.6" fill="${sk}"/></g>`;
  };
  const armUp = (side, sk, sl) => {
    const m = v => v * side;
    const sleeve = outfit === 'polo' ? `M${m(5)} -86L${m(10)} -88.5` : outfit === 'kurta' ? `M${m(5)} -86L${m(17)} -91L${m(18.5)} -96` : `M${m(5)} -86L${m(17)} -91L${m(20.3)} -102`;
    return `<g class="arm-w" data-dir="${side}" data-origin="${side > 0 ? '0% 100%' : '100% 100%'}"><path d="M${m(5)} -85L${m(17)} -91L${m(21)} -104" stroke="${sk}" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="${sleeve}" stroke="${sl}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><ellipse cx="${m(21.6)}" cy="-107" rx="3.6" ry="4.3" fill="${sk}"/><ellipse cx="${m(18.6)}" cy="-105.4" rx="1.4" ry="2.4" transform="rotate(${-30 * side} ${m(18.6)} -105.4)" fill="${sk}"/></g>`;
  };

  /* Lower body: trousers block joining the legs */
  const hips = `<path d="M-12 -56H12.5L12 -47H-11.5Z" fill="${bottom}"/><path d="M-12 -56H-3L-3.5 -47H-11.5Z" fill="${botD}"/>`;
  /* Upper body */
  const TORSO = 'M-9.5 -88C-13 -88 -14 -85.5 -14 -82L-12.5 -53H13L14.5 -82C14.5 -85.5 13.5 -88 9.5 -88Z';
  const TORSO_SH = 'M-9.5 -88C-13 -88 -14 -85.5 -14 -82L-12.5 -53H-4.5L-3 -88Z';
  let body;
  if (outfit === 'kurta') {
    const t = trim || shade(top, .35);
    body = `<path d="M-9.5 -88C-13 -88 -14 -85.5 -14 -82L-15.5 -36H16L14.5 -82C14.5 -85.5 13.5 -88 9.5 -88Z" fill="${top}"/><path d="M-9.5 -88C-13 -88 -14 -85.5 -14 -82L-15.5 -36H-6L-3 -88Z" fill="${topD}"/><path d="M-1.5 -88L1.5 -80L4.5 -88" stroke="${t}" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M1.5 -80V-70" stroke="${t}" stroke-width="1.2"/><path d="M-15.3 -39H15.8" stroke="${t}" stroke-width="1.6"/><path d="M14.6 -46L15.4 -36" stroke="${topD}" stroke-width="1.2"/>`;
  } else if (outfit === 'polo') {
    body = `<path d="${TORSO}" fill="${top}"/><path d="${TORSO_SH}" fill="${topD}"/><path d="M-3 -88.5L1 -84L5 -88.5L3.5 -90H-1.5Z" fill="${shade(top, .25)}"/><path d="M1 -84V-78" stroke="${topD}" stroke-width="1.2"/><circle cx="1" cy="-80.5" r=".8" fill="${topD}"/><path d="M-12.6 -55H13.1" stroke="${botD}" stroke-width="2.4"/>`;
  } else {
    // shirt (and the shirt under a blazer)
    body = `<path d="${TORSO}" fill="${top}"/><path d="${TORSO_SH}" fill="${topD}"/><path d="M-2.5 -89L1 -83L4.5 -89" fill="${shade(top, .3)}" stroke="${topD}" stroke-width="1"/><path d="M1 -83V-56" stroke="${topD}" stroke-width=".9"/><path d="M-12.6 -55H13.1" stroke="${shade(bottom, -.45)}" stroke-width="2.4"/>`;
    if (outfit === 'blazer') {
      const jD = shade(jacket, -.2);
      body += `<path d="M-9.5 -88C-13 -88 -14.2 -85.5 -14.2 -82L-13.4 -50H-1L1 -76L-2.5 -88Z" fill="${jacket}"/><path d="M-9.5 -88C-13 -88 -14.2 -85.5 -14.2 -82L-13.4 -50H-5.5L-4.5 -88Z" fill="${jD}"/><path d="M4.5 -88L14.5 -82L13.6 -50H6L4 -76Z" fill="${jacket}"/><path d="M-2.5 -88L1 -76L-1 -72M4.5 -88L4 -76L6 -72" stroke="${jD}" stroke-width="1" fill="none"/>`;
    }
  }
  const lany = lanyard ? `<path d="M-3 -88L1.5 -74L6 -88" stroke="${lanyard}" stroke-width="1.5" fill="none"/><rect x="-1.4" y="-74.5" width="6.4" height="8.4" rx="1" fill="#FFFFFF" stroke="${shade(lanyard, -.2)}" stroke-width=".6"/><rect x="-1.4" y="-74.5" width="6.4" height="2.4" rx="1" fill="${lanyard}"/>` : '';

  /* Bags */
  const bagD = bag ? shade(bag, -.25) : '';
  let bagBehind = '', bagFront = '';
  if (bag && bagType === 'pack') {
    bagBehind = `<rect x="-22" y="-86" width="10.5" height="24" rx="4.5" fill="${bag}"/><rect x="-21" y="-74" width="7.5" height="8.5" rx="2.5" fill="${bagD}"/>`;
    bagFront = `<path d="M-6 -88C2 -90 7 -85 6.5 -73" stroke="${bagD}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  } else if (bag && bagType === 'tote') {
    bagFront = `<path d="M-3 -88C-9 -78 -12 -68 -12.5 -62M-3 -88C-5 -78 -6 -68 -6 -62" stroke="${bagD}" stroke-width="1.8" fill="none"/><path d="M-17 -63H-2L-3.5 -45H-15.5Z" fill="${bag}"/><path d="M-17 -63H-2L-2.4 -59H-16.6Z" fill="${bagD}"/>`;
  } else if (bag) {  // laptop messenger bag
    bagFront = `<path d="M7 -88L-11 -56" stroke="${bagD}" stroke-width="2.2" stroke-linecap="round"/><rect x="-22" y="-60" width="17" height="12.5" rx="2.2" fill="${bag}"/><path d="M-22 -55.5H-5" stroke="${bagD}" stroke-width="1.4"/>`;
  }

  /* Head (facing right) */
  const capShort = 'M-7.6 -97C-9.8 -104 -7 -113.6 2 -113.6C8.6 -113.6 11.8 -109.4 10.6 -104.8C8.6 -107.4 5.6 -108 2.6 -107C1.4 -104 -.6 -101.4 -2.8 -99.6C-4.2 -98.2 -5.8 -96.6 -7.6 -97Z';
  const capLong = 'M-8 -97C-10.4 -105 -7 -114 2 -114C9.2 -114 12 -109 10.8 -103.6C8.6 -107.4 5.2 -108.6 2.8 -108.2C1.4 -104.6 -.8 -101.4 -3.2 -99C-4.6 -97.6 -6.4 -96.4 -8 -97Z';
  const hairBack = style === 'bun' ? `<circle cx="-7.8" cy="-98.6" r="4.6" fill="${hair}"/>`
    : style === 'long' ? `<path d="M-9 -102C-12 -94 -11.5 -86 -8.5 -82L-1.5 -84C-3.5 -88 -4.5 -94 -4 -100Z" fill="${hair}"/>`
    : '';
  const braid = style === 'braid'
    ? [[-8.6, -91.5], [-9.6, -85], [-10.4, -78.6]].map(([bx, by], i) => `<ellipse cx="${bx}" cy="${by}" rx="2.6" ry="3.6" fill="${i % 2 ? shade(hair, .15) : hair}"/>`).join('') + `<path d="M-12 -75.6L-12.6 -71.4L-10.4 -72.8L-8.6 -71.4L-8.8 -75.6Z" fill="${hair}"/>`
    : '';
  const head = `<g${look ? ' transform="scale(-1 1)"' : ''}>${hairBack}<ellipse cx="1.5" cy="-103" rx="8.3" ry="9.3" fill="${skin}"/>`
    + `<path d="${style === 'short' ? capShort : capLong}" fill="${hair}"/>`
    + `<path d="M-3 -111.2Q2 -113 7 -111" stroke="${hairL}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55"/>`
    + `<ellipse cx="-1.6" cy="-101.6" rx="1.9" ry="2.7" fill="${skinD}"/>`
    + `<path d="M4.3 -106.6Q6.2 -107.5 8.1 -106.7" stroke="${shade(hair, -.1)}" stroke-width="1" fill="none" stroke-linecap="round"/>`
    + `<ellipse cx="6.3" cy="-103.4" rx=".95" ry="1.25" fill="${ink}"/>`
    + `<path d="M9.7 -103Q11.1 -100.6 9.5 -99.8" stroke="${shade(skin, -.3)}" stroke-width=".9" fill="none" stroke-linecap="round"/>`
    + `<path d="M5.4 -97.6Q7 -96.9 8.4 -97.8" stroke="#5E2C22" stroke-width=".95" fill="none" stroke-linecap="round"/>`
    + '</g>';

  const raisedBack = wave && look, raisedFront = wave && !look;
  return `<g class="person" transform="translate(${x} ${y}) scale(${face * s} ${s})">`
    + `<ellipse cx="1" cy=".4" rx="13" ry="2.4" fill="#0B0E24" opacity=".16"/>`
    + (raisedBack ? '' : armHang('arm-b', -5, skinD, sleeveColD))
    + bagBehind
    + leg(-3.5, stride, botD) + leg(4, -stride, bottom)
    + hips
    + `<rect x="-2.6" y="-96" width="6.2" height="9" rx="2" fill="${skinD}"/>`
    + body + braid + lany + bagFront + head
    + (raisedBack ? armUp(-1, skinD, sleeveColD) : '')
    + (raisedFront ? armUp(1, skin, sleeveCol) : armHang('arm-f', 5, skin, sleeveCol))
    + '</g>';
}

/* Direction arrow (polygon so GSAP can nudge it with x) */
function arrow(x, y, dir, len = 36, fill = '#FFFFFF') {
  const h = 16, sw = 5.5, hw = 12;
  const pts = [[0, -sw], [len - h, -sw], [len - h, -hw], [len, 0], [len - h, hw], [len - h, sw], [0, sw]]
    .map(([px, py]) => `${x + dir * px},${y + py}`).join(' ');
  return `<polygon class="dir-arrow" data-dir="${dir}" points="${pts}" fill="${fill}" stroke="#1E2240" stroke-width="3" stroke-linejoin="round"/>`;
}

/* ---- Word icons (120 x 120) ---- */
const HAND_SHAPES = '<rect x="38" y="30" width="12" height="44" rx="6"/><rect x="51" y="22" width="12" height="50" rx="6"/><rect x="64" y="26" width="12" height="46" rx="6"/><rect x="77" y="36" width="11" height="38" rx="5.5"/><rect x="38" y="54" width="50" height="44" rx="18"/><rect x="22" y="58" width="13" height="32" rx="6.5" transform="rotate(-40 28.5 74)"/>';
const ICON = {
  sunrise: () => `<svg class="ico" viewBox="0 0 120 120" aria-hidden="true"><g class="i-rays" stroke="#FFAA1A" stroke-width="7" stroke-linecap="round">${rays(60, 84, 40, 52, [160, 125, 90, 55, 20])}</g><path class="i-body" d="M30 84a30 30 0 0 1 60 0z" fill="#FFC93C"/><path d="M6 90Q32 76 60 85T114 86V100Q60 112 6 100z" fill="#7FCF7A"/><path d="M6 98Q60 88 114 98V100Q60 112 6 100z" fill="#5DBB63"/></svg>`,
  sun: () => `<svg class="ico" viewBox="0 0 120 120" aria-hidden="true"><g class="i-rays" stroke="#FFAA1A" stroke-width="7" stroke-linecap="round">${rays(60, 60, 35, 47, [0, 45, 90, 135, 180, 225, 270, 315])}</g><circle class="i-body" cx="60" cy="60" r="26" fill="#FFC93C"/><path d="M47 55a14 14 0 0 1 12-10" stroke="#FFF3C4" stroke-width="5" stroke-linecap="round" fill="none"/></svg>`,
  moon: () => `<svg class="ico" viewBox="0 0 120 120" aria-hidden="true"><g class="i-moon"><path d="${CRESCENT}" fill="#8B7CF6"/><path d="M40 44a26 26 0 0 0 2 30" stroke="#B3A8FF" stroke-width="5" stroke-linecap="round" fill="none"/></g><g class="i-spark" fill="#FFC21A"><path d="${sparkle(90, 34, 10)}"/><path d="${sparkle(100, 62, 6)}"/></g></svg>`,
  walker: () => `<svg class="ico" viewBox="0 0 120 120" aria-hidden="true"><g stroke="#9DC3FF" stroke-width="4" stroke-linecap="round"><path d="M12 66h12"/><path d="M8 80h14"/></g><g class="i-fig">${person({ x: 50, y: 110, s: .84, face: 1, top: '#4F7FD6', bottom: '#1E2240', skin: '#C98B5E', wave: true, look: true, stride: 16 })}</g><g class="i-arrow" fill="none" stroke="#1F66D6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M80 70h24"/><path d="M95 61l9 9-9 9"/></g></svg>`,
  hand: () => `<svg class="ico" viewBox="0 0 120 120" aria-hidden="true"><g class="i-waves" stroke="#3B8CFF" stroke-width="4.5" stroke-linecap="round" fill="none"><path d="M14 26Q6 38 12 50"/><path d="M24 20Q16 32 21 44"/><path d="M100 26Q108 38 102 50"/></g><g class="i-hand"><g transform="rotate(-12 62 70)"><g fill="#E39A55" stroke="#E39A55" stroke-width="6" stroke-linejoin="round">${HAND_SHAPES}</g><g fill="#FFCB91">${HAND_SHAPES}</g><path d="M50 84Q62 91 76 84" stroke="#E39A55" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/></g></g></svg>`,
  calendar: () => {
    let cells = '';
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const today = r === 0 && c === 0, next = r === 0 && c === 1;
      cells += `<rect${next ? ' class="i-next"' : ''} x="${30 + c * 18}" y="${57 + r * 18}" width="14" height="13" rx="3.5" fill="${today ? '#B9C6DD' : next ? '#3B8CFF' : '#DCE8FF'}"/>`;
    }
    return `<svg class="ico" viewBox="0 0 120 120" aria-hidden="true"><rect x="18" y="26" width="76" height="72" rx="13" fill="#fff" stroke="#3B8CFF" stroke-width="5"/><path d="M18 39a13 13 0 0 1 13-13h50a13 13 0 0 1 13 13v9H18z" fill="#3B8CFF"/><rect x="35" y="16" width="8" height="20" rx="4" fill="#1E2240"/><rect x="69" y="16" width="8" height="20" rx="4" fill="#1E2240"/>${cells}<g class="i-badge"><circle cx="90" cy="88" r="19" fill="#1F66D6" stroke="#fff" stroke-width="4"/><path d="M81 88h17M92 82l6 6-6 6" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g></svg>`;
  }
};

/* Small reaction for each icon when its card is tapped / matched */
/* Note: the origin goes in BOTH from- and to-vars. If only the to-vars carry it,
   GSAP's smoothOrigin compensates for the change and the part ends up shifted. */
const WIGGLE = {
  sunrise: s => { gsap.fromTo($('.i-body', s), { y: 14 }, { y: 0, duration: .6, ease: 'back.out(1.6)' }); gsap.fromTo($('.i-rays', s), { scale: .5, opacity: 0, svgOrigin: '60 84' }, { scale: 1, opacity: 1, duration: .6, delay: .12, ease: 'back.out(2)', svgOrigin: '60 84' }); },
  sun: s => { gsap.fromTo($('.i-rays', s), { rotation: 0, svgOrigin: '60 60' }, { rotation: 45, duration: .9, ease: 'power3.out', svgOrigin: '60 60' }); gsap.fromTo($('.i-body', s), { scale: .8, svgOrigin: '60 60' }, { scale: 1, duration: .7, ease: 'elastic.out(1,.4)', svgOrigin: '60 60' }); },
  moon: s => { gsap.fromTo($('.i-moon', s), { rotation: -18, svgOrigin: '60 62' }, { rotation: 0, duration: .9, ease: 'elastic.out(1,.45)', svgOrigin: '60 62' }); gsap.fromTo($$('.i-spark path', s), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: .5, stagger: .12, ease: 'back.out(3)', transformOrigin: '50% 50%' }); },
  walker: s => { gsap.fromTo($('.i-fig', s), { x: -10 }, { x: 0, duration: .6, ease: 'power2.out' }); const arm = $('.arm-w', s); if (arm) { const o = arm.dataset.origin, d = Number(arm.dataset.dir); gsap.fromTo(arm, { rotation: 0, transformOrigin: o }, { rotation: 18 * d, duration: .18, repeat: 5, yoyo: true, ease: 'sine.inOut', transformOrigin: o }); } gsap.fromTo($('.i-arrow', s), { x: -8, opacity: .3 }, { x: 0, opacity: 1, duration: .5, ease: 'power2.out' }); },
  hand: s => { gsap.fromTo($('.i-hand', s), { rotation: 0, svgOrigin: '62 100' }, { keyframes: { rotation: [0, 18, -12, 14, -6, 0] }, duration: 1, ease: 'sine.inOut', svgOrigin: '62 100' }); gsap.fromTo($$('.i-waves path', s), { opacity: 0, scale: .6, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .4, stagger: .08, transformOrigin: '50% 50%' }); },
  calendar: s => { gsap.fromTo($('.i-badge', s), { scale: .3, rotation: -60, svgOrigin: '90 88' }, { scale: 1, rotation: 0, duration: .6, ease: 'back.out(2.5)', svgOrigin: '90 88' }); gsap.fromTo($('.i-next', s), { scale: .4, transformOrigin: '50% 50%' }, { scale: 1, duration: .6, ease: 'elastic.out(1,.4)', transformOrigin: '50% 50%' }); }
};

/* ---- Scenario scenes (320 x 200) ---- */
const cloud = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity=".92"><ellipse cx="0" cy="0" rx="16" ry="11"/><ellipse cx="16" cy="-6" rx="15" ry="13"/><ellipse cx="32" cy="1" rx="13" ry="10"/><rect x="-8" y="0" width="48" height="10" rx="5"/></g>`;
function sky(t) {
  let s = `<rect width="320" height="200" fill="url(#g-sky-${t})"/>`;
  if (t === 'morning') s += `<circle cx="64" cy="152" r="44" fill="#FFD34D" opacity=".28"/><circle cx="64" cy="152" r="30" fill="#FFD34D"/>${cloud(118, 34)}${cloud(22, 54, .7)}`;
  if (t === 'afternoon') s += `<circle cx="300" cy="28" r="30" fill="#FFE27A" opacity=".35"/><circle cx="300" cy="28" r="18" fill="#FFD34D"/>${cloud(58, 40)}${cloud(150, 24, .8)}`;
  if (t === 'evening') s += `<circle cx="48" cy="156" r="42" fill="#FFB36B" opacity=".3"/><circle cx="48" cy="156" r="28" fill="#FFB36B"/>${stars([[120, 24], [196, 16], [262, 34], [88, 50]], 1.5)}`;
  if (t === 'night') s += `<g transform="translate(262 44) scale(.55) translate(-62 -55)"><path d="${CRESCENT}" fill="#F4EBC1"/></g>${stars([[40, 30], [90, 18], [140, 40], [190, 22], [222, 66], [300, 22], [70, 64], [116, 80]], 1.8)}`;
  return s;
}
function ground(t) {
  const c = { morning: '#8FD17E', afternoon: '#7CC86B', evening: '#4E4880', night: '#232A57' }[t];
  const p = { morning: '#C9EBB9', afternoon: '#BFE6AE', evening: '#665E9A', night: '#343C70' }[t];
  return `<rect y="164" width="320" height="36" fill="${c}"/><rect y="174" width="320" height="14" fill="${p}" opacity=".75"/>`;
}
function office(x, y, { lit = false, label = 'OFFICE' } = {}) {
  let wins = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) wins += `<rect x="${10 + c * 27}" y="${12 + r * 20}" width="20" height="13" rx="1" fill="${lit && (r + c) % 3 ? '#FFD98A' : lit ? '#6B7393' : '#A9C3E3'}"/>`;
  return `<g transform="translate(${x} ${y})"><rect x="34" y="-17" width="56" height="12" rx="2" fill="#334155"/><text x="62" y="-8.4" text-anchor="middle" font-family="Roboto, system-ui, sans-serif" font-weight="600" font-size="${label.length > 6 ? 7 : 8}" letter-spacing="1.4" fill="#fff">${label}</text><rect x="-3" y="-5" width="130" height="7" fill="#C2CAD6"/><rect x="0" y="0" width="124" height="104" fill="${lit ? '#C9CFDC' : '#E4E8EF'}"/>${wins}<rect x="40" y="74" width="44" height="5" fill="#475569"/><rect x="45" y="79" width="34" height="25" fill="${lit ? '#E9C77A' : '#5D7690'}"/><path d="M62 79V104" stroke="${lit ? '#C9CFDC' : '#E4E8EF'}" stroke-width="1.6"/></g>`;
}
function stall(x, y) {
  let stripes = '', scallops = '';
  for (let i = 0; i < 6; i++) {
    const col = i % 2 ? '#FFFFFF' : '#FF6B6B';
    stripes += `<rect x="${-4 + i * 22}" y="6" width="22" height="20" fill="${col}"/>`;
    scallops += `<circle cx="${7 + i * 22}" cy="26" r="11" fill="${col}"/>`;
  }
  return `<g transform="translate(${x} ${y})"><rect x="6" y="20" width="6" height="68" fill="#7A4E2D"/><rect x="112" y="20" width="6" height="68" fill="#7A4E2D"/><path d="M48 72Q48 56 62 56Q76 56 76 72Z" fill="#7C5CFF"/><circle cx="62" cy="48" r="9" fill="#A86A45"/><path d="M53 47Q53 38 62 38Q71 38 71 46Q66 42 60 43Q56 44 53 47Z" fill="#1E1B2E"/><rect x="0" y="60" width="124" height="28" rx="4" fill="#B5713F"/><rect x="0" y="60" width="124" height="6" fill="#9A5C30"/><g fill="#FF9E3D"><circle cx="16" cy="56" r="6.5"/><circle cx="29" cy="56" r="6.5"/><circle cx="22" cy="47" r="6.5"/></g><g fill="#5CC46B"><circle cx="95" cy="56" r="6.5"/><circle cx="108" cy="56" r="6.5"/><circle cx="101" cy="47" r="6.5"/></g>${scallops}${stripes}<rect x="-6" y="2" width="136" height="6" rx="3" fill="#D9474F"/></g>`;
}
function house(x, y, lit = true) {
  const win = lit ? '#FFD66B' : '#BFD9F2', glow = lit ? '<circle cx="23" cy="60" r="22" fill="url(#g-glow)"/><circle cx="89" cy="60" r="22" fill="url(#g-glow)"/>' : '';
  return `<g transform="translate(${x} ${y})"><rect x="82" y="6" width="12" height="26" fill="#9C4B3C"/>${glow}<rect x="0" y="36" width="112" height="56" rx="2" fill="#F6E4CC"/><path d="M-10 40L56 2L122 40Z" fill="#C65D4A"/><rect x="44" y="56" width="24" height="36" rx="3" fill="#7A4E2D"/><circle cx="63" cy="75" r="1.8" fill="#FFD66B"/><rect x="12" y="50" width="22" height="20" rx="3" fill="${win}"/><rect x="78" y="50" width="22" height="20" rx="3" fill="${win}"/><path d="M23 50V70M12 60H34M89 50V70M78 60H100" stroke="${lit ? '#E9B949' : '#fff'}" stroke-width="2"/></g>`;
}
function lamp(x, g) {
  return `<g><ellipse cx="${x}" cy="${g + 12}" rx="74" ry="11" fill="#FFE08A" opacity=".16"/><circle cx="${x}" cy="${g - 84}" r="46" fill="url(#g-glow)"/><rect x="${x - 2.5}" y="${g - 90}" width="5" height="102" fill="#555B85"/><path d="M${x - 11} ${g - 90}h22l-4 -7h-14z" fill="#555B85"/><circle cx="${x}" cy="${g - 84}" r="6" fill="#FFE08A"/></g>`;
}
const ANANYA = { style: 'braid', outfit: 'kurta', top: '#0F766E', bottom: '#1F2937', bag: '#A16207', bagType: 'tote', lanyard: '#3A8FC4' };
const MANAGER = { style: 'short', outfit: 'blazer', top: '#E5E7EB', jacket: '#334155', bottom: '#1F2937', skin: '#A86A45', hair: '#6B7280' };
function gateBackdrop(w = 300) {
  const ox = w - 300;
  const lit = [1, 0, 1, 1, 1, 1, 0, 1];
  let wins = '';
  [92, 118].forEach((wy, r) => [182, 210, 238, 266].forEach((wx, c) => { wins += `<rect x="${wx}" y="${wy}" width="20" height="18" rx="1.5" fill="${lit[r * 4 + c] ? '#FFD98A' : '#5B5F92'}"/>`; }));
  const manager = person({ x: 214, y: 276, s: 1.08, face: -1, ...MANAGER });
  const wide = ox > 0 ? stars([[200, 26], [262, 58], [318, 16], [372, 40]], 1.6) + '<path d="M130 252V232h28v-12h22v18h26v-22h30v36z" fill="#6E4C93" opacity=".55"/>' : '';
  return `<rect width="${w}" height="340" fill="url(#g-sky-evening)"/>
    ${stars([[26, 30], [96, 18], [140, 52], [60, 74], [124, 96]], 1.7)}${wide}
    <circle cx="56" cy="244" r="50" fill="#FFB36B" opacity=".22"/><circle cx="56" cy="244" r="32" fill="#FFB36B"/>
    <path d="M0 252V226h20v-14h22v22h24v-16h24v24h30v12z" fill="#6E4C93" opacity=".55"/>
    <rect y="252" width="${w}" height="24" fill="#3A3263"/>
    <g transform="translate(${ox} 0)">
      <rect x="198" y="72" width="3" height="10" fill="#C9CEDD"/><rect x="263" y="72" width="3" height="10" fill="#C9CEDD"/>
      <rect x="188" y="50" width="88" height="23" rx="3" fill="#E8EAF2"/>
      <text x="232" y="66.5" text-anchor="middle" font-family="Roboto, system-ui, sans-serif" font-weight="600" font-size="12" letter-spacing="3" fill="#1E2240">OFFICE</text>
      <rect x="168" y="80" width="132" height="196" fill="#3B3D6B"/><rect x="164" y="80" width="136" height="6" fill="#4A4D82"/>
      ${wins}
      <rect x="176" y="146" width="104" height="12" rx="2" fill="#C9CEDD"/>
      <rect x="186" y="158" width="84" height="118" fill="#262848"/>
      <rect x="191" y="164" width="36" height="112" fill="#FFE2A3" opacity=".22"/><rect x="229" y="164" width="36" height="112" fill="#FFE2A3" opacity=".22"/>
      <rect x="191" y="164" width="36" height="112" fill="none" stroke="#9AA6C8" stroke-width="2"/><rect x="229" y="164" width="36" height="112" fill="none" stroke="#9AA6C8" stroke-width="2"/>
      <rect x="221.5" y="214" width="2.5" height="18" rx="1" fill="#E2E8F0"/><rect x="232" y="214" width="2.5" height="18" rx="1" fill="#E2E8F0"/>
      <rect x="276" y="258" width="14" height="18" rx="2" fill="#7A5C48"/><ellipse cx="283" cy="250" rx="9" ry="12" fill="#2F6B4F"/><ellipse cx="279" cy="245" rx="5" ry="8" fill="#3C8A63"/>
    </g>
    <rect y="274" width="${w}" height="66" fill="#3A3263"/><rect y="274" width="${w}" height="32" fill="#4C437A"/>
    <g transform="translate(${ox} 0)">${manager}</g>`;
}


/* =========================================================
   Sound: recorded ElevenLabs clips in audio/<id>.mp3, made by tools/generate-audio.mjs
   (so no API key ever ships with the page). Falls back to the browser voice for any missing clip.
   ========================================================= */
const Voice = {
  missing: new Set(), voice: null, clip: null, clips: {},
  clipFor(id) {
    if (!this.clips[id]) {
      const a = new Audio();
      a.preload = 'auto';
      a.addEventListener('error', () => this.missing.add(id), { once: true });
      a.src = `audio/${id}.mp3`;
      this.clips[id] = a;
    }
    return this.clips[id];
  },
  /* Load the word clips up front so the first tap plays instantly; the rest load when first used */
  preload(ids) { ids.forEach(id => this.clipFor(id)); },
  init() {
    this.preload(Voice.ids || []);
    if (!('speechSynthesis' in window)) return;
    const pick = () => {
      const vs = speechSynthesis.getVoices();
      this.voice = vs.find(v => /en[-_]IN/i.test(v.lang)) || vs.find(v => /en[-_]GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
    };
    pick();
    speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', pick);
  },
  play(id, text, onEnd) {
    this.stop();
    const a = id && !this.missing.has(id) ? this.clipFor(id) : null;
    if (a) {
      this.clip = a;
      a.onended = () => { if (onEnd) onEnd(); };
      a.currentTime = 0;
      a.play().catch(err => {
        // A blocked autoplay is not a missing file; only remember real load failures
        if (err && err.name !== 'NotAllowedError' && err.name !== 'AbortError') this.missing.add(id);
        if (this.clip === a) this.say(text, onEnd);
      });
      return;
    }
    this.say(text, onEnd);
  },
  say(text, onEnd) {
    if (!('speechSynthesis' in window) || !text) { if (onEnd) onEnd(); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (this.voice) { u.voice = this.voice; u.lang = this.voice.lang; } else u.lang = 'en-IN';
    u.rate = .85;
    if (onEnd) u.onend = onEnd;
    speechSynthesis.speak(u);
  },
  stop() {
    if (this.clip) { this.clip.onended = null; this.clip.pause(); this.clip.currentTime = 0; this.clip = null; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    $$('.read-btn.is-playing, .listen-btn.is-playing, .qc-play.is-playing').forEach(b => b.classList.remove('is-playing'));
  }
};

const SFX = (() => {
  let ctx = null;
  const ensure = () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  const note = (f, at, dur, type = 'sine', vol = .07) => {
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + at;
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .05);
  };
  return {
    good() { note(784, 0, .16); note(1175, .08, .3); },
    bad()  { note(240, 0, .14, 'triangle', .05); note(200, .07, .2, 'triangle', .045); },
    flip() { note(560, 0, .07, 'triangle', .025); },
    star() { note(988, 0, .12, 'sine', .06); note(1319, .07, .16, 'sine', .06); note(1568, .14, .26, 'sine', .05); },
    win()  { [659, 784, 988, 1319].forEach((f, i) => note(f, i * .09, .3, 'sine', .06)); }
  };
})();

/* =========================================================
   Overlays, progress, small helpers
   ========================================================= */
const Modal = {
  onClose: null,
  open({ icon = '', title, text, button, onClose }) {
    const m = $('#modal');
    $('#modal-icon').innerHTML = icon; $('#modal-title').textContent = title; $('#modal-text').textContent = text;
    $('#modal-btn').textContent = button;
    this.onClose = onClose;
    m.hidden = false;
    gsap.fromTo(m, { autoAlpha: 0 }, { autoAlpha: 1, duration: .2 });
    gsap.fromTo('#modal .modal-card', { scale: .85, y: 24 }, { scale: 1, y: 0, duration: .45, ease: 'back.out(1.8)' });
    setTimeout(() => $('#modal-btn').focus(), 60);
  },
  close() {
    const m = $('#modal');
    gsap.to(m, { autoAlpha: 0, duration: .18, onComplete: () => { m.hidden = true; const f = this.onClose; this.onClose = null; if (f) f(); } });
  }
};

const PRAISE = ['Great job!', 'Nicely done!', 'Spot on!', 'Well done!', 'You got it!'];
const buzz = () => { try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) { /* no vibration */ } };

const Store = {
  KEY: 'kw-stage4-progress-v1',
  get() { try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) { return {}; } },
  set(patch) { try { localStorage.setItem(this.KEY, JSON.stringify({ ...this.get(), ...patch, updated: Date.now() })); } catch (e) { /* storage blocked */ } },
  clear() { const d = this.get(), keep = {}; ['mode', 'show', 'best', 'stages', 'celebrated'].forEach(k => { if (d[k] !== undefined) keep[k] = d[k]; }); try { localStorage.setItem(this.KEY, JSON.stringify(keep)); } catch (e) { /* storage blocked */ } }
};

function markStage(id) { const d = Store.get(); Store.set({ stages: { ...(d.stages || {}), [id]: true } }); }

function readAloud(btn) {
  const playing = btn.classList.contains('is-playing');
  Voice.stop();
  if (playing) return;
  let ended = false;   // Voice.play() first stops other audio (which clears every playing button), so mark this one after it
  Voice.play(btn.dataset.read, btn.dataset.text, () => { ended = true; btn.classList.remove('is-playing'); });
  if (!ended) btn.classList.add('is-playing');
}

function makeClock(el, seconds) {
  const digits = $('.timer-time', el), swing = $('.timer-swing', el);
  let t0 = 0, iv = null, last = -1;
  const fmt = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  const sway = (amp, dur) => gsap.fromTo(swing, { rotation: 0, transformOrigin: '50% 0%' }, { keyframes: { rotation: [0, amp, -amp * .7, amp * .4, -amp * .15, 0], easeEach: 'sine.inOut' }, duration: dur, ease: 'none', transformOrigin: '50% 0%' });
  const show = n => {
    if (n === last) return;
    last = n;
    digits.textContent = fmt(n);
    el.setAttribute('aria-label', `Time left ${Math.floor(n / 60)} minutes ${n % 60} seconds`);
    el.classList.toggle('is-low', n > 0 && n <= 30);
    if (!iv) return;
    if (n === 60) announce('One minute left.');
    if (n === 30) { announce('30 seconds left.'); sway(6, 1.2); }
    if (n > 0 && n <= 10) gsap.fromTo(digits, { scale: 1.12 }, { scale: 1, duration: .35, ease: 'power2.out' });
  };
  return {
    start() {
      this.stop();
      el.classList.remove('is-done', 'is-up');
      last = -1;
      show(seconds);
      t0 = Date.now();
      iv = setInterval(() => show(Math.max(0, Math.ceil(seconds - (Date.now() - t0) / 1000))), 200);
      // Drops in and swings on its rod
      gsap.fromTo(swing, { y: -40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .45, ease: 'back.out(1.6)' });
      gsap.delayedCall(.3, () => sway(10, 1.4));
    },
    stop(state) {
      clearInterval(iv);
      iv = null;
      if (state === 'is-up') { show(0); el.classList.add('is-up'); sway(14, 1.3); }
      if (state === 'is-done') { el.classList.add('is-done'); sway(5, 1); }
    }
  };
}
Object.assign(UI, {
  book: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6.5C10.5 5.3 8.3 4.8 5.5 4.8H4v13.4h1.5c2.8 0 5 .5 6.5 1.7 1.5-1.2 3.7-1.7 6.5-1.7H20V4.8h-1.5c-2.8 0-5 .5-6.5 1.7z"/><path d="M12 6.5v13.4"/></svg>',
  letters: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18 7.5 6h1L13 18"/><path d="M4.6 14h6.8"/><path d="M15 11.6c.6-.9 1.5-1.4 2.7-1.4 1.8 0 2.8 1 2.8 2.8V18"/><path d="M20.5 15.1c-.6-.5-1.5-.7-2.5-.7-1.6 0-2.8.8-2.8 2 0 1.1.9 1.8 2.2 1.8 1.4 0 2.6-.9 3.1-2"/></svg>'
});
const escH = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];
const postStage = (stage, extra = {}) => { try { if (window.parent !== window) window.parent.postMessage({ type: 'stage-complete', stage, ...extra }, '*'); } catch (e) { /* not embedded */ } };
const postKW = (type, detail) => { try { if (window.parent !== window) window.parent.postMessage({ type: `kw-${type}`, detail }, '*'); } catch (e) { /* not embedded */ } };
function qdots(sel, n, at) {
  const el = $(sel);
  el.innerHTML = Array.from({ length: n }, (_, k) => `<i class="${k < at ? 'done' : k === at ? 'on' : ''}"></i>`).join('');
  el.setAttribute('aria-label', `Question ${Math.min(at + 1, n)} of ${n}`);
}
function cardIn(el) { if (!RM) gsap.fromTo(el, { x: 36, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: .35, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }); }

/* Result sheet for the question screens: green when right, amber when not. Nothing is taken away. */
const QSheet = {
  onNext: null,
  show({ ok, title, text, note = '', button, onNext }) {
    const el = $('#qsheet');
    el.classList.toggle('fix', !ok);
    $('#qs-badge').innerHTML = ok ? UI.checkBig : UI.bulb;
    $('#qs-title').textContent = title;
    $('#qs-text').textContent = text;
    $('#qs-note').innerHTML = note;
    $('#qs-note').hidden = !note;
    $('#qs-next').textContent = button;
    this.onNext = onNext;
    el.hidden = false;
    document.body.style.setProperty('--kw-sheet', `${el.offsetHeight}px`);
    document.body.classList.add('kw-sheet');
    if (!RM) {
      gsap.fromTo(el, { yPercent: 100 }, { yPercent: 0, duration: .42, ease: 'back.out(1.1)', clearProps: 'transform' });
      gsap.fromTo('#qs-badge', { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: .5, ease: 'back.out(2.6)', delay: .16 });
    }
    if (ok && window.Motion) setTimeout(() => Motion.confetti($('#qs-badge'), 26), 360);
    setTimeout(() => $('#qs-next').focus({ preventScroll: true }), 160);
  },
  hide() { const el = $('#qsheet'); if (!el || el.hidden) return; el.hidden = true; document.body.classList.remove('kw-sheet'); this.onNext = null; },
  next() { const f = this.onNext; if (f) f(); }
};

/* =========================================================
   Screens on a stage page: the same change as index.html (fade out, content rises, top bar buttons drop in)
   ========================================================= */
let cur = null, busy = false;
const screenEl = n => $(`[data-screen="${n}"]`);
const Screens = { enter() {}, leave() {} };   // each stage script sets these
function show(name, dir = 1) {
  if (busy || name === cur) return;
  busy = true;
  const from = screenEl(cur), to = screenEl(name);
  Voice.stop();
  QSheet.hide();
  Screens.leave(cur);
  cur = name;
  document.body.dataset.view = name;
  gsap.to(from, {
    autoAlpha: 0, duration: .15, ease: 'power1.in',
    onComplete() {
      from.hidden = true;
      gsap.set(from, { clearProps: 'all' });
      to.hidden = false;
      window.scrollTo(0, 0);
      $$(':scope > .work', to).forEach(w => { w.scrollTop = 0; });
      const rc = $('.reading', to); if (rc) rc.scrollTop = 0;
      if (!RM) {
        gsap.fromTo($$(':scope > .work > *', to), { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: .55, ease: 'power3.out', stagger: .06, clearProps: 'transform,opacity' });
        const bar = $(':scope > .actionbar', to);
        if (bar) gsap.fromTo(bar, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: 'power3.out', clearProps: 'transform,opacity' });
      }
      Screens.enter(name);
      gsap.delayedCall(.3, () => { busy = false; });
    }
  });
}
/* the first screen of a page */
function startAt(name) {
  $$('.screen').forEach(sc => { sc.hidden = sc.dataset.screen !== name; });
  cur = name;
  document.body.dataset.view = name;
  Screens.enter(name);
}
const goPath = () => { location.href = 'index.html#path'; };   // #path: open the learning path, not the Key Words start screen
const fillIcons = () => $$('[data-ui]').forEach(el => { el.outerHTML = UI[el.dataset.ui] || ''; });

/* Arriving from the learning path: the black from the Start button still covers the page; it lifts into the top bar */
const Arrive = {
  play() {
    document.documentElement.classList.remove('kw-arriving');
    let info = null;
    try { info = JSON.parse(sessionStorage.getItem('kw-launch') || 'null'); sessionStorage.removeItem('kw-launch'); } catch (e) { /* storage blocked */ }
    const el = $('#launch');
    if (!info || !el || RM) return;
    $('#launch-part').textContent = info.kicker || '';
    $('#launch-title').textContent = info.title || '';
    $('#launch-dots').innerHTML = (info.dots || []).map(c => `<i class="${c}"></i>`).join('');
    const parts = $$('.launch-in > *');
    gsap.set(el, { clipPath: 'inset(0px 0px 0px 0px)' });
    el.hidden = false;
    gsap.timeline({ onComplete: () => { el.hidden = true; gsap.set(el, { clearProps: 'clipPath' }); } })
      .to(parts, { y: -28, autoAlpha: 0, duration: .3, stagger: .04, ease: 'power2.in' }, .35)
      .to(el, { clipPath: () => `inset(0px 0px ${innerHeight - $('#topbar').offsetHeight}px 0px)`, duration: .6, ease: 'power3.inOut' }, .42);
  }
};

/* shared wiring: the sticky top bar's shadow, the dialog button, read-aloud buttons, and data-go links */
document.addEventListener('scroll', e => { const el = e.target === document ? document.scrollingElement : e.target; document.body.classList.toggle('kw-scrolled', (el && el.scrollTop) > 4); }, { passive: true, capture: true });
document.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t || t.disabled) return;
  if (t.id === 'modal-btn') return Modal.close();
  if (t.classList.contains('read-btn')) return readAloud(t);
  if (t.dataset.go === 'path') return goPath();
  if (t.dataset.go) return show(t.dataset.go, t.classList.contains('back-btn') ? -1 : 1);
});
try { history.scrollRestoration = 'manual'; } catch (e) { /* older browsers */ }
