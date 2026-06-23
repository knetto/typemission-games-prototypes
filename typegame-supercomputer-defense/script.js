// ── GAME CONSTANTS ──
const GAME_DURATION = 60.0; // 60 seconds survival
const MAX_MISTAKES = 3;
const MAX_EXTRA_PRESSURE_KEYS = 3;

// Letter grid definition — a live matrix of supercomputer sectors (not a keyboard).
// Each cell shows a random letter from the active pool; hacked cells must be repaired
// by typing their letter, after which the cell morphs into a fresh letter.
const GRID_COLS = 6;
const GRID_ROWS = 4;
const GRID_SIZE = GRID_COLS * GRID_ROWS; // 24 sectors

// Difficulty configurations
const DIFFICULTY_CONFIGS = {
  easy: {
    pool: ["a", "s", "d", "f", "g", "h", "j", "k", "l"], // Home Row only
    spawnInterval: 3500, // ms between hacks
    repairTimeout: 5500, // ms to repair a key
    maxSimultaneous: 2,
    maxBurst: 1,
    minSpawnIntervalMultiplier: 0.7,
    speedMultiplier: 0.75
  },
  medium: {
    pool: [
      "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
      "a", "s", "d", "f", "g", "h", "j", "k", "l",
      "z", "x", "c", "v", "b", "n", "m"
    ], // All A-Z
    spawnInterval: 2600,
    repairTimeout: 4500,
    maxSimultaneous: 3,
    maxBurst: 2,
    minSpawnIntervalMultiplier: 0.6,
    speedMultiplier: 0.95
  },
  hard: {
    pool: [
      "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
      "a", "s", "d", "f", "g", "h", "j", "k", "l",
      "z", "x", "c", "v", "b", "n", "m",
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"
    ], // A-Z + 0-9
    spawnInterval: 1800,
    repairTimeout: 3500,
    maxSimultaneous: 5,
    maxBurst: 2,
    minSpawnIntervalMultiplier: 0.45,
    speedMultiplier: 1.2
  },
  expert: {
    pool: [
      "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
      "a", "s", "d", "f", "g", "h", "j", "k", "l",
      "z", "x", "c", "v", "b", "n", "m",
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"
    ],
    spawnInterval: 1200,
    repairTimeout: 2600,
    maxSimultaneous: 7,
    maxBurst: 3,
    minSpawnIntervalMultiplier: 0.35,
    speedMultiplier: 1.4
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

// Stats tracking
let totalKeystrokes = 0;
let correctKeystrokes = 0;
let currentStreak = 0;
let maxStreak = 0;
let mistakesPerKey = {};

// Live grid model
let gridCells = []; // Objects: { index, letter, el, labelEl, fuseEl, hacked }
let currentPool = []; // Letters used to (re)fill cells for the active difficulty

// Active Hacks track
let activeHacks = []; // Objects: { cell, startedAt, timeout }
let activeViruses = [];
let activeProjectiles = [];

// Briefing states
let activeBriefingSlide = 0;
let onboardingComplete = false;
let briefingDemoInterval = null;

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
const shieldNodesEl = document.getElementById("shieldNodes");
const mistakeCountEl = document.getElementById("mistakeCount");
const compromisePctEl = document.getElementById("compromisePct");
const compromiseFillEl = document.getElementById("compromiseFill");
const sectorGridEl = document.getElementById("sectorGrid");
const statusLogEl = document.getElementById("statusLog");
const consolePingEl = document.getElementById("consolePing");
const gameContainerEl = document.getElementById("gameContainer");
const defenseBoardEl = document.getElementById("defenseBoard");
const defenseCoreEl = document.getElementById("defenseCore");
const attackStreamsEl = document.getElementById("attackStreams");
const waveReadoutEl = document.getElementById("waveReadout");
const coreReadoutEl = document.getElementById("coreReadout");
const svgProjectiles = document.getElementById("svgProjectiles");
const svgViruses = document.getElementById("svgViruses");
const svgExplosions = document.getElementById("svgExplosions");
const pcbCircuits = document.querySelector(".pcb-circuits");
const dynamicTracesEl = document.getElementById("dynamicTraces");

const storyStage = document.getElementById("storyStage");
const missionLayout = document.getElementById("missionLayout");
const resultPanel = document.getElementById("resultPanel");
const missionStage = document.getElementById("missionStage");
const morphFlash = document.getElementById("morphFlash");

const difficultyDropdown = document.getElementById("difficultyDropdown");
const difficultyDropdownHeader = document.getElementById("difficultyDropdownHeader");
const currentDiffDisplay = document.getElementById("currentDiffDisplay");
const difficultyOptions = document.querySelectorAll(".dropdown-list li");
let selectedDifficulty = "medium";

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
  // Try to avoid returning the same letter as `avoid` so morphs visibly change.
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
  sectorGridEl.replaceChildren();
  gridCells = [];

  // Trigger the staggered boot-in cascade for this render only.
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

    const fuse = document.createElement("span");
    fuse.className = "cell-fuse";

    const scan = document.createElement("span");
    scan.className = "cell-scan";

    const led = document.createElement("span");
    led.className = "cell-led";

    cellEl.appendChild(scan);
    cellEl.appendChild(label);
    cellEl.appendChild(fuse);
    cellEl.appendChild(led);
    sectorGridEl.appendChild(cellEl);

    gridCells.push({ index: i, letter: ch, el: cellEl, labelEl: label, fuseEl: fuse, hacked: false });
  }
  drawPcbTraces();
}

// Swap letter instantly, show status color briefly (200ms), and revert to healthy.
function morphCell(cell, mode) {
  cell.hacked = false;
  cell.fuseEl.style.transform = "scaleX(0)";
  const trace = getTraceForCell(cell.index);
  if (trace) {
    trace.hackedCount = Math.max(0, trace.hackedCount - 1);
    if (trace.hackedCount === 0) {
      trace.baseEl.classList.remove("compromised");
      trace.traceEl.classList.remove("compromised");
    }
  }

  // Swap the letter instantly
  const next = randomLetter(currentPool, cell.letter);
  cell.letter = next;
  cell.labelEl.textContent = next.toUpperCase();

  // Show the feedback status color (repaired/crashed)
  cell.el.className = `sector-cell ${mode === "crash" ? "crashed" : "repaired"}`;

  // Revert back to healthy after 200ms
  setTimeout(() => {
    if (!cell.hacked) cell.el.className = "sector-cell healthy";
  }, 200);
}

