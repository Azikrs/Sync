(() => {
  const scene = document.querySelector('.brasil-pintura');
  const destinations = [...document.querySelectorAll('[data-destino]')].map((element) => ({
    element,
    window: element.querySelector('.destino__janela'),
    content: element.querySelector('.destino__conteudo'),
    reveals: [...element.querySelectorAll('[data-destino-revelar]')].map((node) => ({ node, top: 0 })),
  })).filter((item) => item.window && item.content);
  if (!scene || !destinations.length) return;
  const lighting = scene.querySelector('.brasil-pintura__luz');
  const painting = scene.querySelector('.brasil-pintura__sequencia');
  const paintingStage = painting?.querySelector('.brasil-pintura__palco');

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const setting = (style, name, fallback) => {
    const value = Number.parseFloat(style.getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  };
  let frame = 0;
  let needsMeasure = true;

  function measure() {
    let handoff = null;
    if (paintingStage && (scene.classList.contains('is-ready') || scene.classList.contains('is-loading'))) {
      const top = painting.getBoundingClientRect().top + scrollY;
      const viewport = paintingStage.offsetHeight;
      const distance = Math.max(1, painting.offsetHeight - viewport);
      const release = viewport * clamp(setting(getComputedStyle(scene), '--bandeira-sopro', 0.9));
      const departureStart = top + distance * 0.88;
      const departureEnd = top + distance + release;
      const start = departureStart + (departureEnd - departureStart) * 0.72;
      handoff = {
        start,
        end: departureEnd + viewport * 0.08,
        sequenceEnd: top + painting.offsetHeight,
        overlap: Math.max(viewport, top + painting.offsetHeight - start + viewport * 0.05),
      };
    }
    destinations.forEach((item) => {
      const { element, content } = item;
      const style = getComputedStyle(element);
      item.viewport = item.window.clientHeight;
      item.height = content.offsetHeight;
      item.speed = clamp(setting(style, '--destino-texto-velocidade', 0.52), 0.25, 1);
      item.before = item.viewport * Math.max(0, setting(style, '--destino-vista-entrada', 0.55));
      item.after = item.viewport * Math.max(0, setting(style, '--destino-vista-saida', 0.55));
      item.handoff = element.dataset.destino === 'cristo' ? handoff : null;
      item.startY = item.handoff ? item.viewport * 0.32 : item.viewport;
      if (item.handoff) {
        item.before = handoff.end - (handoff.sequenceEnd - handoff.overlap);
      }
      element.style.setProperty('--destino-sobreposicao', `${item.handoff ? handoff.overlap : 0}px`);
      item.distance = (item.startY + item.height) / item.speed;
      element.style.setProperty('--destino-altura', `${Math.ceil(item.viewport + item.before + item.distance + item.after)}px`);
      item.reveals.forEach((reveal) => {
        let node = reveal.node;
        let offset = 0;
        while (node && node !== content) {
          offset += node.offsetTop;
          node = node.offsetParent;
        }
        reveal.top = offset;
      });
    });
    // Só lê as posições depois de reservar a altura de todos os capítulos.
    destinations.forEach((item) => { item.top = item.element.getBoundingClientRect().top + scrollY; });
    scene.dispatchEvent(new Event('destinos:medidos'));
  }

  function render() {
    frame = 0;
    if (motion.matches) return;
    if (needsMeasure) { measure(); needsMeasure = false; }
    let light = 0;
    let gesture = 0;
    let lightX = 65;
    destinations.forEach((item) => {
      const progress = clamp(scrollY - item.top - item.before, 0, item.distance);
      // O primeiro capítulo já ocupa a tela quando os últimos pigmentos se desfazem.
      const entrance = item.handoff
        ? smooth((scrollY - item.handoff.start) / (item.handoff.end - item.handoff.start)) : 1;
      const y = item.startY - progress * item.speed
        + (item.handoff ? (1 - entrance) * item.viewport * 0.07 : 0);
      item.element.style.setProperty('--destino-y', `${y.toFixed(2)}px`);
      item.reveals.forEach(({ node, top }) => {
        const reveal = entrance * smooth((item.viewport * 0.92 - y - top) / (item.viewport * 0.28));
        node.style.setProperty('--destino-revelacao', reveal.toFixed(4));
      });
      const shade = (item.handoff ? entrance : smooth((item.viewport - y) / (item.viewport * 0.48)))
        * smooth((item.height + y) / (item.viewport * 0.6));
      if (shade > light) {
        light = shade;
        gesture = progress / item.distance;
        lightX = item.element.classList.contains('destino--invertido') ? 35 : 65;
      }
    });
    lighting?.style.setProperty('--leitura-luz', light.toFixed(4));
    lighting?.style.setProperty('--leitura-x', `${lightX}%`);
    lighting?.style.setProperty('--leitura-y', `${75 - gesture * 50}%`);
    lighting?.style.setProperty('--leitura-gesto', gesture.toFixed(4));
  }

  function schedule(measureAgain = false) {
    needsMeasure ||= measureAgain;
    if (!frame && !motion.matches) frame = requestAnimationFrame(render);
  }

  function updateMotion() {
    destinations.forEach(({ element }) => element.classList.toggle('is-immersive', !motion.matches));
    if (motion.matches) {
      lighting?.style.setProperty('--leitura-luz', '0');
      scene.dispatchEvent(new Event('destinos:medidos'));
    } else {
      // Reserva o percurso antes de o navegador restaurar o scroll de uma recarga.
      needsMeasure = true;
      render();
    }
  }

  destinations.forEach((item) => {
    // O foco precisa alcançar os links mesmo quando estão fora da moldura fixa.
    item.element.addEventListener('focusin', (event) => {
      if (motion.matches || !item.distance) return;
      const rect = event.target.getBoundingClientRect();
      const header = document.querySelector('.header-principal')?.offsetHeight || 80;
      if (rect.top >= header + 56 && rect.bottom < item.viewport - 30) return;
      const reveal = item.reveals.find(({ node }) => node.contains(event.target));
      if (!reveal) return;
      const target = item.top + item.before + (item.startY - item.viewport * 0.48 + reveal.top) / item.speed;
      window.scrollTo({ top: target, behavior: 'instant' });
      render();
    });
  });

  // Enquanto o href for apenas '#', o convite não joga a pessoa de volta ao topo.
  document.querySelectorAll('.destino__link').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (link.getAttribute('href') === '#') event.preventDefault();
    });
  });

  window.addEventListener('scroll', () => schedule(), { passive: true });
  window.addEventListener('resize', () => schedule(true), { passive: true });
  window.addEventListener('pageshow', () => schedule(true));
  motion.addEventListener('change', updateMotion);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => schedule(true));
    destinations.forEach(({ content, window: viewport }) => { observer.observe(content); observer.observe(viewport); });
    const sequence = scene.querySelector('.brasil-pintura__sequencia');
    if (sequence) observer.observe(sequence);
    const intro = document.querySelector('.pagina-inicial-conteudo');
    if (intro) observer.observe(intro);
  }
  document.fonts?.ready.then(() => schedule(true));
  updateMotion();
})();
