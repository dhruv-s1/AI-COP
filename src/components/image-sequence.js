/**
 * Image Sequence - Scroll-linked cinematic animation
 * Plays frame-by-frame smoothly with ZERO ghosting / crossfade.
 * When scrolling fast, the animation accelerates dynamically,
 * playing all frames at higher speed without skipping the section.
 */

const FRAME_COUNT = 195;
const FRAME_PATH = '/sequence/frame_';

function frameSrc(n) {
  return `${FRAME_PATH}${String(n).padStart(3, '0')}.png`;
}

function preloadFrames(onProgress) {
  const images = new Array(FRAME_COUNT);
  let loaded = 0;

  return new Promise((resolve) => {
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
        loaded++;
        onProgress?.(loaded, FRAME_COUNT);
        if (loaded === FRAME_COUNT) resolve(images);
      };
    }
  });
}

/**
 * Draw a single frame cleanly onto canvas with 'cover' fit.
 * No crossfading or opacity blending to avoid any ghosting.
 */
function drawSingleFrame(ctx, canvas, img, dpr) {
  if (!img) return;

  const cw = canvas.width / dpr;
  const ch = canvas.height / dpr;

  ctx.clearRect(0, 0, cw, ch);

  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;

  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  ctx.drawImage(img, dx, dy, dw, dh);
}

