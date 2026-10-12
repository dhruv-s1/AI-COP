export function createNavbar() {
    return `
        <nav class="navbar" id="main-navbar">
            <div class="nav-inner">
                <a href="#/" class="nav-brand" aria-label="Home">
                    AI<span class="brand-accent">Con</span>
                </a>

                <div class="nav-center">
                    <a href="#/" class="nav-link">Home</a>
                    <a href="#section-events-deck-section" class="nav-link">Events</a>
                    <a href="https://forms.cloud.microsoft/r/gxrsE4k10s" target="_blank" rel="noopener noreferrer" class="nav-link">Register</a>
                </div>

                <div class="nav-right">
                    <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">
                        <span class="knob" aria-hidden="true">🌙</span>
                    </button>
                    <a href="https://www.gemsoo-alquoz.com/" target="_blank" rel="noopener noreferrer" class="nav-logo-link" aria-label="GEMS OIS">
                    <img src="https://schoolfinder.ae/wp-content/uploads/listing-uploads/logo/2023/07/1577527730-54-gems-our-own-indian-school-al-quoz.png" alt="GEMS OIS" class="nav-school-logo" loading="eager" onerror="this.hidden=true; this.nextElementSibling.hidden=false;">
                    <span class="nav-school-fallback" hidden>GEMS<br>OIS</span>
                </a>

                </div>

                <button class="nav-hamburger" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav-drawer">
                    <span></span><span></span><span></span>
                </button>
            </div>

            <div class="nav-mobile-drawer" id="mobile-nav-drawer">
                <button class="nav-drawer-close" type="button" aria-label="Close menu">
                    <span></span><span></span>
                </button>
                <a href="#/" class="nav-link mobile-link">Home</a>
                <a href="#section-events-deck-section" class="nav-link mobile-link">Events</a>
                <a href="https://forms.cloud.microsoft/r/gxrsE4k10s" target="_blank" rel="noopener noreferrer" class="nav-link mobile-link">Register</a>
            </div>
        </nav>
    `;
}

export function initNavbar() {
    const navbar = document.getElementById('main-navbar');
    const hamburger = document.querySelector('.nav-hamburger');
    const drawer = document.querySelector('.nav-mobile-drawer');
    const drawerClose = document.querySelector('.nav-drawer-close');
    const links = document.querySelectorAll('.nav-link');

    // Scroll behavior disabled: navbar background/gradient should remain static.
    const onScroll = () => {};

    const toggleMenu = () => {
        const isOpen = !drawer?.classList.contains('open');
        hamburger?.classList.toggle('open', isOpen);
        drawer?.classList.toggle('open', isOpen);
        hamburger?.setAttribute('aria-expanded', String(isOpen));
    };

    const closeMenu = () => {
        hamburger?.classList.remove('open');
        drawer?.classList.remove('open');
        hamburger?.setAttribute('aria-expanded', 'false');
    };

    const setActive = () => {
        const hash = window.location.hash || '#/';
        const activeSection = window.__activeNavSection;
        links.forEach(l => {
            const href = l.getAttribute('href');
            const isSectionEvents = href === '#section-events-deck-section' || href === '#/events';
            let shouldActivate = false;

            if (activeSection === 'events') {
                shouldActivate = isSectionEvents;
            } else if (activeSection === 'register') {
                shouldActivate = false; // Register is now an external link
            } else if (activeSection === 'home') {
                shouldActivate = href === '#/';
            } else {
                shouldActivate = href === hash;
            }

            l.classList.toggle('active', shouldActivate);
        });
    };

    // Scroll-based background changes disabled to keep navbar color static
    hamburger?.addEventListener('click', toggleMenu);
    drawerClose?.addEventListener('click', closeMenu);
    const themeToggle = document.getElementById('theme-toggle');

    const SUN_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#FF9A00"/><circle cx="12" cy="12" r="4" fill="#FFFFFF"/><g stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="4" y1="4" x2="6.5" y2="6.5"/><line x1="17.5" y1="17.5" x2="20" y2="20"/><line x1="17.5" y1="6.5" x2="20" y2="4"/><line x1="6.5" y1="17.5" x2="4" y2="20"/></g></svg>';
    const MOON_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#0B2230"/><path d="M15.5 12.5a5 5 0 1 1-6-6 6.5 6.5 0 0 0 6 6z" fill="#FFFFFF"/></svg>';

    function updateThemeToggle() {
        const isLight = document.body.classList.contains('light-mode');
        if (!themeToggle) return;
        themeToggle.classList.toggle('is-light', isLight);
        const knob = themeToggle.querySelector('.knob');
        if (knob) knob.innerHTML = isLight ? SUN_SVG : MOON_SVG;
    }

    function toggleTheme() {
        const isLight = document.body.classList.toggle('light-mode');
        try { localStorage.setItem('site-theme', isLight ? 'light' : 'dark'); } catch (e) {}
        updateThemeToggle();
        window.dispatchEvent(new Event('themechange'));
        window.dispatchEvent(new Event('navstatechange'));
    }

    // Init from saved preference
    try {
        const saved = localStorage.getItem('site-theme');
        if (saved === 'light') document.body.classList.add('light-mode');
        else if (saved === 'dark') document.body.classList.remove('light-mode');
    } catch (e) {}
    updateThemeToggle();
    themeToggle?.addEventListener('click', toggleTheme);
    window.addEventListener('hashchange', setActive);
    window.addEventListener('navstatechange', setActive);

    links.forEach(l => l.addEventListener('click', () => {
        closeMenu();
    }));

    setActive();

    return () => {
        // no scroll listener to remove
        hamburger?.removeEventListener('click', toggleMenu);
        drawerClose?.removeEventListener('click', closeMenu);
        themeToggle?.removeEventListener('click', toggleTheme);
        window.removeEventListener('hashchange', setActive);
        window.removeEventListener('navstatechange', setActive);
    };
}
