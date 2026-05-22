// ── GAME CONSTANTS ──
const HACK_CODE_LENGTH = 6;
const MAX_MISTAKES = 3;

// ── STATE VARIABLES ──
let currentCode = "";
let codeCursor = 0;
let typedStates = [];

let running = false;
let testFinished = false;
let gameWon = false;
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
let mistakesPerKey = {};

// Briefing states
let activeBriefingSlide = 0;
let onboardingComplete = false;
let isDecryptingAnimation = false;

// Audio
let audioCtx = null;
let soundEnabled = true;

// ── DOM SELECTORS ──
const timerEl = document.getElementById("timer");
const liveCpmEl = document.getElementById("liveCpm");
const mistakeCountEl = document.getElementById("mistakeCount");
const accuracyEl = document.getElementById("accuracy");

const finishButton = document.getElementById("finishButton");
const resetButton = document.getElementById("resetButton");
const spacebarAdvanceBtn = document.getElementById("spacebarAdvanceBtn");

const storyStage = document.getElementById("storyStage");
const missionLayout = document.getElementById("missionLayout");
const resultPanel = document.getElementById("resultPanel");
const missionStage = document.getElementById("missionStage");
const morphFlash = document.getElementById("morphFlash");

const difficultyDropdown = document.getElementById("difficultyDropdown");
const difficultyDropdownHeader = document.getElementById("difficultyDropdownHeader");
const currentDiffDisplay = document.getElementById("currentDiffDisplay");
const difficultyOptions = document.querySelectorAll(".dropdown-list li");
let selectedDifficulty = "easy";

const promptTextEl = document.getElementById("promptText");
const codeLabelEl = document.getElementById("codeLabel");
const typingInput = document.getElementById("typingInput");
const typingOverlay = document.getElementById("typingOverlay");
const overlayMessage = document.getElementById("overlayMessage");
const lockIcon = document.getElementById("lockIcon");
const unlockIcon = document.getElementById("unlockIcon");
const failIcon = document.getElementById("failIcon");
const finishSpaceHint = document.getElementById("finishSpaceHint");

// Door and Lock Cylinder elements
const securityDoor = document.getElementById("securityDoor");
const doorViewport = document.getElementById("doorViewport");
const doorStatus = document.getElementById("doorStatus");
const lockCylinder = document.getElementById("lockCylinder");
const lockCylinderContainer = document.querySelector(".lock-cylinder-container");
const lockpickTool = document.getElementById("lockpickTool");
const tensionWrench = document.getElementById("tensionWrench");
const tensionMeter = document.getElementById("tensionMeter");
const tensionValue = document.getElementById("tensionValue");
const pinProgressNodes = document.querySelectorAll(".pin-progress-node");
const successPanelRight = document.getElementById("successPanelRight");
const successFinishButton = document.getElementById("successFinishButton");

// Result elements
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
const resultTitle = document.getElementById("resultTitle");
const missionBadge = document.getElementById("missionBadge");
const missionStatusContainer = document.getElementById("missionStatusContainer");

// ── AUDIO SYNTH ──
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playSynthSound(type, stepIndex = 0) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    if (type === "click") {
      // Small lockpick click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now); osc.stop(now + 0.03);
    } else if (type === "pin-set") {
      // Solid metallic latch click
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
      
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(800, now);
      osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.06);
      
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(200, now);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      osc1.start(now); osc1.stop(now + 0.1);
      osc2.start(now); osc2.stop(now + 0.1);
    } else if (type === "decrypt-step") {
      // Rising scan frequency
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      const startFreq = 400 + stepIndex * 150;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(startFreq + 200, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    } else if (type === "error") {
      // Low metallic snap/clack
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(130, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === "unlock") {
      // Mechanical cylinder rotation squeak & click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.4);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);

      setTimeout(() => {
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.connect(clickGain); clickGain.connect(ctx.destination);
        clickOsc.type = "sine";
        clickOsc.frequency.setValueAtTime(1000, ctx.currentTime);
        clickGain.gain.setValueAtTime(0.15, ctx.currentTime);
        clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        clickOsc.start(); clickOsc.stop(ctx.currentTime + 0.1);
      }, 350);
    } else if (type === "complete") {
      // Success melody
      const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      frequencies.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
        osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.3);
      });
    } else if (type === "lockout") {
      // Siren
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.8);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.start(now); osc.stop(now + 0.8);
    } else if (type === "coin") {
      // Coin jingle
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.05);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    }
  } catch (e) {
    console.error("Audio Error:", e);
  }
}

