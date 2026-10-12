// Rose cursor: an SVG rose handed to CSS as --rose-cursor, so every element
// (body, buttons, cards) uses it. The hotspot sits at the rose's center.
// Browsers cap cursor images at 32px, so the rose is drawn at 32x32.

export const ROSE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <path d="M22 27c3.2-.6 6-3.4 6.2-6.6-3.2.2-5.8 2.6-6.2 6.6z" fill="#8fc49a" stroke="#5f9a6c" stroke-width="0.8"/>
  <path d="M16 3.5c-6.4 0-10.5 5.1-10.5 10.3 0 4.5 2.9 8.1 6.8 9.4-1.3 1.2-2.3 2.3-2.3 2.3 1.7-.5 3.7-1.4 5.3-2.7 1.6 1.3 3.6 2.2 5.3 2.7 0 0-1-1.1-2.3-2.3 3.9-1.3 6.8-4.9 6.8-9.4 0-5.2-4.1-10.3-10.6-10.3z" fill="#f49bbd" stroke="#c9477a" stroke-width="1.1"/>
  <path d="M16 7.4c-3.6 0-5.7 2.8-5.7 5.7 0 2.6 1.6 4.4 3.8 5.1 1.6-1.6 3.1-2.9 3.1-5.2 0-1.5-.6-2.4-1.6-2.4" fill="none" stroke="#c9477a" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M16 12.1c-1.6 0-2.5 1-2.5 2.2 0 1.2.9 2.1 2.2 2.1 1.5 0 2.5-1.1 2.5-2.3" fill="none" stroke="#b03c6a" stroke-width="1.1" stroke-linecap="round"/>
  <circle cx="16" cy="16" r="1.4" fill="#b03c6a"/>
</svg>`;

/** Install the rose cursor. Call once at startup; a no-op on touch-only devices. */
export function installRoseCursor() {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!finePointer.matches) return;
  const url = `url("data:image/svg+xml,${encodeURIComponent(ROSE_SVG.trim())}") 16 16`;
  document.documentElement.style.setProperty("--rose-cursor", url);
}