export function initImageSequence(sectionId, canvasId, loaderId, onReady) {
  const section = document.getElementById(sectionId);
  const canvas = document.getElementById(canvasId);
  const loader = document.getElementById(loaderId);

  if (!section || !canvas) return () => { };

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'medium';

  let frames = [];
  let currentFrame = 0;
  let targetFrame = 0;
  let lastDrawnFrame = -1;
  let isWheelActive = false;
  let wheelTimeout = null;
  let rafId = null;
  let alive = true;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (frames.length > 0 && lastDrawnFrame >= 0) {
      drawSingleFrame(ctx, canvas, frames[lastDrawnFrame], dpr);
    }
  }

  function getScrollableRange() {
    const scrollable = section.offsetHeight - window.innerHeight;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    return { sectionTop, scrollable };
  }

  function getScrollProgress() {
    const rect = section.getBoundingClientRect();
    const scrollable = section.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    const scrolled = Math.max(0, -rect.top);
    return Math.min(1, scrolled / scrollable);
  }

  function syncScrollFromFrame(frameIdx) {
    const { sectionTop, scrollable } = getScrollableRange();
    if (scrollable <= 0) return;
    const progress = frameIdx / (FRAME_COUNT - 1);
    const targetY = sectionTop + progress * scrollable;
    window.scrollTo({ top: targetY, behavior: 'instant' });
  }

  function onWheel(e) {
    if (!alive || frames.length === 0) return;

    const rect = section.getBoundingClientRect();
    const isInSequenceZone = rect.top <= 2 && rect.bottom >= window.innerHeight - 2;

    if (!isInSequenceZone) return;

    const delta = e.deltaY;

    // Scrolling down: play forward
    if (delta > 0) {
      if (currentFrame < FRAME_COUNT - 1) {
        e.preventDefault();
        isWheelActive = true;
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => { isWheelActive = false; }, 250);

        // Fast scroll detection: larger delta advances target frame more
        const step = Math.abs(delta) > 100
          ? Math.min(15, Math.max(3, Math.round(Math.abs(delta) / 25)))
          : Math.max(1, Math.round(Math.abs(delta) / 40));

        targetFrame = Math.min(FRAME_COUNT - 1, targetFrame + step);
      }
    }
    // Scrolling up: play backward
    else if (delta < 0) {
      if (currentFrame > 0 && rect.top >= -5) {
        e.preventDefault();
        isWheelActive = true;
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => { isWheelActive = false; }, 250);

        const step = Math.abs(delta) > 100
          ? Math.min(15, Math.max(3, Math.round(Math.abs(delta) / 25)))
          : Math.max(1, Math.round(Math.abs(delta) / 40));

        targetFrame = Math.max(0, targetFrame - step);
      }
    }
  }

  // Touch gesture handling
  let touchStartY = null;
  function onTouchStart(e) {
    if (e.touches && e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
    }
  }

  function onTouchMove(e) {
    if (!touchStartY || !alive || frames.length === 0) return;
    const currentY = e.touches[0].clientY;
    const deltaY = touchStartY - currentY;
    const rect = section.getBoundingClientRect();
    const isInSequenceZone = rect.top <= 2 && rect.bottom >= window.innerHeight - 2;

    if (!isInSequenceZone) return;

    if (deltaY > 0 && currentFrame < FRAME_COUNT - 1) {
      e.preventDefault();
      isWheelActive = true;
      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => { isWheelActive = false; }, 250);
      const step = Math.max(1, Math.min(12, Math.round(Math.abs(deltaY) / 12)));
      targetFrame = Math.min(FRAME_COUNT - 1, targetFrame + step);
      touchStartY = currentY;
    } else if (deltaY < 0 && currentFrame > 0 && rect.top >= -5) {
      e.preventDefault();
      isWheelActive = true;
      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => { isWheelActive = false; }, 250);
      const step = Math.max(1, Math.min(12, Math.round(Math.abs(deltaY) / 12)));
      targetFrame = Math.max(0, targetFrame - step);
      touchStartY = currentY;
    }
  }

  function onTouchEnd() {
    touchStartY = null;
  }

  // Fallback scroll listener for scrollbar drag or keys
  function onScroll() {
    if (isWheelActive) return;
    const progress = getScrollProgress();
    targetFrame = Math.round(progress * (FRAME_COUNT - 1));
  }

  function tick() {
    if (!alive) return;

    if (!isWheelActive) {
      const progress = getScrollProgress();
      targetFrame = Math.round(progress * (FRAME_COUNT - 1));
    }

    const diff = targetFrame - currentFrame;
    const absDiff = Math.abs(diff);

    if (absDiff > 0.05) {
      // Dynamic acceleration: the further away, the faster we play
      // Small scroll = 1 frame per tick. Fast scroll = scales up to 8 frames per tick.
      const rate = absDiff > 20 ? 0.35 : absDiff > 8 ? 0.25 : 0.18;
      const step = Math.sign(diff) * Math.max(1, Math.min(absDiff, Math.ceil(absDiff * rate)));
      currentFrame += step;

      // Clamp
      currentFrame = Math.max(0, Math.min(FRAME_COUNT - 1, currentFrame));

      const intFrame = Math.round(currentFrame);
      if (intFrame !== lastDrawnFrame && frames[intFrame]) {
        lastDrawnFrame = intFrame;
        drawSingleFrame(ctx, canvas, frames[intFrame], dpr);
      }

      if (isWheelActive) {
        syncScrollFromFrame(intFrame);
      }
    } else if (currentFrame !== targetFrame) {
      currentFrame = targetFrame;
      const intFrame = Math.round(currentFrame);
      if (intFrame !== lastDrawnFrame && frames[intFrame]) {
        lastDrawnFrame = intFrame;
        drawSingleFrame(ctx, canvas, frames[intFrame], dpr);
      }
      if (isWheelActive) {
        syncScrollFromFrame(intFrame);
      }
    }

    // Toggle sequence active class for nav styling
    const rect = section.getBoundingClientRect();
    const isActive = rect.top <= 0 && rect.bottom > window.innerHeight;
    document.body.classList.toggle('sequence-active', isActive);

    rafId = requestAnimationFrame(tick);
  }

  const progressBar = loader?.querySelector('.seq-loader-bar');

  function onProgress(loaded, total) {
    const pct = (loaded / total) * 100;
    if (progressBar) {
      progressBar.style.width = pct + '%';
    }
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  const framesReady = preloadFrames(onProgress);
  window.__aicopLoadingGates?.push(framesReady);

  framesReady.then((imgs) => {
    if (!alive) return;
    frames = imgs;

    if (loader) {
      loader.classList.add('seq-loader-done');
      setTimeout(() => { loader.style.display = 'none'; }, 500);
    }

    currentFrame = 0;
    targetFrame = 0;
    lastDrawnFrame = 0;
    drawSingleFrame(ctx, canvas, frames[0], dpr);
    onReady?.();

    tick();
  });

  return () => {
    alive = false;
    document.body.classList.remove('sequence-active');
    if (rafId) cancelAnimationFrame(rafId);
    clearTimeout(wheelTimeout);
    window.removeEventListener('resize', resize);
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('scroll', onScroll);
  };
}