// ── VIEW TRANSITION MANAGER ──
function transitionToView(nextView, onComplete) {
  const currentView = document.querySelector(".mission-view.active");
  if (currentView === nextView) {
    if (onComplete) onComplete();
    return;
  }

  const currentHeight = currentView.offsetHeight;
  missionStage.style.height = `${currentHeight}px`;
  missionStage.style.overflow = "hidden";

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

  morphFlash.style.transform = "translateX(-108%) skewX(-14deg)";
  morphFlash.style.opacity = "0.7";

  morphFlash.animate([
    { transform: "translateX(-108%) skewX(-14deg)" },
    { transform: "translateX(108%) skewX(-14deg)" }
  ], { duration: 500, easing: "ease-out" });

  currentView.animate([
    { opacity: 1, transform: "translateY(0) scale(1)" },
    { opacity: 0, transform: "translateY(-20px) scale(0.97)" }
  ], { duration: 400, easing: "ease-out" });

  missionStage.animate([
    { height: `${currentHeight}px` },
    { height: `${nextHeight}px` }
  ], { duration: 450, easing: "cubic-bezier(0.25, 1, 0.5, 1)" });

  const fadeInAnim = nextView.animate([
    { opacity: 0, transform: "translateY(20px) scale(0.97)" },
    { opacity: 1, transform: "translateY(0) scale(1)" }
  ], { duration: 400, delay: 50, easing: "ease-out", fill: "forwards" });

  fadeInAnim.onfinish = () => {
    currentView.hidden = true;
    currentView.classList.remove("active");
    currentView.removeAttribute("style");
    nextView.removeAttribute("style");
    missionStage.removeAttribute("style");

    const children = nextView.querySelectorAll(".briefing-panel, .lock-panel, .result-summary");
    children.forEach(el => el.removeAttribute("style"));

    if (onComplete) onComplete();
  };
}

// ── BRIEFING SLIDESHOW ──
const totalBriefingSlides = 3;

function advanceBriefingSlide() {
  if (onboardingComplete) return;

  const spacebarBtn = document.getElementById("spacebarAdvanceBtn");
  if (spacebarBtn) {
    spacebarBtn.classList.add("pressed");
    setTimeout(() => spacebarBtn.classList.remove("pressed"), 100);
  }

  activeBriefingSlide++;
  playSynthSound("click");

  if (activeBriefingSlide < totalBriefingSlides) {
    const slides = document.querySelectorAll(".briefing-slide");
    slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === activeBriefingSlide);
    });

    const dots = document.querySelectorAll("#briefingPagination .dot");
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === activeBriefingSlide);
    });

    if (activeBriefingSlide === 2) {
      resetOnboardingDemoAnimation();
      startOnboardingDemoAnimation();
    } else {
      stopOnboardingDemoAnimation();
    }

    if (activeBriefingSlide === totalBriefingSlides - 1) {
      document.querySelector(".spacebar-instruction").textContent = "Druk op de spatiebalk om de missie te starten!";
    }
  } else {
    finishBriefing();
  }
}

function finishBriefing() {
  onboardingComplete = true;
  stopOnboardingDemoAnimation();
  transitionToView(missionLayout, () => {
    resetTest();
  });
}

// ── DIFFICULTY POOLS ──
const DIFFICULTY_POOLS = {
  easy: {
    chars: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'q', 'p', 'o']
  },
  medium: {
    chars: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'q', '0', 'w']
  },
  hard: {
    chars: ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+']
  },
  expert: {
    chars: ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Q', 'S']
  }
};

// ── LOCKPICK & CYLINDER ANIMATIONS ──
function updateLockpickPosition() {
  const activeIndex = Math.min(codeCursor, HACK_CODE_LENGTH - 1);
  const activeChamber = document.getElementById(`chamber${activeIndex}`);
  if (activeChamber && lockpickTool && lockCylinderContainer) {
    const containerRect = lockCylinderContainer.getBoundingClientRect();
    const chamberRect = activeChamber.getBoundingClientRect();
    
    // The tip ends at x=571 out of a 600px width viewBox, so ratio is 571/600 = 0.9517
    const pickLead = lockpickTool.offsetWidth * 0.9517;
    const toolCSSLeft = parseFloat(window.getComputedStyle(lockpickTool).left) || 0;
    const targetX = (chamberRect.left + chamberRect.width / 2) - pickLead - (containerRect.left + toolCSSLeft);
    
    lockpickTool.style.transform = `translateX(${targetX}px)`;
    lockpickTool.style.setProperty('--pick-x', `${targetX}px`);
  }
}

function liftLockpick() {
  if (lockpickTool) {
    lockpickTool.classList.remove("lifting");
    lockpickTool.offsetWidth; // Trigger reflow
    lockpickTool.classList.add("lifting");
    setTimeout(() => {
      lockpickTool.classList.remove("lifting");
    }, 180);
  }
}

function shakeTensionWrench() {
  if (tensionWrench) {
    tensionWrench.classList.remove("shake");
    tensionWrench.offsetWidth;
    tensionWrench.classList.add("shake");
    setTimeout(() => {
      tensionWrench.classList.remove("shake");
    }, 300);
  }
}

function updatePickReadouts(effect = "") {
  const progress = Math.round((codeCursor / HACK_CODE_LENGTH) * 100);

  if (tensionMeter) {
    tensionMeter.style.setProperty("--tension", `${progress}%`);
    tensionMeter.classList.remove("slipping", "set", "overload");
    if (effect) {
      tensionMeter.classList.add(effect);
    } else if (progress >= 100) {
      tensionMeter.classList.add("set");
    }
  }

  if (tensionValue) {
    tensionValue.textContent = `${progress}%`;
    tensionValue.style.color = progress >= 100 ? "var(--green)" : "var(--crimson)";
  }

  pinProgressNodes.forEach((node, index) => {
    node.classList.remove("active", "set");
    if (index < codeCursor) {
      node.classList.add("set");
    } else if (index === codeCursor && !testFinished && !isDecryptingAnimation) {
      node.classList.add("active");
    }
  });
}

