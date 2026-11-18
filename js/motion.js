/*
  Motion: the course's animations, built on GSAP (lib/gsap.min.js, kept with the app so it works offline).

  Motion answers what the learner does: cards arrive when a page opens, the learning path draws itself,
  a score ring fills and counts up (with confetti for a great score), key points pop as they tick,
  the mic pulses while it listens, and an unseen passage's cover lifts away.

  It watches the page (MutationObserver), so pages need almost no changes. Nothing moves when the
  learner has asked for reduced motion, or if GSAP isn't loaded; the pages work the same without it.
*/
(function (root) {
  'use strict';
  const gsap = root.gsap;
  const still = !gsap || (root.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const CONFETTI = ['#c6f1d5', '#f3d3f6', '#fde8b0', '#d3eefa', '#fbd0e3', '#2fae62', '#16181d'];
  const recent = new WeakMap(); // container -> last time its contents were animated (results are often drawn twice)
  const ringAt = new WeakMap();
  const fresh = el => { const t = recent.get(el) || 0, now = performance.now(); recent.set(el, now); return now - t > 900; };

  // ---------- building blocks ----------
  function enter(targets, opts = {}) {
    if (still || !targets || (targets.length === 0)) return;
    gsap.from(targets, { y: 22, opacity: 0, duration: 0.55, ease: 'power3.out', stagger: 0.06, clearProps: 'transform,opacity', ...opts });
  }
  function pop(el, scale = 1.18) {
    if (still || !el) return;
    gsap.fromTo(el, { scale: 1 }, { scale, duration: 0.16, ease: 'power2.out', yoyo: true, repeat: 1, clearProps: 'transform' });
  }
  function countUp(el, to, duration = 0.9) {
    if (still || !el || !isFinite(to)) return;
    const o = { v: 0 };
    gsap.to(o, { v: to, duration, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); }, onComplete: () => { el.textContent = to; } });
  }
  function confetti(from, pieces = 46) {
    if (still || !from) return;
    const r = from.getBoundingClientRect(), x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
    for (let i = 0; i < pieces; i++) {
      const p = document.createElement('i');
      const w = 6 + Math.random() * 6, round = Math.random() < 0.35;
      Object.assign(p.style, { position: 'fixed', left: x0 + 'px', top: y0 + 'px', width: w + 'px', height: (round ? w : w * 0.45) + 'px',
        background: CONFETTI[i % CONFETTI.length], borderRadius: round ? '50%' : '2px', zIndex: 60, pointerEvents: 'none' });
      document.body.append(p);
      const angle = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 150;
      gsap.timeline({ onComplete: () => p.remove() })
        .to(p, { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist * 0.7 - 70, rotation: Math.random() * 540 - 270, duration: 0.65, ease: 'power3.out' })
        .to(p, { y: '+=' + (160 + Math.random() * 120), opacity: 0, rotation: '+=' + (Math.random() * 360), duration: 0.9, ease: 'power1.in' }, '>-0.05');
    }
  }

  // A score ring: fill from empty, count the number up, celebrate a great score.
  function ring(svg) {
    if (still || !svg || svg.dataset.animated) return;
    svg.dataset.animated = '1';
    const host = svg.closest(RESULTS); // the same result redrawn moments later (device first, then online feedback): no replay
    if (host) { const t = ringAt.get(host) || 0, now = performance.now(); ringAt.set(host, now); if (now - t < 1500) return; }
    const fg = svg.querySelector('.fg'), text = svg.querySelector('text');
    if (!fg) return;
    const [len, full] = (fg.getAttribute('stroke-dasharray') || '0 0').split(/\s+/).map(Number);
    gsap.fromTo(fg, { attr: { 'stroke-dasharray': `0 ${full}` } }, { attr: { 'stroke-dasharray': `${len} ${full}` }, duration: 1.1, ease: 'power3.out', delay: 0.15 });
    const num = text && text.firstChild && text.firstChild.nodeType === 3 ? text.firstChild : null;
    if (num) { const to = +num.textContent; const o = { v: 0 }; gsap.to(o, { v: to, duration: 1.1, ease: 'power3.out', delay: 0.15, onUpdate: () => { num.textContent = Math.round(o.v); }, onComplete: () => { num.textContent = to; } }); }
    gsap.from(svg, { scale: 0.6, rotation: -20, opacity: 0, duration: 0.6, ease: 'back.out(1.8)', clearProps: 'transform,opacity' });
    if (full && len / full >= 0.8 && !svg.closest('.me')) setTimeout(() => confetti(svg), 650);
  }

  // The unseen passage: lift the cover away and bring the text into focus. Returns when done.
  function uncover(cover, text) {
    if (still) { cover.hidden = true; return Promise.resolve(); }
    return new Promise(res => {
      gsap.timeline({ onComplete: () => { cover.hidden = true; gsap.set(cover, { clearProps: 'all' }); res(); } })
        .to(cover, { y: -40, opacity: 0, duration: 0.45, ease: 'power2.in' })
        .fromTo(text, { filter: 'blur(7px)' }, { filter: 'blur(0px)', duration: 0.5, ease: 'power2.out', clearProps: 'filter' }, 0.1);
    });
  }

  // ---------- what happens on each page ----------
  function arrive() {
    if (still) return;
    const $$ = s => [...document.querySelectorAll(s)];
    enter($$('.pagehead > *'), { stagger: 0.08 });
    enter($$('#lessons .lesson'), { delay: 0.1, stagger: 0.05, y: 16 });
    enter($$('#steps li'), { delay: 0.2, x: -10, y: 0 });
    enter($$('main .work > *'), { delay: 0.25, stagger: 0.1 });
    // learning plan: counts tick up, the path draws itself, the lessons pop in along it
    $$('.stats .stat').forEach((s, i) => { enter([s], { delay: 0.1 + i * 0.07, scale: 0.9 }); const b = s.querySelector('b'); if (b) countUp(b, +b.textContent, 1.1); });
    const path = document.querySelector('.path');
    if (path) {
      gsap.fromTo(path, { '--draw': 0 }, { '--draw': 1, duration: 1.4, ease: 'power2.inOut', delay: 0.2 });
      enter($$('.path .node'), { delay: 0.35, stagger: 0.09, y: 30, scale: 0.97 });
      const play = document.querySelector('.node.next .play');
      if (play) gsap.to(play, { scale: 1.07, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.4 });
    }
    enter($$('.side h2, .side .evt, .side .empty'), { delay: 0.5, x: 20, y: 0 });
  }

  // results, rings, ticks, steps, the mic and the action bar, whenever the page changes them
  const RESULTS = '#feedback, #results, #scoreCard, #analysis, #quiz';
  function watch() {
    if (still) return;
    const mo = new MutationObserver(list => {
      for (const m of list) {
        const el = m.target;
        if (m.type === 'attributes' && m.attributeName === 'hidden' && !el.hidden) {
          if (el.matches(RESULTS) && fresh(el)) enter([...el.children], { stagger: 0.08 });
          if (el.matches('.actionbar')) gsap.from(el, { y: 90, opacity: 0, duration: 0.5, ease: 'back.out(1.4)', clearProps: 'transform,opacity' });
        }
        if (m.type === 'attributes' && m.attributeName === 'class') {
          if (el.matches('.chips li') && el.classList.contains('hit') && !(m.oldValue || '').includes('hit')) pop(el, 1.12);
          if (el.matches('#steps li') && el.classList.contains('on') && !(m.oldValue || '').split(' ').includes('on')) pop(el.querySelector('.n'), 1.3);
          if (el.matches('.mic')) {
            const on = el.classList.contains('recording');
            if (on && !el._pulse) el._pulse = gsap.to(el, { scale: 1.06, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
            if (!on && el._pulse) { el._pulse.kill(); el._pulse = null; gsap.to(el, { scale: 1, duration: 0.2, clearProps: 'transform' }); }
          }
        }
        if (m.type === 'childList') {
          for (const n of m.addedNodes) {
            if (n.nodeType !== 1) continue;
            (n.matches('svg.ring') ? [n] : [...n.querySelectorAll('svg.ring')]).forEach(ring);
          }
          if (el.matches(RESULTS) && !el.hidden && m.addedNodes.length && fresh(el)) enter([...el.children], { stagger: 0.08 });
        }
      }
    });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeOldValue: true, attributeFilter: ['hidden', 'class'] });
  }

  root.Motion = { enter, pop, countUp, confetti, ring, uncover, get still() { return still; } };
  const go = () => { arrive(); watch(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})(typeof self !== 'undefined' ? self : this);
