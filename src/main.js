/**
 * AI COP Website — Main Entry Point
 * Initializes the SPA, navbar, footer, and routes
 */

import { addRoute, initRouter } from './router.js';
import { createNavbar, initNavbar } from './components/navbar.js';
import { createFooter, initFooter } from './components/footer.js';

// Page imports
import { renderHome, initHome } from './pages/home.js';
import { renderEvents, initEvents } from './pages/events.js';
import { renderRegister, initRegister } from './pages/register.js';
import { renderEventPage, initEventPage } from './pages/event-page.js';

/**
 * Initialize the application
 */
function initApp() {
  // Render persistent shell components
  const navbarContainer = document.getElementById('navbar-container');
  const footerContainer = document.getElementById('footer-container');
  
  if (navbarContainer) {
    navbarContainer.innerHTML = createNavbar();
    initNavbar();
  }
  
  if (footerContainer) {
    footerContainer.innerHTML = createFooter();
    initFooter();
  }
  
  // Register all routes
  addRoute('/', {
    render: () => renderHome(),
    init: () => initHome(),
    cleanup: () => window.__homeCleanup?.(),
  });
  
  addRoute('/events', {
    render: () => renderEvents(),
    init: () => initEvents(),
  });
  
  addRoute('/event/1', {
    render: () => renderEventPage(1),
    init: () => initEventPage(),
  });
  
  addRoute('/event/2', {
    render: () => renderEventPage(2),
    init: () => initEventPage(),
  });
  
  addRoute('/event/3', {
    render: () => renderEventPage(3),
    init: () => initEventPage(),
  });
  
  addRoute('/event/4', {
    render: () => renderEventPage(4),
    init: () => initEventPage(),
  });
  
  addRoute('/event/5', {
    render: () => renderEventPage(5),
    init: () => initEventPage(),
  });
  
  addRoute('/register', {
    render: () => renderRegister(),
    init: () => initRegister(),
  });
  
  // Start the router
  initRouter();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