function flashPickFault() {
  const node = pinProgressNodes[codeCursor];
  updatePickReadouts("slipping");

  if (node) {
    node.classList.add("fault");
    setTimeout(() => {
      node.classList.remove("fault");
    }, 320);
  }

  setTimeout(() => {
    if (!testFinished && !isDecryptingAnimation) {
      updatePickReadouts();
    }
  }, 360);
}

function updateActiveChamberHighlight() {
  for (let i = 0; i < HACK_CODE_LENGTH; i++) {
    const chamber = document.getElementById(`chamber${i}`);
    if (chamber) {
      if (i === codeCursor && !testFinished) {
        chamber.classList.add("active-chamber");
      } else {
        chamber.classList.remove("active-chamber");
      }
    }
  }
  updatePickReadouts();
}

// ── CODE GENERATOR ──
function generateHackCode() {
  const pool = DIFFICULTY_POOLS[selectedDifficulty].chars;
  let code = "";
  for (let i = 0; i < HACK_CODE_LENGTH; i++) {
    code += pool[Math.floor(Math.random() * pool.length)];
  }
  return code;
}

// ── RENDER ──
function renderPrompt() {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < currentCode.length; i++) {
    const box = document.createElement("div");
    box.className = "char-box";
    const char = currentCode[i];
    box.textContent = char === ' ' ? '␣' : char;

    if (i < codeCursor) {
      box.classList.add("correct");
    } else if (i === codeCursor) {
      box.classList.add("current");
      if (typedStates[i] === "wrong") {
        box.classList.add("wrong");
      }
    } else {
      box.classList.add("faded");
    }
    fragment.appendChild(box);
  }
  promptTextEl.replaceChildren(fragment);

  // Render chars in physical cylinder pins
  for (let i = 0; i < HACK_CODE_LENGTH; i++) {
    const chamber = document.getElementById(`chamber${i}`);
    if (chamber) {
      const pinChar = chamber.querySelector(".pin-char");
      if (pinChar) {
        const char = currentCode[i];
        pinChar.textContent = char === ' ' ? '␣' : char.toUpperCase();
      }
      
      // Sync pin alignment state
      if (i < codeCursor) {
        chamber.classList.add("picked");
        chamber.classList.remove("wiggle");
      } else {
        chamber.classList.remove("picked", "wiggle", "decrypted");
      }
    }
  }
}

function updateLiveStats() {
  if (!running) return;
  const currentElapsed = Date.now() - currentWordStartedAt;
  const elapsed = (accumulatedTime + currentElapsed) / 1000;

  timerEl.textContent = elapsed.toFixed(1);

  const safeElapsed = Math.max(elapsed, 0.5);
  const cpm = Math.round(correctKeystrokes / (safeElapsed / 60));
  liveCpmEl.textContent = cpm;

  const accuracy = totalKeystrokes === 0 ? 100 : Math.round((correctKeystrokes / totalKeystrokes) * 100);
  accuracyEl.textContent = `${accuracy}%`;

  mistakeCountEl.textContent = `${mistakeCount}/${MAX_MISTAKES}`;
}

// ── UPDATE DOOR VISUALS ──
function updateDoorVisuals() {
  // Update lock indicators
  for (let i = 0; i < MAX_MISTAKES; i++) {
    const lock = document.getElementById(`lock${i}`);
    if (lock) {
      if (i < mistakeCount) {
        lock.classList.add("error");
        lock.innerHTML = `<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      } else {
        lock.classList.remove("error");
        lock.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle></svg>`;
      }
    }
  }
}

