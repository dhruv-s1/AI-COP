export function initScrollReveal() {
    const typingSelector = [
        '.section-subtitle',
        '.hero-subtitle',
        '.event-subtitle',
        '.page-hero p',
        '.animated-border p',
        '.hero-tagline',
        '.event-description'
    ].join(', ');

    const typingTargets = document.querySelectorAll(typingSelector);
    typingTargets.forEach((el) => {
        if (el.textContent && el.textContent.trim()) {
            el.classList.add('wipe-reveal');
        }
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-delay') || '0';
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, parseInt(delay, 10));

                if (entry.target.classList.contains('wipe-reveal')) {
                    entry.target.classList.add('revealed');
                }

                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15
    });

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach(el => observer.observe(el));

    const typingElements = document.querySelectorAll('.wipe-reveal');
    typingElements.forEach(el => observer.observe(el));

    const isInViewport = (element) => {
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        return rect.top < viewportHeight * 0.9 && rect.bottom > 0;
    };

    requestAnimationFrame(() => {
        typingElements.forEach((element) => {
            if (isInViewport(element)) {
                element.classList.add('revealed');
            }
        });
    });

    return () => {
        elements.forEach(el => observer.unobserve(el));
        typingElements.forEach(el => observer.unobserve(el));
        observer.disconnect();
    };
}

export function initStopMotion(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return () => {};

    const frames = Array.from(container.querySelectorAll('.stop-motion-frame'));
    if (frames.length === 0) return () => {};

    const handleScroll = () => {
        const rect = container.getBoundingClientRect();
        const containerTop = rect.top;
        const containerHeight = rect.height;
        const windowHeight = window.innerHeight;

        let progress = (windowHeight - containerTop) / (containerHeight + windowHeight);
        progress = Math.max(0, Math.min(1, progress));

        const frameIndex = Math.floor(progress * frames.length);
        const activeIndex = Math.min(frameIndex, frames.length - 1);

        frames.forEach((frame, idx) => {
            if (idx === activeIndex) {
                frame.style.opacity = '1';
                frame.style.pointerEvents = 'auto';
            } else {
                frame.style.opacity = '0';
                frame.style.pointerEvents = 'none';
            }
        });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
}

export function initParallax() {
    const layers = document.querySelectorAll('.parallax-layer');
    
    const handleScroll = () => {
        const scrolled = window.scrollY;
        layers.forEach(layer => {
            const speed = layer.getAttribute('data-speed') || '0.5';
            const yPos = -(scrolled * parseFloat(speed));
            layer.style.transform = `translateY(${yPos}px)`;
        });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
}
