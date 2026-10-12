// Gift surprise: a full-screen overlay with fireworks, a rose that pops in,
// and a message. Plays once per click on the gift box. Tap anywhere to dismiss,
// or it closes itself after a while. The gift reveal underneath is untouched.

import { ROSE_SVG } from "./cursor.js";
import { reducedMotion } from "./effects.js";

const SHOW_MS = 8000;               // how long the show runs before it fades out
const ROCKET_EVERY_MS = 420;        // pace of new launches
const COLORS = ["#ff6fa5", "#ffd1e3", "#ffffff", "#f5c96a", "#c9b6e8", "#ff9fc2"];

let active = null; // the overlay currently on screen, so clicks can't stack shows

/** Show the fireworks + rose + message. Safe to call repeatedly; only one runs at a time. */
export function playSurprise(message) {
  if (active) return;

  const overlay = document.createElement("div");
  overlay.className = "surprise";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");

  const canvas = document.createElement("canvas");
  canvas.className = "surprise-canvas";
  overlay.append(canvas);

  const content = document.createElement("div");
  content.className = "surprise-content";

  const rose = document.createElement("div");
  rose.className = "surprise-rose";
  rose.innerHTML = ROSE_SVG; // static SVG from cursor.js, not user input
  rose.setAttribute("aria-hidden", "true");

  const text = document.createElement("h3");
  text.className = "surprise-text";
  text.textContent = message; // textContent so the message is never parsed as HTML

  content.append(rose, text);
  overlay.append(content);
  document.body.append(overlay);
  active = overlay;

  const stopFireworks = reducedMotion ? () => {} : runFireworks(canvas);

  const close = () => {
    if (!active) return;
    stopFireworks();
    overlay.classList.add("is-leaving");
    setTimeout(() => {
      overlay.remove();
      active = null;
    }, 500);
  };

  overlay.addEventListener("click", close);
  setTimeout(close, SHOW_MS);
}

// ---------------------------------------------------------------------------
// Fireworks: rockets rise, burst into particles with gravity and fade.
// Returns a stop() function that halts the loop and clears the canvas.
// ---------------------------------------------------------------------------
function runFireworks(canvas) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  let particles = [];
  let rockets = [];
  let rafId = 0;
  let last = performance.now();
  let lastLaunch = -Infinity;
  let elapsed = 0;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function launch() {
    rockets.push({
      x: width * (0.15 + Math.random() * 0.7),
      y: height,
      targetY: height * (0.12 + Math.random() * 0.4),
      vy: -(9 + Math.random() * 4) * 60, // px/s upward
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  }

  function burst(x, y, color) {
    const count = 60 + Math.floor(Math.random() * 30);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.15;
      const speed = 60 + Math.random() * 150;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.9 + Math.random() * 0.7,
        age: 0,
        color: Math.random() < 0.2 ? COLORS[Math.floor(Math.random() * COLORS.length)] : color,
        size: 1.6 + Math.random() * 1.6,
      });
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    elapsed += dt * 1000;

    if (elapsed - lastLaunch > ROCKET_EVERY_MS) {
      launch();
      if (Math.random() < 0.5) launch(); // sometimes two at once: "everywhere"
      lastLaunch = elapsed;
    }

    // Redraw from scratch each frame.
    ctx.clearRect(0, 0, width, height);

    // Rockets climb, then burst when they reach their height.
    rockets = rockets.filter((r) => {
      r.y += r.vy * dt;
      r.vy += 120 * dt; // slow down near the top
      if (r.y <= r.targetY || r.vy >= 0) {
        burst(r.x, r.y, r.color);
        return false;
      }
      ctx.fillStyle = r.color;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });

    // Particles: gravity, drag, and fade.
    particles = particles.filter((p) => {
      p.age += dt;
      if (p.age >= p.life) return false;
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 90 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const alpha = 1 - p.age / p.life;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.6 + 0.4 * alpha), 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
    ctx.globalAlpha = 1;

    rafId = requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  rafId = requestAnimationFrame((t) => {
    last = t;
    launch();
    lastLaunch = 0;
    frame(t);
  });

  return function stop() {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
    ctx.clearRect(0, 0, width, height);
  };
}
