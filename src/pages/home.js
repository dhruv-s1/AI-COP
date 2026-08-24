import { initParticles } from '../components/particles.js';
import { initScrollReveal } from '../components/scroll-animation.js';
import { initImageSequence } from '../components/image-sequence.js';
import { initHeroStage } from '../components/hero-stage.js';
import { initHeroCharacter } from '../components/hero-character.js';
import { initEyeBot } from '../components/eye-bot.js';
import { initRiveElement } from '../components/rive-player.js';
import { Application } from '@splinetool/runtime';

const EVENTS_PREVIEW = [
  { name: 'Panel Discussion',      color: '#F2F2F4', num: '01' },
  { name: 'Ethical Conference',    color: '#FF6600', num: '02' },
  { name: 'Hackathon',             color: '#A0A2A8', num: '03' },
  { name: 'AI vs Human',           color: '#FF4500', num: '04' },
  { name: 'Roundtable Conference', color: '#E5E5E7', num: '05' },
];

const BENTO_EVENTS = [
  {
    id: 1,
    name: 'Panel Discussion',
    accent: '#F2F2F4',
    imageClass: 'panel-discussion-card',
    darkImage: '/event-card-dark-mode/Panel discussion.png',
    lightImage: '/event-card-light-mode/Panel discussion.png',
  },
  {
    id: 2,
    name: 'Ethical Conference',
    accent: '#FF6600',
    darkImage: '/event-card-dark-mode/Ethical Con.png',
    lightImage: '/event-card-light-mode/Ethical Conferrence.png',
  },
  {
    id: 3,
    name: 'Hackathon',
    accent: '#F2F2F4',
    darkImage: '/event-card-dark-mode/Hackathon.png',
    lightImage: '/event-card-light-mode/Hackathon.png',
  },
  {
    id: 4,
    name: 'AI vs Human',
    accent: '#FF6600',
    darkImage: '/event-card-dark-mode/AI vs Human.png',
    lightImage: '/event-card-light-mode/AI vs Human.png',
  },
  {
    id: 5,
    name: 'Roundtable Conference',
    accent: '#F2F2F4',
    darkImage: '/event-card-dark-mode/Roundtable.png',
    lightImage: '/event-card-light-mode/Roundtable.png',
  },
].map((event, index) => ({
  ...event,
  cardOrder: String(index + 1).padStart(2, '0'),
}));

const NARRATIVE_FRAMES = [
  {
    img: '/frame1.jpg',
    counter: '01 / 04',
    heading: 'The World Is Changing.',
    body: 'Artificial Intelligence is no longer a concept from science fiction. It\'s here, it\'s accelerating, and it\'s reshaping every field — from medicine to art, from code to climate.',
  },
  {
    img: '/frame2.jpg',
    counter: '02 / 04',
    heading: 'Who Are We Becoming?',
    body: 'As AI grows more powerful, the defining question of our generation isn\'t whether machines can think — it\'s whether we remember what makes us irreplaceably human.',
  },
  {
    img: '/frame3.jpg',
    counter: '03 / 04',
    heading: 'AI COP Believes...',
    body: 'Technology should amplify human identity, not replace it. The best AI doesn\'t erase your creativity or voice — it turns up the volume on what makes you uniquely you.',
  },
  {
    img: '/frame4.jpg',
    counter: '04 / 04',
    heading: '5 Events. 1 Mission.',
    body: 'Five arenas. Five disciplines. One common thread: using AI as a tool for amplification, not automation. Choose your arena. Make your mark.',
  },
];

