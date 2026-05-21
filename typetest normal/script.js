const TOTAL_SECONDS = 60;
const INITIAL_WORDS = 14;
const WORD_BATCH = 9;
const BUFFER_CHARS = 145;

const missionText = [
  "Het systeem is nu aan het laden en zoekt naar de kluis in het netwerk.",
  "Er is een kluis gevonden op niveau drie van het gebouw.",
  "De kluis heeft vijf bouten en een zwaar slot met een geheime code.",
  "Het scannen van de eerste bout is begonnen en het duurt even.",
  "De eerste bout is gekraakt en het groene licht gaat nu aan.",
  "Het systeem gaat nu verder met de tweede bout van de kluis.",
  "De code van de tweede bout is blauw en het slot draait open.",
  "Er wordt nu een sein gestuurd naar de basis voor meer data.",
  "De basis stuurt de data terug en het systeem laadt de sleutel.",
  "De derde bout reageert op de sleutel en gaat langzaam los.",
  "Het alarm van de kluis staat nog aan maar het systeem zet het uit.",
  "De vierde bout heeft een rode code en het kost wat meer tijd.",
  "Het slot draait naar links en dan weer naar rechts tot het klikt.",
  "De vierde bout is nu ook los en er is nog maar een bout over.",
  "De laatste bout heeft een witte code die heel sterk is.",
  "Het systeem probeert alle codes en vindt de juiste combinatie.",
  "Bout vijf is gekraakt en alle bouten van de kluis zijn nu los.",
  "De hendel van de kluis draait naar beneden en de deur gaat open.",
  "In de kluis liggen geheime bestanden die heel belangrijk zijn.",
  "Het systeem slaat de bestanden op en wist daarna alle sporen."
].join(" ");

const missionWords = missionText.split(/\s+/);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const timerEl = document.querySelector("#timer");
const liveWpmEl = document.querySelector("#liveWpm");
const mistakeCountEl = document.querySelector("#mistakeCount");
const accuracyEl = document.querySelector("#accuracy");
const uploadPercentEl = document.querySelector("#uploadPercent");
const uploadFillEl = document.querySelector("#uploadFill");
const uploadChecks = document.querySelectorAll(".crack-checkpoint");
const promptTextEl = document.querySelector("#promptText");
// NOTE: This selector is crucial for the typing input functionality. Do NOT modify without careful testing.
const typingInput = document.querySelector("#typingInput");
const typingCard = document.querySelector("#vaultCodePanel");
// NOTE: Fix to ensure typing input works correctly. Do NOT modify this comment; Gemini may overwrite it.
const typingOverlay = document.querySelector("#typingOverlay");
const overlayMessage = document.querySelector("#overlayMessage");
const startButton = document.querySelector("#startButton");
const finishButton = document.querySelector("#finishButton");
const resetButton = document.querySelector("#resetButton");
const resultPanel = document.querySelector("#resultPanel");
const resultTitle = document.querySelector("#resultTitle");
const resultText = document.querySelector("#resultText");
const trialButton = document.querySelector("#trialButton");
const buyButton = document.querySelector("#buyButton");
const ctaFeedback = document.querySelector("#ctaFeedback");
const soundToggle = document.querySelector("#soundToggle");
const missionStatus = document.querySelector("#missionStatus");
const missionMessage = document.querySelector("#missionMessage");
const missionSteps = document.querySelectorAll(".mission-steps li");
const missionStage = document.querySelector("#missionStage");
const morphFlash = document.querySelector("#morphFlash");
const storyStage = document.querySelector("#storyStage");
const missionLayout = document.querySelector("#missionLayout");
const storyText = document.querySelector("#storyText");
const storyProgress = document.querySelectorAll(".story-progress span");
const playBriefingButton = document.querySelector("#playBriefingButton");
const beginMissionButton = document.querySelector("#beginMissionButton");
const startMissionHero = document.querySelector("#startMissionHero");
const completeWpm = document.querySelector("#completeWpm");
const completeAccuracy = document.querySelector("#completeAccuracy");
const completeMistakes = document.querySelector("#completeMistakes");
const completeCoins = document.querySelector("#completeCoins");
const rankBadge = document.querySelector("#rankBadge");
const unlockNote = document.querySelector("#unlockNote");
const retryResultButton = document.querySelector("#retryResultButton");