// ── VIEW TRANSITIONS ──
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

    const children = nextView.querySelectorAll(".briefing-panel, .arena-layout, .result-container");
    children.forEach(el => el.removeAttribute("style"));

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

    if (activeBriefingSlide === 2) {
      startBriefingDemoAnimation();
    } else {
      stopBriefingDemoAnimation();
    }

    if (activeBriefingSlide === totalBriefingSlides - 1) {
      document.querySelector(".spacebar-instruction").textContent = "Druk op de spatiebalk om de verdediging te starten!";
    }
  } else {
    finishBriefing();
  }
}

function finishBriefing() {
  onboardingComplete = true;
  stopBriefingDemoAnimation();
  transitionToView(missionLayout, () => {
    resetTest();
  });
}

function startBriefingDemoAnimation() {
  const bar = document.querySelector(".demo-bar-inner");
  const leds = document.querySelectorAll(".warning-led");
  let tick = 0;
  briefingDemoInterval = setInterval(() => {
    tick++;
    if (tick % 2 === 0) {
      if (bar) bar.style.width = "75%";
      leds.forEach(led => led.style.boxShadow = "0 0 10px var(--red)");
    } else {
      if (bar) bar.style.width = "40%";
      leds.forEach(led => led.style.boxShadow = "");
    }
  }, 1000);
}

function stopBriefingDemoAnimation() {
  clearInterval(briefingDemoInterval);
}

// ── SVG INTERFACE HELPERS ──
function clearSvgGameElements() {
  activeViruses = [];
  activeProjectiles = [];
  if (svgViruses) svgViruses.replaceChildren();
  if (svgProjectiles) svgProjectiles.replaceChildren();
  if (svgExplosions) svgExplosions.replaceChildren();
}

function randomFloat(min, max) {
  return min + Math.random() * (max - min);
}

function getElementCenterInSvg(el) {
  if (!el || !pcbCircuits) return { x: 400, y: 220 };

  const elRect = el.getBoundingClientRect();
  const svgRect = pcbCircuits.getBoundingClientRect();
  if (!svgRect.width || !svgRect.height) return { x: 400, y: 220 };

  return {
    x: ((elRect.left + elRect.width / 2) - svgRect.left) / svgRect.width * 800,
    y: ((elRect.top + elRect.height / 2) - svgRect.top) / svgRect.height * 400
  };
}

function getRandomEdgePoint() {
  const edge = Math.floor(Math.random() * 4);
  const margin = 28;

  if (edge === 0) return { x: randomFloat(margin, 800 - margin), y: randomFloat(12, 70) };
  if (edge === 1) return { x: randomFloat(800 - 90, 800 - margin), y: randomFloat(margin, 400 - margin) };
  if (edge === 2) return { x: randomFloat(margin, 800 - margin), y: randomFloat(400 - 80, 400 - margin) };
  return { x: randomFloat(margin, 90), y: randomFloat(margin, 400 - margin) };
}

function createFloatingRoute() {
  const start = getRandomEdgePoint();
  const cpuCenter = getElementCenterInSvg(defenseCoreEl);
  const end = {
    x: cpuCenter.x + randomFloat(-42, 42),
    y: cpuCenter.y + randomFloat(-34, 34)
  };
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const bend = randomFloat(-95, 95);

  return {
    start,
    controlOne: {
      x: midX + bend,
      y: start.y + (end.y - start.y) * randomFloat(0.18, 0.36) + randomFloat(-44, 44)
    },
    controlTwo: {
      x: midX - bend * 0.72,
      y: start.y + (end.y - start.y) * randomFloat(0.64, 0.84) + randomFloat(-38, 38)
    },
    end
  };
}

function getPointOnRoute(route, progress) {
  const t = clamp(progress, 0, 1);
  const inv = 1 - t;
  const wobble = Math.sin(t * Math.PI * 3) * 7 * (1 - t);

  return {
    x:
      inv ** 3 * route.start.x +
      3 * inv ** 2 * t * route.controlOne.x +
      3 * inv * t ** 2 * route.controlTwo.x +
      t ** 3 * route.end.x +
      wobble,
    y:
      inv ** 3 * route.start.y +
      3 * inv ** 2 * t * route.controlOne.y +
      3 * inv * t ** 2 * route.controlTwo.y +
      t ** 3 * route.end.y
  };
}

let startYList = [60, 74, 88, 272, 286, 300];

let PCB_ROUTES = {
  left: [],
  right: []
};

