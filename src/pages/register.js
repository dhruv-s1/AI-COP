import { initScrollReveal } from '../components/scroll-animation.js';
import { createFormWizard, generateEventFields } from '../components/form-wizard.js';

const EVENTS = [
  { id: 'event1', name: 'AI Ethics Panel', participantCount: Number(import.meta.env.VITE_ETHICAL_CONFERENCE_PARTICIPANTS), color: '#FF6600', icon: '◌' },
  { id: 'event2', name: 'Hackathon', participantCount: Number(import.meta.env.VITE_HACKATHON_PARTICIPANTS), color: '#A0A2A8', icon: '✦' },
  { id: 'event3', name: 'AI Studio', participantCount: Number(import.meta.env.VITE_AI_STUDIO_PARTICIPANTS), color: '#FF4500', icon: '◒' },
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
          <span>AICon / NOTE 01</span>
          <p>Register your school<br />for all three<br />flagship events.</p>
        </div>
        <div class="register-note register-note--stamp">FREE<br /><small>ENTRY</small></div>
      <header class="page-hero register-hero">
        <div class="page-hero-content">
          <h1 class="gradient-text">Join AICon</h1>
          <p class="hero-subtitle">Complete your school's registration for all events in minutes.</p>
        </div>
      </header>

      <section class="section register-content">
        <div id="register-wizard-section">
          <div id="registration-wizard-container" class="glass-card wizard-outer"></div>
        </div>
      </section>
      </div>
    </div>
  `;
}

export function initRegister() {
  initScrollReveal();

  const selected = EVENTS.map(ev => ev.id);

  // Build steps: school info + one step per event + review
  const schoolStep = {
    title: 'School Details',
    fields: [
      { name: 'schoolName', label: 'School Name', type: 'text', required: true },
      { name: 'city', label: 'City / Emirate', type: 'text', required: true },
      { name: 'coordinatorName', label: 'Coordinator Name', type: 'text', required: true },
      { name: 'coordinatorEmail', label: 'Coordinator Email', type: 'email', required: true },
      { name: 'coordinatorPhone', label: 'Coordinator Phone', type: 'tel', required: true },
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
}
