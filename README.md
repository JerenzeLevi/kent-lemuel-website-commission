# Proposal Website

A romantic, interactive proposal page: a cat GIF, a playful NO button that dodges
(four clicks reach a gentle patience message), and a celebration screen with
"Our Moments", "A Letter for You", and "A Little Gift".

Built with Vite + vanilla JavaScript. No backend, no database.

## Setup and running

```bash
npm install
npm run dev        # local dev server, http://localhost:5173
npm run build      # production build into dist/
npm run preview    # preview the production build
```

## Replacing assets

Put files in `public/assets/`. Paths in the config are relative to `public/`.

| What | Where | Notes |
| --- | --- | --- |
| Background | `public/assets/background.jpg` | Already in place (your image). If you swap in a `.png`, update `backgroundImage` in `src/config/content.js` and `--bg-image` in `src/styles/main.css`. |
| Cat GIFs | `public/assets/cat-idle.gif`, `cat-no.gif`, `cat-yes.gif`, `cat-celebration.gif` | Optional until you have them. A 🐱 fallback shows if missing. Celebration GIF falls back to `cat-yes.gif`. |
| Photos | `public/assets/moments/1.jpg` … `5.jpg` | Listed in `moments` in the config. Add entries there for more photos. |
| Gift image | `public/assets/gift.png` | Optional. A built-in fallback card shows if missing. |

## Customizing text

Everything personal is in **`src/config/content.js`**:

- `kicker`, `question`: the heading and the proposal question.
- `yesLabel`, `noLabel`: button text.
- `patienceMessage`: the message shown after the fourth NO.
- `celebrationHeading`, `celebrationSubtext`: the YES screen text. The heading must stay "OMG, you said yessss".
- `moments`: the gallery. Each entry is `{ src, caption }`. Add or remove entries freely.
- `letter.text`: the letter. Paragraphs are separated by a blank line. Plain text only.
- `gift.message`, `gift.image`, `gift.alt`: the gift reveal.
- `cursorEvasion`: set to `false` to turn off the desktop NO dodge. Touch devices never dodge.
- `celebrationSound`: set to `false` to turn off the YES chime.

## Deploying (Vercel)

Vercel detects Vite automatically. Build command `npm run build`, output directory `dist`.

- Dashboard: import the Git repository, keep the detected Vite settings, and deploy.
- CLI: `npx vercel` for a preview, `npx vercel --prod` for production.

Any static host works too: upload the contents of `dist/` after `npm run build`.

## Behavior notes

- Desktop: NO drifts a short distance from the cursor, at most six times per attempt, with a cooldown so it is always clickable.
- Touch: no cursor dodge. NO moves to a new safe spot after each tap.
- Reduced motion: animations, hearts, and confetti are reduced or removed.
- Patience screen: a "Back to the question" link returns to the proposal, with the NO counter reset.