function updateDynamicCoordinates() {
  const cpuEl = document.querySelector(".supercomputer-core");

  // Fallback coordinates based on layout baseline if element is hidden or has 0 dimensions on load/test
  let cpuLeft = 330;
  let cpuRight = 470;
  let cpuTop = 110;
  let cpuBottom = 290;
  let cpuHeight = 180;

  if (cpuEl && pcbCircuits) {
    const cpuRect = cpuEl.getBoundingClientRect();
    const svgRect = pcbCircuits.getBoundingClientRect();
    if (svgRect.width && svgRect.height) {
      cpuLeft = (cpuRect.left - svgRect.left) / svgRect.width * 800;
      cpuRight = (cpuRect.right - svgRect.left) / svgRect.width * 800;
      cpuTop = (cpuRect.top - svgRect.top) / svgRect.height * 400;
      cpuBottom = (cpuRect.bottom - svgRect.top) / svgRect.height * 400;
      cpuHeight = cpuBottom - cpuTop;
    }
  }

  // Calculate startYList dynamically to ensure perfect vertical fanning symmetry relative to the CPU center
  const cpuCenterY = cpuTop + cpuHeight / 2;
  const G = 24; // Gap between the inner traces and center
  const S = 16; // Spacing between adjacent traces in the same group
  startYList = [
    cpuCenterY - G - 2 * S,
    cpuCenterY - G - S,
    cpuCenterY - G,
    cpuCenterY + G,
    cpuCenterY + G + S,
    cpuCenterY + G + 2 * S
  ];

  // Calculate endYList dynamically to match the exact same parallel spacing (S) at the CPU pins
  const G_cpu = 8; // Gap at the CPU connection
  const endYList = [
    cpuCenterY - G_cpu - 2 * S,
    cpuCenterY - G_cpu - S,
    cpuCenterY - G_cpu,
    cpuCenterY + G_cpu,
    cpuCenterY + G_cpu + S,
    cpuCenterY + G_cpu + 2 * S
  ];

  PCB_ROUTES.left = [];
  PCB_ROUTES.right = [];

  for (let i = 0; i < 6; i++) {
    const startY = startYList[i];
    const endY = endYList[i];

    const x1Left = 220;
    const x2Left = x1Left + Math.abs(endY - startY);
    PCB_ROUTES.left.push([
      { x: 40, y: startY },
      { x: x1Left, y: startY },
      { x: x2Left, y: endY },
      { x: cpuLeft, y: endY }
    ]);

    const x1Right = 580;
    const x2Right = x1Right - Math.abs(endY - startY);
    PCB_ROUTES.right.push([
      { x: 760, y: startY },
      { x: x1Right, y: startY },
      { x: x2Right, y: endY },
      { x: cpuRight, y: endY }
    ]);
  }

  // Update background reference traces to align perfectly
  const leftRefTraces = document.querySelectorAll(".pcb-reference-layer .left-ref-trace");
  const rightRefTraces = document.querySelectorAll(".pcb-reference-layer .right-ref-trace");

  for (let i = 0; i < 6; i++) {
    const startY = startYList[i];
    const endY = endYList[i];
    const x1Left = 220;
    const x2Left = x1Left + Math.abs(endY - startY);
    const x1Right = 580;
    const x2Right = x1Right - Math.abs(endY - startY);

    if (leftRefTraces[i]) {
      const d = `M 40,${startY} H ${x1Left} L ${x2Left},${endY} H ${cpuLeft}`;
      leftRefTraces[i].setAttribute("d", d);
    }
    if (rightRefTraces[i]) {
      const d = `M 760,${startY} H ${x1Right} L ${x2Right},${endY} H ${cpuRight}`;
      rightRefTraces[i].setAttribute("d", d);
    }
  }

  // Update CPU socket connection pads
  const leftCpuPads = document.querySelectorAll(".left-cpu-pad");
  const rightCpuPads = document.querySelectorAll(".right-cpu-pad");
  for (let i = 0; i < 6; i++) {
    const endY = endYList[i];
    if (leftCpuPads[i]) {
      leftCpuPads[i].setAttribute("cx", cpuLeft);
      leftCpuPads[i].setAttribute("cy", endY);
    }
    if (rightCpuPads[i]) {
      rightCpuPads[i].setAttribute("cx", cpuRight);
      rightCpuPads[i].setAttribute("cy", endY);
    }
  }

  // Update source pads
  const leftSources = document.querySelectorAll(".left-source");
  const rightSources = document.querySelectorAll(".right-source");
  for (let i = 0; i < 6; i++) {
    if (leftSources[i]) leftSources[i].setAttribute("cy", startYList[i]);
    if (rightSources[i]) rightSources[i].setAttribute("cy", startYList[i]);
  }

  // Update intermediate vias
  const leftVia1 = document.querySelectorAll(".left-via-1");
  const leftVia2 = document.querySelectorAll(".left-via-2");
  const rightVia1 = document.querySelectorAll(".right-via-1");
  const rightVia2 = document.querySelectorAll(".right-via-2");

  for (let i = 0; i < 6; i++) {
    const startY = startYList[i];
    const endY = endYList[i];
    const x1Left = 220;
    const x2Left = x1Left + Math.abs(endY - startY);
    const x1Right = 580;
    const x2Right = x1Right - Math.abs(endY - startY);

    if (leftVia1[i]) {
      leftVia1[i].setAttribute("cx", x1Left);
      leftVia1[i].setAttribute("cy", startY);
    }
    if (leftVia2[i]) {
      leftVia2[i].setAttribute("cx", x2Left);
      leftVia2[i].setAttribute("cy", endY);
    }
    if (rightVia1[i]) {
      rightVia1[i].setAttribute("cx", x1Right);
      rightVia1[i].setAttribute("cy", startY);
    }
    if (rightVia2[i]) {
      rightVia2[i].setAttribute("cx", x2Right);
      rightVia2[i].setAttribute("cy", endY);
    }
  }

  // Update decorative SMD resistor packs to align with dynamic Y positions
  const resistorBodies = document.querySelectorAll(".pcb-resistor-body");
  const resistorContacts = document.querySelectorAll(".pcb-resistor-contact");

  for (let i = 0; i < 6; i++) {
    const y = startYList[i] - 2;

    // Left side
    if (resistorBodies[i]) resistorBodies[i].setAttribute("y", y);
    if (resistorContacts[i * 2]) resistorContacts[i * 2].setAttribute("y", y);
    if (resistorContacts[i * 2 + 1]) resistorContacts[i * 2 + 1].setAttribute("y", y);

    // Right side
    if (resistorBodies[i + 6]) resistorBodies[i + 6].setAttribute("y", y);
    if (resistorContacts[(i + 6) * 2]) resistorContacts[(i + 6) * 2].setAttribute("y", y);
    if (resistorContacts[(i + 6) * 2 + 1]) resistorContacts[(i + 6) * 2 + 1].setAttribute("y", y);
  }
}

let traceElements = [];

function getCpuPinForCell(index) {
  const row = Math.floor(index / GRID_COLS);
  const col = index % GRID_COLS;
  const left = col < 3;

  let pinIndex = 0;
  if (left) {
    pinIndex = (row * 3 + col) % 6;
    return { side: "left", index: pinIndex };
  } else {
    const rightCol = col - 3;
    pinIndex = (row * 3 + (2 - rightCol)) % 6;
    return { side: "right", index: pinIndex };
  }
}

function getTraceForCell(cellIndex) {
  const info = getCpuPinForCell(cellIndex);
  return traceElements.find(t => t.side === info.side && t.index === info.index);
}

function getPointOnPcbRoute(points, progress) {
  const t = clamp(progress, 0, 1);
  if (!points || points.length === 0) return { x: 400, y: 220 };
  if (points.length === 1) return points[0];

  let totalLength = 0;
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    segments.push({ p1, p2, startLength: totalLength, length: len });
    totalLength += len;
  }

  const targetLength = t * totalLength;
  for (const seg of segments) {
    if (targetLength <= seg.startLength + seg.length) {
      const segT = seg.length === 0 ? 0 : (targetLength - seg.startLength) / seg.length;
      return {
        x: seg.p1.x + (seg.p2.x - seg.p1.x) * segT,
        y: seg.p1.y + (seg.p2.y - seg.p1.y) * segT
      };
    }
  }
  return points[points.length - 1];
}

