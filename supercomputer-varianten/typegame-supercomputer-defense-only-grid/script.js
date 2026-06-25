// ── GAME CONSTANTS ──
const GAME_DURATION = 60.0; // 60 seconds survival
const GRID_COLS = 6;
const GRID_ROWS = 4;
const GRID_SIZE = GRID_COLS * GRID_ROWS; // 24 sectors

// Difficulty configurations
const DIFFICULTY_CONFIGS = {
  easy: {
    pool: [
      "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
      "a", "s", "d", "f", "g", "h", "j", "k", "l",
      "z", "x", "c", "v", "b", "n", "m"
    ],
    spawnInterval: 2400, // ms between hacks (was 3200)
    maxBurst: 3, // was 2
    minSpawnIntervalMultiplier: 0.5,
    speedMultiplier: 0.7
  },
  medium: {
    pool: [
      "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
      "a", "s", "d", "f", "g", "h", "j", "k", "l",
      "z", "x", "c", "v", "b", "n", "m"
    ],
    spawnInterval: 1800, // was 2400
    maxBurst: 4, // was 2
    minSpawnIntervalMultiplier: 0.4,
    speedMultiplier: 1.0
  },
  hard: {
    pool: [
      "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
      "a", "s", "d", "f", "g", "h", "j", "k", "l",
      "z", "x", "c", "v", "b", "n", "m",
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"
    ],
    spawnInterval: 1300, // was 1800
    maxBurst: 5, // was 3
    minSpawnIntervalMultiplier: 0.3,
    speedMultiplier: 1.3
  },
  expert: {
    pool: [
      "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
      "a", "s", "d", "f", "g", "h", "j", "k", "l",
      "z", "x", "c", "v", "b", "n", "m",
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"
    ],
    spawnInterval: 900, // was 1200
    maxBurst: 6, // was 4
    minSpawnIntervalMultiplier: 0.25,
    speedMultiplier: 1.6
  }
};

// ── STATE VARIABLES ──
let running = false;
let testFinished = false;
let gameWon = false;
let startedAt = 0;
let elapsedTime = 0;
let compromiseLevel = 0; // 0 to 100%
let mistakes = 0;
let totalRepairs = 0;
let transitioning = false;

// Stats tracking
let totalKeystrokes = 0;
let correctKeystrokes = 0;
let currentStreak = 0;
let maxStreak = 0;
let mistakesPerKey = {};

// Live grid model
let gridCells = []; // Objects: { index, letter, el, labelEl, hacked, hackedAt }
let currentPool = []; // Letters used to (re)fill cells

// Briefing states
let activeBriefingSlide = 0;
let onboardingComplete = false;

// Audio
let audioCtx = null;
let soundEnabled = true;

// Loops
let gameInterval = null;
let hackSpawnerTimeout = null;

// ── DOM SELECTORS ──
const timerEl = document.getElementById("timer");
const liveCpmEl = document.getElementById("liveCpm");
const accuracyEl = document.getElementById("accuracy");
const mistakeCountEl = document.getElementById("mistakeCount");
const compromisePctEl = document.getElementById("compromisePct");
const compromiseFillEl = document.getElementById("compromiseFill");
const sectorGridEl = document.getElementById("sectorGrid");
const statusLogEl = document.getElementById("statusLog");
const consolePingEl = document.getElementById("consolePing");
const gameContainerEl = document.getElementById("gameContainer");
const defenseBoardEl = document.getElementById("defenseBoard");
const waveReadoutEl = document.getElementById("waveReadout");

const storyStage = document.getElementById("storyStage");
const missionLayout = document.getElementById("missionLayout");
const resultPanel = document.getElementById("resultPanel");
const missionStage = document.getElementById("missionStage");
const morphFlash = document.getElementById("morphFlash");

const modeDropdown = document.getElementById("modeDropdown");
const modeDropdownHeader = document.getElementById("modeDropdownHeader");
const currentModeDisplay = document.getElementById("currentModeDisplay");
const modeOptions = document.querySelectorAll("#modeDropdown .dropdown-list li");
let currentGameMode = "standard";

const typingInput = document.getElementById("typingInput");
const typingOverlay = document.getElementById("typingOverlay");
const overlayMessage = document.getElementById("overlayMessage");
const lockIcon = document.getElementById("lockIcon");
const unlockIcon = document.getElementById("unlockIcon");
const failIcon = document.getElementById("failIcon");
const finishSpaceHint = document.getElementById("finishSpaceHint");
const finishButton = document.getElementById("finishButton");
const resetButton = document.getElementById("resetButton");

