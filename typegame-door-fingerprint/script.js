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
let decryptTimeout = null;
let decryptCycleInterval = null;
let startScanTimeout = null;

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

// Door elements
const securityDoor = document.getElementById("securityDoor");
const doorViewport = document.getElementById("doorViewport");
const doorStatus = document.getElementById("doorStatus");
const successPanelRight = document.getElementById("successPanelRight");
const successFinishButton = document.getElementById("successFinishButton");

// Fingerprint specific selectors
const ridgeGroup1 = document.getElementById("ridgeGroup1");
const ridgeGroup2 = document.getElementById("ridgeGroup2");
const ridgeGroup3 = document.getElementById("ridgeGroup3");
const laserLine = document.getElementById("laserLine");
const laserScannerGlow = document.getElementById("laserScannerGlow");
const fingerprintSvgGreen = document.getElementById("fingerprintSvgGreen");
const fingerprintWrapper = document.querySelector(".fingerprint-vector-wrapper");

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
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(600 + Math.random() * 300, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
    } else if (type === "scan-milestone") {
      // Sweeping high synth bleep when fingerprint sections lock
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      const startFreq = 800 + stepIndex * 200;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(startFreq + 300, now + 0.15);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    } else if (type === "decrypt-step") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      const startFreq = 450 + stepIndex * 80;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(startFreq + 100, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === "decrypt-cycle") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(900 + Math.random() * 400, now);
      gain.gain.setValueAtTime(0.012, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now); osc.stop(now + 0.03);
    } else if (type === "error") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(110, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now); osc.stop(now + 0.22);
    } else if (type === "unlock") {
      const frequencies = [523.25, 659.25, 783.99, 1046.50];
      frequencies.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + i * 0.06);
        gain.gain.setValueAtTime(0.06, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);
        osc.start(now + i * 0.06); osc.stop(now + i * 0.06 + 0.25);
      });
    } else if (type === "complete") {
      const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
      frequencies.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + i * 0.05);
        gain.gain.setValueAtTime(0.07, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.35);
        osc.start(now + i * 0.05); osc.stop(now + i * 0.05 + 0.35);
      });
    } else if (type === "scan-glitch") {
      // Short bzzzp glitch sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Add a bandpass filter to make it sound thin/radio-like
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1000, now);
      filter.Q.setValueAtTime(1.5, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(80 + Math.random() * 80, now);
      osc.frequency.linearRampToValueAtTime(180 + Math.random() * 100, now + 0.08);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (type === "lockout") {
      // Alarm siren descending
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.65);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.start(now); osc.stop(now + 0.65);
    } else if (type === "coin") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      osc1.connect(gain1); gain1.connect(ctx.destination);
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc1.type = "sine"; osc1.frequency.setValueAtTime(987.77, now);
      osc2.type = "sine"; osc2.frequency.setValueAtTime(1318.51, now + 0.04);
      gain1.gain.setValueAtTime(0.05, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      gain2.gain.setValueAtTime(0.05, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.start(now); osc1.stop(now + 0.12);
      osc2.start(now + 0.04); osc2.stop(now + 0.18);
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

    const children = nextView.querySelectorAll(".briefing-panel, .lock-workbench, .result-container");
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

    // Handle Slide 3 active / inactive state
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

// ── DIFFICULTY MAPPINGS & CHARACTER POOLS ──
const DIFFICULTY_POOLS = {
  easy: {
    chars: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'q', ' ', 'p']
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

// ── CODE GENERATOR ──
function generateHackCode() {
  const pool = DIFFICULTY_POOLS[selectedDifficulty].chars;
  let code = "";
  for (let i = 0; i < HACK_CODE_LENGTH; i++) {
    code += pool[Math.floor(Math.random() * pool.length)];
  }
  return code;
}

// ── RENDER & SCANNER INTERACTION ──
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
}

function updateFingerprintRidges() {
  // Reset ridge groupings classes
  ridgeGroup1.classList.remove("active", "cracked");
  ridgeGroup2.classList.remove("active", "cracked");
  ridgeGroup3.classList.remove("active", "cracked");

  // Ridges turn yellow based on typing progress (for each 2 letters)
  if (codeCursor >= 2) {
    ridgeGroup1.classList.add("active");
  }
  if (codeCursor >= 4) {
    ridgeGroup2.classList.add("active");
  }
  if (codeCursor >= 6) {
    ridgeGroup3.classList.add("active");
  }
}

function updateActiveNodeHighlight() {
  // Active node highlight indicators removed as per user request
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

    addTerminalLog("FINGERPRINT SCAN INTERCEPTIE GESTART...", "warning");
  }

  totalKeystrokes++;
  const targetChar = currentCode[codeCursor];

  if (e.key === targetChar) {
    if (!typedStates[codeCursor]) {
      typedStates[codeCursor] = "correct";
    }

    codeCursor++;
    correctKeystrokes++;
    currentStreak++;
    if (currentStreak > maxStreak) maxStreak = currentStreak;

    // Milestone sound triggers when a section turns yellow (every 2 correct letters)
    if (codeCursor % 2 === 0) {
      playSynthSound("scan-milestone", codeCursor / 2);
    } else {
      playSynthSound("click");
    }

    updateFingerprintRidges();
    updateActiveNodeHighlight();
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

    // Log the error
    const inputKey = e.key === " " ? "spatie" : e.key;
    const expectedKey = targetChar === " " ? "spatie" : targetChar;
    addTerminalLog(`SCAN FOUL: VERKEERDE AFDRUK DATA. GEZOCHT: '${expectedKey}', ONTVANGEN: '${inputKey}'`, "danger");

    playSynthSound("error");

    updateActiveNodeHighlight();
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
  typingInput.disabled = true; // Stop any key inputs immediately

  // Setup initial position of the laser line and glow at the top (3%)
  if (laserLine) {
    laserLine.style.animation = "none";
    laserLine.style.transition = "none";
    laserLine.style.opacity = "1";
    laserLine.style.top = "3%";
    laserLine.style.background = "linear-gradient(90deg, transparent, var(--green), transparent)";
    laserLine.style.boxShadow = "0 0 12px var(--green), 0 0 25px var(--green-glow)";
  }
  if (laserScannerGlow) {
    laserScannerGlow.style.animation = "none";
    laserScannerGlow.style.transition = "none";
    laserScannerGlow.style.opacity = "0.7";
    laserScannerGlow.style.top = "3%";
    laserScannerGlow.style.background = "linear-gradient(to bottom, rgba(154, 215, 68, 0) 0%, rgba(154, 215, 68, 0.3) 35%, rgba(154, 215, 68, 0.75) 50%, rgba(154, 215, 68, 0.3) 65%, rgba(154, 215, 68, 0) 100%)";
  }

  // Delay the actual sweep movement by 600ms to allow a pause before scanning
  startScanTimeout = setTimeout(() => {
    if (!isDecryptingAnimation) return;

    const scanDuration = 1850; // 1.85 seconds
    const startTime = Date.now();

    function tickScan() {
      if (!isDecryptingAnimation) return; // Safety check in case of reset

      const elapsed = Date.now() - startTime;
      const p = Math.min(elapsed / scanDuration, 1);

      // Smooth linear sweep position
      const targetTop = 3 + 94 * p;

      if (laserLine) {
        laserLine.style.top = `${targetTop}%`;
        // Smooth sweep with light flickers
        laserLine.style.opacity = Math.random() > 0.12 ? "1" : "0.5";
      }
      if (laserScannerGlow) {
        laserScannerGlow.style.top = `${targetTop}%`;
        // Smooth sweep with light flickers
        laserScannerGlow.style.opacity = Math.random() > 0.15 ? "0.85" : "0.35";
      }

      // Dynamically update green layer clip path to follow the laser line like a printer
      if (fingerprintSvgGreen && laserLine) {
        const wrapperRect = fingerprintSvgGreen.getBoundingClientRect();
        const laserRect = laserLine.getBoundingClientRect();
        const laserY = laserRect.top + laserRect.height / 2;
        const relativePos = (laserY - wrapperRect.top) / wrapperRect.height;
        const clipPercentage = Math.max(0, Math.min(100, relativePos * 100));
        fingerprintSvgGreen.style.clipPath = `inset(0 0 ${100 - clipPercentage}% 0)`;
      }

      // Play glitch sound periodically
      if (p < 1 && Math.random() < 0.22) {
        playSynthSound("scan-glitch");
      }

      if (p < 1) {
        requestAnimationFrame(tickScan);
      } else {
        // Done scanning! Fade them out smoothly.
        if (laserLine) {
          laserLine.style.transition = "opacity 0.4s ease";
          laserLine.style.opacity = "0";
        }
        if (laserScannerGlow) {
          laserScannerGlow.style.transition = "opacity 0.4s ease";
          laserScannerGlow.style.opacity = "0";
        }

        if (fingerprintSvgGreen) {
          fingerprintSvgGreen.style.clipPath = "inset(0 0 0% 0)";
        }

        // Add glow pulse class to the wrapper
        if (fingerprintWrapper) {
          fingerprintWrapper.classList.add("success-pulse");
        }

        // Immediately start fading the fingerprint and boxes to green
        promptTextEl.classList.add("cracked");
        if (ridgeGroup1) ridgeGroup1.classList.add("cracked");
        if (ridgeGroup2) ridgeGroup2.classList.add("cracked");
        if (ridgeGroup3) ridgeGroup3.classList.add("cracked");

        // Play completion chime arpeggio
        playSynthSound("complete");

        // Wait a small amount to let the green fade finish, then unlock door and show success panel
        decryptTimeout = setTimeout(() => {
          finishGame(true);
        }, 1400);
      }
    }

    requestAnimationFrame(tickScan);
  }, 600);
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
  doorStatus.innerHTML = '<span class="status-dot"></span><span>LOCKOUT — ALARM ACTIEF</span>';

  addTerminalLog("!!! UNBEVOEGDE VINGERAFDRUK GEDETECTEERD !!! BEVEILIGINGSALARM.", "danger");
  addTerminalLog("SYNTHESE RIG AFGEBROKEN. INTERFACE VASTGELOPEN.", "danger");

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

  // Restore sweep speeds or disable scanner laser
  if (laserLine) {
    laserLine.style.animation = "";
  }
  if (laserScannerGlow) {
    laserScannerGlow.style.animation = "";
  }

  // Clear indicators removed as per user request

  if (running) {
    accumulatedTime += (Date.now() - currentWordStartedAt);
    running = false;
  }
  totalTime = accumulatedTime / 1000;
  timerEl.textContent = totalTime.toFixed(1);

  if (won) {
    promptTextEl.classList.add("cracked");

    // Turn fingerprint green
    if (ridgeGroup1) ridgeGroup1.classList.add("cracked");
    if (ridgeGroup2) ridgeGroup2.classList.add("cracked");
    if (ridgeGroup3) ridgeGroup3.classList.add("cracked");
    if (fingerprintSvgGreen) {
      fingerprintSvgGreen.style.clipPath = "inset(0 0 0% 0)";
    }

    // Open door animation
    securityDoor.classList.add("door-opened");
    doorStatus.classList.add("unlocked");
    doorStatus.innerHTML = '<span class="status-dot"></span><span>ONTGRENDELD</span>';

    // Play unlock sound
    playSynthSound("unlock");

    // Disable typing
    typingInput.disabled = true;

    // Transition door layout and show success panel
    setTimeout(() => {
      securityDoor.classList.add("won-layout");

      if (successFinishButton) {
        successFinishButton.onclick = () => {
          calculateScores();
        };
      }
      addTerminalLog("DEURBEVEILIGING MET SUCCES BYPASSED. TOEGANG VERLEEND.", "success");
    }, 200);
  } else {
    // Show fail overlay
    typingInput.disabled = true;
    typingOverlay.hidden = false;
    typingOverlay.classList.add("overlay-failed");
    overlayMessage.textContent = "LOCKOUT — DEUR GEBLOKKEERD";
    if (lockIcon) lockIcon.style.display = "none";
    if (unlockIcon) unlockIcon.style.display = "none";
    if (failIcon) failIcon.style.display = "block";

    addTerminalLog("HACK POGING AFGEBROKEN. VAULT DEUR GEBLOKKEERD.", "danger");

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

  // Rank
  let rank = "Hacking Groentje";
  if (gameWon) {
    if (cpm >= 180 && acc >= 96) rank = "Master Scanner Bypass";
    else if (cpm >= 120 && acc >= 90) rank = "Elite Afdruksynthese";
    else if (cpm >= 80) rank = "Veld Agent";
  } else {
    rank = "Buitengesloten Agent";
  }
  rankBadge.textContent = rank;

  // Result title & badge
  if (gameWon) {
    resultTitle.textContent = "SCANNERS OMZEILD!";
    resultTitle.className = "result-title-success";
    missionStatusContainer.innerHTML = '<span class="status-success-badge" id="missionBadge">GESLAAGD</span>';
    completeAccuracy.className = "card-main-value highlight-green";
  } else {
    resultTitle.textContent = "LOCKOUT — DEUR GEBLOKKEERD";
    resultTitle.className = "result-title-failed";
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

// ── RESET & START ──
function resetTest() {
  running = false;
  testFinished = false;
  gameWon = false;
  isDecryptingAnimation = false;
  clearInterval(timerInterval);
  clearTimeout(decryptTimeout);
  clearTimeout(startScanTimeout);
  clearInterval(decryptCycleInterval);
  decryptCycleInterval = null;

  accumulatedTime = 0;
  currentWordStartedAt = 0;
  codeCursor = 0;
  typedStates = [];

  // Reset SVG elements
  promptTextEl.classList.remove("cracked");
  if (ridgeGroup1) ridgeGroup1.classList.remove("active", "cracked");
  if (ridgeGroup2) ridgeGroup2.classList.remove("active", "cracked");
  if (ridgeGroup3) ridgeGroup3.classList.remove("active", "cracked");
  if (fingerprintSvgGreen) {
    fingerprintSvgGreen.style.clipPath = "inset(0 0 100% 0)";
  }
  if (fingerprintWrapper) {
    fingerprintWrapper.classList.remove("success-pulse");
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
  codeLabelEl.textContent = "BIOMETRIC SEQUENCE:";

  addTerminalLog("INITIALISEER SYNTHESIS BYPASS SYSTEM...", "info");
  addTerminalLog(`MECHANISME GEKALIBREERD: DIFFICULTY ${selectedDifficulty.toUpperCase()}`, "success");
  addTerminalLog("SCANNER SYNCHRONISATIE STANDBY. START INTERCEPTIE.", "info");

  updateActiveNodeHighlight();
  renderPrompt();

  // Reset door visuals
  securityDoor.classList.remove("door-opened", "lockout", "won-layout");
  securityDoor.removeAttribute("style");
  doorViewport.classList.remove("lockout-bg");
  doorStatus.classList.remove("unlocked");
  doorStatus.innerHTML = '<span class="status-dot"></span><span>VERGRENDELD</span>';

  updateDoorVisuals();

  if (laserLine) {
    laserLine.removeAttribute("style");
  }
  if (laserScannerGlow) {
    laserScannerGlow.removeAttribute("style");
  }

  // Reset input states
  typingInput.value = "";
  typingInput.disabled = false;
  typingOverlay.hidden = true;
  typingOverlay.classList.remove("overlay-complete", "overlay-failed");
  if (finishSpaceHint) finishSpaceHint.hidden = true;

  if (lockIcon) lockIcon.style.display = "block";
  if (unlockIcon) unlockIcon.style.display = "none";
  if (failIcon) failIcon.style.display = "none";

  if (finishButton) {
    finishButton.hidden = true;
  }

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
      addTerminalLog("INITIALISEER SYNTHESIS BYPASS SYSTEM...", "info");
      addTerminalLog(`MECHANISME GEKALIBREERD: DIFFICULTY ${selectedDifficulty.toUpperCase()}`, "success");
      currentCode = generateHackCode();
      updateActiveNodeHighlight();
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

if (finishButton) {
  finishButton.addEventListener("click", () => {
    calculateScores();
  });
}

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

// ── DOTTED WAVE BACKGROUND ──
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
    ctx.fillStyle = "#050206";
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
        let opacity = 0.12 + (waveVal + 1) * 0.05;

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

        ctx.fillStyle = `rgba(154, 215, 68, ${opacity})`;
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

function renderDemoScreenSlots(typedLen) {
  const targetCode = "bypass";
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
  const demoSlotsEl = document.getElementById("demoScreenSlots");
  const demoScanner = document.getElementById("demoScanner");
  const demoDoorStatus = document.getElementById("demoDoorStatus");
  if (!demoSlotsEl || !demoScanner || !demoDoorStatus) return;

  const targetCode = "bypass";
  let step = 0;

  const ridgeGroups = [
    demoScanner.querySelector("#demoRidgeGroup1"),
    demoScanner.querySelector("#demoRidgeGroup2"),
    demoScanner.querySelector("#demoRidgeGroup3")
  ];

  function updateDemoRidges(curLen) {
    ridgeGroups.forEach(rg => {
      if (rg) rg.classList.remove("active", "cracked");
    });

    if (curLen >= 2 && ridgeGroups[0]) ridgeGroups[0].classList.add("active");
    if (curLen >= 4 && ridgeGroups[1]) ridgeGroups[1].classList.add("active");
    if (curLen >= 6 && ridgeGroups[2]) ridgeGroups[2].classList.add("active");
  }

  function markDemoRidgesCracked() {
    ridgeGroups.forEach(rg => {
      if (rg) {
        rg.classList.remove("active");
        rg.classList.add("cracked");
      }
    });
  }

  function nextStep() {
    if (onboardingComplete) {
      stopOnboardingDemoAnimation();
      return;
    }

    if (step === 0) {
      // Initial state
      demoSlotsEl.innerHTML = renderDemoScreenSlots(0);
      demoDoorStatus.className = "mini-door-status-demo";
      demoDoorStatus.innerHTML = '<span class="status-dot"></span><span>VERGRENDELD</span>';
      updateDemoRidges(0);

      step = 1;
      demoAnimationTimeout = setTimeout(nextStep, 1000);
    } else if (step >= 1 && step <= 6) {
      // Render typed chars in slots
      demoSlotsEl.innerHTML = renderDemoScreenSlots(step);
      updateDemoRidges(step);

      step++;
      demoAnimationTimeout = setTimeout(nextStep, 500);
    } else if (step === 7) {
      // Unlock status
      demoDoorStatus.className = "mini-door-status-demo unlocked-demo";
      demoDoorStatus.innerHTML = '<span class="status-dot"></span><span>ONTGRENDELD</span>';
      markDemoRidgesCracked();

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
  const demoSlotsEl = document.getElementById("demoScreenSlots");
  const demoScanner = document.getElementById("demoScanner");
  const demoDoorStatus = document.getElementById("demoDoorStatus");
  if (demoSlotsEl) {
    demoSlotsEl.innerHTML = renderDemoScreenSlots(0);
  }
  if (demoScanner) {
    const ridgeGroups = [
      demoScanner.querySelector("#demoRidgeGroup1"),
      demoScanner.querySelector("#demoRidgeGroup2"),
      demoScanner.querySelector("#demoRidgeGroup3")
    ];
    ridgeGroups.forEach(rg => {
      if (rg) rg.classList.remove("active", "cracked");
    });
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