function drawPcbTraces() {
  if (!dynamicTracesEl || !pcbCircuits) return;

  // Update coordinates dynamically first
  updateDynamicCoordinates();

  dynamicTracesEl.replaceChildren();
  traceElements = [];

  const createTrace = (side, index, points) => {
    if (!points) return;
    const pathData = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const baseEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    baseEl.setAttribute("class", "circuit-trace-base");
    baseEl.setAttribute("d", pathData);

    const traceEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    traceEl.setAttribute("class", "circuit-trace");
    traceEl.setAttribute("d", pathData);

    dynamicTracesEl.appendChild(baseEl);
    dynamicTracesEl.appendChild(traceEl);

    points.slice(0, -1).forEach((point, pointIndex) => {
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      const isTerminal = pointIndex === 0;
      dot.setAttribute("class", isTerminal ? "pcb-reference-pad" : "pcb-reference-via");
      dot.setAttribute("cx", point.x);
      dot.setAttribute("cy", point.y);
      dot.setAttribute("r", isTerminal ? "4" : "1.85");
      dynamicTracesEl.appendChild(dot);
    });

    traceElements.push({
      side,
      index,
      baseEl,
      traceEl,
      hackedCount: 0
    });
  };

  if (PCB_ROUTES.left && PCB_ROUTES.left.length > 0) {
    PCB_ROUTES.left.forEach((points, i) => createTrace("left", i, points));
  }
  if (PCB_ROUTES.right && PCB_ROUTES.right.length > 0) {
    PCB_ROUTES.right.forEach((points, i) => createTrace("right", i, points));
  }

  gridCells.forEach(cell => {
    if (cell.hacked) {
      const trace = getTraceForCell(cell.index);
      if (trace) {
        trace.hackedCount++;
        trace.baseEl.classList.add("compromised");
        trace.traceEl.classList.add("compromised");
      }
    }
  });
}

function spawnExplosion(x, y) {
  const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  ring.setAttribute("class", "explosion-ring");
  ring.setAttribute("cx", x);
  ring.setAttribute("cy", y);
  ring.setAttribute("r", "5");
  if (svgExplosions) svgExplosions.appendChild(ring);
  setTimeout(() => {
    if (ring && ring.parentNode) ring.parentNode.removeChild(ring);
  }, 300);
}