// Result screen
const completeCpm = document.getElementById("completeCpm");
const completeTime = document.getElementById("completeTime");
const completeAccuracy = document.getElementById("completeAccuracy");
const completeSectors = document.getElementById("completeSectors");
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

// Dropdowns for difficulty (standard custom implementation)
const difficultyDropdown = document.getElementById("modeDropdown"); // Reuse mode dropdown reference or declare selectedDifficulty
let selectedDifficulty = "medium";

// ── AUDIO SYNTH ──
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

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
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(900 + Math.random() * 300, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
    } else if (type === "warning") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(260, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now); osc.stop(now + 0.18);
    } else if (type === "success") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    } else if (type === "error") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === "complete") {
      const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      frequencies.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + i * 0.06);
        gain.gain.setValueAtTime(0.05, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);
        osc.start(now + i * 0.06); osc.stop(now + i * 0.06 + 0.25);
      });
    } else if (type === "lockout") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.7);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.start(now); osc.stop(now + 0.7);
    } else if (type === "coin") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.04);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now); osc.stop(now + 0.16);
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
}

// ── LIVE SECTOR GRID RENDERER ──
function randomLetter(pool, avoid) {
  let pick = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1 && avoid) {
    let safety = 6;
    while (pick === avoid && safety-- > 0) {
      pick = pool[Math.floor(Math.random() * pool.length)];
    }
  }
  return pick;
}

function renderSectorGrid() {
  currentPool = DIFFICULTY_CONFIGS[selectedDifficulty].pool;
  
  sectorGridEl.style.setProperty("--cols", GRID_COLS);
  sectorGridEl.style.setProperty("--rows", GRID_ROWS);
  sectorGridEl.replaceChildren();
  gridCells = [];

  sectorGridEl.classList.add("booting");
  setTimeout(() => sectorGridEl.classList.remove("booting"), 1000);

  for (let i = 0; i < GRID_SIZE; i++) {
    const cellEl = document.createElement("div");
    cellEl.className = "sector-cell healthy";
    cellEl.style.setProperty("--cell-index", i);

    const label = document.createElement("span");
    label.className = "cell-letter";
    const ch = randomLetter(currentPool);
    label.textContent = ch.toUpperCase();

    const led = document.createElement("span");
    led.className = "cell-led";

    cellEl.appendChild(label);
    cellEl.appendChild(led);
    sectorGridEl.appendChild(cellEl);

    gridCells.push({ index: i, letter: ch, el: cellEl, labelEl: label, hacked: false, hackedAt: 0 });
  }
}

function morphCell(cell, mode) {
  cell.hacked = false;

  // Swap the letter instantly
  const next = randomLetter(currentPool, cell.letter);
  cell.letter = next;
  cell.labelEl.textContent = next.toUpperCase();

  // Show status color (repaired/crashed)
  cell.el.className = `sector-cell ${mode === "crash" ? "crashed" : "repaired"}`;

  // Revert back to healthy after 200ms
  setTimeout(() => {
    if (!cell.hacked) cell.el.className = "sector-cell healthy";
  }, 200);
}

// ── VIEW TRANSITIONS ──
function transitionToView(nextView, onComplete) {
  if (transitioning) return;

  const currentView = document.querySelector(".mission-view.active");
  if (currentView === nextView) {
    if (onComplete) onComplete();
    return;
  }

  transitioning = true;

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

    const children = nextView.querySelectorAll(".briefing-panel, .arena-layout, .result-container");
    children.forEach(el => el.removeAttribute("style"));

    transitioning = false;
    if (onComplete) onComplete();
  };
}

// ── BRIEFING SYSTEM ──
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

    if (activeBriefingSlide === totalBriefingSlides - 1) {
      document.querySelector(".spacebar-instruction").textContent = "Druk op de spatiebalk om de verdediging te starten!";
    }
  } else {
    finishBriefing();
  }
}

function finishBriefing() {
  onboardingComplete = true;
  transitionToView(missionLayout, () => {
    resetTest();
  });
}

// ── GAME PLAY LOGIC ──

