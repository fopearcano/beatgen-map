/*
 * The index: lists for each tab, search results and the detail page for
 * whatever is selected. Every link inside carries data-nav="type:id".
 */
(function () {
  'use strict';
  const A = window.Atlas;
  const { B, byId, state, esc } = A;
  const panel = document.getElementById('panel');

  const nav = (type, id) => `data-nav="${type}:${id}"`;
  const ICON_BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill" d="M8 5v14l11-7z"/></svg>';
  const ICON_OUT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg>';
  const dot = (p) => `<span class="dot" style="background:var(--g-${p.group})"></span>`;
  const byLabel = (ids) => ids.map((id) => byId.person.get(id).name.replace(/\s*\(.*\)/, '')).join(', ');

  /* ------------------------------------------------------------- rows */
  function placeRow(p, aside) {
    const out = !A.inRange(p.years, state.range) || state.hiddenKinds.has(p.kind);
    return `<li><button type="button" class="row${out ? ' is-out' : ''}" ${nav('place', p.id)}>
      <span class="row-glyph">${A.glyph(p.kind)}</span>
      <span class="row-main"><span class="row-title">${esc(p.name)}</span><span class="row-sub">${esc(p.city)} · ${A.KIND_ONE[p.kind]}</span></span>
      <span class="row-aside">${aside !== undefined ? aside : A.fmtYears(p.years)}</span></button></li>`;
  }
  function personRow(p, sub) {
    return `<li><button type="button" class="row" ${nav('person', p.id)}>
      ${dot(p)}
      <span class="row-main"><span class="row-title">${esc(p.name)}</span><span class="row-sub">${esc(sub || p.role)}</span></span>
      <span class="row-aside">${A.lifeSpan(p)}</span></button></li>`;
  }
  function workRow(w, sub) {
    return `<li><button type="button" class="row row--year" ${nav('work', w.id)}>
      <span class="row-main"><span class="row-title"><em>${esc(w.title)}</em></span><span class="row-sub">${esc(sub || byLabel(w.by) + ' · ' + A.WORK_KINDS[w.kind])}</span></span>
      <span class="row-aside">${w.year}</span></button></li>`;
  }
  function eventRow(e) {
    return `<li><button type="button" class="row row--year" ${nav('event', e.id)}>
      <span class="row-main"><span class="row-title">${esc(e.title)}</span><span class="row-sub">${A.fmtDate(e.date)}${e.place ? ' · ' + esc(byId.place.get(e.place).city) : ''}</span></span>
      <span class="row-aside">${A.parseDate(e.date).y}</span></button></li>`;
  }
  function timelineRow(it) {
    if (it.type === 'work') return workRow(byId.work.get(it.id));
    return eventRow(byId.event.get(it.id));
  }

  /* ------------------------------------------------------------ lists */
  function journeysList() {
    return `<div class="jcards">${B.journeys.map((j) => `
      <button type="button" class="jcard" ${nav('journey', j.id)}>
        <span class="jcard-title">${esc(j.title)}</span>
        <span class="jcard-span">${esc(j.span)}</span>
        <span class="jcard-text">${esc(j.intro)}</span>
        <span class="jcard-meta"><span>${j.stops.length} stops</span><span class="jcard-line" aria-hidden="true"></span><span>${esc(byLabel(j.people))}</span></span>
      </button>`).join('')}</div>
      <aside class="about">
        <h2>About this atlas</h2>
        <p>${B.places.length} places, ${B.people.length} people, ${B.works.length} books and magazines, and ${B.events.length} events from the Beat Generation, mapped from published biographies, memoirs and the books themselves. Where only a town or neighborhood is known, the location is marked approximate.</p>
        <p>Select anything to see where it happened. Drag across the chronology to filter the map by years. Press <kbd>/</kbd> to search.</p>
        <p class="about-credits">Base map: Natural Earth and the U.S. Census Bureau. Street maps © OpenStreetMap contributors.</p>
      </aside>`;
  }

  function placesList() {
    const regions = [];
    const byRegion = new Map();
    B.places.forEach((p) => {
      const key = p.region;
      if (!byRegion.has(key)) { byRegion.set(key, []); regions.push(key); }
      byRegion.get(key).push(p);
    });
    const note = state.range ? `<p class="list-note">Faded places were not active in ${state.range[0]}–${state.range[1]}.</p>` : '';
    return note + regions.map((r) => `
      <h2 class="group-head">${esc(r)} <small>${byRegion.get(r).length}</small></h2>
      <ul class="rows">${byRegion.get(r).map((p) => placeRow(p)).join('')}</ul>`).join('');
  }

  function peopleList() {
    return Object.entries(B.groups).map(([k, g]) => {
      const people = B.people.filter((p) => p.group === k);
      return `<h2 class="group-head">${esc(g.label)} <small>${people.length}</small></h2>
        <ul class="rows">${people.map((p) => personRow(p)).join('')}</ul>`;
    }).join('');
  }

  function worksList() {
    const decades = new Map();
    [...B.works].sort((a, b) => a.year - b.year || a.title.localeCompare(b.title)).forEach((w) => {
      const d = w.year < 1970 ? Math.floor(w.year / 5) * 5 : Math.floor(w.year / 10) * 10;
      const label = w.year < 1970 ? `${d}–${d + 4}` : `${d}s`;
      if (!decades.has(label)) decades.set(label, []);
      decades.get(label).push(w);
    });
    return [...decades].map(([label, ws]) => `<h2 class="group-head">${label} <small>${ws.length}</small></h2>
      <ul class="rows">${ws.map((w) => workRow(w)).join('')}</ul>`).join('');
  }

  function chronologyList() {
    const items = A.timeline.filter((it) => !state.range || (it.t >= state.range[0] && it.t < state.range[1] + 1));
    const groups = new Map();
    items.forEach((it) => {
      const y = Math.floor(it.t);
      const label = y < 1970 ? String(y) : `${Math.floor(y / 10) * 10}s`;
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(it);
    });
    const note = state.range ? `<p class="list-note">${items.length} entries in ${state.range[0]}–${state.range[1]}. Clear the filter under the map to see all.</p>` : '';
    return note + [...groups].map(([label, its]) => `<h2 class="group-head">${label}</h2>
      <ul class="rows">${its.map(timelineRow).join('')}</ul>`).join('');
  }

  const LISTS = { journeys: journeysList, places: placesList, people: peopleList, works: worksList, chronology: chronologyList };

  /* ----------------------------------------------------------- search */
  function search(q) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const hit = (...fields) => {
      const hay = fields.join(' ').toLowerCase();
      return words.every((w) => hay.includes(w));
    };
    const people = B.people.filter((p) => hit(p.name, p.role, p.aliases.map((a) => a[0]).join(' ')));
    const places = B.places.filter((p) => hit(p.name, p.city, p.address, p.region));
    const works = B.works.filter((w) => hit(w.title, byLabel(w.by), w.publisher));
    const journeys = B.journeys.filter((j) => hit(j.title, j.intro));
    const events = B.events.filter((e) => hit(e.title, e.text));
    const block = (title, list, row) => (list.length ? `<h2 class="group-head">${title} <small>${list.length}</small></h2><ul class="rows">${list.map(row).join('')}</ul>` : '');
    const html = block('People', people, (p) => personRow(p, p.aliases.find((a) => hit(a[0])) ? `Appears as ${p.aliases.find((a) => hit(a[0]))[0]} in ${p.aliases.find((a) => hit(a[0]))[1]}` : p.role))
      + block('Journeys', journeys, (j) => `<li><button type="button" class="row" ${nav('journey', j.id)}><span class="legend-route" style="width:16px"></span><span class="row-main"><span class="row-title">${esc(j.title)}</span><span class="row-sub">${esc(j.span)}</span></span><span class="row-aside">${j.stops.length} stops</span></button></li>`)
      + block('Places', places, (p) => placeRow(p))
      + block('Books & magazines', works, (w) => workRow(w))
      + block('Events', events, eventRow);
    return html || `<p class="list-note">Nothing matches “${esc(q)}”. Try a surname, a city or a title.</p>`;
  }

  /* ---------------------------------------------------------- details */
  function section(title, body) { return body ? `<section class="d-section"><h3>${title}</h3>${body}</section>` : ''; }
  function chips(ids) {
    return ids.length ? `<div class="chips">${ids.map((id) => { const p = byId.person.get(id); return `<button type="button" class="chip" ${nav('person', id)}>${dot(p)}${esc(p.name.replace(/\s*\(.*\)/, ''))}</button>`; }).join('')}</div>` : '';
  }
  const rows = (html) => (html ? `<ul class="rows">${html}</ul>` : '');
  function backTo(tab, label) {
    return `<button type="button" class="back" data-tab-back="${tab}">${ICON_BACK}${label}</button>`;
  }

  function placeDetail(p) {
    const osm = `https://www.openstreetmap.org/?mlat=${p.coords[0]}&mlon=${p.coords[1]}#map=${p.approx ? 12 : 17}/${p.coords[0]}/${p.coords[1]}`;
    const events = [...p.events].sort((a, b) => A.parseDate(a.date).t - A.parseDate(b.date).t);
    return `<article class="detail">
      ${backTo('places', 'All places')}
      <div class="kicker">${A.glyph(p.kind)} ${A.KIND_ONE[p.kind]} · ${esc(p.city)}</div>
      <h1 class="d-title">${esc(p.name)}</h1>
      <div class="d-meta">${esc(p.address)}${p.approx ? ' (approximate location)' : ''}</div>
      <div class="d-meta">${A.fmtYears(p.years)}</div>
      <p class="d-text">${esc(p.text)}</p>
      ${section('People', chips(p.people))}
      ${section('Written here', rows(p.written.map((w) => workRow(w)).join('')))}
      ${section('Set here', rows(p.setting.map((w) => workRow(w)).join('')))}
      ${section('Published here', rows(p.published.map((w) => workRow(w)).join('')))}
      ${section('What happened here', rows(events.map(eventRow).join('')))}
      <div class="actions"><a class="btn" href="${osm}" target="_blank" rel="noopener">${ICON_OUT}OpenStreetMap</a></div>
    </article>`;
  }

  function personDetail(p) {
    const born = `Born ${p.born[0]}, ${esc(p.born[1])}`;
    const died = p.died ? ` · died ${p.died[0]}, ${esc(p.died[1])}` : '';
    const life = A.pathFor({ type: 'person', id: p.id });
    const ties = [...p.ties].sort((a, b) => byId.person.get(a.other).name.localeCompare(byId.person.get(b.other).name));
    const works = [...p.works].sort((a, b) => a.year - b.year);
    return `<article class="detail">
      ${backTo('people', 'All people')}
      <div class="person-head">
        <span class="monogram" style="--gc:var(--g-${p.group})" aria-hidden="true">${esc(p.initials)}</span>
        <div><div class="kicker">${esc(B.groups[p.group].label)}</div><h1 class="d-title">${esc(p.name)}</h1></div>
      </div>
      <div class="d-meta">${esc(p.role)}</div>
      <div class="d-meta">${born}${died}</div>
      <p class="d-text">${esc(p.text)}</p>
      ${p.aliases.length ? section('In the novels', `<table class="aliases"><tbody>${p.aliases.map(([n, w]) => `<tr><td>${esc(n)}</td><td>${esc(w)}</td></tr>`).join('')}</tbody></table>`) : ''}
      ${life.length ? section(`Life on the map <span style="float:right;font-family:var(--f-type);letter-spacing:0;text-transform:none">${life.length} stops</span>`, `<ol class="stops">${life.map((s, i) => `
        <li class="stop" ${nav('place', s.place)}><span class="stop-num">${A.shield(i + 1)}</span><span class="stop-date">${esc(s.date)}</span><span class="stop-title">${esc(s.title)}</span><span class="stop-date">${esc(s.text)}</span></li>`).join('')}</ol>`) : ''}
      ${section('Books', rows(works.map((w) => workRow(w, w.by.length > 1 ? `with ${byLabel(w.by.filter((x) => x !== p.id))}` : A.WORK_KINDS[w.kind] + ' · ' + w.publisher)).join('')))}
      ${section('Ties', rows(ties.map((t) => personRow(byId.person.get(t.other), t.note)).join('')))}
      <div class="actions">
        <button type="button" class="btn" data-network="${p.id}">See in network</button>
        <a class="btn" href="https://en.wikipedia.org/wiki/${p.wiki}" target="_blank" rel="noopener">${ICON_OUT}Wikipedia</a>
      </div>
    </article>`;
  }

  function placeLinks(ids) { return rows(ids.map((id) => placeRow(byId.place.get(id))).join('')); }

  function workDetail(w) {
    return `<article class="detail">
      ${backTo('works', 'All books')}
      <div class="kicker">${A.WORK_KINDS[w.kind]} · ${w.year}</div>
      <h1 class="d-title is-work">${esc(w.title)}</h1>
      <div class="d-meta">by ${esc(byLabel(w.by))}</div>
      <div class="d-meta">${esc(w.publisher)}</div>
      ${w.line ? `<blockquote class="d-line">“${esc(w.line)}…”<cite>${esc(byLabel(w.by))}, ${esc(w.title)}</cite></blockquote>` : ''}
      <p class="d-text">${esc(w.text)}</p>
      ${section('Written at', placeLinks(w.written))}
      ${section('Set in', placeLinks(w.set))}
      ${section('Published from', w.press ? placeLinks([w.press]) : '')}
      ${section('By', chips(w.by))}
    </article>`;
  }

  function eventDetail(e) {
    const p = e.place ? byId.place.get(e.place) : null;
    return `<article class="detail">
      ${backTo('chronology', 'Chronology')}
      <div class="kicker">${A.EVENT_KINDS[e.kind]} · ${A.fmtDate(e.date)}</div>
      <h1 class="d-title">${esc(e.title)}</h1>
      <p class="d-text">${esc(e.text)}</p>
      ${p ? section('Where', placeLinks([p.id])) : ''}
      ${section('Who', chips(e.people))}
    </article>`;
  }

  function journeyDetail(j) {
    const step = state.step;
    const work = j.work ? byId.work.get(j.work) : null;
    return `<article class="detail">
      ${backTo('journeys', 'All journeys')}
      <div class="kicker">Journey · ${esc(j.span)}</div>
      <h1 class="d-title">${esc(j.title)}</h1>
      <p class="d-text">${esc(j.intro)}</p>
      <div class="actions">
        <button type="button" class="btn btn--red" data-journey-start>${ICON_PLAY}${step >= 0 ? 'Restart' : 'Start the journey'}</button>
        ${work ? `<button type="button" class="btn" ${nav('work', work.id)}>The book</button>` : ''}
      </div>
      ${section(`${j.stops.length} stops`, `<ol class="stops" id="journey-stops">${j.stops.map((s, i) => `
        <li class="stop${i === step ? ' is-on' : ''}" data-step="${i}">
          <span class="stop-num">${A.shield(i + 1, i === step)}</span>
          <span class="stop-date">${esc(s.date)}</span>
          <span class="stop-title">${esc(s.title)}</span>
          <span class="stop-text">${esc(s.text)}${s.place ? ` <button type="button" class="link-out" style="border:0;background:none;padding:0;cursor:pointer;text-decoration:underline" ${nav('place', s.place)}>About this place</button>` : ''}</span>
        </li>`).join('')}</ol>`)}
    </article>`;
  }

  /* --------------------------------------------------------- rendering */
  function render() {
    const q = state.query.trim();
    let html;
    if (q) html = search(q);
    else if (state.sel) {
      const { type, id } = state.sel;
      const item = byId[type].get(id);
      html = { place: placeDetail, person: personDetail, work: workDetail, event: eventDetail, journey: journeyDetail }[type](item);
    } else html = LISTS[state.tab]();
    panel.innerHTML = html;
  }

  /* Update the journey list in place when the step changes. */
  function markStep(step) {
    const list = document.getElementById('journey-stops');
    if (!list) return;
    list.querySelectorAll('.stop').forEach((li) => {
      const i = Number(li.dataset.step);
      li.classList.toggle('is-on', i === step);
      li.querySelector('.shield').classList.toggle('is-on', i === step);
    });
    const start = panel.querySelector('[data-journey-start]');
    if (start) start.lastChild.textContent = step >= 0 ? 'Restart' : 'Start the journey';
    const cur = list.querySelector('.stop.is-on');
    if (cur) cur.scrollIntoView({ block: 'nearest', behavior: A.reducedMotion.matches ? 'auto' : 'smooth' });
  }

  panel.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-nav],[data-tab-back],[data-step],[data-journey-start],[data-network]');
    if (!t) return;
    if (t.dataset.nav) {
      ev.stopPropagation();
      const [type, id] = t.dataset.nav.split(':');
      A.emit('navigate', { type, id });
    } else if (t.dataset.tabBack) A.emit('tab', t.dataset.tabBack);
    else if (t.dataset.step !== undefined) A.emit('journey-step', Number(t.dataset.step));
    else if (t.hasAttribute('data-journey-start')) A.emit('journey-step', 0);
    else if (t.dataset.network) A.emit('view', 'network');
  });

  A.panel = { render, markStep, scrollTop() { panel.scrollTop = 0; } };
})();
