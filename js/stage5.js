/* Stage 5: Reading Card (reading.html). Needs js/kw-core.js first.
   The passage is the content team's approved text, word for word (Simple English Wikipedia, CC BY-SA 4.0).
   [[word]] marks a glossary word; [[shown|key]] when the glossary entry has another form. */
const READ_TITLE = 'Saying Hello — Words and Actions';
const READ_PARAS = [
  "Hello is a [[greeting]] used in the English language. People say 'hello' when they meet someone, or when they answer a phone call. Many people also say 'hi'. 'Hi' is an [[informal]] word. We often use it with friends and family. 'Hello' can be used in both informal and [[formal]] places, like a class or an office. There are other informal greetings too, like 'hey' and 'hiya'. Saying hello is a sign of [[politeness]], especially when you say it in a friendly way.",
  "A greeting is not only a word. People also greet each other with actions. They may wave, nod, bow or shake hands. One of the most common action greetings is the [[handshake]].",
  "In a handshake, two people hold each other's right hand for a short time. They move their hands up and down a little, and then they let go. People shake hands when they meet. They also shake hands to show that they [[agree]] on something.",
  "The handshake is very old, and people in many [[cultures|culture]] use it. But it is not exactly the same everywhere. In some places, people give a [[firm]] handshake and hold the other hand tightly. In other places, a [[gentle]] handshake is more polite. In some cultures, the [[senior]] person, who is older or more important, offers a hand first. A handshake can be short or long. Almost everywhere, people shake hands with [[bare]] hands, not with gloves on.",
  "In some places, men and women do not usually shake hands. Family members often [[hug]] instead. So it is a good idea to watch what other people do, and follow them.",
  "Whether you say 'hello,' wave, or shake hands, a greeting is your first chance to be friendly and polite to someone new."
];
const GLOSS = {
  greeting:   { w: 'Greeting',   pos: 'n.',   m: 'A word or action you use when you meet someone', p: '1' },
  informal:   { w: 'Informal',   pos: 'adj.', m: 'Relaxed; used with friends and family, like “hi” or “hey”', p: '1' },
  formal:     { w: 'Formal',     pos: 'adj.', m: 'Polite and serious; used in places like a class or an office', p: '1' },
  politeness: { w: 'Politeness', pos: 'n.',   m: 'Being kind and showing good manners', p: '1' },
  handshake:  { w: 'Handshake',  pos: 'n.',   m: "Holding another person's right hand and moving it up and down a little", p: '2, 3' },
  agree:      { w: 'Agree',      pos: 'v.',   m: 'To think the same as someone, or say yes to the same thing', p: '3' },
  culture:    { w: 'Culture',    pos: 'n.',   m: 'The way of life, habits and beliefs of a group of people', p: '4' },
  firm:       { w: 'Firm',       pos: 'adj.', m: 'Strong and tight, not loose', p: '4' },
  gentle:     { w: 'Gentle',     pos: 'adj.', m: 'Soft and light, not strong', p: '4' },
  senior:     { w: 'Senior',     pos: 'adj.', m: 'Older or more important', p: '4' },
  bare:       { w: 'Bare',       pos: 'adj.', m: 'Not covered; a bare hand has no glove on it', p: '4' },
  hug:        { w: 'Hug',        pos: 'v.',   m: 'To put your arms around someone', p: '5' }
};
/* Questions and answers from the content table. Answer formats (tap two words, pick one row) are ours.
   "Where in the text" for Q1 is paragraph 1: hi, hey and hiya are all in the first paragraph. */
