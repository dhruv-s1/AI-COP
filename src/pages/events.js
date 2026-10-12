import { initScrollReveal } from '../components/scroll-animation.js';

// Same event card data as homepage — single source of truth for dates/venues
const EVENTS_PAGE_CARDS = [
  {
    id: 1,
    tag: 'EVENT 1',
    name: 'AI Ethics Panel',
    date: '4 Nov 2026',
    time: '1:30 PM – 3:30 PM',
    venue: 'School Library',
    venueSub: 'Level 2',
    accent: '#FF6600',
    theme: 'white',
    bgImage: '/event-cards-new/AI Ethics Panel.png',
  },
  {
    id: 2,
    tag: 'EVENT 2',
    name: 'Hackathon',
    date: '5 Nov 2026',
    time: '10:00 AM – 1:00 PM',
    venue: 'Hall',
    venueSub: 'Level 1',
    accent: '#F2F2F4',
    theme: 'orange',
    bgImage: '/event-cards-new/Hackathon.png',
  },
  {
    id: 3,
    tag: 'EVENT 3',
    name: 'AI Studio',
    date: '4 Nov 2026',
    time: '1:30 AM – 3:30 PM',
    venue: 'Hall',
    venueSub: 'Level 1',
    accent: '#FF6600',
    theme: 'white',
    bgImage: '/event-cards-new/AI Studio.png',
  },
];

export function renderEvents() {
  return `
        <div class="events-index-page">
            <header class="events-index-header">
                <h1>Choose your<br><em>event.</em></h1>
                <p>Three ways to question, build, and debate with AI.</p>
            </header>
            <section class="events-index-grid" aria-label="AICon events">
                ${EVENTS_PAGE_CARDS.map((ev, i) => `
                    <div class="playing-card events-page-card event-card-theme-${ev.theme}" data-href="#/event/${ev.id}" style="--card-accent:${ev.accent};" role="article" aria-label="${ev.name}">
                      <div class="playing-card-inner">
                        <img class="event-card-bg" src="${ev.bgImage}" alt="" aria-hidden="true" />
                        <div class="event-card-content">
                          <div class="event-card-header">
                            <span class="event-card-badge">${ev.tag}</span>
                          </div>
                          <div class="event-card-artwork-spacer" aria-hidden="true"></div>
                          <div class="event-card-footer">
                            <h3 class="event-card-title">${ev.name}</h3>
                            <div class="event-card-divider" aria-hidden="true"></div>
                            <div class="event-card-meta">
                              <div class="event-card-meta-col event-card-meta-date">
                                <svg class="event-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                  <line x1="16" y1="2" x2="16" y2="6"></line>
                                  <line x1="8" y1="2" x2="8" y2="6"></line>
                                  <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <div class="event-meta-text">
                                  <span class="meta-line-1">${ev.date}</span>
                                  <span class="meta-line-2">${ev.time}</span>
                                </div>
                              </div>
                              <div class="event-card-meta-sep" aria-hidden="true"></div>
                              <div class="event-card-meta-col event-card-meta-venue">
                                <svg class="event-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                  <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <div class="event-meta-text">
                                  <span class="meta-line-1">${ev.venue}</span>
                                  <span class="meta-line-2">${ev.venueSub}</span>
                                </div>
                              </div>
                            </div>
                            <a href="#/event/${ev.id}" class="event-card-btn" aria-label="View details for ${ev.name}">
                              <span>View Details</span>
                              <svg class="event-card-btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                `).join('')}
            </section>
        </div>
    `;
}

export function initEvents() {
  const cleanupReveal = initScrollReveal();

  // Card click navigation (same as homepage)
  const cards = document.querySelectorAll('.events-page-card');
  const onClick = (e) => {
    if (e.target.closest('.event-card-btn')) return;
    const card = e.currentTarget;
    const href = card.dataset.href;
    if (href) window.location.hash = href.replace('#', '');
  };
  cards.forEach(card => card.addEventListener('click', onClick));

  return () => {
    cleanupReveal?.();
    cards.forEach(card => card.removeEventListener('click', onClick));
  };
}
