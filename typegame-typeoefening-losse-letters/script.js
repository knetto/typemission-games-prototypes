// ── LESSON LIBRARY ──
const LESSONS = [
  {
    title: "Basispositie (f, j, d, k)",
    lines: [
      "fff jjj ddd kkk fff jjj ddd kkk",
      "fd jk df kj fd jk df kj fd jk df kj",
      "fjf jfj kdk kdk fdf jkj dfj kdk fjd",
      "ddd fff ddd fff ddd ff fdf fdf fdf fdf",
      "ff jj dd kk df jk fd kj dk fj f j d k"
    ]
  },
  {
    title: "Home row uitbreiding (a, s, l, g, h)",
    lines: [
      "aaa sss lll ggg hhh aaa sss lll ggg hhh",
      "asdf jkl; asdf jkl; asdf jkl; asdf jkl;",
      "fga jhk dsl fga jhk dsl fga jhk dsl",
      "sall lash flag glad half slag fash gash",
      "as df gh jk la as df gh jk la a s d f"
    ]
  },
  {
    title: "Top row links (e, r, t, q, w)",
    lines: [
      "eee rrr ttt qqq www eee rrr ttt qqq www",
      "de ed fr rf gt tg aq qa sw ws de ed fr",
      "we red wet try tea raw war ear era err",
      "deer reef tree west stew free ward draw",
      "qwert asdfg qwert asdfg qwert asdfg"
    ]
  },
  {
    title: "Top row rechts (u, i, o, p, y)",
    lines: [
      "uuu iii ooo ppp yyy uuu iii ooo ppp yyy",
      "ju uj ki ik lo ol jp pj jy yj ju uj ki",
      "you out pit pot toy tip lip pin hip joy",
      "your port trip plot tool pool iron loop",
      "yuiop hjkl; yuiop hjkl; yuiop hjkl;"
    ]
  },
  {
    title: "Bottom row (z, x, c, v, b, n, m)",
    lines: [
      "zzz xxx ccc vvv bbb nnn mmm zzz xxx ccc",
      "za az xc cx vb bv nm mn za az xc cx vb",
      "can van ban man cab cat dog zip fox box",
      "zinc zoom verb born norm comb many calm",
      "zxcvb nm,./ zxcvb nm,./ zxcvb nm,./"
    ]
  },
  {
    title: "Gemengde zinnen (Volledige alfabet)",
    lines: [
      "the quick brown fox jumps over the lazy dog",
      "blind typen is een handige vaardigheid",
      "oefening baart kunst typen is een missie",
      "typ deze letters rustig in een vast ritme",
      "super spy school typeoefening voltooid"
    ]
  }
];

// ── KEYBOARD LAYOUT DEFINITIONS ──
const KEYBOARD_LAYOUTS = {
  qwerty: [
    [
      { label: "esc", key: "escape" },
      { label: "1", char: "1", key: "1" },
      { label: "2", char: "2", key: "2" },
      { label: "3", char: "3", key: "3" },
      { label: "4", char: "4", key: "4" },
      { label: "5", char: "5", key: "5" },
      { label: "6", char: "6", key: "6" },
      { label: "7", char: "7", key: "7" },
      { label: "8", char: "8", key: "8" },
      { label: "9", char: "9", key: "9" },
      { label: "0", char: "0", key: "0" },
      { label: "-", char: "-", key: "-" },
      { label: "=", char: "=", key: "=" },
      { label: "backspace", key: "backspace", class: "key-wide-3" }
    ],
    [
      { label: "tab", key: "tab", class: "key-wide-2" },
      { label: "Q", char: "q", key: "q" },
      { label: "W", char: "w", key: "w" },
      { label: "E", char: "e", key: "e" },
      { label: "R", char: "r", key: "r" },
      { label: "T", char: "t", key: "t" },
      { label: "Y", char: "y", key: "y" },
      { label: "U", char: "u", key: "u" },
      { label: "I", char: "i", key: "i" },
      { label: "O", char: "o", key: "o" },
      { label: "P", char: "p", key: "p" },
      { label: "[", char: "[", key: "[" },
      { label: "]", char: "]", key: "]" },
      { label: "\\", char: "\\", key: "\\" }
    ],
    [
      { label: "caps", key: "capslock", class: "key-wide-2" },
      { label: "A", char: "a", key: "a" },
      { label: "S", char: "s", key: "s" },
      { label: "D", char: "d", key: "d" },
      { label: "F", char: "f", key: "f", class: "left-home" },
      { label: "G", char: "g", key: "g" },
      { label: "H", char: "h", key: "h" },
      { label: "J", char: "j", key: "j", class: "right-home" },
      { label: "K", char: "k", key: "k" },
      { label: "L", char: "l", key: "l" },
      { label: ";", char: ";", key: ";" },
      { label: "'", char: "'", key: "'" },
      { label: "enter", key: "enter", class: "key-wide-3" }
    ],
    [
      { label: "shift", key: "shift", class: "key-wide-4" },
      { label: "Z", char: "z", key: "z" },
      { label: "X", char: "x", key: "x" },
      { label: "C", char: "c", key: "c" },
      { label: "V", char: "v", key: "v" },
      { label: "B", char: "b", key: "b" },
      { label: "N", char: "n", key: "n" },
      { label: "M", char: "m", key: "m" },
      { label: ",", char: ",", key: "," },
      { label: ".", char: ".", key: "." },
      { label: "/", char: "/", key: "/" },
      { label: "shift", key: "shift", class: "key-wide-4" }
    ],
    [
      { label: "ctrl", key: "ctrl", class: "key-wide-1" },
      { label: "win", key: "meta", class: "key-wide-1" },
      { label: "alt", key: "alt", class: "key-wide-1" },
      { label: "space", char: " ", key: "space", class: "key-space" },
      { label: "alt", key: "alt", class: "key-wide-1" },
      { label: "fn", key: "fn", class: "key-wide-1" },
      { label: "ctrl", key: "ctrl", class: "key-wide-1" }
    ]
  ],
  azerty: [
    [
      { label: "esc", key: "escape" },
      { label: "&", char: "&", key: "&" },
      { label: "É", char: "é", key: "é" },
      { label: "\"", char: "\"", key: "\"" },
      { label: "'", char: "'", key: "'" },
      { label: "(", char: "(", key: "(" },
      { label: "§", char: "§", key: "§" },
      { label: "È", char: "è", key: "è" },
      { label: "!", char: "!", key: "!" },
      { label: "Ç", char: "ç", key: "ç" },
      { label: "À", char: "à", key: "à" },
      { label: ")", char: ")", key: ")" },
      { label: "-", char: "-", key: "-" },
      { label: "backspace", key: "backspace", class: "key-wide-3" }
    ],
    [
      { label: "tab", key: "tab", class: "key-wide-2" },
      { label: "A", char: "a", key: "a" },
      { label: "Z", char: "z", key: "z" },
      { label: "E", char: "e", key: "e" },
      { label: "R", char: "r", key: "r" },
      { label: "T", char: "t", key: "t" },
      { label: "Y", char: "y", key: "y" },
      { label: "U", char: "u", key: "u" },
      { label: "I", char: "i", key: "i" },
      { label: "O", char: "o", key: "o" },
      { label: "P", char: "p", key: "p" },
      { label: "^", char: "^", key: "^" },
      { label: "$", char: "$", key: "$" },
      { label: "enter", key: "enter", class: "key-wide-3" }
    ],
    [
      { label: "caps", key: "capslock", class: "key-wide-2" },
      { label: "Q", char: "q", key: "q" },
      { label: "S", char: "s", key: "s" },
      { label: "D", char: "d", key: "d" },
      { label: "F", char: "f", key: "f", class: "left-home" },
      { label: "G", char: "g", key: "g" },
      { label: "H", char: "h", key: "h" },
      { label: "J", char: "j", key: "j", class: "right-home" },
      { label: "K", char: "k", key: "k" },
      { label: "L", char: "l", key: "l" },
      { label: "M", char: "m", key: "m" },
      { label: "Ù", char: "ù", key: "ù" },
      { label: "%", char: "%", key: "%" }
    ],
    [
      { label: "shift", key: "shift", class: "key-wide-3" },
      { label: "<", char: "<", key: "<" },
      { label: "W", char: "w", key: "w" },
      { label: "X", char: "x", key: "x" },
      { label: "C", char: "c", key: "c" },
      { label: "V", char: "v", key: "v" },
      { label: "B", char: "b", key: "b" },
      { label: "N", char: "n", key: "n" },
      { label: ",", char: ",", key: "," },
      { label: ";", char: ";", key: ";" },
      { label: ":", char: ":", key: ":" },
      { label: "=", char: "=", key: "=" },
      { label: "shift", key: "shift", class: "key-wide-4" }
    ],
    [
      { label: "ctrl", key: "ctrl", class: "key-wide-1" },
      { label: "win", key: "meta", class: "key-wide-1" },
      { label: "alt", key: "alt", class: "key-wide-1" },
      { label: "space", char: " ", key: "space", class: "key-space" },
      { label: "alt", key: "alt", class: "key-wide-1" },
      { label: "fn", key: "fn", class: "key-wide-1" },
      { label: "ctrl", key: "ctrl", class: "key-wide-1" }
    ]
  ]
};

