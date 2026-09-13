(() => {
    'use strict';

    const header = document.querySelector('.header-principal');
    const toggle = header?.querySelector('.header-menu');
    const navigation = header?.querySelector('.header-nav');
    if (!header || !toggle || !navigation) return;

    const isCompact = () => getComputedStyle(header).getPropertyValue('--header-compacto').trim() === '1';
    let compact = isCompact();
    let open = false;

    function setOpen(next, restoreFocus = false) {
        open = compact && next;
        header.classList.toggle('menu-aberto', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        if (restoreFocus) toggle.focus({ preventScroll: true });
        navigation.inert = compact && !open;
        navigation.toggleAttribute('data-lenis-prevent', compact);
    }

    toggle.addEventListener('click', () => setOpen(!open));

    header.addEventListener('keydown', event => {
        if (event.key === 'Escape' && open) {
            event.preventDefault();
            setOpen(false, true);
        }
    });

    header.addEventListener('click', event => {
        if (event.target.closest('a') && open) setOpen(false, true);
    });

    document.addEventListener('pointerdown', event => {
        if (open && !header.contains(event.target)) setOpen(false);
    }, { passive: true });

    document.addEventListener('focusin', event => {
        if (open && !header.contains(event.target)) setOpen(false);
    });

    // A mudança de resolução não pode deixar os links do desktop desativados.
    function syncLayout() {
        const next = isCompact();
        if (next === compact) return;
        compact = next;
        const focusInNavigation = navigation.contains(document.activeElement);
        const focusOnToggle = document.activeElement === toggle;
        setOpen(false, compact && focusInNavigation);
        if (!compact && focusOnToggle) header.querySelector('.header-marca').focus({ preventScroll: true });
    }
    window.addEventListener('resize', syncLayout, { passive: true });

    // Âncoras são seções da mesma página. Só uma rota real muda a bolinha.
    function updateCurrentPage() {
        const normalize = pathname => pathname.replace(/\/index\.html?$/i, '/').replace(/\/+$/, '') || '/';
        const links = [...navigation.querySelectorAll('a[href]')];
        const current = links.find(link => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#')) return false;
            const url = new URL(href, document.baseURI);
            return url.origin === location.origin && normalize(url.pathname) === normalize(location.pathname);
        });
        links.forEach(link => {
            if (link === current) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    }

    // Trocar src/srcset basta: o recorte da tinta acompanha a imagem carregada.
    const logo = header.querySelector('.header-marca__imagem img');
    if (logo) {
        const ink = document.createElement('span');
        ink.className = 'header-marca__tinta';
        ink.setAttribute('aria-hidden', 'true');
        logo.after(ink);
        const clearMask = () => ink.style.removeProperty('--marca-mascara');
        const syncMask = () => {
            if (!logo.complete || !logo.naturalWidth) { clearMask(); return; }
            ink.style.setProperty('--marca-mascara', `url(${JSON.stringify(logo.currentSrc || logo.src)})`);
        };
        logo.addEventListener('load', syncMask);
        logo.addEventListener('error', clearMask);
        new MutationObserver(() => { clearMask(); syncMask(); })
            .observe(logo, { attributes: true, attributeFilter: ['src', 'srcset', 'sizes'] });
        syncMask();
    }

    window.addEventListener('popstate', updateCurrentPage);

    window.addEventListener('pageshow', () => setOpen(false));
    header.classList.add('menu-pronto');
    setOpen(false);
    updateCurrentPage();
})();
