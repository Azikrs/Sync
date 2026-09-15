/* Abertura de pigmento sobre o título: texto cacheado, sem filtros por frame.
 * A galeria controla eventos e RAF; esta camada nunca intercepta as fotografias.
 */
(() => {
  'use strict';
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const smooth = (v) => { const t = clamp(v); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const rgb = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));

  function makePigments() {
    const pigment = document.createElement('canvas');
    const opening = document.createElement('canvas');
    const coverage = document.createElement('canvas');
    pigment.width = pigment.height = opening.width = opening.height = coverage.width = coverage.height = 176;
    const paint = pigment.getContext('2d');
    const erase = opening.getContext('2d');
    const cover = coverage.getContext('2d');
    if (!paint || !erase || !cover) return null;
    const colors = paint.createImageData(176, 176), holes = erase.createImageData(176, 176), edges = cover.createImageData(176, 176);
    let seed = 73;
    const noiseGrid = Float32Array.from({ length: 1024 }, () => {
      seed = Math.imul(seed, 1664525) + 1013904223 | 0;
      return (seed >>> 0) / 4294967296;
    });
    function noise(x, y) {
      const ix = Math.floor(x), iy = Math.floor(y), u = smooth(x - ix), v = smooth(y - iy);
      const sample = (a, b) => noiseGrid[(a & 31) + (b & 31) * 32];
      return lerp(lerp(sample(ix, iy), sample(ix + 1, iy), u), lerp(sample(ix, iy + 1), sample(ix + 1, iy + 1), u), v);
    }
    const blue = [29, 91, 134], green = [54, 111, 77];
    const gold = [215, 185, 95], white = [255, 255, 255];
    let lastTime = -1;
    function update(time) {
      if (lastTime >= 0 && time - lastTime < 1 / 30) return;
      lastTime = time;
      // Campos que sobem e se cruzam: não há anéis nem um contorno girando ao redor do mouse.
      for (let y = 0; y < 176; y++) {
        const v = (y / 175 - .5) * 2.7;
        const wave = Math.sin(v * 5 - time * .8) * .085;
        for (let x = 0; x < 176; x++) {
          const u = (x / 175 - .5) * 2.7;
          const n = noise(u * 2.1 + time * .14 + 12, v * 2.4 + time * .33 + 12);
          const fine = noise(u * 5.2 + 22, v * 5.7 + time * .5 + 19);
          const wx = u + (n - .5) * .56 + wave;
          const wy = v + (noise(u * 2.7 + 5, v * 2 - time * .22 + 7) - .5) * .48;
          const distance = Math.min(Math.hypot(wx * .92, wy * 1.08), Math.hypot((wx + .25) * 1.5, (wy + .23) * 1.2)) + (fine - .5) * .14;
          const ink = clamp((distance - .35) * 1.9 + (n - .5) * 1.4 + (fine - .5) * .35);
          const color = ink < .5 ? rgb(blue, green, smooth(ink * 2)) : rgb(green, gold, smooth((ink - .5) * 2));
          const light = smooth((distance - .72) / .34);
          const i = (y * 176 + x) * 4;
          for (let c = 0; c < 3; c++) { colors.data[i + c] = lerp(color[c], white[c], light); holes.data[i + c] = edges.data[i + c] = 255; }
          colors.data[i + 3] = 255;
          holes.data[i + 3] = Math.round(smooth((.68 - distance) / .25) * 255);
          edges.data[i + 3] = Math.round(smooth((1.17 - distance) / .31) * 255);
        }
      }
      paint.putImageData(colors, 0, 0); erase.putImageData(holes, 0, 0); cover.putImageData(edges, 0, 0);
    }
    update(0);
    return { pigment, opening, coverage, update };
  }

  function create({ stage, title }) {
    if (!stage || !title) return null;
    const canvas = document.createElement('canvas');
    canvas.className = 'paisagens-lente';
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' });
    const ctx = canvas.getContext('2d');
    const text = document.createElement('canvas');
    const ink = text.getContext('2d');
    const heat = document.createElement('canvas');
    const heatContext = heat.getContext('2d');
    const masks = makePigments();
    if (!ctx || !ink || !heatContext || !masks) return null;
    stage.append(canvas);
    let bounds, pixelRatio = 1, cacheX = 0, cacheY = 0, cacheWidth = 0, cacheHeight = 0;
    let ready = false, destroyed = false, reduced = false, dirty = true;
    let focus = null;
    let time = 0;
    const pointer = { x: 0, y: 0, active: false };
    const current = { x: 0, y: 0, alpha: 0, sx: 1, sy: 1, angle: 0 };
    const goal = { ...current };

    function fallback() {
      ready = false;
      title.classList.remove('is-lente-pronta');
      canvas.style.visibility = 'hidden';
    }

    function updateGoal() {
      if (!bounds) return;
      if (focus) {
        goal.x = focus.left + focus.width / 2 - bounds.left;
        goal.y = focus.top + focus.height / 2 - bounds.top;
        // A abertura cobre também os cantos do cartão: seu conteúdo permanece legível.
        goal.sx = Math.max(1, (focus.width + 28) / 225);
        goal.sy = Math.max(1, (focus.height + 28) / 225);
        goal.alpha = 1;
        goal.angle = 0;
      } else {
        goal.x = pointer.x - bounds.left;
        goal.y = pointer.y - bounds.top;
        goal.sx = 1;
        goal.sy = .95;
        goal.angle = clamp((goal.x - current.x) / 650, -.19, .19);
        goal.alpha = pointer.active ? 1 : 0;
      }
      if (current.alpha < .002 && goal.alpha) {
        current.x = goal.x; current.y = goal.y;
      }
      dirty = true;
    }

    function applyFont(context, style) {
      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      context.textBaseline = 'alphabetic';
      context.textAlign = 'left';
      context.direction = style.direction;
      if ('fontKerning' in context) context.fontKerning = style.fontKerning;
      if ('letterSpacing' in context) context.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
    }

    function resize() {
      if (destroyed) return;
      try {
        title.classList.remove('is-lente-pronta');
        bounds = stage.getBoundingClientRect();
        if (bounds.width < 1 || bounds.height < 1) { fallback(); return; }
        pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5,
          Math.sqrt(3000000 / (bounds.width * bounds.height)));
        canvas.width = Math.ceil(bounds.width * pixelRatio);
        canvas.height = Math.ceil(bounds.height * pixelRatio);
        const elements = [...title.children].filter((el) => getComputedStyle(el).display !== 'none');
        const rows = (elements.length ? elements : [title]).map((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          let value = element.textContent.trim().replace(/\s+/g, ' ');
          if (style.textTransform === 'uppercase') value = value.toLocaleUpperCase('pt-BR');
          if (style.textTransform === 'lowercase') value = value.toLocaleLowerCase('pt-BR');
          applyFont(ink, style);
          const metric = ink.measureText(value);
          const size = parseFloat(style.fontSize);
          const ascent = metric.fontBoundingBoxAscent ?? size * .8;
          const descent = metric.fontBoundingBoxDescent ?? size * .2;
          const line = parseFloat(style.lineHeight) || size * 1.2;
          const range = document.createRange();
          range.selectNodeContents(element);
          const logical = range.getBoundingClientRect();
          range.detach();
          return { style, value, metric, x: logical.left - bounds.left,
            y: rect.top - bounds.top + (line - ascent - descent) / 2 + ascent };
        });
        cacheX = Math.floor(Math.min(...rows.map((row) => row.x - row.metric.actualBoundingBoxLeft)) - 4);
        cacheY = Math.floor(Math.min(...rows.map((row) => row.y - row.metric.actualBoundingBoxAscent)) - 4);
        const right = Math.max(...rows.map((row) => row.x + Math.max(row.metric.width, row.metric.actualBoundingBoxRight))) + 4;
        const bottom = Math.max(...rows.map((row) => row.y + row.metric.actualBoundingBoxDescent)) + 4;
        cacheWidth = Math.ceil(right - cacheX); cacheHeight = Math.ceil(bottom - cacheY);
        if (!Number.isFinite(cacheWidth) || cacheWidth < 1 || cacheHeight < 1) { fallback(); return; }
        text.width = Math.ceil(cacheWidth * pixelRatio); text.height = Math.ceil(cacheHeight * pixelRatio);
        ink.setTransform(pixelRatio, 0, 0, pixelRatio, -cacheX * pixelRatio, -cacheY * pixelRatio);
        rows.forEach(({ style, value, x, y }) => {
          applyFont(ink, style);
          ink.fillStyle = style.color;
          ink.fillText(value, x, y);
        });
        ready = true;
        canvas.style.visibility = '';
        title.classList.add('is-lente-pronta');
        updateGoal();
        draw();
      } catch { fallback(); }
    }

    function draw() {
      if (!ready || destroyed) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.drawImage(text, cacheX, cacheY, cacheWidth, cacheHeight);
      if (current.alpha > .001) {
        masks.update(time);
        const width = 620 * current.sx, height = 620 * current.sy;
        const left = current.x - width / 2, top = current.y - height / 2;
        const size = Math.ceil(620 * pixelRatio);
        if (heat.width !== size) heat.width = heat.height = size;
        heatContext.setTransform(1, 0, 0, 1, 0, 0);
        heatContext.clearRect(0, 0, size, size);
        heatContext.setTransform(size / width, 0, 0, size / height, 0, 0);
        heatContext.globalCompositeOperation = 'source-over';
        // Refração real das letras em lâminas finas, restrita ao campo difuso de calor.
        const first = Math.max(0, cacheY - top - 12), last = Math.min(height, cacheY + cacheHeight - top + 12);
        for (let row = first; row < last; row += 3) {
          const dx = (Math.sin(row * .032 - time * 2) * 5 + Math.sin(row * .073 + time * 1.3) * 2.4) * current.alpha;
          const dy = Math.sin(row * .024 + time) * 1.3 * current.alpha;
          heatContext.save();
          heatContext.beginPath(); heatContext.rect(0, row, width, 3.25); heatContext.clip();
          heatContext.drawImage(text, cacheX - left + dx, cacheY - top + dy, cacheWidth, cacheHeight);
          heatContext.restore();
        }
        heatContext.globalCompositeOperation = 'source-atop';
        heatContext.drawImage(masks.pigment, 0, 0, width, height);
        heatContext.globalCompositeOperation = 'destination-in';
        heatContext.drawImage(masks.coverage, 0, 0, width, height);
        heatContext.globalCompositeOperation = 'destination-out';
        heatContext.drawImage(masks.opening, 0, 0, width, height);
        ctx.save(); ctx.globalAlpha = current.alpha;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(masks.coverage, left, top, width, height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(heat, left, top, width, height);
        ctx.restore();
      }
      dirty = false;
    }

    function needsFrame() {
      return !destroyed && ready && (dirty || (!reduced && goal.alpha > 0) || Object.keys(current).some((key) =>
        Math.abs(current[key] - goal[key]) > (key === 'x' || key === 'y' ? .035 : .0005)));
    }

    function tick(dt = 1 / 60) {
      if (!needsFrame()) return;
      const duration = clamp(dt, 1 / 240, .08);
      if (!reduced) time += duration * .65;
      Object.keys(current).forEach((key) => {
        const speed = key === 'alpha' ? (goal.alpha ? 6 : 6) : key === 'x' || key === 'y' ? 11 : 7;
        current[key] = reduced ? goal[key] : lerp(current[key], goal[key], 1 - Math.exp(-duration * speed));
        if (Math.abs(current[key] - goal[key]) < (key === 'x' || key === 'y' ? .035 : .0005)) current[key] = goal[key];
      });
      try { draw(); } catch { fallback(); }
    }

    function setPointer(clientX, clientY, active = true) {
      if (destroyed) return;
      const nextBounds = stage.getBoundingClientRect();
      if (pointer.x === clientX && pointer.y === clientY && pointer.active === active
        && bounds?.top === nextBounds.top && bounds?.left === nextBounds.left) return;
      pointer.x = clientX; pointer.y = clientY; pointer.active = active;
      bounds = nextBounds;
      updateGoal();
    }

    function setFocus(rect) {
      if (destroyed) return;
      const nextBounds = stage.getBoundingClientRect();
      if (bounds?.top === nextBounds.top && bounds?.left === nextBounds.left
        && ((!rect && !focus) || (rect && focus && ['left', 'top', 'width', 'height'].every((key) => rect[key] === focus[key])))) return;
      focus = rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null;
      bounds = nextBounds;
      updateGoal();
    }

    function setReduced(value) { reduced = Boolean(value); dirty = true; if (reduced) tick(); }
    function destroy() {
      destroyed = true;
      title.classList.remove('is-lente-pronta');
      canvas.remove();
      text.width = text.height = heat.width = heat.height = masks.pigment.width = masks.opening.width = masks.coverage.width = 1;
    }
    resize();
    document.fonts?.ready.then(() => { if (!destroyed) resize(); });
    return { resize, setPointer, setFocus, tick, needsFrame, setReduced, destroy };
  }
  window.AfloraLentePaisagens = { create };
})();
