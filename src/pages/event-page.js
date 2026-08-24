import { initScrollReveal } from '../components/scroll-animation.js';
import { getEvent } from '../data/event-data.js';

export function renderEventPage(id) {
  const event = getEvent(id);
  return `
    <div class="event-ticket-page${event.id > 1 ? ' event-ticket-page--below-dash' : ''}" style="--event-accent:${event.accent};">
      <header class="event-ticket-header">
        <div class="event-ticket-brand"><span class="brand-dot"></span> AI COP / EVENTS</div>
        <div class="event-ticket-index">${event.number} / 05</div>
      </header>

      <main class="event-ticket-shell">
        <div class="event-ticket-intro">
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
            <span class="ticket-vertical-label">AI COP / EVENT TICKET</span>
            <span class="ticket-small-index">${event.number}</span>
          </article>

          <article class="event-ticket-confirm event-ticket-panel">
            <img class="event-folder-graphic" src="/pngegg.png" alt="" aria-hidden="true" />
            <span class="ticket-confirm-label">EVENT BRIEF</span>
            <h2>${event.shortName}</h2>
            <span class="ticket-big-number">${event.number}</span>
            <div class="ticket-rule"></div>
            <p>${event.details}</p>
            <a class="ticket-download" href="${event.file}" download>
              <span>Download event brief</span>
              <span class="download-icon" aria-hidden="true">↓</span>
            </a>
          </article>
        </section>

        <section class="event-ticket-meta scroll-reveal">
          <div><span>FORMAT</span><strong>${event.format}</strong></div>
          <div><span>TEAM</span><strong>${event.team}</strong></div>
          <div><span>JUDGING</span><strong>${event.judging}</strong></div>
        </section>

        <div class="event-ticket-footer">
          <a class="event-back-link" href="#/events">&larr; All events</a>
          <a class="event-register-link" href="#/register">Register for ${event.shortName} <span>&rarr;</span></a>
        </div>
      </main>
    </div>
  `;
}

export function initEventPage() {
  const cleanupReveal = initScrollReveal();
  return () => cleanupReveal?.();
}
