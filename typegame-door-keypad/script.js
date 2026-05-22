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
let soundEnabled = false;

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
const keypadGrid = document.getElementById("keypadGrid");
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
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now); osc.stop(now + 0.04);
    } else if (type === "decrypt-step") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      const startFreq = 600 + stepIndex * 120;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(startFreq + 150, now + 0.12);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now); osc.stop(now + 0.12);
    } else if (type === "error") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(100, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
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
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + i * 0.05);
        gain.gain.setValueAtTime(0.08, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.35);
        osc.start(now + i * 0.05); osc.stop(now + i * 0.05 + 0.35);
      });
    } else if (type === "lockout") {
      // Alarm siren descending
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.6);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
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

    const children = nextView.querySelectorAll(".briefing-panel, .hack-console, .result-summary");
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
    chars: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'q', ' ', 'p'],
    keypadMapping: {
      '1': 'a', '2': 's', '3': 'd',
      '4': 'f', '5': 'g', '6': 'h',
      '7': 'j', '8': 'k', '9': 'l',
      '*': 'q', '0': ' ', '#': 'p'
    }
  },
  medium: {
    chars: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'q', '0', 'w'],
    keypadMapping: {
      '1': '1', '2': '2', '3': '3',
      '4': '4', '5': '5', '6': '6',
      '7': '7', '8': '8', '9': '9',
      '*': 'q', '0': '0', '#': 'w'
    }
  },
  hard: {
    chars: ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'],
    keypadMapping: {
      '1': '!', '2': '@', '3': '#',
      '4': '$', '5': '%', '6': '^',
      '7': '&', '8': '*', '9': '(',
      '*': ')', '0': '_', '#': '+'
    }
  },
  expert: {
    chars: ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Q', 'S'],
    keypadMapping: {
      '1': 'A', '2': 'Z', '3': 'E',
      '4': 'R', '5': 'T', '6': 'Y',
      '7': 'U', '8': 'I', '9': 'O',
      '*': 'P', '0': 'Q', '#': 'S'
    }
  }
};

// ── KEYPAD & TERMINAL LOG HELPERS ──
function getKeypadNumForChar(char) {
  const pool = DIFFICULTY_POOLS[selectedDifficulty];
  if (!pool) return null;
  for (const [keypadNum, mappedChar] of Object.entries(pool.keypadMapping)) {
    if (mappedChar === char) {
      return keypadNum;
    }
  }
  return null;
}

function updateKeypadLabels() {
  const pool = DIFFICULTY_POOLS[selectedDifficulty];
  if (!pool) return;
  const allBtns = keypadGrid.querySelectorAll(".keypad-btn");
  allBtns.forEach(btn => {
    const num = btn.dataset.num;
    const mappedChar = pool.keypadMapping[num];
    const charSpan = btn.querySelector(".btn-char");
    if (charSpan) {
      charSpan.textContent = mappedChar === ' ' ? '␣' : mappedChar;
    }
  });
}

function updateActiveKeypadButton() {
  const allBtns = keypadGrid.querySelectorAll(".keypad-btn");
  allBtns.forEach(btn => btn.classList.remove("active-target"));

  if (!testFinished && !isDecryptingAnimation && codeCursor < currentCode.length) {
    const targetChar = currentCode[codeCursor];
    const keypadNum = getKeypadNumForChar(targetChar);
    if (keypadNum) {
      allBtns.forEach(btn => {
        if (btn.dataset.num === keypadNum) {
          btn.classList.add("active-target");
        }
      });
    }
  }
}

function flashKeypadButton(keypadNum, type) {
  if (!keypadNum) return;
  const allBtns = keypadGrid.querySelectorAll(".keypad-btn");
  allBtns.forEach(btn => {
    if (btn.dataset.num === keypadNum) {
      const cls = type === "success" ? "success-flash" : "error-flash";
      btn.classList.add(cls);
      setTimeout(() => {
        btn.classList.remove(cls);
      }, 200);
    }
  });
}