// ── STATE VARIABLES ──
let currentLessonIndex = 0;
let keyboardLayout = "azerty"; // Default Belgian AZERTY
let keyboardVisible = true;
let lettersVisible = false; // Blind mode active by default
let isInteracting = false; // Flag to track when user is clicking controls/dropdowns
let currentVersion = "typetraining"; // 'typetraining' or 'typetoets'
let panelsVisible = true;

// Timing & evaluation
let running = false;
let testFinished = false;
let lessonStartTime = 0;
let accumulatedTime = 0;
let timerInterval = null;

// Stats tracking
let totalKeystrokes = 0;
let correctKeystrokes = 0;
let mistakeCount = 0;
let currentStreak = 0;
let maxStreak = 0;
let mistakesPerKey = {};
let totalCoins = 0;

// Lesson progression
let currentLineIndex = 0;
let currentTextLine = "";
let cursorIndex = 0;
let typedStates = []; // 'correct', 'wrong', or null

// Metronome engine
let metronomePlaying = false;
let bpm = 40;
let metronomeInterval = null;
let lastTickTime = 0;

// Rhythm visualizer wave animation state
let wavePhase = 0;
let waveAmplitude = 10;
let targetAmplitude = 10;
let waveFrequency = 0.05;
let targetFrequency = 0.05;

// Audio context
let audioCtx = null;
let soundEnabled = true;

// ── DOM ELEMENTS ──
const timerEl = document.getElementById("timer");
const liveCpmEl = document.getElementById("liveCpm");
const mistakeCountEl = document.getElementById("mistakeCount");
const accuracyEl = document.getElementById("accuracy");
const lineIndicatorEl = document.getElementById("lineIndicator");
const typingTextLineEl = document.getElementById("typingTextLine");
const progressBarFillEl = document.getElementById("progressBarFill");
const progressRingBarEl = document.getElementById("progressRingBar");
const progressRingTextEl = document.getElementById("progressRingText");

// Inputs & overlays
const typingInput = document.getElementById("typingInput");
const focusOverlay = document.getElementById("focusOverlay");
const keyboardContainer = document.getElementById("keyboardContainer");
const keyboardSection = document.getElementById("keyboardSection");
const looseLettersStage = document.getElementById("looseLettersStage");
const looseLettersTrack = document.getElementById("looseLettersTrack");

// Buttons & labels
const currentLessonDisplay = document.getElementById("currentLessonDisplay");

const metronomeToggle = document.getElementById("metronomeToggle");
const metronomePlayIcon = document.getElementById("metronomePlayIcon");
const metronomePauseIcon = document.getElementById("metronomePauseIcon");
const metronomeStatusText = document.getElementById("metronomeStatusText");
const bpmValueEl = document.getElementById("bpmValue");
const bpmDecrease = document.getElementById("bpmDecrease");
const bpmIncrease = document.getElementById("bpmIncrease");
const keyboardToggleBtn = document.getElementById("keyboardToggleBtn");
const keyboardLettersBtn = document.getElementById("keyboardLettersBtn");

// Results modal & stats dashboard selectors
const resultsOverlay = document.getElementById("resultsOverlay");
const resultTitle = document.getElementById("resultTitle");
const rankBadge = document.getElementById("rankBadge");
const completeCpm = document.getElementById("completeCpm");
const completeDifficultKey = document.getElementById("completeDifficultKey");
const completeAccuracy = document.getElementById("completeAccuracy");
const completeStreak = document.getElementById("completeStreak");
const missionStatusContainer = document.getElementById("missionStatusContainer");
const completeCoins = document.getElementById("completeCoins");

const cpmCoinsReward = document.getElementById("cpmCoinsReward");
const precisionCoinsReward = document.getElementById("precisionCoinsReward");
const streakCoinsReward = document.getElementById("streakCoinsReward");
const completionCoinsReward = document.getElementById("completionCoinsReward");

const retryLessonBtn = document.getElementById("retryLessonBtn");
const nextLessonBtn = document.getElementById("nextLessonBtn");

