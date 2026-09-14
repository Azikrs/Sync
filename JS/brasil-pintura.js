(() => {
  const scene = document.querySelector('.brasil-pintura');
  if (!scene) return;
  const sequence = scene.querySelector('.brasil-pintura__sequencia') || scene;
  const stage = scene?.querySelector('.brasil-pintura__palco');
  const artwork = scene?.querySelector('.brasil-pintura__arte');
  const fallback = artwork?.querySelector('img');

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const touch = window.matchMedia('(pointer: coarse)');
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const between = (value, start, end) => clamp((value - start) / (end - start));
  const smooth = (value) => value * value * (3 - 2 * value);
  const whenIdle = (callback) => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(callback, { timeout: 1400 });
    else window.setTimeout(callback, 200);
  };

  // O deslocamento usa toda a seção; novas divs não reiniciam nem cortam a imagem.
  function initializeBackground() {
    if (!scene.querySelector('.brasil-pintura__fundo')) return;
    const transitions = ['foz', 'lencois'].map((key) => ({
      key, element: scene.querySelector(`[data-destino="${key}"]`), start: 0, end: 1,
      wrapper: scene.querySelector(`[data-paisagem="${key}"]`), pigment: null,
    })).filter(({ element }) => element);
    const wash = scene.querySelector('.brasil-pintura__aguada');
    let frame = 0;
    let visible = true;
    let needsMeasure = true;
    let top = 0;
    let height = 1;
    let viewport = 1;
    let lastMargin = 96;

    function render() {
      frame = 0;
      if (needsMeasure) {
        top = scene.getBoundingClientRect().top + window.scrollY;
        height = scene.offsetHeight;
        viewport = scene.querySelector('.brasil-pintura__janela').clientHeight || window.innerHeight;
        const style = getComputedStyle(scene);
        const before = Number.parseFloat(style.getPropertyValue('--transicao-antes')) || 1.15;
        const after = Number.parseFloat(style.getPropertyValue('--transicao-depois')) || 0.38;
        const aspect = scene.clientWidth / viewport;
        transitions.forEach((transition) => {
          const nextTop = transition.element.getBoundingClientRect().top + window.scrollY;
          transition.start = nextTop - viewport * before;
          transition.end = nextTop + viewport * after;
          if (transition.aspect !== aspect) {
            transition.aspect = aspect;
            transition.pigment = null;
          }
          // Prepara a textura durante a vista livre, evitando trabalho extra no primeiro gesto.
          if (!motion.matches && !transition.pigment && !transition.warming) {
            transition.warming = true;
            whenIdle(() => {
              if (!motion.matches) transition.pigment ||= window.AfloraPigmento?.create(transition.key, transition.aspect, true);
              transition.warming = false;
            });
          }
        });
        needsMeasure = false;
      }
      const progress = clamp((window.scrollY - top + viewport) / (height + viewport));
      const configuredSpeed = Number.parseFloat(getComputedStyle(scene).getPropertyValue('--parallax-velocidade'));
      const speed = Number.isFinite(configuredSpeed) ? Math.max(0, configuredSpeed) : 1;
      const travel = Math.min(72, viewport * 0.075) * speed;
      // A sobra acompanha a intensidade para a foto nunca revelar bordas vazias.
      const margin = Math.max(96, Math.ceil(travel + 24));
      if (margin !== lastMargin) {
        scene.style.setProperty('--parallax-margem', `${margin}px`);
        lastMargin = margin;
      }
      const offset = motion.matches ? 0 : (1 - 2 * progress) * travel;
      scene.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
      let mist = 0;
      let washOpacity = 0;
      transitions.forEach((transition) => {
        const { key, start, end, wrapper } = transition;
        const crossing = motion.matches ? 0 : smooth(between(window.scrollY, start, end));
        scene.style.setProperty(`--${key}-opacity`, crossing.toFixed(4));
        scene.style.setProperty(`--${key}-entrada-y`, `${(1 - crossing) * 24}px`);
        scene.style.setProperty(`--${key}-escala`, (1 + (1 - crossing) * 0.035).toFixed(4));
        const active = crossing > 0 && crossing < 1;
        if (active && wrapper && !transition.pigment) {
          transition.pigment = window.AfloraPigmento?.create(key, transition.aspect, true);
        }
        if (active && transition.pigment && wrapper) {
          const { mask, edge } = transition.pigment.render(crossing);
          wrapper.style.maskImage = mask;
          wrapper.firstElementChild.style.opacity = '1';
          if (wash) {
            wash.style.maskImage = edge;
            wash.dataset.corrente = key;
            washOpacity = Math.sin(crossing * Math.PI) * 0.26;
          }
        } else {
          wrapper?.style.removeProperty('mask-image');
          wrapper?.firstElementChild.style.removeProperty('opacity');
          mist = Math.max(mist, Math.sin(crossing * Math.PI) * 0.16);
        }
      });
      if (wash) {
        wash.style.opacity = washOpacity.toFixed(4);
        if (!washOpacity) wash.style.removeProperty('mask-image');
      }
      scene.style.setProperty('--foz-nevoa', mist.toFixed(4));
    }

    function schedule(measure = false) {
      needsMeasure ||= measure;
      if (!frame && (visible || measure)) frame = requestAnimationFrame(render);
    }

    function updateMotion() {
      scene.classList.toggle('has-parallax', !motion.matches);
      schedule(true);
    }

    window.addEventListener('scroll', () => schedule(), { passive: true });
    window.addEventListener('resize', () => schedule(true), { passive: true });
    window.addEventListener('pageshow', () => schedule(true));
    scene.addEventListener('destinos:medidos', () => schedule(true));
    motion.addEventListener('change', updateMotion);
    if ('ResizeObserver' in window) {
      const resize = new ResizeObserver(() => schedule(true));
      resize.observe(scene);
      transitions.forEach(({ element }) => resize.observe(element));
      const christ = scene.querySelector('.cristo-redentor-pagina');
      if (christ) resize.observe(christ);
      const intro = document.querySelector('.pagina-inicial-conteudo');
      if (intro) resize.observe(intro);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) schedule(true);
      }, { rootMargin: '50% 0px' }).observe(scene);
    }
    document.fonts?.ready.then(() => schedule(true));
    updateMotion();
  }

  initializeBackground();
  if (!stage || !artwork || !fallback) return;

  const prepare = (element) => ({
    element,
    start: Number(element.dataset.paintStart || 0),
    end: Number(element.dataset.paintEnd || 1),
    opacity: Number(element.getAttribute('opacity') || 1),
  });

  async function initialize() {
    // Reserva a altura antes do carregamento para preservar o scroll ao recarregar.
    scene.classList.add('is-loading');
    scene.classList.toggle('is-reduced-motion', motion.matches);
    try {
      const response = await fetch(fallback.src);
      if (!response.ok) return;
      const documentSvg = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
      const original = documentSvg.documentElement;
      if (original.localName !== 'svg' || documentSvg.querySelector('parsererror')) return;

      const svg = document.importNode(original, true);
      const strokes = [...svg.querySelectorAll('[data-paint-stroke]')].map(prepare);
      const reveals = [...svg.querySelectorAll('[data-paint-reveal]')].map(prepare);
      if (!strokes.length) return;

      const depth = { green: 0.6, gold: -0.25, blue: -0.5, detail: -0.35, pencil: 1 };
      const layers = [...svg.querySelectorAll('[data-paint-layer]')].map((element) => ({
        element,
        depth: depth[element.dataset.paintLayer] || 0,
        transform: element.getAttribute('transform') || '',
      }));

      strokes.forEach(({ element }) => {
        element.style.strokeDasharray = '1';
      });
      artwork.replaceChildren(svg);
      svg.classList.add('brasil-pintura__original');
      // Um último gesto solto conserva as cores enquanto o pigmento se dispersa.
      const gesture = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      gesture.setAttribute('viewBox', '0 0 1200 800');
      gesture.setAttribute('aria-hidden', 'true');
      gesture.setAttribute('focusable', 'false');
      gesture.classList.add('brasil-pintura__gesto');
      [
        ['M140 570C310 565 365 435 520 414S814 430 1040 230', '#548a65', 14],
        ['M210 616C433 560 487 550 640 409S900 284 1110 312', '#dec47a', 5],
        ['M155 440C389 528 571 300 720 356S941 460 1092 292', '#6395a8', 9],
      ].forEach(([d, color, width]) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        Object.entries({ d, stroke: color, 'stroke-width': width, fill: 'none', 'stroke-linecap': 'round', pathLength: 1 })
          .forEach(([name, value]) => path.setAttribute(name, value));
        gesture.appendChild(path);
      });
      artwork.appendChild(gesture);
      const exitCanvas = document.createElement('canvas');
      exitCanvas.className = 'brasil-pintura__saida';
      exitCanvas.setAttribute('aria-hidden', 'true');
      const exitContext = exitCanvas.getContext('2d');
      artwork.insertBefore(exitCanvas, gesture);
      let snapshot = null;
      let snapshotPending = false;
      function prepareSnapshot() {
        if (!touch.matches || snapshot || snapshotPending || !exitContext) return;
        snapshotPending = true;
        const copy = svg.cloneNode(true);
        copy.setAttribute('width', '1200');
        copy.setAttribute('height', '800');
        copy.style.removeProperty('mask-image');
        copy.style.filter = 'none';
        copy.querySelectorAll('[data-paint-stroke], [data-paint-reveal]').forEach(node => {
          node.style.strokeDashoffset = '0';
          node.style.opacity = node.getAttribute('opacity') || '1';
        });
        copy.querySelectorAll('[data-paint-layer]').forEach((node, i) => node.setAttribute('transform', layers[i].transform));
        const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }));
        const image = new Image();
        image.onload = () => {
          exitCanvas.width = Math.min(1200, Math.max(720, Math.ceil(artwork.clientWidth * Math.min(devicePixelRatio, 2))));
          exitCanvas.height = Math.round(exitCanvas.width / 1.5);
          const frozen = document.createElement('canvas');
          frozen.width = exitCanvas.width;
          frozen.height = exitCanvas.height;
          const frozenContext = frozen.getContext('2d');
          if (frozenContext) {
            frozenContext.drawImage(image, 0, 0, frozen.width, frozen.height);
            snapshot = frozen;
          }
          URL.revokeObjectURL(url);
          snapshotPending = false;
          lastDeparture = -1;
          schedule();
        };
        image.onerror = () => { URL.revokeObjectURL(url); snapshotPending = false; };
        image.src = url;
      }
      let pigment = null;
      whenIdle(() => {
        if (!motion.matches) pigment ||= window.AfloraPigmento?.create('bandeira', 1.5);
        prepareSnapshot();
      });

      let frame = 0;
      let visible = true;
      let needsMeasure = true;
      let sceneTop = 0;
      let distance = 1;
      let lastProgress = -1;
      let lastDeparture = -1;
      let lastDrawing = -1;
      let release = 0;

      const variable = (name, value) => scene.style.setProperty(name, value);

      function paint(progress, departure) {
        const reduced = motion.matches;
        const drawing = reduced ? 1 : between(progress, 0.28, 0.86);
        const retreat = smooth(between(progress, 0.35, 0.57));

        variable('--scene-progress', progress.toFixed(4));
        variable('--paper-opacity', smooth(between(progress, 0.08, 0.40)).toFixed(4));
        variable('--text-paint', smooth(between(progress, 0.07, 0.32)).toFixed(4));
        variable('--title-opacity', reduced ? '1' : (1 - retreat).toFixed(4));
        variable('--title-y', `${reduced ? 0 : -32 * retreat}px`);
        variable('--title-scale', reduced ? '1' : (1 - 0.04 * retreat).toFixed(4));
        variable('--art-opacity', reduced ? '1' : (smooth(between(progress, 0.24, 0.36)) * (1 - smooth(between(departure, 0.75, 1)))).toFixed(4));
        variable('--art-scale', reduced ? '1' : ((0.94 + 0.06 * smooth(between(progress, 0.25, 0.8))) * (1 + 0.06 * departure)).toFixed(4));
        variable('--art-x', `${18 * departure}px`);
        variable('--art-y', `${reduced ? 0 : 18 - 30 * progress - 26 * departure}px`);
        variable('--art-rotate', `${-0.7 * departure}deg`);
        variable('--art-difusao', `${touch.matches ? 0 : 1.8 * departure}px`);
        variable('--final-opacity', reduced ? '0' : (smooth(between(progress, 0.76, 0.92)) * (1 - departure)).toFixed(4));

        const head = smooth(between(departure, 0.08, 0.78));
        const tail = smooth(between(departure, 0.36, 1));
        variable('--gesto-tamanho', Math.max(0.001, head - tail).toFixed(4));
        variable('--gesto-avanco', (-tail).toFixed(4));
        variable('--gesto-opacity', (Math.sin(between(departure, 0.05, 0.96) * Math.PI) * 0.3).toFixed(4));
        const canvasExit = touch.matches && snapshot && exitContext && departure > 0;
        artwork.classList.toggle('saida-em-canvas', Boolean(canvasExit));
        if (canvasExit) {
          pigment ||= window.AfloraPigmento?.create('bandeira', 1.5);
          exitContext.clearRect(0, 0, exitCanvas.width, exitCanvas.height);
          exitContext.drawImage(snapshot, 0, 0, exitCanvas.width, exitCanvas.height);
          if (pigment) {
            exitContext.globalCompositeOperation = 'destination-in';
            pigment.drawTo(exitContext, departure);
            exitContext.globalCompositeOperation = 'source-over';
          }
          svg.style.removeProperty('mask-image');
        } else if (departure > 0 && departure < 1 && !touch.matches) {
          pigment ||= window.AfloraPigmento?.create('bandeira', 1.5);
          if (pigment) svg.style.maskImage = pigment.render(departure).mask;
        } else svg.style.removeProperty('mask-image');

        if (drawing !== lastDrawing) {
          strokes.forEach(({ element, start, end, opacity }) => {
            const amount = smooth(between(drawing, start, end));
            element.style.strokeDashoffset = (1 - amount).toFixed(4);
            // Evita que a ponta quadrada do pincel apareça antes do primeiro gesto.
            element.style.opacity = (opacity * between(amount, 0, 0.025)).toFixed(4);
          });
          reveals.forEach(({ element, start, end, opacity }) => {
            element.style.opacity = (opacity * smooth(between(drawing, start, end))).toFixed(4);
          });
          lastDrawing = drawing;
        }
        if (!touch.matches) layers.forEach(({ element, depth: layerDepth, transform }) => {
          const drift = reduced ? 0 : ((progress - 0.5) * 12 + departure * 18) * layerDepth;
          element.setAttribute('transform', `${transform} translate(${drift * 0.3} ${drift})`.trim());
        });
      }

      function render() {
        frame = 0;
        if (needsMeasure) {
          sceneTop = sequence.getBoundingClientRect().top + window.scrollY;
          distance = Math.max(1, sequence.offsetHeight - stage.offsetHeight);
          const configured = Number.parseFloat(getComputedStyle(scene).getPropertyValue('--bandeira-sopro'));
          release = stage.offsetHeight * Math.max(0, Math.min(1, Number.isFinite(configured) ? configured : 0.9));
          needsMeasure = false;
        }
        const progress = motion.matches ? 1 : clamp((window.scrollY - sceneTop) / distance);
        const departure = motion.matches ? 0 : smooth(between(window.scrollY, sceneTop + distance * 0.88, sceneTop + distance + release));
        variable('--bandeira-acompanhar', `${motion.matches ? 0 : Math.max(0, Math.min(release, window.scrollY - sceneTop - distance))}px`);
        if (progress !== lastProgress || departure !== lastDeparture) {
          paint(progress, departure);
          lastProgress = progress;
          lastDeparture = departure;
        }
      }

      function schedule(measure = false) {
        needsMeasure ||= measure;
        if (!frame && (visible || measure)) frame = requestAnimationFrame(render);
      }

      function updateMotion() {
        scene.classList.toggle('is-reduced-motion', motion.matches);
        lastProgress = -1;
        lastDeparture = -1;
        schedule(true);
      }

      scene.classList.add('is-ready');
      scene.classList.toggle('is-reduced-motion', motion.matches);
      render();

      window.addEventListener('scroll', () => schedule(), { passive: true });
      window.addEventListener('resize', () => schedule(true), { passive: true });
      motion.addEventListener('change', updateMotion);
      touch.addEventListener('change', () => { prepareSnapshot(); updateMotion(); });

      if ('ResizeObserver' in window) {
        const resize = new ResizeObserver(() => schedule(true));
        resize.observe(scene);
        resize.observe(sequence);
        resize.observe(stage);
        const intro = document.querySelector('.pagina-inicial-conteudo');
        if (intro) resize.observe(intro);
      }

      if ('IntersectionObserver' in window) {
        const intersection = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) schedule(true);
        }, { rootMargin: '50% 0px' });
        intersection.observe(sequence);
      }

      window.addEventListener('pageshow', () => schedule(true));
      document.fonts?.ready.then(() => schedule(true));
    } catch {
      // A ilustração e o título estáticos continuam acessíveis se o carregamento falhar.
      scene.classList.remove('is-ready', 'is-reduced-motion');
    } finally {
      scene.classList.remove('is-loading');
      if (!scene.classList.contains('is-ready')) scene.classList.remove('is-reduced-motion');
    }
  }

  initialize();
})();