// Vault elements
const vaultDial = document.querySelector("#vaultDial");
const vaultDoor = document.querySelector("#vaultDoor");
const vaultHandle = document.querySelector("#vaultHandle");
const codeStatus = document.querySelector("#codeStatus");
const bolts = [document.querySelector("#bolt1"), document.querySelector("#bolt2"), document.querySelector("#bolt3"), document.querySelector("#bolt4"), document.querySelector("#bolt5")];
const vaultWrapper = document.querySelector(".vault-wrapper");
let dialRotation = 0;

const storySlides = [
  "Welkom bij de Super Spy School, rekruut! Ik ben Miss J.",
  "Iedereen denkt dat een spion alleen gadgets en lasers gebruikt, maar ons belangrijkste wapen is het toetsenbord.",
  "Of je nu een kluis kraakt of geheime codes verstuurt: je moet supersnel kunnen typen.",
  "Als je te traag bent, gaat het alarm af en is je missie mislukt. Doe de test, dan kijk ik hoe snel jouw vingers zijn."
];

let running = false;
let testArmed = false;
let testReadyToFinish = false;
let capsLockOn = false;
let testFinished = false;
let paused = false;
let pauseStartTime = 0;
let totalPausedTime = 0;
let startedAt = 0;
let timerId = 0;
let finalElapsed = TOTAL_SECONDS;
let resultStats = null;
let targetWords = [];
let wordCursor = 0;
let targetText = "";
let audioContext = null;
let soundEnabled = true;
let lastTickSound = 0;
let lastMilestone = 0;
let mistakeIndex = -1;
let mistakeCount = 0;
let mistakeHistory = {};
let onboardingComplete = false;
let briefingPlaying = false;
let storyTimeoutId = 0;
let typewriterId = 0;
let activeMissionView = storyStage;
let viewTransitioning = false;

function hasGsap() {
  return window.gsap && !prefersReducedMotion;
}

function runIntroAnimations() {
  if (!hasGsap()) return;

  if (window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }

  window.gsap.from(".site-header", {
    y: -24,
    opacity: 0,
    duration: 0.55,
    ease: "power2.out"
  });

  window.gsap.from(".hero-copy > *", {
    y: 22,
    opacity: 0,
    duration: 0.7,
    stagger: 0.09,
    ease: "power3.out"
  });

  if (window.ScrollTrigger) {
    window.gsap.utils.toArray(".reveal").forEach((element) => {
      if (element.classList.contains("hero-copy")) return;
      window.gsap.from(element, {
        y: 28,
        opacity: 0,
        duration: 0.65,
        ease: "power2.out",
        scrollTrigger: {
          trigger: element,
          start: "top 82%",
          once: true
        }
      });
    });
  }
}

function pulseElement(element) {
  if (!hasGsap() || !element) return;
  window.gsap.fromTo(
    element,
    { scale: 0.94 },
    { scale: 1, duration: 0.35, ease: "back.out(2)" }
  );
}

function clearAnimatedStyles(element) {
  if (!element) return;
  element.removeAttribute("style");
}

function setViewImmediate(nextView) {
  [storyStage, missionLayout, resultPanel].forEach((view) => {
    const isActive = view === nextView;
    view.hidden = !isActive;
    view.classList.toggle("active", isActive);
    clearAnimatedStyles(view);
  });
  missionStage.style.height = "";
  activeMissionView = nextView;
}

function transitionToView(nextView, onComplete) {
  if (viewTransitioning) {
    window.setTimeout(() => transitionToView(nextView, onComplete), 90);
    return;
  }

  const currentView = activeMissionView;

  if (currentView === nextView) {
    if (onComplete) onComplete();
    return;
  }

  if (!hasGsap()) {
    setViewImmediate(nextView);
    if (onComplete) onComplete();
    return;
  }

  const currentHeight = currentView.offsetHeight;
  viewTransitioning = true;
  missionStage.classList.add("is-transitioning");
  window.gsap.set(missionStage, { height: currentHeight, overflow: "hidden" });
  nextView.hidden = false;
  nextView.classList.add("active");
  nextView.style.visibility = "hidden";
  const nextHeight = nextView.offsetHeight;

  window.gsap.set(nextView, {
    position: "absolute",
    inset: 0,
    width: "100%",
    visibility: "visible",
    opacity: 0,
    y: 18
  });

  const timeline = window.gsap.timeline({
    defaults: { ease: "power3.inOut" },
    onComplete: () => {
      currentView.hidden = true;
      currentView.classList.remove("active");
      clearAnimatedStyles(currentView);
      clearAnimatedStyles(nextView);
      window.gsap.set(morphFlash, { clearProps: "all" });
      window.gsap.set(missionStage, { clearProps: "height,overflow" });
      missionStage.classList.remove("is-transitioning");
      activeMissionView = nextView;
      viewTransitioning = false;
      if (onComplete) onComplete();
    }
  });

  timeline
    .set(morphFlash, { xPercent: -108, opacity: 0 })
    .to(morphFlash, { xPercent: 108, opacity: 0.6, duration: 0.55 }, 0)
    .to(morphFlash, { opacity: 0, duration: 0.25 }, 0.3)
    .to(currentView, {
      opacity: 0,
      y: -20,
      duration: 0.35
    }, 0)
    .to(missionStage, { height: nextHeight, duration: 0.55, ease: "power3.inOut" }, 0)
    .to(nextView, {
      opacity: 1,
      y: 0,
      duration: 0.45,
      ease: "power3.out"
    }, 0.15);
}

