// Entry point. Owns the proposal state and every screen transition.
// Single source of truth: `state` below. Screens only change through showScreen().

import "./styles/main.css";
import { content } from "./config/content.js";
import { reducedMotion, burstConfetti, sparkleAt, playSong } from "./components/effects.js";
import { initModals, openModal, isModalOpen } from "./components/modals.js";
import { startPetals } from "./components/petals.js";
import { installRoseCursor } from "./components/cursor.js";

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------
const MAX_EVASIONS = 10;         // desktop dodges per attempt; after this NO stays put so it's always clickable
const EVADE_COOLDOWN_MS = 380;   // gap between cursor dodges, so the user can still land a click
const EVADE_RADIUS_PX = 110;     // how close the cursor must get before NO pops away
const POP_MIN_PX = 110;          // every pop jumps at least this far, so it's clearly goofy
const BUTTON_GAP_PX = 14;        // minimum clearance between NO and YES

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  screen: "proposal",    // "proposal" | "patience" | "accepted"
  noClicks: 0,           // actual NO activations (clicks/taps/Enter), never mouse movement
  moved: false,          // has NO left its default spot?
  evasions: 0,           // desktop cursor-dodges so far
  lastEvadeAt: -Infinity,
};

// ---------------------------------------------------------------------------
// Elements
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const screens = {
  proposal: $("screen-proposal"),
  patience: $("screen-patience"),
  accepted: $("screen-accepted"),
};
const stage = $("stage");
const yesBtn = $("yes-btn");
const noBtn = $("no-btn");
const catIdle = $("cat");
const catIdleFallback = $("cat-fallback");
const catPatience = $("cat-patience");
const catPatienceFallback = catPatience.nextElementSibling;
const catYes = $("cat-yes");
const catYesFallback = catYes.nextElementSibling;

// ---------------------------------------------------------------------------
// Text from config
// ---------------------------------------------------------------------------
$("kicker").textContent = content.kicker;
$("question").textContent = content.question;
yesBtn.textContent = content.yesLabel;
noBtn.textContent = content.noLabel;
$("patience-message").textContent = content.patienceMessage;
$("celebration-heading").textContent = content.celebrationHeading;
$("celebration-sub").textContent = content.celebrationSubtext;

// ---------------------------------------------------------------------------
// Screen transitions (the only place screens change)
// ---------------------------------------------------------------------------
function showScreen(name) {
  state.screen = name;
  for (const [key, el] of Object.entries(screens)) {
    el.hidden = key !== name;
  }
}

// ---------------------------------------------------------------------------
// Cat GIFs: a fixed-size frame with a fallback when a GIF is missing.
// `sources` is tried in order, so the optional celebration GIF can fall back to cat-yes.
// ---------------------------------------------------------------------------
function loadCat(img, fallback, sources) {
  let i = 0;
  const tryNext = () => {
    if (i >= sources.length) {
      img.hidden = true;
      fallback.hidden = false;
      return;
    }
    img.hidden = false;
    fallback.hidden = true;
    img.onerror = () => {
      i += 1;
      tryNext();
    };
    img.src = sources[i];
  };
  tryNext();
}

// ---------------------------------------------------------------------------
// NO button placement
// ---------------------------------------------------------------------------
/**
 * Layout box of a stage button: position from its style, size from offset*.
 * Unlike getBoundingClientRect, this ignores the pop's scale/rotate, which
 * would otherwise make the button look smaller than it is mid-animation.
 */
function rectInStage(el) {
  return {
    left: parseFloat(el.style.left) || 0,
    top: parseFloat(el.style.top) || 0,
    width: el.offsetWidth,
    height: el.offsetHeight,
  };
}

function overlapsYes(x, y, w, h) {
  const yes = rectInStage(yesBtn);
  return !(
    x + w + BUTTON_GAP_PX < yes.left ||
    x > yes.left + yes.width + BUTTON_GAP_PX ||
    y + h + BUTTON_GAP_PX < yes.top ||
    y > yes.top + yes.height + BUTTON_GAP_PX
  );
}

/**
 * Pick a random valid spot for NO inside the stage, away from YES.
 * With `from`, the spot is at least `minDist` px from that point, so every
 * pop is a visible jump instead of a twitch.
 */
function pickNoSpot({ from = null, minDist = 0 } = {}) {
  const s = stage.getBoundingClientRect();
  const { width: w, height: h } = rectInStage(noBtn);
  const maxX = Math.max(8, s.width - w - 8);
  const maxY = Math.max(8, s.height - h - 8);

  // Try for the full jump first; relax the distance only if the stage is too cramped.
  for (const need of [minDist, minDist * 0.6, 0]) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const x = 8 + Math.random() * (maxX - 8);
      const y = 8 + Math.random() * (maxY - 8);
      if (from && Math.hypot(x - from.left, y - from.top) < need) continue;
      if (!overlapsYes(x, y, w, h)) return { left: x, top: y };
    }
  }

  // Fallback: the far corner opposite YES, which is always clear of it.
  const yes = rectInStage(yesBtn);
  const x = yes.left > s.width / 2 ? 8 : maxX;
  return { left: x, top: maxY };
}

/** Current NO position inside the stage, read from its style (stable mid-transition). */
function currentNoSpot() {
  return { left: parseFloat(noBtn.style.left) || 0, top: parseFloat(noBtn.style.top) || 0 };
}

function applyNoPosition({ left, top }) {
  noBtn.style.left = `${Math.round(left)}px`;
  noBtn.style.top = `${Math.round(top)}px`;
}