// Reset stats and UI
function resetTest() {
  running = false;
  testFinished = false;
  gameWon = false;
  elapsedTime = 0;
  compromiseLevel = 0;
  mistakes = 0;
  totalRepairs = 0;

  totalKeystrokes = 0;
  correctKeystrokes = 0;
  currentStreak = 0;
  maxStreak = 0;
  mistakesPerKey = {};

  clearInterval(gameInterval);
  gameInterval = null;
  clearTimeout(hackSpawnerTimeout);
  hackSpawnerTimeout = null;

  timerEl.textContent = "0.0";
  liveCpmEl.textContent = "0";
  accuracyEl.textContent = "100%";
  if (mistakeCountEl) mistakeCountEl.textContent = "0";
  compromisePctEl.textContent = "0%";
  compromisePctEl.className = "progress-pct";
  compromiseFillEl.style.width = "0%";
  compromiseFillEl.className = "progress-bar-fill";

  consolePingEl.textContent = "SECURE";
  consolePingEl.className = "console-ping";
  statusLogEl.textContent = "Brandmuur herstart. Wachten op inbreuk poging...";
  statusLogEl.className = "console-log";
  if (waveReadoutEl) waveReadoutEl.textContent = "WAVE 01";
  if (defenseBoardEl) {
    defenseBoardEl.className = "keyboard-board-outer";
    defenseBoardEl.style.setProperty("--pressure", "0%");
  }

  if (modeDropdown) modeDropdown.classList.remove("disabled");
  resetButton.style.display = "none";

  // Re-render the live sector grid
  renderSectorGrid();

  // Reset overlay
  typingOverlay.hidden = true;
  typingInput.disabled = false;
  finishSpaceHint.hidden = true;
  finishButton.hidden = true;

  if (lockIcon) lockIcon.style.display = "block";
  if (unlockIcon) unlockIcon.style.display = "none";
  if (failIcon) failIcon.style.display = "none";

  if (resultPanel.classList.contains("active")) {
    resultPanel.hidden = true;
    resultPanel.classList.remove("active");
  }

  beginDefense();
}

function beginDefense() {
  running = true;
  startedAt = Date.now();
  typingOverlay.hidden = true;
  typingInput.disabled = false;
  typingInput.focus();

  if (modeDropdown) modeDropdown.classList.add("disabled");
  resetButton.style.display = "inline-flex";
  statusLogEl.textContent = "Systeem verdediging online. Zoeken naar inbreuken...";
  playSynthSound("success");

  // Spawn first hack after 1 second
  hackSpawnerTimeout = setTimeout(spawnHack, 1000);

  // Main tick loop
  gameInterval = setInterval(gameTick, 40);
}

function getPressureProfile() {
  if (currentGameMode === "limit-test") {
    const t = elapsedTime;
    let wave = 1 + Math.floor(t / 12);
    // Limit test gets faster indefinitely
    let spawnInterval = Math.max(250, 1800 - t * 20);
    let burstCount = 1 + Math.floor(t / 15);
    return {
      pressure: Math.min(1, t / 120),
      wave,
      spawnInterval,
      burstCount
    };
  }

  const config = DIFFICULTY_CONFIGS[selectedDifficulty];
  const timeProgress = clamp(elapsedTime / GAME_DURATION, 0, 1);
  const pressure = timeProgress; // Time pressure

  const minMult = config.minSpawnIntervalMultiplier || 0.4;
  const maxBurst = config.maxBurst || 3;

  return {
    pressure,
    wave: Math.min(9, Math.floor(pressure * 8) + 1),
    spawnInterval: config.spawnInterval * Math.max(minMult, 1 - pressure * (1 - minMult)),
    burstCount: Math.min(maxBurst, 1 + Math.floor(pressure * maxBurst))
  };
}

