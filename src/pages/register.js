import { initScrollReveal } from '../components/scroll-animation.js';
import { createFormWizard, generateEventFields } from '../components/form-wizard.js';

const EVENTS = [
  { id: 'event1', name: 'Panel Discussion',      participantCount: Number(import.meta.env.VITE_PANEL_DISCUSSION_PARTICIPANTS), color: '#F2F2F4', icon: '◉' },
  { id: 'event2', name: 'Ethical Conference',    participantCount: Number(import.meta.env.VITE_ETHICAL_CONFERENCE_PARTICIPANTS), color: '#FF6600', icon: '◌' },
  { id: 'event3', name: 'Hackathon',             participantCount: Number(import.meta.env.VITE_HACKATHON_PARTICIPANTS), color: '#A0A2A8', icon: '✦' },
  { id: 'event4', name: 'AI vs Human',           participantCount: Number(import.meta.env.VITE_AI_VS_HUMAN_PARTICIPANTS), color: '#FF4500', icon: '◒' },
  { id: 'event5', name: 'Roundtable Conference', participantCount: Number(import.meta.env.VITE_ROUNDTABLE_CONFERENCE_PARTICIPANTS), color: '#E5E5E7', icon: '◎' },
];

const getParticipantCount = (event) => {
  const configuredCount = event.participantCount;
  return Number.isInteger(configuredCount) && configuredCount > 0 ? configuredCount : 1;
};

export function renderRegister() {
  return `
    <div class="page-container register-page">
      <div class="register-board">
        <span class="register-board-dot register-board-dot--one"></span>
        <span class="register-board-dot register-board-dot--two"></span>
        <div class="register-note register-note--intro">
          <span>AI COP / NOTE 01</span>
          <p>Choose the events<br />your school wants<br />to explore.</p>
        </div>
        <div class="register-note register-note--stamp">FREE<br /><small>ENTRY</small></div>
      <header class="page-hero register-hero">
        <div class="page-hero-content">
          <h1 class="gradient-text">Join AI COP</h1>
          <p class="hero-subtitle">Select your events and complete registration in minutes.</p>
        </div>
      </header>

      <section class="section register-content">
        <div id="register-step-select" class="register-step-select">
          <h2 class="section-title text-center">Choose Your Arenas</h2>
          <p class="section-subtitle text-center">Select the events your school will participate in. You may enter all or just some.</p>
          <div class="event-selector" id="event-selector-grid">
            ${EVENTS.map(ev => `
              <label class="event-selector-card" style="--accent:${ev.color}" for="sel-${ev.id}">
                <input type="checkbox" id="sel-${ev.id}" name="selectedEvents" value="${ev.id}" class="event-checkbox">
                <div class="event-selector-inner">
                  <span class="event-icon">${ev.icon}</span>
                  <h3 class="event-selector-name">${ev.name}</h3>
                  <span class="event-selector-check" aria-hidden="true">
                    <svg viewBox="0 0 42 32" focusable="false">
                      <defs>
                        <filter id="chalk-texture" x="-20%" y="-20%" width="140%" height="140%">
                          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7" result="grain" />
                          <feDisplacementMap in="SourceGraphic" in2="grain" scale="0.45" />
                        </filter>
                      </defs>
                      <path class="check-stroke check-stroke--shadow" pathLength="100" filter="url(#chalk-texture)" d="M3 17c7 1 10 9 14 10C24 28 31 6 39 3" />
                      <path class="check-stroke" pathLength="100" filter="url(#chalk-texture)" d="M3 17c7 1 10 9 14 10C24 28 31 6 39 3" />
                    </svg>
                  </span>
                </div>
              </label>
            `).join('')}
          </div>
          <div class="event-selector-cta text-center">
            <button id="btn-start-registration" class="btn-neo-primary">
              Continue to Registration &rarr;
            </button>
            <p class="select-hint" id="select-hint" style="display:none;color:var(--accent-primary);margin-top:0.75rem;">Please select at least one event.</p>
          </div>
        </div>

        <div id="register-wizard-section" style="display:none;">
          <div id="registration-wizard-container" class="glass-card wizard-outer"></div>
        </div>
      </section>
      </div>
    </div>
  `;
}

export function initRegister() {
  initScrollReveal();

  const btnStart = document.getElementById('btn-start-registration');
  const selectSection = document.getElementById('register-step-select');
  const wizardSection = document.getElementById('register-wizard-section');
  const wizardContainer = document.getElementById('registration-wizard-container');
  const hint = document.getElementById('select-hint');

  // Highlight card on checkbox change
  document.querySelectorAll('.event-selector-card').forEach(card => {
    const checkbox = card.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
      card.classList.toggle('selected', checkbox.checked);
    });
  });

  btnStart.addEventListener('click', () => {
    const selected = Array.from(
      document.querySelectorAll('input[name="selectedEvents"]:checked')
    ).map(cb => cb.value);

    if (selected.length === 0) {
      hint.style.display = 'block';
      hint.classList.add('shake');
      setTimeout(() => hint.classList.remove('shake'), 500);
      return;
    }
    hint.style.display = 'none';

    // Build steps: school info + one step per event + review
    const schoolStep = {
      title: 'School Details',
      fields: [
        { name: 'schoolName',       label: 'School Name',            type: 'text',  required: true },
        { name: 'city',             label: 'City / Emirate',         type: 'text',  required: true },
        { name: 'coordinatorName',  label: 'Coordinator Name',       type: 'text',  required: true },
        { name: 'coordinatorEmail', label: 'Coordinator Email',      type: 'email', required: true },
        { name: 'coordinatorPhone', label: 'Coordinator Phone',      type: 'tel',   required: true },
      ],
    };

    const eventSteps = selected.map(evId => {
      const ev = EVENTS.find(e => e.id === evId);
      return generateEventFields(evId, ev.name, getParticipantCount(ev));
    });

    const reviewStep = {
      title: 'Review & Submit',
      fields: [],
      isReview: true,
    };

    const steps = [schoolStep, ...eventSteps, reviewStep];

    // Hide selector, show wizard
    selectSection.style.display = 'none';
    wizardSection.style.display = 'block';

    createFormWizard({
      steps,
      containerId: 'registration-wizard-container',
      onSubmit: async (data) => {
        const response = await fetch('/api/registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedEvents: selected, data }),
        });
        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.error || 'Unable to save registration. Please try again.');
        }
      },
    });
  });
}
