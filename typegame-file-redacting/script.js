// ── GAME CONSTANTS & DATA ──
const DECRYPT_CODE_LENGTH = 10;

// Dossier database containing Dutch spy texts with redacted elements
const DOSSIERS = [
  {
    title: "INFILTRATIE RAPPORT: OPERATIE SPERWER",
    paragraphs: [
      "Op datum van 24 mei 2026 is er een geheime ontmoeting gedetecteerd in <span class='redacted-word' id='redact-0' data-word='BRUSSEL'>REDACTED</span>.",
      "De infiltrant draagt de codenaam <span class='redacted-word' id='redact-1' data-word='NIGHTHAWK'>REDACTED</span> en opereert onder een valse identiteit.",
      "De vijandelijke spion probeert de centrale <span class='redacted-word' id='redact-2' data-word='DATABASE'>REDACTED</span> te hacken om plannen te stelen.",
      "De documenten bevatten gedetailleerde schema's van de nieuwe <span class='redacted-word' id='redact-3' data-word='SUPERCOMPUTER'>REDACTED</span>.",
      "Wees extra voorzichtig: er zijn zwaar bewapende <span class='redacted-word' id='redact-4' data-word='BEWAKERS'>REDACTED</span> bij alle uitgangen."
    ],
    words: ["BRUSSEL", "NIGHTHAWK", "DATABASE", "SUPERCOMPUTER", "BEWAKERS"]
  },
  {
    title: "SABOTAGE LOG: CODE BLAUWE VALK",
    paragraphs: [
      "De vijandelijke basis is gecentreerd op een verborgen eiland in de <span class='redacted-word' id='redact-0' data-word='STILLE OCEAAN'>REDACTED</span>.",
      "De sabotage van de generatoren staat gepland om stipt <span class='redacted-word' id='redact-1' data-word='MIDDERNACHT'>REDACTED</span> uit te voeren.",
      "De hoofdingenieur van het project is bekend als <span class='redacted-word' id='redact-2' data-word='DR. KLAWS'>REDACTED</span> en bewaakt de sleutel.",
      "De spion moet een speciaal <span class='redacted-word' id='redact-3' data-word='SERUM'>REDACTED</span> toedienen om de systemen te deactiveren.",
      "Zodra het alarmsignaal klinkt, start de evacuatie via de <span class='redacted-word' id='redact-4' data-word='HELIKOPTER'>REDACTED</span> op het dak."
    ],
    words: ["STILLE OCEAAN", "MIDDERNACHT", "DR. KLAWS", "SERUM", "HELIKOPTER"]
  },
  {
    title: "TRANSMISSIE LOG: PROJECT APEX",
    paragraphs: [
      "Onze cyber-eenheid heeft een gecodeerd bericht opgevangen van <span class='redacted-word' id='redact-0' data-word='AGENT VICTOR'>REDACTED</span>.",
      "Hij meldt dat het geheime virus genaamd <span class='redacted-word' id='redact-1' data-word='SHADOWBYTE'>REDACTED</span> succesvol is geüpload.",
      "De overdracht vond plaats via een beveiligde server in <span class='redacted-word' id='redact-2' data-word='ZWITSERLAND'>REDACTED</span>.",
      "De decryptiesleutel is momenteel in handen van <span class='redacted-word' id='redact-3' data-word='MINISTER'>REDACTED</span> van defensie.",
      "Als de sleutel lekt, zal de complete <span class='redacted-word' id='redact-4' data-word='REGEERNET'>REDACTED</span> platgelegd worden."
    ],
    words: ["AGENT VICTOR", "SHADOWBYTE", "ZWITSERLAND", "MINISTER", "REGEERNET"]
  }
];

// Briefing narration slides removed (using static HTML slide contents)

// ── STATE VARIABLES ──
let activeDossier = null;
let currentWordIndex = 0;
let currentCode = "";
let codeCursor = 0;
let typedStates = []; // Track correct vs wrong for each typed char in current word code

let running = false;
let testFinished = false;
let startedAt = 0;
let accumulatedTime = 0;
let currentWordStartedAt = 0;
let totalTime = 0;
let timerInterval = null;

// Stats tracking
let totalKeystrokes = 0;
let correctKeystrokes = 0;
let mistakeCount = 0;
let currentStreak = 0;
let maxStreak = 0;
let mistakesPerKey = {}; // For difficult key tracking

// Briefing states
let activeBriefingSlide = 0;
let onboardingComplete = false;
let isDecryptingAnimation = false;

// Camera states
let cameraAnimationId = null;
let currentCameraX = 0;
let currentCameraY = 0;
let currentCameraScale = 1.0;

// Audio
let audioCtx = null;
let soundEnabled = true;

// ── DOM SELECTORS ──
const timerEl = document.getElementById("timer");
const liveCpmEl = document.getElementById("liveCpm");
const mistakeCountEl = document.getElementById("mistakeCount");
const accuracyEl = document.getElementById("accuracy");

const startButton = document.getElementById("startButton");
const finishButton = document.getElementById("finishButton");
const resetButton = document.getElementById("resetButton");

const spacebarAdvanceBtn = document.getElementById("spacebarAdvanceBtn");

const storyStage = document.getElementById("storyStage");
const missionLayout = document.getElementById("missionLayout");
const resultPanel = document.getElementById("resultPanel");
const missionStage = document.getElementById("missionStage");
const morphFlash = document.getElementById("morphFlash");

const missionMessage = document.getElementById("missionMessage");

const difficultyDropdown = document.getElementById("difficultyDropdown");
const difficultyDropdownHeader = document.getElementById("difficultyDropdownHeader");
const currentDiffDisplay = document.getElementById("currentDiffDisplay");
const difficultyOptions = document.querySelectorAll(".dropdown-list li");
let selectedDifficulty = "easy"; // easy, medium, hard, expert

const promptTextEl = document.getElementById("promptText");
const codeLabelEl = document.getElementById("codeLabel");
const typingInput = document.getElementById("typingInput");
const typingOverlay = document.getElementById("typingOverlay");
const overlayMessage = document.getElementById("overlayMessage");
const terminalPanel = document.getElementById("dossierCodePanel");
const lockIcon = document.getElementById("lockIcon");
const unlockIcon = document.getElementById("unlockIcon");

const dossierViewport = document.getElementById("dossierViewport");
const classifiedDoc = document.getElementById("classifiedDoc");
const documentTextContainer = document.getElementById("documentText");
const docStamp = document.getElementById("docStamp");
const missionStatus = document.getElementById("missionStatus");
const decryptFill = document.getElementById("decryptFill");
const uploadPercent = document.getElementById("uploadPercent");
const reticleTarget = document.getElementById("reticleTarget");