function spawnHack() {
  if (testFinished || !running) return;

  const profile = getPressureProfile();
  let hacksToSpawn = 0;
  const healthyCells = [...gridCells.filter(c => !c.hacked)];

  if (healthyCells.length > 0) {
    hacksToSpawn = Math.min(healthyCells.length, profile.burstCount);
    const cellsToHack = [];

    for (let i = 0; i < hacksToSpawn; i++) {
      const index = Math.floor(Math.random() * healthyCells.length);
      const cell = healthyCells.splice(index, 1)[0];
      cellsToHack.push(cell);
    }

    cellsToHack.forEach((cell, idx) => {
      setTimeout(() => {
        if (testFinished || !running) return;

        // Double check in case cell state changed during the stagger delay
        if (cell.hacked) return;

        cell.hacked = true;
        cell.hackedAt = Date.now();
        cell.el.className = "sector-cell hacked";

        playSynthSound("warning");
        statusLogEl.textContent = `WAARSCHUWING: Inbreuk gedetecteerd in Sector [${cell.letter.toUpperCase()}]!`;
        statusLogEl.className = "console-log breached";
        consolePingEl.textContent = "ALARM";
        consolePingEl.className = "console-ping alarm";
        updateThreatVisuals();
      }, idx * 300);
    });
  }

  const extraMultiplier = hacksToSpawn > 2 ? 1.0 + (hacksToSpawn - 2) * 0.5 : 1.0;
  const nextSpawnDelay = profile.spawnInterval * (0.85 + Math.random() * 0.3) * extraMultiplier;
  hackSpawnerTimeout = setTimeout(spawnHack, nextSpawnDelay);
}

function gameTick() {
  if (testFinished || !running) return;

  const now = Date.now();
  elapsedTime = (now - startedAt) / 1000;

  // Check win condition
  if (currentGameMode === "standard" && elapsedTime >= GAME_DURATION - 0.05) {
    elapsedTime = GAME_DURATION;
    timerEl.textContent = elapsedTime.toFixed(1);
    triggerVictoryCascade();
    return;
  }

  // Update timer display
  timerEl.textContent = elapsedTime.toFixed(1);

  // Update compromise progress bar level directly based on proportion of red grid cells
  const hackedCount = gridCells.filter(c => c.hacked).length;
  compromiseLevel = (hackedCount / GRID_SIZE) * 100;

  compromisePctEl.textContent = `${Math.round(compromiseLevel)}%`;
  compromiseFillEl.style.width = `${compromiseLevel}%`;

  // Bar coloring alerts
  if (compromiseLevel >= 80) {
    compromiseFillEl.className = "progress-bar-fill danger";
    compromisePctEl.className = "progress-pct danger";
  } else if (compromiseLevel >= 45) {
    compromiseFillEl.className = "progress-bar-fill warning";
    compromisePctEl.className = "progress-pct warning";
  } else {
    compromiseFillEl.className = "progress-bar-fill";
    compromisePctEl.className = "progress-pct";
  }

  // Check if fully compromised
  if (compromiseLevel >= 100) {
    finishGame(false, "Brandmuur volledig overspoeld! Grid is 100% rood.");
    return;
  }

  updateDefensePressureVisuals();
}

function flashBoardShake() {
  gameContainerEl.classList.remove("shake");
  gameContainerEl.offsetHeight; // Reflow
  gameContainerEl.classList.add("shake");
  setTimeout(() => gameContainerEl.classList.remove("shake"), 400);
}

// A wrong key (no hacked sector shows that letter) hacks a random healthy cell as a penalty.
function registerWrongKey(typedChar) {
  playSynthSound("error");
  flashBoardShake();

  mistakes++;
  if (mistakeCountEl) mistakeCountEl.textContent = mistakes;

  // Penalty: Hack a random healthy cell
  const healthyCells = gridCells.filter(c => !c.hacked);
  if (healthyCells.length > 0) {
    const cell = healthyCells[Math.floor(Math.random() * healthyCells.length)];
    cell.hacked = true;
    cell.hackedAt = Date.now();
    cell.el.className = "sector-cell hacked";
    
    const label = typedChar === " " ? "SPATIE" : typedChar.toUpperCase();
    statusLogEl.textContent = `FOUT: Input [${label}] mislukt. Grid-inbreuk verergerd!`;
  } else {
    statusLogEl.textContent = `FOUT: Typo gedetecteerd!`;
  }

  statusLogEl.className = "console-log breached";
  consolePingEl.textContent = "ALARM";
  consolePingEl.className = "console-ping alarm";

  const k = typedChar === " " ? "spatie" : typedChar;
  mistakesPerKey[k] = (mistakesPerKey[k] || 0) + 1;
  currentStreak = 0;
  updateLiveStats();
}

