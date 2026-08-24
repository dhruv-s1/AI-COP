/**
 * Image Sequence — Scroll-linked cinematic animation
 * Renders a preloaded image sequence on a canvas, driven by scroll position.
 * Uses requestAnimationFrame for smooth updates, handles DPI and responsive sizing.
 */

const FRAME_COUNT = 195;
const FRAME_PATH = '/sequence/frame_';

/**
 * Build the frame URL for a given 1-indexed frame number.
 */
function frameSrc(n) {
  return `${FRAME_PATH}${String(n).padStart(3, '0')}.png`;
}

/**
 * Preload all frames and return a promise that resolves to an array of Image objects.
 * Calls `onProgress(loaded, total)` as frames load.
 */
function preloadFrames(onProgress) {
  const images = new Array(FRAME_COUNT);
  let loaded = 0;

  return new Promise((resolve, reject) => {
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = frameSrc(i + 1);

      img.onload = () => {
        images[i] = img;
        loaded++;
        onProgress?.(loaded, FRAME_COUNT);
        if (loaded === FRAME_COUNT) resolve(images);
      };

      img.onerror = () => {
        // Still count it so we don't hang — just leave a gap
        loaded++;
        onProgress?.(loaded, FRAME_COUNT);
        if (loaded === FRAME_COUNT) resolve(images);
      };
    }
  });
}

/**
 * Draw an image onto the canvas using `cover` fit (fills viewport, no edges visible).
 */
function drawFrame(ctx, canvas, img, dpr) {
  if (!img) return;

  const cw = canvas.width / dpr;
  const ch = canvas.height / dpr;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  // cover — fill the canvas, crop overflow
  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

/**
 * Initialise the scroll-linked image sequence.
 * @param {string} sectionId  — id of the tall scroll section
 * @param {string} canvasId   — id of the <canvas> element
 * @param {string} loaderId   — id of the loading overlay element
 * @returns {Function} cleanup function
 */
export function initImageSequence(sectionId, canvasId, loaderId, onReady) {
  const section = document.getElementById(sectionId);
  const canvas = document.getElementById(canvasId);
  const loader = document.getElementById(loaderId);

  if (!section || !canvas) return () => {};

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  let frames = [];
  let currentFrame = -1;
  let rafId = null;
  let alive = true;

  // ── DPI-aware resize ──
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2× for perf

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Redraw current frame after resize
    if (frames[currentFrame]) {
      drawFrame(ctx, canvas, frames[currentFrame], dpr);
    }
  }

  // ── Scroll → frame index mapping ──
  function getScrollProgress() {
    const rect = section.getBoundingClientRect();
    const scrollable = section.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    const scrolled = Math.max(0, -rect.top);
    return Math.min(1, scrolled / scrollable);
  }

  function tick() {
    if (!alive) return;
    const progress = getScrollProgress();
    const idx = Math.min(
      Math.floor(progress * FRAME_COUNT),
      FRAME_COUNT - 1
    );

    if (idx !== currentFrame && frames[idx]) {
      currentFrame = idx;
      drawFrame(ctx, canvas, frames[idx], dpr);
    }

    // Hide navbar & floating elements while sequence is active
    const rect = section.getBoundingClientRect();
    const isActive = rect.top <= 0 && rect.bottom > window.innerHeight;
    document.body.classList.toggle('sequence-active', isActive);

    rafId = requestAnimationFrame(tick);
  }

  // ── Loading progress ──
  const progressBar = loader?.querySelector('.seq-loader-bar');

  function onProgress(loaded, total) {
    const pct = (loaded / total) * 100;
    if (progressBar) {
      progressBar.style.width = pct + '%';
    }
  }

  // ── Start ──
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const framesReady = preloadFrames(onProgress);
  window.__aicopLoadingGates?.push(framesReady);

  framesReady.then((imgs) => {
    if (!alive) return;
    frames = imgs;

    // Hide loader
    if (loader) {
      loader.classList.add('seq-loader-done');
      setTimeout(() => { loader.style.display = 'none'; }, 500);
    }

    // Draw first frame
    currentFrame = 0;
    drawFrame(ctx, canvas, frames[0], dpr);
    onReady?.();

    // Start RAF loop
    tick();
  });

  // ── Cleanup ──
  return () => {
    alive = false;
    document.body.classList.remove('sequence-active');
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
  };
}