// ── INITIALIZATION ──
window.addEventListener("DOMContentLoaded", () => {
  renderKeyboard();
  loadLesson(0);

  // Setup click-to-focus triggers
  focusOverlay.addEventListener("click", () => {
    typingInput.focus();
  });
  document.getElementById("textBoxContainer").addEventListener("click", () => {
    typingInput.focus();
  });

  typingInput.addEventListener("focus", () => {
    focusOverlay.classList.remove("visible");
  });
  typingInput.addEventListener("blur", () => {
    // Clear all pressed keys on blur to prevent stuck keys
    document.querySelectorAll(".key.pressed").forEach(k => k.classList.remove("pressed"));
    document.querySelectorAll(".hand-finger.pressed-finger").forEach(f => {
      f.classList.remove("pressed-finger");
      f.classList.remove("wrong-finger");
    });
    
    // Only show focus overlay if we're not finished and not currently interacting with controls
    setTimeout(() => {
      if (!testFinished && !isInteracting) {
        focusOverlay.classList.add("visible");
      }
    }, 120);
  });

  // Handle typing inputs
  typingInput.addEventListener("keydown", handleKeystroke);
  typingInput.addEventListener("keyup", handleKeyRelease);

  // Layout is statically AZERTY

  // Metronome buttons
  metronomeToggle.addEventListener("click", toggleMetronome);
  bpmDecrease.addEventListener("click", () => adjustBpm(-5));
  bpmIncrease.addEventListener("click", () => adjustBpm(5));

  // Set initial button states based on variables
  keyboardToggleBtn.classList.toggle("active", keyboardVisible);
  keyboardLettersBtn.classList.toggle("active", lettersVisible);
  keyboardLettersBtn.textContent = lettersVisible ? "LETTERS: AAN" : "LETTERS: UIT";

  // Keyboard toggle
  keyboardToggleBtn.addEventListener("click", () => {
    keyboardVisible = !keyboardVisible;
    keyboardSection.classList.toggle("hidden", !keyboardVisible);
    keyboardToggleBtn.classList.toggle("active", keyboardVisible);
    typingInput.focus();
  });

  // Letters show/hide toggle
  keyboardLettersBtn.addEventListener("click", () => {
    lettersVisible = !lettersVisible;
    keyboardContainer.classList.toggle("blind-keyboard", !lettersVisible);
    keyboardLettersBtn.textContent = lettersVisible ? "LETTERS: AAN" : "LETTERS: UIT";
    keyboardLettersBtn.classList.toggle("active", lettersVisible);
    typingInput.focus();
  });

  // Version Selector & Side Panels toggle (Oefening / Toets version)
  const versionSelector = document.getElementById("versionSelector");
  const brandTitle = document.getElementById("brandTitle");
  const workspaceEl = document.querySelector(".practice-main-workspace");
  const panelsToggleBtn = document.getElementById("panelsToggleBtn");
  const viewportContentEl = document.querySelector(".viewport-content");
  const terminalTitle = document.querySelector(".terminal-title");
  const terminalPing = document.getElementById("terminalPing");

  // Custom select elements
  const customVersionTrigger = document.getElementById("customVersionTrigger");
  const customVersionMenu = document.getElementById("customVersionMenu");
  const customVersionLabel = document.getElementById("customVersionLabel");
  const customOptions = document.querySelectorAll(".custom-select-option");

  function syncCustomDropdown(value) {
    if (customVersionLabel) {
      if (value === "looseletterstoets") {
        customVersionLabel.textContent = "VERSIE: LOSSE LETTER TOETS";
      } else if (value === "looseletters") {
        customVersionLabel.textContent = "VERSIE: LOSSE LETTER TRAINING";
      } else if (value === "typetoets") {
        customVersionLabel.textContent = "VERSIE: TYPE TOETS";
      } else {
        customVersionLabel.textContent = "VERSIE: TYPETRAINING";
      }
    }
    customOptions.forEach(opt => {
      const active = (opt.dataset.value === value);
      opt.classList.toggle("active", active);
      opt.setAttribute("aria-selected", active);
    });
  }

  function openDropdown() {
    if (customVersionMenu) customVersionMenu.classList.add("open");
    if (customVersionTrigger) {
      customVersionTrigger.classList.add("expanded");
      customVersionTrigger.setAttribute("aria-expanded", "true");
    }
  }

  function closeDropdown() {
    if (customVersionMenu) customVersionMenu.classList.remove("open");
    if (customVersionTrigger) {
      customVersionTrigger.classList.remove("expanded");
      customVersionTrigger.setAttribute("aria-expanded", "false");
    }
  }

  function toggleDropdown() {
    const isOpen = customVersionMenu && customVersionMenu.classList.contains("open");
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  function updateLayout() {
    const isToets = (currentVersion === "typetoets" || currentVersion === "looseletterstoets");
    const isLooseLetters = (currentVersion === "looseletters" || currentVersion === "looseletterstoets");
    
    // Toggle modes on viewport and workspace
    if (viewportContentEl) viewportContentEl.classList.toggle("toets-mode", isToets);
    if (workspaceEl) {
      workspaceEl.classList.toggle("toets-mode", isToets);
      workspaceEl.classList.toggle("looseletters-mode", isLooseLetters);
    }
    
    // Toggle panels-hidden on workspace (only in training mode)
    if (workspaceEl) workspaceEl.classList.toggle("panels-hidden", !isToets && !isLooseLetters && !panelsVisible);
    
    // Update labels and contents
    if (brandTitle) {
      if (currentVersion === "looseletterstoets") {
        brandTitle.textContent = "TYPEMISSION // LOSSE LETTER TOETS";
      } else if (currentVersion === "looseletters") {
        brandTitle.textContent = "TYPEMISSION // LOSSE LETTER TRAINING";
      } else if (currentVersion === "typetoets") {
        brandTitle.textContent = "TYPEMISSION // TYPE TOETS";
      } else {
        brandTitle.textContent = "TYPEMISSION // TYPETRAINING";
      }
    }
    
    // Sync selector value
    if (versionSelector) versionSelector.value = currentVersion;
    
    // Sync custom dropdown
    syncCustomDropdown(currentVersion);
    
    // Sync panels toggle button (only active/visible when panels are on in typetraining)
    const btnActive = !isToets && !isLooseLetters && panelsVisible;
    if (panelsToggleBtn) {
      if (isLooseLetters || isToets) {
        panelsToggleBtn.style.display = "none";
      } else {
        panelsToggleBtn.style.display = "";
        panelsToggleBtn.classList.toggle("active", btnActive);
        panelsToggleBtn.innerHTML = `<span class="tactical-led"></span>ZIJPANELEN: ${btnActive ? "AAN" : "UIT"}`;
      }
    }

    // Load or switch letter prompt types accordingly
    if (isLooseLetters) {
      renderLooseLetters();
    } else {
      renderPrompt();
    }
  }

  // Initialize layout based on default variables
  updateLayout();

  // Custom Dropdown Event Listeners
  if (customVersionTrigger) {
    customVersionTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown();
    });
  }

  customOptions.forEach(option => {
    option.addEventListener("click", (e) => {
      const val = option.dataset.value;
      currentVersion = val;
      updateLayout();
      closeDropdown();
      typingInput.focus();
    });
  });

  // Close dropdown on click outside
  document.addEventListener("click", (e) => {
    if (customVersionTrigger && customVersionMenu && 
        !customVersionTrigger.contains(e.target) && 
        !customVersionMenu.contains(e.target)) {
      closeDropdown();
    }
  });

  // Close dropdown on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDropdown();
    }
  });

  // Fallback for native select change if it gets triggered programmatically
  versionSelector.addEventListener("change", () => {
    currentVersion = versionSelector.value;
    updateLayout();
    typingInput.focus();
  });

  panelsToggleBtn.addEventListener("click", () => {
    if (currentVersion !== "typetoets" && currentVersion !== "looseletterstoets") {
      panelsVisible = !panelsVisible;
      updateLayout();
    }
    typingInput.focus();
  });

  // Modal actions
  retryLessonBtn.addEventListener("click", () => {
    resultsOverlay.hidden = true;
    loadLesson(currentLessonIndex);
  });

  nextLessonBtn.addEventListener("click", () => {
    resultsOverlay.hidden = true;
    const nextIdx = (currentLessonIndex + 1) % LESSONS.length;
    loadLesson(nextIdx);
  });

  // Track if clicking controls or header to prevent immediate blur lock overlay
  window.addEventListener("mousedown", (e) => {
    if (e.target.closest(".game-header") || e.target.closest(".bottom-controls-bar") || e.target.closest(".results-overlay") || e.target.closest(".tactical-select-wrapper")) {
      isInteracting = true;
    }
  });
  window.addEventListener("mouseup", () => {
    setTimeout(() => {
      isInteracting = false;
    }, 100);
  });

  // Auto-focus typing input when clicking anywhere on the game stage or background
  document.addEventListener("click", (e) => {
    const isInteractive = e.target.closest("button") || 
                          e.target.closest("textarea") || 
                          e.target.closest("select") || 
                          e.target.closest("option") || 
                          e.target.closest("a") || 
                          e.target.closest(".results-overlay");
    if (!isInteractive && !testFinished) {
      typingInput.focus();
    }
  });

  // Start subtle dotted wave background animation
  initDottedWaveBackground();

  // Start the rhythm visualizer wave loop
  animateRhythmWave();
});

