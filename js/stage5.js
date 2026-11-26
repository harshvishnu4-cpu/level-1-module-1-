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
    options: ['Hi', 'Hey', 'Hiya', 'Wave', 'Nod', 'Hug'], correct: ['Hi', 'Hey', 'Hiya'],
    answer: 'Any two of: hi, hey, hiya', where: 'Paragraph 1', para: [1], tip: 'The answer is in paragraph 1.',
    lines: ["Many people also say 'hi'.", "There are other informal greetings too, like 'hey' and 'hiya'."] },
  { id: 'rq2', q: 'What is a handshake used for, according to the text?', type: 'single',
    options: ['When people meet, and to show they agree on something', 'To say goodbye at the end of a phone call', 'Only to greet family members', 'To show who is the oldest person'],
    correct: [0], answer: 'When people meet, and to show they agree on something', where: 'Paragraph 3', para: [3], tip: 'The answer is in paragraph 3.',
    lines: ['People shake hands when they meet. They also shake hands to show that they agree on something.'] },
  { id: 'rq3', q: 'Is a handshake exactly the same in every culture? Give one difference.', type: 'single',
    options: ['Yes. It is the same everywhere.', 'No. In some places it is firm, and in other places it is gentle.', 'No. In some places people shake with their left hand.', 'No. In most places people shake hands with gloves on.'],
    correct: [1], answer: 'No. In some places it is firm, and in other places it is gentle.', where: 'Paragraphs 4–5', para: [4, 5], tip: 'The answer is in paragraphs 4–5.',
    lines: ['But it is not exactly the same everywhere. In some places, people give a firm handshake and hold the other hand tightly. In other places, a gentle handshake is more polite.'] }
];
const GLOSS_RE = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
const READ_TEXT = [READ_TITLE, ...READ_PARAS.map(p => p.replace(GLOSS_RE, '$1'))].join('\n\n');


