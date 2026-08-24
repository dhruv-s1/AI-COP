/**
 * Hero Architectural Stage Component
 * Keeps the canvas transparent so the looping video elements
 * (#hero-bg-video for Dark Mode & #hero-bg-video-light for Light Mode)
 * play with 100% full visibility and native resolution.
 */

export function initHeroStage(containerId, canvasId) {
  const container = document.getElementById(containerId);
  const canvas = document.getElementById(canvasId);

  if (!container || !canvas) return () => {};

  const ctx = canvas.getContext('2d');
  let width, height;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = container.clientWidth;
    height = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.clearRect(0, 0, width, height);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  return () => {
    window.removeEventListener('resize', resize);
  };
}