const completeCpm = document.getElementById("completeCpm");
const completeAccuracy = document.getElementById("completeAccuracy");
const completeStreak = document.getElementById("completeStreak");
const completeDifficultKey = document.getElementById("completeDifficultKey");
const completeCoins = document.getElementById("completeCoins");
const rankBadge = document.getElementById("rankBadge");
const cpmCoinsReward = document.getElementById("cpmCoinsReward");
const precisionCoinsReward = document.getElementById("precisionCoinsReward");
const streakCoinsReward = document.getElementById("streakCoinsReward");
const completionCoinsReward = document.getElementById("completionCoinsReward");
const retryResultButton = document.getElementById("retryResultButton");
const soundToggle = document.getElementById("soundToggle");
const couponCode = document.getElementById("couponCode");
const finishSpaceHint = document.getElementById("finishSpaceHint");

// ── NATIVE WEB AUDIO FX SYNTHESIZER ──
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playSynthSound(type) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const now = ctx.currentTime;

    if (type === "click") {
      // Short keyboard click sound (white noise + sine)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === "error") {
      // Hacking terminal buzz sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(100, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "unlock") {
      // Digital cyber reveal chime (arpeggio)
      const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      frequencies.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + i * 0.06);
        gain.gain.setValueAtTime(0.06, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.25);
      });
    } else if (type === "complete") {
      // Fanfare upward synth sweep
      const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
      frequencies.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + i * 0.05);
        gain.gain.setValueAtTime(0.08, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.35);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.35);
      });
    } else if (type === "coin") {
      // Cling coin sound
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();

      osc1.connect(gain1); gain1.connect(ctx.destination);
      osc2.connect(gain2); gain2.connect(ctx.destination);

      osc1.type = "sine"; osc1.frequency.setValueAtTime(987.77, now); // B5
      osc2.type = "sine"; osc2.frequency.setValueAtTime(1318.51, now + 0.04); // E6

      gain1.gain.setValueAtTime(0.05, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      gain2.gain.setValueAtTime(0.05, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc1.start(now); osc1.stop(now + 0.12);
      osc2.start(now + 0.04); osc2.stop(now + 0.18);
    }
  } catch (e) {
    console.error("Audio Web Synth Error: ", e);
  }
}

// ── VIEW TRANSITION MANAGER ──
function setMissionStep(activeStep) {
  // Navigation steps tracker has been removed
}

function transitionToView(nextView, onComplete) {
  const currentView = document.querySelector(".mission-view.active");
  if (currentView === nextView) {
    if (onComplete) onComplete();
    return;
  }

  const currentHeight = currentView.offsetHeight;
  missionStage.style.height = `${currentHeight}px`;
  missionStage.style.overflow = "hidden";

  // Measure nextView height
  nextView.style.position = "absolute";
  nextView.style.width = "100%";
  nextView.style.height = "auto";
  nextView.style.visibility = "hidden";
  nextView.hidden = false;
  nextView.classList.add("active");

  const nextHeight = nextView.offsetHeight;

  nextView.style.position = "";
  nextView.style.width = "";
  nextView.style.height = "";
  nextView.style.visibility = "";
  nextView.style.opacity = "0";

  currentView.style.position = "absolute";
  currentView.style.width = "100%";
  currentView.style.top = "0";
  currentView.style.left = "0";

  nextView.style.position = "absolute";
  nextView.style.width = "100%";
  nextView.style.top = "0";
  nextView.style.left = "0";

  // Flash slide animation across stage
  morphFlash.style.transform = "translateX(-108%) skewX(-14deg)";
  morphFlash.style.opacity = "0.7";

  morphFlash.animate([
    { transform: "translateX(-108%) skewX(-14deg)" },
    { transform: "translateX(108%) skewX(-14deg)" }
  ], {
    duration: 500,
    easing: "ease-out"
  });

  currentView.animate([
    { opacity: 1, transform: "translateY(0) scale(1)" },
    { opacity: 0, transform: "translateY(-20px) scale(0.97)" }
  ], {
    duration: 400,
    easing: "ease-out"
  });

  missionStage.animate([
    { height: `${currentHeight}px` },
    { height: `${nextHeight}px` }
  ], {
    duration: 450,
    easing: "cubic-bezier(0.25, 1, 0.5, 1)"
  });

  const fadeInAnim = nextView.animate([
    { opacity: 0, transform: "translateY(20px) scale(0.97)" },
    { opacity: 1, transform: "translateY(0) scale(1)" }
  ], {
    duration: 400,
    delay: 50,
    easing: "ease-out",
    fill: "forwards"
  });

  fadeInAnim.onfinish = () => {
    currentView.hidden = true;
    currentView.classList.remove("active");
    currentView.removeAttribute("style");
    nextView.removeAttribute("style");
    missionStage.removeAttribute("style");

    // Clear styles from elements inside nextView
    const children = nextView.querySelectorAll(".briefing-panel, .dossier-console, .result-summary, .result-copy, .cta-box, .potential-card");
    children.forEach(el => el.removeAttribute("style"));

    if (onComplete) onComplete();
    drawRulers();
  };
}

// ── BRIEFING SLIDESHOW ──
const totalBriefingSlides = 3;

function advanceBriefingSlide() {
  if (onboardingComplete) return;

  // Visual feedback on the spacebar button
  const spacebarBtn = document.getElementById("spacebarAdvanceBtn");
  if (spacebarBtn) {
    spacebarBtn.classList.add("pressed");
    setTimeout(() => {
      spacebarBtn.classList.remove("pressed");
    }, 100);
  }

  activeBriefingSlide++;
  playSynthSound("click");

  if (activeBriefingSlide < totalBriefingSlides) {
    // Transition slides
    const slides = document.querySelectorAll(".briefing-slide");
    slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === activeBriefingSlide);
    });

    // Update pagination dots
    const dots = document.querySelectorAll("#briefingPagination .dot");
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === activeBriefingSlide);
    });

    // Update footer instructions on the last slide
    if (activeBriefingSlide === totalBriefingSlides - 1) {
      document.querySelector(".spacebar-instruction").textContent = "Druk op de spatiebalk om de missie te starten!";
    }
  } else {
    finishBriefing();
  }
}

function finishBriefing() {
  onboardingComplete = true;
  transitionToView(missionLayout, () => {
    setMissionStep("typing");
    resetTest();
  });
}

// ── DECRYPTION CODE GENERATOR ──
function generateDecryptionCode() {
  const easyChars = "abcdefghijklmnopqrstuvwxyz";
  const mediumChars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const hardChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#_-*";
  const expertChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,./<>?";

  let pool = easyChars;
  if (selectedDifficulty === "medium") pool = mediumChars;
  else if (selectedDifficulty === "hard") pool = hardChars;
  else if (selectedDifficulty === "expert") pool = expertChars;

  let code = "";
  for (let i = 0; i < DECRYPT_CODE_LENGTH; i++) {
    code += pool[Math.floor(Math.random() * pool.length)];
  }
  return code;
}