export function renderHome() {
  return `
    <div class="page-container">

      <!-- ── HERO ── -->
      <section class="hero" id="hero-section">
        <div class="hero-bg"></div>
        <a class="mobile-hero-school-logo" href="https://www.gemsoo-alquoz.com/" target="_blank" rel="noopener noreferrer" aria-label="GEMS OIS">
          <img src="https://schoolfinder.ae/wp-content/uploads/listing-uploads/logo/2023/07/1577527730-54-gems-our-own-indian-school-al-quoz.png" alt="GEMS OIS" loading="eager" onerror="this.hidden=true; this.nextElementSibling.hidden=false;" />
          <span hidden>GEMS<br />OIS</span>
        </a>
        <video id="hero-bg-video" autoplay loop muted playsinline src="/Darkmode_hero_bg.mp4"></video>
        <video id="hero-bg-video-light" autoplay loop muted playsinline src="/Lightmode_hero_bg.mp4"></video>
        <div class="hero-video-overlay"></div>
        <canvas id="hero-stage-canvas"></canvas>

        <video id="hero-character-video" style="display:none;" autoplay loop muted playsinline>
          <source src="/bg-less_video.webm" type="video/webm" />
          <source src="/bg-less_video.mp4" type="video/mp4" />
        </video>

        <div class="hero-content hero-content-eye-layout">
          <div class="hero-text-eye-container">
            <div class="hero-eye-stage">
              <h1 class="eye-title eye-title-left hero-title-clean">AI</h1>
              <h1 class="eye-title eye-title-right hero-title-clean">COP</h1>

              <div class="hero-eye-anchor" id="hero-eye-anchor"></div>
              <!-- Opaque Keyed Eye Canvas locked INSIDE hero-eye-stage with text -->
              <canvas id="hero-character-canvas"></canvas>
            </div>

            <div class="hero-cta hero-cta-eye">
              <a href="#/events" class="btn-neo-primary">Explore Events</a>
              <a href="#/register" class="btn-neo-outline">Register Now</a>
            </div>
          </div>
        </div>

        <!-- Scroll hint -->
        <div class="hero-scroll-hint">
          <div class="scroll-mouse"></div>
          <span>Scroll to explore</span>
        </div>
      </section>

      <!-- ── CINEMATIC IMAGE SEQUENCE ── -->
      <section class="image-sequence-section" id="image-sequence-section">
        <div class="image-sequence-sticky">
          <canvas id="sequence-canvas"></canvas>
          <div class="seq-loader" id="seq-loader">
            <div class="seq-loader-track">
              <div class="seq-loader-bar"></div>
            </div>
            <span class="seq-loader-text">Loading cinematic...</span>
          </div>
        </div>
      </section>

      <!-- ── VISION & MISSION ── -->
      <section class="vision-mission scroll-reveal">
        <div class="section-header text-center">
          <span class="eyebrow">Our Philosophy</span>
          <h2 class="section-title text-center">What We Stand For</h2>
        </div>
        <div class="vision-grid">
          <div class="glass-card glass-card-hover scroll-reveal" data-delay="0">
            <div id="rive-bg-1" class="rive-bg" aria-hidden="true"></div>
            <span class="icon">⚡</span>
            <h3>Amplify Identity</h3>
            <p>AI should enhance what makes each student unique — their voice, their creativity, their perspective — not homogenise them into prompt-fed outputs.</p>
          </div>
          <div class="glass-card glass-card-hover scroll-reveal" data-delay="150">
            <div id="rive-bg-2" class="rive-bg" aria-hidden="true"></div>
            <span class="icon">🛡️</span>
            <h3>Responsible Innovation</h3>
            <p>Understanding the ethical weight of AI decisions is not optional. We build technologists who think before they deploy.</p>
          </div>
          <div class="glass-card glass-card-hover scroll-reveal" data-delay="300">
            <div id="rive-bg-3" class="rive-bg" aria-hidden="true"></div>
            <span class="icon">🎯</span>
            <h3>Creative Augmentation</h3>
            <p>The most powerful use of AI is as a creative co-pilot — a tool that opens doors, not one that walks through them for you.</p>
          </div>
        </div>
      </section>

      <!-- ── EVENTS CARD DECK ── -->
      <section class="events-overview" id="events-deck-section">
        <div class="section-header text-center">
          <span class="eyebrow">The Competition</span>
          <h2 class="section-title text-center">The 5 Arenas</h2>
          <p class="section-subtitle">Five disciplines. One stage. Pick yours.</p>
        </div>
        <div class="card-deck" id="card-deck">
          ${BENTO_EVENTS.map((ev, i) => `
            <a class="playing-card${ev.imageClass ? ' ' + ev.imageClass : ''}" data-index="${i}" href="#/event/${ev.id}" style="--card-accent:${ev.accent}; --card-i:${i};">
              <div class="playing-card-inner">
                <img class="event-card-image" src="${ev.darkImage}" data-dark-src="${ev.darkImage}" data-light-src="${ev.lightImage}" alt="${ev.name} event card" />
              </div>
            </a>
          `).join('')}
        </div>
      </section>

      <!-- ── REGISTRATION CTA ── -->
      <section class="registration-cta text-center scroll-reveal">
        <canvas id="canvas3d" class="shape-future-bg" aria-hidden="true"></canvas>
        <div class="animated-border">
          <span class="eyebrow">Ready?</span>
          <h2 class="gradient-text">Shape the Future.</h2>
          <div id="rive-register-button" class="large-cta" aria-hidden="true">
            <a href="#/register" class="btn-neo-primary btn-fallback">Register Your School →</a>
          </div>
        </div>
      </section>

    </div>
  `;
}

