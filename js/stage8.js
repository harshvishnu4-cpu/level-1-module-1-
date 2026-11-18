/* Stage 8: Quick Check (quick-check.html). Needs js/kw-core.js first. */
/* =========================================================
   Stage 8: Quick Check. A self-check, not graded; feedback after each answer, nothing taken away.
   ========================================================= */
const CHECK_Q = [
  { id: 'qc1', skill: 'Listening', icon: 'speaker', q: 'Listen. Which picture matches?', type: 'icons', correct: 'sun',
    options: [{ v: 'sunrise', label: 'Picture: the sun coming up' }, { v: 'sun', label: 'Picture: the sun high in the sky' }, { v: 'moon', label: 'Picture: a moon and stars' }],
    right: '“Good afternoon” goes with the sun high in the sky.', wrong: 'The answer is the sun high in the sky. “Good afternoon” is for the afternoon.' },
  { id: 'qc2', skill: 'Vocabulary', icon: 'book', q: 'Which word means “a small apology”?', type: 'words', correct: 'Sorry',
    options: ['Please', 'Sorry', 'Thank you'], right: '“Sorry” is a small apology.', wrong: 'The answer is “Sorry”. It is a small apology.' },
  { id: 'qc3', skill: 'Grammar', icon: 'letters', q: 'Drag “am” and “is” into the right blanks.', type: 'drag',
    right: 'I am Ananya. This is my first day.', wrong: 'The answer: I am Ananya. This is my first day.' },
  { id: 'qc4', skill: 'Application', icon: 'chat', q: "You're leaving a shop in the evening. What do you say?", type: 'words', art: true, correct: 'See you',
    options: ['Good evening', 'See you', 'Good morning'], right: 'You are leaving, so you say “See you”, even in the evening.', wrong: 'The answer is “See you”. You are leaving, so you say goodbye, even in the evening.' }
];
function shopFront() {
  let awn = '', scal = '';
  for (let i = 0; i < 8; i++) { const c = i % 2 ? '#FFFFFF' : '#E2A53A'; awn += `<rect x="${64 + i * 21.5}" y="86" width="21.5" height="16" fill="${c}"/>`; scal += `<circle cx="${74.75 + i * 21.5}" cy="102" r="10.75" fill="${c}"/>`; }
  return `<svg viewBox="0 0 300 180" role="img" aria-label="A small shop in the evening, with its lights on">
    <rect width="300" height="180" fill="url(#g-sky-evening)"/>${stars([[26, 22], [92, 14], [214, 20], [268, 44], [46, 58]], 1.6)}
    <circle cx="252" cy="36" r="13" fill="#FFF3C4"/><circle cx="257" cy="31" r="11" fill="#5E4A9A" opacity=".55"/>
    <rect x="56" y="44" width="188" height="118" fill="#E9DFD0"/><rect x="52" y="40" width="196" height="8" rx="2" fill="#CDBDA6"/>
    <rect x="96" y="54" width="108" height="24" rx="4" fill="#2D2A4A"/>
    <text x="150" y="71" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-weight="700" font-size="13" letter-spacing="4" fill="#FFD98A">SHOP</text>
    ${awn}${scal}
    <rect x="72" y="116" width="92" height="46" rx="3" fill="#FFD98A"/><rect x="72" y="116" width="92" height="46" rx="3" fill="none" stroke="#7A5C48" stroke-width="3"/>
    <rect x="82" y="132" width="16" height="22" rx="2" fill="#E07A5F"/><rect x="102" y="138" width="14" height="16" rx="2" fill="#3D8B63"/><circle cx="132" cy="146" r="8" fill="#F2A541"/><rect x="144" y="134" width="12" height="20" rx="2" fill="#5B8DEF"/>
    <rect x="176" y="114" width="52" height="48" rx="3" fill="#6B4B3A"/><rect x="182" y="120" width="40" height="22" rx="2" fill="#FFE2A3" opacity=".55"/><circle cx="216" cy="140" r="2.4" fill="#F4E3C3"/>
    <rect y="162" width="300" height="18" fill="#3A3263"/><rect y="162" width="300" height="5" fill="#4C437A"/>
  </svg>`;
}
const QuickCheck = {
  LIMIT: 10 * 60 * 1000, timer: null, clock: null, i: 0, sel: null, checked: false, slots: [null, null],
  start() {
    this.stop();
    QSheet.hide();
    this.i = 0;
    this.timer = setTimeout(() => this.timeUp(), this.LIMIT);
    this.clock.start();
    this.render();
  },
  stop() { clearTimeout(this.timer); this.timer = null; if (this.clock) this.clock.stop(); },
  timeUp() {
    this.timer = null;
    this.clock.stop('is-up');
    QSheet.hide(); Voice.stop();
    postKW('check-timeout');
    Modal.open({ icon: UI.hourglass, title: 'Time is up', text: 'The quiz starts again from question 1.', button: 'Start again',
      onClose: () => { if (cur === 'check') this.start(); else show('check'); } });
  },
  render() {
    const q = CHECK_Q[this.i];
    this.sel = null; this.checked = false; this.slots = [null, null];
    qdots('#qc-dots', CHECK_Q.length, this.i);
    $('#qc-status').textContent = `Question ${this.i + 1} of ${CHECK_Q.length}`;
    let body = '';
    if (q.type === 'icons') body = `<div class="qc-listen"><button type="button" class="qc-play" data-act="qc-play" aria-label="Play the greeting">${UI.speaker}</button><span>Tap to hear it again</span></div>
      <div class="tiles" role="group" aria-labelledby="qc-q">${q.options.map(o => `<button type="button" class="choice tile" data-v="${o.v}" aria-pressed="false" aria-label="${o.label}">${ICON[o.v]()}</button>`).join('')}</div>`;
    if (q.type === 'words') body = `${q.art ? `<div class="qc-media"><div class="qc-art">${shopFront()}</div>` : ''}
      <div class="tiles" role="group" aria-labelledby="qc-q">${q.options.map(o => `<button type="button" class="choice tile word" data-v="${o}" aria-pressed="false">${o}</button>`).join('')}</div>${q.art ? '</div>' : ''}`;
    if (q.type === 'drag') body = `<p class="sentence">I <button type="button" class="slot" data-slot="0" aria-label="First blank, empty"></button> Ananya. This <button type="button" class="slot" data-slot="1" aria-label="Second blank, empty"></button> my first day.</p>
      <div class="bank" role="group" aria-label="Words to place. Drag one into a blank, or tap it.">${shuffle(['am', 'is']).map(w => `<button type="button" class="wchip" data-w="${w}">${w}</button>`).join('')}</div>`;
    $('#qc-card').innerHTML = `
      <div class="dc-head"><span class="dc-ico">${UI[q.icon]}</span><span>${q.skill}</span><span class="dc-meta">${this.i + 1} of ${CHECK_Q.length}</span></div>
      <div class="q-row"><p class="question" id="qc-q">${escH(q.q)}</p><button type="button" class="read-btn" data-read="${q.id}" data-text="${escH(q.q)}" aria-label="Read the question aloud">${UI.speaker}</button></div>
      ${body}
      <button type="button" class="btn primary check-btn" data-act="qc-check" disabled>Check</button>`;
    $('#qc-card').classList.toggle('lilac', true);
    cardIn($('#qc-card'));
    this.sync();
    if (q.type === 'icons') setTimeout(() => { if (cur === 'check' && this.i === 0 && !this.checked && $('#modal').hidden) this.play(); }, 700);
  },
  play() {
    const b = $('#qc-card .qc-play');
    if (!b) return;
    let ended = false;
    Voice.play('good-afternoon', 'Good afternoon!', () => { ended = true; b.classList.remove('is-playing'); });
    if (!ended) b.classList.add('is-playing');
  },
  pick(btn) {
    if (this.checked) return;
    this.sel = btn.dataset.v;
    $$('#qc-card .choice').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    if (!RM) gsap.fromTo(btn, { scale: .95 }, { scale: 1, duration: .3, ease: 'back.out(3)', clearProps: 'transform' });
    this.sync();
  },
  /* Q3: tap a word to put it in the next empty blank; tap a filled blank to take the word back */
  chipTap(chip) {
    if (this.checked || Drag.justDropped || chip.classList.contains('is-used')) return;
    const k = this.slots.indexOf(null);
    if (k >= 0) this.place(chip, $(`#qc-card .slot[data-slot="${k}"]`));
  },
  place(chip, slot) {
    if (this.checked) return;
    const k = Number(slot.dataset.slot), w = chip.dataset.w;
    if (this.slots[k]) this.free(k);
    this.slots[k] = w;
    slot.textContent = w;
    slot.classList.add('filled');
    slot.setAttribute('aria-label', `${k ? 'Second' : 'First'} blank: ${w}. Tap to take it back.`);
    chip.classList.add('is-used');
    chip.tabIndex = -1;
    chip.setAttribute('aria-hidden', 'true');
    if (!RM) gsap.fromTo(slot, { scale: .85 }, { scale: 1, duration: .35, ease: 'back.out(3)', clearProps: 'transform' });
    this.sync();
  },
  free(k) {
    const w = this.slots[k], slot = $(`#qc-card .slot[data-slot="${k}"]`), chip = $(`#qc-card .wchip[data-w="${w}"]`);
    this.slots[k] = null;
    slot.textContent = '';
    slot.classList.remove('filled');
    slot.setAttribute('aria-label', `${k ? 'Second' : 'First'} blank, empty`);
    if (chip) { chip.classList.remove('is-used'); chip.tabIndex = 0; chip.removeAttribute('aria-hidden'); }
  },
  slotTap(slot) {
    if (this.checked) return;
    const k = Number(slot.dataset.slot);
    if (this.slots[k]) { this.free(k); this.sync(); }
  },
  ready() { return CHECK_Q[this.i].type === 'drag' ? this.slots.every(Boolean) : !!this.sel; },
  sync() {
    const last = this.i === CHECK_Q.length - 1, inCard = $('#qc-card [data-act="qc-check"]'), top = $('#qc-next');
    if (inCard) { inCard.disabled = this.checked || !this.ready(); inCard.hidden = this.checked; }
    top.disabled = !this.checked && !this.ready();
    top.textContent = this.checked ? (last ? 'Finish' : 'Next question') : 'Check';
  },
  primary() { if (this.checked) return QSheet.next(); if (this.ready()) this.check(); },
  check() {
    const q = CHECK_Q[this.i];
    let ok;
    this.checked = true;
    if (q.type === 'drag') {
      ok = this.slots[0] === 'am' && this.slots[1] === 'is';
      $$('#qc-card .slot').forEach((sl, k) => { sl.classList.add(this.slots[k] === (k ? 'is' : 'am') ? 'is-right' : 'is-wrong'); sl.disabled = true; });
      $$('#qc-card .wchip').forEach(c => { c.disabled = true; });
    } else {
      ok = this.sel === q.correct;
      $$('#qc-card .choice').forEach(b => {
        b.disabled = true;
        if (b.dataset.v === this.sel) b.classList.add(ok ? 'is-right' : 'is-wrong');
        else if (!ok && b.dataset.v === q.correct) b.classList.add('is-answer');
      });
    }
    if (ok) { SFX.good(); const r = $('#qc-card .is-right'); if (r && window.Motion) Motion.confetti(r, 12); }
    else { SFX.bad(); buzz(); shake($$('#qc-card .is-wrong'), 7); }
    if (q.id === 'qc1') setTimeout(() => this.play(), 500);
    postKW('check-answer', { question: q.id, correct: ok });
    const last = this.i === CHECK_Q.length - 1;
    QSheet.show({ ok, title: ok ? praise() : 'Not quite', text: ok ? q.right : q.wrong, button: last ? 'Finish' : 'Continue', onNext: () => this.next() });
    this.sync();
  },
  next() {
    QSheet.hide();
    this.i++;
    if (this.i >= CHECK_Q.length) { this.stop(); show('checkdone'); return; }
    this.render();
    window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
  },
  done() {
    const art = $('#qc-done-art');
    if (!art.innerHTML) art.innerHTML = `<svg viewBox="0 0 440 340" role="img" aria-label="Ananya smiles and waves at the office entrance.">${gateBackdrop(440)}<g class="walker">${person({ x: 196, y: 302, s: 1.18, face: 1, wave: true, ...ANANYA })}</g></svg>`;
    if (!RM) {
      gsap.fromTo('.done-title.big', { scale: .6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .6, ease: 'back.out(2.2)', delay: .25 });
      if (window.Motion) setTimeout(() => Motion.confetti($('.done-title.big'), 40), 520);
      const arm = $('#qc-done-art .arm-w');
      if (arm) gsap.fromTo(arm, { rotation: 0 }, { keyframes: { rotation: [0, -14, 8, -10, 4, 0] }, duration: 1.6, delay: .6, svgOrigin: arm.dataset.origin || '0 0' });
    }
  },
  finish() {
    markStage('s8');
    postStage(8);
    goPath();
  }
};

