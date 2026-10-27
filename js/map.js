/*
 * The map: Natural Earth base drawn on canvas in the atlas palette, optional
 * street tiles when zoomed in close, place pins that gather into town
 * clusters, and red routes for life paths and journeys.
 */
(function () {
  'use strict';
  const A = window.Atlas;
  const { B, byId, state } = A;

  let map, baseLayers = [], tiles, pinLayer, townLayer, routeLayer, stopLayer;
  let path = null;          // current path (person life or journey stops)
  let pathKind = null;      // 'person' | 'journey'
  let drawnSegments = [];   // solid segments drawn so far (journey) or all (person)
  let streetDetail = A.store.get('streets') !== 'off';

  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const isDark = () => css('color-scheme') === 'dark';

  /* --------------------------------------------------------------- base */
  function baseStyles() {
    return {
      land: { fillColor: css('--land'), fillOpacity: 1, color: css('--land-edge'), weight: 0.8 },
      lakes: { fillColor: css('--water'), fillOpacity: 1, color: css('--land-edge'), weight: 0.6 },
      borders: { color: css('--border'), weight: 0.9, fill: false },
      states: { color: css('--state'), weight: 0.8, dashArray: '5 4', fill: false },
      grat: { color: css('--grat'), weight: 1, fill: false },
    };
  }

  function graticule() {
    const lines = [];
    for (let lng = -180; lng <= 180; lng += 10) { const l = []; for (let lat = -80; lat <= 85; lat += 5) l.push([lat, lng]); lines.push(l); }
    for (let lat = -80; lat <= 80; lat += 10) { const l = []; for (let lng = -180; lng <= 180; lng += 5) l.push([lat, lng]); lines.push(l); }
    return lines;
  }


  function restyle() {
    const s = baseStyles();
    baseLayers.forEach(({ layer, key }) => layer.setStyle(s[key]));
  }

  function setStreetDetail(onOff) {
    streetDetail = onOff;
    A.store.set('streets', onOff ? 'on' : 'off');
    if (onOff) tiles.addTo(map); else tiles.remove();
    renderTowns();
  }

  /* ------------------------------------------------------------- pins */
  function pinTooltip(p) {
    return `${A.esc(p.name)}<small>${A.KIND_ONE[p.kind]} · ${A.esc(p.city)} · ${A.fmtYears(p.years)}</small>`;
  }

  function visiblePlaces() {
    return B.places.filter((p) => !state.hiddenKinds.has(p.kind) && A.inRange(p.years, state.range));
  }

  function focusInfo() {
    /* a single place or event keeps its neighbors visible; people, books and journeys dim the rest */
    const t = state.sel && state.sel.type;
    const focus = t === 'place' || t === 'event' ? null : A.placesFor(state.sel);
    let primary = null;
    if (state.sel && state.sel.type === 'place') primary = state.sel.id;
    if (state.sel && state.sel.type === 'event') primary = byId.event.get(state.sel.id).place;
    if (state.sel && state.sel.type === 'journey' && path && path[state.step]) primary = path[state.step].place || null;
    return { focus: focus && focus.size ? focus : null, primary };
  }

  /* Greedy clustering in screen space, heaviest places first. */
  function clusters(places, primary) {
    const z = map.getZoom();
    const R = z >= 17 ? 0 : 28;
    const pts = places.map((p) => ({ p, pt: map.project(p.coords, z) })).sort((a, b) => b.p.weight - a.p.weight);
    const used = new Set();
    const groups = [];
    pts.forEach((a) => {
      if (used.has(a.p.id)) return;
      used.add(a.p.id);
      const g = [a];
      if (a.p.id !== primary) {
        pts.forEach((b) => {
          if (used.has(b.p.id) || b.p.id === primary) return;
          if (a.pt.distanceTo(b.pt) < R) { g.push(b); used.add(b.p.id); }
        });
      }
      groups.push(g);
    });
    return groups;
  }

  function clusterName(members, z) {
    if (z >= 12.5) {
      const top = members.reduce((a, b) => (b.weight > a.weight ? b : a));
      return `${top.name} +${members.length - 1}`;
    }
    const same = (key) => members.every((m) => m[key] === members[0][key]);
    if (same('city')) return members[0].city;
    if (same('region')) return members[0].region;
    const tally = {};
    members.forEach((m) => { tally[m.region] = (tally[m.region] || 0) + 1; });
    return Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
  }

  /* Labels are placed greedily and dropped where they would collide. */
  let labelBoxes = [];
  function placeLabels(items) {
    const boxes = [];
    labelBoxes = boxes;
    const hit = (b) => boxes.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y);
    items.sort((a, b) => b.priority - a.priority).forEach((it) => {
      const markBox = { x: it.pt.x - it.r, y: it.pt.y - it.r, w: it.r * 2, h: it.r * 2 };
      if (!it.label) { it.showLabel = false; boxes.push(markBox); return; }
      const box = { x: it.pt.x + it.r + 3, y: it.pt.y - 9, w: it.label.length * it.charW + 6, h: 18 };
      it.showLabel = !hit(box);
      if (it.showLabel) boxes.push(box);
      boxes.push(markBox);
    });
  }

  function renderPins() {
    if (!map) return;
    pinLayer.clearLayers();
    const z = map.getZoom();
    const { focus, primary } = focusInfo();
    /* places on the current route are marked by its numbered shields instead */
    const onPath = path ? new Set(path.map((st) => st.place).filter(Boolean)) : null;
    const groups = clusters(visiblePlaces().filter((p) => !onPath || !onPath.has(p.id)), primary);
    const items = groups.map((g) => {
      const members = g.map((m) => m.p);
      const pt = g.reduce((acc, m) => acc.add(m.pt), L.point(0, 0)).divideBy(g.length);
      const inFocus = focus ? members.filter((m) => focus.has(m.id)).length : 0;
      if (members.length === 1) {
        const p = members[0];
        return {
          single: p, pt, r: 8, label: p.name, charW: 6.4,
          priority: (p.id === primary ? 1000 : 0) + (focus && focus.has(p.id) ? 100 : 0) + p.weight,
          inFocus, members,
        };
      }
      const name = clusterName(members, z);
      return {
        pt, r: 10 + Math.min(10, Math.sqrt(members.length) * 2.6), label: name, charW: z >= 12.5 ? 7.5 : 9,
        priority: 50 + members.length * 3 + (inFocus ? 200 : 0), inFocus, members,
      };
    });
    if (z < 3.5) items.forEach((it) => { if (it.single) it.label = null; });
    placeLabels(items);

    items.forEach((it) => {
      const latlng = map.unproject(it.pt, z);
      if (it.single) {
        const p = it.single;
        const cls = ['pin', 'pin--' + p.kind];
        if (focus && !focus.has(p.id)) cls.push('is-dim');
        if (focus && focus.has(p.id)) cls.push('is-focus');
        if (p.id === primary) cls.push('is-primary');
        const label = it.showLabel ? `<span class="pin-label">${A.esc(p.name)}</span>` : '';
        const m = L.marker(p.coords, {
          icon: L.divIcon({ className: cls.join(' '), html: A.glyph(p.kind) + label, iconSize: [16, 16], iconAnchor: [8, 8] }),
          keyboard: true, title: p.name, riseOnHover: true, zIndexOffset: p.id === primary ? 800 : focus && focus.has(p.id) ? 400 : 0,
        });
        m.bindTooltip(pinTooltip(p), { className: 'tip', direction: 'top', offset: [0, -9], opacity: 1 });
        m.on('click', () => A.emit('navigate', { type: 'place', id: p.id }));
        m.addTo(pinLayer);
      } else {
        const n = it.members.length;
        const d = Math.round(it.r * 2);
        const cls = ['cluster'];
        if (z >= 12.5) cls.push('is-local');
        if (focus && !it.inFocus) cls.push('is-dim');
        if (it.inFocus) cls.push('is-focus');
        const label = it.showLabel ? `<span class="cluster-label">${A.esc(it.label)}</span>` : '';
        const m = L.marker(latlng, {
          icon: L.divIcon({ className: cls.join(' '), html: `<span class="cluster-dot">${n}</span>${label}`, iconSize: [d, d], iconAnchor: [d / 2, d / 2] }),
          keyboard: true, title: `${it.label}: ${n} places`, zIndexOffset: it.inFocus ? 500 : 100,
        });
        const names = it.members.slice(0, 4).map((x) => A.esc(x.name)).join(', ') + (n > 4 ? `, and ${n - 4} more` : '');
        m.bindTooltip(`${A.esc(it.label)}<small>${n} places: ${names}</small>`, { className: 'tip', direction: 'top', offset: [0, -d / 2 - 2], opacity: 1 });
        m.on('click', () => flyToBounds(L.latLngBounds(it.members.map((x) => x.coords)), { padding: [70, 70], maxZoom: 18 }));
        m.addTo(pinLayer);
      }
    });
    renderTowns();
  }

  /* ------------------------------------------------------------- towns */
  /* Reference towns from Natural Earth, faint like the small print on a road
     map. More appear as you zoom in; none once street tiles take over. */
  function townRank(z) {
    if (z < 3.5) return -1;
    if (z < 4.5) return 1;
    if (z < 5.5) return 2;
    if (z < 6.5) return 3;
    if (z < 8) return 4;
    return 7;
  }
  const SHORT_NAMES = { 'United States of America': 'United States', 'Dem. Rep. Congo': 'D.R. Congo', 'Central African Rep.': 'C.A.R.' };

  /* Country and U.S. state names, spaced out and faint, sized to fit their land. */
  function regionLabels(z, view, boxes, hit) {
    const L_ = window.BEAT_LABELS;
    if (!L_) return;
    const ppd = (256 * Math.pow(2, z)) / 360;
    const add = (name, lat, lng, cls, charW) => {
      const pt = map.project([lat, lng], z);
      if (!view.contains(pt)) return;
      const w = name.length * charW + 8;
      const box = { x: pt.x - w / 2, y: pt.y - 9, w, h: 18 };
      if (hit(box)) return;
      boxes.push(box);
      L.marker([lat, lng], {
        pane: 'towns', interactive: false, keyboard: false,
        icon: L.divIcon({ className: 'region ' + cls, html: `<span>${A.esc(name)}</span>`, iconSize: [0, 0] }),
      }).addTo(townLayer);
    };
    if (z <= 7) {
      L_.countries.forEach(([name, lat, lng, area]) => {
        const label = SHORT_NAMES[name] || name;
        const size = Math.sqrt(area) * ppd * Math.cos((lat * Math.PI) / 180);
        if (size > label.length * 11 && size < 1500) add(label, lat, lng, 'is-country', 11);
      });
    }
    if (z >= 4.25 && z <= 8.5) {
      L_.states.forEach(([name, lat, lng, area]) => {
        const size = Math.sqrt(area) * ppd * 0.8;
        if (size > name.length * 9) add(name, lat, lng, 'is-state', 9);
      });
    }
  }

  function renderTowns() {
    if (!map) return;
    townLayer.clearLayers();
    const z = map.getZoom();
    const maxRank = townRank(z);
    if (streetDetail && z >= 12) return;
    const view = map.getPixelBounds().pad(0.1);
    const boxes = labelBoxes.slice();
    if (path) path.forEach((st) => { const pt = map.project(st.at, z); boxes.push({ x: pt.x - 13, y: pt.y - 15, w: 26, h: 30 }); });
    const hit = (b) => boxes.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y);
    regionLabels(z, view, boxes, hit);
    if (maxRank < 0) return;
    (window.BEAT_TOWNS || []).forEach(([name, lat, lng, rank]) => {
      if (rank > maxRank) return;
      const pt = map.project([lat, lng], z);
      if (!view.contains(pt)) return;
      const big = rank <= 1;
      const dot = { x: pt.x - 4, y: pt.y - 4, w: 8, h: 8 };
      const label = { x: pt.x + 5, y: pt.y - 8, w: name.length * (big ? 7.4 : 6.3) + 4, h: 16 };
      if (hit(dot) || hit(label)) return;
      boxes.push(dot, label);
      L.marker([lat, lng], {
        pane: 'towns', interactive: false, keyboard: false,
        icon: L.divIcon({ className: 'town' + (big ? ' is-big' : ''), html: `<span class="town-label">${A.esc(name)}</span>`, iconSize: [6, 6], iconAnchor: [3, 3] }),
      }).addTo(townLayer);
    });
  }

  /* ------------------------------------------------------------- routes */

  /* A gentle arc between two points, bent in projected space. Crossing the
     Pacific, the arc takes the short way and is split at the antimeridian. */
  function arc(a, b) {
    const crs = L.CRS.EPSG3857;
    let lngB = b[1];
    const dl = lngB - a[1];
    if (Math.abs(dl) > 180) lngB -= Math.sign(dl) * 360;
    const pa = crs.latLngToPoint(L.latLng(a[0], a[1]), 0);
    const pb = crs.latLngToPoint(L.latLng(b[0], lngB), 0);
    const dx = pb.x - pa.x, dy = pb.y - pa.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-5) return [[a, a]];
    const bend = len < 0.02 ? 0.08 : 0.16;
    const c = L.point((pa.x + pb.x) / 2 - dy * bend, (pa.y + pb.y) / 2 + dx * bend);
    const n = 40;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const p = L.point(u * u * pa.x + 2 * u * t * c.x + t * t * pb.x, u * u * pa.y + 2 * u * t * c.y + t * t * pb.y);
      const ll = crs.pointToLatLng(p, 0);
      pts.push([ll.lat, ll.lng]);
    }
    if (lngB === b[1]) return [pts];
    const parts = [[]];
    let shift = 0;
    pts.forEach((p, i) => {
      if (i && Math.abs(p[1] + shift) > 180 && shift === 0) {
        shift = p[1] > 180 ? -360 : 360;
        const prev = pts[i - 1];
        const edge = p[1] > 180 ? 180 : -180;
        const t = (edge - prev[1]) / (p[1] - prev[1]);
        const lat = prev[0] + (p[0] - prev[0]) * t;
        parts[0].push([lat, edge]);
        parts.push([[lat, -edge]]);
      }
      parts[parts.length - 1].push([p[0], p[1] + shift]);
    });
    return parts;
  }

  function addSegment(a, b, { animate, ghost } = {}) {
    const parts = arc(a, b);
    const made = [];
    parts.forEach((pts) => {
      if (ghost) {
        made.push(L.polyline(pts, { className: 'route-ghost', weight: 2, interactive: false, pane: 'routes' }).addTo(routeLayer));
        return;
      }
      const casing = L.polyline(pts, { className: 'route-casing', weight: 7, opacity: 0.9, interactive: false, pane: 'routes' }).addTo(routeLayer);
      const line = L.polyline(pts, { className: 'route-line', weight: 3.2, interactive: false, pane: 'routes' }).addTo(routeLayer);
      made.push(casing, line);
      if (animate && !A.reducedMotion.matches) {
        [casing, line].forEach((pl) => {
          const el = pl.getElement();
          if (!el || !el.getTotalLength) return;
          const len = el.getTotalLength();
          el.style.setProperty('--len', len);
          el.style.setProperty('--dur', Math.min(1.6, 0.5 + len / 900) + 's');
          el.classList.add('route-draw');
          el.addEventListener('animationend', () => el.classList.remove('route-draw'), { once: true });
        });
      }
    });
    return made;
  }

  function clearPath() {
    routeLayer.clearLayers();
    stopLayer.clearLayers();
    path = null; pathKind = null; drawnSegments = [];
  }

  /* Stops that share a location share one shield. */
  function renderStops() {
    stopLayer.clearLayers();
    if (!path) return;
    const groups = new Map();
    path.forEach((s, i) => {
      const key = s.at[0].toFixed(4) + ',' + s.at[1].toFixed(4);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(i);
    });
    const cur = pathKind === 'journey' ? state.step : -1;
    groups.forEach((idx) => {
      const s = path[idx[0]];
      let show = idx[0];
      if (idx.includes(cur)) show = cur;
      else if (cur >= 0) { const seen = idx.filter((i) => i <= cur); if (seen.length) show = seen[seen.length - 1]; }
      const isCur = show === cur;
      const future = pathKind === 'journey' && cur >= 0 && idx.every((i) => i > cur);
      const tip = idx.map((i) => `${i + 1}. ${A.esc(path[i].title)} <small>${A.esc(path[i].date)}</small>`).join('');
      const label = isCur ? `<span class="pin-label">${A.esc(path[cur].title)}</span>` : '';
      const m = L.marker(s.at, {
        pane: 'stops',
        icon: L.divIcon({ className: 'stop-pin' + (future ? ' is-future' : ''), html: A.shield(show + 1, isCur) + label, iconSize: [24, 27], iconAnchor: [12, 14] }),
        keyboard: false, zIndexOffset: isCur ? 1000 : 0,
      });
      m.bindTooltip(tip, { className: 'tip', direction: 'top', offset: [0, -14], opacity: 1 });
      m.on('click', () => {
        if (pathKind === 'journey') A.emit('journey-step', idx.includes(cur) ? cur : idx.find((i) => i > cur) ?? idx[0]);
        else if (s.place) A.emit('navigate', { type: 'place', id: s.place });
      });
      m.addTo(stopLayer);
    });
    renderTowns();
  }

  function drawPersonPath(id) {
    clearPath();
    path = A.pathFor({ type: 'person', id });
    pathKind = 'person';
    for (let i = 1; i < path.length; i++) addSegment(path[i - 1].at, path[i].at);
    renderStops();
  }

  function drawJourney(id) {
    clearPath();
    path = A.pathFor({ type: 'journey', id });
    pathKind = 'journey';
    for (let i = 1; i < path.length; i++) addSegment(path[i - 1].at, path[i].at, { ghost: true });
    drawnSegments = [];
    renderStops();
  }

  /* Draw the solid route up to step i. Moving forward, the map flies to frame
     the new leg and then draws it; a newer step cancels a pending draw. */
  let stepToken = 0, lastStep = -1;
  function showStep(i, fly) {
    if (!path || pathKind !== 'journey') return;
    const token = ++stepToken;
    const forward = i === lastStep + 1 && i > 0;
    lastStep = i;
    const draw = (animate) => {
      if (token !== stepToken) return;
      drawnSegments.forEach((l) => l.remove());
      drawnSegments = [];
      for (let k = 1; k <= i; k++) drawnSegments.push(...addSegment(path[k - 1].at, path[k].at, { animate: animate && k === i }));
    };
    renderStops();
    renderPins();
    if (!fly) { draw(false); return; }
    const cur = path[i];
    if (i === 0) {
      flyTo(cur.at, 6);
      draw(false);
      return;
    }
    /* frame the leg: close in for a hop across town, regional for the road */
    const prev = path[i - 1];
    const local = L.latLng(prev.at).distanceTo(cur.at) < 30000;
    const target = cur.place ? byId.place.get(cur.place) : null;
    const maxZoom = local ? (target && !target.approx ? 15 : 11) : 7;
    const bounds = L.latLngBounds([prev.at, cur.at]);
    const frame = { paddingTopLeft: [80, 120], paddingBottomRight: [80, 80], maxZoom };
    if (A.reducedMotion.matches) { map.fitBounds(bounds, frame); draw(false); return; }
    let done = false;
    const after = () => { if (!done) { done = true; draw(forward); } };
    map.once('moveend', after);
    setTimeout(after, 1900);
    map.flyToBounds(bounds, { ...frame, duration: 1.3 });
  }

  /* ------------------------------------------------------------- focus */
  function flyTo(latlng, zoom) {
    if (A.reducedMotion.matches) map.setView(latlng, zoom);
    else map.flyTo(latlng, zoom, { duration: 1.2 });
  }
  function flyToBounds(bounds, opts) {
    if (A.reducedMotion.matches) map.fitBounds(bounds, opts);
    else map.flyToBounds(bounds, { ...opts, duration: 1.1 });
  }
  function fitPlaces(ids, maxZoom) {
    const pts = [...ids].map((id) => byId.place.get(id).coords);
    if (!pts.length) return;
    if (pts.length === 1) { flyTo(pts[0], maxZoom); return; }
    flyToBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom });
  }

  function select(sel, opts = {}) {
    if (!map) return;
    const { fly = true } = opts;
    const t = sel && sel.type;
    if (t === 'person') drawPersonPath(sel.id);
    else if (t === 'journey') { drawJourney(sel.id); lastStep = -1; if (state.step >= 0) showStep(state.step, false); }
    else clearPath();
    renderPins();
    if (!fly || !sel) return;
    if (t === 'place') {
      const p = byId.place.get(sel.id);
      const z = p.approx || p.kind === 'wild' ? 10 : 15;
      flyTo(p.coords, Math.max(z, Math.min(map.getZoom(), 17)));
    } else if (t === 'event') {
      const e = byId.event.get(sel.id);
      if (e.place) { const p = byId.place.get(e.place); flyTo(p.coords, p.approx ? 9 : 14); }
    } else if (t === 'person' || t === 'work') {
      fitPlaces(A.placesFor(sel), 13);
    } else if (t === 'journey') {
      if (state.step >= 0) flyTo(path[state.step].at, Math.max(map.getZoom(), 5));
      else flyToBounds(L.latLngBounds(path.map((s) => s.at)), { padding: [60, 60], maxZoom: 9 });
    }
  }

  /* ------------------------------------------------------------ legend */
  function renderLegend() {
    const el = document.getElementById('legend');
    const counts = {};
    B.places.forEach((p) => { counts[p.kind] = (counts[p.kind] || 0) + 1; });
    const closed = A.store.get('legend') === 'closed' || window.matchMedia('(max-width: 820px)').matches && A.store.get('legend') !== 'open';
    el.classList.toggle('is-closed', closed);
    el.innerHTML = `
      <button type="button" class="legend-head" aria-expanded="${!closed}">Legend <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>
      <div class="legend-body">
        <div class="legend-kinds">${Object.keys(A.KINDS).map((k) => `
          <button type="button" class="legend-row" data-kind="${k}" aria-pressed="${!state.hiddenKinds.has(k)}" title="${A.KINDS[k]}: ${counts[k] || 0} places">
            ${A.glyph(k)}<span>${A.KIND_SHORT[k]}</span>
          </button>`).join('')}</div>
        <div class="legend-sep"></div>
        <div class="legend-row legend-static"><span class="legend-route"></span><span>Route of a life or journey</span></div>
        <button type="button" class="legend-row" id="street-toggle" aria-pressed="${streetDetail}">
          <svg viewBox="0 0 20 20"><path d="M3 17 8 3M17 17 12 3M10 4v2M10 9v2M10 14v2"/></svg><span>Street map when zoomed in</span>
        </button>
      </div>`;
    el.querySelector('.legend-head').addEventListener('click', () => {
      const isClosed = el.classList.toggle('is-closed');
      el.querySelector('.legend-head').setAttribute('aria-expanded', String(!isClosed));
      A.store.set('legend', isClosed ? 'closed' : 'open');
    });
    el.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.kind;
      if (state.hiddenKinds.has(k)) state.hiddenKinds.delete(k); else state.hiddenKinds.add(k);
      b.setAttribute('aria-pressed', String(!state.hiddenKinds.has(k)));
      A.emit('kinds');
    }));
    el.querySelector('#street-toggle').addEventListener('click', (ev) => {
      setStreetDetail(!streetDetail);
      ev.currentTarget.setAttribute('aria-pressed', String(streetDetail));
    });
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
  }

  /* -------------------------------------------------------------- init */
  function init() {
    map = L.map('map', {
      zoomControl: false, minZoom: 2, maxZoom: 18, zoomSnap: 0.25, zoomDelta: 0.75, wheelPxPerZoomLevel: 90,
      worldCopyJump: false, maxBounds: [[-72, -220], [85, 220]], maxBoundsViscosity: 0.7,
    });
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.scale({ position: 'bottomleft', maxWidth: 120 }).addTo(map);
    map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');

    const basePane = map.createPane('base');
    basePane.style.zIndex = 150;
    map.createPane('towns').style.zIndex = 420;
    map.createPane('routes').style.zIndex = 450;
    map.createPane('stops').style.zIndex = 640;

    const canvas = L.canvas({ pane: 'base', padding: 0.4 });
    const topo = window.BEAT_GEO;
    const s = baseStyles();
    const add = (key, geo) => {
      const layer = L.geoJSON(geo, { renderer: canvas, interactive: false, style: s[key] }).addTo(map);
      baseLayers.push({ layer, key });
    };
    add('land', topojson.feature(topo, topo.objects.countries));
    add('grat', { type: 'MultiLineString', coordinates: graticule().map((l) => l.map(([lat, lng]) => [lng, lat])) });
    add('lakes', topojson.feature(topo, topo.objects.lakes));
    add('borders', topojson.feature(topo, topo.objects.borders));
    add('states', topojson.feature(topo, topo.objects.states));
    map.attributionControl.addAttribution('Natural Earth');

    /* OpenStreetMap's standard tiles, tinted to the atlas palette by CSS, only once
       the map is close enough for streets to matter. */
    tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 12, maxZoom: 19, className: 'tiles',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });
    if (streetDetail) tiles.addTo(map);

    routeLayer = L.layerGroup().addTo(map);
    stopLayer = L.layerGroup().addTo(map);
    pinLayer = L.layerGroup().addTo(map);
    townLayer = L.layerGroup().addTo(map);

    const narrow = map.getSize().x < 640;
    map.fitBounds(narrow ? [[25, -123], [47, -71]] : [[22, -125], [52, 30]], { padding: [10, 10] });
    map.on('zoomend', renderPins);
    map.on('moveend', renderTowns);
    map.on('zoomstart', () => document.querySelectorAll('.route-draw').forEach((el) => el.classList.remove('route-draw')));

    renderLegend();
    renderPins();
  }

  A.map = {
    init, select, renderPins, restyle, showStep,
    invalidate() { if (map) map.invalidateSize({ pan: false }); },
    get leaflet() { return map; },
  };
})();
