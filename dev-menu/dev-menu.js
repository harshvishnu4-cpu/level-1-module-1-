/* =========================================================
   DEV MENU: for testing only.
   Jump to any screen of any page from a menu in the top-left corner.

   To remove it: delete this dev-menu folder and the one line marked "DEV MENU"
   near the end of index.html, reading.html and quick-check.html. Nothing else uses it.

   How it moves between screens without touching the lesson code:
   - same page: it clicks a hidden button with data-go="<screen>", which the page already understands;
   - another page: it opens that page with ?devgo=<screen>, then does the same there.
   ========================================================= */
(() => {
  'use strict';
  const script = document.currentScript;
  const base = script ? script.src.replace(/[^/]*$/, '') : 'dev-menu/';
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = base + 'dev-menu.css?v=1';
  document.head.append(css);

  const PAGE = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const GROUPS = [
    { page: 'index.html', title: 'Segments and path', items: [['segments', 'Segments'], ['welcome', 'Learning path']] },
    { page: 'index.html', title: 'Stage 4 · Key Words', items: [['intro', 'Start screen'], ['greetings', '1 · Greetings'], ['farewells', '2 · Farewells'], ['compare', '3 · Arrive or leave'], ['match', '4 · Word Match'], ['sprint', '5 · Scenario Sprint'], ['end', 'Your result']] },
    { page: 'reading.html', title: 'Stage 5 · Reading Card', items: [['read', 'Reading'], ['readq', 'Questions'], ['readdone', 'Reading done']] },
    { page: 'quick-check.html', title: 'Stage 8 · Quick Check', items: [['check', 'Questions'], ['checkdone', 'Done']] },
    { page: 'result.html', title: 'Segment 1 · Analysis', items: [['result', 'Your result']] }
  ];
  const view = () => document.body.dataset.view || '';

  /* move on this page: a hidden data-go button, clicked; tried again if the page was busy animating */
  function jumpHere(screen, tries = 0) {
    if (view() === screen) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.hidden = true;
    b.dataset.go = screen;
    document.body.append(b);
    b.click();
    b.remove();
    if (tries < 8) setTimeout(() => { if (view() !== screen) jumpHere(screen, tries + 1); }, 400);
  }
  function go(page, screen) {
    if (page === PAGE) return jumpHere(screen);
    location.href = page === 'index.html' && screen === 'welcome' ? 'index.html#path' : `${page}?devgo=${encodeURIComponent(screen)}`;
  }
  /* arrived from another page's dev menu */
  const want = new URLSearchParams(location.search).get('devgo');
  if (want) {
    const url = new URL(location.href);
    url.searchParams.delete('devgo');
    try { history.replaceState(null, '', url.pathname + url.search + url.hash); } catch (e) { /* file:// */ }
    setTimeout(() => jumpHere(want), 700);
  }

  /* the button, in the top-left corner of the black top bar */
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'devm-btn';
  btn.title = 'Dev menu (testing only)';
  btn.setAttribute('aria-label', 'Open dev menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'devm');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span class="devm-badge" aria-hidden="true">DEV</span>';
  const bar = document.querySelector('.topbar');
  if (bar) bar.prepend(btn); else { btn.classList.add('devm-float'); document.body.append(btn); }
  document.body.classList.add('has-devm');

  /* the panel */
  const menu = document.createElement('div');
  menu.className = 'devm';
  menu.id = 'devm';
  menu.hidden = true;
  menu.innerHTML = `<div class="devm-scrim"></div>
    <nav class="devm-panel" role="dialog" aria-modal="true" aria-labelledby="devm-title">
      <div class="devm-head"><div><span class="devm-chip">Testing only</span><h2 class="devm-title" id="devm-title">Dev menu</h2></div>
        <button type="button" class="devm-close" aria-label="Close dev menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <div class="devm-list"></div>
    </nav>`;
  document.body.append(menu);
  const list = menu.querySelector('.devm-list');

  function render() {
    list.innerHTML = GROUPS.map(g => `<section class="devm-group${g.page === PAGE ? ' is-page' : ''}">
        <h3 class="devm-gtitle">${g.title}<small>${g.page}</small></h3>
        ${g.items.map(([screen, label]) => {
          const here = g.page === PAGE && view() === screen;
          return `<a class="devm-item${here ? ' is-active' : ''}" href="${g.page}" data-page="${g.page}" data-screen="${screen}"${here ? ' aria-current="page"' : ''}><span class="devm-dot"></span><span>${label}</span>${here ? '<span class="devm-here">You are here</span>' : ''}</a>`;
        }).join('')}
      </section>`).join('');
  }
  function open() {
    render();
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => menu.classList.add('is-open'));
    (menu.querySelector('.devm-item.is-active') || menu.querySelector('.devm-close')).focus({ preventScroll: true });
  }
  function close(refocus = true) {
    if (menu.hidden) return;
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    setTimeout(() => { menu.hidden = true; }, 220);
    if (refocus) btn.focus({ preventScroll: true });
  }

  btn.addEventListener('click', () => (menu.hidden ? open() : close()));
  menu.addEventListener('click', e => {
    if (e.target.closest('.devm-scrim, .devm-close')) return close();     // click outside the panel, or the X
    const a = e.target.closest('.devm-item');
    if (!a) return;
    e.preventDefault();
    close(false);                                                          // selecting an item closes the menu
    go(a.dataset.page, a.dataset.screen);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) close(); });
})();
