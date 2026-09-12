(() => {
  const scene = document.querySelector('.brasil-pintura');
  if (!scene) return;
  const sequence = scene.querySelector('.brasil-pintura__sequencia') || scene;
  const stage = scene?.querySelector('.brasil-pintura__palco');
  const artwork = scene?.querySelector('.brasil-pintura__arte');
  const fallback = artwork?.querySelector('img');

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const between = (value, start, end) => clamp((value - start) / (end - start));
  const smooth = (value) => value * value * (3 - 2 * value);

  // O deslocamento usa toda a seção; novas divs não reiniciam nem cortam a imagem.
  function initializeBackground() {
    if (!scene.querySelector('.brasil-pintura__fundo')) return;
    let frame = 0;
    let visible = true;
    let needsMeasure = true;
    let top = 0;
    let height = 1;
    let viewport = 1;

    function render() {
      frame = 0;
      if (needsMeasure) {
        top = scene.getBoundingClientRect().top + window.scrollY;
        height = scene.offsetHeight;
        viewport = window.innerHeight;
        needsMeasure = false;
      }
      const progress = clamp((window.scrollY - top + viewport) / (height + viewport));
      const travel = Math.min(72, viewport * 0.075);
      const offset = motion.matches ? 0 : (1 - 2 * progress) * travel;
      scene.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
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
    motion.addEventListener('change', updateMotion);
    if ('ResizeObserver' in window) {
      const resize = new ResizeObserver(() => schedule(true));
      resize.observe(scene);
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

      let frame = 0;
      let visible = true;
      let needsMeasure = true;
      let sceneTop = 0;
      let distance = 1;
      let lastProgress = -1;

      const variable = (name, value) => scene.style.setProperty(name, value);

      function paint(progress) {
        const reduced = motion.matches;
        const drawing = reduced ? 1 : between(progress, 0.28, 0.86);
        const retreat = smooth(between(progress, 0.35, 0.57));

        variable('--scene-progress', progress.toFixed(4));
        variable('--paper-opacity', smooth(between(progress, 0.08, 0.40)).toFixed(4));
        variable('--text-paint', smooth(between(progress, 0.07, 0.32)).toFixed(4));
        variable('--title-opacity', reduced ? '1' : (1 - retreat).toFixed(4));
        variable('--title-y', `${reduced ? 0 : -32 * retreat}px`);
        variable('--title-scale', reduced ? '1' : (1 - 0.04 * retreat).toFixed(4));
        variable('--art-opacity', reduced ? '1' : smooth(between(progress, 0.24, 0.36)).toFixed(4));
        variable('--art-scale', reduced ? '1' : (0.94 + 0.06 * smooth(between(progress, 0.25, 0.8))).toFixed(4));
        variable('--art-y', `${reduced ? 0 : 18 - 30 * progress}px`);
        variable('--final-opacity', reduced ? '0' : smooth(between(progress, 0.76, 0.92)).toFixed(4));

        strokes.forEach(({ element, start, end, opacity }) => {
          const amount = smooth(between(drawing, start, end));
          element.style.strokeDashoffset = (1 - amount).toFixed(4);
          // Evita que a ponta quadrada do pincel apareça antes do primeiro gesto.
          element.style.opacity = (opacity * between(amount, 0, 0.025)).toFixed(4);
        });
        reveals.forEach(({ element, start, end, opacity }) => {
          element.style.opacity = (opacity * smooth(between(drawing, start, end))).toFixed(4);
        });
        layers.forEach(({ element, depth: layerDepth, transform }) => {
          const drift = reduced ? 0 : (progress - 0.5) * 12 * layerDepth;
          element.setAttribute('transform', `${transform} translate(${drift * 0.3} ${drift})`.trim());
        });
      }

      function render() {
        frame = 0;
        if (needsMeasure) {
          sceneTop = sequence.getBoundingClientRect().top + window.scrollY;
          distance = Math.max(1, sequence.offsetHeight - stage.offsetHeight);
          needsMeasure = false;
        }
        const progress = motion.matches ? 1 : clamp((window.scrollY - sceneTop) / distance);
        if (progress !== lastProgress) {
          paint(progress);
          lastProgress = progress;
        }
      }

      function schedule(measure = false) {
        needsMeasure ||= measure;
        if (!frame && (visible || measure)) frame = requestAnimationFrame(render);
      }

      function updateMotion() {
        scene.classList.toggle('is-reduced-motion', motion.matches);
        lastProgress = -1;
        schedule(true);
      }

      scene.classList.add('is-ready');
      scene.classList.toggle('is-reduced-motion', motion.matches);
      render();

      window.addEventListener('scroll', () => schedule(), { passive: true });
      window.addEventListener('resize', () => schedule(true), { passive: true });
      motion.addEventListener('change', updateMotion);

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
