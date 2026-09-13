(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reveals = new Set();
  const rises = new Set();
  const visibleRises = new Set();
  const paintings = new Map();
  const clamp = value => Math.max(0, Math.min(1, value));
  let frame = 0;
  let needsMeasure = true;

  function position(element) {
    if (getComputedStyle(element).position === 'static') {
      element.classList.add('efeito-texto-posicionado');
    }
  }

  function finish(element) {
    element.classList.remove('revelar-preparado', 'revelar-ativo');
    element.classList.add('revelar-concluido');
  }

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (motion.matches) return;
      if (isIntersecting) {
        if (!target.classList.contains('revelar-concluido')) target.classList.add('revelar-ativo');
      } else if (target.hasAttribute('data-revelar-repetir')) {
        target.classList.remove('revelar-ativo', 'revelar-concluido');
        target.classList.add('revelar-preparado');
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 }) : null;

  function finishRise(element) {
    element.classList.remove('surgir-preparado', 'surgir-ativo');
    element.classList.add('surgir-concluido');
  }

  const riseObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (motion.matches) return;
      if (isIntersecting) {
        visibleRises.add(target);
      } else {
        visibleRises.delete(target);
        // Uma passagem rápida não consome a entrada enquanto o texto está fora da tela.
        if (!target.classList.contains('surgir-concluido') || target.hasAttribute('data-surgir-repetir')) {
          target.classList.remove('surgir-ativo', 'surgir-concluido');
          target.classList.add('surgir-preparado');
        }
      }
    });
    schedule();
  }, { threshold: 0 }) : null;

  function revealVisibleRises() {
    if (motion.matches) return;
    const viewport = window.innerHeight;
    const atEnd = window.scrollY + viewport >= document.documentElement.scrollHeight - 2;
    visibleRises.forEach(element => {
      if (element.classList.contains('surgir-concluido') || element.classList.contains('surgir-ativo')) return;
      const rect = element.getBoundingClientRect();
      const css = getComputedStyle(element);
      const configured = Number.parseFloat(css.getPropertyValue('--surgir-inicio'));
      const trigger = Number.isFinite(configured) ? Math.min(100, Math.max(10, configured)) / 100 : 0.72;
      const displacement = Number.parseFloat(css.translate.split(' ')[1]) || 0;
      const top = rect.top - displacement;
      // No fim da página, o conteúdo visível também entra, mesmo sem mais espaço para rolar.
      if (rect.bottom > 0 && rect.top < viewport && (top <= viewport * trigger || atEnd)) {
        element.classList.add('surgir-ativo');
      }
    });
  }

  function initialize(root = document) {
    root.querySelectorAll('[data-surgir]').forEach(element => {
      if (rises.has(element)) return;
      rises.add(element);
      if (!riseObserver || motion.matches) {
        finishRise(element);
        return;
      }
      if (getComputedStyle(element).display === 'inline') element.classList.add('revelar-em-linha');
      element.classList.add('surgir-preparado');
      element.addEventListener('animationend', event => {
        if (event.target === element && event.animationName === 'texto-surgir') finishRise(element);
      });
      element.addEventListener('focusin', () => finishRise(element));
      riseObserver.observe(element);
    });

    root.querySelectorAll('[data-revelar]').forEach(element => {
      if (reveals.has(element)) return;
      reveals.add(element);
      if (!observer || motion.matches) {
        finish(element);
        return;
      }
      position(element);
      if (getComputedStyle(element).display === 'inline') element.classList.add('revelar-em-linha');
      element.classList.add('revelar-preparado');
      element.addEventListener('animationend', event => {
        if (event.target === element && event.animationName === 'revelar-abertura') finish(element);
      });
      observer.observe(element);
    });

    root.querySelectorAll('[data-pintar-brasil]').forEach(element => {
      if (paintings.has(element)) return;
      position(element);
      // Use em cada linha simples de texto; não substituímos o HTML original.
      const ink = document.createElement('span');
      ink.className = 'texto-brasil__tinta';
      ink.setAttribute('aria-hidden', 'true');
      ink.textContent = element.textContent;
      element.append(ink);
      element.classList.add('texto-brasil');
      paintings.set(element, { start: 0, end: 1, progress: -1 });
    });
    schedule(true);
  }

  function render() {
    frame = 0;
    revealVisibleRises();
    const scroll = window.scrollY;
    if (needsMeasure) {
      const viewport = window.innerHeight;
      const lastScroll = Math.max(0, document.documentElement.scrollHeight - viewport);
      paintings.forEach((state, element) => {
        const top = element.getBoundingClientRect().top + scroll;
        state.end = Math.max(0, Math.min(top - viewport * 0.22, lastScroll));
        state.start = Math.min(top - viewport * 0.9, state.end - Math.max(120, viewport * 0.38));
      });
      needsMeasure = false;
    }
    paintings.forEach((state, element) => {
      const amount = motion.matches ? 1 : clamp((scroll - state.start) / Math.max(1, state.end - state.start));
      const progress = Number((amount * amount * (3 - 2 * amount)).toFixed(4));
      if (progress !== state.progress) {
        element.style.setProperty('--pintura-progresso', progress);
        state.progress = progress;
      }
    });
  }

  function schedule(measure = false) {
    needsMeasure ||= measure;
    if (!frame && (paintings.size || visibleRises.size)) frame = requestAnimationFrame(render);
  }

  motion.addEventListener('change', () => {
    if (motion.matches) {
      reveals.forEach(finish);
      rises.forEach(finishRise);
    }
    schedule(true);
  });
  window.addEventListener('scroll', () => schedule(), { passive: true });
  window.addEventListener('resize', () => schedule(true), { passive: true });
  window.addEventListener('pageshow', () => schedule(true));
  if ('ResizeObserver' in window) new ResizeObserver(() => schedule(true)).observe(document.body);
  document.fonts?.ready.then(() => schedule(true));

  // Chame depois de inserir novos textos via JavaScript. Chamadas repetidas são seguras.
  window.EfeitosTexto = { atualizar: initialize };
  initialize();
})();