// ── KEYBOARD HANDLER ──
function handleKeystroke(e) {
  if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey || testFinished || isDecryptingAnimation) {
    return;
  }
  e.preventDefault();

  if (!running) {
    running = true;
    currentWordStartedAt = Date.now();
    startedAt = Date.now();
    difficultyDropdown.classList.add("disabled");

    clearInterval(timerInterval);
    timerInterval = setInterval(updateLiveStats, 100);

    addTerminalLog("BREKEN MECHANISME BEGONNEN - DRUK OP PINS...", "warning");
  }

  totalKeystrokes++;
  const targetChar = currentCode[codeCursor];

  if (e.key === targetChar) {
    if (!typedStates[codeCursor]) {
      typedStates[codeCursor] = "correct";
    }

    // Play pick lift sound and lift lockpick
    liftLockpick();
    playSynthSound("click");

    // Click chamber and set pin
    const chamber = document.getElementById(`chamber${codeCursor}`);
    if (chamber) {
      chamber.classList.add("wiggle");
      setTimeout(() => {
        playSynthSound("pin-set");
      }, 50);
    }

    codeCursor++;
    correctKeystrokes++;
    currentStreak++;
    if (currentStreak > maxStreak) maxStreak = currentStreak;
    
    // Update active pin indicators
    updateActiveChamberHighlight();
    updateLockpickPosition();
    renderPrompt();
    updateLiveStats();

    if (codeCursor >= currentCode.length) {
      startDecryptionSequence();
    }
  } else {
    typedStates[codeCursor] = "wrong";
    mistakeCount++;
    currentStreak = 0;

    const k = targetChar === " " ? "spatie" : targetChar;
    mistakesPerKey[k] = (mistakesPerKey[k] || 0) + 1;

    // Shake current pin chamber and tension wrench
    const chamber = document.getElementById(`chamber${codeCursor}`);
    if (chamber) {
      chamber.classList.remove("shake");
      chamber.offsetWidth;
      chamber.classList.add("shake");
      setTimeout(() => { chamber.classList.remove("shake"); }, 300);
    }
    shakeTensionWrench();
    flashPickFault();
    playSynthSound("error");

    // Log the error
    const inputKey = e.key === " " ? "spatie" : e.key;
    const expectedKey = targetChar === " " ? "spatie" : targetChar;
    addTerminalLog(`MECHANISME-BLOKKERING: VERKEERDE SPANNING. VERWACHT: '${expectedKey}', ONTVANGEN: '${inputKey}'`, "danger");

    // Update lock indicators
    updateDoorVisuals();
    renderPrompt();
    updateLiveStats();

    // Check lockout
    if (mistakeCount >= MAX_MISTAKES) {
      triggerLockout();
    }
  }
}

function startDecryptionSequence() {
  isDecryptingAnimation = true;

  // Stop the timer immediately
  if (running) {
    accumulatedTime += (Date.now() - currentWordStartedAt);
    running = false;
  }
  clearInterval(timerInterval);
  timerEl.textContent = (accumulatedTime / 1000).toFixed(1);

  difficultyDropdown.classList.add("disabled");

  // Highlight all chambers and hide lockpick highlight
  for (let i = 0; i < HACK_CODE_LENGTH; i++) {
    const chamber = document.getElementById(`chamber${i}`);
    if (chamber) chamber.classList.remove("active-chamber");
  }

  const charBoxes = promptTextEl.children;
  let index = 0;

  function decryptNext() {
    if (index >= HACK_CODE_LENGTH) {
      // Completed alignment! Turn cylinder and all pins green
      promptTextEl.classList.add("cracked");
      lockCylinder.classList.add("hacked-green");
      updatePickReadouts("set");

      // Turn the tension wrench / rotate cylinder to simulate opening
      playSynthSound("unlock");

      // Wait a bit and trigger success
      setTimeout(() => {
        finishGame(true);
      }, 700);
      return;
    }

    const box = charBoxes[index];
    if (box) {
      // Play rising beep sound
      playSynthSound("decrypt-step", index);

      // Swap class to decrypting
      box.classList.remove("correct", "faded", "current", "wrong");
      box.classList.add("decrypting");

      // Visual flash on chamber pin
      const chamber = document.getElementById(`chamber${index}`);
      if (chamber) {
        chamber.classList.remove("wiggle");
        chamber.offsetHeight;
        chamber.classList.add("wiggle", "decrypted");
      }
    }

    index++;
    const nextDelay = (index === HACK_CODE_LENGTH) ? 800 : 250;
    setTimeout(decryptNext, nextDelay);
  }

  // Start sequence with a 1000ms delay
  setTimeout(decryptNext, 1000);
}

function triggerSuccessFlash() {
  const successOverlay = document.getElementById("successFlashOverlay");
  if (successOverlay) {
    successOverlay.hidden = false;
    successOverlay.style.animation = 'none';
    successOverlay.offsetHeight;
    successOverlay.style.animation = '';
    setTimeout(() => { successOverlay.hidden = true; }, 600);
  }
}

// ── LOCKOUT ──
function triggerLockout() {
  // Pause timing
  if (running) {
    accumulatedTime += (Date.now() - currentWordStartedAt);
    running = false;
  }
  clearInterval(timerInterval);
  timerEl.textContent = (accumulatedTime / 1000).toFixed(1);

  isDecryptingAnimation = true;
  playSynthSound("lockout");

  // Door alarm animation
  securityDoor.classList.add("lockout");
  doorViewport.classList.add("lockout-bg");

  // Update status
  doorStatus.innerHTML = '<span class="status-dot"></span><span>LOCKOUT — SLOT GEBLOKKEERD</span>';

  if (tensionMeter) {
    tensionMeter.style.setProperty("--tension", "100%");
    tensionMeter.classList.remove("slipping", "set");
    tensionMeter.classList.add("overload");
  }
  if (tensionValue) {
    tensionValue.textContent = "JAM";
    tensionValue.style.color = "var(--red)";
  }

  addTerminalLog("!!! CILINDERPENNEN VASTGELOPEN !!! BEVEILIGINGSFACTOR OVERSCHREDEN.", "danger");
  addTerminalLog("TENSION SLIP GEDETECTEERD. LOCKPICK AFGEBROKEN.", "danger");

  setTimeout(() => {
    securityDoor.classList.remove("lockout");
    doorViewport.classList.remove("lockout-bg");
    finishGame(false);
    isDecryptingAnimation = false;
  }, 1200);
}

