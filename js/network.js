/*
 * The network: who knew whom. A force layout with the four scenes pulled
 * toward their own corners; line style says what kind of tie it was.
 */
(function () {
  'use strict';
  const A = window.Atlas;
  const { B, byId, state } = A;
  const el = document.getElementById('network');

  const TIE_LABEL = { friends: 'Friends', lovers: 'Lovers', married: 'Partners or spouses', work: 'Worked together or published', mentor: 'Mentor' };
  const ANCHOR = { core: [0, 0], ny: [-1, -0.15], west: [1, -0.1], allies: [0.1, 1] };
  let svg, zoomG, nodeSel, linkSel, sim, zoom, built = false, w = 0, h = 0;

  const color = (g) => `var(--g-${g})`;
  const radius = (p) => (p.group === 'core' ? 9 : 5) + Math.min(9, p.ties.length * 0.7);

  function build() {
    built = true;
    w = el.clientWidth; h = el.clientHeight;
    const nodes = B.people.map((p) => ({ id: p.id, p, r: radius(p) }));
    const links = B.ties.map(([a, b, kind, note]) => ({ source: a, target: b, kind, note }));
    const spread = Math.min(w, h) * 0.34;

    el.innerHTML = `
      <p class="net-hint">Drag to pan, scroll to zoom. Select a person to see their ties.</p>
      <div class="net-legend">
        <h4>Scenes</h4>
        <div>${Object.entries(B.groups).map(([k, g]) => `<div class="li"><span class="sw" style="background:${color(k)}"></span>${g.label}</div>`).join('')}</div>
        <h4>Ties</h4>
        <div>${Object.entries(TIE_LABEL).map(([k, label]) => `<div class="li"><svg viewBox="0 0 26 8"><line class="net-link k-${k}" x1="1" y1="4" x2="25" y2="4" style="stroke:var(--ink-2);stroke-opacity:1"/></svg>${label}</div>`).join('')}</div>
      </div>`;
    svg = d3.select(el).append('svg').attr('role', 'img').attr('aria-label', 'Network of friendships, love affairs and collaborations among Beat writers');
    zoomG = svg.append('g');
    zoom = d3.zoom().scaleExtent([0.35, 3.5]).on('zoom', (ev) => zoomG.attr('transform', ev.transform));
    svg.call(zoom).on('dblclick.zoom', null);
    svg.on('click', (ev) => { if (ev.target === svg.node()) A.emit('navigate', null); });

    linkSel = zoomG.append('g').selectAll('line').data(links).join('line').attr('class', (d) => `net-link k-${d.kind}`);
    nodeSel = zoomG.append('g').selectAll('g').data(nodes).join('g')
      .attr('class', (d) => `net-node${d.p.group === 'core' ? ' is-core' : ''}`)
      .attr('tabindex', 0).attr('role', 'button')
      .attr('aria-label', (d) => `${d.p.name}, ${d.p.role}`);
    nodeSel.append('circle').attr('class', 'ring').attr('r', (d) => d.r + 5);
    nodeSel.append('circle').attr('class', 'body').attr('r', (d) => d.r).style('fill', (d) => color(d.p.group));
    nodeSel.append('text').attr('y', (d) => d.r + 15).attr('text-anchor', 'middle').text((d) => d.p.short);
    nodeSel
      .on('click', (ev, d) => { ev.stopPropagation(); A.emit('navigate', { type: 'person', id: d.id }); })
      .on('keydown', (ev, d) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); A.emit('navigate', { type: 'person', id: d.id }); } })
      .on('mouseenter focus', (ev, d) => hover(d.id))
      .on('mouseleave blur', () => hover(null))
      .call(d3.drag()
        .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.2).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on('end', (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));
    linkSel.append('title').text((d) => `${byId.person.get(d.source).short} – ${byId.person.get(d.target).short}: ${d.note}`);

    sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance((l) => (l.kind === 'married' ? 40 : 75)).strength(0.35))
      .force('charge', d3.forceManyBody().strength(-330))
      .force('collide', d3.forceCollide().radius((d) => d.r + 16))
      .force('x', d3.forceX((d) => ANCHOR[d.p.group][0] * spread).strength(0.09))
      .force('y', d3.forceY((d) => ANCHOR[d.p.group][1] * spread).strength(0.09))
      .stop();
    for (let i = 0; i < 400; i++) sim.tick();
    sim.on('tick', ticked);
    ticked();
    fit(false);
    highlight();
  }

  function ticked() {
    linkSel.attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y).attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
    nodeSel.attr('transform', (d) => `translate(${d.x},${d.y})`);
  }

  function fit(animate) {
    const xs = nodeSel.data().map((d) => d.x), ys = nodeSel.data().map((d) => d.y);
    const x0 = Math.min(...xs) - 40, x1 = Math.max(...xs) + 40, y0 = Math.min(...ys) - 30, y1 = Math.max(...ys) + 40;
    const k = Math.min(2, 0.92 / Math.max((x1 - x0) / w, (y1 - y0) / h));
    const t = d3.zoomIdentity.translate(w / 2, h / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    (animate ? svg.transition().duration(500) : svg).call(zoom.transform, t);
  }

  function neighbours(id) {
    const set = new Set([id]);
    byId.person.get(id).ties.forEach((t) => set.add(t.other));
    return set;
  }

  function hover(id) {
    if (!built) return;
    const focus = id || (state.sel && state.sel.type === 'person' ? state.sel.id : null);
    apply(focus);
  }

  function apply(focus) {
    const near = focus ? neighbours(focus) : null;
    nodeSel.classed('is-dim', (d) => !!near && !near.has(d.id))
      .classed('is-primary', (d) => !!state.sel && state.sel.type === 'person' && state.sel.id === d.id);
    linkSel.classed('is-hot', (d) => !!focus && (d.source.id === focus || d.target.id === focus))
      .classed('is-dim', (d) => !!focus && d.source.id !== focus && d.target.id !== focus);
  }

  function highlight() {
    if (!built) return;
    if (state.sel && state.sel.type !== 'person') {
      const ids = new Set();
      if (state.sel.type === 'work') byId.work.get(state.sel.id).by.forEach((p) => ids.add(p));
      if (state.sel.type === 'event') byId.event.get(state.sel.id).people.forEach((p) => ids.add(p));
      if (state.sel.type === 'place') byId.place.get(state.sel.id).people.forEach((p) => ids.add(p));
      if (state.sel.type === 'journey') byId.journey.get(state.sel.id).people.forEach((p) => ids.add(p));
      nodeSel.classed('is-dim', (d) => ids.size > 0 && !ids.has(d.id)).classed('is-primary', (d) => ids.has(d.id));
      linkSel.classed('is-hot', (d) => ids.has(d.source.id) && ids.has(d.target.id)).classed('is-dim', (d) => ids.size > 0 && !(ids.has(d.source.id) && ids.has(d.target.id)));
      return;
    }
    apply(state.sel ? state.sel.id : null);
  }

  function show() {
    if (!built) build();
    else if (el.clientWidth !== w || el.clientHeight !== h) { w = el.clientWidth; h = el.clientHeight; fit(false); }
    highlight();
  }

  new ResizeObserver(() => {
    if (!built || el.hidden || !el.clientWidth) return;
    w = el.clientWidth; h = el.clientHeight;
    fit(false);
  }).observe(el);

  A.network = { show, highlight };
})();