/** Default layout: YES and NO side by side, centered in the stage. */
function layoutButtons() {
  if (state.moved) {
    applyNoPosition(pickNoSpot());
    return;
  }
  const s = stage.getBoundingClientRect();
  const y = yesBtn.offsetHeight;
  const top = (s.height - y) / 2;
  const yesW = yesBtn.offsetWidth;
  const noW = noBtn.offsetWidth;
  const gap = 12;
  const total = yesW + gap + noW;
  const startX = Math.max(8, (s.width - total) / 2);
  yesBtn.style.left = `${Math.round(startX)}px`;
  yesBtn.style.top = `${Math.round(top)}px`;
  applyNoPosition({ left: startX + yesW + gap, top });
}

/** Restart a CSS animation class on the NO button, even if it just played. */
function playNoAnimation(className) {
  noBtn.classList.remove("is-pop", "is-teleport");
  void noBtn.offsetWidth; // force reflow so the animation restarts
  noBtn.classList.add(className);
}

// ---------------------------------------------------------------------------
// NO activations: exactly four, counted on real clicks/taps/Enter presses.
// ---------------------------------------------------------------------------
function handleNoActivation() {
  if (state.screen !== "proposal" || isModalOpen()) return;

  state.noClicks += 1;
  const n = state.noClicks;
  loadCat(catIdle, catIdleFallback, [content.cats.no]);

  if (n <= 3) {
    popNo();
    if (n === 3) sparkleAt(noBtn);
  } else if (n >= 4) {
    // Final activation: one teleport, then the patience screen. The button is
    // disabled first so no extra click can trigger it again.
    noBtn.disabled = true;
    playNoAnimation("is-teleport");
    setTimeout(showPatience, reducedMotion ? 0 : 700);
  }
}

/** The goofy pop: squash, spin, and jump to a far spot inside the stage. */
function popNo() {
  state.moved = true;
  playNoAnimation("is-pop");
  applyNoPosition(pickNoSpot({ from: currentNoSpot(), minDist: POP_MIN_PX }));
}

function showPatience() {
  loadCat(catPatience, catPatienceFallback, [content.cats.no]);
  showScreen("patience");
}

// ---------------------------------------------------------------------------
// Desktop-only cursor avoidance. Touch devices never get this (no hover).
// Bounded by MAX_EVASIONS and a cooldown, so the button is always reachable.
// ---------------------------------------------------------------------------
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

function maybeEvade(event) {
  if (!content.cursorEvasion || reducedMotion || !finePointer.matches) return;
  if (state.screen !== "proposal" || noBtn.disabled || isModalOpen()) return;
  if (state.evasions >= MAX_EVASIONS) return;

  const now = performance.now();
  if (now - state.lastEvadeAt < EVADE_COOLDOWN_MS) return;

  const r = noBtn.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  if (Math.hypot(event.clientX - cx, event.clientY - cy) > EVADE_RADIUS_PX) return;

  // Cursor got close: pop away, so NO seems to be running from the mouse.
  state.evasions += 1;
  state.lastEvadeAt = now;
  popNo();
}

// ---------------------------------------------------------------------------
// YES: accepted. Stops all NO behavior and locks the original buttons.
// ---------------------------------------------------------------------------
function handleYes() {
  if (state.screen !== "proposal") return;

  yesBtn.disabled = true;
  noBtn.disabled = true;
  loadCat(catYes, catYesFallback, [content.cats.celebration, content.cats.yes]);
  showScreen("accepted");

  burstConfetti();
  if (content.celebrationSound) playSong(content.celebrationSong);

  // Let the celebration land first, then open the letter by itself.
  if (content.autoOpenLetter) {
    setTimeout(() => {
      if (state.screen !== "accepted") return; // ignore if the screen changed meanwhile
      openModal("letter", document.querySelector('[data-open="letter"]'));
    }, reducedMotion ? 0 : content.autoOpenLetterDelayMs);
  }
}

// ---------------------------------------------------------------------------
// Patience screen "back" control: a deliberate way to return to the question.
// ---------------------------------------------------------------------------
function resetProposal() {
  state.noClicks = 0;
  state.moved = false;
  state.evasions = 0;
  noBtn.disabled = false;
  noBtn.classList.remove("is-pop", "is-teleport");
  loadCat(catIdle, catIdleFallback, [content.cats.idle]);
  showScreen("proposal");
  layoutButtons();
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
noBtn.addEventListener("click", handleNoActivation);
yesBtn.addEventListener("click", handleYes);
stage.addEventListener("pointermove", maybeEvade);
$("patience-back").addEventListener("click", resetProposal);

document.querySelectorAll("[data-open]").forEach((btn) => {
  btn.addEventListener("click", () => {
    // Secondary screens only exist on the accepted screen; the YES state is untouched.
    if (state.screen !== "accepted") return;
    openModal(btn.dataset.open, btn);
  });
});

initModals({ onClose: () => {} }); // closing a modal leaves the accepted screen as it is

// Re-layout whenever the stage changes size (window resize, rotation, tablet split view).
// ResizeObserver catches every size change, unlike a debounced window "resize" listener.
new ResizeObserver(() => {
  if (state.screen !== "proposal") return;
  if (!state.moved) {
    layoutButtons();
    return;
  }
  // NO already moved: if it's now outside the stage, pop it to a valid spot.
  const { width, height } = stage.getBoundingClientRect();
  const spot = currentNoSpot();
  const outside = spot.left + noBtn.offsetWidth > width || spot.top + noBtn.offsetHeight > height;
  if (outside) applyNoPosition(pickNoSpot());
}).observe(stage);

// Initial load. Other GIFs load on demand when their screen appears.
loadCat(catIdle, catIdleFallback, [content.cats.idle]);
showScreen("proposal");
layoutButtons();
installRoseCursor();
startPetals($("petals"));
