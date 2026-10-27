/*
 * Beat Atlas core: indexes the data files, holds shared state and a tiny
 * event bus, and provides the SVG glyphs used by the map, lists and timeline.
 */
(function () {
  'use strict';
  const B = window.BEAT;

  /* ------------------------------------------------------------ events */
  const handlers = {};
  function on(name, fn) { (handlers[name] = handlers[name] || []).push(fn); }
  function emit(name, payload) { (handlers[name] || []).forEach((fn) => fn(payload)); }

  /* ------------------------------------------------------------- kinds */
  const KINDS = {
    home: 'Homes & pads',
    scene: 'Bars, cafés & clubs',
    press: 'Bookshops & presses',
    stage: 'Readings & stages',
    wild: 'Mountains & wild places',
    institution: 'Campuses, courts & asylums',
    street: 'Streets & scenes',
    grave: 'Graves',
  };
  const KIND_SHORT = {
    home: 'Homes', scene: 'Bars & cafés', press: 'Presses', stage: 'Stages',
    wild: 'Wild places', institution: 'Institutions', street: 'Street scenes', grave: 'Graves',
  };
  const KIND_ONE = {
    home: 'Home', scene: 'Bar or café', press: 'Bookshop or press', stage: 'Stage',
    wild: 'Wild place', institution: 'Institution', street: 'Street scene', grave: 'Grave',
  };
  const EVENT_KINDS = {
    publish: 'Published', meet: 'Meeting', write: 'Writing', read: 'Reading or performance',
    travel: 'Journey or move', law: 'Crime, arrest or trial', death: 'Death', other: 'Event',
  };
  const WORK_KINDS = {
    novel: 'Novel', poetry: 'Poetry', prose: 'Prose', memoir: 'Memoir', letters: 'Letters',
    magazine: 'Magazine', film: 'Film', photobook: 'Photobook', play: 'Play',
  };

  /* Place symbols, drawn in a 20×20 box, like the point symbols of a road map. */
  const SHAPES = {
    home: '<rect class="g-fill" x="4" y="4" width="12" height="12"/>',
    scene: '<circle class="g-fill" cx="10" cy="10" r="6.5"/>',
    press: '<path class="g-fill" d="M10 2.5 17.5 10 10 17.5 2.5 10z"/>',
    stage: '<path class="g-fill" d="m10 2 2.35 5.2 5.65.6-4.25 3.8 1.2 5.6L10 14.3l-4.95 2.9 1.2-5.6L2 7.8l5.65-.6z"/>',
    wild: '<path class="g-fill" d="M10 3 18 16.5H2z"/>',
    institution: '<path class="g-fill" d="M10 2.5 16.5 6.2v7.6L10 17.5l-6.5-3.7V6.2z"/>',
    street: '<circle class="g-line" cx="10" cy="10" r="6"/><circle class="g-fill" cx="10" cy="10" r="2.4"/>',
    grave: '<path class="g-fill" d="M8.4 2.5h3.2v4.3h4v3.2h-4v7.5H8.4V10h-4V6.8h4z"/>',
  };
  /* Timeline glyphs, 12×12 box. */
  const TL_SHAPES = {
    publish: '<rect class="g-fill" x="2" y="1" width="8" height="10" rx="0.5"/><rect class="g-hole" x="3.4" y="2.6" width="1.3" height="6.8"/>',
    read: '<path class="g-fill" d="m6 .8 1.5 3.4 3.7.4-2.8 2.5.8 3.7L6 8.9 2.8 10.8l.8-3.7L.8 4.6l3.7-.4z"/>',
    law: '<path class="g-fill" d="M6 .8 11.2 6 6 11.2.8 6z"/>',
    death: '<path class="g-fill" d="M5 .8h2v3.1h2.6v2H7v5.3H5V5.9H2.4v-2H5z"/>',
    travel: '<path class="g-fill" d="M6 1.2 11 10.6H1z"/>',
    meet: '<circle class="g-line" cx="6" cy="6" r="4.2"/>',
    write: '<circle class="g-fill" cx="6" cy="6" r="4.4"/>',
    other: '<circle class="g-fill" cx="6" cy="6" r="3.4"/>',
  };
  function glyph(kind, cls) {
    return `<svg class="glyph ${cls || ''}" viewBox="0 0 20 20" aria-hidden="true">${SHAPES[kind] || SHAPES.scene}</svg>`;
  }
  function tlGlyph(kind) { return TL_SHAPES[kind] || TL_SHAPES.other; }

  const SHIELD_PATH = 'M2.5 1.5h21c.4 2.2-.1 4.2.6 6.5 1 3.3 1.5 6.9-.4 10.3-2 3.6-6.5 6.6-10.7 9.2-4.2-2.6-8.7-5.6-10.7-9.2C.4 14.9.9 11.3 1.9 8c.7-2.3.2-4.3.6-6.5z';
  function shield(n, on) {
    const s = String(n);
    const size = s.length > 2 ? 9.5 : s.length > 1 ? 11.5 : 13;
    return `<svg class="shield${on ? ' is-on' : ''}" viewBox="0 0 26 29" aria-hidden="true"><path d="${SHIELD_PATH}"/><text x="13" y="17.6" text-anchor="middle" style="font-size:${size}px">${s}</text></svg>`;
  }

  /* ------------------------------------------------------------- index */
  const byId = { place: new Map(), person: new Map(), work: new Map(), event: new Map(), journey: new Map() };
  B.places.forEach((p) => byId.place.set(p.id, p));
  B.people.forEach((p) => byId.person.set(p.id, p));
  B.works.forEach((w) => byId.work.set(w.id, w));
  B.events.forEach((e) => byId.event.set(e.id, e));
  B.journeys.forEach((j) => byId.journey.set(j.id, j));

  B.places.forEach((p) => { p.written = []; p.setting = []; p.published = []; p.events = []; });
  B.people.forEach((p) => { p.works = []; p.ties = []; p.events = []; p.places = new Set(); });

  B.works.forEach((w) => {
    w.written.forEach((id) => byId.place.get(id).written.push(w));
    w.set.forEach((id) => byId.place.get(id).setting.push(w));
    if (w.press) byId.place.get(w.press).published.push(w);
    w.by.forEach((id) => byId.person.get(id).works.push(w));
  });
  B.events.forEach((e) => {
    if (e.place) byId.place.get(e.place).events.push(e);
    e.people.forEach((id) => byId.person.get(id).events.push(e));
  });
  B.ties.forEach(([a, b, kind, note]) => {
    byId.person.get(a).ties.push({ other: b, kind, note });
    byId.person.get(b).ties.push({ other: a, kind, note });
  });
  B.places.forEach((p) => p.people.forEach((id) => byId.person.get(id).places.add(p.id)));
  B.people.forEach((p) => p.life.forEach(([pl]) => p.places.add(pl)));

  /* Short display names: surnames, with initials where two people share one. */
  const surname = (p) => {
    const words = p.name.replace(/\s*\(.*\)/, '').split(' ');
    const last = words.pop();
    return /^(di|de|van|von)$/i.test(words[words.length - 1]) ? `${words.pop()} ${last}` : last;
  };
  const counts = {};
  B.people.forEach((p) => { counts[surname(p)] = (counts[surname(p)] || 0) + 1; });
  B.people.forEach((p) => {
    const s = surname(p);
    p.short = counts[s] > 1 ? `${p.name[0]}. ${s}` : s;
    p.initials = p.name.replace(/\s*\(.*\)/, '').split(' ').filter((w) => /^[A-Za-z]/.test(w)).map((w) => w[0].toUpperCase()).join('').slice(0, 2);
  });

  /* Each place's weight decides which one anchors a cluster. */
  B.places.forEach((p) => { p.weight = p.people.length + p.events.length * 1.5 + p.written.length * 2 + p.setting.length; });

  /* --------------------------------------------------------------- dates */
  const MONTHS = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
  function parseDate(d) {
    const [y, m, day] = String(d).split('-').map(Number);
    return { y, m: m || null, d: day || null, t: y + ((m || 6.5) - 1) / 12 + ((day || 15) - 1) / 365 };
  }
  function fmtDate(d) {
    const p = parseDate(d);
    if (!p.m) return String(p.y);
    if (!p.d) return `${MONTHS[p.m - 1]} ${p.y}`;
    return `${MONTHS[p.m - 1]} ${p.d}, ${p.y}`;
  }
  function fmtYears(ys) {
    if (!ys) return '';
    const [a, b] = ys;
    if (b === null || b === undefined) return `${a}–present`;
    return a === b ? String(a) : `${a}–${b}`;
  }
  function lifeSpan(p) {
    return p.died ? `${p.born[0]}–${p.died[0]}` : `born ${p.born[0]}`;
  }

  /* Timeline items: chronology events plus publications. */
  const timeline = [];
  B.events.forEach((e) => timeline.push({ type: 'event', id: e.id, kind: e.kind, date: e.date, t: parseDate(e.date).t, title: e.title, place: e.place, people: e.people }));
  B.works.forEach((w) => timeline.push({ type: 'work', id: w.id, kind: 'publish', date: String(w.year), t: w.year + 0.5, title: w.title, place: w.press || w.written[0] || null, people: w.by }));
  timeline.sort((a, b) => a.t - b.t);

  /* ------------------------------------------------------------- helpers */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const store = {
    get(k) { try { return window.localStorage.getItem('beat-atlas:' + k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem('beat-atlas:' + k, v); } catch (e) { /* storage unavailable */ } },
  };

  /* The places a selection touches, for highlighting on the map. */
  function placesFor(sel) {
    if (!sel) return null;
    const { type, id } = sel;
    if (type === 'place') return new Set([id]);
    if (type === 'person') return new Set(byId.person.get(id).places);
    if (type === 'work') {
      const w = byId.work.get(id);
      return new Set([...w.written, ...w.set, ...(w.press ? [w.press] : [])]);
    }
    if (type === 'event') { const e = byId.event.get(id); return new Set(e.place ? [e.place] : []); }
    if (type === 'journey') return new Set(byId.journey.get(id).stops.filter((s) => s.place).map((s) => s.place));
    return null;
  }

  /* Ordered path coordinates for a person's life or a journey. */
  function pathFor(sel) {
    if (!sel) return null;
    if (sel.type === 'person') {
      const out = [];
      byId.person.get(sel.id).life.forEach(([pid, year, note]) => {
        const p = byId.place.get(pid);
        if (out.length && out[out.length - 1].place === pid) return;
        out.push({ place: pid, at: p.coords, title: p.name, date: String(year), text: note });
      });
      return out;
    }
    if (sel.type === 'journey') {
      return byId.journey.get(sel.id).stops.map((s) => ({ ...s, at: s.place ? byId.place.get(s.place).coords : s.at }));
    }
    return null;
  }

  function inRange(years, range) {
    if (!range) return true;
    const a = years[0], b = years[1] === null || years[1] === undefined ? 2100 : years[1];
    return b >= range[0] && a <= range[1];
  }

  window.Atlas = {
    B, byId, on, emit, KINDS, KIND_SHORT, KIND_ONE, EVENT_KINDS, WORK_KINDS, glyph, tlGlyph, shield, SHIELD_PATH,
    timeline, parseDate, fmtDate, fmtYears, lifeSpan, esc, store, reducedMotion, placesFor, pathFor, inRange,
    state: { view: 'map', tab: 'journeys', sel: null, range: null, hiddenKinds: new Set(), query: '', step: 0 },
  };
})();
