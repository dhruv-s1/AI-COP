import { initScrollReveal } from '../components/scroll-animation.js';
import { EVENT_DATA } from '../data/event-data.js';

export function renderEvents() {
    return `
        <div class="events-index-page">
            <header class="events-index-header">
                <h1>Choose your<br><em>event.</em></h1>
                <p>Five ways to question, build, debate, and imagine with AI.</p>
            </header>
            <section class="events-index-grid" aria-label="AI COP events">
                ${EVENT_DATA.map((event) => `
                    <a class="event-index-card" href="#/event/${event.id}" style="--event-image:url('${event.darkImage}');">
                        <div class="event-index-image"></div>
                    </a>
                `).join('')}
            </section>
        </div>
    `;
}

export function initEvents() {
    return initScrollReveal();
}