function typeStoryText(text) {
  clearInterval(typewriterId);
  storyText.textContent = "";

  let index = 0;
  typewriterId = window.setInterval(() => {
    storyText.textContent += text[index];
    index += 1;

    if (index >= text.length) {
      clearInterval(typewriterId);
    }
  }, 16);
}

function setStoryProgress(activeIndex) {
  storyProgress.forEach((dot, index) => {
    dot.classList.toggle("active", index <= activeIndex);
  });
}

function playBriefingSlide(index = 0) {
  const isFinalSlide = index >= storySlides.length - 1;

  setStoryProgress(index);
  typeStoryText(storySlides[index]);
  playTone(360 + index * 80, 0.07, 0, "triangle", 0.018);

  if (hasGsap()) {
    window.gsap.fromTo(
      ".briefing-visual img",
      { scale: 0.97 },
      { scale: 1, duration: 0.55, ease: "power2.out" }
    );
  }

  if (isFinalSlide) {
    briefingPlaying = false;
    playBriefingButton.textContent = "Briefing voltooid";
    beginMissionButton.innerHTML = '<span aria-hidden="true">&#9658;</span> Begin de test';
    beginMissionButton.classList.replace("secondary-story-button", "primary-button");
    if (hasGsap()) {
      window.gsap.fromTo(beginMissionButton, { scale: 0.9, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" });
    }
    beginMissionButton.disabled = false;
    unlockNote.textContent = "Missie vrijgegeven. Klik op Begin de test om de typetest klaar te zetten.";
    beginMissionButton.focus();
    playMilestoneSound();
    return;
  }

  storyTimeoutId = window.setTimeout(() => playBriefingSlide(index + 1), 3600);
}

function startBriefing() {
  if (briefingPlaying) return;

  createAudioContext();
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }

  briefingPlaying = true;
  beginMissionButton.disabled = false;
  beginMissionButton.textContent = "Sla briefing over";
  playBriefingButton.disabled = true;
  playBriefingButton.textContent = "Miss J spreekt...";
  playStartSound();
  clearTimeout(storyTimeoutId);
  playBriefingSlide(0);
}

function completeOnboarding({ startImmediately = false } = {}) {
  clearTimeout(storyTimeoutId);
  clearInterval(typewriterId);
  onboardingComplete = true;
  briefingPlaying = false;
  beginMissionButton.disabled = false;
  beginMissionButton.innerHTML = '<span aria-hidden="true">&#9658;</span> Begin de test';
  beginMissionButton.classList.replace("secondary-story-button", "primary-button");
  playBriefingButton.disabled = false;
  storyStage.classList.add("complete");
  unlockNote.textContent = "Briefing voltooid. De typetest is ontgrendeld.";
  resetTest();

  missionStage.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "center"
  });

  transitionToView(missionLayout, () => {
    if (startImmediately) {
      window.setTimeout(startTest, 120);
    }
  });
}

function guideToBriefing() {
  storyStage.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "center"
  });

  if (hasGsap()) {
    window.gsap.fromTo(
      storyStage,
      { scale: 0.985 },
      { scale: 1, duration: 0.35, ease: "back.out(1.6)" }
    );
  }
}

function setMissionStep(activeStep) {
  missionSteps.forEach((step) => {
    const stepName = step.dataset.step;
    const isReady = activeStep === "ready";
    step.classList.toggle("active", stepName === activeStep || (isReady && stepName === "typing"));
    step.classList.toggle(
      "complete",
      (isReady && stepName === "briefing") ||
      (activeStep === "typing" && stepName === "briefing") ||
      (activeStep === "result" && stepName !== "result")
    );
  });
}