function cpuHit(letter) {
  playSynthSound("error");
  flashBoardShake();

  // Make CPU core flash red visually
  const coreEl = document.querySelector(".supercomputer-core");
  if (coreEl) {
    coreEl.classList.remove("damaged");
    coreEl.offsetHeight; // Reflow
    coreEl.classList.add("damaged");
    setTimeout(() => coreEl.classList.remove("damaged"), 400);
  }

  registerStrike(letter, `INBREUK: Virus [${letter.toUpperCase()}] binnengedrongen in de CPU!`, 15);
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

  activeHacks = [];
  clearSvgGameElements();

  clearInterval(gameInterval);
  clearTimeout(hackSpawnerTimeout);

  timerEl.textContent = "0.0";
  liveCpmEl.textContent = "0";
  accuracyEl.textContent = "100%";
  if (mistakeCountEl) mistakeCountEl.textContent = `0/${MAX_MISTAKES}`;
  compromisePctEl.textContent = "0%";
  compromisePctEl.className = "progress-pct";
  compromiseFillEl.style.width = "0%";
  compromiseFillEl.className = "progress-bar-fill";

  consolePingEl.textContent = "SECURE";
  consolePingEl.className = "console-ping";
  statusLogEl.textContent = "Firewall herstart. Wachten op inbreuk poging...";
  statusLogEl.className = "console-log";
  if (waveReadoutEl) waveReadoutEl.textContent = "WAVE 01";
  if (coreReadoutEl) coreReadoutEl.textContent = "STABLE";
  if (defenseBoardEl) {
    defenseBoardEl.className = "keyboard-board-outer";
    defenseBoardEl.style.setProperty("--pressure", "0%");
  }
  if (defenseCoreEl) defenseCoreEl.className = "defense-core-visual";
  if (attackStreamsEl) attackStreamsEl.replaceChildren();

  if (difficultyDropdown) difficultyDropdown.classList.remove("disabled");
  resetButton.style.display = "none";

  // Re-render the live sector grid
  renderSectorGrid();

  // Reset Shield Nodes
  for (let i = 0; i < MAX_MISTAKES; i++) {
    const node = document.getElementById(`shield${i}`);
    if (node) {
      node.className = "shield-node active";
    }
  }

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

function startHack() {
  getAudioContext();
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}

function beginDefense() {
  running = true;
  startedAt = Date.now();
  typingOverlay.hidden = true;
  typingInput.disabled = false;
  typingInput.focus();

  if (difficultyDropdown) difficultyDropdown.classList.add("disabled");
  resetButton.style.display = "inline-flex";

  statusLogEl.textContent = "Systeem verdediging online. Zoeken naar hackers...";
  if (coreReadoutEl) coreReadoutEl.textContent = "ARMED";
  playSynthSound("success");

  // Spawn first hack after 1 second
  hackSpawnerTimeout = setTimeout(spawnHack, 1000);

  // Main tick loop
  gameInterval = setInterval(gameTick, 40);
}

function getPressureProfile() {
  const config = DIFFICULTY_CONFIGS[selectedDifficulty];
  const timeProgress = clamp(elapsedTime / GAME_DURATION, 0, 1);
  const repairPressure = clamp(totalRepairs / 36, 0, 0.24);
  const mistakePressure = mistakes * 0.06;
  const pressure = clamp(timeProgress + repairPressure + mistakePressure, 0, 1);
  const extraKeys = Math.min(MAX_EXTRA_PRESSURE_KEYS, Math.floor(pressure * (MAX_EXTRA_PRESSURE_KEYS + 1)));

  // Custom difficulty scaling parameters
  const minMult = config.minSpawnIntervalMultiplier !== undefined ? config.minSpawnIntervalMultiplier : 0.32;
  const maxBurst = config.maxBurst !== undefined ? config.maxBurst : 3;

  return {
    pressure,
    wave: Math.min(9, Math.floor(pressure * 8) + 1),
    maxSimultaneous: Math.min(config.pool.length, config.maxSimultaneous + extraKeys),
    spawnInterval: config.spawnInterval * Math.max(minMult, 1 - pressure * (1 - minMult)),
    repairTimeout: config.repairTimeout * Math.max(0.48, 1 - pressure * 0.45),
    burstCount: Math.min(maxBurst, 1 + (pressure > 0.34 ? 1 : 0) + (pressure > 0.72 ? 1 : 0))
  };
}

function spawnHack() {
  if (testFinished || !running) return;

  const profile = getPressureProfile();
  const slotsOpen = profile.maxSimultaneous - activeViruses.length;
  const hacksToSpawn = Math.max(0, Math.min(slotsOpen, profile.burstCount));
  const spawnedKeys = [];

  const availableLetters = gridCells.map(c => c.letter);

  if (availableLetters.length > 0) {
    for (let i = 0; i < hacksToSpawn; i++) {
      const ch = availableLetters[Math.floor(Math.random() * availableLetters.length)];

      // Link to an uncompromised grid cell showing this letter
      const cell = gridCells.find(c => c.letter === ch && !c.hacked);
      if (cell) {
        cell.hacked = true;
        cell.el.className = "sector-cell hacked";
        const trace = getTraceForCell(cell.index);
        if (trace) {
          trace.hackedCount++;
          trace.baseEl.classList.add("compromised");
          trace.traceEl.classList.add("compromised");
        }
      }

      // PCB route for the virus (edge to CPU)
      const traceInfo = getCpuPinForCell(cell ? cell.index : 0);
      const routePoints = traceInfo.side === "left" ? PCB_ROUTES.left[traceInfo.index] : PCB_ROUTES.right[traceInfo.index];
      const startPoint = routePoints[0]; // starting at the screen edge (left/right)

      // Create SVG group element for virus
      const groupEl = document.createElementNS("http://www.w3.org/2000/svg", "g");
      groupEl.setAttribute("class", "virus-blob");

      const graphicEl = document.createElementNS("http://www.w3.org/2000/svg", "g");
      graphicEl.setAttribute("class", "virus-graphic");

      // Core circle
      const core = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      core.setAttribute("cx", "0");
      core.setAttribute("cy", "0");
      core.setAttribute("r", "8");
      core.setAttribute("class", "virus-body-core");
      graphicEl.appendChild(core);

      // Spikes
      const angles = [0, 45, 90, 135, 180, 225, 270, 315];
      angles.forEach(angle => {
        const rad = (angle * Math.PI) / 180;
        const xSpoke = 12 * Math.cos(rad);
        const ySpoke = 12 * Math.sin(rad);
        const xHead = 14.5 * Math.cos(rad);
        const yHead = 14.5 * Math.sin(rad);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", "0");
        line.setAttribute("y1", "0");
        line.setAttribute("x2", xSpoke.toFixed(2));
        line.setAttribute("y2", ySpoke.toFixed(2));
        line.setAttribute("class", "virus-spike-line");
        graphicEl.appendChild(line);

        const head = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        head.setAttribute("cx", xHead.toFixed(2));
        head.setAttribute("cy", yHead.toFixed(2));
        head.setAttribute("r", "2.0");
        head.setAttribute("class", "virus-spike-head");
        graphicEl.appendChild(head);
      });

      // Random face generator (0 to 8)
      const faceType = Math.floor(Math.random() * 9);
      const faceGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      faceGroup.setAttribute("class", "virus-face");

      if (faceType === 0) {
        // Angry Face (Type A)
        faceGroup.innerHTML = `
          <path d="M -5.5,-3.5 L -1.5,-2 C -1.5,-0.5 -3.5,0 -5.5,-1.5 Z" fill="#010502" />
          <circle cx="-3.5" cy="-2" r="0.8" fill="#fff" />
          <path d="M 5.5,-3.5 L 1.5,-2 C 1.5,-0.5 3.5,0 5.5,-1.5 Z" fill="#010502" />
          <circle cx="3.5" cy="-2" r="0.8" fill="#fff" />
          <path d="M -4.5,2.5 L -3,1 L -1.5,2.5 L 0,1 L 1.5,2.5 L 3,1 L 4.5,2.5" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
        `;
      } else if (faceType === 1) {
        // Cyber Glitch Face (Type B)
        faceGroup.innerHTML = `
          <path d="M -5.5,-3.5 L -2.5,-0.5 M -2.5,-3.5 L -5.5,-0.5" stroke="#010502" stroke-width="1.6" stroke-linecap="round" />
          <path d="M 2.5,-3.5 L 5.5,-0.5 M 5.5,-3.5 L 2.5,-0.5" stroke="#010502" stroke-width="1.6" stroke-linecap="round" />
          <path d="M -4.5,2 H -2.5 V 3.5 H -0.5 V 2 H 1.5 V 3.5 H 3.5 V 2 H 4.5" fill="none" stroke="#fff" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" />
        `;
      } else if (faceType === 2) {
        // Smirk Face (Type C)
        faceGroup.innerHTML = `
          <polygon points="-5.5,-3 -1.5,-1.5 -2.5,-3.5" fill="#010502" />
          <polygon points="5.5,-3 1.5,-1.5 2.5,-3.5" fill="#010502" />
          <path d="M -4,2 Q -1.5,5 3,2" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" />
        `;
      } else if (faceType === 3) {
        // Shocked Face (Type D)
        faceGroup.innerHTML = `
          <circle cx="-3.5" cy="-2" r="2.2" fill="#010502" />
          <circle cx="-3.5" cy="-2" r="0.8" fill="#fff" />
          <circle cx="3.5" cy="-2" r="2.2" fill="#010502" />
          <circle cx="3.5" cy="-2" r="0.8" fill="#fff" />
          <circle cx="0" cy="3.2" r="1.8" fill="#fff" />
        `;
      } else if (faceType === 4) {
        // Sad Face (Type E)
        faceGroup.innerHTML = `
          <line x1="-5.5" y1="-4.5" x2="-2.5" y2="-3" stroke="#010502" stroke-width="1.2" stroke-linecap="round" />
          <circle cx="-4" cy="-1.5" r="1.5" fill="#010502" />
          <line x1="5.5" y1="-4.5" x2="2.5" y2="-3" stroke="#010502" stroke-width="1.2" stroke-linecap="round" />
          <circle cx="4" cy="-1.5" r="1.5" fill="#010502" />
          <path d="M -3.5,4 Q 0,1 3.5,4" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" />
        `;
      } else if (faceType === 5) {
        // Crazy Face (Type F)
        faceGroup.innerHTML = `
          <circle cx="-3.5" cy="-2" r="2.2" fill="#010502" />
          <circle cx="-3.5" cy="-1.5" r="0.8" fill="#fff" />
          <circle cx="3.5" cy="-2" r="1.2" fill="#010502" />
          <circle cx="3.5" cy="-2" r="0.5" fill="#fff" />
          <path d="M -3,2 Q 0,4.5 3,2" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" />
          <path d="M 0,2.5 C 0,5 2,5 2,2.5 Z" fill="#ff4b80" stroke="#fff" stroke-width="0.8" />
        `;
      } else if (faceType === 6) {
        // Neutral Face (Type G)
        faceGroup.innerHTML = `
          <circle cx="-3.5" cy="-2" r="1.5" fill="#010502" />
          <circle cx="3.5" cy="-2" r="1.5" fill="#010502" />
          <line x1="-3.5" y1="2.5" x2="3.5" y2="2.5" stroke="#fff" stroke-width="1.4" stroke-linecap="round" />
        `;
      } else if (faceType === 7) {
        // Tired Face (Type H)
        faceGroup.innerHTML = `
          <path d="M -5.5,-2 H -1.5 C -1.5,-0.2 -5.5,-0.2 -5.5,-2" fill="#010502" />
          <path d="M 1.5,-2 H 5.5 C 5.5,-0.2 1.5,-0.2 1.5,-2" fill="#010502" />
          <line x1="-5.5" y1="-2.5" x2="-1.5" y2="-2" stroke="#010502" stroke-width="1" />
          <line x1="5.5" y1="-2.5" x2="1.5" y2="-2" stroke="#010502" stroke-width="1" />
          <path d="M -2.5,2.5 Q 0,1.5 2.5,2.5" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" />
        `;
      } else {
        // SUPER Angry Face (Type I)
        faceGroup.innerHTML = `
          <polygon points="-6,-5.5 -1.5,-2.5 -2,-3.5" fill="#010502" />
          <path d="M -5.5,-3 L -1.5,-1 C -1.5,1 -3.5,1.5 -5.5,-0.5 Z" fill="#010502" />
          <circle cx="-3.5" cy="-1.2" r="0.75" fill="#ff3b30" />
          <polygon points="6,-5.5 1.5,-2.5 2,-3.5" fill="#010502" />
          <path d="M 5.5,-3 L 1.5,-1 C 1.5,1 3.5,1.5 5.5,-0.5 Z" fill="#010502" />
          <circle cx="3.5" cy="-1.2" r="0.75" fill="#ff3b30" />
          <path d="M -4.5,1.5 L -2.5,3.5 L -0.5,1.5 L 1.5,3.5 L 3.5,1.5 L 2.5,5 L 0,4 L -2.5,5 Z" fill="#fff" />
        `;
      }

      graphicEl.appendChild(faceGroup);
      groupEl.appendChild(graphicEl);
      if (svgViruses) svgViruses.appendChild(groupEl);
      groupEl.setAttribute("transform", `translate(${startPoint.x}, ${startPoint.y})`);

      activeViruses.push({
        letter: ch,
        cell: cell || null,
        routePoints: routePoints,
        progress: 0,
        speed: (0.004 + (profile.pressure * 0.004)) * (DIFFICULTY_CONFIGS[selectedDifficulty].speedMultiplier || 1.0) + Math.random() * 0.002,
        el: groupEl,
        targeted: false,
        x: startPoint.x,
        y: startPoint.y
      });

      spawnedKeys.push(ch.toUpperCase());
    }
  }

  if (spawnedKeys.length > 0) {
    playSynthSound("warning");
    const sectorText = spawnedKeys.length === 1 ? `Virus [${spawnedKeys[0]}]` : `Virussen [${spawnedKeys.join(" ")}]`;
    statusLogEl.textContent = `WAARSCHUWING: Inkomend ${sectorText}-signatuur gedetecteerd!`;
    statusLogEl.className = "console-log breached";
    consolePingEl.textContent = "BREACH";
    consolePingEl.className = "console-ping alarm";
    updateThreatVisuals();
  }

  const nextSpawnDelay = profile.spawnInterval * (0.85 + Math.random() * 0.3);

  hackSpawnerTimeout = setTimeout(spawnHack, nextSpawnDelay);
}

function gameTick() {
  if (testFinished || !running) return;

  const now = Date.now();
  elapsedTime = (now - startedAt) / 1000;

  // Check win condition
  if (elapsedTime >= GAME_DURATION) {
    elapsedTime = GAME_DURATION;
    timerEl.textContent = elapsedTime.toFixed(1);
    finishGame(true);
    return;
  }

  // Update timer display
  timerEl.textContent = elapsedTime.toFixed(1);
  updateDefensePressureVisuals();

  // Update active viruses
  for (let i = activeViruses.length - 1; i >= 0; i--) {
    const virus = activeViruses[i];
    virus.progress += virus.speed;

    if (virus.progress >= 1.0) {
      // Remove element
      if (virus.el && virus.el.parentNode) {
        virus.el.parentNode.removeChild(virus.el);
      }
      activeViruses.splice(i, 1);

      // Reset grid key red state and trigger crash visual morph
      if (virus.cell) {
        virus.cell.hacked = false;
        const trace = getTraceForCell(virus.cell.index);
        if (trace) {
          trace.hackedCount = Math.max(0, trace.hackedCount - 1);
          if (trace.hackedCount === 0) {
            trace.baseEl.classList.remove("compromised");
            trace.traceEl.classList.remove("compromised");
          }
        }
        morphCell(virus.cell, "crash");
      }

      // Damage CPU core
      cpuHit(virus.letter);
      if (testFinished) return;
    } else {
      const pt = getPointOnPcbRoute(virus.routePoints, virus.progress);
      virus.x = pt.x;
      virus.y = pt.y;
      virus.el.setAttribute("transform", `translate(${pt.x}, ${pt.y})`);
    }
  }

  // Update active projectiles
  for (let i = activeProjectiles.length - 1; i >= 0; i--) {
    const proj = activeProjectiles[i];
    if (!activeViruses.includes(proj.targetVirus)) {
      if (proj.el && proj.el.parentNode) {
        proj.el.parentNode.removeChild(proj.el);
      }
      activeProjectiles.splice(i, 1);
      continue;
    }

    const virus = proj.targetVirus;
    const dx = virus.x - proj.x;
    const dy = virus.y - proj.y;
    const dist = Math.hypot(dx, dy);

    if (dist < proj.speed) {
      // Collision!
      spawnExplosion(virus.x, virus.y);

      // Remove virus
      if (virus.el && virus.el.parentNode) {
        virus.el.parentNode.removeChild(virus.el);
      }

      if (virus.cell) {
        virus.cell.hacked = false;
        const trace = getTraceForCell(virus.cell.index);
        if (trace) {
          trace.hackedCount = Math.max(0, trace.hackedCount - 1);
          if (trace.hackedCount === 0) {
            trace.baseEl.classList.remove("compromised");
            trace.traceEl.classList.remove("compromised");
          }
        }
      }

      const vIdx = activeViruses.indexOf(virus);
      if (vIdx !== -1) activeViruses.splice(vIdx, 1);

      // Remove projectile
      if (proj.el && proj.el.parentNode) {
        proj.el.parentNode.removeChild(proj.el);
      }
      activeProjectiles.splice(i, 1);

      // Play sound
      playSynthSound("success");

      // Recover compromise level slightly
      compromiseLevel = Math.max(0, compromiseLevel - 3);

      // Clear alert tag if no active viruses
      if (activeViruses.length === 0) {
        consolePingEl.textContent = "SECURE";
        consolePingEl.className = "console-ping";
      }

      updateThreatVisuals();
      updateLiveStats();
    } else {
      proj.x += (dx / dist) * proj.speed;
      proj.y += (dy / dist) * proj.speed;
      proj.el.setAttribute("transform", `translate(${proj.x}, ${proj.y})`);
    }
  }

  // Update compromise progress bar level
  if (activeViruses.length > 0) {
    const profile = getPressureProfile();
    compromiseLevel += activeViruses.length * (0.07 + profile.pressure * 0.05); // Increase
  } else {
    compromiseLevel -= 0.12; // Decompress slowly
  }
  compromiseLevel = Math.max(0, Math.min(100, compromiseLevel));

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
    finishGame(false, "Supercomputer volledig gecompromitteerd!");
  }
}