// Handle real keyboard typing input
function handleKeystroke(e) {
  if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey || testFinished) {
    return;
  }
  e.preventDefault();

  if (!running) return;

  if (e.key === " ") return; // Ignore spacebar presses during active gameplay

  totalKeystrokes++;
  const typedChar = e.key.toLowerCase();

  // Find matching active hacked cells
  const matchingCells = gridCells.filter(c => c.hacked && c.letter === typedChar);

  if (matchingCells.length > 0) {
    // Sort by hacked time ascending (oldest first)
    matchingCells.sort((a, b) => a.hackedAt - b.hackedAt);
    const cell = matchingCells[0];

    // Repair the cell
    cell.hacked = false;
    morphCell(cell, "repair");

    totalRepairs++;
    correctKeystrokes++;
    currentStreak++;
    if (currentStreak > maxStreak) maxStreak = currentStreak;

    playSynthSound("success");
    statusLogEl.textContent = `REPARATIE: Firewall sector [${typedChar.toUpperCase()}] hersteld.`;
    statusLogEl.className = "console-log repairing";
    updateLiveStats();

    // Reset ping text if no threats left
    const hackedCount = gridCells.filter(c => c.hacked).length;
    if (hackedCount === 0) {
      consolePingEl.textContent = "SECURE";
      consolePingEl.className = "console-ping";
    }
    updateThreatVisuals();
  } else {
    // Typos / Wrong key typed
    registerWrongKey(typedChar);
  }
}

// Update statistics
function updateLiveStats() {
  const safeTime = Math.max(elapsedTime, 0.5);
  const cpm = Math.round(correctKeystrokes / (safeTime / 60));
  liveCpmEl.textContent = cpm;

  const acc = totalKeystrokes === 0 ? 100 : Math.round((correctKeystrokes / totalKeystrokes) * 100);
  accuracyEl.textContent = `${acc}%`;
}

function updateDefensePressureVisuals() {
  const profile = getPressureProfile();
  const pressurePct = Math.round(profile.pressure * 100);
  const wave = String(profile.wave).padStart(2, "0");

  if (waveReadoutEl) waveReadoutEl.textContent = `WAVE ${wave}`;
  if (defenseBoardEl) {
    defenseBoardEl.style.setProperty("--pressure", `${pressurePct}%`);
    const hackedCount = gridCells.filter(c => c.hacked).length;
    defenseBoardEl.classList.toggle("under-attack", hackedCount > 0);
    defenseBoardEl.classList.toggle("critical", compromiseLevel >= 70);
  }
}

function updateThreatVisuals() {
  if (defenseBoardEl) {
    const hackedCount = gridCells.filter(c => c.hacked).length;
    defenseBoardEl.classList.toggle("under-attack", hackedCount > 0);
  }
}

function triggerVictoryCascade() {
  running = false;
  clearInterval(gameInterval);
  gameInterval = null;
  clearTimeout(hackSpawnerTimeout);
  hackSpawnerTimeout = null;

  typingInput.disabled = true;
  playSynthSound("complete");

  // Sort cells diagonally based on coordinates (row + col index)
  const cellsSorted = [...gridCells].sort((a, b) => {
    const rowA = Math.floor(a.index / GRID_COLS);
    const colA = a.index % GRID_COLS;
    const rowB = Math.floor(b.index / GRID_COLS);
    const colB = b.index % GRID_COLS;
    return (rowA + colA) - (rowB + colB);
  });

  // Sweep green colors staggered across the screen
  cellsSorted.forEach((cell, idx) => {
    setTimeout(() => {
      cell.hacked = false;
      cell.el.className = "sector-cell victory-green";
      if (idx % 4 === 0) playSynthSound("click");
    }, idx * 18);
  });

  // Delay for sweeping transition animation (approx 1s), then show final results
  setTimeout(() => {
    finishGame(true);
  }, cellsSorted.length * 18 + 600);
}