const READ_Q = [
  { id: 'rq1', q: 'What are two example words from the text that mean “hello”?', type: 'multi', pick: 2,
    options: ['hi', 'hey', 'hiya', 'wave', 'nod', 'hug'], correct: ['hi', 'hey', 'hiya'], answer: 'Hi, hey, hiya', where: 'Paragraph 1', para: [1] },
  { id: 'rq2', q: 'What is a handshake used for, according to the text?', type: 'single',
    options: ['When people meet, and to show they agree on something', 'To say goodbye at the end of a phone call', 'Only to greet family members', 'To show who is the oldest person'],
    correct: [0], answer: 'When people meet, and to show they agree on something', where: 'Paragraph 3', para: [3] },
  { id: 'rq3', q: 'Is a handshake exactly the same in every culture? Give one difference.', type: 'single',
    options: ['Yes. It is the same everywhere.', 'No. In some places it is firm, and in other places it is gentle.', 'No. In some places people shake with their left hand.', 'No. In most places people shake hands with gloves on.'],
    correct: [1], answer: "No: firm or gentle; who offers first; short or long; in some places men and women don't shake hands", where: 'Paragraphs 4–5', para: [4, 5] }
];
const GLOSS_RE = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
const READ_TEXT = [READ_TITLE, ...READ_PARAS.map(p => p.replace(GLOSS_RE, '$1'))].join('\n\n');

/* Small line illustration: two hands in a handshake beside a waving hand */
const READ_ART = `<svg viewBox="0 0 200 84" width="200" height="84" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M6 66 26 46"/><path d="M20 76 40 56"/><path d="M26 46l14 10"/><path d="M22 50l14 10" stroke-width="2"/>
  <path d="M134 66 114 46"/><path d="M120 76 100 56"/><path d="M114 46l-14 10"/><path d="M118 50l-14 10" stroke-width="2"/>
  <path d="M114 46c-6-6-14-10-24-11l-18-1.5c-3.6-.3-4.4 4.6-.8 5.4L82 41"/>
  <path d="M100 56c-8 4-18 5-28 3"/>
  <path d="M26 46c8-8 18-12 30-12 6 0 10 1 14 3"/>
  <path d="M56 34c4-6 10-8 16-6.5 3.6.9 3.2 5.4-.4 5.6L62 34"/>
  <path d="M40 56c6 4 14 6 22 6"/>
  <path d="M62 38.5c8-.6 15 .6 21 3.4 3.4 1.6 1.6 6.4-2 5.2"/>
  <path d="M63 44.5c7-.2 13 .9 18 3.2 3.2 1.6 1.4 6-1.8 5"/>
  <path d="M62 50.5c6 0 11 1 15 2.8 2.9 1.3 1.3 5.4-1.6 4.6"/>
  <path d="M62 56.5c4 .2 7.6 1 10.6 2.2 2.6 1.1 1 4.8-1.5 4"/>
  <g transform="translate(150 10)">
    <path d="M13 38V17a3.3 3.3 0 0 1 6.6 0v15"/>
    <path d="M19.6 31V10a3.3 3.3 0 0 1 6.6 0v21"/>
    <path d="M26.2 31V12.6a3.3 3.3 0 0 1 6.6 0V32"/>
    <path d="M32.8 33V20a3.3 3.3 0 0 1 6.6 0v19c0 11.6-7.8 21-18.6 21h-1.8c-6 0-10-2.4-13.4-7L1.8 45a3.4 3.4 0 0 1 5.4-4.4l5.8 6.4V38"/>
  </g>
  <path d="M195 14c2.4 3.2 3.2 7 2.4 10.6"/><path d="M189 7c1.8 1.5 3 3.4 3.7 5.6"/><path d="M150 16c-2.2 3.2-2.8 6.8-2.1 10.2"/>
</svg>`;