// ── DYNAMIC CAMERA CENTERING Math ──
function getWordPosition(wordElement) {
  let left = 0;
  let top = 0;
  let curr = wordElement;

  while (curr && curr !== classifiedDoc) {
    left += curr.offsetLeft;
    top += curr.offsetTop;
    curr = curr.offsetParent;
  }

  return {
    left: left,
    top: top,
    width: wordElement.offsetWidth,
    height: wordElement.offsetHeight
  };
}

// ── FIGMA-STYLE CANVASES RULERS DRAWING ──
function drawRulers() {
  const canvasH = document.getElementById("ruler-horizontal");
  const canvasV = document.getElementById("ruler-vertical");
  if (!canvasH || !canvasV) return;

  const ctxH = canvasH.getContext("2d");
  const ctxV = canvasV.getContext("2d");

  const viewportWidth = dossierViewport.clientWidth;
  const viewportHeight = dossierViewport.clientHeight;
  if (viewportWidth === 0 || viewportHeight === 0) return;

  const rulerSize = 16;
  const dpr = window.devicePixelRatio || 1;

  // Sync canvas width and height with browser devicePixelRatio
  if (canvasH.width !== viewportWidth * dpr || canvasH.height !== rulerSize * dpr) {
    canvasH.width = viewportWidth * dpr;
    canvasH.height = rulerSize * dpr;
    canvasH.style.width = viewportWidth + "px";
    canvasH.style.height = rulerSize + "px";
  }
  if (canvasV.width !== rulerSize * dpr || canvasV.height !== viewportHeight * dpr) {
    canvasV.width = rulerSize * dpr;
    canvasV.height = viewportHeight * dpr;
    canvasV.style.width = rulerSize + "px";
    canvasV.style.height = viewportHeight + "px";
  }

  // Scale contexts
  ctxH.setTransform(1, 0, 0, 1, 0, 0);
  ctxH.scale(dpr, dpr);
  ctxV.setTransform(1, 0, 0, 1, 0, 0);
  ctxV.scale(dpr, dpr);

  // Background colors
  ctxH.fillStyle = "#18111d";
  ctxH.fillRect(0, 0, viewportWidth, rulerSize);
  ctxV.fillStyle = "#18111d";
  ctxV.fillRect(0, 0, rulerSize, viewportHeight);

  // Border lines
  ctxH.strokeStyle = "#2e2235";
  ctxH.lineWidth = 1;
  ctxH.beginPath();
  ctxH.moveTo(0, rulerSize - 0.5);
  ctxH.lineTo(viewportWidth, rulerSize - 0.5);
  ctxH.stroke();

  ctxV.strokeStyle = "#2e2235";
  ctxV.lineWidth = 1;
  ctxV.beginPath();
  ctxV.moveTo(rulerSize - 0.5, 0);
  ctxV.lineTo(rulerSize - 0.5, viewportHeight);
  ctxV.stroke();

  const scale = currentCameraScale;
  const docLeft = classifiedDoc.offsetLeft;
  const docTop = classifiedDoc.offsetTop;
  const tx = currentCameraX;
  const ty = currentCameraY;

  // Choose interval steps based on scale zoom level
  let step = 100;
  if (scale > 3.0) step = 20;
  else if (scale > 1.5) step = 50;
  else if (scale > 0.8) step = 100;
  else if (scale > 0.4) step = 200;
  else step = 500;

  const subStep = step / 10;

  // Render Horizontal Ruler Ticks & Labels
  ctxH.font = "9px 'Roboto Mono', monospace";
  ctxH.fillStyle = "#a092a7";
  ctxH.textAlign = "center";
  ctxH.textBaseline = "middle";
  ctxH.strokeStyle = "#503f59";

  const x_doc_start = (rulerSize - docLeft - tx) / scale;
  const x_doc_end = (viewportWidth - docLeft - tx) / scale;
  const firstTickX = Math.floor(x_doc_start / subStep) * subStep;
  const lastTickX = Math.ceil(x_doc_end / subStep) * subStep;

  for (let x_doc = firstTickX; x_doc <= lastTickX; x_doc += subStep) {
    const x_view = docLeft + tx + x_doc * scale;
    if (x_view < rulerSize) continue;

    const roundedX = Math.round(x_doc);
    const isMajor = roundedX % step === 0;
    const isMedium = roundedX % (step / 2) === 0;

    let tickHeight = 3;
    if (isMajor) tickHeight = 10;
    else if (isMedium) tickHeight = 6;

    ctxH.beginPath();
    ctxH.moveTo(x_view, rulerSize - tickHeight);
    ctxH.lineTo(x_view, rulerSize);
    ctxH.stroke();

    if (isMajor) {
      ctxH.fillText(roundedX.toString(), x_view, 5);
    }
  }

  // Render Vertical Ruler Ticks & Labels
  ctxV.font = "9px 'Roboto Mono', monospace";
  ctxV.fillStyle = "#a092a7";
  ctxV.textAlign = "center";
  ctxV.textBaseline = "middle";
  ctxV.strokeStyle = "#503f59";

  const y_doc_start = (rulerSize - docTop - ty) / scale;
  const y_doc_end = (viewportHeight - docTop - ty) / scale;
  const firstTickY = Math.floor(y_doc_start / subStep) * subStep;
  const lastTickY = Math.ceil(y_doc_end / subStep) * subStep;

  for (let y_doc = firstTickY; y_doc <= lastTickY; y_doc += subStep) {
    const y_view = docTop + ty + y_doc * scale;
    if (y_view < rulerSize) continue;

    const roundedY = Math.round(y_doc);
    const isMajor = roundedY % step === 0;
    const isMedium = roundedY % (step / 2) === 0;

    let tickWidth = 3;
    if (isMajor) tickWidth = 10;
    else if (isMedium) tickWidth = 6;

    ctxV.beginPath();
    ctxV.moveTo(rulerSize - tickWidth, y_view);
    ctxV.lineTo(rulerSize, y_view);
    ctxV.stroke();

    if (isMajor) {
      ctxV.save();
      ctxV.translate(5, y_view);
      ctxV.rotate(-Math.PI / 2);
      ctxV.fillText(roundedY.toString(), 0, 0);
      ctxV.restore();
    }
  }
}

function setCameraInstant(x, y, scale) {
  if (cameraAnimationId) {
    cancelAnimationFrame(cameraAnimationId);
    cameraAnimationId = null;
  }
  classifiedDoc.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  currentCameraX = x;
  currentCameraY = y;
  currentCameraScale = scale;
  drawRulers();
}

