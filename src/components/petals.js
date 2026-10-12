// Flowing rose petals on a full-screen canvas.
// Petals ride a slow wind field, tumble in 3D (a cosine "flip" on the x-axis),
// and are gently pushed aside by the pointer. Pure canvas, no dependencies.
// Skipped entirely under prefers-reduced-motion.

import { reducedMotion } from "./effects.js";

const PETAL_COLORS = [
  ["#ffd6e5", "#e0729a"],
  ["#ffe9f1", "#d9557f"],
  ["#fbc2d8", "#c9477a"],
  ["#fff0f6", "#e88fb0"],
];

/** Start the petal flow. Returns a stop() function. */
export function startPetals(canvas) {
  if (reducedMotion || !canvas.getContext) return () => {};

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let petals = [];
  let rafId = 0;
  let last = performance.now();
  let time = 0;
  const pointer = { x: -999, y: -999 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Fewer petals on small screens keeps the phone smooth.
    const count = Math.round(Math.min(40, Math.max(18, (width * height) / 36000)));
    petals = Array.from({ length: count }, () => makePetal(true));
  }

  function makePetal(anywhere) {
    const size = 12 + Math.random() * 10;
    const [light, deep] = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
    return {
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : -size - Math.random() * 60,
      size,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.9,        // rad/s
      flip: Math.random() * Math.PI * 2,        // phase of the 3D tumble
      flipSpeed: 1.2 + Math.random() * 1.8,
      drift: 0.8 + Math.random() * 0.8,         // how fast it falls
      phase: Math.random() * 1000,              // each petal sways on its own cycle
      light,
      deep,
      alpha: 0.7 + Math.random() * 0.3,
    };
  }

  // Wind: a slow, layered sideways current that changes with height and time.
  function wind(x, y, t) {
    return (
      Math.sin(t * 0.35 + y * 0.0035) * 0.55 +
      Math.sin(t * 0.13 + x * 0.002) * 0.35 +
      0.25
    );
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    // 3D tumble: squash the petal horizontally as it turns.
    ctx.scale(Math.max(0.12, Math.abs(Math.cos(p.flip))), 1);
    ctx.globalAlpha = p.alpha * (0.75 + 0.25 * Math.abs(Math.cos(p.flip)));

    const s = p.size;
    const grad = ctx.createLinearGradient(-s, -s, s, s);
    grad.addColorStop(0, p.light);
    grad.addColorStop(1, p.deep);
    ctx.fillStyle = grad;

    // Teardrop petal: a pointed tip, rounded base.
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.9, -s * 0.7, s * 0.9, s * 0.5, 0, s * 0.8);
    ctx.bezierCurveTo(-s * 0.9, s * 0.5, -s * 0.9, -s * 0.7, 0, -s);
    ctx.fill();

    // A soft center vein for a bit of rose detail.
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7);
    ctx.quadraticCurveTo(s * 0.12, 0, 0, s * 0.6);
    ctx.stroke();
    ctx.restore();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); // clamp so tab switches don't jump
    last = now;
    time += dt;

    ctx.clearRect(0, 0, width, height);

    for (const p of petals) {
      // Flow: wind pushes sideways, gravity-like drift pulls down.
      const w = wind(p.x, p.y, time + p.phase * 0.01);
      p.x += (w * 22 + Math.sin(time * 1.1 + p.phase) * 10) * dt;
      p.y += p.drift * 28 * dt;
      p.rot += p.spin * dt;
      p.flip += p.flipSpeed * dt;

      // Gentle push away from the pointer.
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 130 * 130 && d2 > 0.01) {
        const force = (130 * 130 - d2) / (130 * 130);
        p.x += (dx / Math.sqrt(d2)) * force * 160 * dt;
        p.y += (dy / Math.sqrt(d2)) * force * 120 * dt;
      }

      // Wrap horizontally; recycle petals that fall off the bottom.
      if (p.x < -30) p.x = width + 30;
      if (p.x > width + 30) p.x = -30;
      if (p.y > height + 30) Object.assign(p, makePetal(false));

      drawPetal(p);
    }

    rafId = requestAnimationFrame(frame);
  }

  function onPointer(e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  }

  function onLeave() {
    pointer.x = -999;
    pointer.y = -999;
  }

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("pointerleave", onLeave);
  rafId = requestAnimationFrame((t) => {
    last = t;
    frame(t);
  });

  return function stop() {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("pointerleave", onLeave);
  };
}