function setMissionCopy(status, message) {
  missionStatus.textContent = status;
  missionMessage.textContent = message;
}

function createAudioContext() {
  if (!soundEnabled || audioContext) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) {
    audioContext = new AudioContext();
  }
}

function playTone(frequency, duration = 0.06, delay = 0, type = "sine", volume = 0.032) {
  if (!soundEnabled || !audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime + delay;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function playStartSound() {
  playTone(320, 0.07, 0, "triangle");
  playTone(520, 0.08, 0.08, "triangle");
  playTone(720, 0.08, 0.17, "triangle");
}

function playKeySound(isCorrect) {
  const now = performance.now();
  if (now - lastTickSound < 55) return;
  lastTickSound = now;
  playTone(isCorrect ? 820 : 190, 0.035, 0, isCorrect ? "square" : "sawtooth", isCorrect ? 0.018 : 0.012);
}

function playMilestoneSound() {
  playTone(520, 0.06, 0, "triangle", 0.02);
  playTone(700, 0.07, 0.06, "triangle", 0.02);
}

function playFinishSound() {
  playTone(420, 0.08, 0, "triangle");
  playTone(560, 0.08, 0.09, "triangle");
  playTone(760, 0.11, 0.18, "triangle");
}

function playCelebrationSound() {
  playTone(520, 0.08, 0, "triangle", 0.026);
  playTone(660, 0.08, 0.08, "triangle", 0.026);
  playTone(820, 0.13, 0.16, "triangle", 0.03);
  playTone(980, 0.16, 0.3, "triangle", 0.025);
}

function charsMatch(typedChar, targetChar) {
  return typedChar.toLowerCase() === targetChar.toLowerCase();
}

function canAcceptTyping() {
  return (testArmed || running) && !testReadyToFinish && !capsLockOn;
}

function updateMistakeCounter() {
  mistakeCountEl.textContent = mistakeCount;
}

function getCoinScore(stats) {
  if (stats.typedChars === 0 && stats.mistakes === 0) return 0;

  const speedCoins = Math.round(stats.apm * 1.6);
  const precisionCoins = Math.round(stats.accuracy * 1.5);
  const progressCoins = Math.floor(stats.correctChars / 5);
  const mistakePenalty = stats.mistakes * 10;

  return Math.max(0, 25 + speedCoins + precisionCoins + progressCoins - mistakePenalty);
}

function addWords(amount) {
  for (let i = 0; i < amount; i += 1) {
    targetWords.push(missionWords[wordCursor % missionWords.length]);
    wordCursor += 1;
  }
  targetText = targetWords.join(" ");
}

function ensureTargetLength(minLength) {
  while (targetText.length < minLength) {
    addWords(WORD_BATCH);
  }
}

function getTypedStats(elapsedSeconds) {
  ensureTargetLength(typingInput.value.length + BUFFER_CHARS);

  const typed = typingInput.value;
  let correctChars = 0;

  for (let i = 0; i < typed.length; i += 1) {
    if (charsMatch(typed[i], targetText[i])) {
      correctChars += 1;
    }
  }

  const safeElapsed = Math.max(elapsedSeconds, 1);
  const apm = Math.round(correctChars / (safeElapsed / 60));
  const attemptedChars = typed.length + mistakeCount;
  const accuracy = attemptedChars === 0 ? 100 : Math.round((correctChars / attemptedChars) * 100);
  const stats = {
    apm,
    accuracy,
    correctChars,
    typedChars: typed.length,
    mistakes: mistakeCount
  };

  return {
    ...stats,
    coins: getCoinScore(stats)
  };
}

function renderPrompt() {
  ensureTargetLength(typingInput.value.length + BUFFER_CHARS);

  const typed = typingInput.value;
  const visibleLength = Math.min(targetText.length, typed.length + BUFFER_CHARS);
  const visibleText = targetText.slice(0, visibleLength);
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < visibleText.length; i += 1) {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = visibleText[i];

    if (i === mistakeIndex) {
      const type = mistakeHistory[i];
      span.classList.add(type === "case" ? "case-error" : "wrong", "current");
    } else if (i < typed.length) {
      if (mistakeHistory[i] === "wrong") {
        span.classList.add("wrong");
      } else if (mistakeHistory[i] === "case") {
        span.classList.add("case-error");
      } else {
        span.classList.add("correct");
      }
    } else if (i === typed.length && canAcceptTyping()) {
      span.classList.add("current");
    }

    fragment.appendChild(span);
  }

  promptTextEl.replaceChildren(fragment);

  // Auto-scroll to keep current character visible
  const currentEl = promptTextEl.querySelector('.current');
  if (currentEl) {
    // OffsetTop is now accurate because .code-text is position: relative
    const elTop = currentEl.offsetTop;
    const containerTop = promptTextEl.scrollTop;
    const containerHeight = promptTextEl.clientHeight;

    // Scroll down if cursor goes below visible area
    if (elTop > containerTop + containerHeight - 40) {
      promptTextEl.scrollTop = elTop - containerHeight + 60;
    }
    // Scroll up if cursor goes above visible area
    else if (elTop < containerTop) {
      promptTextEl.scrollTop = elTop - 20;
    }
  }
}

function rejectWrongInput(typedChar) {
  if (testArmed && !running) {
    beginTimer();
  }

  mistakeCount += 1;
  mistakeIndex = typingInput.value.length;
  
  const targetChar = targetText[mistakeIndex];
  let mistakeType = "wrong";
  if (typedChar && targetChar && typedChar.toLowerCase() === targetChar.toLowerCase()) {
    mistakeType = "case";
  }

  if (mistakeHistory[mistakeIndex] !== "wrong") {
    mistakeHistory[mistakeIndex] = mistakeType;
  }

  updateMistakeCounter();
  renderPrompt();
  updateLiveStats();
  playKeySound(false);


  typingCard.classList.remove("input-error");
  void typingCard.offsetWidth;
  typingCard.classList.add("input-error");
}

function isAllowedInput(data) {
  ensureTargetLength(typingInput.value.length + BUFFER_CHARS);

  if (!data) {
    return false;
  }

  for (let i = 0; i < data.length; i += 1) {
    if (data[i] !== targetText[typingInput.value.length + i]) {
      return false;
    }
  }

  return true;
}

function setProgress(progress) {
  const clamped = Math.max(0, Math.min(progress, 100));
  const milestone = Math.floor(clamped / 20);

  uploadFillEl.style.width = `${clamped}%`;
  uploadPercentEl.textContent = `${Math.round(clamped)}%`;

  uploadChecks.forEach((check, index) => {
    const isActive = clamped >= (index + 1) * 20;
    if (isActive && !check.classList.contains("active")) {
      pulseElement(check);
      // Unlock corresponding bolt
      if (bolts[index]) {
        bolts[index].classList.add("unlocked");
      }
    }
    check.classList.toggle("active", isActive);
  });

  if (running && milestone > lastMilestone) {
    lastMilestone = milestone;
    playMilestoneSound();
  }
}

function updateLiveStats() {
  let currentElapsedMs = Date.now() - startedAt - totalPausedTime;
  if (paused) currentElapsedMs -= (Date.now() - pauseStartTime);
  const elapsed = running ? currentElapsedMs / 1000 : finalElapsed;
  const stats = getTypedStats(elapsed);
  liveWpmEl.textContent = elapsed < 5 && running ? "—" : stats.apm;
  accuracyEl.textContent = `${stats.accuracy}%`;
  updateMistakeCounter();
}

function updateTimer() {
  if (!running || paused) return;

  const elapsed = (Date.now() - startedAt - totalPausedTime) / 1000;
  const remaining = Math.max(0, TOTAL_SECONDS - elapsed);
  const progress = (elapsed / TOTAL_SECONDS) * 100;

  timerEl.textContent = Math.ceil(remaining);
  setProgress(progress);
  updateLiveStats();

  if (remaining <= 10 && remaining > 0) {
    missionStatus.textContent = "Laatste seconden";
  }

  if (remaining <= 0) {
    completeTimedTest();
  }
}

function resetTest() {
  running = false;
  testArmed = false;
  testReadyToFinish = false;
  testFinished = false;
  paused = false;
  pauseStartTime = 0;
  totalPausedTime = 0;
  clearInterval(timerId);
  finalElapsed = TOTAL_SECONDS;
  resultStats = null;
  targetWords = [];
  wordCursor = 0;
  targetText = "";
  lastMilestone = 0;
  mistakeIndex = -1;
  mistakeCount = 0;
  mistakeHistory = {};

  addWords(INITIAL_WORDS);
  typingInput.value = "";
  typingInput.disabled = true;

  updateOverlay();

  timerEl.textContent = TOTAL_SECONDS;
  liveWpmEl.textContent = "0";
  updateMistakeCounter();
  accuracyEl.textContent = "100%";
  setProgress(0);
  renderPrompt();

  // Reset vault visuals
  if (vaultDoor) vaultDoor.classList.remove("cracked");
  if (vaultHandle) vaultHandle.classList.remove("turned");
  if (vaultDial) vaultDial.style.transform = "rotate(0deg)";
  if (codeStatus) codeStatus.textContent = "vergrendeld";
  if (vaultWrapper) vaultWrapper.classList.remove("open");
  bolts.forEach(b => { if (b) b.classList.remove("unlocked"); });
  dialRotation = 0;

  startButton.hidden = false;
  startButton.disabled = false;
  startButton.innerHTML = onboardingComplete
    ? '<span aria-hidden="true">&#9658;</span> Start de test'
    : '<span aria-hidden="true">&#9658;</span> Bekijk briefing';
  finishButton.hidden = true;
  finishButton.disabled = true;
  if (activeMissionView !== resultPanel) {
    resultPanel.hidden = true;
    resultPanel.classList.remove("active");
  }
  ctaFeedback.textContent = "";
  setMissionStep(onboardingComplete ? "ready" : "briefing");
  setMissionCopy(
    onboardingComplete ? "Wacht op start" : "Briefing nodig",
    onboardingComplete
      ? "Briefing voltooid. Klik op start en begin wanneer je klaar bent. De timer loopt pas vanaf je eerste letter."
      : "Miss J opent zo de briefing. Na haar instructie wordt de typetest vrijgegeven."
  );
}

function startTest() {
  if (!onboardingComplete) {
    guideToBriefing();
    return;
  }

  createAudioContext();
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }

  resetTest();
  testArmed = true;
  finalElapsed = TOTAL_SECONDS;
  typingInput.disabled = false;
  updateOverlay();
  if (codeStatus) codeStatus.textContent = "ontgrendeld";

  startButton.disabled = true;
  startButton.innerHTML = '<span aria-hidden="true">&#9201;</span> Klaar voor start';
  setMissionStep("typing");
  setMissionCopy(
    "Klaar voor start",
    "De timer blijft op 60 seconden staan tot je eerste letter is getypt."
  );
  playStartSound();
  renderPrompt();

  if (hasGsap()) {
    window.gsap.fromTo("#vaultCodePanel", { y: 12 }, { y: 0, duration: 0.35, ease: "power2.out" });
  }

  typingInput.focus();
}