function finishGame(won, reasonMsg = "") {
  testFinished = true;
  running = false;
  gameWon = won;

  clearInterval(gameInterval);
  gameInterval = null;
  clearTimeout(hackSpawnerTimeout);
  hackSpawnerTimeout = null;

  // Clear all sector cell status if not won (so victory cells stay green)
  if (!won) {
    gridCells.forEach(cell => {
      cell.hacked = false;
      cell.el.className = "sector-cell healthy";
    });
  }
  updateThreatVisuals();
  updateDefensePressureVisuals();

  typingInput.disabled = true;

  if (currentGameMode === "limit-test") {
    playSynthSound("complete");
    typingOverlay.hidden = false;
    typingOverlay.className = "code-overlay overlay-success";
    overlayMessage.textContent = `LIMIT TEST VOLTOOID - SURVIVED: ${elapsedTime.toFixed(1)}s`;
    if (lockIcon) lockIcon.style.display = "none";
    if (unlockIcon) unlockIcon.style.display = "block";
    if (failIcon) failIcon.style.display = "none";
  } else if (won) {
    playSynthSound("complete");
    typingOverlay.hidden = false;
    typingOverlay.className = "code-overlay overlay-success";
    overlayMessage.textContent = "BRANDMUUR VERDEDIGD - TOEGANG BEVEILIGD";
    if (lockIcon) lockIcon.style.display = "none";
    if (unlockIcon) unlockIcon.style.display = "block";
    if (failIcon) failIcon.style.display = "none";
  } else {
    playSynthSound("lockout");
    typingOverlay.hidden = false;
    typingOverlay.className = "code-overlay overlay-failed";
    overlayMessage.textContent = reasonMsg || "BRANDMUUR INGEBROKEN - VERBINDING VERBROKEN";
    if (lockIcon) lockIcon.style.display = "none";
    if (unlockIcon) unlockIcon.style.display = "none";
    if (failIcon) failIcon.style.display = "block";
  }

  triggerStatusFlash(won || currentGameMode === "limit-test");

  if (finishSpaceHint) finishSpaceHint.hidden = false;
  finishButton.hidden = false;
  finishButton.disabled = false;
}

function triggerStatusFlash(won) {
  const flasher = document.createElement("div");
  flasher.className = won ? "success-flash-overlay" : "success-flash-overlay fail-flash";
  missionStage.appendChild(flasher);
  setTimeout(() => flasher.remove(), 600);
}

// ── COIN ANIMATIONS ──
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
  const safeTime = Math.max(elapsedTime, 0.5);
  const cpm = Math.round(correctKeystrokes / (safeTime / 60));
  completeCpm.textContent = "0";

  const acc = totalKeystrokes === 0 ? 100 : Math.round((correctKeystrokes / totalKeystrokes) * 100);
  completeAccuracy.textContent = "0%";
  completeSectors.textContent = "0";
  completeTime.textContent = "0.0s";

  // Coins Reward values
  const cpmCoins = Math.round(cpm * 0.4);
  const precisionCoins = Math.round(acc * 1.2);
  const streakCoins = Math.round(maxStreak * 2.0);
  const completionBonus = currentGameMode === "limit-test" ? Math.round(elapsedTime * 0.5) : (gameWon ? 50 : 0);
  const totalCoins = cpmCoins + precisionCoins + streakCoins + completionBonus;

  // Rank badge
  let rank = "Schild-Klungel";
  if (currentGameMode === "limit-test") {
    if (elapsedTime >= 180) rank = "Elite Cyber Guardian";
    else if (elapsedTime >= 120) rank = "Master Administrator";
    else if (elapsedTime >= 60) rank = "Advanced SecOps";
    else if (elapsedTime >= 30) rank = "Junior SecOps";
    else rank = "Schild Klungel";
  } else {
    if (gameWon) {
      if (cpm >= 180 && acc >= 96) rank = "SecOps Commandeur";
      else if (cpm >= 120 && acc >= 90) rank = "System Administrator";
      else if (cpm >= 80) rank = "Cyber Security Specialist";
    } else {
      rank = "Gebraakte Agent";
    }
  }
  rankBadge.textContent = rank;

  const timeLimitLabel = document.getElementById("completeTimeLimitLabel");

  if (currentGameMode === "limit-test") {
    resultTitle.textContent = "LIMIT TEST BEËINDIGD";
    resultTitle.className = "result-title-success";
    missionStatusContainer.innerHTML = '<span class="status-success-badge" id="missionBadge" style="background: var(--blue); border-color: var(--blue); box-shadow: 0 0 10px rgba(116, 216, 255, 0.45);">LIMIT TEST</span>';
    completeAccuracy.className = "card-main-value highlight-green";
    if (timeLimitLabel) timeLimitLabel.textContent = "GEEN TIJD LIMIET";
  } else if (gameWon) {
    resultTitle.textContent = "FIREWALL BEVEILIGD!";
    resultTitle.className = "result-title-success";
    missionStatusContainer.innerHTML = '<span class="status-success-badge" id="missionBadge">GESLAAGD</span>';
    completeAccuracy.className = "card-main-value highlight-green";
    if (timeLimitLabel) timeLimitLabel.textContent = "MAX: 60.0 SECONDEN";
  } else {
    resultTitle.textContent = "FIREWALL INBREUK — MISSIE GEFAALD";
    resultTitle.className = "result-title-failed";
    missionStatusContainer.innerHTML = '<span class="status-failed-badge" id="missionBadge">GEFAALD</span>';
    completeAccuracy.className = "card-main-value highlight-red";
    if (timeLimitLabel) timeLimitLabel.textContent = "MAX: 60.0 SECONDEN";
  }

  completeCoins.textContent = "0";
  cpmCoinsReward.innerHTML = `+0 <img src="coin.svg" width="14" height="14">`;
  precisionCoinsReward.innerHTML = `+0 <img src="coin.svg" width="14" height="14">`;
  streakCoinsReward.innerHTML = `+0 <img src="coin.svg" width="14" height="14">`;
  completionCoinsReward.innerHTML = `+${completionBonus} <img src="coin.svg" width="14" height="14">`;

  transitionToView(resultPanel, () => {
    animateNumberValue(completeCpm, cpm, 1000);
    animateNumberValue(completeAccuracy, acc, 1000, "%");
    animateNumberValue(completeSectors, totalRepairs, 1000);

    // Float values animate
    let currentTimeVal = 0;
    const timeInterval = setInterval(() => {
      currentTimeVal += elapsedTime / 10;
      if (currentTimeVal >= elapsedTime) {
        currentTimeVal = elapsedTime;
        clearInterval(timeInterval);
      }
      completeTime.textContent = `${currentTimeVal.toFixed(1)}s`;
    }, 50);

    animateCoinsBreakdown({
      cpm: cpmCoins,
      precision: precisionCoins,
      streak: streakCoins
    });
  });
}