// ── KEYBOARD FINGER MAPPING HELPERS ──
function getFingerClass(char) {
  if (!char) return "";
  const c = char.toLowerCase();

  // Spacebar is pressed by thumbs
  if (c === " ") return "finger-t";
  // Enter is pressed by right pinky
  if (c === "\n" || c === "enter") return "finger-rp";

  if (keyboardLayout === "qwerty") {
    if (["`", "1", "q", "a", "z"].includes(c)) return "finger-lp"; // Left Pinky
    if (["2", "w", "s", "x"].includes(c)) return "finger-lr";      // Left Ring
    if (["3", "e", "d", "c"].includes(c)) return "finger-lm";      // Left Middle
    if (["4", "5", "r", "t", "f", "g", "v", "b"].includes(c)) return "finger-li"; // Left Index
    if (["6", "7", "y", "u", "h", "j", "n", "m"].includes(c)) return "finger-ri"; // Right Index
    if (["8", "i", "k", ","].includes(c)) return "finger-rm";      // Right Middle
    if (["9", "o", "l", "."].includes(c)) return "finger-rr";      // Right Ring
    if (["0", "-", "=", "p", "[", "]", ";", "'", "\\", "/"].includes(c)) return "finger-rp"; // Right Pinky
  } else {
    // AZERTY (Belgian Layout)
    if (["&", "a", "q", "w", "<"].includes(c)) return "finger-lp"; // Left Pinky (² is neutral/modifiers style)
    if (["é", "z", "s", "x"].includes(c)) return "finger-lr";      // Left Ring
    if (['"', "e", "d", "c"].includes(c)) return "finger-lm";      // Left Middle
    if (["'", "(", "r", "t", "f", "g", "v", "b"].includes(c)) return "finger-li"; // Left Index
    if (["§", "è", "y", "u", "h", "j", "n"].includes(c)) return "finger-ri"; // Right Index
    if (["!", "i", "k", ","].includes(c)) return "finger-rm";      // Right Middle
    if (["ç", "o", "l", ";"].includes(c)) return "finger-rr";      // Right Ring
    if (["à", ")", "-", "p", "^", "$", "m", "ù", "%", ":", "=", "µ"].includes(c)) return "finger-rp"; // Right Pinky
  }
  return "";
}
function getActiveLessonFingers() {
  const lesson = LESSONS[currentLessonIndex];
  const allText = lesson.lines.join("");
  const activeFingers = new Set();
  
  for (let i = 0; i < allText.length; i++) {
    const fingerClass = getFingerClass(allText[i]);
    if (fingerClass) {
      activeFingers.add(fingerClass);
    }
  }
  return activeFingers;
}

// ── KEYBOARD DYNAMIC RENDERING ──
function renderKeyboard() {
  keyboardContainer.innerHTML = "";
  keyboardContainer.classList.toggle("blind-keyboard", !lettersVisible);
  const layout = KEYBOARD_LAYOUTS[keyboardLayout];
  const activeFingers = getActiveLessonFingers();

  layout.forEach(rowKeys => {
    const rowEl = document.createElement("div");
    rowEl.className = "keyboard-row";

    rowKeys.forEach(k => {
      const keyEl = document.createElement("div");
      keyEl.className = "key";
      if (k.class) {
        keyEl.className += ` ${k.class}`;
      }

      // Store character mapping for lookup
      if (k.key) {
        keyEl.dataset.key = k.key.toLowerCase();
      }
      if (k.char !== undefined) {
        keyEl.dataset.char = k.char;
      }

      // Add finger color coding classes
      const fingerClass = getFingerClass(k.char);
      if (fingerClass) {
        keyEl.classList.add(fingerClass);
        // Dim the key if its finger is not being learned in the current lesson
        if (!activeFingers.has(fingerClass)) {
          keyEl.classList.add("dimmed");
        }
      }

      const span = document.createElement("span");
      span.className = "key-code";
      span.textContent = k.label;

      keyEl.appendChild(span);
      rowEl.appendChild(keyEl);
    });

    keyboardContainer.appendChild(rowEl);
  });
}

// ── LESSON CONTROLLER ──
function loadLesson(index) {
  currentLessonIndex = index;
  currentLineIndex = 0;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  mistakeCount = 0;
  currentStreak = 0;
  maxStreak = 0;
  mistakesPerKey = {};
  accumulatedTime = 0;
  running = false;
  testFinished = false;
  clearInterval(timerInterval);

  // No dropdown items to update
  const currentTitle = LESSONS[index].title;
  currentLessonDisplay.textContent = `Les ${index + 1}: ${currentTitle.split(" (")[0]}`;

  // Hide overlay, enable inputs
  resultsOverlay.hidden = true;
  resultsOverlay.classList.remove("active");
  focusOverlay.classList.remove("visible");

  // Reset live stats HUD
  timerEl.textContent = "0.0s";
  liveCpmEl.textContent = "0";
  mistakeCountEl.textContent = "0";
  accuracyEl.textContent = "100%";

  // Reset telemetry bar widths
  const tf = document.querySelector(".time-fill"); if (tf) tf.style.width = "0%";
  const sf = document.querySelector(".speed-fill"); if (sf) sf.style.width = "0%";
  const af = document.querySelector(".accuracy-fill"); if (af) af.style.width = "100%";
  const ef = document.querySelector(".error-fill"); if (ef) ef.style.width = "0%";

  renderKeyboard(); // Dynamically draw keyboard with finger highlights for this lesson
  loadLine();
  setTimeout(() => {
    typingInput.focus();
  }, 100);
}

function loadLine() {
  const lesson = LESSONS[currentLessonIndex];
  const rawLine = lesson.lines[currentLineIndex];
  
  // Append carriage return enter symbol at the end
  currentTextLine = rawLine + "\n";
  cursorIndex = 0;
  typedStates = Array(currentTextLine.length).fill(null);

  if (currentVersion === "looseletters" || currentVersion === "looseletterstoets") {
    renderLooseLetters();
  } else {
    renderPrompt();
  }
  highlightTargetKey();
  highlightTargetFinger();
  updateProgressVisuals();
}

