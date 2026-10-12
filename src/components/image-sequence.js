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
 * Draw one or two images onto the canvas using `cover` fit with crossfade.
 */
function drawFrame(ctx, canvas, img1, img2, fraction, dpr) {
  if (!img1) return;

  const cw = canvas.width / dpr;
  const ch = canvas.height / dpr;

  ctx.clearRect(0, 0, cw, ch);

  const drawSingle = (img, alpha) => {
    if (!img) return;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.globalAlpha = alpha;
    ctx.drawImage(img, dx, dy, dw, dh);
  };

  // Draw base image fully opaque
  drawSingle(img1, 1);

  // Draw next image blended on top
  if (img2 && fraction > 0) {
    drawSingle(img2, fraction);
  }

  // Reset alpha
  ctx.globalAlpha = 1;
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
  
  let targetProgress = 0;
  let currentProgress = 0;
  let currentExactFrame = -1;
  const ease = 0.1; // Lerp easing factor

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
    if (frames.length > 0) {
       const f1 = Math.floor(Math.max(0, currentExactFrame));
       const f2 = Math.min(f1 + 1, FRAME_COUNT - 1);
       const frac = Math.max(0, currentExactFrame - f1);
       drawFrame(ctx, canvas, frames[f1], frames[f2], frac, dpr);
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
    
    targetProgress = getScrollProgress();
    
    // Lerp progress for smooth scroll effect
    currentProgress += (targetProgress - currentProgress) * ease;
    
    // Snap if very close
    if (Math.abs(targetProgress - currentProgress) < 0.0001) {
      currentProgress = targetProgress;
    }

    const exactFrame = currentProgress * (FRAME_COUNT - 1);

    // Only redraw if the frame fraction changed meaningfully
    if (Math.abs(exactFrame - currentExactFrame) > 0.005) {
      currentExactFrame = exactFrame;
      const frame1Idx = Math.floor(exactFrame);
      const frame2Idx = Math.min(frame1Idx + 1, FRAME_COUNT - 1);
      const fraction = exactFrame - frame1Idx;

      drawFrame(ctx, canvas, frames[frame1Idx], frames[frame2Idx], fraction, dpr);
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
    currentExactFrame = 0;
    drawFrame(ctx, canvas, frames[0], frames[1], 0, dpr);
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