function beginTimer() {
  if (running || !testArmed || testReadyToFinish) return;

  running = true;
  testArmed = false;
  startedAt = Date.now();
  finalElapsed = 0;
  startButton.innerHTML = '<span aria-hidden="true">&#9632;</span> Missie loopt';

  timerId = window.setInterval(updateTimer, 100);
  updateTimer();
}

function completeTimedTest() {
  if (!running) return;

  running = false;
  testArmed = false;
  clearInterval(timerId);
  finalElapsed = TOTAL_SECONDS;
  timerEl.textContent = "0";
  setProgress(100);
  updateLiveStats();
  typingInput.disabled = true;
  testFinished = true;

  // Hide typing overlay during animation so vault is visible
  updateOverlay();

  resultStats = getTypedStats(TOTAL_SECONDS);
  startButton.hidden = true;
  startButton.disabled = true;
  setMissionStep("typing");

  // === Vault cracking sequence (fast) ===
  if (codeStatus) codeStatus.textContent = "kraken...";

  // Step 1: Dial spins (0ms)
  if (vaultDial && hasGsap()) {
    window.gsap.to(vaultDial, {
      rotation: "+=720",
      duration: 1.2,
      ease: "power2.inOut"
    });
  }

  // Step 2: Handle turns down & vault cracked (1200ms)
  setTimeout(() => {
    if (vaultHandle) vaultHandle.classList.add("turned");
    if (vaultDoor) vaultDoor.classList.add("cracked");
    if (codeStatus) codeStatus.textContent = "gekraakt!";
    playTone(600, 0.1, 0, "triangle", 0.025);
    playFinishSound();
  }, 1200);

  // Step 3: Automatically show results screen (2600ms)
  setTimeout(() => {
    testReadyToFinish = true;
    showResults();
  }, 2600);
}

