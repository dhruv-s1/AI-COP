/**
 * Interactive Tangling Charging Cable Component
 * Features physics-based cable originating from bottom center of the hero section (#FF5C00).
 *
 * 2D Collision & Tangling Physics:
 *  - Hero text elements (heading, eyebrow badge, CTA buttons) act as solid 2D colliders in space.
 *  - The cord wraps around letters & buttons and can get tangled around them.
 *  - Fixed total cord length: When tangled around text/buttons, slack is consumed so the tip
 *    CANNOT reach side laptop ports. Users must untangle the cord to reach the ports!
 *
 * Connects to 2 separate 3D Laptops on Left & Right wall edges:
 *  - Left: Dark Mode Laptop
 *  - Right: Light Mode Laptop
 */

export function initHeroCable() {
  // Cable simulation removed to improve performance.
  // Theme is now controlled by the navbar theme toggle (adds/removes `light-mode` on <body>).
  return () => {};

          if (p1.pinned) {
            p2.x -= dx * diff;
            p2.y -= dy * diff;
          } else if (p2.pinned || (i + 1 === lastIdx && pluggedState !== 'none')) {
            p1.x += dx * diff;
            p1.y += dy * diff;
          } else {
            p1.x += dx * diff * 0.5;
            p1.y += dy * diff * 0.5;
            p2.x -= dx * diff * 0.5;
            p2.y -= dy * diff * 0.5;
          }
        }
      }

      // Re-enforce point & continuous segment collision during relaxation
      for (let i = 1; i < points.length; i++) {
        if (i === lastIdx && pluggedState !== 'none') continue;
        resolvePointBoxCollision(points[i], 10);

        if (i < points.length - 1) {
          resolveSegmentBoxCollision(points[i], points[i + 1], 10);
        }
      }
    }
  }

  // Render Cable & Connectors
  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Update Sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.04;
      if (s.life <= 0) {
        sparks.splice(i, 1);
      } else {
        ctx.save();
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.life;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    if (points.length < 2) return;

    // Draw Cable Glow
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    const lastPt = points[points.length - 1];
    ctx.lineTo(lastPt.x, lastPt.y);

    ctx.strokeStyle = 'rgba(255, 102, 0, 0.4)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#FF5C00';
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.restore();

    // Draw Main Vibrant Orange Cable
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(lastPt.x, lastPt.y);

    ctx.strokeStyle = '#FF6600';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Inner bright highlight
    ctx.strokeStyle = '#FFA055';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Draw Cable Origin Base Pedestal Mount (Bottom Center)
    ctx.save();
    ctx.fillStyle = '#FF6600';
    ctx.shadowColor = '#FF6600';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y - 2, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y - 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Cable Tip Plug Head
    const prevPt = points[points.length - 2];
    const angle = Math.atan2(lastPt.y - prevPt.y, lastPt.x - prevPt.x);

    ctx.save();
    ctx.translate(lastPt.x, lastPt.y);
    ctx.rotate(angle);

    // Connector Shell
    ctx.fillStyle = pluggedState !== 'none' ? '#00FF88' : '#FF6600';
    ctx.shadowColor = pluggedState !== 'none' ? '#00FF88' : '#FF6600';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.roundRect(-14, -6, 16, 12, 3);
    ctx.fill();

    // Metallic Metal Tip Pin
    ctx.fillStyle = '#E5E5E7';
    ctx.fillRect(2, -3.5, 7, 7);

    // LED status light on plug tip
    ctx.fillStyle = pluggedState !== 'none' ? '#FFFFFF' : '#FFD700';
    ctx.beginPath();
    ctx.arc(-6, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function loop() {
    if (!alive) return;
    updatePhysics();
    draw();
    animId = requestAnimationFrame(loop);
  }

  loop();

  return () => {
    alive = false;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('resize', resize);
  };
}