const Gloss = {
  btn: null,
  open(btn) {
    if (this.btn === btn) return this.close();
    this.close();
    const pop = $('#gloss-pop'), card = $('#reading'), g = GLOSS[btn.dataset.g];
    if (!g || !pop) return;
    this.btn = btn;
    btn.setAttribute('aria-expanded', 'true');
    pop.innerHTML = `<b>${g.w}</b> <span class="gp-pos">(${g.pos})</span><p>${escH(g.m)}</p>`;
    pop.hidden = false;
    // directly under the word, kept inside the card
    const br = btn.getClientRects()[0] || btn.getBoundingClientRect(), cr = card.getBoundingClientRect(), w = pop.offsetWidth;
    const mid = br.left - cr.left + br.width / 2;
    const left = Math.max(8, Math.min(mid - w / 2, cr.width - w - 8));
    pop.style.left = `${left}px`;
    pop.style.top = `${br.bottom - cr.top + card.scrollTop + 10}px`;
    pop.style.setProperty('--arrow', `${Math.max(14, Math.min(w - 14, mid - left))}px`);
    if (!RM) gsap.fromTo(pop, { y: -6, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .2, ease: 'power2.out' });
  },
  close() {
    if (this.btn) this.btn.setAttribute('aria-expanded', 'false');
    this.btn = null;
    const pop = $('#gloss-pop');
    if (pop) pop.hidden = true;
  }
};

const Reading = {
  LIMIT: 12 * 60 * 1000, timer: null, clock: null,
  build() {
    $$('.read-art').forEach(el => { el.innerHTML = READ_ART; });
    $('#passage').innerHTML = READ_PARAS.map((p, i) => `<p data-para="${i + 1}"><span class="pnum" aria-label="Paragraph ${i + 1}">${i + 1}</span>${escH(p).replace(GLOSS_RE, (m, word, key) => {
      const k = (key || word).toLowerCase();
      return `<button type="button" class="gloss" data-g="${k}" aria-expanded="false" aria-controls="gloss-pop">${word}<span class="gi" aria-hidden="true">i</span></button>`;
    })}</p>`).join('');
    $('#glossary-list').innerHTML = Object.values(GLOSS).map(g => `<div class="gl-row"><dt><b>${g.w}</b> <span>(${g.pos})</span></dt><dd>${escH(g.m)}</dd><dd class="gl-p">Paragraph ${g.p}</dd></div>`).join('');
  },
  /* A new attempt: 12 minutes for reading plus the questions */
  start() {
    this.stop();
    ReadQ.reset();
    this.timer = setTimeout(() => this.timeUp(), this.LIMIT);
    this.clock.start();
  },
  stop() { clearTimeout(this.timer); this.timer = null; if (this.clock) this.clock.stop(); },
  timeUp() {
    this.timer = null;
    this.clock.stop('is-up');
    QSheet.hide(); TextDrawer.close(); Voice.stop();
    postKW('read-timeout');
    Modal.open({ icon: UI.hourglass, title: 'Time is up', text: 'The questions start again. The text is still here for you.', button: 'Start again',
      onClose: () => { this.start(); if (cur !== 'read') show('read', -1); } });
  },
  /* Listen: every tap reads the whole passage from the start */
  listen(btn) {
    let ended = false;
    Voice.play('read-passage', READ_TEXT, () => { ended = true; btn.classList.remove('is-playing'); });
    if (!ended) btn.classList.add('is-playing');
  }
};


/* Show text: the passage opens in a drawer over the question, then goes back to its place */
const TextDrawer = {
  home: null, opener: null,
  open(paras) {
    const d = $('#textdrawer'), art = $('#reading');
    if (!d.hidden) return;
    this.home = art.parentElement;
    this.opener = document.activeElement;
    $('.td-body', d).append(art);
    d.hidden = false;
    document.body.classList.add('kw-noscroll');
    if (!RM) {
      const phone = innerWidth < 600;
      gsap.fromTo('.td-panel', phone ? { yPercent: 100 } : { xPercent: 100 }, { xPercent: 0, yPercent: 0, duration: .38, ease: 'power3.out', clearProps: 'transform' });
      gsap.fromTo(d, { backgroundColor: 'rgba(15,23,42,0)' }, { backgroundColor: 'rgba(15,23,42,.42)', duration: .3, clearProps: 'backgroundColor' });
    }
    $('.td-body', d).scrollTop = 0;
    setTimeout(() => $('#td-close').focus({ preventScroll: true }), 60);
    if (paras && paras.length) setTimeout(() => {
      const ps = paras.map(n => $(`#passage p[data-para="${n}"]`)).filter(Boolean);
      if (!ps.length) return;
      ps[0].scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      ps.forEach(p => gsap.fromTo(p, { backgroundColor: 'rgba(253,232,176,1)', boxShadow: '0 0 0 8px rgba(253,232,176,1)' }, { backgroundColor: 'rgba(253,232,176,0)', boxShadow: '0 0 0 8px rgba(253,232,176,0)', duration: 2.4, delay: .35, ease: 'power1.in', clearProps: 'backgroundColor,boxShadow' }));
    }, 300);
  },
  close() {
    const d = $('#textdrawer');
    if (!d || d.hidden) return;
    Gloss.close();
    if (this.home) this.home.append($('#reading'));
    d.hidden = true;
    document.body.classList.remove('kw-noscroll');
    if (this.opener && document.contains(this.opener)) this.opener.focus({ preventScroll: true });
  }
};

