import { initScrollReveal } from '../components/scroll-animation.js';
import { getEvent } from '../data/event-data.js';

export function renderEventPage(id) {
  const event = getEvent(id);
  return `
    <div class="event-ticket-page${event.id > 1 ? ' event-ticket-page--below-dash' : ''}" style="--event-accent:${event.accent};">
      <header class="event-ticket-header">
        <div class="event-ticket-brand"><span class="brand-dot"></span> AICon / EVENTS</div>
        <div class="event-ticket-index">${event.number} / 04</div>
      </header>

      <main class="event-ticket-shell">
        <div class="event-ticket-intro">
          <div class="event-ticket-date-pill date-pill-${event.dateGroup}">
            <span class="date-pill-dot" aria-hidden="true"></span>
            <span class="date-pill-text">${event.dateFull || event.date}</span>
          </div>
          <h1>${event.name}${event.id > 1 ? '<span class="title-dash title-dash--below">&mdash;</span>' : '<span class="title-dash">&mdash;</span>'}</h1>
          <p class="event-ticket-subtitle">${event.subtitle}</p>
        </div>

        <section class="event-ticket-grid" aria-label="${event.name} overview">
          <article class="event-ticket-info event-ticket-panel">
            <div class="ticket-panel-image" aria-hidden="true"></div>
            <div class="ticket-panel-copy">
              <p>${event.description}</p>
              <span class="ticket-arrow" aria-hidden="true">&rarr;</span>
            </div>
          </article>

          <article class="event-ticket-yellow event-ticket-panel">
            <div class="ticket-notch ticket-notch-left"></div>
            <div class="ticket-notch ticket-notch-right"></div>
            <span class="ticket-mark" aria-hidden="true">◒</span>
            <span class="ticket-vertical-label">AICon / EVENT TICKET</span>
            <span class="ticket-small-index">${event.number}</span>
          </article>

          <article class="event-ticket-confirm event-ticket-panel">
            <img class="event-folder-graphic" src="/pngegg.png" alt="" aria-hidden="true" />
            <span class="ticket-confirm-label">EVENT BRIEF</span>
            <h2>${event.shortName}</h2>
            <span class="ticket-big-number">${event.number}</span>
            <a class="ticket-download" href="${event.file}" download>
              <svg class="download-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download Event Brief</span>
            </a>
          </article>
        </section>

        <section class="event-ticket-meta scroll-reveal">
          <div><span>DATE</span><strong>${event.date}</strong></div>
          <div><span>TIME</span><strong>${event.time}</strong></div>
          <div><span>VENUE</span><strong>${event.venue}</strong></div>
          <div><span>FORMAT</span><strong>${event.format}</strong></div>
          <div><span>TEAM</span><strong>${event.team}</strong></div>
          <div><span>JUDGING</span><strong>${event.judging}</strong></div>
        </section>

        <div class="event-ticket-footer">
          <a class="event-back-link" href="#/events">&larr; All events</a>
          <a class="event-register-link" href="https://forms.cloud.microsoft/r/gxrsE4k10s" target="_blank" rel="noopener noreferrer">Register for ${event.shortName} <span>&rarr;</span></a>
        </div>
      </main>
    </div>
  `;
}

export function initEventPage() {
  const cleanupReveal = initScrollReveal();
  return () => cleanupReveal?.();
}