function flashBoardShake() {
  gameContainerEl.classList.remove("shake");
  gameContainerEl.offsetHeight; // Reflow
  gameContainerEl.classList.add("shake");
  setTimeout(() => gameContainerEl.classList.remove("shake"), 400);
}

// A hacked sector that ran out of time crashes — the cell morphs to a new letter.
function crashSector(cell) {
  playSynthSound("error");
  const lostLetter = cell.letter.toUpperCase();
  morphCell(cell, "crash");
  flashBoardShake();

  registerStrike(cell.letter, `KRITIEK: Sector [${lostLetter}] gecrasht! Schild verloren.`, 12);
  updateThreatVisuals();
}

// A wrong key (no hacked sector shows that letter) costs a firewall shield.
function registerWrongKey(typedChar) {
  playSynthSound("error");
  flashBoardShake();

  const label = typedChar === " " ? "SPATIE" : typedChar.toUpperCase();
  registerStrike(typedChar, `FOUT: Verkeerde input [${label}]. Firewall-schild geraakt.`, 9);
}

function registerStrike(key, message, compromisePenalty) {
  const shieldIndex = mistakes;
  mistakes++;
  if (mistakeCountEl) mistakeCountEl.textContent = `${mistakes}/${MAX_MISTAKES}`;

  const shieldNode = document.getElementById(`shield${shieldIndex}`);
  if (shieldNode) {
    shieldNode.className = "shield-node lost";
  }

  compromiseLevel = Math.min(100, compromiseLevel + compromisePenalty);
  statusLogEl.textContent = message;
  statusLogEl.className = "console-log breached";
  consolePingEl.textContent = "ALARM";
  consolePingEl.className = "console-ping alarm";

  const k = key === " " ? "spatie" : key;
  mistakesPerKey[k] = (mistakesPerKey[k] || 0) + 1;
  currentStreak = 0;
  updateLiveStats();

  if (mistakes >= MAX_MISTAKES) {
    finishGame(false, "Alle firewall-schilden vernietigd!");
  }
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

  // Find matching active threat that has not been targeted yet
  const matchingViruses = activeViruses.filter(v => v.letter === typedChar && !v.targeted);

  if (matchingViruses.length > 0) {
    // Sort by progress descending (closest to core/top)
    matchingViruses.sort((a, b) => b.progress - a.progress);
    const virus = matchingViruses[0];
    virus.targeted = true;

    if (virus.el) {
      virus.el.classList.add("targeted");
    }

    // Find grid cell displaying this letter to launch the projectile from
    let cell = virus.cell;
    if (!cell) {
      cell = gridCells.find(c => c.letter === typedChar);
    }
    if (cell) {
      cell.hacked = false;
      // Calculate coordinates of the grid cell in SVG coordinate space
      const cellRect = cell.el.getBoundingClientRect();
      const svgRect = pcbCircuits.getBoundingClientRect();
      const localX = ((cellRect.left + cellRect.width / 2) - svgRect.left) / svgRect.width * 800;
      const localY = ((cellRect.top + cellRect.height / 2) - svgRect.top) / svgRect.height * 400;

      // Create SVG group element for projectile
      const projEl = document.createElementNS("http://www.w3.org/2000/svg", "g");
      projEl.setAttribute("class", "projectile-packet");

      const circ = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circ.setAttribute("r", "7");

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("class", "projectile-text");
      text.setAttribute("y", "2.5");
      text.textContent = typedChar.toUpperCase();

      projEl.appendChild(circ);
      projEl.appendChild(text);
      projEl.setAttribute("transform", `translate(${localX}, ${localY})`);
      if (svgProjectiles) svgProjectiles.appendChild(projEl);

      activeProjectiles.push({
        letter: typedChar,
        targetVirus: virus,
        x: localX,
        y: localY,
        speed: 16,
        el: projEl
      });

      // Morph the launcher key to a new character to keep the grid dynamic
      morphCell(cell, "repair");
    }

    totalRepairs++;
    correctKeystrokes++;
    currentStreak++;
    if (currentStreak > maxStreak) maxStreak = currentStreak;

    playSynthSound("success");
    statusLogEl.textContent = `REPARATIE: Onderscheppingsprojectiel afgevuurd op [${typedChar.toUpperCase()}].`;
    statusLogEl.className = "console-log repairing";
    updateLiveStats();
  } else {
    // Typos / Wrong key typed
    registerWrongKey(typedChar);
    if (testFinished) return;
    updateLiveStats();
  }
}

