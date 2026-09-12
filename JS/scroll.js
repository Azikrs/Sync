(() => {
  const root = document.documentElement;
  const header = document.querySelector('.header-principal');

  if (header) {
    const measureHeader = () => {
      root.style.setProperty('--header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    };
    const updateHeader = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 20);
    };

    measureHeader();
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    if ('ResizeObserver' in window) {
      new ResizeObserver(measureHeader).observe(header);
    } else {
      window.addEventListener('resize', measureHeader, { passive: true });
    }
  }

  // O cabeçalho e o scroll nativo continuam funcionando sem a biblioteca.
  if (typeof window.Lenis !== 'function') return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  let lenis = null;

  const updateScrolling = () => {
    const shouldSmooth = !reducedMotion.matches && finePointer.matches;

    if (!shouldSmooth) {
      lenis?.destroy();
      lenis = null;
      return;
    }

    if (!lenis) {
      lenis = new window.Lenis({
        autoRaf: true,
        duration: 1.05,
        lerp: 0,
        smoothWheel: true,
        syncTouch: false,
        anchors: true,
      });
    }
  };

  reducedMotion.addEventListener('change', updateScrolling);
  finePointer.addEventListener('change', updateScrolling);
  updateScrolling();
})();
