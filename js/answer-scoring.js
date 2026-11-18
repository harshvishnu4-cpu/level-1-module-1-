/*
  Offline scoring for free answers (written and spoken). Pure functions, no DOM.
  Browser: window.AnswerScore. Node: require('./answer-scoring.js') for tests.

  What it can judge on the device: length or duration, which key points are covered, common grammar slips,
  structure for the format (email, summary, opinion, reply), tone, word variety, and for speech: pace,
  fillers, long pauses and clarity (from recognition confidence). It cannot judge meaning the way a
  person or an AI model can; the pages ask the AI for that when online, and merge the two.
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AnswerScore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CONFIG = {
    paceWpm: [100, 150],        // comfortable speaking pace for an answer (tune per level)
    fillersPerMinOk: 2,
    longPauseSec: 1.5,          // a silence this long between words counts as a long pause
    clearConf: 0.8,             // a recognised word at or above this confidence counts as clearly spoken
    copyShare: 0.4,             // a summary sharing this much of its 5-word runs with the passage is copied
  };
  const LEVELS = [[14, 'Strong'], [11, 'Good'], [8, 'Developing'], [0, 'Beginning']];

  // ---------- text ----------
  const norm = w => String(w).toLowerCase().replace(/[‘’`]/g, "'").replace(/[^a-z0-9']/g, '').replace(/^'+|'+$/g, '');
  const tokens = text => String(text).split(/\s+/).map(raw => ({ raw, n: norm(raw) })).filter(t => t.n);
  const stem = w => w.replace(/(ing|ed|es|s)$/, '') || w;
  const sentences = text => String(text).replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=[A-Za-z"“])/).filter(s => s.trim());

  // a cue is a word or phrase; matched on word stems so "apologise" finds "apologised", and a cue
  // ending in a partial word ("apologi", "confiden") matches any word starting with it
  function findCue(toks, cue) {
    const parts = cue.toLowerCase().trim().split(/\s+/).map(norm).filter(Boolean);
    const partial = /[a-z]$/.test(cue.trim()) && !/\s$/.test(cue) && parts.length === 1 && parts[0].length >= 6;
    for (let i = 0; i + parts.length <= toks.length; i++) {
      let ok = true;
      for (let k = 0; k < parts.length && ok; k++) {
        const t = toks[i + k].n, p = parts[k];
        ok = t === p || stem(t) === stem(p) || (partial && k === parts.length - 1 && t.startsWith(p));
      }
      if (ok) return toks.slice(i, i + parts.length).map(t => t.raw).join(' ');
    }
    return null;
  }
  function coverage(task, toks) {
    return task.keyPoints.map(kp => {
      for (const c of kp.cues) { const ev = findCue(toks, c); if (ev) return { label: kp.label, hit: true, evidence: ev }; }
      return { label: kp.label, hit: false };
    });
  }

  // ---------- common slips (Indian English learners) ----------
  // kind: 'grammar' counts as an error; 'tip' is advice only (often fine in Indian English).
  const DAYS = 'monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|june|july|august|september|october|november|december';
  const PAST = { go: 'went', play: 'played', watch: 'watched', visit: 'visited', eat: 'ate', meet: 'met', see: 'saw', come: 'came', do: 'did', cook: 'cooked', buy: 'bought', help: 'helped', stay: 'stayed', read: 'read', enjoy: 'enjoyed', have: 'had', take: 'took', make: 'made' };
  const RULES = [
    { id: 'myself-name', kind: 'grammar', re: /(^|[.!?]\s+|\b(?:sir|madam|ma'am|morning|afternoon|evening|hello|hi|everyone)[,.]?\s+)(myself)\s+(?=[A-Za-z])/gi, fix: m => m[1] + (/^$|[.!?]\s+$/.test(m[1]) ? 'My name is ' : 'my name is '), show: () => 'My name is …', quote: m => m[2] + ' …',
      msg: 'Start with “My name is …” or “I am …”. “Myself” can’t begin a sentence in English.' },
    { id: 'lowercase-i', kind: 'grammar', minor: true, written: true, re: /(^|[^A-Za-z'’])(i)(?=[\s'’,.!?]|$)/g, fix: m => m[1] + 'I', quote: () => 'i',
      msg: 'Write “I” as a capital letter.' },
    { id: 'day-capital', kind: 'grammar', minor: true, written: true, re: new RegExp(`\\b(${DAYS})\\b`, 'g'), fix: m => m[1][0].toUpperCase() + m[1].slice(1),
      msg: 'Days and months start with a capital letter.' },
    { id: 'repeat-word', kind: 'grammar', written: true, re: /\b([A-Za-z]+)\s+\1\b/gi, skip: m => /^(very|so|bye|ha|no)$/i.test(m[1]), fix: m => m[1],
      msg: 'The same word is written twice.' },
    { id: 'a-an', kind: 'grammar', re: /\b([Aa])\s+(?![A-Z]{2})(?!(?:[Uu]ni|[Uu]se|[Uu]su|[Oo]ne|[Oo]nce|[Ee]uro))([aeiouAEIOU][a-z]*)\b/g, fix: m => (m[1] === 'A' ? 'An ' : 'an ') + m[2],
      msg: 'Use “an” before a vowel sound.' },
    { id: 'an-a', kind: 'grammar', re: /\b([Aa]n)\s+(?![A-Z]{2})(?!(?:[Hh]our|[Hh]onest|[Hh]onou?r|[Hh]eir))([b-df-hj-np-tv-zB-DF-HJ-NP-TV-Z][a-z]*)\b/g, fix: m => (m[1] === 'An' ? 'A ' : 'a ') + m[2],
      msg: 'Use “a” before a consonant sound.' },
    { id: 'inform-that', kind: 'grammar', re: /\b(inform(?:ed)?)\s+that\b/gi, fix: m => m[1] + ' you that', msg: '“Inform” needs a person: “inform you that”.' },
    { id: 'on-next', kind: 'grammar', re: new RegExp(`\\bon\\s+(next|last)\\s+(${DAYS}|week|month)\\b`, 'gi'), fix: m => `${m[1]} ${m[2]}`,
      msg: 'Say “next Friday”, not “on next Friday”.' },
    { id: 'discuss-about', kind: 'grammar', re: /\b(discuss)\s+about\b/gi, fix: m => m[1], msg: '“Discuss” doesn’t need “about”.' },
    { id: 'uncountable', kind: 'grammar', re: /\b(advices|informations|furnitures|equipments|luggages|feedbacks)\b/gi, fix: m => m[1].replace(/s$/i, ''),
      msg: 'This word has no plural form.' },
    { id: 'works', kind: 'grammar', re: /\b(pending|my|our|your|the|office|all)\s+works\b/gi, fix: m => `${m[1]} work`, msg: '“Work” (meaning tasks) has no plural.' },
    { id: 'since-years', kind: 'grammar', re: /\bsince\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|many|few)\s+(years?|months?|weeks?|days?)\b/gi, fix: m => `for ${m[1]} ${m[2]}`,
      msg: 'Use “for” with a length of time, “since” with a starting point.' },
    { id: 'can-able', kind: 'grammar', re: /\bcan\s+able\s+to\b/gi, fix: () => 'can', msg: 'Say “can” or “am able to”, not both.' },
    { id: 'dont-3rd', kind: 'grammar', re: /\b(he|she|it)\s+don'?t\b/gi, fix: m => `${m[1]} doesn't`, msg: 'Use “doesn’t” with he, she and it.' },
    { id: 'am-agree', kind: 'grammar', re: /\b(i|we|they|you)\s+(am|are)\s+agree\b/gi, fix: m => `${m[1]} agree`, msg: '“Agree” is a verb: “I agree”.' },
    { id: 'more-better', kind: 'grammar', re: /\b(more|most)\s+(better|best|worse|worst)\b/gi, fix: m => m[2], msg: '“Better” already means “more good”.' },
    { id: 'doubled-meaning', kind: 'grammar', re: /\b(return|repeat|revert)\s+(back|again)\b/gi, fix: m => m[1], msg: 'The second word repeats the meaning.' },
    { id: 'cope-up', kind: 'grammar', re: /\bcope\s+up\s+with\b/gi, fix: () => 'cope with', msg: 'Say “cope with”.' },
    { id: 'having-doubt', kind: 'tip', re: /\bI\s+am\s+having\s+(a\s+)?(doubt|query)\b/gi, fix: () => 'I have a question', msg: '“I have a question” is clearer for most listeners.' },
    { id: 'do-needful', kind: 'tip', re: /\bdo\s+the\s+needful\b/gi, fix: () => 'help with this', msg: 'Say exactly what you need, e.g. “please approve my leave”.' },
    { id: 'respected-sir', kind: 'tip', written: true, re: /\bRespected\s+(Sir|Madam)\b/gi, fix: () => 'Dear Mr …', msg: '“Respected Sir” is fine in India; in business emails “Dear Mr Sharma” is more common.' },
  ];
  // simple past-time check: "yesterday / last weekend … I go" → "I went"
  function pastTenseHits(text) {
    const hits = [];
    for (const s of sentences(text)) {
      if (!/\b(yesterday|last\s+(week|weekend|night|year|month|sunday|saturday)|ago)\b/i.test(s)) continue;
      const re = /\b(I|we|they)\s+(go|play|watch|visit|eat|meet|see|come|do|cook|buy|help|stay|enjoy|have|take|make)\b/gi;
      let m;
      while ((m = re.exec(s))) hits.push({ id: 'past-tense', kind: 'grammar', quote: m[0], fix: `${m[1]} ${PAST[m[2].toLowerCase()]}`, msg: 'This happened in the past, so use the past form.' });
    }
    return hits;
  }
  function grammarHits(text, { written }) {
    const hits = [];
    for (const r of RULES) {
      if (r.written && !written) continue;
      r.re.lastIndex = 0;
      let m;
      while ((m = r.re.exec(text))) {
        if (r.skip && r.skip(m)) continue;
        const quote = r.quote ? r.quote(m) : m[0].replace(/^[^A-Za-z]+/, '');
        hits.push({ id: r.id, kind: r.kind, minor: !!r.minor, quote: quote.trim(), fix: (r.show ? r.show(m) : r.fix(m)).trim(), msg: r.msg, index: m.index, length: m[0].length, raw: m[0], repl: r.fix(m) });
        if (m[0].length === 0) r.re.lastIndex++;
      }
    }
    if (written) {
      // a sentence that starts with a small letter
      let pos = 0;
      for (const s of sentences(text)) {
        const at = text.indexOf(s, pos); pos = at + s.length;
        const first = s.match(/[A-Za-z]/);
        if (first && first[0] !== first[0].toUpperCase() && !/^i\b/.test(s)) hits.push({ id: 'sentence-capital', kind: 'grammar', minor: true, quote: s.split(/\s+/).slice(0, 3).join(' '), fix: s.replace(/[a-z]/, c => c.toUpperCase()).split(/\s+/).slice(0, 3).join(' '), msg: 'Start each sentence with a capital letter.', index: at + s.indexOf(first[0]), length: 1, raw: first[0], repl: first[0].toUpperCase() });
      }
    }
    return [...hits, ...pastTenseHits(text)];
  }
  // apply the counted fixes to make a corrected version (mechanical, offline)
  function correct(text, hits, written = true) {
    let out = text;
    for (let pass = 0; pass < 4; pass++) {
      const hs = pass === 0 ? hits : grammarHits(out, { written });
      const edits = hs.filter(h => h.kind === 'grammar' && h.index !== undefined).sort((a, b) => b.index - a.index);
      let next = out, last = Infinity;
      for (const e of edits) {
        if (e.index + e.length > last) continue; // overlapping: the next pass picks it up
        next = next.slice(0, e.index) + e.repl + next.slice(e.index + e.length);
        last = e.index;
      }
      for (const h of hs.filter(h => h.id === 'past-tense')) next = next.replace(h.quote, h.fix);
      if (next === out) break;
      out = next;
    }
    return out;
  }
  // count slips (capital letters weigh half) and group repeats of the same slip into one tip, most important first
  const weightOf = errors => errors.reduce((s, e) => s + (e.minor ? 0.5 : 1), 0);
  function groupedFixes(errors) {
    const groups = [];
    for (const e of errors) { const g = groups.find(x => x.id === e.id); if (g) g.items.push(e); else groups.push({ id: e.id, minor: e.minor, items: [e] }); }
    groups.sort((a, b) => (a.minor === b.minor ? 0 : a.minor ? 1 : -1));
    return groups.map(g => ({ quote: g.items.slice(0, 2).map(e => e.quote).join(', '), better: g.items.slice(0, 2).map(e => e.fix).join(', '), why: g.items[0].msg }));
  }

  // ---------- structure for each format ----------
  const INFORMAL = ['hey', 'gonna', 'wanna', 'pls', 'plz', 'u', 'ur', 'thx', 'yaar', 'bro', 'dude', 'lol'];
  function structure(task, text, toks) {
    const checks = [];
    const firstWords = toks.slice(0, 8).map(t => t.n).join(' ');
    const lastWords = toks.slice(-12).map(t => t.n).join(' ');
    const sents = sentences(text);
    if (task.format === 'email' || task.format === 'reply') {
      checks.push({ label: 'a greeting', ok: /\b(dear|hi|hello|respected|good morning|good afternoon|good evening)\b/.test(firstWords) });
      checks.push({ label: 'a polite closing', ok: /\b(regards|thank you|thanking you|thanks|sincerely|yours|best wishes|warm wishes)\b/.test(lastWords) });
      if (task.format === 'email') checks.push({ label: 'a subject line', ok: /^\s*subject\s*:/i.test(text), optional: true });
    }
    if (task.format === 'summary') {
      checks.push({ label: '2 or 3 sentences', ok: sents.length >= 2 && sents.length <= 4 });
    }
    if (task.format === 'opinion') {
      checks.push({ label: 'a clear opinion first', ok: /\b(i think|i believe|in my opinion|i feel|i agree|i disagree|should)\b/.test(toks.slice(0, 20).map(t => t.n).join(' ')) });
      checks.push({ label: 'linking words between reasons', ok: /\b(also|secondly|second|another|moreover|besides|finally|however)\b/.test(toks.map(t => t.n).join(' ')) });
    }
    if (!checks.length) checks.push({ label: 'complete sentences', ok: sents.length >= 2 });
    return checks;
  }
  // share of the answer's 5-word runs that also appear in the passage
  function copiedShare(answerToks, passage) {
    if (!passage) return 0;
    const runs = ts => { const s = new Set(); for (let i = 0; i + 5 <= ts.length; i++) s.add(ts.slice(i, i + 5).map(t => t.n).join(' ')); return s; };
    const a = runs(answerToks), p = runs(tokens(passage));
    if (!a.size) return 0;
    let same = 0; for (const r of a) if (p.has(r)) same++;
    return same / a.size;
  }
  // content words used three or more times
  const STOP = new Set('a an the and or but so to of in on at for with from by is am are was were be been i you he she it we they my your his her our their me him us them this that these those will would can could should do did not no yes have has had as if when then there here very also just'.split(' '));
  function overused(toks, task) {
    const counts = {};
    const taskWords = new Set(tokens(task.prompt + ' ' + task.keyPoints.flatMap(k => k.cues).join(' ')).map(t => stem(t.n)));
    for (const t of toks) if (!STOP.has(t.n) && t.n.length > 3 && !taskWords.has(stem(t.n))) counts[t.n] = (counts[t.n] || 0) + 1;
    return Object.entries(counts).filter(([, c]) => c >= 3).map(([w]) => w);
  }

  // ---------- scoring ----------
  const level = total => LEVELS.find(([min]) => total >= min)[1];
  const band = (v, steps) => steps.find(([min]) => v >= min)[1];

  function evaluateWritten(task, text) {
    const toks = tokens(text), n = toks.length;
    const cov = coverage(task, toks), hitShare = cov.filter(c => c.hit).length / cov.length;
    const lengthOk = n >= task.minWords && n <= task.maxWords;
    const hits = grammarHits(text, { written: true });
    const errors = hits.filter(h => h.kind === 'grammar');
    const per100 = n ? (weightOf(errors) / n) * 100 : 0;
    const struct = structure(task, text, toks);
    const required = struct.filter(c => !c.optional), missing = required.filter(c => !c.ok);
    const copied = copiedShare(toks, task.passage);
    const informal = task.formal ? toks.filter(t => INFORMAL.includes(t.n)).map(t => t.raw) : [];
    const over = overused(toks, task);

    let content = hitShare === 1 && lengthOk ? 4 : hitShare >= 0.75 && n >= task.minWords * 0.6 ? 3 : hitShare >= 0.5 ? 2 : 1;
    if (copied >= CONFIG.copyShare) content = Math.min(content, 2);
    const organisation = missing.length === 0 ? (struct.some(c => c.optional && !c.ok) ? 3 : 4) : missing.length === 1 ? 3 : missing.length === 2 ? 2 : 1;
    const grammar = n < 10 ? 1 : band(-per100, [[-1.5, 4], [-4, 3], [-10, 2], [-Infinity, 1]]);
    let vocab = 4 - Math.min(2, over.length) - (informal.length ? 1 : 0);
    if (n < task.minWords * 0.5) vocab = Math.min(vocab, 2);
    vocab = Math.max(1, vocab);

    const criteria = [
      { id: 'task', label: 'Task and content', score: content,
        reason: `${cov.filter(c => c.hit).length} of ${cov.length} key points; ${n} words (aim ${task.minWords}–${task.maxWords})${copied >= CONFIG.copyShare ? '; much of it copied from the passage' : ''}` },
      { id: 'organisation', label: 'Organisation', score: organisation,
        reason: missing.length ? `Missing ${missing.map(m => m.label).join(' and ')}` : struct.some(c => c.optional && !c.ok) ? `Good order; no ${struct.find(c => c.optional && !c.ok).label}` : 'Clear order with everything the format needs' },
      { id: 'grammar', label: 'Grammar', score: grammar,
        reason: errors.length ? `${errors.length} slip${errors.length === 1 ? '' : 's'} found, e.g. “${errors[0].quote}”` : 'No common slips found' },
      { id: 'vocabulary', label: 'Vocabulary and tone', score: vocab,
        reason: informal.length ? `Informal words for this reader: ${informal.slice(0, 3).join(', ')}` : over.length ? `Repeated words: ${over.slice(0, 3).join(', ')}` : 'Suitable words and tone' },
    ];

    const improve = [];
    const missedPoints = cov.filter(c => !c.hit);
    if (copied >= CONFIG.copyShare) improve.push({ why: 'Much of this is copied from the passage. Say the same ideas in your own words.' });
    if (missedPoints.length) improve.push({ why: `Add ${missedPoints.map(p => p.label).join(' and ')}.` });
    for (const f of groupedFixes(errors).slice(0, 2)) improve.push(f);
    if (n < task.minWords) improve.push({ why: `It’s a bit short: ${n} words. Aim for ${task.minWords}–${task.maxWords}.` });
    if (n > task.maxWords) improve.push({ why: `It’s a bit long: ${n} words. Aim for ${task.minWords}–${task.maxWords}.` });
    for (const m of missing) improve.push({ why: `Add ${m.label}.` });
    if (informal.length) improve.push({ quote: informal[0], why: 'This word is too casual for this reader.' });

    const well = [];
    if (cov.filter(c => c.hit).length) well.push(`You covered ${cov.filter(c => c.hit).map(c => c.label).join(', ')}.`);
    if (!missing.length) well.push('Your answer has everything this format needs.');
    if (!errors.length && n >= 10) well.push('No common grammar slips.');
    if (lengthOk) well.push('A good length.');

    return finish({ mode: 'write', task, criteria, improve, well, tips: hits.filter(h => h.kind === 'tip'), corrected: correct(text, hits, true), coverage: cov, stats: { words: n, errors: errors.length, copied } });
  }

  // heard: [{word, conf, start, end}] from on-device speech recognition; silences: [{from, to}]
  const FILLERS = new Set(['um', 'umm', 'uh', 'uhh', 'er', 'erm', 'ah', 'hmm', 'mm', 'matlab', 'yaani', 'accha', 'haan']);
  function evaluateSpoken(task, heard, { silences = [], durationSec = null, snrDb = null } = {}) {
    const words = (heard || []).filter(w => w.word && w.word !== '[unk]');
    const toks = words.map(w => ({ raw: w.word, n: norm(w.word) })).filter(t => t.n);
    const fillers = toks.filter(t => FILLERS.has(t.n));
    const spoken = toks.filter(t => !FILLERS.has(t.n));
    const transcript = toks.map(t => t.raw).join(' ');
    const first = words.length ? words[0].start : 0, last = words.length ? words[words.length - 1].end : 0;
    const speechSec = Math.max(0, last - first);
    const total = durationSec ?? speechSec;
    const minutes = Math.max(speechSec, 1) / 60;
    const wpm = Math.round(spoken.length / minutes);
    const fillersPerMin = +(fillers.length / minutes).toFixed(1);
    const longPauses = (silences || []).filter(s => s.to - s.from >= CONFIG.longPauseSec && s.from > first && s.to < last);
    const repeats = toks.filter((t, i) => i && t.n === toks[i - 1].n && !FILLERS.has(t.n)).length;
    const clear = words.length ? words.filter(w => w.conf >= CONFIG.clearConf).length / words.length : 0;
    const cov = coverage(task, spoken), hitShare = cov.filter(c => c.hit).length / cov.length;
    const hits = grammarHits(transcript, { written: false });
    const errors = hits.filter(h => h.kind === 'grammar');
    const per100 = spoken.length ? (weightOf(errors) / spoken.length) * 100 : 0;
    const tooQuiet = spoken.length < 8;
    const tooNoisy = snrDb !== null && snrDb < 13.5;

    const durationOk = speechSec >= task.minSec * 0.9 && speechSec <= task.maxSec * 1.15;
    const content = hitShare === 1 && durationOk ? 4 : hitShare >= 0.75 && speechSec >= task.minSec * 0.7 ? 3 : hitShare >= 0.5 ? 2 : 1;
    const [lo, hi] = CONFIG.paceWpm;
    const issues = [wpm < lo * 0.8 || wpm > hi * 1.2, fillersPerMin > CONFIG.fillersPerMinOk, longPauses.length > 1].filter(Boolean).length
      + (wpm < lo * 0.6 || wpm > hi * 1.4 ? 1 : 0);
    const fluency = Math.max(1, 4 - issues);
    const clarity = band(clear, [[0.9, 4], [0.8, 3], [0.65, 2], [0, 1]]);
    const over = overused(spoken, task);
    const grammar = Math.max(1, band(-per100, [[-1.5, 4], [-4, 3], [-10, 2], [-Infinity, 1]]) - (over.length >= 2 ? 1 : 0));

    const criteria = [
      { id: 'task', label: 'Content and task', score: content,
        reason: `${cov.filter(c => c.hit).length} of ${cov.length} key points; ${Math.round(speechSec)} s (aim ${task.minSec}–${task.maxSec} s)` },
      { id: 'fluency', label: 'Fluency and pace', score: fluency,
        reason: `${wpm} words a minute (aim ${lo}–${hi}); ${fillers.length} filler${fillers.length === 1 ? '' : 's'}${longPauses.length ? `; ${longPauses.length} long pause${longPauses.length === 1 ? '' : 's'}` : ''}` },
      { id: 'clarity', label: 'Pronunciation and clarity', score: clarity,
        reason: `About ${Math.round(clear * 100)}% of words were heard clearly (an estimate from the device; an accent is never marked down)` },
      { id: 'grammar', label: 'Grammar and vocabulary', score: grammar,
        reason: errors.length ? `${errors.length} slip${errors.length === 1 ? '' : 's'} heard, e.g. “${errors[0].quote}”` : 'No common slips heard' },
    ];

    const improve = [];
    const missedPoints = cov.filter(c => !c.hit);
    if (missedPoints.length) improve.push({ why: `Add ${missedPoints.map(p => p.label).join(' and ')}.` });
    if (speechSec < task.minSec * 0.9) improve.push({ why: `Speak for longer: about ${Math.round(speechSec)} s. Aim for ${task.minSec}–${task.maxSec} s.` });
    for (const f of groupedFixes(errors).slice(0, 2)) improve.push(f);
    if (fillersPerMin > CONFIG.fillersPerMinOk) improve.push({ quote: [...new Set(fillers.map(f => f.raw))].slice(0, 3).join(', '), why: 'Try a short silent pause instead of a filler word.' });
    if (wpm > hi * 1.2) improve.push({ why: `You spoke fast (${wpm} words a minute). Slow down a little.` });
    if (wpm < lo * 0.8) improve.push({ why: `You spoke slowly (${wpm} words a minute). Practise once more to make it smoother.` });
    if (longPauses.length > 1) improve.push({ why: `${longPauses.length} long pauses. Plan your main points before you start.` });

    const well = [];
    if (cov.filter(c => c.hit).length) well.push(`You talked about ${cov.filter(c => c.hit).map(c => c.label).join(', ')}.`);
    if (wpm >= lo && wpm <= hi) well.push('A comfortable speaking pace.');
    if (fillersPerMin <= CONFIG.fillersPerMinOk) well.push('Few filler words.');
    if (clear >= 0.9) well.push('Your words were easy to recognise.');

    return finish({ mode: 'speak', task, criteria, improve, well, tips: hits.filter(h => h.kind === 'tip'), corrected: correct(transcript, hits, false), coverage: cov,
      transcript, refused: tooQuiet ? 'quiet' : tooNoisy ? 'noisy' : null,
      stats: { words: spoken.length, wpm, fillers: fillers.length, fillersPerMin, longPauses: longPauses.length, repeats, clear: +clear.toFixed(2), speechSec: +speechSec.toFixed(1), totalSec: +(total || 0).toFixed(1), snrDb } });
  }

  function finish(r) {
    r.total = r.criteria.reduce((s, c) => s + c.score, 0);
    r.max = 16;
    r.level = level(r.total);
    r.headline = r.total >= 14 ? 'Excellent work!' : r.total >= 11 ? 'Well done!' : r.total >= 8 ? 'Good effort!' : 'Let’s work on this together.';
    r.improve = r.improve.slice(0, 2);
    r.well = r.well.slice(0, 2);
    r.source = r.source || 'device';
    return r;
  }

  // Merge AI feedback (when online) over the device result. For speech the AI only sees the transcript,
  // so fluency and clarity stay with the device's measurements.
  function mergeAI(device, ai) {
    if (!ai || !Array.isArray(ai.scores)) return device;
    const keepDevice = device.mode === 'speak' ? new Set(['fluency', 'clarity']) : new Set();
    const criteria = device.criteria.map(c => {
      const a = ai.scores.find(s => s.criterion === c.id);
      if (!a || keepDevice.has(c.id)) return c;
      return { ...c, score: Math.max(1, Math.min(4, Math.round(a.score))), reason: a.reason, by: 'ai' };
    });
    const merged = { ...device, criteria, source: 'ai',
      well: ai.well && ai.well.length ? ai.well.slice(0, 2) : device.well,
      improve: ai.improve && ai.improve.length ? ai.improve.slice(0, 2) : device.improve,
      corrected: ai.better_version || device.corrected, summary: ai.summary || null };
    return finish({ ...merged, improve: merged.improve, well: merged.well });
  }

  return { CONFIG, norm, tokens, coverage, grammarHits, correct, structure, copiedShare, evaluateWritten, evaluateSpoken, mergeAI, level };
});