function updateLiveStats() {
  const safeTime = Math.max(elapsedTime, 0.5);
  const cpm = Math.round(correctKeystrokes / (safeTime / 60));
  liveCpmEl.textContent = cpm;

  const acc = totalKeystrokes === 0 ? 100 : Math.round((correctKeystrokes / totalKeystrokes) * 100);
  accuracyEl.textContent = `${acc}%`;
}

// ── FINISH GAME ──
function updateDefensePressureVisuals() {
  const profile = getPressureProfile();
  const pressurePct = Math.round(profile.pressure * 100);
  const wave = String(profile.wave).padStart(2, "0");

  if (waveReadoutEl) waveReadoutEl.textContent = `WAVE ${wave}`;
  if (defenseBoardEl) {
    defenseBoardEl.style.setProperty("--pressure", `${pressurePct}%`);
    defenseBoardEl.classList.toggle("under-attack", activeHacks.length > 0);
    defenseBoardEl.classList.toggle("critical", compromiseLevel >= 70 || mistakes >= 2);
  }
  if (defenseCoreEl) {
    defenseCoreEl.classList.toggle("under-attack", activeHacks.length > 0);
    defenseCoreEl.classList.toggle("critical", compromiseLevel >= 70 || mistakes >= 2);
  }
  if (coreReadoutEl && running) {
    if (compromiseLevel >= 80 || mistakes >= 2) {
      coreReadoutEl.textContent = "CRITICAL";
    } else if (activeHacks.length >= 3) {
      coreReadoutEl.textContent = "OVERRUN";
    } else if (activeHacks.length > 0) {
      coreReadoutEl.textContent = "DEFEND";
    } else {
      coreReadoutEl.textContent = "STABLE";
    }
  }
}