function animateCameraTo(targetX, targetY, targetScale, duration = 900) {
  if (cameraAnimationId) {
    cancelAnimationFrame(cameraAnimationId);
  }

  const startX = currentCameraX;
  const startY = currentCameraY;
  const startScale = currentCameraScale;
  const startTime = performance.now();

  const viewportWidth = dossierViewport.clientWidth;
  const viewportHeight = dossierViewport.clientHeight;
  const docLeft = classifiedDoc.offsetLeft;
  const docTop = classifiedDoc.offsetTop;

  // Calculate start and target focal points in document space (centered on visible area, offset by 16px rulers)
  const x_doc_start = ((viewportWidth + 16) / 2 - docLeft - startX) / startScale;
  const y_doc_start = ((viewportHeight + 16) / 2 - docTop - startY) / startScale;

  const x_doc_target = ((viewportWidth + 16) / 2 - docLeft - targetX) / targetScale;
  const y_doc_target = ((viewportHeight + 16) / 2 - docTop - targetY) / targetScale;

  const dist = Math.hypot(targetX - startX, targetY - startY);
  // Swoop out and back in only if we are already zoomed in and moving to another zoomed-in target
  const isTargetToTarget = startScale >= 1.5 && targetScale >= 1.5 && dist > 50;

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease in-out cubic
    const p = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    // Interpolate focal point in document space (creates straight line movement)
    const x_doc = x_doc_start + (x_doc_target - x_doc_start) * p;
    const y_doc = y_doc_start + (y_doc_target - y_doc_start) * p;

    // Interpolate scale
    let scale = startScale + (targetScale - startScale) * p;
    if (isTargetToTarget) {
      // Zoom out smoothly in the middle of transition (creating the swoop effect)
      const maxDip = 0.7; // Deepen the swoop slightly for a more satisfying feel
      const dip = maxDip * Math.sin(p * Math.PI);
      scale = Math.max(1.0, scale - dip);
    }

    // Calculate translation required to keep (x_doc, y_doc) in the center of the visible area
    const x = (viewportWidth + 16) / 2 - docLeft - x_doc * scale;
    const y = (viewportHeight + 16) / 2 - docTop - y_doc * scale;

    classifiedDoc.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;

    currentCameraX = x;
    currentCameraY = y;
    currentCameraScale = scale;
    drawRulers();

    if (progress < 1) {
      cameraAnimationId = requestAnimationFrame(step);
    } else {
      cameraAnimationId = null;
    }
  }

  cameraAnimationId = requestAnimationFrame(step);
}

function focusOnRedactedWord(index) {
  const words = documentTextContainer.querySelectorAll(".redacted-word");
  const activeWord = words[index];
  if (!activeWord) return;

  // Remove active class from all words immediately
  words.forEach(w => w.classList.remove("active-redaction"));

  // Camera calculations
  const S = 2.1; // Scale factor
  const pos = getWordPosition(activeWord);

  const viewportWidth = dossierViewport.clientWidth;
  const viewportHeight = dossierViewport.clientHeight;

  // Center coordinates relative to classified doc
  const x = pos.left + pos.width / 2;
  const y = pos.top + pos.height / 2;

  const docLeft = classifiedDoc.offsetLeft;
  const docTop = classifiedDoc.offsetTop;

  // Pan values to align (x, y) to the center of the visible area, correcting for document offset
  const translateX = (viewportWidth + 16) / 2 - (x * S) - docLeft;
  const translateY = (viewportHeight + 16) / 2 - (y * S) - docTop;

  // Animate transform using our custom swoop-pan function
  animateCameraTo(translateX, translateY, S, 900);

  // Trigger HUD corner calibration animation
  const hudCorners = document.querySelector(".hud-corners");
  if (hudCorners) {
    hudCorners.classList.remove("calibrating");
    void hudCorners.offsetWidth; // Force reflow
    hudCorners.classList.add("calibrating");
  }

  // Align reticle box overlay
  reticleTarget.style.width = (pos.width * S + 20) + "px";
  reticleTarget.style.height = (pos.height * S + 14) + "px";
  reticleTarget.style.display = "block";

  // Only turn the block orange after the reticle has arrived at the target
  setTimeout(() => {
    activeWord.classList.add("active-redaction");
  }, 900);
}

function resetCamera(animate = true) {
  // Center the folder scaled down slightly relative to viewport sizes
  const viewportWidth = dossierViewport.clientWidth;
  const viewportHeight = dossierViewport.clientHeight;
  const docWidth = classifiedDoc.offsetWidth;
  const docHeight = classifiedDoc.offsetHeight;
  const docLeft = classifiedDoc.offsetLeft;
  const docTop = classifiedDoc.offsetTop;

  const S = 0.97;
  const translateX = (viewportWidth + 16 - docWidth * S) / 2 - docLeft;
  const translateY = (viewportHeight + 16 - docHeight * S) / 2 - docTop;

  if (animate) {
    animateCameraTo(translateX, translateY, S, 900);
    // Trigger HUD corner calibration animation
    const hudCorners = document.querySelector(".hud-corners");
    if (hudCorners) {
      hudCorners.classList.remove("calibrating");
      void hudCorners.offsetWidth; // Force reflow
      hudCorners.classList.add("calibrating");
    }
  } else {
    setCameraInstant(translateX, translateY, S);
  }
  reticleTarget.style.display = "none";
}

// ── KEYBOARD HANDLER & RENDERER ──
function renderPrompt() {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < currentCode.length; i++) {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = currentCode[i];

    if (i < codeCursor) {
      if (typedStates[i] === "wrong") {
        span.classList.add("wrong");
      } else {
        span.classList.add("correct");
      }
    } else if (i === codeCursor) {
      if (typedStates[i] === "wrong") {
        span.classList.add("wrong");
        span.classList.add("current");
      } else {
        span.classList.add("current");
      }
    }
    fragment.appendChild(span);
  }
  promptTextEl.replaceChildren(fragment);
}

function updateLiveStats() {
  if (!running) return;
  const currentElapsed = Date.now() - currentWordStartedAt;
  const elapsed = (accumulatedTime + currentElapsed) / 1000;

  // Timer text
  timerEl.textContent = elapsed.toFixed(1);

  // Speed calculation (CPM)
  const safeElapsed = Math.max(elapsed, 0.5);
  const cpm = Math.round(correctKeystrokes / (safeElapsed / 60));
  liveCpmEl.textContent = cpm;

  // Accuracy
  const accuracy = totalKeystrokes === 0 ? 100 : Math.round((correctKeystrokes / totalKeystrokes) * 100);
  accuracyEl.textContent = `${accuracy}%`;

  // Mistake count
  mistakeCountEl.textContent = mistakeCount;
}