/* Stage 5 questions: one per screen; one try each, and the right answer shows straight after */
const ReadQ = {
  i: 0, picked: [], checked: false, results: [],
  reset() { this.i = 0; this.picked = []; this.checked = false; this.results = []; },
  enter() {
    if (this.results[this.i] !== undefined) this.i++;          // a question checked before leaving counts as done
    if (this.i >= READ_Q.length) { this.reset(); Reading.start(); }
    this.render();
  },
  render() {
    const q = READ_Q[this.i];
    this.picked = []; this.checked = false;
    qdots('#rq-dots', READ_Q.length, this.i);
    $('#rq-status').textContent = `Question ${this.i + 1} of ${READ_Q.length}`;
    const multi = q.type === 'multi';
    $('#rq-card').innerHTML = `
      <div class="dc-head"><span class="dc-ico">${UI.book}</span><span>Question ${this.i + 1} of ${READ_Q.length}</span>${multi ? `<span class="dc-meta">Tap ${q.pick}</span>` : ''}</div>
      <div class="q-row"><p class="question" id="rq-q">${escH(q.q)}</p><button type="button" class="read-btn" data-read="${q.id}" data-text="${escH(q.q)}" aria-label="Read the question aloud">${UI.speaker}</button></div>
      <div class="${multi ? 'chips-opts' : 'options'}" role="group" aria-labelledby="rq-q">
        ${q.options.map((o, k) => `<button type="button" class="choice ${multi ? 'chip' : 'row'}" data-k="${k}" aria-pressed="false">${escH(o)}</button>`).join('')}
      </div>
      <button type="button" class="btn primary check-btn" data-act="rq-check" disabled>Check</button>`;
    cardIn($('#rq-card'));
    this.sync();
  },
  pick(btn) {
    if (this.checked) return;
    const q = READ_Q[this.i], k = Number(btn.dataset.k);
    if (q.type === 'multi') {
      const at = this.picked.indexOf(k);
      if (at >= 0) this.picked.splice(at, 1);
      else { this.picked.push(k); if (this.picked.length > q.pick) this.picked.shift(); }
    } else this.picked = [k];
    $$('#rq-card .choice').forEach(b => b.setAttribute('aria-pressed', String(this.picked.includes(Number(b.dataset.k)))));
    if (!RM) gsap.fromTo(btn, { scale: .96 }, { scale: 1, duration: .3, ease: 'back.out(3)', clearProps: 'transform' });
    this.sync();
  },
  ready() { const q = READ_Q[this.i]; return this.picked.length === (q.pick || 1); },
  sync() {
    const last = this.i === READ_Q.length - 1, inCard = $('#rq-card [data-act="rq-check"]'), top = $('#rq-next');
    if (inCard) { inCard.disabled = this.checked || !this.ready(); inCard.hidden = this.checked; }
    top.disabled = !this.checked && !this.ready();
    top.textContent = this.checked ? (last ? 'See results' : 'Next question') : 'Check';
  },
  primary() { if (this.checked) return QSheet.next(); if (this.ready()) this.check(); },
  check() {
    const q = READ_Q[this.i], val = k => (q.type === 'multi' ? q.options[k] : k);
    const ok = this.picked.every(k => q.correct.includes(val(k)));
    this.checked = true;
    this.results[this.i] = ok;
    $$('#rq-card .choice').forEach(b => {
      const k = Number(b.dataset.k), isAns = q.correct.includes(val(k)), chosen = this.picked.includes(k);
      b.disabled = true;
      b.setAttribute('aria-pressed', String(chosen));
      if (chosen) b.classList.add(isAns ? 'is-right' : 'is-wrong');
      else if (isAns && !ok) b.classList.add('is-answer');
    });
    const wrongEls = $$('#rq-card .choice.is-wrong');
    if (ok) { SFX.good(); if (window.Motion) $$('#rq-card .choice.is-right').forEach(b => Motion.confetti(b, 10)); }
    else { SFX.bad(); buzz(); if (wrongEls.length) shake(wrongEls, 7); }
    postKW('read-answer', { question: q.id, picked: this.picked.map(k => q.options[k]), correct: ok });
    const last = this.i === READ_Q.length - 1;
    QSheet.show({ ok, title: ok ? praise() : 'Not quite', text: `The answer: ${q.answer}.`,
      note: `It's in ${q.where.toLowerCase()}. <button type="button" class="link-btn" data-act="see-text" data-para="${q.para.join(',')}">See it in the text</button>`,
      button: last ? 'See results' : 'Next question', onNext: () => this.next() });
    this.sync();
  },
  next() {
    QSheet.hide();
    this.i++;
    if (this.i >= READ_Q.length) { Reading.stop(); show('readdone'); return; }
    this.render();
    window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
  }
};
const ReadDone = {
  render() {
    const right = ReadQ.results.filter(Boolean).length;
    $('#rd-sub').textContent = `${right} of ${READ_Q.length} right. Here are the answers and where they are in the text.`;
    $('#rd-list').innerHTML = READ_Q.map((q, k) => `<li class="${ReadQ.results[k] ? 'ok' : 'fix'}"><span class="rd-mark" aria-label="${ReadQ.results[k] ? 'Right' : 'Not quite'}">${ReadQ.results[k] ? UI.check : UI.replay}</span><div><b>${escH(q.q)}</b><p>${escH(q.answer)}<span class="rd-where">${q.where}</span></p></div></li>`).join('');
    markStage('s5');
    postStage(5, { right, outOf: READ_Q.length });
  }
};