function renderPrompt() {
  typingTextLineEl.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const lesson = LESSONS[currentLessonIndex];

  for (let l = 0; l < lesson.lines.length; l++) {
    const lineEl = document.createElement("div");
    lineEl.className = "typing-text-row";

    let lineText;
    const isActive = (l === currentLineIndex);
    const isCompleted = (l < currentLineIndex);

    if (isCompleted) {
      lineEl.classList.add("completed");
      lineText = lesson.lines[l] + "\n";
    } else if (isActive) {
      lineEl.classList.add("active");
      lineText = currentTextLine;
    } else {
      lineEl.classList.add("upcoming");
      lineText = lesson.lines[l] + "\n";
    }

    let currentWordEl = null;

    for (let i = 0; i < lineText.length; i++) {
      const char = lineText[i];
      const span = document.createElement("span");
      span.className = "char";

      if (char === "\n") {
        span.innerHTML = '<span class="enter-symbol">↵</span>';
      } else {
        span.textContent = char;
      }

      // Apply class based on status
      if (isActive) {
        if (i < cursorIndex) {
          span.classList.add("correct");
        } else if (i === cursorIndex) {
          span.classList.add("current");
          if (typedStates[i] === "wrong") {
            span.classList.add("wrong");
          }
        } else {
          span.classList.add("faded");
        }
      } else if (isCompleted) {
        span.classList.add("correct");
      } else {
        span.classList.add("faded");
      }

      if (char === " ") {
        if (currentWordEl) {
          lineEl.appendChild(currentWordEl);
          currentWordEl = null;
        }
        lineEl.appendChild(span);
      } else {
        if (!currentWordEl) {
          currentWordEl = document.createElement("span");
          currentWordEl.className = "word";
        }
        currentWordEl.appendChild(span);
      }
    }

    if (currentWordEl) {
      lineEl.appendChild(currentWordEl);
    }

    fragment.appendChild(lineEl);
  }

  typingTextLineEl.appendChild(fragment);

  // Smooth scroll active line into view if it overflows
  const activeRow = typingTextLineEl.querySelector(".typing-text-row.active");
  if (activeRow) {
    activeRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function highlightTargetKey() {
  // Clear active target glow
  document.querySelectorAll(".key.active-target").forEach(k => {
    k.classList.remove("active-target");
  });

  // To encourage blind touch typing, we no longer highlight the target key on the keyboard.
  // The key will only animate (sink and glow) when the user actually presses it.
}

function highlightTargetFinger() {
  // Clear all glowing active finger classes on the hands SVG
  document.querySelectorAll(".hand-finger.active-finger").forEach(f => {
    f.classList.remove("active-finger");
  });

  const reticleCharEl = document.getElementById("reticleChar");

  if (testFinished) {
    if (reticleCharEl) reticleCharEl.textContent = "-";
    return;
  }
  
  const targetChar = currentTextLine[cursorIndex];
  if (!targetChar) {
    if (reticleCharEl) reticleCharEl.textContent = "-";
    return;
  }

  // Update target scanner text values
  if (reticleCharEl) {
    reticleCharEl.textContent = targetChar === " " ? "␣" : (targetChar === "\n" ? "↵" : targetChar.toUpperCase());
  }

  const fingerClass = getFingerClass(targetChar);

  if (!fingerClass) return;

  if (fingerClass === "finger-t") {
    // Both thumbs
    document.querySelectorAll(".hand-finger.finger-t").forEach(f => {
      f.classList.add("active-finger");
    });
  } else {
    // Find the specific finger group on the left/right hand
    const leftFingers = ["finger-lp", "finger-lr", "finger-lm", "finger-li"];
    const rightFingers = ["finger-rp", "finger-rr", "finger-rm", "finger-ri"];
    
    if (leftFingers.includes(fingerClass)) {
      const leftFingerEl = document.querySelector(`#leftHandContainer .hand-finger.${fingerClass}`);
      if (leftFingerEl) leftFingerEl.classList.add("active-finger");
    } else if (rightFingers.includes(fingerClass)) {
      const rightFingerEl = document.querySelector(`#rightHandContainer .hand-finger.${fingerClass}`);
      if (rightFingerEl) rightFingerEl.classList.add("active-finger");
    }
  }
}

// ── KEYSTROKE PROCESSING ──
function handleKeystroke(e) {
  if (testFinished) return;

  // Let browser-level control keys pass (reload, close, copy, etc.)
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  const targetChar = currentTextLine[cursorIndex];

  // Prevent default scrolling/tabbing/actions in general
  if (e.key === "Tab" || e.key === " " || e.key === "Enter" || e.key === "Backspace" || e.key === "'") {
    e.preventDefault();
  }

  // Visual flash on virtual keyboard and hands for user feedback
  highlightKeyPress(e.key);
  highlightFingerPress(e.key);

  if (!running) {
    running = true;
    lessonStartTime = Date.now();
    timerInterval = setInterval(updateLiveTimer, 100);
  }

  totalKeystrokes++;

  if (e.key === "Enter") {
    if (targetChar === "\n") {
      registerCharSuccess();
    } else {
      registerCharFail();
    }
  } else if (e.key === " ") {
    if (targetChar === " ") {
      registerCharSuccess();
    } else {
      registerCharFail();
    }
  } else if (e.key.length === 1) {
    // Normal alphanumeric typed key matching
    if (e.key === targetChar) {
      registerCharSuccess();
    } else {
      registerCharFail();
    }
  }
}

function highlightKeyPress(keyName) {
  let keyToFind = keyName.toLowerCase();
  if (keyToFind === " ") keyToFind = "space";
  if (keyToFind === "control") keyToFind = "ctrl";
  
  const keyEls = keyboardContainer.querySelectorAll(`.key[data-key="${keyToFind}"]`);
  keyEls.forEach(el => {
    el.classList.add("pressed");
  });
}

function handleKeyRelease(e) {
  let keyToFind = e.key.toLowerCase();
  if (keyToFind === " ") keyToFind = "space";
  if (keyToFind === "control") keyToFind = "ctrl";
  
  const keyEls = keyboardContainer.querySelectorAll(`.key[data-key="${keyToFind}"]`);
  keyEls.forEach(el => {
    el.classList.remove("pressed");
  });

  removeFingerPress(e.key);
}

function highlightFingerPress(keyName) {
  let keyToFind = keyName.toLowerCase();
  if (keyToFind === " ") keyToFind = " ";
  if (keyToFind === "enter") keyToFind = "enter";
  
  const fingerClass = getFingerClass(keyToFind);
  if (fingerClass) {
    const targetChar = currentTextLine[cursorIndex];
    const targetFingerClass = getFingerClass(targetChar);
    const isWrongFinger = targetFingerClass && (fingerClass !== targetFingerClass);

    if (fingerClass === "finger-t") {
      document.querySelectorAll(".hand-finger.finger-t").forEach(f => {
        f.classList.add("pressed-finger");
        if (isWrongFinger) f.classList.add("wrong-finger");
      });
    } else {
      const leftFingers = ["finger-lp", "finger-lr", "finger-lm", "finger-li"];
      const rightFingers = ["finger-rp", "finger-rr", "finger-rm", "finger-ri"];
      
      if (leftFingers.includes(fingerClass)) {
        const fEl = document.querySelector(`#leftHandContainer .hand-finger.${fingerClass}`);
        if (fEl) {
          fEl.classList.add("pressed-finger");
          if (isWrongFinger) fEl.classList.add("wrong-finger");
        }
      } else if (rightFingers.includes(fingerClass)) {
        const fEl = document.querySelector(`#rightHandContainer .hand-finger.${fingerClass}`);
        if (fEl) {
          fEl.classList.add("pressed-finger");
          if (isWrongFinger) fEl.classList.add("wrong-finger");
        }
      }
    }
  }
}

function removeFingerPress(keyName) {
  let keyToFind = keyName.toLowerCase();
  if (keyToFind === " ") keyToFind = " ";
  if (keyToFind === "enter") keyToFind = "enter";
  
  const fingerClass = getFingerClass(keyToFind);
  if (fingerClass) {
    if (fingerClass === "finger-t") {
      document.querySelectorAll(".hand-finger.finger-t").forEach(f => {
        f.classList.remove("pressed-finger");
        f.classList.remove("wrong-finger");
      });
    } else {
      const leftFingers = ["finger-lp", "finger-lr", "finger-lm", "finger-li"];
      const rightFingers = ["finger-rp", "finger-rr", "finger-rm", "finger-ri"];
      
      if (leftFingers.includes(fingerClass)) {
        const fEl = document.querySelector(`#leftHandContainer .hand-finger.${fingerClass}`);
        if (fEl) {
          fEl.classList.remove("pressed-finger");
          fEl.classList.remove("wrong-finger");
        }
      } else if (rightFingers.includes(fingerClass)) {
        const fEl = document.querySelector(`#rightHandContainer .hand-finger.${fingerClass}`);
        if (fEl) {
          fEl.classList.remove("pressed-finger");
          fEl.classList.remove("wrong-finger");
        }
      }
    }
  }
}

function registerCharSuccess() {
  typedStates[cursorIndex] = "correct";
  cursorIndex++;
  correctKeystrokes++;
  currentStreak++;
  if (currentStreak > maxStreak) maxStreak = currentStreak;

  playSynthSound("click");
  
  // Calculate if the typing timing is in sync with the metronome beat
  let isOffBeat = false;
  if (metronomePlaying && lastTickTime > 0) {
    const timeSinceTick = Date.now() - lastTickTime;
    const intervalMs = (60 / bpm) * 1000;
    const timeUntilNextTick = intervalMs - timeSinceTick;
    const deviation = Math.min(timeSinceTick, timeUntilNextTick);
    // 160ms window around the beat (80ms before and 80ms after)
    if (deviation > 80) {
      isOffBeat = true;
    }
  }
  triggerVisualizerPulse(false, isOffBeat);
  
  updateLiveHUD();

  if (cursorIndex >= currentTextLine.length) {
    // Line finished!
    currentLineIndex++;
    const totalLines = LESSONS[currentLessonIndex].lines.length;

    if (currentLineIndex < totalLines) {
      loadLine();
    } else {
      finishLesson();
    }
  } else {
    if (currentVersion === "looseletters" || currentVersion === "looseletterstoets") {
      updateLooseLettersVisuals();
    } else {
      renderPrompt();
    }
    highlightTargetKey();
    highlightTargetFinger();
    updateProgressVisuals();
  }
}

function registerCharFail() {
  typedStates[cursorIndex] = "wrong";
  mistakeCount++;
  currentStreak = 0;
  
  const targetChar = currentTextLine[cursorIndex];
  const k = targetChar === " " ? "spatie" : (targetChar === "\n" ? "enter" : targetChar);
  mistakesPerKey[k] = (mistakesPerKey[k] || 0) + 1;
  
  playSynthSound("error");
  triggerVisualizerPulse(true);
  updateLiveHUD();
  if (currentVersion === "looseletters" || currentVersion === "looseletterstoets") {
    updateLooseLettersVisuals();
  } else {
    renderPrompt();
  }
  highlightTargetFinger();

  // Glitch shake feedback on error
  const panel = document.querySelector(".exercise-panel");
  if (panel) {
    panel.classList.remove("glitch-shake");
    panel.offsetHeight; // force reflow
    panel.classList.add("glitch-shake");
    setTimeout(() => panel.classList.remove("glitch-shake"), 250);
  }
}

// ── STATISTICS & VISUAL UPDATES ──
function updateLiveTimer() {
  if (!running) return;
  const elapsed = (Date.now() - lessonStartTime + accumulatedTime) / 1000;
  timerEl.textContent = elapsed.toFixed(1) + "s";

  const timeFill = document.querySelector(".time-fill");
  if (timeFill) {
    const timePercent = Math.min(100, (elapsed / 30) * 100);
    timeFill.style.width = `${timePercent}%`;
  }
}

function updateLiveHUD() {
  const elapsed = (Date.now() - lessonStartTime + accumulatedTime) / 1000;
  const safeElapsed = Math.max(elapsed, 0.5);
  const cpm = Math.round(correctKeystrokes / (safeElapsed / 60));
  liveCpmEl.textContent = cpm;

  const accuracy = totalKeystrokes === 0 ? 100 : Math.round((correctKeystrokes / totalKeystrokes) * 100);
  accuracyEl.textContent = `${accuracy}%`;

  mistakeCountEl.textContent = mistakeCount;

  // Set speed fill width (max 300 CPM = 100%)
  const speedFill = document.querySelector(".speed-fill");
  if (speedFill) {
    const speedPercent = Math.min(100, (cpm / 300) * 100);
    speedFill.style.width = `${speedPercent}%`;
  }
  // Set accuracy fill width
  const accuracyFill = document.querySelector(".accuracy-fill");
  if (accuracyFill) {
    accuracyFill.style.width = `${accuracy}%`;
  }
  // Set error fill width (max 10 errors = 100%)
  const errorFill = document.querySelector(".error-fill");
  if (errorFill) {
    const errorPercent = Math.min(100, (mistakeCount / 10) * 100);
    errorFill.style.width = `${errorPercent}%`;
  }
}

function updateProgressVisuals() {
  const totalLines = LESSONS[currentLessonIndex].lines.length;
  
  // Overall progress based on line index + cursor index relative to line length
  const lineWeight = 1 / totalLines;
  const currentLineProgress = cursorIndex / currentTextLine.length;
  const overallProgress = (currentLineIndex / totalLines + currentLineProgress * lineWeight) * 100;

  // Update Top Progress Bar
  progressBarFillEl.style.width = `${overallProgress.toFixed(1)}%`;

  // Update Circular Progress Ring
  const circleRadius = 18;
  const circumference = 2 * Math.PI * circleRadius; // 113.097
  const offset = circumference - (overallProgress / 100) * circumference;
  progressRingBarEl.style.strokeDashoffset = offset;
  progressRingTextEl.textContent = `${Math.round(overallProgress)}%`;

  // Update line number label
  lineIndicatorEl.textContent = `Regel ${currentLineIndex + 1} van ${totalLines}`;
}

// ── LESSON FINISHED ──
function finishLesson() {
  testFinished = true;
  running = false;
  clearInterval(timerInterval);
  highlightTargetFinger();

  // Stop metronome
  if (metronomePlaying) {
    toggleMetronome();
  }

  // Disable inputs
  typingInput.blur();
  focusOverlay.classList.remove("visible");

  const totalTimeSec = (Date.now() - lessonStartTime + accumulatedTime) / 1000;
  calculateScores(totalTimeSec);
}

// ── SCORE & REWARD CALCULATIONS ──
function calculateScores(elapsed) {
  const safeElapsed = Math.max(elapsed, 1);
  const cpm = Math.round(correctKeystrokes / (safeElapsed / 60));
  completeCpm.textContent = "0";

  const acc = totalKeystrokes === 0 ? 100 : Math.round((correctKeystrokes / totalKeystrokes) * 100);
  completeAccuracy.textContent = "0%";
  completeStreak.textContent = "0";

  // Difficult key calculation
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

  // Coins rewards
  const cpmCoins = Math.round(cpm * 0.4);
  const precisionCoins = Math.round(acc * 1.2);
  const streakCoins = Math.round(maxStreak * 2.0);
  const completionBonus = 50;

  // Rank badges
  let rank = "Type Groentje";
  if (cpm >= 180 && acc >= 96) rank = "Master Typist";
  else if (cpm >= 120 && acc >= 90) rank = "Elite Typist";
  else if (cpm >= 80) rank = "Veld Agent";
  rankBadge.textContent = rank;

  // Results Title & Badge
  const isToets = (currentVersion === "typetoets" || currentVersion === "looseletterstoets");
  resultTitle.textContent = isToets ? "TOETS VOLTOOID!" : "TRAINING VOLTOOID!";
  const statusCardTitle = document.getElementById("statusCardTitle");
  if (statusCardTitle) {
    statusCardTitle.textContent = isToets ? "STATUS TOETS" : "STATUS TRAINING";
  }
  missionStatusContainer.innerHTML = '<span class="status-success-badge" id="missionBadge">GESLAAGD</span>';
  completeAccuracy.className = "card-main-value highlight-green";

  // Reset coin displays
  completeCoins.textContent = totalCoins;
  cpmCoinsReward.innerHTML = `+0 <img src="coin.svg" width="14" height="14">`;
  precisionCoinsReward.innerHTML = `+0 <img src="coin.svg" width="14" height="14">`;
  streakCoinsReward.innerHTML = `+0 <img src="coin.svg" width="14" height="14">`;
  completionCoinsReward.innerHTML = `+${completionBonus} <img src="coin.svg" width="14" height="14">`;

  // Display results modal and make it active
  resultsOverlay.hidden = false;
  resultsOverlay.classList.add("active");

  // Animate counts and tally
  playSynthSound("complete");

  setTimeout(() => {
    animateNumberValue(completeCpm, cpm, 1000);
    animateNumberValue(completeAccuracy, acc, 1000, "%");
    animateNumberValue(completeStreak, maxStreak, 1000);

    animateCoinsBreakdown({
      cpm: cpmCoins,
      precision: precisionCoins,
      streak: streakCoins,
      bonus: completionBonus
    });
  }, 400);
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

function animateCoinsBreakdown(breakdownValues) {
  let totalTally = totalCoins;
  const targetLabel = document.getElementById("completeCoins");
  const stepDelay = 600;

  const rows = [
    { el: cpmCoinsReward, value: breakdownValues.cpm },
    { el: precisionCoinsReward, value: breakdownValues.precision },
    { el: streakCoinsReward, value: breakdownValues.streak },
    { el: completionCoinsReward, value: breakdownValues.bonus }
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
        totalCoins = totalTally;
        targetLabel.textContent = totalTally;
      }, 500);

    }, index * stepDelay);
  });
}

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

