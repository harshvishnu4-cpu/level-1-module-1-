/* Segment 1 result page (result.html): every first try across the segment, in three cards.
   Needs js/kw-core.js first. Results are saved by each activity in the shared progress (results.story,
   results.sprint, results.reading, results.check): one record per item; the first try sets the score. */
const RES_ORDER = ['story', 'sprint', 'reading', 'check'];
const RES_SKILLS = ['Time-of-day greetings', 'Arriving vs. leaving', 'Reading for detail', 'Courtesy words', 'I am / This is'];
const RES_TONE = { 'Arrive or leave': 'sun', 'Scenario Sprint': 'lilac', 'Reading Card': 'sky', 'Quick Check': 'mint' };
const RES_ICO = {
  bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.8.6 1.1 1.4 1.1 2.2h5c0-.8.3-1.6 1.1-2.2A6 6 0 0 0 12 3z"/></svg>',
  chart: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="12" width="4.2" height="9" rx="1.3" fill="#4cc874"/><rect x="9.9" y="7" width="4.2" height="14" rx="1.3" fill="#2fae62"/><rect x="16.8" y="3" width="4.2" height="18" rx="1.3" fill="#4cc874"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r=".8" fill="currentColor"/><circle cx="4.5" cy="12" r=".8" fill="currentColor"/><circle cx="4.5" cy="18" r=".8" fill="currentColor"/></svg>',
  party: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l5-14 9 9z"/><path d="M14 4l.5 2M19 6l-2 1.5M20 11l-2-.5"/><circle cx="16" cy="3" r=".6" fill="currentColor"/></svg>',
  retake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg>'
};

