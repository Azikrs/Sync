/* A mesma pintura de cerdas da marca, agora contínua e recortada pelo texto vivo. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };

  document.querySelectorAll('[data-pincelado]').forEach(word => {
    const canvas = document.createElement('canvas');
    const pigment = document.createElement('canvas');
    const mask = document.createElement('canvas');
    const ctx = pigment.getContext('2d');
    const output = canvas.getContext('2d');
    const stencil = mask.getContext('2d');
    if (!ctx || !output || !stencil) return;
    canvas.className = 'texto-pincelado__tinta';
    canvas.setAttribute('aria-hidden', 'true');
    word.append(canvas);
    const reveal = word.closest('[data-revelar]');
    const openingSeed = Math.floor(Math.random() * 0x7fffffff);
    let brushes = [], colors = [], cycle = 0, duration = 5200, pause = 1800;
    let opening = true, openingDuration = 1350, released = !reveal;
    let elapsed = 0, lastTime = 0, frame = 0, timer = 0;
    let visible = false, ready = false, rest = 0, restingSince = 0;

    function prepareBrushes() {
      let seed = opening ? openingSeed : 37 + cycle * 97;
      const random = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
      const gestures = opening ? [
        { ink: 0, points: [[-20, 84], [54, 65], [106, 31], [184, 24]], width: 40, start: 0, span: .4 },
        { ink: 2, points: [[312, 79], [229, 112], [203, 54], [111, 55]], width: 35, start: .28, span: .4 },
        { ink: 1, points: [[82, 112], [149, 64], [227, 59], [318, 39]], width: 30, start: .58, span: .42 },
      ] : [
        { ink: 0, points: [[-20, 87], [48, 15], [133, 20], [203, 17]], width: 55, start: 0, span: .43 },
        { ink: 1, points: [[322, 20], [263, 26], [220, 66], [149, 53]], width: 46, start: .14, span: .39 },
        { ink: 2, points: [[27, 111], [99, 72], [205, 85], [289, 61]], width: 36, start: .33, span: .38 },
        { ink: 0, points: [[314, 104], [254, 75], [265, 20], [231, -9]], width: 26, start: .51, span: .32 },
        { ink: 1, points: [[61, -12], [77, 32], [115, 63], [168, 39]], width: 20, start: .64, span: .28 },
        { ink: 0, points: [[14, 100], [63, 65], [23, 37], [44, -8]], width: 19, start: .78, span: .22 },
      ];
      const mirror = opening && random() > .5;
      brushes = gestures.map(brush => ({ ...brush, step: 0,
        color: colors[(brush.ink + cycle) % colors.length],
        points: brush.points.map(([x, y]) => opening
          ? [(mirror ? 300 - x : x) + (random() - .5) * 18, y + (random() - .5) * 12]
          : [cycle % 2 ? 300 - x : x, cycle % 3 === 2 ? 100 - y : y]),
        bristles: Array.from({ length: 42 }, (_, i) => ({
          offset: (i / 41 - .5) * brush.width,
          width: .55 + random() * 1.25,
          alpha: .66 + random() * .32,
          lag: random() * .065,
          phase: random() * Math.PI * 2,
          dry: random() > .73,
        })),
      }));
    }

    function point(brush, t, bristle) {
      const [a, b, c, d] = brush.points, u = 1 - t;
      const x = u ** 3 * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t ** 3 * d[0];
      const y = u ** 3 * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t ** 3 * d[1];
      const dx = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0]);
      const dy = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1]);
      const length = Math.hypot(dx, dy) || 1;
      const pressure = .62 + .38 * Math.sin(Math.PI * t);
      const offset = bristle.offset * pressure + Math.sin(t * 21 + bristle.phase) * .65;
      return [x - dy / length * offset, y + dx / length * offset];
    }

    function deposit(progress) {
      ctx.setTransform(pigment.width / 300, 0, 0, pigment.height / 100, 0, 0);
      ctx.lineCap = 'round';
      brushes.forEach(brush => {
        const target = Math.round(smooth((progress - brush.start) / brush.span) * 180);
        if (target <= brush.step) return;
        ctx.strokeStyle = brush.color;
        brush.bristles.forEach(bristle => {
          ctx.globalAlpha = bristle.alpha;
          ctx.lineWidth = bristle.width;
          ctx.beginPath();
          let connected = false;
          for (let step = brush.step; step <= target; step++) {
            const t = clamp(step / 180 - bristle.lag);
            const [x, y] = point(brush, t, bristle);
            const dryGap = bristle.dry && Math.sin(t * 93 + bristle.phase) > .7;
            if (!connected || dryGap) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            connected = !dryGap;
          }
          ctx.stroke();
        });
        brush.step = target;
      });
      ctx.globalAlpha = 1;
    }

    function present() {
      output.clearRect(0, 0, canvas.width, canvas.height);
      output.drawImage(pigment, 0, 0);
      output.globalCompositeOperation = 'destination-in';
      output.drawImage(mask, 0, 0);
      output.globalCompositeOperation = 'source-over';
    }

    function paint(now) {
      frame = 0;
      if (!visible || document.hidden || reduced.matches) return;
      if (lastTime && now - lastTime < 1000 / 30) {
        frame = requestAnimationFrame(paint);
        return;
      }
      const phaseDuration = opening ? openingDuration : duration;
      elapsed = Math.min(phaseDuration, elapsed + (lastTime ? Math.min(now - lastTime, 80) : 0));
      lastTime = now;
      deposit(elapsed / phaseDuration);
      present();
      if (elapsed < phaseDuration) frame = requestAnimationFrame(paint);
      else {
        // A próxima mão de tinta cobre a anterior: não há apagão nem reinício branco.
        rest = opening ? 200 : pause;
        if (opening) opening = false;
        else cycle++;
        prepareBrushes();
        elapsed = lastTime = 0;
        start();
      }
    }

    function stop() {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      if (timer) rest = Math.max(0, rest - (performance.now() - restingSince));
      frame = timer = lastTime = 0;
    }

    function start() {
      if (!ready || !released || !visible || document.hidden || reduced.matches || frame || timer) return;
      if (rest > 0) {
        restingSince = performance.now();
        timer = setTimeout(() => { timer = rest = 0; start(); }, rest);
      } else frame = requestAnimationFrame(paint);
    }

    function measure() {
      stop();
      const css = getComputedStyle(word);
      const read = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
      const time = (name, fallback) => {
        const value = read(name, `${fallback}ms`);
        return Math.max(0, parseFloat(value) * (value.endsWith('ms') ? 1 : 1000)) || fallback;
      };
      duration = Math.max(800, time('--pincel-duracao', 5200));
      openingDuration = Math.max(600, time('--pincel-entrada', 1350));
      pause = time('--pincel-pausa', 1800);
      colors = [read('--pincel-verde', '#63836b'), read('--pincel-bege', '#d6c391'), read('--pincel-petroleo', '#66878c')];
      const rect = word.getBoundingClientRect();
      const bleed = parseFloat(css.fontSize) * .12;
      const width = rect.width + bleed * 2, height = rect.height + bleed * 2;
      if (!rect.width || !rect.height) return;
      // Mantém a camada anterior mesmo quando a orientação ou a fonte muda.
      const previous = document.createElement('canvas');
      previous.width = pigment.width; previous.height = pigment.height;
      previous.getContext('2d').drawImage(pigment, 0, 0);
      const scale = Math.min(devicePixelRatio || 1, 2);
      [canvas, pigment, mask].forEach(layer => {
        layer.width = Math.ceil(width * scale);
        layer.height = Math.ceil(height * scale);
      });
      ctx.drawImage(previous, 0, 0, pigment.width, pigment.height);
      stencil.setTransform(mask.width / width, 0, 0, mask.height / height, 0, 0);
      stencil.font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
      stencil.letterSpacing = css.letterSpacing;
      stencil.fillStyle = '#fff';
      const text = word.textContent;
      const metrics = stencil.measureText(text);
      const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(css.fontSize) * .8;
      const descent = metrics.fontBoundingBoxDescent ?? parseFloat(css.fontSize) * .2;
      const baseline = bleed + (rect.height - ascent - descent) / 2 + ascent;
      stencil.fillText(text, bleed, baseline);
      prepareBrushes();
      deposit(reduced.matches ? 1 : elapsed / (opening ? openingDuration : duration));
      present();
      ready = true;
      start();
    }

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start(); else stop();
    }).observe(word);
    document.addEventListener('visibilitychange', () => { stop(); start(); });
    if (reveal) {
      // A primeira pincelada começa quando a barra de entrada termina de descobrir a palavra.
      const release = () => {
        if (!reveal.classList.contains('revelar-concluido')) return;
        released = true;
        observer.disconnect();
        start();
      };
      const observer = new MutationObserver(release);
      observer.observe(reveal, { attributes: true, attributeFilter: ['class'] });
      release();
    }
    reduced.addEventListener('change', measure);
    document.fonts.ready.then(() => {
      measure();
      new ResizeObserver(measure).observe(word);
    });
  });
})();