function handleKeystroke(e) {
  // Intercept normal keys, ignore Meta/Control/Alt/etc., or when decrypting animation is running
  if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey || testFinished || isDecryptingAnimation) {
    return;
  }
  e.preventDefault();

  if (!running) {
    // Start timing at first character of the current word
    running = true;
    currentWordStartedAt = Date.now();
    if (currentWordIndex === 0) {
      startedAt = Date.now();
    }
    difficultyDropdown.classList.add("disabled");

    clearInterval(timerInterval);
    timerInterval = setInterval(updateLiveStats, 100);
  }

  totalKeystrokes++;
  const targetChar = currentCode[codeCursor];

  if (e.key === targetChar) {
    // Correct letter (if it was previously wrong, keep the red status)
    if (!typedStates[codeCursor]) {
      typedStates[codeCursor] = "correct";
    }
    codeCursor++;
    correctKeystrokes++;
    currentStreak++;
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }

    playSynthSound("click");
    renderPrompt();
    updateLiveStats();

    if (codeCursor >= currentCode.length) {
      // Completed decryption code for this word!
      startDecryptionSequence();
    }
  } else {
    // Mistake
    typedStates[codeCursor] = "wrong";
    mistakeCount++;
    currentStreak = 0; // Reset streak

    // Tally errors on this key for difficult key metric
    const k = targetChar === " " ? "spatie" : targetChar;
    mistakesPerKey[k] = (mistakesPerKey[k] || 0) + 1;

    playSynthSound("error");

    // Animate terminal shake
    terminalPanel.classList.remove("input-error");
    void terminalPanel.offsetWidth; // Repaint trigger
    terminalPanel.classList.add("input-error");

    renderPrompt();
    updateLiveStats();
  }
}

function triggerSuccessFlash() {
  const successOverlay = document.getElementById("successFlashOverlay");
  if (successOverlay) {
    successOverlay.hidden = false;
    // Reset animation
    successOverlay.style.animation = 'none';
    successOverlay.offsetHeight; // force reflow
    successOverlay.style.animation = '';

    setTimeout(() => {
      successOverlay.hidden = true;
    }, 600);
  }

  if (terminalPanel) {
    terminalPanel.classList.remove("success-shudder");
    terminalPanel.offsetHeight; // force reflow
    terminalPanel.classList.add("success-shudder");
    setTimeout(() => {
      terminalPanel.classList.remove("success-shudder");
    }, 500);
  }
}

function startDecryptionSequence() {
  // Pause timing during scrambling and transition
  if (running) {
    accumulatedTime += (Date.now() - currentWordStartedAt);
    running = false;
  }
  clearInterval(timerInterval);
  timerEl.textContent = (accumulatedTime / 1000).toFixed(1);

  isDecryptingAnimation = true;

  // Make the terminal characters all green & glowing
  promptTextEl.classList.add("cracked");

  // Get active word span from document
  const wordSpans = documentTextContainer.querySelectorAll(".redacted-word");
  const span = wordSpans[currentWordIndex];

  // Add scrambling styles to the word on the paper
  if (span) {
    span.classList.remove("active-redaction");
    span.classList.add("decrypting-glow");
  }

  // Scramble settings
  const targetWord = span ? span.getAttribute("data-word") : "";
  const duration = 900; // 900ms shuffle
  const glyphs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$@%&!?*";

  // Perform a small beep sound loop for scrambling feedback
  const scrambleSoundInterval = setInterval(() => {
    if (soundEnabled) {
      playSynthSound("click"); // plays click beeps during shuffle
    }
  }, 100);

  const startTime = Date.now();

  function updateScramble() {
    const now = Date.now();
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Scramble the console prompt characters
    let consoleHTML = "";
    for (let i = 0; i < targetWord.length; i++) {
      const char = targetWord[i];
      if (char === " ") {
        consoleHTML += `<span class="char" style="color: transparent;"> </span>`;
      } else {
        // Reveal based on progress: left-to-right reveal
        const isRevealed = (i / targetWord.length) < progress;
        const displayChar = isRevealed ? char : glyphs[Math.floor(Math.random() * glyphs.length)];
        consoleHTML += `<span class="char correct">${displayChar}</span>`;
      }
    }
    promptTextEl.innerHTML = consoleHTML;

    // Scramble the paper word
    if (span) {
      let paperWordText = "";
      for (let i = 0; i < targetWord.length; i++) {
        const char = targetWord[i];
        if (char === " " || char === "." || char === "-" || char === "," || char === "/" || char === "#") {
          paperWordText += char;
        } else {
          const isRevealed = (i / targetWord.length) < progress;
          paperWordText += isRevealed ? char : glyphs[Math.floor(Math.random() * glyphs.length)];
        }
      }
      span.textContent = paperWordText;
    }

    if (progress < 1) {
      requestAnimationFrame(updateScramble);
    } else {
      // Scramble complete!
      clearInterval(scrambleSoundInterval);

      // Stop and play unlock/success chime
      playSynthSound("unlock");
      triggerSuccessFlash();

      // Resolve text fully
      promptTextEl.innerHTML = targetWord.split("").map(c =>
        c === " " ? `<span class="char" style="color: transparent;"> </span>` : `<span class="char correct">${c}</span>`
      ).join("");

      if (span) {
        span.textContent = targetWord;
        span.classList.remove("decrypting-glow");
        span.classList.add("decrypted");
      }

      // Update decryptions progress fill and stats tally
      currentWordIndex++;
      const percent = (currentWordIndex / 5) * 100;
      decryptFill.style.width = `${percent}%`;
      uploadPercent.textContent = `${currentWordIndex}/5 gekraakt`;

      // Delay before moving to the next word or ending the game
      setTimeout(() => {
        // Remove the cracked style from console text
        promptTextEl.classList.remove("cracked");

        if (currentWordIndex < 5) {
          // Next word transition
          codeCursor = 0;
          typedStates = []; // Reset states for new word
          currentCode = generateDecryptionCode();
          codeLabelEl.textContent = `DOELWIT #${currentWordIndex + 1} CODESLEUTEL:`;

          focusOnRedactedWord(currentWordIndex);
          renderPrompt();

          // Re-enable typing input
          isDecryptingAnimation = false;
          typingInput.disabled = false;
          typingInput.focus();
        } else {
          // All 5 words cracked! Document is unredacted
          finishDecryptionGame();
          isDecryptingAnimation = false;
        }
      }, 1200); // Wait 1200ms so the user sees the resolved word before panning
    }
  }

  requestAnimationFrame(updateScramble);
}

function finishDecryptionGame() {
  testFinished = true;
  running = false;
  clearInterval(timerInterval);

  totalTime = accumulatedTime / 1000;
  timerEl.textContent = totalTime.toFixed(1);

  playSynthSound("complete");
  resetCamera();

  // Seal document stamp
  docStamp.classList.add("unlocked");
  docStamp.innerHTML = "<span>VERIFIED</span>";
  missionStatus.textContent = "GEKRAAKT / VRIJGEGEVEN";

  // Hide terminal input and display result button
  typingInput.disabled = true;
  typingOverlay.hidden = false;
  typingOverlay.classList.add("overlay-complete");
  overlayMessage.textContent = "DECRYPTIE COMPLEET!";
  if (finishSpaceHint) finishSpaceHint.hidden = false;

  if (lockIcon) lockIcon.style.display = "none";
  if (unlockIcon) unlockIcon.style.display = "block";

  startButton.hidden = true;
  finishButton.hidden = false;
  finishButton.disabled = false;
}