// ── FINISH GAME ──
function finishGame(won) {
  testFinished = true;
  gameWon = won;
  clearInterval(timerInterval);
  isDecryptingAnimation = false;

  // Clear highlights
  for (let i = 0; i < HACK_CODE_LENGTH; i++) {
    const chamber = document.getElementById(`chamber${i}`);
    if (chamber) chamber.classList.remove("active-chamber");
  }

  if (running) {
    accumulatedTime += (Date.now() - currentWordStartedAt);
    running = false;
  }
  totalTime = accumulatedTime / 1000;
  timerEl.textContent = totalTime.toFixed(1);

  if (won) {
    playSynthSound("complete");
    promptTextEl.classList.add("cracked");

    // Open door animation
    securityDoor.classList.add("door-opened");
    doorStatus.classList.add("unlocked");
    doorStatus.innerHTML = '<span class="status-dot"></span><span>ONTGRENDELD</span>';

    // Disable typing
    typingInput.disabled = true;

    // Transition door layout and show success panel on the right
    setTimeout(() => {
      securityDoor.classList.add("won-layout");

      if (successFinishButton) {
        successFinishButton.onclick = () => {
          calculateScores();
        };
      }

      addTerminalLog("ONTGRENDELING SUCCESVOL VOLTOOID. SLOT GEOPEND.", "success");
    }, 200);
  } else {
    // Show fail overlay immediately
    typingInput.disabled = true;
    typingOverlay.hidden = false;
    typingOverlay.classList.add("overlay-failed");
    overlayMessage.textContent = "LOCKOUT — SLOT GEBLOKKEERD";
    if (lockIcon) lockIcon.style.display = "none";
    if (unlockIcon) unlockIcon.style.display = "none";
    if (failIcon) failIcon.style.display = "block";

    addTerminalLog("INBREUK POGING AFGEBROKEN. SYSTEEM BLOKKEERT VAULT DOOR.", "danger");

    if (finishSpaceHint) finishSpaceHint.hidden = false;
    finishButton.hidden = false;
    finishButton.disabled = false;
  }
}

