(() => {
    'use strict';

    const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

    const listenToMediaQuery = (query, listener) => {
        if (typeof query.addEventListener === 'function') {
            query.addEventListener('change', listener);
        } else {
            query.addListener(listener);
        }
    };

    const initHeaderMenu = () => {
        const header = document.querySelector('[data-site-header]');

        if (!header) {
            return;
        }

        const toggle = header.querySelector('.header-menu-toggle');
        const navigation = header.querySelector('nav');
        const desktopQuery = window.matchMedia('(min-width: 56.001rem)');

        if (!toggle || !navigation) {
            return;
        }

        const setMenuState = (isOpen) => {
            header.classList.toggle('menu-aberto', isOpen);
            toggle.setAttribute('aria-expanded', String(isOpen));
            toggle.setAttribute('aria-label', isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
        };

        toggle.addEventListener('click', () => {
            setMenuState(toggle.getAttribute('aria-expanded') !== 'true');
        });

        navigation.addEventListener('click', (event) => {
            if (event.target.closest('a')) {
                setMenuState(false);
            }
        });

        document.addEventListener('click', (event) => {
            if (!header.contains(event.target)) {
                setMenuState(false);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
                setMenuState(false);
                toggle.focus();
            }
        });

        listenToMediaQuery(desktopQuery, (event) => {
            if (event.matches) {
                setMenuState(false);
            }
        });
    };

    const initHeroParallax = () => {
        const hero = document.querySelector('[data-parallax-hero]');

        if (!hero) {
            return;
        }

        const layers = [
            {
                elements: [hero.querySelector('[data-parallax-layer="background"]')],
                mouseX: 4,
                mouseY: 3,
                scrollY: 0.14,
                scale: 1.04
            },
            {
                elements: [...hero.querySelectorAll('[data-parallax-layer="content"]')],
                mouseX: 8,
                mouseY: 6,
                scrollY: 0.09,
                scale: 1
            },
            {
                elements: [hero.querySelector('[data-parallax-layer="foreground"]')],
                mouseX: 18,
                mouseY: 12,
                scrollY: 0.18,
                scale: 1.025
            }
        ];

        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const finePointerQuery = window.matchMedia('(pointer: fine)');

        let targetPointerX = 0;
        let targetPointerY = 0;
        let currentPointerX = 0;
        let currentPointerY = 0;
        let targetScroll = 0;
        let currentScroll = 0;
        let animationFrame = null;
        let previousTime = performance.now();
        let isHeroVisible = true;
        let scrollStart = 0;
        let scrollEnd = 0;

        const pointerIntensity = () => {
            if (!finePointerQuery.matches || window.innerWidth < 768) {
                return 0;
            }

            return window.innerWidth <= 1024 ? 0.45 : 1;
        };

        const scrollIntensity = () => {
            if (window.innerWidth <= 640) {
                return 0.58;
            }

            return window.innerWidth <= 1024 ? 0.8 : 1;
        };

        const applyTransforms = () => {
            const mouseFactor = pointerIntensity();
            const scrollFactor = scrollIntensity();

            layers.forEach((layer) => {
                const x = currentPointerX * layer.mouseX * mouseFactor;
                const mouseY = currentPointerY * layer.mouseY * mouseFactor;
                const y = mouseY + (currentScroll * layer.scrollY * scrollFactor);

                layer.elements.forEach((element) => {
                    if (element) {
                        element.style.transform = `translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, 0) scale(${layer.scale})`;
                    }
                });
            });
        };

        const resetTransforms = () => {
            targetPointerX = 0;
            targetPointerY = 0;
            currentPointerX = 0;
            currentPointerY = 0;
            targetScroll = 0;
            currentScroll = 0;

            layers.forEach((layer) => {
                layer.elements.forEach((element) => {
                    if (element) {
                        element.style.transform = `translate3d(0, 0, 0) scale(${layer.scale})`;
                    }
                });
            });
        };

        const animate = (time) => {
            animationFrame = null;

            if (reducedMotionQuery.matches || !isHeroVisible || document.hidden) {
                return;
            }

            const elapsed = Math.min(time - previousTime, 64);
            const easing = 1 - Math.exp(-elapsed * 0.0065);
            previousTime = time;

            currentPointerX += (targetPointerX - currentPointerX) * easing;
            currentPointerY += (targetPointerY - currentPointerY) * easing;
            currentScroll += (targetScroll - currentScroll) * easing;

            applyTransforms();

            const isMoving =
                Math.abs(targetPointerX - currentPointerX) > 0.001 ||
                Math.abs(targetPointerY - currentPointerY) > 0.001 ||
                Math.abs(targetScroll - currentScroll) > 0.05;

            if (isMoving) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        const requestRender = () => {
            if (reducedMotionQuery.matches || !isHeroVisible || document.hidden || animationFrame !== null) {
                return;
            }

            previousTime = performance.now();
            animationFrame = requestAnimationFrame(animate);
        };

        const updateScrollTarget = () => {
            if (!isHeroVisible || reducedMotionQuery.matches) {
                return;
            }

            targetScroll = clamp(window.scrollY - scrollStart, 0, scrollEnd - scrollStart);
            requestRender();
        };

        const measureHero = () => {
            const bounds = hero.getBoundingClientRect();
            const documentTop = bounds.top + window.scrollY;

            scrollStart = Math.max(0, documentTop - window.innerHeight);
            scrollEnd = documentTop + bounds.height;
            updateScrollTarget();
        };

        hero.addEventListener('pointermove', (event) => {
            if (reducedMotionQuery.matches || pointerIntensity() === 0) {
                return;
            }

            const bounds = hero.getBoundingClientRect();
            targetPointerX = clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1);
            targetPointerY = clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1);
            requestRender();
        });

        hero.addEventListener('pointerleave', () => {
            targetPointerX = 0;
            targetPointerY = 0;
            requestRender();
        });

        window.addEventListener('scroll', updateScrollTarget, { passive: true });
        window.addEventListener('resize', measureHero);

        listenToMediaQuery(reducedMotionQuery, () => {
            if (animationFrame !== null) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }

            if (reducedMotionQuery.matches) {
                resetTransforms();
            } else {
                measureHero();
            }
        });

        listenToMediaQuery(finePointerQuery, () => {
            targetPointerX = 0;
            targetPointerY = 0;
            requestRender();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && animationFrame !== null) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            } else if (!document.hidden) {
                updateScrollTarget();
            }
        });

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(([entry]) => {
                isHeroVisible = entry.isIntersecting;

                if (!isHeroVisible && animationFrame !== null) {
                    cancelAnimationFrame(animationFrame);
                    animationFrame = null;
                } else if (isHeroVisible) {
                    updateScrollTarget();
                }
            });

            observer.observe(hero);
        }

        measureHero();
    };

    initHeaderMenu();
    initHeroParallax();
})();