function showResults() {
  if (!testReadyToFinish || activeMissionView === resultPanel) return;

  const stats = resultStats || getTypedStats(finalElapsed);
  const resultIntro = stats.apm >= 120
    ? "Wow, je bent al net zo goed als een superspion! Je typkunsten zijn al fantastisch, deze missie was een eitje voor jou."
    : "Wow, goed gedaan zeg! Ik zie dat jij het absoluut in je hebt om een superspion te worden. Met de TypeMission-cursus leren wij je hoe je razendsnel en volledig blind met 10 vingers leert typen!";
  const mistakeLabel = stats.mistakes === 1 ? "1 fout" : `${stats.mistakes} fouten`;

  const spyFactEl = document.querySelector("#spyFact");
  if (spyFactEl) {
    if (stats.apm >= 120) {
      spyFactEl.innerHTML = "<strong>Leuk feitje:</strong> Je typt nu al op het niveau van een volleerd spion (120+ APM)!";
    } else {
      spyFactEl.innerHTML = "<strong>Wist je dat:</strong> Volleerd spionnen typen met wel meer dan 120 aanslagen per minuut! Wil jij dat ook kunnen? Doe dan onze typecursus en word razendsnel.";
    }
  }

  resultTitle.textContent = stats.apm >= 120 ? "Kluis gekraakt, superspion!" : (stats.coins >= 260 ? "Kluis gekraakt, rekruut!" : "Missie voltooid, rekruut");
  resultText.textContent = `${stats.apm} aanslagen per minuut, ${stats.accuracy}% precisie en ${mistakeLabel}. Je kreeg ${stats.coins} Super Spy School coins! ${resultIntro}`;
  startButton.disabled = false;
  startButton.innerHTML = '<span aria-hidden="true">&#9658;</span> Nog een poging';
  setMissionStep("result");
  setMissionCopy(
    "Missie voltooid",
    `Je haalde ${stats.apm} APM en ${stats.coins} Super Spy School coins.`
  );
  testReadyToFinish = false;
  showInlineComplete(stats);

  transitionToView(resultPanel, () => {
    if (hasGsap()) {
      window.gsap.fromTo(
        ".result-agent-card",
        { scale: 0.94, opacity: 0.72 },
        { scale: 1, opacity: 1, duration: 0.48, ease: "back.out(1.6)" }
      );

      const coinImg = document.querySelector(".reward-total img");
      if (coinImg) {
        window.gsap.fromTo(coinImg, { rotationY: 0 }, { rotationY: 720, duration: 1.5, ease: "power2.out" });
      }

      const statsObj = { coins: 0, apm: 0, accuracy: 0, mistakes: 0 };
      window.gsap.to(statsObj, {
        coins: stats.coins,
        apm: stats.apm,
        accuracy: stats.accuracy,
        mistakes: stats.mistakes,
        duration: 1.2,
        ease: "power3.out",
        onUpdate: () => {
          completeCoins.textContent = Math.round(statsObj.coins);
          completeWpm.textContent = Math.round(statsObj.apm);
          completeAccuracy.textContent = `${Math.round(statsObj.accuracy)}%`;
          completeMistakes.textContent = Math.round(statsObj.mistakes);
        }
      });
    }

    missionStage.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center"
    });
  });
}

