/**
 * AICon Website — SPA Router
 * Hash-based client-side routing with smooth page transitions
 */

const routes = {};
let currentCleanup = null;
let pendingSectionScroll = null;
let routeRenderTimer = null;
let routeRenderGeneration = 0;

function setNavHighlight(section) {
  window.__activeNavSection = section;
  window.dispatchEvent(new Event('navstatechange'));
}

function deriveNavSection(path) {
  if (path === '/') return 'home';
  if (path === '/events') return 'events';
  if (path.startsWith('/event')) return 'events';
  return null;
}

function scheduleRouteRender() {
  window.clearTimeout(routeRenderTimer);
  routeRenderTimer = window.setTimeout(() => {
    routeRenderTimer = null;
    renderRoute();
  }, 0);
}

/**
 * Register a route
 * @param {string} path - Route path (e.g., '/', '/events', '/event/1')
 * @param {object} handler - { render: () => string, init: () => void, cleanup?: () => void }
 */
export function addRoute(path, handler) {
  routes[path] = handler;
}

/**
 * Navigate to a route programmatically
 * @param {string} path
 */
export function navigateTo(path) {
  window.location.hash = path;
}

/**
 * Get current route path from hash
 */
function getCurrentPath() {
  const hash = window.location.hash.slice(1) || '/';
  return hash;
}

/**
 * Match a path to a registered route (supports simple params like /event/:id)
 */
function matchRoute(path) {
  // Exact match first
  if (routes[path]) {
    return { handler: routes[path], params: {} };
  }
  
  // Pattern matching for dynamic routes
  for (const pattern of Object.keys(routes)) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    if (patternParts.length !== pathParts.length) continue;
    
    const params = {};
    let matched = true;
    
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        matched = false;
        break;
      }
    }
    
    if (matched) {
      return { handler: routes[pattern], params };
    }
  }
  
  return null;
}

/**
 * Render the current route
 */
async function renderRoute() {
  const renderGeneration = ++routeRenderGeneration;
  const path = getCurrentPath();
  const app = document.getElementById('app');
  
  if (!app) return;
  
  const match = matchRoute(path);
  
  if (!match) {
    // 404 fallback — redirect to home
    navigateTo('/');
    return;
  }
  
  const { handler, params } = match;
  
  // Cleanup previous page
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }
  
  // Page exit animation
  app.classList.add('page-exit');
  
  await new Promise(resolve => setTimeout(resolve, 300));

  // A newer navigation supersedes this transition. Do not let a slower
  // render put stale content back into the app.
  if (renderGeneration !== routeRenderGeneration) return;
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });
  
  // Render new content
  app.innerHTML = handler.render(params);
  
  // Page enter animation
  app.classList.remove('page-exit');
  app.classList.add('page-enter');
  
  // Initialize page JS
  if (handler.init) {
    // Wait for DOM to settle
    requestAnimationFrame(() => {
      if (renderGeneration !== routeRenderGeneration) return;
      handler.init(params);
    });
  }

  if (pendingSectionScroll && path === '/') {
    const sectionId = pendingSectionScroll;
    pendingSectionScroll = null;
    requestAnimationFrame(() => {
      if (renderGeneration !== routeRenderGeneration) return;
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  } else if (path !== '/') {
    pendingSectionScroll = null;
  }
  
  // Store cleanup
  if (handler.cleanup) {
    currentCleanup = handler.cleanup;
  }
  
  // Remove enter animation class
  setTimeout(() => {
    if (renderGeneration !== routeRenderGeneration) return;
    app.classList.remove('page-enter');
    app.classList.add('page-active');
  }, 500);
  
  // Update active nav link
  updateActiveNavLink(path);
}

/**
 * Update the active nav link indicator
 */
function updateActiveNavLink(path) {
  const activeSection = window.__activeNavSection || deriveNavSection(path);
  window.__activeNavSection = activeSection;
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href) {
      const linkPath = href.replace('#', '');
      if (activeSection === 'events' && linkPath === 'section-events-deck-section') {
        link.classList.add('active');
      } else if (activeSection === 'register' && linkPath === '/register') {
        link.classList.add('active');
      } else if (activeSection === 'home' && linkPath === '/') {
        link.classList.add('active');
      }
    }
  });
}

/**
 * Initialize the router
 */
export function initRouter() {
  window.addEventListener('hashchange', scheduleRouteRender);
  
  // Handle initial load
  if (!window.location.hash) {
    window.location.hash = '/';
  }
  
  renderRoute();
  
  // Handle link clicks for smooth navigation
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (link) {
      const path = link.getAttribute('href').slice(1);

      if (path.startsWith('section-')) {
        e.preventDefault();
        const sectionId = path.slice('section-'.length);
        setNavHighlight(sectionId === 'events-deck-section' ? 'events' : null);
        if (getCurrentPath() !== '/') {
          pendingSectionScroll = sectionId;
          navigateTo('/');
          return;
        }

        const target = document.getElementById(sectionId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      if (path === '/') {
        setNavHighlight('home');
      } else if (path === '/register') {
        setNavHighlight('register');
      } else {
        setNavHighlight(null);
      }

      e.preventDefault();
      navigateTo(path);
      scheduleRouteRender();
    }
  });
}