// ── COIN BREAKDOWN SEQUENTIAL TALLY & FLOATING PARTICLES ──
function launchCoinParticles(sourceElement, targetElement, count) {
  const srcRect = sourceElement.getBoundingClientRect();
  const destRect = targetElement.getBoundingClientRect();
  const arenaRect = document.getElementById("missionStage").getBoundingClientRect();

  for (let i = 0; i < count; i++) {
    const coin = document.createElement("div");
    coin.className = "floating-coin";
    document.body.appendChild(coin);

    // Initial position
    const startX = srcRect.left + srcRect.width / 2;
    const startY = srcRect.top + srcRect.height / 2;

    // Target position
    const endX = destRect.left + destRect.width / 2;
    const endY = destRect.top + destRect.height / 2;

    coin.style.left = startX + "px";
    coin.style.top = startY + "px";

    // Randomize middle bezier anchor point for arc
    const midX = startX + (endX - startX) / 2 + (Math.random() - 0.5) * 150;
    const midY = startY - 80 - Math.random() * 100;

    const duration = 600 + Math.random() * 300;
    const startTime = performance.now();

    function animateCoin(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);

      // Bezier curve calculations
      const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
      const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY;

      // Scale and opacity
      const scale = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;

      coin.style.transform = `translate(${x - startX}px, ${y - startY}px) scale(${scale})`;
      coin.style.opacity = 1 - t;

      if (t < 1) {
        requestAnimationFrame(animateCoin);
      } else {
        coin.remove();
        playSynthSound("coin");
      }
    }
    requestAnimationFrame(animateCoin);
  }
}

function animateCoinsBreakdown(breakdownValues) {
  let totalTally = 0;
  const targetLabel = document.getElementById("completeCoins");

  const stepDelay = 600; // Delay between animating each stat row

  // Map elements
  const rows = [
    { el: cpmCoinsReward, value: breakdownValues.cpm, label: "cpmCoinsReward" },
    { el: precisionCoinsReward, value: breakdownValues.precision, label: "precisionCoinsReward" },
    { el: streakCoinsReward, value: breakdownValues.streak, label: "streakCoinsReward" },
    { el: completionCoinsReward, value: 50, label: "completionCoinsReward" }
  ];

  rows.forEach((row, index) => {
    setTimeout(() => {
      // Counter up the row reward
      let currentVal = 0;
      const interval = setInterval(() => {
        if (currentVal < row.value) {
          currentVal += Math.ceil(row.value / 6);
          if (currentVal > row.value) currentVal = row.value;
          row.el.innerHTML = `+${currentVal} <img src="coin.svg" width="14" height="14">`;
        } else {
          clearInterval(interval);
        }
      }, 50);

      // Throw coin particles
      launchCoinParticles(row.el, targetLabel, 5);

      // Count up the total coin bag
      setTimeout(() => {
        totalTally += row.value;
        targetLabel.textContent = totalTally;
      }, 500);

    }, index * stepDelay);
  });
}

function animateNumberValue(element, target, duration = 1200, suffix = "") {
  let start = 0;
  const startTime = performance.now();

  function updateNumber(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-out quad
    const ease = progress * (2 - progress);

    const current = Math.round(start + (target - start) * ease);
    element.textContent = current + suffix;

    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    } else {
      element.textContent = target + suffix;
    }
  }
  requestAnimationFrame(updateNumber);
}

function calculateScores() {
  // CPM
  const elapsed = Math.max(totalTime, 1);
  const cpm = Math.round(correctKeystrokes / (elapsed / 60));
  completeCpm.textContent = "0";

  // Accuracy
  const acc = totalKeystrokes === 0 ? 100 : Math.round((correctKeystrokes / totalKeystrokes) * 100);
  completeAccuracy.textContent = "0%";

  // Streak
  completeStreak.textContent = "0";

  // Difficult key
  let maxErrors = 0;
  let diffKey = "Geen (Perfect!)";
  for (const [key, count] of Object.entries(mistakesPerKey)) {
    if (count > maxErrors) {
      maxErrors = count;
      diffKey = key;
    }
  }
  completeDifficultKey.textContent = diffKey;

  // Add class for long text on difficult key badge to prevent overflow
  if (diffKey.length > 1) {
    completeDifficultKey.classList.add("long-text");
  } else {
    completeDifficultKey.classList.remove("long-text");
  }

  // Calculate Coin Breakdown
  const cpmCoins = Math.round(cpm * 0.4);
  const precisionCoins = Math.round(acc * 1.2);
  const streakCoins = Math.round(maxStreak * 2.0);
  const totalCoins = cpmCoins + precisionCoins + streakCoins + 50;

  // Rank determination
  let rank = "Beginner Agent";
  if (cpm >= 180 && acc >= 96) rank = "Master Cyber-Spion";
  else if (cpm >= 120 && acc >= 90) rank = "Elite Code-Kraker";
  else if (cpm >= 80) rank = "Veld Agent";

  rankBadge.textContent = rank;

  // Reset coin displays to start animation from 0
  completeCoins.textContent = "0";
  cpmCoinsReward.innerHTML = `+0 <img src="coin.svg" width="14" height="14">`;
  precisionCoinsReward.innerHTML = `+0 <img src="coin.svg" width="14" height="14">`;
  streakCoinsReward.innerHTML = `+0 <img src="coin.svg" width="14" height="14">`;

  // Trigger view change
  transitionToView(resultPanel, () => {
    setMissionStep("result");

    // Start count-up stats!
    animateNumberValue(completeCpm, cpm, 1000);
    animateNumberValue(completeAccuracy, acc, 1000, "%");
    animateNumberValue(completeStreak, maxStreak, 1000);

    // Start coins particles tally waterfall!
    animateCoinsBreakdown({
      cpm: cpmCoins,
      precision: precisionCoins,
      streak: streakCoins
    });
  });
}