function getRank(stats) {
  if (stats.coins >= 430 && stats.accuracy >= 90) return "Superspion";
  if (stats.coins >= 260) return "Codekraker";
  return "Rekruut";
}

function showInlineComplete(stats) {
  const rank = getRank(stats);
  rankBadge.textContent = rank;

  if (!hasGsap()) {
    completeWpm.textContent = stats.apm;
    completeAccuracy.textContent = `${stats.accuracy}%`;
    completeMistakes.textContent = stats.mistakes;
    completeCoins.textContent = stats.coins;
  } else {
    completeWpm.textContent = "0";
    completeAccuracy.textContent = "0%";
    completeMistakes.textContent = "0";
    completeCoins.textContent = "0";
  }

  playCelebrationSound();
}

typingInput.addEventListener("input", () => {
  if (!canAcceptTyping()) return;
  if (!running) {
    beginTimer();
  }

  const typed = typingInput.value;
  const lastIndex = typed.length - 1;
  const isCorrect = lastIndex < 0 || charsMatch(typed[lastIndex], targetText[lastIndex]);

  mistakeIndex = -1;
  ensureTargetLength(typed.length + BUFFER_CHARS);
  renderPrompt();
  updateLiveStats();
  playKeySound(isCorrect);
});

const codeContainer = document.querySelector(".screen-body");
if (codeContainer) {
  codeContainer.addEventListener("click", () => {
    if (testReadyToFinish) {
      showResults();
      return;
    }
    if (!typingInput.disabled) {
      typingInput.focus();
    }
  });
}