export function initHome() {
  const cleanupDeckImages = initEventDeckImages();
  const isMobile = window.matchMedia('(max-width: 720px)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const isReturningHome = window.__homeHasLoaded === true;
  window.__homeHasLoaded = true;
  const sequenceLoader = !isMobile && isReturningHome ? createSequenceLoader() : null;

  // Ensure hero video playback for dark, light & character videos
  ['hero-bg-video', 'hero-bg-video-light', 'hero-character-video'].forEach(id => {
    const v = document.getElementById(id);
    if (v) {
      v.muted = true;
      v.play().catch(() => {});
    }
  });

  // Architectural 3D Stage (Kinetic Fins + Center Pedestal + Camera Zoom)
  const cleanupStage = isMobile ? () => {} : initHeroStage('hero-section', 'hero-stage-canvas');

  // Interactive Cable removed — replaced by simple theme toggle in navbar

  // Real-time opaque Eye Subject canvas keyer (physically covers & blocks text behind it)
  const cleanupCharacter = initHeroCharacter('hero-character-video', 'hero-character-canvas');

  // Scroll reveals
  const cleanupScrollReveal = isMobile ? () => {} : initScrollReveal();

  // Cinematic image sequence
  const cleanupSequence = isMobile ? () => {} : initImageSequence(
    'image-sequence-section',
    'sequence-canvas',
    'seq-loader',
    sequenceLoader?.finish
  );

  // Scroll-docked Eye AI Assistant Chatbot
  const cleanupEyeBot = initEyeBot();

  const cleanupSpline = isMobile ? () => {} : initSplineScene();

  // Card Deck: Scroll-triggered fan-in animation & hover interaction
  const cleanupCardDeck = isMobile ? () => {} : initCardDeck();

  // Rive elements: register button and vision-card backgrounds
  const cleanupRiveRegister = isMobile ? () => {} : initRiveElement('rive-register-button', { src: '/assets/glass-button.riv', autoplay: true });
  const cleanupRiveBg1 = isMobile ? () => {} : initRiveElement('rive-bg-1', { src: '/assets/glass-bg-1.riv', autoplay: true });
  const cleanupRiveBg2 = isMobile ? () => {} : initRiveElement('rive-bg-2', { src: '/assets/glass-bg-2.riv', autoplay: true });
  const cleanupRiveBg3 = isMobile ? () => {} : initRiveElement('rive-bg-3', { src: '/assets/glass-bg-3.riv', autoplay: true });

  window.__homeCleanup = () => {
    cleanupDeckImages?.();
    cleanupStage?.();
    cleanupCharacter?.();
    cleanupScrollReveal?.();
    cleanupSequence?.();
    cleanupEyeBot?.();
    cleanupSpline?.();
    cleanupCardDeck?.();
    cleanupRiveRegister?.();
    cleanupRiveBg1?.();
    cleanupRiveBg2?.();
    cleanupRiveBg3?.();
    sequenceLoader?.cleanup();
  };
}

function createSequenceLoader() {
  const loader = document.createElement('div');
  loader.id = 'home-sequence-loader';
  loader.className = 'site-loader is-active';
  loader.setAttribute('role', 'status');
  loader.setAttribute('aria-label', 'Loading AI COP');
  loader.innerHTML = `
    <img class="site-loader-gif" src="/loading-animation.gif" alt="" aria-hidden="true" />
    <span class="site-loader-text" aria-hidden="true">Loading...</span>
  `;
  document.body.appendChild(loader);
  document.body.classList.add('site-loading');

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    loader.classList.remove('is-active');
    loader.classList.add('is-done');
    document.body.classList.remove('site-loading');
    window.setTimeout(() => loader.remove(), 850);
  };

  return {
    finish,
    cleanup() {
      finished = true;
      loader.remove();
      document.body.classList.remove('site-loading');
    },
  };
}

function initSplineScene() {
  const canvas = document.getElementById('canvas3d');
  if (!canvas) return () => {};

  const app = new Application(canvas);
  app.load('https://prod.spline.design/Z8nDFLcSTeYWycZF/scene.splinecode').catch(() => {});

  return () => {
    app.dispose?.();
  };
}

function initEventDeckImages() {
  const cards = Array.from(document.querySelectorAll('.event-card-image'));
  if (cards.length === 0) return () => {};

  const applyTheme = () => {
    const isLight = document.body.classList.contains('light-mode');
    cards.forEach((img) => {
      const nextSrc = isLight ? img.dataset.lightSrc : img.dataset.darkSrc;
      if (nextSrc && img.getAttribute('src') !== nextSrc) {
        img.setAttribute('src', nextSrc);
      }
    });
  };

  applyTheme();

  const observer = new MutationObserver(() => applyTheme());
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  return () => observer.disconnect();
}

function initCardDeck() {
  const section = document.getElementById('events-deck-section');
  const deck = document.getElementById('card-deck');
  if (!section || !deck) return () => {};

  const cards = deck.querySelectorAll('.playing-card');
  let hasAnimated = false;

  // Scroll Observer: Trigger fan-in animation when section enters viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        deck.classList.add('deck-fanned');
      }
    });
  }, { threshold: 0.25 });

  observer.observe(section);

  // Hover Interaction: Highlight hovered card, dim siblings
  function onCardEnter(e) {
    const hovered = e.currentTarget;
    cards.forEach(c => {
      if (c === hovered) {
        c.classList.add('card-active');
      } else {
        c.classList.add('card-dimmed');
      }
    });
  }

  function onCardLeave() {
    cards.forEach(c => {
      c.classList.remove('card-active', 'card-dimmed');
    });
  }

  cards.forEach(card => {
    card.addEventListener('mouseenter', onCardEnter);
    card.addEventListener('mouseleave', onCardLeave);
    card.addEventListener('click', (e) => {
      const href = card.getAttribute('href');
      if (!href) return;
      window.location.hash = href.replace('#', '');
    });
  });

  return () => {
    observer.disconnect();
    cards.forEach(card => {
      card.removeEventListener('mouseenter', onCardEnter);
      card.removeEventListener('mouseleave', onCardLeave);
    });
  };
}