// ── COIN ANIMATION ──
function launchCoinParticles(sourceElement, targetElement, count) {
  const srcRect = sourceElement.getBoundingClientRect();
  const destRect = targetElement.getBoundingClientRect();

  for (let i = 0; i < count; i++) {
    const coin = document.createElement("div");
    coin.className = "floating-coin";
    document.body.appendChild(coin);

    const startX = srcRect.left + srcRect.width / 2;
    const startY = srcRect.top + srcRect.height / 2;
    const endX = destRect.left + destRect.width / 2;
    const endY = destRect.top + destRect.height / 2;

    coin.style.left = startX + "px";
    coin.style.top = startY + "px";

    const midX = startX + (endX - startX) / 2 + (Math.random() - 0.5) * 150;
    const midY = startY - 80 - Math.random() * 100;

    const duration = 600 + Math.random() * 300;
    const coinStartTime = performance.now();

    function animateCoin(now) {
      const elapsed = now - coinStartTime;
      const t = Math.min(elapsed / duration, 1);

      const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
      const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY;
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
  const stepDelay = 600;

  const rows = [
    { el: cpmCoinsReward, value: breakdownValues.cpm },
    { el: precisionCoinsReward, value: breakdownValues.precision },
    { el: streakCoinsReward, value: breakdownValues.streak },
    { el: completionCoinsReward, value: gameWon ? 50 : 0 }
  ];

  rows.forEach((row, index) => {
    setTimeout(() => {
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

      launchCoinParticles(row.el, targetLabel, 5);

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
  const elapsed = Math.max(totalTime, 1);
  const cpm = Math.round(correctKeystrokes / (elapsed / 60));
  completeCpm.textContent = "0";

  const acc = totalKeystrokes === 0 ? 100 : Math.round((correctKeystrokes / totalKeystrokes) * 100);
  completeAccuracy.textContent = "0%";
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
  if (diffKey.length > 1) {
    completeDifficultKey.classList.add("long-text");
  } else {
    completeDifficultKey.classList.remove("long-text");
  }

  // Coins
  const cpmCoins = Math.round(cpm * 0.4);
  const precisionCoins = Math.round(acc * 1.2);
  const streakCoins = Math.round(maxStreak * 2.0);
  const completionBonus = gameWon ? 50 : 0;
  const totalCoins = cpmCoins + precisionCoins + streakCoins + completionBonus;

  // Rank
  let rank = "Beginner Agent";
  if (gameWon) {
    if (cpm >= 180 && acc >= 96) rank = "Master Lockpicker";
    else if (cpm >= 120 && acc >= 90) rank = "Elite Lock-Kraker";
    else if (cpm >= 80) rank = "Veld Agent";
  } else {
    rank = "Gelocked Agent";
  }
  rankBadge.textContent = rank;

  // Result title & badge
  if (gameWon) {
    resultTitle.textContent = "DEUR SUCCESVOL GEOPEND!";
    missionStatusContainer.innerHTML = '<span class="status-success-badge" id="missionBadge">GESLAAGD</span>';
    completeAccuracy.className = "card-main-value highlight-green";
  } else {
    resultTitle.textContent = "LOCKOUT — MISSIE GEFAALD";
    missionStatusContainer.innerHTML = '<span class="status-failed-badge" id="missionBadge">GEFAALD</span>';
    completeAccuracy.className = "card-main-value highlight-red";
  }

  // Reset coin displays
  completeCoins.textContent = "0";
  cpmCoinsReward.innerHTML = `+0 <img src="coin.svg" width="14" height="14">`;
  precisionCoinsReward.innerHTML = `+0 <img src="coin.svg" width="14" height="14">`;
  streakCoinsReward.innerHTML = `+0 <img src="coin.svg" width="14" height="14">`;
  completionCoinsReward.innerHTML = `+${completionBonus} <img src="coin.svg" width="14" height="14">`;

  transitionToView(resultPanel, () => {
    animateNumberValue(completeCpm, cpm, 1000);
    animateNumberValue(completeAccuracy, acc, 1000, "%");
    animateNumberValue(completeStreak, maxStreak, 1000);

    animateCoinsBreakdown({
      cpm: cpmCoins,
      precision: precisionCoins,
      streak: streakCoins
    });
  });
}

function randomizePins() {
  const pinTypes = ["pin-standard", "pin-spool", "pin-serrated"];
  for (let i = 0; i < HACK_CODE_LENGTH; i++) {
    const chamber = document.getElementById(`chamber${i}`);
    if (chamber) {
      // Remove existing pin types
      chamber.classList.remove("pin-standard", "pin-spool", "pin-serrated");
      const randomType = pinTypes[Math.floor(Math.random() * pinTypes.length)];
      chamber.classList.add(randomType);

      // Randomize heights
      const keyHeight = Math.floor(Math.random() * 31) + 40; // 40 to 70px
      const driverHeight = 110 - keyHeight;
      const pickedSpringHeight = Math.max(0, 50 - driverHeight);
      const pinLift = Math.min(0, 50 - driverHeight);
      const turnDepth = Math.round(38 - keyHeight * 0.38);

      chamber.style.setProperty("--key-height", `${keyHeight}px`);
      chamber.style.setProperty("--driver-height", `${driverHeight}px`);
      chamber.style.setProperty("--picked-spring-height", `${pickedSpringHeight}px`);
      chamber.style.setProperty("--pin-lift", `${pinLift}px`);
      chamber.style.setProperty("--turn-depth", `${turnDepth}px`);
    }
  }
}

// ── RESET & START ──
function resetTest() {
  running = false;
  testFinished = false;
  gameWon = false;
  isDecryptingAnimation = false;
  clearInterval(timerInterval);

  accumulatedTime = 0;
  currentWordStartedAt = 0;
  codeCursor = 0;
  typedStates = [];

  // Reset promptText classes
  promptTextEl.classList.remove("cracked");
  lockCylinder.classList.remove("hacked-green", "rotating");
  if (lockCylinderContainer) {
    lockCylinderContainer.classList.remove("core-turned");
  }
  if (tensionWrench) {
    tensionWrench.style.transform = "rotate(0deg)";
  }

  totalKeystrokes = 0;
  correctKeystrokes = 0;
  mistakeCount = 0;
  currentStreak = 0;
  maxStreak = 0;
  mistakesPerKey = {};

  timerEl.textContent = "0.0";
  liveCpmEl.textContent = "0";
  mistakeCountEl.textContent = "0/3";
  accuracyEl.textContent = "100%";

  difficultyDropdown.classList.remove("disabled");

  // Setup first hack code
  currentCode = generateHackCode();
  randomizePins();
  codeLabelEl.textContent = "BINDING PINS:";
  
  addTerminalLog("INITIEER CILINDERSLOT DECRYPTION RIG...", "info");
  addTerminalLog(`MECHANISME GEKALIBREERD: GRAAD ${selectedDifficulty.toUpperCase()}`, "success");
  addTerminalLog("LOCKPICK INGEVOERD. START INTERCEPTIE.", "info");

  updateActiveChamberHighlight();
  updateLockpickPosition();
  renderPrompt();

  // Reset door visuals
  securityDoor.classList.remove("door-opened", "lockout", "won-layout");
  securityDoor.removeAttribute("style");
  doorViewport.classList.remove("lockout-bg");
  doorStatus.classList.remove("unlocked");
  doorStatus.innerHTML = '<span class="status-dot"></span><span>VERGRENDELD</span>';

  updateDoorVisuals();

  // Reset input states
  typingInput.value = "";
  typingInput.disabled = false;
  typingOverlay.hidden = true;
  typingOverlay.classList.remove("overlay-complete", "overlay-failed");
  if (finishSpaceHint) finishSpaceHint.hidden = true;

  if (lockIcon) lockIcon.style.display = "block";
  if (unlockIcon) unlockIcon.style.display = "none";
  if (failIcon) failIcon.style.display = "none";

  finishButton.hidden = true;

  if (resultPanel.classList.contains("active")) {
    resultPanel.hidden = true;
    resultPanel.classList.remove("active");
  }

  startHack();
}

function startHack() {
  getAudioContext();
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();

  typingOverlay.hidden = true;
  typingInput.disabled = false;
  typingInput.focus();
}

function addTerminalLog(text, type = "info") {
  console.log(`[${type.toUpperCase()}] ${text}`);
}

// ── EVENT LISTENERS ──
document.addEventListener("click", (e) => {
  if (!testFinished && !typingInput.disabled) {
    if (missionLayout.contains(e.target) && !difficultyDropdown.contains(e.target) && !resetButton.contains(e.target)) {
      typingInput.focus();
    }
  }
});

if (difficultyDropdownHeader) {
  difficultyDropdownHeader.addEventListener("click", (e) => {
    e.stopPropagation();
    if (running) return;
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

    if (!running) {
      addTerminalLog("INITIEER CILINDERSLOT DECRYPTION RIG...", "info");
      addTerminalLog(`MECHANISME GEKALIBREERD: GRAAD ${selectedDifficulty.toUpperCase()}`, "success");
      addTerminalLog("LOCKPICK INGEVOERD. START INTERCEPTIE.", "info");

      currentCode = generateHackCode();
      randomizePins();
      updateActiveChamberHighlight();
      updateLockpickPosition();
      renderPrompt();
    }
  });
});

document.addEventListener("click", (e) => {
  if (difficultyDropdown && !difficultyDropdown.contains(e.target)) {
    difficultyDropdown.classList.remove("open");
  }
});

typingInput.addEventListener("keydown", handleKeystroke);

finishButton.addEventListener("click", () => {
  calculateScores();
});

resetButton.addEventListener("click", () => {
  resetTest();
});

retryResultButton.addEventListener("click", () => {
  transitionToView(missionLayout, () => {
    resetTest();
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
    if (resultPanel.hidden) {
      const finishBtn = document.getElementById("finishButton");
      if (finishBtn) {
        finishBtn.classList.add("pressed");
        setTimeout(() => finishBtn.classList.remove("pressed"), 100);
      }
      const successFinishBtn = document.getElementById("successFinishButton");
      if (successFinishBtn) {
        successFinishBtn.classList.add("pressed");
        setTimeout(() => successFinishBtn.classList.remove("pressed"), 100);
      }
      calculateScores();
    } else {
      const retryBtn = document.getElementById("retryResultButton");
      if (retryBtn) {
        retryBtn.classList.add("pressed");
        setTimeout(() => retryBtn.classList.remove("pressed"), 100);
      }
      retryResultButton.click();
    }
  }
});

// Update pick positions dynamically on window resize
window.addEventListener("resize", () => {
  if (running || !testFinished) {
    updateLockpickPosition();
  }
});

// ── RED DOTTED WAVE BACKGROUND ──
function initDottedWaveBackground() {
  const canvas = document.getElementById("matrix-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const dotSpacing = 28;
  let cols = Math.floor(width / dotSpacing) + 1;
  let rows = Math.floor(height / dotSpacing) + 1;
  let time = 0;

  const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999, active: false };
  const easeFactor = 0.15;

  window.addEventListener("mousemove", (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.active = true;
  });

  window.addEventListener("mouseleave", () => { mouse.active = false; });

  window.addEventListener("touchmove", (e) => {
    if (e.touches.length > 0) {
      mouse.targetX = e.touches[0].clientX;
      mouse.targetY = e.touches[0].clientY;
      mouse.active = true;
    }
  }, { passive: true });

  window.addEventListener("touchend", () => { mouse.active = false; });

  function draw() {
    ctx.fillStyle = "#050000"; // Deep red/black
    ctx.fillRect(0, 0, width, height);
    time += 0.02;

    if (mouse.active) {
      if (mouse.x === -9999) {
        mouse.x = mouse.targetX;
        mouse.y = mouse.targetY;
      } else {
        mouse.x += (mouse.targetX - mouse.x) * easeFactor;
        mouse.y += (mouse.targetY - mouse.y) * easeFactor;
      }
    } else {
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
        const baseX = c * dotSpacing;
        const baseY = r * dotSpacing;
        const phase = c * 0.15 + r * 0.15 - time;
        const waveVal = Math.sin(phase);
        const dx = Math.cos(phase) * 3;
        const dy = waveVal * 6;

        let x = baseX + dx;
        let y = baseY + dy;
        let radius = 2.0;
        let opacity = 0.14 + (waveVal + 1) * 0.05;

        if (mouse.x !== -9999) {
          const dxMouse = x - mouse.x;
          const dyMouse = y - mouse.y;
          const dist = Math.hypot(dxMouse, dyMouse);
          const maxDist = 150;

          if (dist < maxDist) {
            const force = (maxDist - dist) / maxDist;
            const pushAngle = Math.atan2(dyMouse, dxMouse);
            const pushDist = force * 24;
            x += Math.cos(pushAngle) * pushDist;
            y += Math.sin(pushAngle) * pushDist;
            radius += force * 1.5;
            opacity += force * 0.35;
          }
        }

        // RED theme dots color
        ctx.fillStyle = `rgba(255, 59, 48, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  let lastTime = 0;
  const fps = 30;
  const interval = 1000 / fps;

  function animate(now) {
    requestAnimationFrame(animate);
    const delta = now - lastTime;
    if (delta > interval) {
      lastTime = now - (delta % interval);
      draw();
    }
  }
  requestAnimationFrame(animate);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    cols = Math.floor(width / dotSpacing) + 1;
    rows = Math.floor(height / dotSpacing) + 1;
  });
}

// ── ONBOARDING DEMO ANIMATION (Slide 3) ──
let demoAnimationTimeout = null;

function renderDemoTerminal(typedLen) {
  const targetCode = "kalfjp";
  let html = "";
  for (let i = 0; i < 6; i++) {
    let cls = "demo-char-box";
    let content = targetCode[i];
    if (i < typedLen) {
      cls += " correct";
    } else if (i === typedLen) {
      cls += " current";
    } else {
      cls += " faded";
    }
    html += `<div class="${cls}">${content}</div>`;
  }
  return html;
}

function startOnboardingDemoAnimation() {
  const demoCodeEl = document.getElementById("demoTerminalCode");
  const demoCylinder = document.getElementById("demoCylinder");
  const demoDoorStatus = document.getElementById("demoDoorStatus");
  if (!demoCodeEl || !demoCylinder || !demoDoorStatus) return;

  const targetCode = "kalfjp";
  let step = 0;

  const pins = demoCylinder.querySelectorAll(".mini-pin");
  const miniLockpick = demoCylinder.querySelector(".mini-lockpick");

  function clearAllDemoPins() {
    pins.forEach(pin => {
      pin.classList.remove("picked-demo");
    });
  }

  function nextStep() {
    if (onboardingComplete) {
      stopOnboardingDemoAnimation();
      return;
    }

    if (step === 0) {
      // Initial state
      demoCodeEl.innerHTML = renderDemoTerminal(0);
      demoDoorStatus.className = "mini-door-status-demo";
      demoDoorStatus.innerHTML = '<span class="status-dot"></span><span>VERGRENDELD</span>';
      clearAllDemoPins();
      if (miniLockpick) {
        miniLockpick.style.transform = "translate(0px, 0px)";
      }

      step = 1;
      demoAnimationTimeout = setTimeout(nextStep, 1000);
    } else if (step >= 1 && step <= 6) {
      const pinIdx = step - 1;

      if (miniLockpick) {
        // 1. Move to pin horizontally (each pin center is spaced by 17.3px)
        miniLockpick.style.transform = `translate(${pinIdx * 17.3}px, 0px)`;

        // 2. Lift up after 180ms
        setTimeout(() => {
          if (!onboardingComplete) {
            miniLockpick.style.transform = `translate(${pinIdx * 17.3}px, -9px)`;
          }
        }, 180);

        // 3. Set the pin and drop back after 320ms
        setTimeout(() => {
          if (!onboardingComplete) {
            if (pins[pinIdx]) {
              pins[pinIdx].classList.add("picked-demo");
            }
            miniLockpick.style.transform = `translate(${pinIdx * 17.3}px, 0px)`;
          }
        }, 320);
      } else {
        // Fallback if miniLockpick is missing
        if (pins[pinIdx]) {
          pins[pinIdx].classList.add("picked-demo");
        }
      }

      // Render typed chars
      demoCodeEl.innerHTML = renderDemoTerminal(step);

      step++;
      demoAnimationTimeout = setTimeout(nextStep, 500);
    } else if (step === 7) {
      // Unlock status
      demoDoorStatus.className = "mini-door-status-demo unlocked-demo";
      demoDoorStatus.innerHTML = '<span class="status-dot"></span><span>ONTGRENDELD</span>';

      step = 8;
      demoAnimationTimeout = setTimeout(nextStep, 2500);
    } else if (step === 8) {
      // Loop
      step = 0;
      nextStep();
    }
  }

  nextStep();
}

function stopOnboardingDemoAnimation() {
  if (demoAnimationTimeout) {
    clearTimeout(demoAnimationTimeout);
    demoAnimationTimeout = null;
  }
}

function resetOnboardingDemoAnimation() {
  stopOnboardingDemoAnimation();
  const demoCodeEl = document.getElementById("demoTerminalCode");
  const demoCylinder = document.getElementById("demoCylinder");
  const demoDoorStatus = document.getElementById("demoDoorStatus");
  if (demoCodeEl) {
    demoCodeEl.innerHTML = renderDemoTerminal(0);
  }
  if (demoCylinder) {
    const pins = demoCylinder.querySelectorAll(".mini-pin");
    pins.forEach(pin => pin.classList.remove("picked-demo"));
    const miniLockpick = demoCylinder.querySelector(".mini-lockpick");
    if (miniLockpick) {
      miniLockpick.style.transform = "translate(0px, 0px)";
    }
  }
  if (demoDoorStatus) {
    demoDoorStatus.className = "mini-door-status-demo";
    demoDoorStatus.innerHTML = '<span class="status-dot"></span><span>VERGRENDELD</span>';
  }
}

// ── INIT ──
function initBriefing() {
  initDottedWaveBackground();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initBriefing);
} else {
  initBriefing();
}