/* =========================================================
   This page: read -> readq (3 questions) -> readdone; 12 minutes for reading plus the questions
   ========================================================= */
Screens.enter = name => {
  $('#read-timer').hidden = !(name === 'read' || name === 'readq');
  if (name === 'readq') ReadQ.enter();
  if (name === 'readdone') ReadDone.render();
};
Screens.leave = () => { TextDrawer.close(); Gloss.close(); };
document.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t || t.disabled) return;
  if (t.classList.contains('gloss')) return Gloss.open(t);
  if (t.id === 'listen') return Reading.listen(t);
  if (t.dataset.act === 'show-text') return TextDrawer.open();
  if (t.dataset.act === 'see-text') return TextDrawer.open(t.dataset.para.split(','));
  if (t.id === 'td-close') return TextDrawer.close();
  if (t.classList.contains('choice')) return ReadQ.pick(t);
  if (t.dataset.act === 'rq-check' || t.id === 'rq-next') return ReadQ.primary();
  if (t.id === 'qs-next') return QSheet.next();
});
// a glossary bubble closes when you tap elsewhere; Escape closes the bubble or the passage drawer
document.addEventListener('click', e => { if (!e.target.closest('.gloss, #gloss-pop')) Gloss.close(); }, true);
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('#textdrawer').hidden) TextDrawer.close(); else Gloss.close();
});
$('#textdrawer').addEventListener('click', e => { if (e.target.id === 'textdrawer') TextDrawer.close(); });
fillIcons();
Reading.clock = makeClock($('#read-timer'), Reading.LIMIT / 1000);
Reading.build();
Voice.init();
startAt('read');
Reading.start();
Arrive.play();