// ── AUDIO SYNTH ENGINE ──
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
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === "error") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(110, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === "complete") {
      // Upbeat arpeggio chord sound
      const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      frequencies.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + i * 0.07);
        gain.gain.setValueAtTime(0.06, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.35);
      });
    } else if (type === "coin") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      osc1.connect(gain1); gain1.connect(ctx.destination);
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc1.type = "sine"; osc1.frequency.setValueAtTime(987.77, now);
      osc2.type = "sine"; osc2.frequency.setValueAtTime(1318.51, now + 0.04);
      gain1.gain.setValueAtTime(0.04, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      gain2.gain.setValueAtTime(0.04, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.start(now); osc1.stop(now + 0.12);
      osc2.start(now + 0.04); osc2.stop(now + 0.18);
    }
  } catch (e) {
    console.error("Audio Synthesis Error:", e);
  }
}

// ── METRONOME LOGIC ──
function toggleMetronome() {
  const core = document.getElementById("metronomeCore");
  const wave = core ? core.querySelector(".metronome-pulse-wave") : null;

  if (metronomePlaying) {
    // Stop
    clearInterval(metronomeInterval);
    metronomeInterval = null;
    metronomePlaying = false;
    metronomePlayIcon.style.display = "block";
    metronomePauseIcon.style.display = "none";
    if (metronomeStatusText) {
      metronomeStatusText.textContent = "OFFLINE";
      metronomeStatusText.classList.remove("online");
    }
    if (core) {
      core.classList.remove("active-metronome");
      core.classList.remove("online-metronome");
    }
    if (wave) wave.classList.remove("pulse");
  } else {
    // Start metronome timer
    metronomePlaying = true;
    metronomePlayIcon.style.display = "none";
    metronomePauseIcon.style.display = "block";
    if (metronomeStatusText) {
      metronomeStatusText.textContent = "ONLINE";
      metronomeStatusText.classList.add("online");
    }
    if (core) {
      core.classList.add("online-metronome");
    }
    playMetronomeTick(); // Play immediately
    startMetronomeTimer();
  }
  typingInput.focus();
}

