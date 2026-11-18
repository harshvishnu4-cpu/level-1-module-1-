/*!
  CommKit: offline audio and text checking for learning games and interactive pages.

  One script tag gives you:
    • a JavaScript API (CommKit.readAloud, hear, listenFor, listen, speakAnswer, checkText, compareText, say)
    • three paste-in tags: <read-aloud>, <speak-answer>, <write-answer>

  Everything runs on the device. Speech uses the Vosk engine and an Indian English model that the
  kit loads from this site; nothing is sent anywhere. See kit/README.md for the full guide.

  Folder layout the kit expects (the same as this site, and as the folder `npm run kit` builds):
    kit/commkit.js            this file
    lib/vosk.js               speech engine
    js/scoring.js             reading-aloud scoring
    js/answer-scoring.js      spoken and written answer scoring
    models/en-in.tar.gz       speech model (about 37 MB, loaded once, then cached)
  Change the paths with data attributes on the script tag, e.g. data-root="../", data-model="models/en-in.tar.gz".
*/
(function () {
  'use strict';
  if (window.CommKit) return;

  // ---------- where things are ----------
  const tag = document.currentScript;
  const ROOT = new URL((tag && tag.dataset.root) || '../', tag ? tag.src : location.href).href;
  const P = {
    vosk: (tag && tag.dataset.vosk) || 'lib/vosk.js',
    reading: (tag && tag.dataset.reading) || 'js/scoring.js',
    answers: (tag && tag.dataset.answers) || 'js/answer-scoring.js',
    model: (tag && tag.dataset.model) || 'models/en-in.tar.gz',
  };
  const url = p => new URL(p, ROOT).href;
  // scripts carry the kit version, so a browser never keeps an old scorer after an update (bump VERSION when they change)
  const VERSION = '1.1.1';
  const scriptUrl = p => url(p) + (p.includes('?') ? '&' : '?') + 'v=' + VERSION;
  const scripts = {};
  const loadScript = (p, global) => window[global] ? Promise.resolve() : (scripts[p] = scripts[p] || new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = scriptUrl(p); s.onload = res; s.onerror = () => rej(new Error('Could not load ' + p)); document.head.append(s);
  }));

  // ---------- speech engine (loaded on first use) ----------
  let model = null, modelPromise = null, ctx = null, active = null;
  function ready() {
    return modelPromise || (modelPromise = (async () => {
      await Promise.all([loadScript(P.vosk, 'Vosk'), loadScript(P.reading, 'ReadingScore'), loadScript(P.answers, 'AnswerScore')]);
      const src = await modelSource(url(P.model));
      try { model = await window.Vosk.createModel(src); } finally { if (src.startsWith('blob:')) URL.revokeObjectURL(src); }
      emit('ready');
      return true;
    })().catch(e => { console.error('[CommKit]', e); modelPromise = null; return false; }));
  }
  // With the offline cache on, fetch the model here (the cache answers it) and hand it to the speech engine,
  // whose own download runs in a worker the cache can't see. Without the cache, the engine fetches it itself.
  async function modelSource(u) {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return u;
    try { const r = await fetch(u); return r.ok ? URL.createObjectURL(await r.blob()) : u; } catch (e) { return u; }
  }
  const scorers = () => Promise.all([loadScript(P.reading, 'ReadingScore'), loadScript(P.answers, 'AnswerScore')]);
  const audio = () => (ctx = ctx || new (window.AudioContext || window.webkitAudioContext)());
  const norm = s => String(s).toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();

  // One recognizer. grammar: list of allowed phrases (faster, more accurate for known words) or null for open speech.
  // vosk-browser posts one message per audio chunk plus one for retrieveFinalResult, so the final result is message (sent + 1).
  function recognizer(sampleRate, grammar, onWords) {
    const r = new model.KaldiRecognizer(sampleRate, grammar ? JSON.stringify([...new Set(grammar.filter(Boolean)), '[unk]']) : undefined);
    r.setWords(true);
    const words = []; let sent = 0, got = 0, target = Infinity, resolve;
    const done = new Promise(res => (resolve = res)), tick = () => { if (++got >= target) resolve(); };
    const final = () => words.map(w => w.word);
    r.on('result', m => { if (m.result && m.result.result) words.push(...m.result.result); if (onWords) onWords(final(), words); tick(); });
    r.on('partialresult', m => { if (onWords && m.result) onWords(final().concat((m.result.partial || '').split(/\s+/).filter(Boolean)), words); tick(); });
    return {
      feed(f32, sr) { r.acceptWaveformFloat(f32, sr); sent++; },
      async finish() {
        target = sent + 1; r.retrieveFinalResult(); if (got >= target) resolve();
        await Promise.race([done, new Promise(res => setTimeout(res, 20000))]);
        r.remove(); return words;
      },
    };
  }
  // Loudness in 20 ms slices: pauses and a speech-over-background estimate (dB).
  function loudness(sr) {
    const frame = Math.round(sr * 0.02), rms = []; let sum = 0, n = 0;
    const sorted = () => [...rms].sort((a, b) => a - b), pick = (so, p) => so[Math.min(so.length - 1, Math.floor(p * so.length))];
    return {
      push(f) { for (let i = 0; i < f.length; i++) { sum += f[i] * f[i]; if (++n === frame) { rms.push(Math.sqrt(sum / frame)); sum = 0; n = 0; } } },
      snrDb() { if (rms.length < 10) return null; const so = sorted(); return Math.min(60, 20 * Math.log10((pick(so, 0.9) + 1e-9) / (pick(so, 0.1) + 1e-9))); },
      silences() {
        if (rms.length < 10) return [];
        const so = sorted(), floor = pick(so, 0.1), loud = pick(so, 0.95), th = floor + (loud - floor) * 0.1, out = []; let from = null;
        rms.forEach((v, i) => { if (v < th) { if (from === null) from = i; } else if (from !== null) { out.push({ from: from * 0.02, to: i * 0.02 }); from = null; } });
        if (from !== null) out.push({ from: from * 0.02, to: rms.length * 0.02 });
        return out;
      },
      seconds() { return rms.length * 0.02; },
    };
  }

  // A listening session: microphone (default) or a recording (opts.audio = URL, checked without playing).
  // passes: [{ grammar, onWords }]; each gets the same audio. Returns { stop() -> Promise<raw>, stopped }.
  async function session({ passes, onLevel, audio: file, maxSeconds = 120 }) {
    if (!(await ready())) throw new Error('The speech model could not load. Serve the page over http(s) and check the paths (see kit/README.md).');
    if (active) await active.stop();
    const ac = audio(); await ac.resume().catch(() => {});
    if (file) { // a recording: decode and feed it as fast as possible
      const buf = await ac.decodeAudioData(await (await fetch(file)).arrayBuffer());
      const sr = buf.sampleRate, d = buf.getChannelData(0), recs = passes.map(p => recognizer(sr, p.grammar, p.onWords)), loud = loudness(sr);
      for (let i = 0; i < d.length; i += 4096) { const c = d.slice(i, i + 4096); loud.push(c); recs.forEach(r => r.feed(c.slice(), sr)); }
      const raw = { passes: await Promise.all(recs.map(r => r.finish())), silences: loud.silences(), snrDb: loud.snrDb(), durationSec: buf.duration, recording: file };
      return { stop: async () => raw, stopped: Promise.resolve(raw), file: true };
    }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } }); }
    catch (e) { const err = new Error('The microphone is blocked. Allow microphone access for this page, then try again.'); err.code = 'mic-blocked'; throw err; }
    const sr = ac.sampleRate, recs = passes.map(p => recognizer(sr, p.grammar, p.onWords)), loud = loudness(sr);
    const src = ac.createMediaStreamSource(stream), node = ac.createScriptProcessor(4096, 1, 1);
    node.onaudioprocess = e => { const c = e.inputBuffer.getChannelData(0).slice(); loud.push(c); recs.forEach(r => r.feed(c.slice(), sr)); };
    src.connect(node); node.connect(ac.destination);
    const an = ac.createAnalyser(); an.fftSize = 512; src.connect(an);
    const lvl = new Float32Array(an.fftSize); let raf = 0;
    const meter = () => { an.getFloatTimeDomainData(lvl); let q = 0; for (const v of lvl) q += v * v; if (onLevel) onLevel(Math.min(1, Math.sqrt(q / lvl.length) * 8)); raf = requestAnimationFrame(meter); };
    meter();
    let mr = null; const chunks = [];
    try { mr = new MediaRecorder(stream); mr.ondataavailable = e => chunks.push(e.data); mr.start(); } catch (e) { mr = null; }
    let stopped = null, resolveStopped;
    const stoppedP = new Promise(res => (resolveStopped = res));
    const timer = setTimeout(() => s.stop(), maxSeconds * 1000);
    const s = {
      stop: () => stopped || (stopped = (async () => {
        clearTimeout(timer); cancelAnimationFrame(raf); if (onLevel) onLevel(0);
        node.disconnect(); src.disconnect(); an.disconnect();
        let recording = null;
        if (mr) recording = await new Promise(res => { mr.onstop = () => res(URL.createObjectURL(new Blob(chunks, { type: mr.mimeType }))); mr.stop(); });
        stream.getTracks().forEach(t => t.stop());
        const raw = { passes: await Promise.all(recs.map(r => r.finish())), silences: loud.silences(), snrDb: loud.snrDb(), durationSec: loud.seconds(), recording };
        if (active === s) active = null;
        resolveStopped(raw); return raw;
      })()),
      stopped: stoppedP,
    };
    active = s;
    return s;
  }
  // Wrap a session as { stop(), done, listening }: done resolves with the checked result.
  function controller(start, check) {
    let s = null, stopReq = false;
    const done = (async () => {
      s = await start();
      if (stopReq) s.stop();
      return check(await s.stopped);
    })();
    return { stop() { stopReq = true; if (s) s.stop(); return done; }, done, get listening() { return !!s && !s.file; } };
  }

  // ---------- API: reading aloud ----------
  // CommKit.readAloud({ text, onProgress(index, total, word), onLevel, autoStop, maxSeconds, audio })
  // done -> { score (0–10), max, accuracy, wcpm, headline, tip, words[], missed[], changed[], added[], tooNoisy, heardTooLittle, recording, analysis }
  function readAloud(opts) {
    const text = String(opts.text || ''), autoStop = opts.autoStop !== false;
    let refN = [], tokens = [], pos = -1, lastChange = 0, poll = 0;
    const start = async () => {
      await scorers();
      const RS = window.ReadingScore; tokens = RS.tokenize(text); refN = tokens.map(t => t.n);
      if (!refN.length) throw new Error('readAloud needs some text.');
      const onWords = heard => {
        const p = RS.livePosition(refN, heard.map(w => (w === '[unk]' ? w : RS.norm(w))));
        if (p !== pos) { pos = p; lastChange = performance.now(); if (opts.onProgress) opts.onProgress(p, refN.length, tokens[p] ? tokens[p].raw : ''); }
      };
      const s = await session({ passes: [{ grammar: RS.grammarFor(text, 'sentences'), onWords }, { grammar: null }], onLevel: opts.onLevel, audio: opts.audio, maxSeconds: opts.maxSeconds });
      // stop on its own once the last word is read and the reader has paused
      if (autoStop && !s.file) poll = setInterval(() => { if (pos >= refN.length - 1 && performance.now() - lastChange > 1300) s.stop(); }, 250);
      s.stopped.then(() => clearInterval(poll));
      return s;
    };
    return controller(start, raw => readingResult(text, raw));
  }
  function readingResult(text, raw) {
    const a = window.ReadingScore.analyse({ text, primary: raw.passes[0], open: raw.passes[1], silences: raw.silences, snrDb: raw.snrDb });
    const words = a.words.map(w => ({ text: w.raw, status: w.status, heard: w.heard || null, rule: w.rule, outcome: w.outcome, cost: w.cost }));
    return {
      score: a.rubric.total, max: 10, marks: { accuracy: a.rubric.accuracy.marks, pace: a.rubric.pace.marks, phrasing: a.rubric.phrasing.marks },
      accuracy: a.accuracy, wcpm: a.wcpm, headline: a.message.headline, tip: a.message.lead,
      words, missed: words.filter(w => w.status === 'skip').map(w => w.text), changed: words.filter(w => w.status === 'change').map(w => ({ word: w.text, heard: w.heard })),
      added: a.extras.filter(x => x.kind === 'added').map(x => x.word),
      // by the read-aloud scoring rules: errors, minor errors (weigh less), unclear words that count, and notes that never lower the score
      counts: { errors: a.counts.errors, minor: a.counts.minor, unclear: a.counts.unclearCounted, errorCost: a.counts.errorCost }, notes: a.notes,
      tooNoisy: a.tooNoisy, heardTooLittle: a.heardTooLittle, recording: raw.recording, analysis: a,
      // what the engine heard: the passage pass (listens for the passage's words) and the open pass (any English word)
      heard: { passage: raw.passes[0].map(w => w.word).join(' '), open: (raw.passes[1] || []).map(w => w.word).join(' ') },
    };
  }

  // ---------- API: hear one of a few words or phrases (for games) ----------
  // await CommKit.hear(['apple', 'banana'], { timeout: 6000, onLevel, onPartial, audio })
  // -> { word: 'apple' | null, heard: 'apple', confidence: 0–1, timedOut }
  function hear(choices, opts = {}) {
    const list = (Array.isArray(choices) ? choices : String(choices).split(',')).map(c => ({ say: c, n: norm(c) })).filter(c => c.n);
    if (!list.length) return Promise.reject(new Error('hear() needs at least one word.'));
    const find = heardText => { const h = ' ' + norm(heardText) + ' '; return list.find(c => h.includes(' ' + c.n + ' ')) || null; };
    return new Promise((resolve, reject) => {
      let early = null, s = null;
      const onWords = heard => {
        const txt = heard.filter(w => w !== '[unk]').join(' ');
        if (opts.onPartial) opts.onPartial(txt);
        if (!early && find(txt)) { early = find(txt); if (s) s.stop(); }
      };
      session({ passes: [{ grammar: list.map(c => c.n), onWords }], onLevel: opts.onLevel, audio: opts.audio, maxSeconds: (opts.timeout || 8000) / 1000 })
        .then(x => {
          s = x; if (early) s.stop();
          return s.stopped;
        })
        .then(raw => {
          const words = raw.passes[0].filter(w => w.word !== '[unk]'), heard = words.map(w => w.word).join(' ');
          const match = find(heard) || early;
          const used = match ? words.filter(w => (' ' + match.n + ' ').includes(' ' + w.word + ' ')) : [];
          const confidence = used.length ? +(used.reduce((t, w) => t + (w.conf ?? 1), 0) / used.length).toFixed(2) : 0;
          resolve({ word: match ? match.say : null, heard, confidence, timedOut: !match && !early });
        })
        .catch(reject);
    });
  }

  // ---------- API: keep listening for game words ----------
  // const l = CommKit.listenFor(['apple', 'banana', 'red car'], { onWord(word), onPartial(text), onLevel, maxSeconds })
  // Calls onWord each time one of the words is said, until l.stop(). One microphone session for the whole game round.
  function listenFor(choices, opts = {}) {
    const list = (Array.isArray(choices) ? choices : String(choices).split(',')).map(c => ({ say: c, n: norm(c) })).filter(c => c.n);
    const seen = {};
    const onWords = heard => {
      const txt = ' ' + heard.filter(w => w !== '[unk]').join(' ') + ' ';
      if (opts.onPartial) opts.onPartial(txt.trim());
      for (const c of list) {
        const count = txt.split(' ' + c.n + ' ').length - 1;
        for (let k = seen[c.n] || 0; k < count; k++) { try { opts.onWord && opts.onWord(c.say); } catch (e) { console.error(e); } }
        seen[c.n] = Math.max(seen[c.n] || 0, count);
      }
    };
    return controller(() => session({ passes: [{ grammar: list.map(c => c.n), onWords }], onLevel: opts.onLevel, audio: opts.audio, maxSeconds: opts.maxSeconds || 600 }),
      raw => ({ heard: raw.passes[0].filter(w => w.word !== '[unk]').map(w => w.word).join(' ') }));
  }

  // ---------- API: open listening, and spoken answers ----------
  // CommKit.listen({ onPartial(text), onLevel, maxSeconds, audio }) -> done: { text, words, durationSec, pauses, snrDb, recording }
  function listen(opts = {}) {
    const onWords = opts.onPartial ? heard => opts.onPartial(heard.filter(w => w !== '[unk]').join(' ')) : null;
    return controller(() => session({ passes: [{ grammar: null, onWords }], onLevel: opts.onLevel, audio: opts.audio, maxSeconds: opts.maxSeconds }),
      raw => ({ text: raw.passes[0].filter(w => w.word !== '[unk]').map(w => w.word).join(' '), words: raw.passes[0], durationSec: raw.durationSec, pauses: raw.silences, snrDb: raw.snrDb, recording: raw.recording }));
  }
  // CommKit.speakAnswer({ task, onPartial, onLevel, maxSeconds, audio }) -> done: answer result (score out of 16) + transcript
  function speakAnswer(opts) {
    const t = task(Object.assign({ mode: 'speak' }, opts.task));
    return controller(async () => { await scorers(); return session({ passes: [{ grammar: null, onWords: opts.onPartial ? h => opts.onPartial(h.filter(w => w !== '[unk]').join(' ')) : null }], onLevel: opts.onLevel, audio: opts.audio, maxSeconds: opts.maxSeconds || t.maxSec + 20 }); },
      raw => {
        const r = window.AnswerScore.evaluateSpoken(t, raw.passes[0], { silences: raw.silences, durationSec: raw.durationSec, snrDb: raw.snrDb });
        return Object.assign(r, { score: r.total, recording: raw.recording, keyPoints: window.AnswerScore.coverage(t, window.AnswerScore.tokens(r.transcript || '')) });
      });
  }

  // ---------- API: text ----------
  // A task: { prompt, points: ['label: cue, cue', …] or [{ label, cues }], minWords, maxWords, minSec, maxSec, format, passage, model }
  // format: 'email' | 'reply' | 'summary' | 'opinion' | anything else (free answer).
  function parsePoints(points, prompt) {
    let list = points || [];
    if (typeof list === 'string') list = list.split(';');
    list = list.map(p => {
      if (typeof p === 'object' && p) return { label: p.label, cues: (p.cues && p.cues.length ? p.cues : [p.label]).map(String) };
      const [label, cues] = String(p).split(':');
      return { label: label.trim(), cues: (cues ? cues.split(',') : [label]).map(c => c.trim()).filter(Boolean) };
    }).filter(p => p.label);
    if (!list.length) { // no points given: the answer should at least use words from the question
      const words = norm(prompt || '').split(' ').filter(w => w.length > 4).slice(0, 6);
      list = [{ label: 'answers the question', cues: words.length ? words : ['the'] }];
    }
    return list;
  }
  function task(t = {}) {
    if (t.keyPoints && t.id && t.minWords !== undefined) return t; // already a full task (e.g. from js/tasks.js)
    return {
      id: t.id || 'custom', mode: t.mode || 'write', format: t.format || 'free', title: t.title || 'Task', prompt: t.prompt || '',
      minWords: +t.minWords || 20, maxWords: +t.maxWords || 120, minSec: +t.minSec || 20, maxSec: +t.maxSec || 60,
      formal: !!t.formal, pastTense: !!t.pastTense, passage: t.passage || null, model: t.model || '',
      keyPoints: t.keyPoints || parsePoints(t.points, t.prompt),
    };
  }
  // await CommKit.checkText(text, task) -> { score (0–16), level, headline, criteria[], well[], improve[], corrected, keyPoints[] }
  async function checkText(text, t) {
    await scorers();
    const full = task(t), r = window.AnswerScore.evaluateWritten(full, String(text || ''));
    return Object.assign(r, { score: r.total, keyPoints: window.AnswerScore.coverage(full, window.AnswerScore.tokens(String(text || ''))) });
  }
  // Which key points a text already covers (for live ticks while typing or speaking). Needs the scorers loaded.
  async function keyPoints(text, t) { await scorers(); const full = task(t); return window.AnswerScore.coverage(full, window.AnswerScore.tokens(String(text || ''))); }
  // await CommKit.compareText('The cat sat.', 'the cat sit') -> { score 0–1, words: [{ text, status: 'ok'|'wrong'|'missing', typed }], extra: [] }
  // For dictation and "type what you hear": small spelling slips count as close.
  async function compareText(expected, typed) {
    await scorers();
    const RS = window.ReadingScore, ref = RS.tokenize(expected), hyp = RS.tokenize(typed).map(t => ({ word: t.n, raw: t.raw }));
    const words = ref.map(t => ({ text: t.raw, status: 'missing', typed: null })), extra = [];
    for (const op of RS.align(ref.map(t => t.n), hyp)) {
      if (op.t === 'ok') Object.assign(words[op.r], { status: 'ok', typed: hyp[op.h].raw });
      else if (op.t === 'sub') Object.assign(words[op.r], { status: RS.lev(ref[op.r].n, hyp[op.h].word) <= 1 || RS.variantPattern(ref[op.r].n, hyp[op.h].word) || RS.variantPattern(hyp[op.h].word, ref[op.r].n) ? 'close' : 'wrong', typed: hyp[op.h].raw });
      else if (op.t === 'ins') extra.push(hyp[op.h].raw);
    }
    const ok = words.filter(w => w.status === 'ok').length + words.filter(w => w.status === 'close').length * 0.5;
    return { score: words.length ? +(ok / (words.length + extra.length * 0.5)).toFixed(2) : 0, words, extra };
  }
  // Read text aloud with the device's own voice (works offline when a voice is installed). Resolves when finished.
  function say(text, { rate = 0.9, lang = 'en-IN', pitch = 1 } = {}) {
    return new Promise(res => {
      if (!('speechSynthesis' in window)) return res(false);
      const u = new SpeechSynthesisUtterance(String(text));
      u.rate = rate; u.pitch = pitch; u.lang = lang;
      const v = speechSynthesis.getVoices().find(x => x.lang === lang) || speechSynthesis.getVoices().find(x => x.lang && x.lang.startsWith('en'));
      if (v) u.voice = v;
      u.onend = () => res(true); u.onerror = () => res(false);
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    });
  }
  // Keep the kit and the speech model on the device so pages work offline after the first visit.
  // Needs commkit-sw.js in the site's root folder (next to kit/). Does nothing on file:// pages (an app's own files are already offline).
  function offline(swPath = 'commkit-sw.js') {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return Promise.resolve(false);
    return navigator.serviceWorker.register(url(swPath), { scope: ROOT })
      .then(() => navigator.serviceWorker.ready)
      .then(reg => {
        const msg = { type: 'cache', urls: [P.model, P.vosk, P.reading, P.answers, 'kit/commkit.js'].map(url) };
        reg.active.postMessage(msg);
        // after an update the new cache worker takes over: ask it too
        navigator.serviceWorker.addEventListener('controllerchange', () => navigator.serviceWorker.controller && navigator.serviceWorker.controller.postMessage(msg), { once: true });
        return true;
      },
        e => { console.warn('[CommKit] offline cache not set up:', e.message); return false; });
  }
  const listeners = {};
  function on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); if (ev === 'ready' && model) fn(); }
  function emit(ev, d) { (listeners[ev] || []).forEach(fn => { try { fn(d); } catch (e) { console.error(e); } }); }

  window.CommKit = { version: VERSION, root: ROOT, ready, get isReady() { return !!model; }, on, readAloud, hear, listenFor, listen, speakAnswer, checkText, keyPoints, compareText, say, task, offline,
    stop: () => (active ? active.stop() : Promise.resolve()) };

  // =====================================================================================
  // Paste-in tags. Each one is a card in the course look, in its own shadow DOM so the host
  // page's styles don't leak in. Colours can be changed with CSS variables on the tag:
  //   --ck-accent (buttons), --ck-tone (highlight), --ck-good, --ck-fix, --ck-radius, --ck-font
  // Each tag fires a "result" event (event.detail is the result object) and has start(), stop(), reset().
  // =====================================================================================
  const CSS = `
    :host { display: block; min-width: 0; max-width: 100%; --a: var(--ck-accent, #000); --tone: var(--ck-tone, #d3eefa); --good: var(--ck-good, #136c3e); --good-soft: #c6f1d5;
      --fix: var(--ck-fix, #a3610c); --fix-soft: #fdf2df; --muted: #6a7080; --line: #e7e9ee; --rule: #d3deef; --text: #16181d;
      font-family: var(--ck-font, "Outfit", "Urbanist", "Poppins", Roboto, system-ui, sans-serif); color: var(--text); }
    * { box-sizing: border-box; }
    .card { background: #fff; border-radius: var(--ck-radius, 24px); box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 10px 28px -14px rgba(16,24,40,.18); padding: 20px; display: grid; gap: 14px; }
    .eyebrow { margin: 0; font-size: .8125rem; font-weight: 600; color: var(--muted); }
    .prompt { margin: 0; font-size: 1.125rem; line-height: 1.45; font-weight: 600; }
    .ruled { --lh: 2.25rem; line-height: var(--lh); margin: 0; font-size: 1.1875rem;
      background-image: repeating-linear-gradient(to bottom, transparent 0, transparent calc(var(--lh) - 1px), var(--rule) calc(var(--lh) - 1px), var(--rule) var(--lh));
      background-position: 0 calc(var(--lh) * -0.18); overflow-wrap: break-word; }
    .ruled:empty::before { content: attr(data-empty); color: #9aa3b5; }
    textarea.ruled { display: block; width: 100%; border: 0; outline: 0; resize: vertical; padding: 0; background-color: transparent; background-attachment: local; font: inherit; font-size: 1.1875rem; min-height: calc(var(--lh) * 5); color: inherit; }
    .w { border-radius: 4px; transition: background-color .15s, color .15s; }
    .w.done { color: #4b5162; } .w.here { background: #fde68a; box-shadow: 0 0 0 3px #fde68a; }
    .w.skip { color: #8a93a3; text-decoration: underline dashed var(--fix) 2px; text-underline-offset: 6px; }
    .w.change { text-decoration: underline wavy var(--fix) 2px; text-underline-offset: 6px; }
    .w.unclear { text-decoration: underline dotted #7d8799 2px; text-underline-offset: 6px; }
    .w.tip { text-decoration: underline dotted #8a4fb0 2px; text-underline-offset: 6px; }
    .bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .grow { flex: 1; min-width: 120px; color: var(--muted); font-size: .9375rem; }
    .mic { --level: 0; width: 64px; height: 64px; flex: none; border-radius: 50%; border: 0; cursor: pointer; background: var(--a); color: #fff; display: grid; place-items: center;
      box-shadow: 0 0 0 calc(5px + var(--level) * 16px) rgba(0,0,0,.08); transition: box-shadow .08s linear, background .2s; }
    .mic svg { width: 26px; height: 26px; } .mic.on { background: #b4532a; box-shadow: 0 0 0 calc(5px + var(--level) * 16px) rgba(180,83,42,.16); }
    .mic:disabled { background: #aab3c3; cursor: default; box-shadow: none; }
    .btn { border: 0; border-radius: 99px; padding: 10px 18px; font: inherit; font-weight: 700; cursor: pointer; background: var(--a); color: #fff; }
    .btn.soft { background: #e9ebef; color: var(--text); } .btn:disabled { opacity: .45; cursor: default; }
    .link { border: 0; background: none; color: #3557c5; font: inherit; font-weight: 600; font-size: .875rem; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; padding: 2px 4px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
    .chips li { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--line); border-radius: 99px; padding: 5px 12px; font-size: .9375rem; }
    .chips li::before { content: ""; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #c9d0de; }
    .chips li.hit { background: var(--good-soft); border-color: transparent; color: #0b5a54; } .chips li.hit::before { background: var(--good); border-color: var(--good); }
    .result { display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: center; background: var(--tone); border-radius: 18px; padding: 14px 16px; }
    .result p { margin: 0; } .result .h { font-weight: 750; font-size: 1.1875rem; } .result .t { color: #3d4250; margin-top: 2px; }
    .ring { width: 76px; height: 76px; } .ring .bg { stroke: rgba(255,255,255,.7); } .ring .fg { stroke: var(--good); stroke-linecap: round; }
    .ring text { font: 700 24px system-ui, sans-serif; fill: var(--text); } .ring .of { font-size: 13px; fill: var(--muted); }
    ul.fix { margin: 0; padding-left: 18px; display: grid; gap: 6px; } ul.fix .q { background: var(--fix-soft); color: #7a4708; border-radius: 4px; padding: 0 4px; }
    ul.fix .b { background: #eef0f4; font-weight: 600; border-radius: 4px; padding: 0 4px; }
    mark { background: #eef0f4; color: inherit; font-weight: 600; border-radius: 4px; padding: 0 2px; }
    .err { color: var(--fix); }
    .count b { color: var(--text); }
    [hidden] { display: none !important; }
  `;
  const ICON_MIC = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"/></svg>';
  const ICON_STOP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const ring = (n, max) => { const r = 32, c = 2 * Math.PI * r; return `<svg class="ring" viewBox="0 0 76 76" role="img" aria-label="${n} out of ${max}"><circle class="bg" cx="38" cy="38" r="${r}" fill="none" stroke-width="8"/><circle class="fg" cx="38" cy="38" r="${r}" fill="none" stroke-width="8" stroke-dasharray="${(c * n / max).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 38 38)"/><text x="38" y="46" text-anchor="middle">${n}<tspan class="of">/${max}</tspan></text></svg>`; };
  function diffMark(before, after) {
    const a = before.split(/(\s+)/), b = after.split(/(\s+)/), A = a.filter((_, i) => i % 2 === 0), B = b.filter((_, i) => i % 2 === 0);
    const n = A.length, m = B.length, L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const keep = new Set(); let i = 0, j = 0;
    while (i < n && j < m) { if (A[i] === B[j]) { keep.add(j); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
    const seps = b.filter((_, k) => k % 2 === 1);
    return B.map((w, k) => (keep.has(k) ? esc(w) : `<mark>${esc(w)}</mark>`) + (seps[k] !== undefined ? esc(seps[k]) : '')).join('');
  }
  const taskFromAttrs = el => ({ prompt: el.getAttribute('prompt') || '', points: el.getAttribute('points') || '', format: el.getAttribute('format') || 'free',
    minWords: el.getAttribute('min-words'), maxWords: el.getAttribute('max-words'), minSec: el.getAttribute('min-sec'), maxSec: el.getAttribute('max-sec'),
    passage: el.getAttribute('passage'), model: el.getAttribute('model-answer') || '' });

  class Base extends HTMLElement {
    constructor() { super(); this.root = this.attachShadow({ mode: 'open' }); }
    $(sel) { return this.root.querySelector(sel); }
    fire(name, detail) { this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true })); }
    setMic(state, label, err) {
      const m = this.$('.mic'); if (!m) return;
      m.classList.toggle('on', state === 'on'); m.disabled = state === 'busy';
      m.innerHTML = state === 'on' ? ICON_STOP : ICON_MIC; m.setAttribute('aria-label', state === 'on' ? 'Stop' : 'Start');
      const l = this.$('.status'); l.textContent = label; l.classList.toggle('err', !!err);
    }
    level(v) { const m = this.$('.mic'); if (m) m.style.setProperty('--level', v.toFixed(3)); }
    connectedCallback() { if (!this._built) { this._built = true; this.build(); } }
    disconnectedCallback() { if (this.ctl) this.ctl.stop(); }
  }

  // <read-aloud text="…" heading="…" sample="recording.wav"> — read a passage aloud; live highlight; score out of 10
  class ReadAloud extends Base {
    static get observedAttributes() { return ['text']; }
    attributeChangedCallback() { if (this._built) this.reset(); }
    build() {
      this.root.innerHTML = `<style>${CSS}</style><div class="card" part="card">
        ${this.getAttribute('heading') ? `<p class="eyebrow">${esc(this.getAttribute('heading'))}</p>` : ''}
        <p class="ruled passage" part="passage"></p>
        <div class="bar"><button class="mic" type="button">${ICON_MIC}</button><span class="grow status" aria-live="polite"></span>
          ${this.getAttribute('sample') ? '<button class="link sample" type="button">Try a sample</button>' : ''}</div>
        <div class="out" hidden></div></div>`;
      this.$('.mic').onclick = () => (this.ctl && this.ctl.listening ? this.stop() : this.start());
      if (this.$('.sample')) this.$('.sample').onclick = () => this.start({ audio: new URL(this.getAttribute('sample'), location.href).href });
      this.reset();
    }
    reset() {
      const text = this.getAttribute('text') || this.textContent.trim();
      this.$('.passage').innerHTML = text.split(/\s+/).filter(Boolean).map(t => `<span class="w">${esc(t)}</span>`).join(' ');
      this.spans = [...this.$('.passage').querySelectorAll('.w')].filter(s => norm(s.textContent));
      this.$('.out').hidden = true;
      this.setMic('idle', 'Tap the microphone and read aloud.');
    }
    async start(extra = {}) {
      this.reset();
      this.setMic(extra.audio ? 'busy' : 'on', extra.audio ? 'Checking the sample…' : CommKit.isReady ? 'Listening… read the text aloud.' : 'Getting the listener ready…');
      this.fire('start');
      try {
        this.ctl = readAloud(Object.assign({ text: this.getAttribute('text') || this.textContent.trim(), onLevel: v => this.level(v),
          onProgress: i => { if (this.$('.status').textContent.startsWith('Getting')) this.setMic('on', 'Listening… read the text aloud.'); this.spans.forEach((s, k) => { s.classList.toggle('done', k < i); s.classList.toggle('here', k === i); }); } }, extra));
        this.show(await this.ctl.done);
      } catch (e) { this.setMic('idle', e.message, true); }
    }
    stop() { if (this.ctl) { this.setMic('busy', 'Checking your reading…'); this.ctl.stop(); } }
    show(r) {
      this.ctl = null;
      this.spans.forEach((s, k) => { s.className = 'w ' + (r.words[k] ? r.words[k].status : ''); if (r.words[k] && r.words[k].heard && r.words[k].status === 'change') s.title = `Read as “${r.words[k].heard}”`; });
      const out = this.$('.out'); out.hidden = false;
      if (r.tooNoisy || r.heardTooLittle) out.innerHTML = `<p class="err">${r.tooNoisy ? 'It was too noisy to check. Try somewhere quieter.' : 'I could not hear enough. Hold the device closer and read again.'}</p>`;
      else out.innerHTML = `<div class="result">${ring(r.score, 10)}<div><p class="h">${esc(r.headline)}</p><p class="t">${esc(r.tip)}</p></div></div>
        ${r.recording ? '<p style="margin:10px 0 0"><button class="link play" type="button">▶ Hear yourself</button></p>' : ''}`;
      const pl = this.$('.play'); if (pl) pl.onclick = () => new Audio(r.recording).play();
      this.setMic('idle', 'Tap to read again.');
      this.fire('result', r);
    }
  }

  // <speak-answer prompt="…" points="label: cue, cue; …" min-sec="30" max-sec="60"> — spoken answer; score out of 16
  class SpeakAnswer extends Base {
    build() {
      const t = task(taskFromAttrs(this));
      this.t = t;
      this.root.innerHTML = `<style>${CSS}</style><div class="card" part="card">
        <p class="eyebrow">Speak for ${t.minSec}–${t.maxSec} seconds</p>
        <p class="prompt">${esc(t.prompt)}</p>
        <ul class="chips">${t.keyPoints.map(k => `<li>${esc(k.label)}</li>`).join('')}</ul>
        <div class="bar"><button class="mic" type="button">${ICON_MIC}</button><span class="grow status" aria-live="polite"></span>
          ${this.getAttribute('sample') ? '<button class="link sample" type="button">Try a sample</button>' : ''}</div>
        <p class="ruled said" data-empty="Your words will be written here as you speak."></p>
        <div class="out" hidden></div></div>`;
      this.$('.mic').onclick = () => (this.ctl && this.ctl.listening ? this.stop() : this.start());
      if (this.$('.sample')) this.$('.sample').onclick = () => this.start({ audio: new URL(this.getAttribute('sample'), location.href).href });
      this.setMic('idle', 'Tap the microphone and answer.');
    }
    tick(text) { keyPoints(text, this.t).then(cov => this.root.querySelectorAll('.chips li').forEach((li, i) => li.classList.toggle('hit', !!(cov[i] && cov[i].hit)))); }
    reset() { this.$('.said').textContent = ''; this.$('.out').hidden = true; this.tick(''); this.setMic('idle', 'Tap the microphone and answer.'); }
    async start(extra = {}) {
      this.reset(); this.fire('start');
      this.setMic(extra.audio ? 'busy' : 'on', extra.audio ? 'Checking the sample…' : 'Listening… tap to stop when you finish.');
      try {
        this.ctl = speakAnswer(Object.assign({ task: this.t, onLevel: v => this.level(v), onPartial: txt => { this.$('.said').textContent = txt; this.tick(txt); } }, extra));
        this.show(await this.ctl.done);
      } catch (e) { this.setMic('idle', e.message, true); }
    }
    stop() { if (this.ctl) { this.setMic('busy', 'Checking your answer…'); this.ctl.stop(); } }
    show(r) {
      this.ctl = null;
      this.$('.said').textContent = r.transcript || '';
      this.tick(r.transcript || '');
      const out = this.$('.out'); out.hidden = false;
      out.innerHTML = r.refused ? `<p class="err">${r.refused === 'noisy' ? 'It was too noisy to check. Try somewhere quieter.' : 'I could not hear enough. Hold the device closer and try again.'}</p>`
        : `<div class="result">${ring(r.total, 16)}<div><p class="h">${esc(r.level)} · ${esc(r.headline)}</p><p class="t">${esc(r.summary || '')}</p></div></div>
          ${r.improve.length ? `<ul class="fix">${r.improve.map(i => `<li>${i.quote ? `<span class="q">${esc(i.quote)}</span>` : ''}${i.quote && i.better ? ' → ' : ''}${i.better ? `<span class="b">${esc(i.better)}</span>` : ''} ${esc(i.why)}</li>`).join('')}</ul>` : ''}`;
      this.setMic('idle', 'Tap to try again.');
      this.fire('result', r);
    }
  }

  // <write-answer prompt="…" points="…" min-words="40" max-words="90" format="email|reply|summary|opinion"> — written answer; score out of 16
  class WriteAnswer extends Base {
    build() {
      const t = task(taskFromAttrs(this));
      this.t = t;
      this.root.innerHTML = `<style>${CSS}</style><div class="card" part="card">
        <p class="eyebrow">Write ${t.minWords}–${t.maxWords} words</p>
        <p class="prompt">${esc(t.prompt)}</p>
        <ul class="chips">${t.keyPoints.map(k => `<li>${esc(k.label)}</li>`).join('')}</ul>
        <textarea class="ruled" spellcheck="true" aria-label="Your answer" placeholder="${esc(this.getAttribute('placeholder') || 'Write your answer here…')}"></textarea>
        <div class="bar"><span class="grow count"></span><button class="btn check" type="button" disabled>Check my answer</button></div>
        <div class="out" hidden></div></div>`;
      const ta = this.$('textarea');
      ta.addEventListener('input', () => this.update());
      this.$('.check').onclick = () => this.check();
      this.update();
    }
    get value() { return this.$('textarea').value; }
    set value(v) { this.$('textarea').value = v; this.update(); }
    update() {
      const text = this.value, n = (text.match(/[A-Za-z0-9’']+/g) || []).length;
      this.$('.count').innerHTML = `<b>${n}</b> word${n === 1 ? '' : 's'} · aim ${this.t.minWords}–${this.t.maxWords}`;
      this.$('.check').disabled = n < 3;
      keyPoints(text, this.t).then(cov => this.root.querySelectorAll('.chips li').forEach((li, i) => li.classList.toggle('hit', !!(cov[i] && cov[i].hit))));
    }
    reset() { this.value = ''; this.$('.out').hidden = true; }
    start() { this.$('textarea').focus(); }
    stop() {}
    async check() {
      const text = this.value, r = await checkText(text, this.t), out = this.$('.out');
      const better = r.corrected && r.corrected.trim() !== text.trim() ? diffMark(text, r.corrected) : '';
      out.hidden = false;
      out.innerHTML = `<div class="result">${ring(r.total, 16)}<div><p class="h">${esc(r.level)} · ${esc(r.headline)}</p></div></div>
        ${r.improve.length ? `<ul class="fix">${r.improve.map(i => `<li>${i.quote ? `<span class="q">${esc(i.quote)}</span>` : ''}${i.quote && i.better ? ' → ' : ''}${i.better ? `<span class="b">${esc(i.better)}</span>` : ''} ${esc(i.why)}</li>`).join('')}</ul>` : ''}
        ${better ? `<p class="eyebrow" style="margin-top:6px">A better version</p><p class="ruled" style="white-space:pre-wrap">${better}</p>` : ''}`;
      this.fire('result', r);
      return r;
    }
  }

  if (!customElements.get('read-aloud')) customElements.define('read-aloud', ReadAloud);
  if (!customElements.get('speak-answer')) customElements.define('speak-answer', SpeakAnswer);
  if (!customElements.get('write-answer')) customElements.define('write-answer', WriteAnswer);
})();
