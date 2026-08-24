function loadRiveRuntime() {
  if (window.Rive) return Promise.resolve(window.Rive);
  if (window.__riveLoading) return window.__riveLoading;

  window.__riveLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/rive-js@0.7.15/dist/rive.min.js';
    script.async = true;
    script.onload = () => {
      if (window.Rive) resolve(window.Rive);
      else reject(new Error('Rive runtime loaded but window.Rive missing'));
    };
    script.onerror = () => reject(new Error('Failed to load Rive runtime'));
    document.head.appendChild(script);
  });

  return window.__riveLoading;
}

export function initRiveElement(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return () => {};

  // create wrapper and canvas
  const wrapper = document.createElement('div');
  wrapper.className = 'rive-player';
  const canvas = document.createElement('canvas');
  wrapper.appendChild(canvas);
  // clear any fallback content, then insert
  container.innerHTML = '';
  container.appendChild(wrapper);

  let riveInst;
  let alive = true;

  loadRiveRuntime().then((Rive) => {
    if (!alive) return;

    const riveOpts = {
      src: options.src,
      canvas,
      autoplay: options.autoplay ?? true,
    };

    if (options.stateMachine) riveOpts.stateMachines = [options.stateMachine];
    if (options.artboard) riveOpts.artboard = options.artboard;

    riveInst = new Rive(riveOpts);
  }).catch((err) => {
    if (alive) console.warn('Rive init skipped:', err.message);
  });

  return () => {
    alive = false;
    try {
      if (riveInst && typeof riveInst.cleanup === 'function') riveInst.cleanup();
    } catch (e) {}
    container.innerHTML = '';
  };
}
