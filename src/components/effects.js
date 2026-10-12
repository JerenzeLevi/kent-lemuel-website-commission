// Decorative effects: confetti, sparkles, and the optional YES chime.
// Everything here respects prefers-reduced-motion (checked via `reducedMotion`).
// Background petals live in petals.js.

export const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Colorful confetti burst for the YES celebration. Self-cleans. */
export function burstConfetti(count = 70) {
  if (reducedMotion) return;
  const colors = ["#e0729a", "#f7b6cf", "#ffffff", "#f5d88a", "#c9b6e8"];
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    document.body.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove());
  }
}

/** Little sparkles that fly out from an element (used on the 3rd NO click). */
export function sparkleAt(element, count = 8) {
  if (reducedMotion) return;
  const rect = element.getBoundingClientRect();
  const parent = element.parentElement;
  const base = parent.getBoundingClientRect();
  const originX = rect.left - base.left + rect.width / 2;
  const originY = rect.top - base.top + rect.height / 2;
  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    s.className = "sparkle";
    s.textContent = i % 2 ? "✨" : "💫";
    const angle = (Math.PI * 2 * i) / count;
    const dist = 60 + Math.random() * 30;
    s.style.left = `${originX}px`;
    s.style.top = `${originY}px`;
    s.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    s.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    parent.appendChild(s);
    s.addEventListener("animationend", () => s.remove());
  }
}

// Keep a reference so the song isn't garbage-collected mid-playback.
let songPlayer = null;

/**
 * Play the YES song at full volume. Must be called from the YES click, so the
 * browser allows it. Falls back to the chime if the file is missing or blocked.
 */
export function playSong(src) {
  try {
    if (songPlayer) {
      songPlayer.pause();
    }
    songPlayer = new Audio(src);
    songPlayer.volume = 1;
    songPlayer.play().catch(() => playChime());
  } catch {
    playChime();
  }
}

/**
 * Short three-note chime, synthesized with WebAudio so no audio file is needed.
 * Must be called from a user gesture (the YES click), so it never plays on page load.
 */
export function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.16;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.65);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1500);
  } catch {
    // Audio is optional; silently skip if the browser refuses.
  }
}