function startMetronomeTimer() {
  clearInterval(metronomeInterval);
  const intervalMs = (60 / bpm) * 1000;
  metronomeInterval = setInterval(playMetronomeTick, intervalMs);
}

function playMetronomeTick() {
  lastTickTime = Date.now();

  // Visual pulse beat indicator
  triggerMetronomePulse();
  triggerMetronomeCorePulse();

  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // High pitched short metronome sound (sine decay)
    osc.type = "sine";
    osc.frequency.setValueAtTime(1000, now);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.start(now);
    osc.stop(now + 0.03);
  } catch (e) {
    console.error("Metronome audio tick error:", e);
  }
}

function triggerMetronomePulse() {
  const el = document.getElementById("metronomeToggle");
  if (el) {
    el.classList.remove("beat-pulse-active");
    el.offsetHeight; // Trigger layout reflow
    el.classList.add("beat-pulse-active");
  }
}

function triggerMetronomeCorePulse() {
  const core = document.getElementById("metronomeCore");
  const wave = core ? core.querySelector(".metronome-pulse-wave") : null;
  if (core && wave) {
    core.classList.remove("active-metronome");
    wave.classList.remove("pulse");
    core.offsetHeight; // force reflow
    core.classList.add("active-metronome");
    wave.classList.add("pulse");
    
    setTimeout(() => {
      core.classList.remove("active-metronome");
    }, 150);
  }
}

