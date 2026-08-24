/**
 * Real-Time Hero 3D Eye Character Canvas Keyer
 * Keys out black background pixels in real-time and renders opaque subject pixels.
 * Guarantees that the Eye graphic physically covers and blocks any text behind it!
 */

export function initHeroCharacter(videoId, canvasId) {
  const video = document.getElementById(videoId);
  const canvas = document.getElementById(canvasId);

  if (!video || !canvas) return () => {};

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let animId;
  let alive = true;

  function loop() {
    if (!alive) return;

    if (video.readyState >= 2 && !video.paused && !video.ended) {
      const vW = video.videoWidth || 720;
      const vH = video.videoHeight || 720;

      if (canvas.width !== vW || canvas.height !== vH) {
        canvas.width = vW;
        canvas.height = vH;
      }

      ctx.clearRect(0, 0, vW, vH);
      ctx.drawImage(video, 0, 0, vW, vH);

      const frameData = ctx.getImageData(0, 0, vW, vH);
      const data = frameData.data;
      const len = data.length;

      // Key out black background pixels (#000000) to create true alpha channel
      for (let i = 0; i < len; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const maxC = Math.max(r, g, b);

        if (maxC < 16) {
          data[i + 3] = (maxC / 16) * 255; // Smooth alpha falloff for edge pixels
        }
      }

      ctx.putImageData(frameData, 0, 0);

      // Duplicate rendering to fixed bottom-right Eye Bot canvas if present
      const botCanvas = document.getElementById('eye-bot-canvas');
      if (botCanvas) {
        if (botCanvas.width !== vW || botCanvas.height !== vH) {
          botCanvas.width = vW;
          botCanvas.height = vH;
        }
        const botCtx = botCanvas.getContext('2d');
        botCtx.clearRect(0, 0, vW, vH);
        botCtx.putImageData(frameData, 0, 0);
      }
    }

    animId = requestAnimationFrame(loop);
  }

  loop();

  return () => {
    alive = false;
    if (animId) cancelAnimationFrame(animId);
  };
}