function updateThreatVisuals() {
  if (defenseBoardEl) {
    defenseBoardEl.classList.toggle("under-attack", activeViruses.length > 0);
  }
  if (defenseCoreEl) {
    defenseCoreEl.classList.toggle("under-attack", activeViruses.length > 0);
  }
}

function updateThreatVisuals() {
  if (defenseBoardEl) {
    defenseBoardEl.classList.toggle("under-attack", activeViruses.length > 0);
  }
  if (defenseCoreEl) {
    defenseCoreEl.classList.toggle("under-attack", activeViruses.length > 0);
  }
}

function finishGame(won, reasonMsg = "") {
  testFinished = true;
  running = false;
  gameWon = won;

  clearInterval(gameInterval);
  clearTimeout(hackSpawnerTimeout);

  // Clear all sector cell status
  gridCells.forEach(cell => {
    cell.hacked = false;
    cell.el.className = "sector-cell healthy";
    cell.fuseEl.style.transform = "scaleX(0)";
  });
  activeHacks = [];
  clearSvgGameElements();
  updateThreatVisuals();
  updateDefensePressureVisuals();

  typingInput.disabled = true;

  if (won) {
    playSynthSound("complete");
    typingOverlay.hidden = false;
    typingOverlay.className = "code-overlay overlay-success";
    overlayMessage.textContent = "CPU FIREWALL VERDEDIGD - TOEGANG GEBORGD";
    if (coreReadoutEl) coreReadoutEl.textContent = "SECURE";
    if (lockIcon) lockIcon.style.display = "none";
    if (unlockIcon) unlockIcon.style.display = "block";
    if (failIcon) failIcon.style.display = "none";
  } else {
    playSynthSound("lockout");
    typingOverlay.hidden = false;
    typingOverlay.className = "code-overlay overlay-failed";
    overlayMessage.textContent = reasonMsg || "SUPERCOMPUTER GEBREACHED - VERBINDING VERBROKEN";
    if (coreReadoutEl) coreReadoutEl.textContent = "BREACHED";
    if (lockIcon) lockIcon.style.display = "none";
    if (unlockIcon) unlockIcon.style.display = "none";
    if (failIcon) failIcon.style.display = "block";
  }

  // Trigger final status flash overlay
  triggerStatusFlash(won);

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
  const completionBonus = gameWon ? 50 : 0;
  const totalCoins = cpmCoins + precisionCoins + streakCoins + completionBonus;

  // Rank badge
  let rank = "Schijf-Klungel";
  if (gameWon) {
    if (cpm >= 180 && acc >= 96) rank = "SecOps Commandeur";
    else if (cpm >= 120 && acc >= 90) rank = "System Administrator";
    else if (cpm >= 80) rank = "Cyber Security Specialist";
  } else {
    rank = "Gebraakte Agent";
  }
  rankBadge.textContent = rank;

  if (gameWon) {
    resultTitle.textContent = "SUPERCOMPUTER BEVEILIGD!";
    resultTitle.className = "result-title-success";
    missionStatusContainer.innerHTML = '<span class="status-success-badge" id="missionBadge">GESLAAGD</span>';
    completeAccuracy.className = "card-main-value highlight-green";
  } else {
    resultTitle.textContent = "FIREWALL BREACH — MISSIE GEFAALD";
    resultTitle.className = "result-title-failed";
    missionStatusContainer.innerHTML = '<span class="status-failed-badge" id="missionBadge">GEFAALD</span>';
    completeAccuracy.className = "card-main-value highlight-red";
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
    const clickedDropdown = difficultyDropdown && difficultyDropdown.contains(e.target);
    if (missionLayout.contains(e.target) && !clickedDropdown && !resetButton.contains(e.target)) {
      typingInput.focus();
    }
  }
});

// Dropdown handler
if (difficultyDropdownHeader) {
  difficultyDropdownHeader.addEventListener("click", (e) => {
    e.stopPropagation();
    if (running) return;
    if (difficultyDropdown) difficultyDropdown.classList.toggle("open");
  });
}

difficultyOptions.forEach(opt => {
  opt.addEventListener("click", () => {
    selectedDifficulty = opt.dataset.val;
    difficultyOptions.forEach(o => o.classList.remove("selected"));
    opt.classList.add("selected");
    if (currentDiffDisplay) currentDiffDisplay.textContent = opt.textContent;
    if (difficultyDropdown) difficultyDropdown.classList.remove("open");
  });
});

document.addEventListener("click", (e) => {
  if (difficultyDropdown && !difficultyDropdown.contains(e.target)) {
    difficultyDropdown.classList.remove("open");
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

        ctx.fillStyle = `rgba(68, 215, 117, ${opacity})`;
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

    // Also update CPU paths dynamically on resize
    updateDynamicCoordinates();
    drawPcbTraces();
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