function adjustBpm(amount) {
  bpm = Math.max(20, Math.min(120, bpm + amount));
  bpmValueEl.textContent = bpm;
  if (metronomePlaying) {
    startMetronomeTimer(); // Restart metronome timer with new speed
  }
  typingInput.focus();
}

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
    ctx.fillStyle = "#070707";
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

// ── RHYTHM WAVE VISUALIZER ANIMATION ──
function animateRhythmWave() {
  const pathEl = document.getElementById("rhythmWavePath");
  const guidePathEl = document.getElementById("rhythmWaveGuidePath");
  if (!pathEl) {
    requestAnimationFrame(animateRhythmWave);
    return;
  }
  
  // Wave speed scales slightly with typing speed (live CPM)
  const currentCpm = parseInt(liveCpmEl.textContent) || 0;
  const speedFactor = 1 + (currentCpm / 200); // speed up if typing faster!
  wavePhase += 0.08 * speedFactor;
  
  // Decay amplitude and frequency back to baseline
  waveAmplitude += (targetAmplitude - waveAmplitude) * 0.15;
  waveFrequency += (targetFrequency - waveFrequency) * 0.15;
  
  targetAmplitude += (2 - targetAmplitude) * 0.08;
  targetFrequency += (0.05 - targetFrequency) * 0.08;
  
  // Render guide wave if metronome is active
  if (metronomePlaying && lastTickTime > 0) {
    if (guidePathEl) guidePathEl.style.display = "block";
    
    // Calculate progress through current beat
    const timeSinceTick = Date.now() - lastTickTime;
    const intervalMs = (60 / bpm) * 1000;
    const beatProgress = Math.min(1, timeSinceTick / intervalMs);
    
    // Metronome beat pulse decay: peaks on tick and decays back to base (baseline of 2)
    const guideAmp = 2 + 26 * Math.pow(Math.E, -5 * beatProgress);
    
    let guideD = "M 0 50";
    for (let x = 5; x <= 200; x += 5) {
      const env = Math.pow(Math.sin((x / 200) * Math.PI), 0.15);
      // Synchronize phase of the guide wave with the metronome timing
      const y = 50 + Math.sin(x * 0.09 + (beatProgress * Math.PI * 2)) * guideAmp * env;
      guideD += ` L ${x} ${y}`;
    }
    if (guidePathEl) guidePathEl.setAttribute("d", guideD);
  } else {
    if (guidePathEl) guidePathEl.style.display = "none";
  }

  // Draw user wave inside a 200x100 viewBox centered vertically at 50
  let pathD = "M 0 50";
  for (let x = 5; x <= 200; x += 5) {
    const env = Math.pow(Math.sin((x / 200) * Math.PI), 0.15);
    const y = 50 + Math.sin(x * waveFrequency + wavePhase) * waveAmplitude * env;
    pathD += ` L ${x} ${y}`;
  }
  pathEl.setAttribute("d", pathD);
  
  requestAnimationFrame(animateRhythmWave);
}

function triggerVisualizerPulse(isError = false, isOffBeat = false) {
  if (isError) {
    targetAmplitude = 45;
    targetFrequency = 0.18;
    const pathEl = document.getElementById("rhythmWavePath");
    if (pathEl) {
      pathEl.classList.add("error-pulse");
      setTimeout(() => pathEl.classList.remove("error-pulse"), 200);
    }
    const statusEl = document.getElementById("rhythmStatusLabel");
    if (statusEl) {
      statusEl.textContent = "FOUT GEDETECTEERD";
      statusEl.style.color = "var(--red)";
      setTimeout(() => {
        statusEl.textContent = "VERBINDING ACTIEF";
        statusEl.style.color = "";
      }, 1000);
    }
  } else if (isOffBeat) {
    // Off-beat typing creates a slightly faster, lower amplitude visual glitch
    targetAmplitude = 22;
    targetFrequency = 0.14;
    const statusEl = document.getElementById("rhythmStatusLabel");
    if (statusEl) {
      statusEl.textContent = "RITME AFWIJKING";
      statusEl.style.color = "var(--orange)";
      setTimeout(() => {
        if (statusEl.textContent === "RITME AFWIJKING") {
          statusEl.textContent = "VERBINDING ACTIEF";
          statusEl.style.color = "";
        }
      }, 800);
    }
  } else {
    // Perfect sync or metronome tick
    targetAmplitude = 28;
    targetFrequency = 0.09;
  }
}

// ── LOOSE LETTERS CONVEYOR SYSTEM HELPERS ──
function getFingerNameDutch(fingerClass) {
  switch (fingerClass) {
    case "finger-lp": return "L. Pink";
    case "finger-lr": return "L. Ring";
    case "finger-lm": return "L. Middel";
    case "finger-li": return "L. Wijs";
    case "finger-rp": return "R. Pink";
    case "finger-rr": return "R. Ring";
    case "finger-rm": return "R. Middel";
    case "finger-ri": return "R. Wijs";
    case "finger-t": return "Duim";
    default: return "";
  }
}

function renderLooseLetters() {
  if (!looseLettersTrack) return;
  looseLettersTrack.innerHTML = "";
  
  for (let i = 0; i < currentTextLine.length; i++) {
    const char = currentTextLine[i];
    const blockEl = document.createElement("div");
    blockEl.className = "loose-letter-block";
    blockEl.dataset.index = i;
    
    const fingerClass = getFingerClass(char);
    if (fingerClass) {
      blockEl.classList.add(fingerClass);
    }
    
    const led = document.createElement("div");
    led.className = "block-led";
    
    const charSpan = document.createElement("span");
    charSpan.className = "block-char";
    if (char === " ") {
      charSpan.textContent = "␣";
    } else if (char === "\n") {
      charSpan.innerHTML = '<span class="enter-symbol">↵</span>';
    } else {
      charSpan.textContent = char.toUpperCase();
    }
    
    const hint = document.createElement("div");
    hint.className = "block-finger-hint";
    hint.textContent = getFingerNameDutch(fingerClass);
    
    blockEl.appendChild(led);
    blockEl.appendChild(charSpan);
    blockEl.appendChild(hint);
    
    looseLettersTrack.appendChild(blockEl);
  }
  
  updateLooseLettersVisuals();
}

function updateLooseLettersVisuals() {
  if (!looseLettersTrack) return;
  const blocks = looseLettersTrack.querySelectorAll(".loose-letter-block");
  blocks.forEach((block, idx) => {
    block.classList.remove("active", "status-correct", "status-wrong");
    if (idx === cursorIndex) {
      block.classList.add("active");
      if (typedStates[idx] === "wrong") {
        block.classList.remove("status-wrong");
        block.offsetHeight; // force reflow to trigger CSS shake animation again
        block.classList.add("status-wrong");
      }
    } else if (idx < cursorIndex) {
      block.classList.add("status-correct");
    }
  });

  const blockWidth = 80;
  const blockGap = 18;
  const transformX = -1 * (cursorIndex * (blockWidth + blockGap) + (blockWidth / 2));
  
  looseLettersTrack.style.left = "50%";
  looseLettersTrack.style.transform = `translateX(${transformX}px)`;
}