/* Drag a word chip into a blank (mouse, pen or touch). A plain tap is handled as a click. */
const Drag = {
  s: null, justDropped: false,
  init() {
    document.addEventListener('pointerdown', e => {
      const chip = e.target.closest && e.target.closest('.wchip');
      if (!chip || chip.disabled || chip.classList.contains('is-used') || QuickCheck.checked || e.button > 0) return;
      this.s = { chip, x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
    });
    document.addEventListener('pointermove', e => {
      const s = this.s;
      if (!s || e.pointerId !== s.id) return;
      if (!s.moved) {
        if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < 6) return;
        const r = s.chip.getBoundingClientRect();
        s.moved = true; s.dx = s.x - r.left; s.dy = s.y - r.top;
        s.ghost = s.chip.cloneNode(true);
        s.ghost.classList.add('drag-ghost');
        s.ghost.removeAttribute('id');
        s.ghost.style.width = `${r.width}px`;
        document.body.append(s.ghost);
        s.chip.classList.add('is-lifted');
      }
      e.preventDefault();
      s.ghost.style.transform = `translate(${e.clientX - s.dx}px, ${e.clientY - s.dy}px) rotate(-4deg) scale(1.05)`;
      const over = document.elementFromPoint(e.clientX, e.clientY);
      const slot = over && over.closest('#qc-card .slot');
      $$('#qc-card .slot.is-over').forEach(x => { if (x !== slot) x.classList.remove('is-over'); });
      if (slot) slot.classList.add('is-over');
    }, { passive: false });
    const end = e => {
      const s = this.s;
      if (!s || e.pointerId !== s.id) return;
      this.s = null;
      if (!s.moved) return;
      const over = document.elementFromPoint(e.clientX, e.clientY);
      const slot = over && over.closest('#qc-card .slot');
      $$('#qc-card .slot.is-over').forEach(x => x.classList.remove('is-over'));
      s.chip.classList.remove('is-lifted');
      this.justDropped = true;
      setTimeout(() => { this.justDropped = false; }, 50);
      if (slot && !slot.disabled) { s.ghost.remove(); QuickCheck.place(s.chip, slot); return; }
      const r = s.chip.getBoundingClientRect();
      gsap.to(s.ghost, { x: r.left, y: r.top, rotation: 0, scale: 1, duration: .25, ease: 'power2.out', onComplete: () => s.ghost.remove() });
    };
    document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', end);
  }
};

/* =========================================================
   This page: check (4 questions, 10 minutes, restarts from Q1 if time runs out) -> checkdone
   ========================================================= */
Screens.enter = name => {
  $('#check-timer').hidden = name !== 'check';
  if (name === 'check') QuickCheck.start();
  if (name === 'checkdone') QuickCheck.done();
};
Screens.leave = name => { if (name === 'check') QuickCheck.stop(); };
document.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t || t.disabled) return;
  if (t.classList.contains('choice')) return QuickCheck.pick(t);
  if (t.dataset.act === 'qc-check' || t.id === 'qc-next') return QuickCheck.primary();
  if (t.id === 'qs-next') return QSheet.next();
  if (t.dataset.act === 'qc-play') return QuickCheck.play();
  if (t.classList.contains('wchip')) return QuickCheck.chipTap(t);
  if (t.classList.contains('slot')) return QuickCheck.slotTap(t);
  if (t.dataset.act === 'qc-finish') return QuickCheck.finish();
});
fillIcons();
QuickCheck.clock = makeClock($('#check-timer'), QuickCheck.LIMIT / 1000);
Drag.init();
Voice.ids = ['good-afternoon'];
Voice.init();
startAt('check');
Arrive.play();
