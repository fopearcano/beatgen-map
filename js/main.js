/*
 * Wiring: hash routing, the map/network switch, theme, search, the journey
 * player and the phone bottom sheet.
 */
(function () {
  'use strict';
  const A = window.Atlas;
  const { byId, state } = A;
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);

  const TABS = ['journeys', 'places', 'people', 'works', 'chronology'];
  const TAB_OF = { place: 'places', person: 'people', work: 'works', event: 'chronology', journey: 'journeys' };
  const phone = window.matchMedia('(max-width: 820px)');
  let autoplay = null;

  /* ------------------------------------------------------------- routes */
  function parseHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return { tab: 'journeys' };
    if (TABS.includes(h)) return { tab: h };
    if (h === 'network') return { view: 'network' };
    for (const type of Object.keys(TAB_OF)) {
      if (h.startsWith(type + '-')) {
        const id = h.slice(type.length + 1);
        if (byId[type].has(id)) return { sel: { type, id } };
      }
    }
    return { tab: 'journeys' };
  }

  function hashFor(sel) { return sel ? `#${sel.type}-${sel.id}` : `#${state.tab}`; }

  function go(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  function route() {
    const r = parseHash();
    stopAutoplay();
    if (r.view === 'network') { setView('network'); if (!state.sel) renderAll(); return; }
    const prev = state.sel;
    if (r.tab) {
      state.tab = r.tab;
      state.sel = null;
    } else {
      state.sel = r.sel;
      state.tab = TAB_OF[r.sel.type];
    }
    const sameJourney = prev && state.sel && prev.type === 'journey' && state.sel.type === 'journey' && prev.id === state.sel.id;
    if (!sameJourney) state.step = -1;
    state.query = '';
    $('search').value = '';
    renderAll();
    A.map.select(state.sel, { fly: state.view === 'map' });
    A.panel.scrollTop();
    if (phone.matches && state.sel) setSheet(false);
  }

  function renderAll() {
    document.querySelectorAll('#tabs a').forEach((a) => {
      const on = a.dataset.tab === state.tab;
      a.classList.toggle('is-on', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    A.panel.render();
    A.timelineView.highlight();
    A.network.highlight();
    updateStorybar();
  }

  /* -------------------------------------------------------------- views */
  function setView(v) {
    state.view = v;
    const isMap = v === 'map';
    $('map').hidden = !isMap;
    $('network').hidden = isMap;
    $('legend').hidden = !isMap;
    $('timeline').hidden = !isMap;
    $('view-map').classList.toggle('is-on', isMap);
    $('view-network').classList.toggle('is-on', !isMap);
    $('view-map').setAttribute('aria-pressed', String(isMap));
    $('view-network').setAttribute('aria-pressed', String(!isMap));
    document.querySelector('.stage').setAttribute('aria-label', isMap ? 'Map' : 'Network');
    updateStorybar();
    if (isMap) {
      A.map.invalidate();
      A.map.select(state.sel, { fly: !!state.sel });
    } else A.network.show();
  }

  /* -------------------------------------------------------------- theme */
  function isDark() {
    const t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function themeChanged() {
    const dark = isDark();
    $('theme-toggle').setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#15181d' : '#fbfaf5');
    A.map.restyle();
  }
  const savedTheme = A.store.get('theme');
  if (savedTheme === 'dark' || savedTheme === 'light') root.setAttribute('data-theme', savedTheme);

  /* ----------------------------------------------------------- journeys */
  function journey() { return state.sel && state.sel.type === 'journey' ? byId.journey.get(state.sel.id) : null; }

  function goStep(i) {
    const j = journey();
    if (!j) return;
    state.step = Math.max(0, Math.min(j.stops.length - 1, i));
    if (state.view !== 'map') setView('map');
    A.map.showStep(state.step, true);
    A.panel.markStep(state.step);
    updateStorybar();
  }

  function updateStorybar() {
    const j = journey();
    const bar = $('storybar');
    bar.hidden = !j || state.view !== 'map';
    if (!j) return;
    const n = j.stops.length;
    const s = state.step >= 0 ? j.stops[state.step] : null;
    $('sb-kicker').textContent = s ? `${j.title} · stop ${state.step + 1} of ${n} · ${s.date}` : `${j.title} · ${j.span} · ${n} stops`;
    $('sb-title').textContent = s ? s.title : 'Press play to start the journey';
    $('sb-prev').disabled = state.step <= 0;
    $('sb-next').disabled = state.step >= n - 1;
    $('sb-play').classList.toggle('is-playing', !!autoplay);
    $('sb-play').setAttribute('aria-label', autoplay ? 'Pause' : 'Play');
  }

  function stopAutoplay() {
    if (autoplay) { clearTimeout(autoplay); autoplay = null; }
    if ($('sb-play')) { $('sb-play').classList.remove('is-playing'); $('sb-play').setAttribute('aria-label', 'Play'); }
  }
  function scheduleNext() {
    const j = journey();
    if (!j || state.step >= j.stops.length - 1) { stopAutoplay(); updateStorybar(); return; }
    autoplay = setTimeout(() => { goStep(state.step + 1); scheduleNext(); }, A.reducedMotion.matches ? 8000 : 6500);
    updateStorybar();
  }
  function toggleAutoplay() {
    const j = journey();
    if (!j) return;
    if (autoplay) { stopAutoplay(); updateStorybar(); return; }
    if (state.step < 0 || state.step >= j.stops.length - 1) goStep(0);
    autoplay = -1;
    scheduleNext();
  }

  /* -------------------------------------------------------------- sheet */
  function setSheet(open) {
    const sb = $('sidebar');
    sb.classList.toggle('is-expanded', open);
    $('sheet-handle').setAttribute('aria-expanded', String(open));
    $('sheet-handle').querySelector('.sheet-label').textContent = open ? 'Collapse list' : 'Expand list';
  }

  /* --------------------------------------------------------------- init */
  function init() {
    A.map.init();
    A.timelineView.init();

    A.on('navigate', (sel) => go(hashFor(sel)));
    A.on('tab', (tab) => go('#' + tab));
    A.on('view', (v) => { setView(v); });
    A.on('journey-step', (i) => { stopAutoplay(); goStep(i); });
    A.on('range', () => {
      A.map.renderPins();
      if (!state.sel && !state.query && (state.tab === 'places' || state.tab === 'chronology')) A.panel.render();
    });
    A.on('kinds', () => {
      A.map.renderPins();
      if (!state.sel && !state.query && state.tab === 'places') A.panel.render();
    });

    window.addEventListener('hashchange', route);
    $('view-map').addEventListener('click', () => { setView('map'); if (location.hash === '#network') history.replaceState(null, '', hashFor(state.sel)); });
    $('view-network').addEventListener('click', () => setView('network'));
    $('theme-toggle').addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      A.store.set('theme', next);
      themeChanged();
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', themeChanged);
    new MutationObserver(themeChanged).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    $('search').addEventListener('input', (ev) => { state.query = ev.target.value; A.panel.render(); A.panel.scrollTop(); });
    $('search').addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { ev.target.value = ''; state.query = ''; A.panel.render(); } });
    $('search').addEventListener('focus', () => { if (phone.matches) setSheet(true); });

    $('sb-prev').addEventListener('click', () => { stopAutoplay(); goStep(state.step - 1); });
    $('sb-next').addEventListener('click', () => { stopAutoplay(); goStep(state.step + 1); });
    $('sb-play').addEventListener('click', toggleAutoplay);
    $('sb-close').addEventListener('click', () => go('#journeys'));

    $('sheet-handle').addEventListener('click', () => setSheet(!$('sidebar').classList.contains('is-expanded')));
    $('sidebar').addEventListener('transitionend', (ev) => { if (ev.propertyName === 'height') A.map.invalidate(); });
    new ResizeObserver(() => A.map.invalidate()).observe(document.querySelector('.canvas'));

    document.addEventListener('keydown', (ev) => {
      if (ev.target.closest('input, textarea')) return;
      if (journey() && state.view === 'map' && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') && !ev.target.closest('.leaflet-container')) {
        ev.preventDefault();
        stopAutoplay();
        goStep(state.step + (ev.key === 'ArrowRight' ? 1 : -1));
      } else if (ev.key === 'Escape' && state.sel) {
        go('#' + state.tab);
      } else if (ev.key === '/' && !ev.metaKey && !ev.ctrlKey) {
        ev.preventDefault();
        $('search').focus();
      }
    });

    themeChanged();
    if (parseHash().view === 'network') { state.tab = 'people'; renderAll(); setView('network'); }
    else route();
  }

  init();
})();