const Result = {
  items() { const r = Store.get().results || {}; return RES_ORDER.flatMap(k => r[k] || []); },
  label(pct, total) {
    if (!total) return 'Not started';
    if (pct >= 85) return 'Excellent';
    if (pct >= 70) return 'Great';
    if (pct >= 50) return 'Good effort';
    return 'Keep practising';
  },
  render() {
    const items = this.items(), total = items.length, first = items.filter(i => i.firstRight).length;
    const pct = total ? Math.round(first / total * 100) : 0, label = this.label(pct, total);

    /* B1. Score card */
    const len = total ? (251.3 * first / total).toFixed(1) : 0;
    $('#res-score').innerHTML = `
      <div class="res-top">
        <svg class="ring res-ring" viewBox="0 0 96 96" role="img" aria-label="${first} of ${total} right first time"><circle class="bg" cx="48" cy="48" r="40" fill="none" stroke-width="10"/><circle class="fg" cx="48" cy="48" r="40" fill="none" stroke-width="10" stroke-linecap="round" stroke-dasharray="${len} 251.3" transform="rotate(-90 48 48)"/><text x="48" y="57" text-anchor="middle" font-weight="700">${first}<tspan class="of">/${total}</tspan></text></svg>
        <div class="res-words">
          <span class="res-label l-${label.toLowerCase().replace(/[^a-z]+/g, '-')}">${label}</span>
          <h2 class="res-main" id="res-score-t">${total ? `You got ${first} out of ${total} right first time!` : 'No answers yet.'}</h2>
          <p class="res-sub">Only first tries count. Retake to improve your score.</p>
        </div>
      </div>
      <div class="res-tiles">
        <div class="res-tile blue"><span class="res-tile-ico">${RES_ICO.list}</span><div><b>${total}</b><span>Questions</span></div></div>
        <div class="res-tile green"><span class="res-tile-ico">${first > 0 ? RES_ICO.party : UI.check}</span><div><b>${first}</b><span>First try</span></div></div>
      </div>`;

    /* B2. What to practise */
    const review = items.filter(i => !i.firstRight);
    const rows = review.map((it, k) => `<tr>
        <td class="rp-n" data-label="#">${k + 1}</td>
        <td class="rp-q" data-label="Question"><span class="rp-text">${escH(it.question)}</span><span class="rp-src t-${RES_TONE[it.source] || 'sky'}">${escH(it.source)}</span></td>
        <td class="rp-wrong" data-label="What was wrong">${escH(it.first || '–')}</td>
        <td class="rp-fix" data-label="Practise this instead"><b>${escH(it.correct)}</b>${it.tip ? `<span>${escH(it.tip)}</span>` : ''}</td>
      </tr>`).join('');
    const empty = !total ? 'Finish the activities to see what to practise.' : 'Nothing to review — every answer was right first time.';
    $('#res-practise').innerHTML = `
      <div class="res-head"><span class="res-hico bulb">${RES_ICO.bulb}</span><h2 id="res-pr-t">What to practise</h2><span class="res-count">${review.length} to review</span></div>
      ${review.length ? `<div class="rp-scroll"><table class="rp-table"><thead><tr><th class="rp-n" scope="col">#</th><th scope="col">Question</th><th scope="col">What was wrong</th><th scope="col">Practise this instead</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : `<p class="rp-empty">${empty}</p>`}`;

    /* B3. Skills (first try) */
    $('#res-skills').innerHTML = `
      <div class="res-head"><span class="res-hico">${RES_ICO.chart}</span><h2 id="res-sk-t">Skills <small>(first try)</small></h2></div>
      <ul class="sk-list">${RES_SKILLS.map(s => {
        const mine = items.filter(i => i.skill === s), right = mine.filter(i => i.firstRight).length;
        const p = mine.length ? Math.round(right / mine.length * 100) : null;
        const tone = p === null ? 'none' : p >= 80 ? 'high' : p >= 60 ? 'mid' : 'low';
        return `<li class="sk ${tone}"><div class="sk-row"><span class="sk-name">${s}</span><span class="sk-pct">${p === null ? '—' : `${p}%`}</span></div>
          <span class="sk-bar" role="img" aria-label="${s}: ${p === null ? 'not attempted' : `${p}% right first time`}"><i data-w="${p || 0}" style="width:${p || 0}%"></i></span></li>`;
      }).join('')}</ul>`;

    /* B5. Opening the page completes the segment, and keeps a copy of the report on the device */
    Store.set({ segmentDone: true });
    try {
      localStorage.setItem('commskills-s1-last-report', JSON.stringify({
        time: Date.now(), timestamp: new Date().toISOString(), score: { first, total, pct, label },
        skills: RES_SKILLS.map(s => { const m = items.filter(i => i.skill === s); return { skill: s, total: m.length, first: m.filter(i => i.firstRight).length }; }),
        items, log: Store.get()
      }));
    } catch (e) { /* storage blocked */ }

    if (!RM) {
      gsap.fromTo('.res-grid > .card', { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .55, ease: 'power3.out', stagger: .09, clearProps: 'transform,opacity,visibility' });
      $$('.sk-bar i').forEach((el, k) => gsap.fromTo(el, { width: '0%' }, { width: `${el.dataset.w}%`, duration: 1, ease: 'power3.out', delay: .45 + k * .08 }));
      gsap.fromTo('.res-label', { scale: .6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .5, ease: 'back.out(2.4)', delay: .6, clearProps: 'transform,opacity,visibility' });
    }
    if (first) gsap.delayedCall(.7, () => SFX.good());
  }
};

/* Retake: asks first, then clears all progress and goes back to the Key Words start screen */
const Confirm = {
  opener: null,
  open() {
    const m = $('#confirm');
    this.opener = document.activeElement;
    m.hidden = false;
    if (!RM) { gsap.fromTo(m, { autoAlpha: 0 }, { autoAlpha: 1, duration: .2 }); gsap.fromTo('#confirm .modal-card', { scale: .88, y: 20 }, { scale: 1, y: 0, duration: .4, ease: 'back.out(1.8)' }); }
    setTimeout(() => $('#cf-cancel').focus(), 60);
  },
  close() { $('#confirm').hidden = true; if (this.opener) this.opener.focus(); },
  retake() {
    try { localStorage.removeItem(Store.KEY); localStorage.removeItem('kw-stage4-last-report'); sessionStorage.removeItem('kw-launch'); } catch (e) { /* storage blocked */ }
    location.href = 'index.html';
  }
};

Screens.enter = name => { if (name === 'result') Result.render(); };
document.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (e.target.id === 'confirm') return Confirm.close();           // the dark area around the box
  if (!t || t.disabled) return;
  if (t.id === 'retake') return Confirm.open();
  if (t.id === 'cf-cancel') return Confirm.close();
  if (t.id === 'cf-go') return Confirm.retake();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#confirm').hidden) Confirm.close(); });
fillIcons();
$('#retake').insertAdjacentHTML('afterbegin', RES_ICO.retake);
startAt('result');
Arrive.play();