typingInput.addEventListener("beforeinput", (event) => {
  if (!canAcceptTyping()) return;

  if (event.inputType === "deleteContentBackward" || event.inputType === "deleteContentForward") {
    mistakeIndex = -1;
    return;
  }

  if (event.inputType === "insertFromPaste" || !isAllowedInput(event.data)) {
    if (!running) {
      beginTimer();
    }
    event.preventDefault();
    rejectWrongInput(event.data);
    return;
  }

  if (event.inputType.startsWith("insert") && event.data && !running) {
    beginTimer();
  }
});

typingInput.addEventListener("keydown", (event) => {
  if (!canAcceptTyping() || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key.length !== 1) return;

  if (!running) {
    beginTimer();
  }

  if (!isAllowedInput(event.key)) {
    event.preventDefault();
    rejectWrongInput(event.key);
  }
});

typingCard.addEventListener("click", () => {
  if (testArmed || running) {
    typingInput.focus();
  } else if (onboardingComplete && !testReadyToFinish) {
    startTest();
  }
});

startButton.addEventListener("click", startTest);
finishButton.addEventListener("click", showResults);
resetButton.addEventListener("click", resetTest);
retryResultButton.addEventListener("click", () => {
  resetTest();
  transitionToView(missionLayout, () => {
    startButton.focus();
  });
});

playBriefingButton.addEventListener("click", startBriefing);
beginMissionButton.addEventListener("click", () => completeOnboarding({ startImmediately: true }));

startMissionHero.addEventListener("click", (event) => {
  if (!onboardingComplete) {
    event.preventDefault();
    guideToBriefing();
  }
});

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.textContent = soundEnabled ? "Geluid aan" : "Geluid uit";
  if (soundEnabled) {
    createAudioContext();
    playTone(520, 0.06, 0, "triangle");
  }
});

trialButton.addEventListener("click", () => {
  ctaFeedback.textContent = "Top! Mr. I zet jouw eerste geheime missie klaar.";
});

buyButton.addEventListener("click", () => {
  ctaFeedback.textContent = "Cursus gekozen. De SuperSpySchool opent het dossier.";
});

window.addEventListener("keydown", (event) => {
  if (event.key === " " && event.target === document.body) {
    event.preventDefault();
  }
});

storyProgress.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    if (!onboardingComplete) {
      clearTimeout(storyTimeoutId);
      playBriefingSlide(index);
    }
  });
});

function updateOverlay() {
  if (testFinished || activeMissionView === resultPanel) {
    typingOverlay.classList.add("hidden");
    typingOverlay.classList.remove("caps-lock-warning");
    return;
  }

  if (capsLockOn) {
    if (running && !paused) {
      paused = true;
      pauseStartTime = Date.now();
      startButton.innerHTML = '<span aria-hidden="true">&#9888;</span> Missie gepauzeerd';
    } else if (testArmed) {
      startButton.innerHTML = '<span aria-hidden="true">&#9888;</span> Caps Lock aan';
    }

    typingOverlay.classList.remove("hidden");
    typingOverlay.classList.add("caps-lock-warning");
    overlayMessage.innerHTML = "<strong>Caps Lock staat aan.</strong><br>Zet dit uit om verder te typen.";
    const icon = typingOverlay.querySelector(".overlay-icon");
    if (icon) icon.innerHTML = '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>';
    return;
  }

  if (running && paused) {
    paused = false;
    totalPausedTime += Date.now() - pauseStartTime;
    startButton.innerHTML = '<span aria-hidden="true">&#9632;</span> Missie loopt';
  } else if (testArmed) {
    startButton.innerHTML = '<span aria-hidden="true">&#9201;</span> Klaar voor start';
  }

  typingOverlay.classList.remove("caps-lock-warning");
  if (running || testArmed) {
    typingOverlay.classList.add("hidden");
  } else {
    typingOverlay.classList.remove("hidden");
    if (onboardingComplete) {
      overlayMessage.innerHTML = "Klik op <strong>Start de test</strong> om te beginnen.";
      const icon = typingOverlay.querySelector(".overlay-icon");
      if (icon) icon.innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>';
    } else {
      overlayMessage.innerHTML = "Wacht op briefing...";
    }
  }
}

function handleCapsLock(isOn) {
  if (capsLockOn === isOn) return;
  capsLockOn = isOn;
  updateOverlay();
}

window.addEventListener("keydown", (event) => {
  if (event.getModifierState) handleCapsLock(event.getModifierState("CapsLock"));
});
window.addEventListener("keyup", (event) => {
  if (event.getModifierState) handleCapsLock(event.getModifierState("CapsLock"));
});

runIntroAnimations();
resetTest();