// ── RESET & START GAME LOGIC ──
function resetTest() {
  running = false;
  testFinished = false;
  isDecryptingAnimation = false;
  clearInterval(timerInterval);

  accumulatedTime = 0;
  currentWordStartedAt = 0;

  currentWordIndex = 0;
  codeCursor = 0;
  typedStates = []; // Reset states!
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  mistakeCount = 0;
  currentStreak = 0;
  maxStreak = 0;
  mistakesPerKey = {};

  timerEl.textContent = "0.0";
  liveCpmEl.textContent = "0";
  mistakeCountEl.textContent = "0";
  accuracyEl.textContent = "100%";

  difficultyDropdown.classList.remove("disabled");

  // Select random dossier from database
  activeDossier = DOSSIERS[Math.floor(Math.random() * DOSSIERS.length)];

  // Set title
  document.querySelector(".folder-tab").textContent = `FILE NO: ${activeDossier.title}`;

  // Render text containing redacted elements
  documentTextContainer.innerHTML = activeDossier.paragraphs.map(p => `<p>${p}</p>`).join("");

  // Set the text content of the redacted words to match the length of the actual target words
  const redactedWords = documentTextContainer.querySelectorAll(".redacted-word");
  redactedWords.forEach(span => {
    span.textContent = span.getAttribute("data-word");
  });

  // Setup first target code
  currentCode = generateDecryptionCode();
  codeLabelEl.textContent = "DOELWIT #1 CODESLEUTEL:";
  renderPrompt();

  // Reset UI components
  docStamp.className = "paper-stamp";
  docStamp.innerHTML = "<span>TOP SECRET</span>";
  missionStatus.textContent = "STRIKT VERTROUWELIJK";
  decryptFill.style.width = "0%";
  uploadPercent.textContent = "0/5 gekraakt";

  resetCamera(false);

  // Input states
  typingInput.value = "";
  typingInput.disabled = false;
  typingOverlay.hidden = true;
  typingOverlay.classList.remove("overlay-complete");
  if (finishSpaceHint) finishSpaceHint.hidden = true;

  if (lockIcon) lockIcon.style.display = "block";
  if (unlockIcon) unlockIcon.style.display = "none";

  startButton.hidden = true;
  finishButton.hidden = true;

  if (resultPanel.classList.contains("active")) {
    resultPanel.hidden = true;
    resultPanel.classList.remove("active");
  }

  // Start the decryption process immediately (resumes audio, zooms, focuses input)
  startDecryption();
}

function startDecryption() {
  // Setup audio context on first user click
  getAudioContext();
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  // Remove overlay, arm input
  typingOverlay.hidden = true;
  typingInput.disabled = false;
  typingInput.focus();

  // Center camera on first word
  focusOnRedactedWord(0);
}

// ── EVENT LISTENERS ──

// Document click captures focus on hidden input
document.addEventListener("click", (e) => {
  if (!testFinished && !typingInput.disabled) {
    // If user clicks in game console area, focus back on terminal input
    const isDropdown = difficultyDropdown && difficultyDropdown.contains(e.target);
    const isSound = soundToggle && soundToggle.contains(e.target);
    const isReset = resetButton && resetButton.contains(e.target);
    if (missionLayout.contains(e.target) && !isDropdown && !isSound && !isReset) {
      typingInput.focus();
    }
  }
});

// Dropdown handler
if (difficultyDropdownHeader) {
  difficultyDropdownHeader.addEventListener("click", (e) => {
    e.stopPropagation();
    if (running) return; // Locked once game starts
    difficultyDropdown.classList.toggle("open");
  });
}

difficultyOptions.forEach(opt => {
  opt.addEventListener("click", () => {
    selectedDifficulty = opt.dataset.val;
    difficultyOptions.forEach(o => o.classList.remove("selected"));
    opt.classList.add("selected");
    currentDiffDisplay.textContent = opt.textContent;
    difficultyDropdown.classList.remove("open");

    // Regenerate code immediately
    if (!running) {
      currentCode = generateDecryptionCode();
      renderPrompt();
    }
  });
});

document.addEventListener("click", (e) => {
  if (difficultyDropdown && !difficultyDropdown.contains(e.target)) {
    difficultyDropdown.classList.remove("open");
  }
});

// Keyboard listening on hidden input
typingInput.addEventListener("keydown", handleKeystroke);

// Buttons triggers
startButton.addEventListener("click", () => {
  startDecryption();
  startButton.disabled = true;
});

finishButton.addEventListener("click", () => {
  calculateScores();
});

if (resetButton) {
  resetButton.addEventListener("click", () => {
    resetTest();
    startButton.disabled = false;
  });
}

retryResultButton.addEventListener("click", () => {
  transitionToView(missionLayout, () => {
    setMissionStep("typing");
    resetTest();
    startButton.disabled = false;
  });
});

if (spacebarAdvanceBtn) {
  spacebarAdvanceBtn.addEventListener("click", advanceBriefingSlide);
}

document.addEventListener("keydown", (e) => {
  if (!onboardingComplete && e.code === "Space") {
    e.preventDefault();
    advanceBriefingSlide();
  } else if (testFinished && e.code === "Space") {
    e.preventDefault();
    // Prevent multiple triggers if the user clicks repeatedly or already transitioning
    if (resultPanel.hidden) {
      // Visual feedback on the spacebar button in terminal overlay
      const finishBtn = document.getElementById("finishButton");
      if (finishBtn) {
        finishBtn.classList.add("pressed");
        setTimeout(() => {
          finishBtn.classList.remove("pressed");
        }, 100);
      }
      calculateScores();
    } else {
      // Visual feedback on the spacebar button in results screen
      const retryBtn = document.getElementById("retryResultButton");
      if (retryBtn) {
        retryBtn.classList.add("pressed");
        setTimeout(() => {
          retryBtn.classList.remove("pressed");
        }, 100);
      }
      retryResultButton.click();
    }
  }
});


// Sound Toggle
if (soundToggle) {
  soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundToggle.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
    if (soundEnabled) {
      soundToggle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      `;
      playSynthSound("click");
    } else {
      soundToggle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
      `;
    }
  });
}

// Window Controls click - Error shake response
const terminalControls = document.querySelectorAll(".terminal-win-controls .control-btn");
terminalControls.forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (terminalPanel) {
      terminalPanel.classList.remove("error-shake");
      void terminalPanel.offsetWidth; // trigger reflow
      terminalPanel.classList.add("error-shake");
      playSynthSound("error");
    }
  });
});

if (terminalPanel) {
  terminalPanel.addEventListener("animationend", (e) => {
    if (e.animationName === "terminalErrorShake") {
      terminalPanel.classList.remove("error-shake");
    }
  });
}

// Coupon reveal
if (couponCode) {
  couponCode.addEventListener("click", () => {
    if (couponCode.classList.contains("locked")) {
      playSynthSound("unlock");
      couponCode.classList.remove("locked");
      couponCode.textContent = "SPION15";
      couponCode.style.background = "var(--green)";
      couponCode.style.color = "var(--purple)";
      couponCode.style.borderColor = "var(--green)";
    }
  });
}