function addTerminalLog(text, type = "info") {
  console.log(`[${type.toUpperCase()}] ${text}`);
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

// PIN generator removed (single-round gameplay)

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

    addTerminalLog("INTERCEPTIE BEGONNEN - TIMING GESTART...", "warning");
  }

  totalKeystrokes++;
  const targetChar = currentCode[codeCursor];
  const keypadNum = getKeypadNumForChar(targetChar);

  if (e.key === targetChar) {
    if (!typedStates[codeCursor]) {
      typedStates[codeCursor] = "correct";
    }

    // Success flash for the keypad button
    flashKeypadButton(keypadNum, "success");

    codeCursor++;
    correctKeystrokes++;
    currentStreak++;
    if (currentStreak > maxStreak) maxStreak = currentStreak;

    playSynthSound("click");
    
    // Update active keypad button glow for the NEXT character
    updateActiveKeypadButton();
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

    // Error flash for the target keypad button
    flashKeypadButton(keypadNum, "error");

    // Log the error
    const inputKey = e.key === " " ? "spatie" : e.key;
    const expectedKey = targetChar === " " ? "spatie" : targetChar;
    addTerminalLog(`INTERCEPTIE-FOUT: VERKEERDE TOETS REGISTRATIE. VERWACHT: '${expectedKey}', ONTVANGEN: '${inputKey}'`, "danger");

    playSynthSound("error");

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

  // Stop the timer immediately so the elapsed time doesn't count the animation time
  if (running) {
    accumulatedTime += (Date.now() - currentWordStartedAt);
    running = false;
  }
  clearInterval(timerInterval);
  timerEl.textContent = (accumulatedTime / 1000).toFixed(1);

  difficultyDropdown.classList.add("disabled");

  // Clear any active target highlights on keypad
  const allBtns = keypadGrid.querySelectorAll(".keypad-btn");
  allBtns.forEach(btn => btn.classList.remove("active-target"));

  const charBoxes = promptTextEl.children;
  let index = 0;

  function decryptNext() {
    if (index >= HACK_CODE_LENGTH) {
      // Completed decryption! Turn code text and all keys green at the same time
      promptTextEl.classList.add("cracked");
      const allBtns = keypadGrid.querySelectorAll(".keypad-btn");
      allBtns.forEach(btn => btn.classList.add("hacked-green"));

      // Wait a bit and trigger success
      setTimeout(() => {
        finishGame(true);
      }, 600);
      return;
    }

    const box = charBoxes[index];
    if (box) {
      const char = currentCode[index];
      const keypadDigit = getKeypadNumForChar(char);

      // Play rising beep sound
      playSynthSound("decrypt-step", index);

      // Change text content to the mapped digit
      box.textContent = keypadDigit !== null ? keypadDigit : char;

      // Swap class to decrypting
      box.classList.remove("correct", "faded", "current", "wrong");
      box.classList.add("decrypting");

      // Flash corresponding keypad button green
      if (keypadDigit !== null) {
        flashKeypadButton(keypadDigit, "success");
      }
    }

    index++;
    const nextDelay = (index === HACK_CODE_LENGTH) ? 800 : 300;
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

// Digit reveal sequence removed (single-round gameplay)

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
  doorStatus.innerHTML = '<span class="status-dot"></span><span>LOCKOUT — ALARM ACTIEF</span>';

  addTerminalLog("!!! BRUTE-FORCE INBREUK GEDETECTEERD !!! BEVEILIGINGSFACTOR OVERSCHREDEN.", "danger");
  addTerminalLog("BEVEILIGINGSDEUR GEBLOKKEERD. VERBINDING GEBROKEN.", "danger");

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

  // Clear keypad target highlights
  const allBtns = keypadGrid.querySelectorAll(".keypad-btn");
  allBtns.forEach(btn => btn.classList.remove("active-target"));

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

    // Disable typing immediately
    typingInput.disabled = true;

    // Transition door layout and show success panel on the right
    setTimeout(() => {
      securityDoor.classList.add("won-layout");

      if (successFinishButton) {
        successFinishButton.onclick = () => {
          calculateScores();
        };
      }

      addTerminalLog("DECOUPELING SUCCESVOL VOLTOOID. TOEGANG VERLEEND.", "success");
    }, 200); // 200ms delay for key turn green pause before expanding layout
  } else {
    // Show fail overlay immediately
    typingInput.disabled = true;
    typingOverlay.hidden = false;
    typingOverlay.classList.add("overlay-failed");
    overlayMessage.textContent = "LOCKOUT — DEUR GEBLOKKEERD";
    if (lockIcon) lockIcon.style.display = "none";
    if (unlockIcon) unlockIcon.style.display = "none";
    if (failIcon) failIcon.style.display = "block";

    addTerminalLog("INBREUK POGING AFGEBROKEN. SYSTEEM LONT UIT.", "danger");

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
    if (cpm >= 180 && acc >= 96) rank = "Master Hacker";
    else if (cpm >= 120 && acc >= 90) rank = "Elite Code-Kraker";
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

  // Reset keypad labels and clear targets/hacked states
  updateKeypadLabels();
  const allBtns = keypadGrid.querySelectorAll(".keypad-btn");
  allBtns.forEach(btn => btn.classList.remove("active-target", "hacked-green"));

  // Setup first hack code
  currentCode = generateHackCode();
  codeLabelEl.textContent = "HACKCODE:";
  
  addTerminalLog("INITIEER BEVEILIGINGSINTERCEPTIE SYSTEEM...", "info");
  addTerminalLog(`KEYPAD MAPPING GESYNCHRONISEERD: GRAAD ${selectedDifficulty.toUpperCase()}`, "success");
  addTerminalLog("VERBINDING TOT STAND GEBRACHT. HACKCODE GEGENEREERD.", "info");

  updateActiveKeypadButton();
  renderPrompt();

  // Reset door visuals
  securityDoor.classList.remove("door-opened", "lockout", "won-layout");
  securityDoor.removeAttribute("style");
  doorViewport.classList.remove("lockout-bg");
  doorStatus.classList.remove("unlocked");
  doorStatus.innerHTML = '<span class="status-dot"></span><span>VERGRENDELD</span>';

  // Success panel visibility is handled via CSS transition when won-layout is toggled

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
      addTerminalLog("INITIEER BEVEILIGINGSINTERCEPTIE SYSTEEM...", "info");
      addTerminalLog(`KEYPAD MAPPING GESYNCHRONISEERD: GRAAD ${selectedDifficulty.toUpperCase()}`, "success");
      addTerminalLog("VERBINDING TOT STAND GEBRACHT. HACKCODE GEGENEREERD.", "info");

      updateKeypadLabels();
      currentCode = generateHackCode();
      updateActiveKeypadButton();
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
    ctx.fillStyle = "#050512";
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
  const demoKeypad = document.getElementById("demoKeypad");
  const demoDoorStatus = document.getElementById("demoDoorStatus");
  if (!demoCodeEl || !demoKeypad || !demoDoorStatus) return;

  const targetCode = "kalfjp";
  const keySequence = [7, 0, 8, 3, 6, 11]; // Keypad indices to highlight/type
  let step = 0;

  const btns = demoKeypad.querySelectorAll(".mini-keypad-btn-demo");

  function clearAllKeypadHighlights() {
    btns.forEach(btn => {
      btn.classList.remove("active-demo", "success-demo");
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
      clearAllKeypadHighlights();

      // Highlight the first target button
      const targetBtnIndex = keySequence[0];
      if (btns[targetBtnIndex]) {
        btns[targetBtnIndex].classList.add("active-demo");
      }

      step = 1;
      demoAnimationTimeout = setTimeout(nextStep, 1000);
    } else if (step >= 1 && step <= 6) {
      const charIdx = step - 1;
      const currentBtnIndex = keySequence[charIdx];
      const nextBtnIndex = keySequence[step];

      // Simulate keypress
      if (btns[currentBtnIndex]) {
        btns[currentBtnIndex].classList.remove("active-demo");
        btns[currentBtnIndex].classList.add("success-demo");
        setTimeout(() => {
          if (btns[currentBtnIndex]) btns[currentBtnIndex].classList.remove("success-demo");
        }, 150);
      }

      // Render typed chars
      demoCodeEl.innerHTML = renderDemoTerminal(step);

      // Highlight next target button
      if (step < 6 && btns[nextBtnIndex]) {
        btns[nextBtnIndex].classList.add("active-demo");
      }

      step++;
      demoAnimationTimeout = setTimeout(nextStep, 500);
    } else if (step === 7) {
      // Unlock status
      demoDoorStatus.className = "mini-door-status-demo unlocked-demo";
      demoDoorStatus.innerHTML = '<span class="status-dot"></span><span>ONTGRENDELD</span>';

      // Flash all keys green
      btns.forEach(btn => btn.classList.add("success-demo"));

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
  const demoKeypad = document.getElementById("demoKeypad");
  const demoDoorStatus = document.getElementById("demoDoorStatus");
  if (demoCodeEl) {
    demoCodeEl.innerHTML = renderDemoTerminal(0);
  }
  if (demoKeypad) {
    const btns = demoKeypad.querySelectorAll(".mini-keypad-btn-demo");
    btns.forEach(btn => btn.classList.remove("active-demo", "success-demo"));
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
