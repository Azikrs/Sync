/* Montagem em perspectiva, ligada ao scroll. Imagens, texto e ficha mantêm camadas próprias. */
(() => {
  'use strict';
  const section = document.querySelector('.paisagens-galeria');
  const data = window.AfloraPaisagensDados;
  if (!section || !Array.isArray(data) || !data.length) return;
  const stage = section.querySelector('.paisagens-palco');
  const grid = section.querySelector('.paisagens-grade');
  const title = section.querySelector('#paisagens-titulo');
  const panel = section.querySelector('.paisagens-ficha');
  const closeButton = panel.querySelector('.paisagens-ficha__fechar');
  const action = panel.querySelector('.paisagens-ficha__acao');
  const hint = section.querySelector('[data-convite-paisagens]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const touch = matchMedia('(pointer: coarse)');
  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
  let reduced = motion.matches, coarse = touch.matches;
  let top = 0, distance = 1, progress = 0, target = 0, painted = -1;
  let visible = false, frame = 0, previous = 0, lens = null, measuredWidth = 0;
  let active = -1, pinned = false, keyboard = false, ignoreFocus = false, suppressHover = false, source = '';
  let hoverTimer = 0, closeTimer = 0, hideTimer = 0, openVersion = 0, inkReady = false, photosLoaded = false;
  let panelAnchor = null, contentAnimation = null, outgoingContent = null;
  const pointer = { x: 0, y: 0, active: false };
  const depth = [2450, 1750, 2140, 1030, 920, 1690, 1300, 740, 2220, 1580, 1970, 1180];
  const offsets = [.13, .07, .10, .02, .01, .04, .055, 0, .12, .085, .11, .035];
  const credit = document.createElement('p');
  credit.className = 'paisagens-ficha__credito';
  panel.querySelector('.paisagens-ficha__conteudo').append(credit);
  panel.querySelector('.paisagens-ficha__nome').id = 'paisagens-ficha-nome';
  panel.querySelector('.paisagens-ficha__descricao').id = 'paisagens-ficha-descricao';
  panel.setAttribute('aria-labelledby', 'paisagens-ficha-nome');
  const navigation = document.createElement('nav');
  navigation.className = 'paisagens-ficha__navegacao';
  navigation.setAttribute('aria-label', 'Explorar outras paisagens');
  const previousButton = document.createElement('button'), nextButton = document.createElement('button'), counter = document.createElement('span');
  previousButton.type = nextButton.type = 'button';
  previousButton.textContent = '←'; nextButton.textContent = '→';
  previousButton.setAttribute('aria-label', 'Paisagem anterior'); nextButton.setAttribute('aria-label', 'Próxima paisagem');
  navigation.append(previousButton, counter, nextButton);
  action.after(navigation);

  const cards = data.slice(0, 12).map((item, index) => {
    const card = document.createElement('article');
    card.className = 'paisagens-cartao';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'paisagens-foto';
    button.setAttribute('aria-label', `Conhecer ${item.nome}, ${item.regiao}`);
    button.setAttribute('aria-controls', 'paisagens-ficha');
    button.setAttribute('aria-expanded', 'false');
    const image = document.createElement('img');
    image.width = image.height = 720;
    image.alt = item.alt;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => button.classList.add('is-sem-imagem'));
    button.append(image); card.append(button); grid.append(card);
    button.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || coarse || suppressHover) return;
      clearTimeout(hoverTimer); clearTimeout(closeTimer);
      pointer.x = event.clientX; pointer.y = event.clientY; pointer.active = true;
      hoverTimer = setTimeout(() => open(index, 'hover'), active >= 0 ? 90 : 140);
    });
    button.addEventListener('pointerleave', () => {
      clearTimeout(hoverTimer);
      if (!pinned && source === 'hover') queueClose();
    });
    button.addEventListener('focus', () => {
      if (ignoreFocus) { ignoreFocus = false; return; }
      if (!keyboard) return;
      settleForKeyboard();
      open(index, 'keyboard');
    });
    button.addEventListener('click', () => {
      if (keyboard && active === index && !panel.hidden) { closeButton.focus({ preventScroll: true }); return; }
      if (active === index && pinned) { suppressHover = true; close(); return; }
      open(index, coarse ? 'touch' : keyboard ? 'keyboard' : 'mouse');
      if (keyboard) closeButton.focus({ preventScroll: true });
    });
    return { card, button, image, item, index };
  });
  section.classList.add('is-galeria-pronta');

  function updateLens() {
    if (active < 0) { lens?.setFocus(null); lens?.setPointer(pointer.x, pointer.y, false); return; }
    if (source === 'hover' || source === 'mouse') {
      lens?.setFocus(null); lens?.setPointer(pointer.x, pointer.y, true);
    } else {
      lens?.setPointer(pointer.x, pointer.y, false);
      lens?.setFocus(cards[active].button.getBoundingClientRect());
    }
  }
  function browse(direction) {
    if (active < 0) return;
    open((active + direction + cards.length) % cards.length, coarse ? 'touch' : 'browse');
  }
  previousButton.addEventListener('click', () => browse(-1));
  nextButton.addEventListener('click', () => browse(1));

  function loadPhotos() {
    if (photosLoaded) return;
    photosLoaded = true;
    cards.forEach(({ image, item }) => { image.src = item.imagem; });
  }
  function setProgress() {
    // Fontes e pinagens anteriores podem deslocar a seção depois da primeira medida.
    top = section.getBoundingClientRect().top + window.scrollY;
    target = reduced ? 1 : clamp((window.scrollY - top) / distance);
    schedule();
  }
  function measure() {
    close();
    const rect = section.getBoundingClientRect();
    top = rect.top + window.scrollY;
    distance = Math.max(1, section.offsetHeight - stage.offsetHeight);
    measuredWidth = stage.clientWidth;
    grid.style.perspective = `${Math.round(Math.max(700, measuredWidth * .68))}px`;
    lens?.resize();
    painted = -1;
    target = reduced ? 1 : clamp((window.scrollY - top) / distance);
    progress = target;
    drawCards(); schedule();
  }
  function drawCards() {
    if (painted === progress) return;
    painted = progress;
    const columns = measuredWidth <= 700 ? 3 : 4;
    const rows = Math.ceil(cards.length / columns);
    cards.forEach(({ card, button, index }) => {
      const stagger = offsets[index];
      const t = reduced ? 1 : clamp((progress / .76 - stagger) / (1 - stagger));
      const eased = 1 - Math.pow(1 - t, 4);
      const remaining = 1 - eased;
      const column = index % columns - (columns - 1) / 2;
      const row = Math.floor(index / columns) - (rows - 1) / 2;
      const ry = column * 54 + (index % 3 - 1) * 8;
      const rx = -row * 34 + (index % 2 ? 5 : -5);
      const rz = (index % 3 - 1) * 8;
      card.style.opacity = smooth(t * 4.2).toFixed(4);
      card.style.transform = reduced || t === 1 ? 'none' :
        `translate3d(0,0,${(-depth[index] * remaining).toFixed(2)}px) rotateY(${(ry * remaining).toFixed(3)}deg) rotateX(${(rx * remaining).toFixed(3)}deg) rotateZ(${(rz * remaining).toFixed(3)}deg) scale(${(.4 + .6 * eased).toFixed(5)})`;
      button.style.pointerEvents = t < .2 ? 'none' : '';
    });
    const text = progress > .65 ? (coarse ? 'Toque em uma paisagem' : 'Passe o cursor. Descubra um lugar.') : 'Role para revelar';
    if (hint.textContent !== text) hint.textContent = text;
    if (active >= 0) {
      positionPanel();
      updateLens();
    }
  }
  function render(now) {
    frame = 0;
    if (!visible || document.hidden) { previous = 0; return; }
    const dt = previous ? Math.min(.08, (now - previous) / 1000) : 1 / 60;
    previous = now;
    progress += (target - progress) * (reduced ? 1 : 1 - Math.exp(-dt * 7));
    if (Math.abs(target - progress) < .00008) progress = target;
    drawCards();
    lens?.tick(dt);
    if (progress !== target || lens?.needsFrame()) schedule(); else previous = 0;
  }
  function schedule() {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render);
  }
  function settleForKeyboard() {
    if (reduced || target >= .78) return;
    window.scrollTo({ top: top + distance * .82, behavior: 'instant' });
    progress = target = .82;
    drawCards();
  }
  function positionPanel() {
    if (active < 0 || panel.hidden) return;
    const rect = cards[active].button.getBoundingClientRect(), bounds = stage.getBoundingClientRect();
    const safeTop = Math.max(10, (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 68) + 12 - bounds.top);
    const viewportHeight = window.visualViewport?.height || innerHeight;
    const safeBottom = Math.min(bounds.height - 12, viewportHeight - bounds.top - 12);
    panel.style.setProperty('--ficha-espaco', `${Math.max(100, safeBottom - safeTop)}px`);
    const w = panel.offsetWidth, h = panel.offsetHeight;
    let x, y;
    if (panelAnchor) {
      x = panelAnchor.x; y = panelAnchor.y;
    } else if (coarse || measuredWidth <= 700) {
      x = (bounds.width - w) / 2;
      const below = rect.bottom - bounds.top + 10;
      y = below + h < safeBottom ? below : rect.top - bounds.top - h - 10;
    } else {
      const right = rect.right - bounds.left + 16;
      x = right + w <= bounds.width - 12 ? right : rect.left - bounds.left - w - 16;
      y = rect.top - bounds.top + (rect.height - h) / 2;
    }
    panel.style.left = `${clamp(x, 12, Math.max(12, bounds.width - w - 12))}px`;
    panel.style.top = `${clamp(y, safeTop, Math.max(safeTop, safeBottom - h))}px`;
    if (!panelAnchor) panelAnchor = { x: parseFloat(panel.style.left), y: parseFloat(panel.style.top) };
  }
  function prepareInk() {
    if (inkReady) return;
    inkReady = true;
    // Borda arredondada, levemente ondulada e com absorção nas extremidades.
    // Só a tinta recebe a máscara; letras e controles continuam nítidos.
    const edge = document.createElement('canvas'); edge.width = edge.height = 480;
    const edgeContext = edge.getContext('2d');
    if (edgeContext) {
      const points = Array.from({ length: 128 }, (_, i) => {
        const angle = i / 128 * Math.PI * 2, c = Math.cos(angle), s = Math.sin(angle);
        const ripple = Math.sin(angle * 11 + .4) * 1.7 + Math.cos(angle * 17) * 1.1;
        return [240 + Math.sign(c) * Math.pow(Math.abs(c), .22) * (226 + ripple), 240 + Math.sign(s) * Math.pow(Math.abs(s), .22) * (226 + ripple)];
      });
      edgeContext.beginPath();
      const last = points[points.length - 1];
      edgeContext.moveTo((last[0] + points[0][0]) / 2, (last[1] + points[0][1]) / 2);
      points.forEach((point, i) => { const next = points[(i + 1) % points.length]; edgeContext.quadraticCurveTo(...point, (point[0] + next[0]) / 2, (point[1] + next[1]) / 2); });
      edgeContext.closePath(); edgeContext.filter = 'blur(2.4px)'; edgeContext.fillStyle = '#fff'; edgeContext.fill();
      panel.style.setProperty('--ficha-pigmento', `url("${edge.toDataURL()}")`);
    }
    panel.querySelector('.paisagens-ficha__tinta > path[fill]')?.setAttribute('d', 'M0 0H360V360H0Z');
    // Cerdas independentes, com pressão e pequenas falhas, como na pintura de Brasis.
    // Os trajetos são construídos uma vez; somente o traço SVG se revela ao abrir.
    let seed = 83;
    const random = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
    const strokes = [
      { name: 'azul', points: [[-35, 113], [74, 43], [205, 170], [391, 73]], width: 137, count: 65, delay: 0 },
      { name: 'verde', points: [[392, 238], [251, 160], [70, 300], [-31, 221]], width: 142, count: 65, delay: 95 },
      { name: 'ouro', points: [[14, 350], [123, 332], [227, 358], [345, 338]], width: 8, count: 12, delay: 250 },
    ];
    strokes.forEach(({ name, points: [a, b, c, d], width, count, delay }) => {
      const svg = panel.querySelector('.paisagens-ficha__tinta');
      if (!svg) return;
      let group = svg.querySelector(`g[data-cerdas="${name}"]`);
      if (!group) {
        // Aceita também o SVG inicial: a pintura é mantida em um único lugar.
        group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', `paisagens-ficha__gesto paisagens-ficha__gesto--${name}`);
        group.dataset.cerdas = name;
        const original = svg.querySelector(`.paisagens-ficha__gesto--${name}`);
        if (original) original.replaceWith(group);
        else svg.insertBefore(group, svg.querySelector('.paisagens-ficha__risco'));
      }
      for (let i = 0; i < count; i++) {
        const offset = (i / (count - 1) - .5) * width;
        const phase = random() * Math.PI * 2, lag = random() * .035;
        const dry = random() > .58;
        let path = '', connected = false;
        for (let step = 0; step <= 80; step++) {
          const t = clamp(step / 80 - lag), u = 1 - t;
          if (dry && Math.sin(t * 83 + phase) > .84) { connected = false; continue; }
          const x = u ** 3 * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t ** 3 * d[0];
          const y = u ** 3 * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t ** 3 * d[1];
          const dx = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0]);
          const dy = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1]);
          const length = Math.hypot(dx, dy) || 1;
          const pressure = offset * (.64 + .36 * Math.sin(t * Math.PI)) + Math.sin(t * 24 + phase) * .6;
          path += `${connected ? 'L' : 'M'}${(x - dy / length * pressure).toFixed(1)} ${(y + dx / length * pressure).toFixed(1)}`;
          connected = true;
        }
        const bristle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        bristle.setAttribute('d', path);
        bristle.setAttribute('class', 'paisagens-ficha__cerda');
        bristle.setAttribute('pathLength', '100');
        bristle.setAttribute('stroke-width', (.6 + random() * (name === 'ouro' ? .85 : 2.4)).toFixed(2));
        bristle.setAttribute('opacity', (.35 + random() * .6).toFixed(2));
        bristle.style.setProperty('--cerda-atraso', `${Math.round(delay + random() * 75)}ms`);
        group.append(bristle);
      }
    });
  }
  function open(index, mode) {
    clearTimeout(hoverTimer);
    clearTimeout(closeTimer); clearTimeout(hideTimer);
    if (active === index && !panel.hidden) {
      source = mode; pinned = mode === 'touch' || mode === 'keyboard' || (mode === 'browse' && keyboard); updateLens(); schedule();
      return;
    }
    const wasOpen = active >= 0 && !panel.hidden;
    outgoingContent?.remove(); outgoingContent = null;
    const content = panel.querySelector('.paisagens-ficha__conteudo');
    if (wasOpen && !reduced) {
      outgoingContent = content.cloneNode(true);
      outgoingContent.inert = true; outgoingContent.setAttribute('aria-hidden', 'true');
      outgoingContent.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
      Object.assign(outgoingContent.style, { position: 'absolute', left: `${content.offsetLeft}px`, top: `${content.offsetTop}px`, width: `${content.offsetWidth}px`, pointerEvents: 'none' });
    }
    if (active >= 0) { cards[active].button.setAttribute('aria-expanded', 'false'); cards[active].button.removeAttribute('aria-describedby'); }
    active = index; source = mode; pinned = mode === 'touch' || mode === 'keyboard' || (mode === 'browse' && keyboard);
    const { item, button } = cards[index];
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-describedby', 'paisagens-ficha-descricao');
    panel.querySelector('.paisagens-ficha__nome').textContent = item.nome;
    panel.querySelector('.paisagens-ficha__regiao').textContent = item.regiao;
    panel.querySelector('.paisagens-ficha__descricao').textContent = item.descricao;
    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    action.replaceChildren();
    const link = document.createElement(item.href ? 'a' : 'button');
    link.className = 'paisagens-ficha__ir';
    link.append(document.createTextNode('Quero ir'));
    const arrow = document.createElement('span'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true'); link.append(arrow);
    if (item.href) link.href = item.href;
    else { link.type = 'button'; link.disabled = true; }
    action.append(link);
    credit.replaceChildren();
    if (item.credito && item.fonte) {
      const author = document.createElement('a');
      author.href = item.fonte; author.target = '_blank'; author.rel = 'noopener noreferrer'; author.textContent = `Foto: ${item.credito}`;
      const license = document.createElement('a');
      license.href = item.licencaUrl; license.target = '_blank'; license.rel = 'noopener noreferrer'; license.textContent = item.licenca;
      credit.append(author, document.createTextNode(' · '), license);
    }
    prepareInk();
    panel.hidden = false; panel.inert = false;
    if (!wasOpen) panel.classList.remove('is-aberta');
    positionPanel();
    const version = ++openVersion;
    requestAnimationFrame(() => { if (version === openVersion && active === index) { panel.classList.add('is-aberta'); positionPanel(); } });
    contentAnimation?.cancel();
    if (wasOpen && !reduced) {
      const old = outgoingContent;
      panel.append(old);
      old.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-4px)' }], { duration: 170, easing: 'ease-out', fill: 'forwards' }).finished.then(() => old.remove()).catch(() => old.remove());
      contentAnimation = content.animate([
        { opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 300, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }
    updateLens();
    schedule();
  }
  function queueClose() { clearTimeout(closeTimer); closeTimer = setTimeout(() => close(), 320); }
  function close(restore = false) {
    clearTimeout(hoverTimer);
    clearTimeout(closeTimer); clearTimeout(hideTimer); openVersion++;
    const index = active;
    if (index >= 0) { cards[index].button.setAttribute('aria-expanded', 'false'); cards[index].button.removeAttribute('aria-describedby'); }
    active = -1; pinned = false; source = ''; panelAnchor = null;
    contentAnimation?.cancel();
    outgoingContent?.remove(); outgoingContent = null;
    panel.classList.remove('is-aberta'); panel.inert = true;
    hideTimer = setTimeout(() => { if (active < 0) panel.hidden = true; }, reduced ? 0 : 260);
    updateLens(); schedule();
    if (restore && index >= 0 && document.activeElement !== cards[index].button) {
      ignoreFocus = true;
      cards[index].button.focus({ preventScroll: true });
      ignoreFocus = false;
    }
  }
  function syncMotion() {
    reduced = motion.matches; coarse = touch.matches;
    close();
    section.classList.toggle('is-reduzido', reduced);
    lens?.destroy(); lens = null;
    if (!reduced) lens = window.AfloraLentePaisagens?.create({ stage, title }) || null;
    measure();
  }
  panel.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  panel.addEventListener('pointerleave', () => { if (!pinned) queueClose(); });
  closeButton.addEventListener('click', () => { suppressHover = true; close(keyboard); });
  stage.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || coarse) return;
    if (suppressHover && (event.movementX || event.movementY)) {
      suppressHover = false;
      const index = cards.findIndex(({ button }) => button.contains(event.target));
      if (index >= 0) { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => open(index, 'hover'), 140); }
    }
    if (active >= 0 && cards[active].button.contains(event.target)) {
      pointer.x = event.clientX; pointer.y = event.clientY; pointer.active = true;
      updateLens(); schedule();
    }
  }, { passive: true });
  stage.addEventListener('pointerleave', () => {
    pointer.active = false; lens?.setPointer(pointer.x, pointer.y, false);
    if (!pinned) queueClose(); schedule();
  });
  document.addEventListener('pointerdown', event => {
    keyboard = false;
    if (active >= 0 && !panel.contains(event.target) && !cards[active].button.contains(event.target)) close();
  }, { passive: true });
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab') { keyboard = true; suppressHover = true; }
    if (event.key === 'Escape' && active >= 0) { event.preventDefault(); suppressHover = true; close(true); }
    if (active >= 0 && section.contains(document.activeElement) && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault(); suppressHover = true;
      const photoFocused = cards.some(({ button }) => button === document.activeElement);
      browse(event.key === 'ArrowLeft' ? -1 : 1);
      if (photoFocused) { ignoreFocus = true; cards[active].button.focus({ preventScroll: true }); ignoreFocus = false; }
    }
  });
  section.addEventListener('focusout', event => {
    if (!section.contains(event.relatedTarget)) close();
  });
  window.addEventListener('scroll', () => {
    setProgress();
    if (active >= 0) { positionPanel(); updateLens(); }
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame); frame = previous = 0;
    pointer.active = false; lens?.setPointer(pointer.x, pointer.y, false); close(); schedule();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    section.classList.toggle('is-em-cena', visible);
    if (visible) { loadPhotos(); setProgress(); }
    else { cancelAnimationFrame(frame); frame = previous = 0; pointer.active = false; lens?.setPointer(pointer.x, pointer.y, false); close(); }
  }).observe(stage);
  const preloader = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { loadPhotos(); preloader.disconnect(); } }, { rootMargin: '110% 0px' });
  preloader.observe(section);
  new ResizeObserver(measure).observe(stage);
  new ResizeObserver(() => { lens?.resize(); schedule(); }).observe(title);
  motion.addEventListener('change', syncMotion); touch.addEventListener('change', syncMotion);
  document.fonts?.ready.then(() => { lens?.resize(); if (active >= 0) positionPanel(); schedule(); });
  // Caveat só é solicitada ao mostrar a primeira ficha; reposiciona após a troca de fonte.
  document.fonts?.addEventListener('loadingdone', () => { if (active >= 0) positionPanel(); });
  syncMotion();
})();