const Gloss = {
  btn: null,
  open(btn) {
    if (this.btn === btn) return this.close();
    this.close();
    const pop = $('#gloss-pop'), card = $('#reading'), g = GLOSS[btn.dataset.g];
    if (!g || !pop) return;
    this.btn = btn;
    btn.setAttribute('aria-expanded', 'true');
    // a small dialog: the word, its kind, a speaker to hear it again, a close button, then the meaning
    pop.innerHTML = `<div class="gp-head"><div class="gp-word"><b>${g.w}</b><span class="gp-pos">${g.pos}</span></div>
      <button type="button" class="gp-say" data-act="gloss-say" data-w="${escH(btn.dataset.w)}" aria-label="Hear ${escH(g.w)} again">${UI.speaker}</button>
      <button type="button" class="gp-close" data-act="gloss-close" aria-label="Close">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'}</button></div>
      <p class="gp-mean">${escH(g.m)}</p>`;
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

/* Tap a word to hear it: each word is a span (glossary words are buttons, so the keyboard reaches the meanings).
   Clips are audio/w-<word>.mp3 in the narrator's voice (tools/generate-audio.mjs); the device voice fills any gap. */
const WORD_RE = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;
const wordId = w => `w-${w.toLowerCase().replace(/[^a-z]/g, '')}`;
const wordsHTML = s => {
  let out = '', last = 0;
  s.replace(WORD_RE, (w, at) => { out += escH(s.slice(last, at)) + `<span class="w" data-w="${escH(w)}">${escH(w)}</span>`; last = at + w.length; return w; });
  return out + escH(s.slice(last));
};
function passageHTML(p) {
  let out = '', last = 0;
  p.replace(GLOSS_RE, (m, word, key, at) => {
    out += wordsHTML(p.slice(last, at));
    out += `<button type="button" class="gloss" data-g="${(key || word).toLowerCase()}" data-w="${escH(word)}" aria-expanded="false" aria-controls="gloss-pop">${escH(word)}</button>`;
    last = at + m.length;
    return m;
  });
  return out + wordsHTML(p.slice(last));
}
function sayWord(el) {
  const w = el.dataset.w;
  $('#listen')?.classList.remove('is-playing');
  Voice.play(wordId(w), w);
  if (!RM && el.classList.contains('w')) gsap.fromTo(el, { backgroundColor: 'rgba(253,232,176,1)' }, { backgroundColor: 'rgba(253,232,176,0)', duration: 1, ease: 'power1.in', clearProps: 'backgroundColor' });
}
const Reading = {
  LIMIT: 12 * 60 * 1000, timer: null, clock: null,
  build() {
    // 4. no paragraph numbers; 5. every word can be tapped to hear it; glossary words also open their meaning
    $('#passage').innerHTML = READ_PARAS.map((p, i) => `<p data-para="${i + 1}">${passageHTML(p)}</p>`).join('');
    $('#read-title').innerHTML = wordsHTML(READ_TITLE);
    markLines();
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
/* Hints in the passage: the answer paragraph(s) after a 1st wrong try, the exact line(s) after a 2nd.
   The lines are wrapped in <mark class="rq-line" data-q="rq1"> once the passage is built. */
function markLine(p, text, key) {
  const walk = document.createTreeWalker(p, NodeFilter.SHOW_TEXT), nodes = [];
  let full = '';
  while (walk.nextNode()) { nodes.push([walk.currentNode, full.length]); full += walk.currentNode.data; }
  const at = full.indexOf(text);
  if (at < 0) return false;
  const end = at + text.length;
  const sIdx = nodes.findIndex(([n, s]) => s <= at && at < s + n.data.length);
  let eIdx = -1; nodes.forEach(([n, s], k) => { if (s < end) eIdx = k; });
  const [sn, ss] = nodes[sIdx], [en, es] = nodes[eIdx], range = document.createRange();
  if (at - ss === 0 && sn.parentNode !== p) range.setStartBefore(sn.parentNode); else range.setStart(sn, at - ss);
  if (end - es === en.data.length && en.parentNode !== p) range.setEndAfter(en.parentNode); else range.setEnd(en, end - es);
  const m = document.createElement('mark');
  m.className = 'rq-line';
  m.dataset.q = key;
  m.append(range.extractContents());
  range.insertNode(m);
  return true;
}
function markLines() {
  READ_Q.forEach(q => q.lines.forEach(line => {
    const p = q.para.map(n => $(`#passage p[data-para="${n}"]`)).find(el => el && el.textContent.includes(line));
    if (!p || !markLine(p, line, q.id)) console.warn('hint line not found:', line);
  }));
}
const Hint = {
  clear() { $$('#passage p.is-hint, #passage .rq-line.is-hint').forEach(el => el.classList.remove('is-hint')); },
  show(els) {
    els.forEach(el => el.classList.add('is-hint'));
    const first = els[0];
    if (!first) return;
    const go = () => first.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
    if (SidePassage.active()) return go();
    TextDrawer.open();                          // phones: the passage panel opens over the question
    setTimeout(go, 380);
  },
  paras(q) { this.clear(); this.show(q.para.map(n => $(`#passage p[data-para="${n}"]`)).filter(Boolean)); },
  lines(q) { this.clear(); this.show($$(`#passage .rq-line[data-q="${q.id}"]`)); }
};
const RQ_PRAISE = ['Great job!', 'Nicely done!', 'Spot on!', 'Well done!', 'You got it!'];
const RQ_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>';
/* What the analysis page needs, saved with the rest of the progress */
function saveReading() {
  const d = Store.get(), prev = (d.results || {}).reading || [];
  const reading = READ_Q.map((q, k) => {
    const old = prev.find(r => r.id === q.id), now = ReadQ.first[k];
    if (old) return now && ReadQ.results[k] !== undefined ? { ...old, solved: true } : old;     // the first ever try stays
    return now ? { id: q.id, question: q.q, source: 'Reading Card', skill: 'Reading for detail', correct: q.answer, tip: q.tip,
      first: now.answer, firstRight: now.right, solved: ReadQ.results[k] !== undefined } : null;
  }).filter(Boolean);
  Store.set({ results: { ...(d.results || {}), reading } });
}
const ReadQ = {
  i: 0, picked: [], tries: 0, done: false, wait: null, results: [], first: [],
  reset() { this.cancel(); this.i = 0; this.picked = []; this.tries = 0; this.done = false; this.results = []; this.first = []; Hint.clear(); },
  cancel() { clearTimeout(this.wait); this.wait = null; },
  enter() {
    if (this.results[this.i] !== undefined) this.i++;          // a question finished before leaving counts as done
    if (this.i >= READ_Q.length) { this.reset(); Reading.start(); }
    this.render();
  },
  render() {
    this.cancel();
    Hint.clear();
    const q = READ_Q[this.i], multi = q.type === 'multi';
    this.picked = []; this.tries = 0; this.done = false;
    qdots('#rq-dots', READ_Q.length, this.i);
    $('#rq-status').textContent = `Question ${this.i + 1} of ${READ_Q.length}`;
    $('#rq-card').innerHTML = `
      <div class="dc-head"><span class="dc-ico">${UI.book}</span><span>Question ${this.i + 1} of ${READ_Q.length}</span><span class="dc-meta rq-tries" role="img" aria-label="3 tries left"><i></i><i></i><i></i></span></div>
      <div class="q-row"><p class="question" id="rq-q">${escH(q.q)}</p><button type="button" class="read-btn" data-read="${q.id}" data-text="${escH(q.q)}" aria-label="Read the question aloud">${UI.speaker}</button></div>
      ${multi ? '<p class="rq-how">Choose two, then press Check.</p>' : ''}
      <div class="${multi ? 'chips-opts' : 'options'}" role="group" aria-labelledby="rq-q">
        ${q.options.map((o, k) => `<button type="button" class="choice ${multi ? 'chip' : 'row'}" data-k="${k}" aria-pressed="false">${escH(o)}</button>`).join('')}
      </div>
      <div class="rq-fb" id="rq-fb" aria-live="polite" hidden></div>
      ${multi ? '<button type="button" class="btn primary check-btn" data-act="rq-check" disabled>Check</button>' : ''}`;
    cardIn($('#rq-card'));
    this.sync();
  },
  /* single choice: a tap is the answer; choose two: pick two, then Check */
  pick(btn) {
    if (this.done || this.wait || btn.disabled) return;
    const q = READ_Q[this.i], k = Number(btn.dataset.k);
    if (q.type === 'multi') {
      const at = this.picked.indexOf(k);
      if (at >= 0) this.picked.splice(at, 1);
      else { this.picked.push(k); if (this.picked.length > q.pick) this.picked.shift(); }
    } else this.picked = [k];
    $$('#rq-card .choice').forEach(b => b.setAttribute('aria-pressed', String(this.picked.includes(Number(b.dataset.k)))));
    if (!RM) gsap.fromTo(btn, { scale: .96 }, { scale: 1, duration: .3, ease: 'back.out(3)', clearProps: 'transform' });
    if (q.type !== 'multi') return this.check();
    this.sync();
  },
  ready() { const q = READ_Q[this.i]; return this.picked.length === (q.pick || 1); },
  sync() {
    const c = $('#rq-card [data-act="rq-check"]'), top = $('#rq-next'), last = this.i === READ_Q.length - 1;
    if (c) { c.disabled = this.done || !!this.wait || !this.ready(); c.hidden = this.done; }
    top.disabled = !this.done && (!!this.wait || !this.ready());
    top.textContent = this.done ? (last ? 'Finish' : 'Next question') : 'Check';
  },
  primary() { if (this.i >= READ_Q.length) return; if (this.done) return this.next(); if (!this.wait && this.ready()) this.check(); },
  check() {
    const q = READ_Q[this.i], val = k => (q.type === 'multi' ? q.options[k] : k);
    const ok = this.picked.every(k => q.correct.includes(val(k)));
    this.tries++;
    if (this.tries === 1) this.first[this.i] = { answer: this.picked.map(k => q.options[k]).join(' + '), right: ok };   // only the first try counts
    postKW('read-answer', { question: q.id, picked: this.picked.map(k => q.options[k]), correct: ok, attempt: this.tries });
    const opts = $$('#rq-card .choice');
    opts.forEach(b => { b.disabled = true; });
    if (ok) {
      this.done = true;
      opts.forEach(b => { if (this.picked.includes(Number(b.dataset.k))) b.classList.add('is-right'); });
      SFX.good();
      if (this.tries === 1 && window.Motion) $$('#rq-card .choice.is-right').forEach(b => Motion.confetti(b, 12));
      if (this.tries === 1) this.feedback('ok', RQ_PRAISE[Math.floor(Math.random() * RQ_PRAISE.length)], '', true);
      else this.feedback('ok', 'Correct.', 'You found it in the text.', true);
      return this.finish();
    }
    const wrong = opts.filter(b => this.picked.includes(Number(b.dataset.k)) && !q.correct.includes(val(Number(b.dataset.k))));
    wrong.forEach(b => b.classList.add('is-wrong'));
    SFX.bad(); buzz();
    if (wrong.length) shake(wrong, 7);
    this.markTry();
    if (this.tries === 1) { this.feedback('bad', 'Not quite.', `Read the highlighted ${q.para.length > 1 ? 'paragraphs' : 'paragraph'}.`); Hint.paras(q); }
    else if (this.tries === 2) { this.feedback('bad', 'Not yet.', 'Look at the highlighted line.'); Hint.lines(q); }
    else this.feedback('bad', 'Not this time.', '');
    this.wait = setTimeout(() => { this.wait = null; if (this.tries >= 3) this.reveal(); else this.retry(); }, 1700);
    this.sync();
  },
  /* between tries: a wrong single choice is greyed out; for "choose two" every chip resets */
  retry() {
    const multi = READ_Q[this.i].type === 'multi';
    $$('#rq-card .choice').forEach(b => {
      b.setAttribute('aria-pressed', 'false');
      if (b.classList.contains('is-wrong')) { b.classList.remove('is-wrong'); if (!multi) { b.classList.add('is-out'); return; } }
      if (!b.classList.contains('is-out')) b.disabled = false;
    });
    this.picked = [];
    this.sync();
  },
  reveal() {
    const q = READ_Q[this.i], val = k => (q.type === 'multi' ? q.options[k] : k);
    this.done = true;
    $$('#rq-card .choice').forEach(b => {
      b.disabled = true;
      b.classList.remove('is-wrong');
      b.setAttribute('aria-pressed', 'false');
      if (q.correct.includes(val(Number(b.dataset.k)))) { b.classList.remove('is-out'); b.classList.add('is-right'); }
    });
    this.feedback('reveal', 'Here’s the answer.', q.type === 'multi' ? 'Any two of the green words are right.' : 'It’s highlighted in green.', true);
    this.finish();
  },
  finish() {
    this.results[this.i] = !!(this.first[this.i] && this.first[this.i].right);
    saveReading();
    this.sync();
  },
  feedback(kind, title, body, next) {
    const fb = $('#rq-fb'), last = this.i === READ_Q.length - 1;
    fb.className = `rq-fb ${kind}`;
    fb.innerHTML = `<span class="rq-fb-ico" aria-hidden="true">${kind === 'bad' ? RQ_X : kind === 'ok' ? UI.check : UI.bulb}</span>
      <div class="rq-fb-text"><b>${title}</b>${body ? `<p>${body}</p>` : ''}</div>
      ${next ? `<button type="button" class="btn primary rq-go" data-act="rq-go">${last ? 'Finish' : 'Next question'}</button>` : ''}`;
    fb.hidden = false;
    if (!RM) gsap.fromTo(fb, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .3, ease: 'power2.out', clearProps: 'transform,opacity,visibility' });
    if (next) setTimeout(() => $('#rq-fb .rq-go')?.focus({ preventScroll: true }), 120);
  },
  /* the three dots: each wrong try turns one into a cross */
  markTry() {
    const dot = $$('#rq-card .rq-tries i')[this.tries - 1];
    if (dot) { dot.classList.add('x'); dot.innerHTML = RQ_X; if (!RM) gsap.fromTo(dot, { scale: .3 }, { scale: 1, duration: .4, ease: 'back.out(3)', clearProps: 'transform' }); }
    $('#rq-card .rq-tries')?.setAttribute('aria-label', `${Math.max(0, 3 - this.tries)} ${3 - this.tries === 1 ? 'try' : 'tries'} left`);
  },
  next() {
    this.cancel();
    Hint.clear();
    TextDrawer.close();
    this.i++;
    if (this.i >= READ_Q.length) { Reading.stop(); show('readdone'); return; }
    this.render();
  }
};
const ReadDone = {
  render() {
    const right = ReadQ.results.filter(Boolean).length;
    $('#rd-sub').textContent = `${right} of ${READ_Q.length} right first time. Here are the answers and where they are in the text.`;
    $('#rd-list').innerHTML = READ_Q.map((q, k) => `<li class="${ReadQ.results[k] ? 'ok' : 'fix'}"><span class="rd-mark" aria-label="${ReadQ.results[k] ? 'Right first time' : 'Not right first time'}">${ReadQ.results[k] ? UI.check : UI.replay}</span><div><b>${escH(q.q)}</b><p>${escH(q.answer)}<span class="rd-where">${q.where}</span></p></div></li>`).join('');
    markStage('s5');
    postStage(5, { right, outOf: READ_Q.length });
    if (!RM) {
      gsap.fromTo('[data-screen="readdone"] .done-title', { scale: .7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .55, ease: 'back.out(2.2)', delay: .25 });
      if (right === READ_Q.length && window.Motion) setTimeout(() => Motion.confetti($('[data-screen="readdone"] .done-title'), 36), 520);
    }
  }
};

/* =========================================================
   This page: read -> readq (3 questions) -> readdone; 12 minutes for reading plus the questions
   ========================================================= */
/* Questions on wide screens: the passage sits on the right while you answer (on phones, Show text opens it) */
const SidePassage = {
  mq: matchMedia('(min-width: 56.25em)'),
  show() { if (!this.mq.matches) return; const side = $('#rq-side'), art = $('#reading'); if (side && art.parentElement !== side) { Gloss.close(); side.append(art); } },
  restore() { const art = $('#reading'), home = $('.read-home'); if (art.parentElement !== home) { Gloss.close(); home.append(art); } },
  active() { return !!$('#reading').closest('#rq-side'); },
  /* "See it in the text": scroll the passage on the right to the paragraph and light it up */
  flash(paras) {
    const ps = paras.map(n => $(`#passage p[data-para="${n}"]`)).filter(Boolean);
    if (!ps.length) return;
    ps[0].scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
    ps.forEach(p => gsap.fromTo(p, { backgroundColor: 'rgba(253,232,176,1)', boxShadow: '0 0 0 8px rgba(253,232,176,1)' }, { backgroundColor: 'rgba(253,232,176,0)', boxShadow: '0 0 0 8px rgba(253,232,176,0)', duration: 2.4, delay: .35, ease: 'power1.in', clearProps: 'backgroundColor,boxShadow' }));
  }
};
SidePassage.mq.addEventListener('change', () => { if (cur !== 'readq') return; if (SidePassage.mq.matches) { TextDrawer.close(); SidePassage.show(); } else SidePassage.restore(); });
Screens.enter = name => {
  if (name === 'readq') SidePassage.show();
  $('#read-timer').hidden = !(name === 'read' || name === 'readq');
  if (name === 'readq') ReadQ.enter();
  if (name === 'readdone') ReadDone.render();
};
Screens.leave = name => { TextDrawer.close(); Gloss.close(); if (name === 'readq') { SidePassage.restore(); if (ReadQ.wait) { ReadQ.cancel(); if (ReadQ.tries >= 3) ReadQ.reveal(); else ReadQ.retry(); } } };
document.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t || t.disabled) return;
  if (t.classList.contains('gloss')) { sayWord(t); return Gloss.open(t); }
  if (t.dataset.act === 'gloss-say') { const w = t.dataset.w; if (!RM) gsap.fromTo(t, { scale: .88 }, { scale: 1, duration: .35, ease: 'back.out(3)', clearProps: 'transform' }); return Voice.play(wordId(w), w); }
  if (t.dataset.act === 'gloss-close') return Gloss.close();
  if (t.id === 'listen') return Reading.listen(t);
  if (t.dataset.act === 'show-text') return SidePassage.active() ? SidePassage.flash([1]) : TextDrawer.open();
  if (t.dataset.act === 'see-text') return SidePassage.active() ? SidePassage.flash(t.dataset.para.split(',')) : TextDrawer.open(t.dataset.para.split(','));
  if (t.id === 'td-close') return TextDrawer.close();
  if (t.classList.contains('choice')) return ReadQ.pick(t);
  if (t.dataset.act === 'rq-check' || t.id === 'rq-next') return ReadQ.primary();
  if (t.dataset.act === 'rq-go') return ReadQ.next();
  if (t.id === 'qs-next') return QSheet.next();
});
document.addEventListener('click', e => { const w = e.target.closest('.passage .w, .reading-title .w'); if (w) sayWord(w); });
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