// ── SUBTLE DOTTED WAVE BACKGROUND ANIMATION ──
function initDottedWaveBackground() {
  const canvas = document.getElementById("matrix-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const dotSpacing = 28; // Pixels between dots
  let cols = Math.floor(width / dotSpacing) + 1;
  let rows = Math.floor(height / dotSpacing) + 1;

  let time = 0;

  // Mouse / Touch tracking state
  const mouse = {
    x: -9999,
    y: -9999,
    targetX: -9999,
    targetY: -9999,
    active: false
  };

  // Easing factor for smooth pointer tracking
  const easeFactor = 0.15;

  window.addEventListener("mousemove", (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.active = true;
  });

  window.addEventListener("mouseleave", () => {
    mouse.active = false;
  });

  window.addEventListener("touchmove", (e) => {
    if (e.touches.length > 0) {
      mouse.targetX = e.touches[0].clientX;
      mouse.targetY = e.touches[0].clientY;
      mouse.active = true;
    }
  }, { passive: true });

  window.addEventListener("touchend", () => {
    mouse.active = false;
  });

  function draw() {
    ctx.fillStyle = "#050206";
    ctx.fillRect(0, 0, width, height);

    time += 0.02; // Smooth and slow wave movement

    // Interpolate mouse coordinates for a smooth, trailing effect
    if (mouse.active) {
      if (mouse.x === -9999) {
        mouse.x = mouse.targetX;
        mouse.y = mouse.targetY;
      } else {
        mouse.x += (mouse.targetX - mouse.x) * easeFactor;
        mouse.y += (mouse.targetY - mouse.y) * easeFactor;
      }
    } else {
      // Smoothly slide the mouse position away when inactive
      if (mouse.x !== -9999) {
        mouse.x += (-9999 - mouse.x) * 0.1;
        mouse.y += (-9999 - mouse.y) * 0.1;
        if (Math.abs(mouse.x + 9999) < 1) {
          mouse.x = -9999;
          mouse.y = -9999;
        }
      }
    }

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        // Base coordinate
        const baseX = c * dotSpacing;
        const baseY = r * dotSpacing;

        // Wave phase: diagonal wave propagation for a flag-like waving motion
        const phase = c * 0.15 + r * 0.15 - time;
        const waveVal = Math.sin(phase);

        // Physical displacement (sway and undulating lift)
        const dx = Math.cos(phase) * 3; // Horizontal sway
        const dy = waveVal * 6;          // Vertical waving

        // Animated coordinates
        let x = baseX + dx;
        let y = baseY + dy;

        // Permanent clear visibility: dot radius 2px and opacity between 14% and 24%
        let radius = 2.0;
        let opacity = 0.14 + (waveVal + 1) * 0.05;

        // Mouse interaction logic (Repulsion & Glow)
        if (mouse.x !== -9999) {
          const dxMouse = x - mouse.x;
          const dyMouse = y - mouse.y;
          const dist = Math.hypot(dxMouse, dyMouse);
          const maxDist = 150; // Detection radius in pixels

          if (dist < maxDist) {
            const force = (maxDist - dist) / maxDist; // 0 (boundary) to 1 (cursor)
            const pushAngle = Math.atan2(dyMouse, dxMouse);
            const pushDist = force * 24; // Push strength in pixels

            // Apply displacement away from the cursor
            x += Math.cos(pushAngle) * pushDist;
            y += Math.sin(pushAngle) * pushDist;

            // Boost dot size and opacity near the cursor
            radius += force * 1.5;
            opacity += force * 0.35;
          }
        }

        // Draw dot
        ctx.fillStyle = `rgba(154, 215, 68, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  let animationFrameId;
  let lastTime = 0;
  const fps = 30; // Smooth 30fps rendering
  const interval = 1000 / fps;

  function animate(now) {
    animationFrameId = requestAnimationFrame(animate);
    const delta = now - lastTime;
    if (delta > interval) {
      lastTime = now - (delta % interval);
      draw();
    }
  }
  animationFrameId = requestAnimationFrame(animate);

  // Responsive resize handler
  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    cols = Math.floor(width / dotSpacing) + 1;
    rows = Math.floor(height / dotSpacing) + 1;
  });
}

// ── ONBOARDING SLIDE 3 DEMO ANIMATION ──
let demoAnimationTimeout = null;

function startOnboardingDemoAnimation() {
  const demoCodeEl = document.getElementById("demoTerminalCode");
  const demoPaperEl = document.getElementById("demoPaperRedact");
  if (!demoCodeEl || !demoPaperEl) return;

  const targetCode = "kx79";
  const targetWord = "NIGHTHAWK";
  const glyphs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$@%&!?*";
  let step = 0;

  function nextStep() {
    if (onboardingComplete) {
      if (demoAnimationTimeout) {
        clearTimeout(demoAnimationTimeout);
        demoAnimationTimeout = null;
      }
      return;
    }

    if (step === 0) {
      // Idle / Initial State
      demoCodeEl.innerHTML = '<span class="char current">_</span>';
      demoPaperEl.textContent = targetWord;
      demoPaperEl.className = "demo-paper-redact redacted";
      step = 1;
      demoAnimationTimeout = setTimeout(nextStep, 1200);
    } else if (step >= 1 && step <= 4) {
      // Type characters of "kx79" one by one
      const typedLen = step;
      let html = "";
      for (let i = 0; i < typedLen; i++) {
        html += `<span class="char correct">${targetCode[i]}</span>`;
      }
      html += '<span class="char current">_</span>';
      demoCodeEl.innerHTML = html;

      step++;
      demoAnimationTimeout = setTimeout(nextStep, 350);
    } else if (step === 5) {
      // Complete typing and start scrambling
      let html = "";
      for (let i = 0; i < targetCode.length; i++) {
        html += `<span class="char correct">${targetCode[i]}</span>`;
      }
      demoCodeEl.innerHTML = html;

      // Scramble phase
      demoPaperEl.className = "demo-paper-redact scrambling";

      let scrambleTicks = 0;
      const maxScrambleTicks = 8;
      const scrambleInterval = setInterval(() => {
        if (onboardingComplete) {
          clearInterval(scrambleInterval);
          return;
        }
        let scrambledText = "";
        for (let i = 0; i < targetWord.length; i++) {
          scrambledText += glyphs[Math.floor(Math.random() * glyphs.length)];
        }
        demoPaperEl.textContent = scrambledText;
        scrambleTicks++;
        if (scrambleTicks >= maxScrambleTicks) {
          clearInterval(scrambleInterval);
        }
      }, 75);

      step = 6;
      demoAnimationTimeout = setTimeout(nextStep, 600);
    } else if (step === 6) {
      // Reveal target word in paper
      demoPaperEl.textContent = targetWord;
      demoPaperEl.className = "demo-paper-redact revealed";

      step = 0; // Reset loop
      demoAnimationTimeout = setTimeout(nextStep, 2500); // Hold revealed state
    }
  }

  nextStep();
}

// ── INITIAL ONBOARDING BOOTSTRAP ──
function initBriefing() {
  initDottedWaveBackground();
  startOnboardingDemoAnimation();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initBriefing);
} else {
  initBriefing();
}

// Global window resize listener to redraw rulers
window.addEventListener("resize", () => {
  if (typeof drawRulers === "function") {
    drawRulers();
  }
});
