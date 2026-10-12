// Secondary screens: the photo gallery, the letter, and the gift reveal.
// All three share one modal shell defined in index.html. Closing any of them
// returns to the accepted (YES) screen. That screen is never touched here.

import { content } from "../config/content.js";
import { reducedMotion } from "./effects.js";
import { playSurprise } from "./surprise.js";

const modal = document.getElementById("modal");
const panel = document.getElementById("modal-panel");
const titleEl = document.getElementById("modal-title");
const bodyEl = document.getElementById("modal-body");
const closeBtn = document.getElementById("modal-close");

let activeType = null;     // "gallery" | "letter" | "gift" | null
let returnFocusTo = null;  // element that opened the modal, to restore focus on close
let onCloseCallback = () => {};

const TITLES = {
  gallery: "Our Moments",
  letter: "A Letter for You",
  gift: "A Little Gift",
};

/** Wire up close controls once at startup. */
export function initModals({ onClose }) {
  onCloseCallback = onClose;
  closeBtn.addEventListener("click", closeModal);
  modal.querySelector("[data-close]").addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeType) closeModal();
  });
}

export function isModalOpen() {
  return activeType !== null;
}

/** Open a modal by type. Ignores duplicate opens so animations never stack. */
export function openModal(type, trigger = null) {
  if (activeType || !TITLES[type]) return;
  activeType = type;
  returnFocusTo = trigger;

  titleEl.textContent = TITLES[type];
  bodyEl.replaceChildren();
  if (type === "gallery") bodyEl.append(buildGallery());
  if (type === "letter") bodyEl.append(buildLetter());
  if (type === "gift") bodyEl.append(buildGift());

  modal.hidden = false;
  panel.focus();
}

/** Close the active modal and return focus to whatever opened it. */
export function closeModal() {
  if (!activeType) return;
  activeType = null;
  modal.hidden = true;
  bodyEl.replaceChildren(); // stop any running gallery/gift content
  if (returnFocusTo && document.contains(returnFocusTo)) returnFocusTo.focus();
  returnFocusTo = null;
  onCloseCallback();
}

// ---------------------------------------------------------------------------
// Gallery: responsive, navigable, with captions and placeholders for photos
// that haven't been added yet.
// ---------------------------------------------------------------------------
function buildGallery() {
  const moments = content.moments.length ? content.moments : [{ src: "", caption: "" }];
  let index = 0;

  const wrap = el("div");
  const stage = el("div", "gallery-stage");
  const caption = el("p", "gallery-caption");
  const nav = el("div", "gallery-nav");
  const prev = el("button", "nav-btn", "← Prev");
  const next = el("button", "nav-btn", "Next →");
  const count = el("span", "gallery-count");
  prev.type = next.type = "button";
  prev.setAttribute("aria-label", "Previous photo");
  next.setAttribute("aria-label", "Next photo");
  nav.append(prev, count, next);
  wrap.append(stage, caption, nav);

  function show(i) {
    index = (i + moments.length) % moments.length;
    const { src, caption: text } = moments[index];
    stage.replaceChildren();

    const img = document.createElement("img");
    img.alt = text || `Photo ${index + 1}`;
    img.src = src;
    img.onerror = () => {
      // Photo missing: show a neutral placeholder instead of a broken image.
      stage.replaceChildren(placeholder(`Add photo ${index + 1}`, src));
    };
    stage.append(img);

    caption.textContent = text;
    count.textContent = `${index + 1} / ${moments.length}`;
    const single = moments.length < 2;
    prev.disabled = next.disabled = single;
  }

  prev.addEventListener("click", () => show(index - 1));
  next.addEventListener("click", () => show(index + 1));
  show(0);
  return wrap;
}

// ---------------------------------------------------------------------------
// Letter: paper-like card. Text is inserted with textContent (never innerHTML).
// ---------------------------------------------------------------------------
function buildLetter() {
  const wrap = el("div");
  const paper = el("div", "letter-paper");
  const paragraphs = content.letter.text.split(/\n\s*\n/);
  for (const block of paragraphs) {
    const p = el("p");
    p.textContent = block.trim();
    paper.append(p);
  }
  const close = el("div", "letter-close");
  const btn = el("button", "btn-soft", "Back to our yes 💗");
  btn.type = "button";
  btn.addEventListener("click", closeModal);
  close.append(btn);
  wrap.append(paper, close);
  return wrap;
}

// ---------------------------------------------------------------------------
// Gift: tap the box to open it. Shows the image when supplied, otherwise a
// built-in fallback card, so the feature works before a gift is added.
// ---------------------------------------------------------------------------
function buildGift() {
  const wrap = el("div", "gift-wrap");
  const box = el("button", "gift-box");
  box.type = "button";
  box.setAttribute("aria-label", "Open the gift");
  box.innerHTML = '<span class="gift-lid"></span><span class="gift-base"></span>';

  const reveal = el("div", "gift-reveal");
  reveal.hidden = true;

  box.addEventListener("click", () => {
    if (box.classList.contains("is-open")) return; // prevent duplicate reveals
    box.classList.add("is-open");
    box.disabled = true;
    box.setAttribute("aria-label", "Gift opened");
    playSurprise(content.gift.surpriseMessage);
    setTimeout(() => {
      reveal.replaceChildren(giftContent());
      reveal.hidden = false;
    }, reducedMotion ? 0 : 600);
  });

  wrap.append(box, reveal);
  return wrap;
}

function giftContent() {
  const frag = document.createDocumentFragment();
  const img = document.createElement("img");
  img.alt = content.gift.alt;
  img.src = content.gift.image;
  img.onerror = () => {
    img.replaceWith(fallbackGiftCard());
  };
  frag.append(img);

  const msg = el("p", "gift-message");
  msg.textContent = content.gift.message;
  frag.append(msg);
  return frag;
}

function fallbackGiftCard() {
  const card = el("div", "gift-fallback-card");
  const icon = el("span", null, "🎁");
  card.append(icon, document.createTextNode("Something special is on its way."));
  return card;
}

// ---------------------------------------------------------------------------
// Small DOM helpers
// ---------------------------------------------------------------------------
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function placeholder(label, src) {
  const box = el("div", "gallery-placeholder");
  box.append(el("strong", null, "📷"), document.createTextNode(label));
  if (src) {
    const hint = el("small", null, `(${src})`);
    hint.style.display = "block";
    hint.style.marginTop = "6px";
    box.append(hint);
  }
  return box;
}
