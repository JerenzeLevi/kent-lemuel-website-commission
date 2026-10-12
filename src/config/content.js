// ============================================================================
// PERSONALIZE HERE
// Everything you are likely to change lives in this file:
// wording, names, cat GIFs, photos + captions, the letter, and the gift.
// Asset paths are relative to /public (so "/assets/x.jpg" = public/assets/x.jpg).
// ============================================================================

export const content = {
  // --- Page background -------------------------------------------------------
  // Your existing background. The spec suggested background.png; your file is
  // background.jpg, so the path below points at that. To use a different file,
  // change the name here AND in src/styles/main.css (--bg-image).
  backgroundImage: "/assets/background.jpg",

  // --- Initial proposal screen ----------------------------------------------
  kicker: "Hey, there's something I want to ask you...", // REPLACE: romantic heading
  question: "Jehainne, will you be my Girlfriend?",        // REPLACE: the proposal question

  // Cat GIFs. Replace the files in public/assets/ with your own GIFs; if a file
  // is missing, a friendly 🐱 fallback is shown instead and the layout holds.
  cats: {
    idle: "/assets/cat-idle.gif",             // initial animation
    no: "/assets/cat-no.gif",                 // shown when NO is clicked
    yes: "/assets/cat-yes.gif",               // shown when YES is clicked
    celebration: "/assets/cat-celebration.gif", // optional, on the YES screen
  },

  // --- NO button -------------------------------------------------------------
  noLabel: "NO 🙈",
  // Desktop-only: the NO button drifts away from the cursor a few times.
  // Set to false to disable. Touch devices never use it regardless.
  cursorEvasion: true,

  // The final message after the 4th NO.
  patienceMessage:
    "I understand, and I will remain patient for you and wait when you are ready.",

  // --- YES screen ------------------------------------------------------------
  yesLabel: "YES 💗",
  celebrationHeading: "OMG, you said yessss", // exact text required by the spec
  celebrationSubtext: "Best decision you've ever made. 💖", // REPLACE: any sweet line
  // Song played at full volume right after YES is tapped (never on page load).
  // If the file is missing or blocked, a short built-in chime plays instead.
  // Audio is taken from the MP4, so the file can stay as it is.
  celebrationSound: true,
  celebrationSong: "/assets/favorite-song.mp4",

  // After YES, the letter opens by itself after a short pause. She can reopen it
  // any time with the "A Letter for You" button.
  autoOpenLetter: true,
  autoOpenLetterDelayMs: 2200,

  // --- Our Moments (gallery) -------------------------------------------------
  // Add or remove entries freely. Put the photo in public/assets/moments/ and
  // reference it as "/assets/moments/photo-01.jpg". A missing photo shows a
  // neutral placeholder card, so nothing breaks while you're still gathering them.
  moments: [
    { src: "/assets/moments/1.jpg", caption: "Our first picture during duty and i was happy :))" },
    { src: "/assets/moments/2.jpg", caption: "Receiving something from you made me so happy, it was my first time that i had been given such gift! :)) thank you so much for healing my inner child" },
    { src: "/assets/moments/3.jpg", caption: "You are so cute here" },
    { src: "/assets/moments/4.jpg", caption: "The moment you werent looking back, i was here admiring you and yearning for you" },
    { src: "/assets/moments/5.jpg", caption: "I was so happy giving you flowers!" },
  ],

  // --- A Letter for You ------------------------------------------------------
  // Paragraphs are separated by a blank line. Plain text only (no HTML).
  letter: {
    text: `Hello, Jehainne.

From the bottom of my heart, I've always known what my heart desires, and it has always been you.

From the very first moment my eyes fell upon you, I knew that I genuinely wanted you in my life. Not as someone temporary, nor as a fleeting chapter in my story, but as someone I truly wish to love, cherish, and keep close to my heart.

I know you're already aware of my feelings for you, of my efforts, my love, my care, and my patience. And honestly, I love you more than words could ever explain. All I want is to make you happy and to become your safe place, someone you can turn to without fear, someone who will listen without judgment, and someone who will remind you that you are always worthy of love, even on the days when you find it difficult to believe that yourself.

I may not be the perfect man, and I know that love is not proven through words alone. But with everything I have in me, I promise to do my very best to show you how much you mean to me through my actions, my consistency, and the way I treat you. I want to be someone who makes you feel loved, understood, appreciated, and safe. And if you'll allow me, I want to earn that place in your heart, not merely through the promises I make today, but through the love I continue to show you every day.

To the prettiest girl, my dear Jehainne, may I have the honor of being your boyfriend? ♡`,
  },

  // --- A Little Gift ---------------------------------------------------------
  gift: {
    image: "/assets/gift.png",  // optional; if missing, a built-in fallback design is shown
    alt: "A little gift",
    message: "A little something, just for you. 🎁", // REPLACE: your gift message
    // Shown with the rose and fireworks the moment the gift box is opened.
    surpriseMessage: "I love youu",
  },
};