// ── EVENT LISTENERS ──

// Document focus clicker
document.addEventListener("click", (e) => {
  if (!testFinished && !typingInput.disabled) {
    const clickedDropdown = (modeDropdown && modeDropdown.contains(e.target));
    if (missionLayout.contains(e.target) && !clickedDropdown && !resetButton.contains(e.target)) {
      typingInput.focus();
    }
  }
});

// Dropdown handler (mode)
if (modeDropdownHeader) {
  modeDropdownHeader.addEventListener("click", (e) => {
    e.stopPropagation();
    if (running) return;
    if (modeDropdown) modeDropdown.classList.toggle("open");
  });
}

modeOptions.forEach(opt => {
  opt.addEventListener("click", () => {
    currentGameMode = opt.dataset.val;
    modeOptions.forEach(o => o.classList.remove("selected"));
    opt.classList.add("selected");
    if (currentModeDisplay) currentModeDisplay.textContent = opt.textContent;
    if (modeDropdown) modeDropdown.classList.remove("open");
  });
});

document.addEventListener("click", (e) => {
  if (modeDropdown && !modeDropdown.contains(e.target)) {
    modeDropdown.classList.remove("open");
  }
});

typingInput.addEventListener("keydown", handleKeystroke);

resetButton.addEventListener("click", () => {
  resetTest();
});

retryResultButton.addEventListener("click", () => {
  transitionToView(missionLayout, () => {
    resetTest();
  });
});

if (finishButton) {
  finishButton.addEventListener("click", () => {
    calculateScores();
  });
}

const spacebarAdvanceBtn = document.getElementById("spacebarAdvanceBtn");
if (spacebarAdvanceBtn) {
  spacebarAdvanceBtn.addEventListener("click", advanceBriefingSlide);
}

document.addEventListener("keydown", (e) => {
  if (transitioning) {
    if (e.code === "Space") e.preventDefault();
    return;
  }
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

  function draw() {
    ctx.fillStyle = "#010502";
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
        let opacity = 0.12 + (waveVal + 1) * 0.04;

        if (mouse.x !== -9999) {
          const dxMouse = x - mouse.x;
          const dyMouse = y - mouse.y;
          const dist = Math.hypot(dxMouse, dyMouse);
          const maxDist = 140;

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

// ── INIT ──
function init() {
  initDottedWaveBackground();
  renderSectorGrid();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
