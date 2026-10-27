/*
 * The chronology strip: every event and publication as a typewriter-sized
 * glyph on a year axis. Drag across it to filter the map by years; press
 * play to watch the movement spread.
 */
(function () {
  'use strict';
  const A = window.Atlas;
  const { state } = A;

  const Y0 = 1942, YBREAK = 1971, Y1 = 2022;
  const GLYPH = 11;
  let svg, x, width = 0, height = 0, brush, brushG, itemsG, playTimer = null;
  const plotEl = document.getElementById('tl-plot');
  const rangeEl = document.getElementById('tl-range');
  const resetBtn = document.getElementById('tl-reset');
  const playBtn = document.getElementById('tl-play');
  const tip = document.getElementById('tip');

  const DEFAULT_NOTE = '1943–2021 · drag across the strip to filter the map by years';

  function layout() {
    width = plotEl.clientWidth;
    height = plotEl.clientHeight;
    const m = { l: 16, r: 18 };
    const split = m.l + (width - m.l - m.r) * 0.7;
    x = d3.scaleLinear().domain([Y0, YBREAK, Y1]).range([m.l, split, width - m.r]).clamp(true);
  }

  function itemFocus() {
    const sel = state.sel;
    if (!sel) return null;
    const matches = (it) => {
      if (sel.type === 'event') return it.type === 'event' && it.id === sel.id;
      if (sel.type === 'work') return it.type === 'work' && it.id === sel.id;
      if (sel.type === 'person') return it.people.includes(sel.id);
      if (sel.type === 'place') return it.place === sel.id;
      if (sel.type === 'journey') {
        const j = A.byId.journey.get(sel.id);
        return it.people.some((p) => j.people.includes(p)) && (it.type === 'work' ? it.id === j.work : true);
      }
      return false;
    };
    return matches;
  }

  function draw() {
    if (!plotEl.clientWidth) return;
    layout();
    plotEl.innerHTML = '';
    const compact = height < 60 || width < 640;
    const axisY = height - 20;
    svg = d3.select(plotEl).append('svg').attr('role', 'img').attr('aria-label', 'Timeline of events and publications, 1943 to 2021');

    /* axis */
    const axis = svg.append('g').attr('class', 'tl-axis').attr('transform', `translate(0,${axisY})`);
    axis.append('line').attr('x1', x(Y0)).attr('x2', x(Y1)).attr('y1', 0).attr('y2', 0);
    const majors = [1945, 1950, 1955, 1960, 1965, 1970, 1980, 1990, 2000, 2010, 2020];
    const minors = d3.range(1943, 1971).filter((y) => y % 5);
    axis.selectAll('.minor').data(minors).join('g').attr('class', 'minor')
      .append('line').attr('x1', (d) => x(d)).attr('x2', (d) => x(d)).attr('y1', 0).attr('y2', 3);
    const shown = compact ? [1950, 1960, 1970, 1990, 2010] : majors;
    const maj = axis.selectAll('.major').data(majors).join('g').attr('class', 'major');
    maj.append('line').attr('x1', (d) => x(d)).attr('x2', (d) => x(d)).attr('y1', 0).attr('y2', 6);
    maj.filter((d) => shown.includes(d)).append('text').attr('x', (d) => x(d)).attr('y', 17).attr('text-anchor', 'middle')
      .text((d) => (compact && d !== 1950 && d !== 2010 ? '’' + String(d).slice(2) : d));
    /* the scale change after 1970 is marked like a broken axis */
    const bx = x(YBREAK);
    axis.append('line').attr('class', 'tl-break').attr('x1', bx - 3).attr('x2', bx + 3).attr('y1', 0).attr('y2', 0);
    axis.append('path').attr('class', 'tl-break-mark').attr('d', `M${bx - 5},4 L${bx - 1},-4 M${bx + 1},4 L${bx + 5},-4`);

    /* brush under the glyphs, so glyphs stay clickable */
    brush = d3.brushX().extent([[x(Y0), 0], [x(Y1), axisY]]).on('end', brushed);
    brushG = svg.append('g').attr('class', 'tl-brush').call(brush);

    /* stacked glyphs */
    const items = A.timeline.map((it) => ({ ...it, cx: x(it.t) }));
    const cols = [];
    const step = compact ? Math.max(6, Math.min(GLYPH, (axisY - 4) / 9)) : GLYPH;
    const maxStack = Math.max(1, Math.floor((axisY - 4) / step));
    items.forEach((it) => {
      let level = 0;
      while (cols.some((c) => c.level === level && Math.abs(c.cx - it.cx) < step - 1)) level++;
      it.level = Math.min(level, maxStack - 1);
      cols.push(it);
    });
    itemsG = svg.append('g');
    const g = itemsG.selectAll('g').data(items).join('g')
      .attr('class', 'tl-item')
      .attr('tabindex', compact ? null : 0)
      .attr('role', 'button')
      .attr('aria-label', (d) => `${A.fmtDate(d.date)}: ${d.title}`)
      .attr('transform', (d) => `translate(${d.cx - 6},${axisY - 6 - step * (d.level + 0.5) - 1}) scale(${step / GLYPH})`);
    g.append('rect').attr('class', 'hit').attr('x', -2).attr('y', -2).attr('width', 16).attr('height', 16);
    g.append('circle').attr('class', 'g-ring').attr('cx', 6).attr('cy', 6).attr('r', 7.5).attr('fill', 'none');
    g.append('g').html((d) => A.tlGlyph(d.kind));
    g.on('mouseenter', (ev, d) => showTip(ev, d)).on('mousemove', (ev, d) => showTip(ev, d)).on('mouseleave', hideTip)
      .on('focus', (ev, d) => showTip(ev, d)).on('blur', hideTip)
      .on('click', (ev, d) => { hideTip(); A.emit('navigate', { type: d.type, id: d.id }); })
      .on('keydown', (ev, d) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); A.emit('navigate', { type: d.type, id: d.id }); } });

    if (state.range) brushG.call(brush.move, [x(state.range[0]), x(state.range[1] + 0.999)]);
    highlight();
  }

  function showTip(ev, d) {
    const what = d.type === 'work' ? `${A.WORK_KINDS[A.byId.work.get(d.id).kind]} · ${A.byId.work.get(d.id).by.map((p) => A.byId.person.get(p).short).join(', ')}` : A.EVENT_KINDS[d.kind];
    tip.innerHTML = `${A.esc(d.title)}<small>${A.fmtDate(d.date)} · ${A.esc(what)}</small>`;
    tip.hidden = false;
    const r = (ev.currentTarget || ev.target).getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const left = Math.max(8, Math.min(window.innerWidth - tw - 8, r.left + r.width / 2 - tw / 2));
    tip.style.left = left + 'px';
    tip.style.top = Math.max(8, r.top - th - 8) + 'px';
  }
  function hideTip() { tip.hidden = true; }

  function highlight() {
    if (!itemsG) return;
    const f = itemFocus();
    const sel = state.sel;
    itemsG.selectAll('.tl-item')
      .classed('is-focus', (d) => !!f && f(d))
      .classed('is-dim', (d) => (state.range ? d.t < state.range[0] || d.t >= state.range[1] + 1 : false) || (!!f && !f(d) && !!sel && sel.type !== 'journey'))
      .classed('is-primary', (d) => !!sel && d.type === sel.type && d.id === sel.id);
  }

  function setRange(r, { silent } = {}) {
    state.range = r;
    resetBtn.hidden = !r;
    rangeEl.innerHTML = r ? `Showing places active in <b>${r[0] === r[1] ? r[0] : r[0] + '–' + r[1]}</b>` : DEFAULT_NOTE;
    highlight();
    if (!silent) A.emit('range', r);
  }

  function brushed(ev) {
    if (!ev.sourceEvent) return; /* programmatic move */
    stopPlay();
    if (!ev.selection) { setRange(null); return; }
    const [a, b] = ev.selection.map(x.invert);
    let y0 = Math.floor(a), y1 = Math.floor(b);
    if (y1 < y0) y1 = y0;
    brushG.call(brush.move, [x(y0), x(y1 + 0.999)]);
    setRange([y0, y1]);
  }

  function reset() {
    stopPlay();
    if (brushG) brushG.call(brush.move, null);
    setRange(null);
  }

  function stopPlay() {
    if (playTimer) { clearInterval(playTimer); playTimer = null; }
    playBtn.classList.remove('is-on');
    playBtn.textContent = 'Play the years';
  }

  /* A three-year window sweeps from the Columbia days to the end of the century. */
  function play() {
    if (playTimer) { stopPlay(); return; }
    let y = 1943;
    playBtn.classList.add('is-on');
    playBtn.textContent = 'Stop';
    const tick = () => {
      if (y > 1997) { stopPlay(); return; }
      const r = [y, y + 2];
      if (brushG) brushG.call(brush.move, [x(r[0]), x(r[1] + 0.999)]);
      setRange(r);
      y += 1;
    };
    tick();
    playTimer = setInterval(tick, A.reducedMotion.matches ? 1600 : 900);
  }

  function init() {
    draw();
    resetBtn.addEventListener('click', reset);
    playBtn.addEventListener('click', play);
    let raf = 0;
    new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }).observe(plotEl);
  }

  A.timelineView = { init, highlight, reset, setRange };
})();
