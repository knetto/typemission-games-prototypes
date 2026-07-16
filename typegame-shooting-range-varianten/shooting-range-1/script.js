/* ==========================================================================
   3D TYPING SHOOTING RANGE — GAME CODE
   ========================================================================== */

// Lesson configurations mapping characters
const lessons = {
  homerow: {
    name: "Les 1: Home Row (A S D F J K L ;)",
    chars: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';']
  },
  toprow: {
    name: "Les 2: Home + Top Row",
    chars: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']
  },
  lefthand: {
    name: "Les 3: Alleen Linkerhand",
    chars: ['A', 'S', 'D', 'F', 'Q', 'W', 'E', 'R']
  },
  righthand: {
    name: "Les 4: Alleen Rechterhand",
    chars: ['H', 'J', 'K', 'L', ';', 'Y', 'U', 'I', 'O', 'P']
  },
  fullkbd: {
    name: "Les 5: Volledig Toetsenbord",
    chars: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
  }
};

let currentLesson = 'homerow';

// Game state variables
let score = 0;
let combo = 0;
let maxCombo = 0;
let totalKeysPressed = 0;
let correctKeysPressed = 0;
let isPlaying = false;
let resultsAwaiting = false;
let startTime = null;
let gameTimerInterval = null;
let activeBriefingSlide = 0;
const totalBriefingSlides = 3;

// Target state
let activeTargetChar = '';
let targetPctX = 50;
let targetPctY = 50;
let targetAimTimeout = null;
let isTargetResolving = false;

// Audio Synthesizer Class (Synthesizes sound effects natively using the Web Audio API)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.ambientHum = null;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.startAmbientHum();
  }

  startAmbientHum() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(100, this.ctx.currentTime);

      gainNode.gain.setValueAtTime(0.04, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start();
      this.ambientHum = osc;
    } catch (e) {
      console.warn("Failed to start ambient hum:", e);
    }
  }

  playCharge() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.25);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.08);
    gain.gain.linearRampToValueAtTime(0, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  playShot() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.14);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playHit() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Ringing chime sound
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    
    // Noise blast
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(700, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.2);
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.25);
    noise.start(now);
    noise.stop(now + 0.2);
  }

  playMiss() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(120, now);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(155, now);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.2);
    osc2.stop(now + 0.2);
  }
}

const sounds = new SoundManager();

// Shared interactive dotted-wave background
function setupMatrix() {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);
  const dotSpacing = 28;
  let cols = Math.floor(width / dotSpacing) + 1;
  let rows = Math.floor(height / dotSpacing) + 1;
  let time = 0;
  let animationFrameId = null;
  let lastFrameTime = 0;

  const mouse = {
    x: -9999,
    y: -9999,
    targetX: -9999,
    targetY: -9999,
    active: false
  };

  function activatePointer(x, y) {
    mouse.targetX = x;
    mouse.targetY = y;
    mouse.active = true;
    if (!animationFrameId) draw();
  }

  window.addEventListener('mousemove', (event) => {
    activatePointer(event.clientX, event.clientY);
  });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
    if (!animationFrameId) draw();
  });

  window.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    if (touch) activatePointer(touch.clientX, touch.clientY);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    mouse.active = false;
    if (!animationFrameId) draw();
  });

  function draw() {
    ctx.fillStyle = '#050206';
    ctx.fillRect(0, 0, width, height);
    time += 0.02;

    if (mouse.active) {
      if (mouse.x === -9999) {
        mouse.x = mouse.targetX;
        mouse.y = mouse.targetY;
      } else {
        mouse.x += (mouse.targetX - mouse.x) * 0.15;
        mouse.y += (mouse.targetY - mouse.y) * 0.15;
      }
    } else if (mouse.x !== -9999) {
      mouse.x += (-9999 - mouse.x) * 0.1;
      mouse.y += (-9999 - mouse.y) * 0.1;
      if (Math.abs(mouse.x + 9999) < 1) {
        mouse.x = -9999;
        mouse.y = -9999;
      }
    }

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const phase = col * 0.15 + row * 0.15 - time;
        const wave = Math.sin(phase);
        let x = col * dotSpacing + Math.cos(phase) * 3;
        let y = row * dotSpacing + wave * 6;
        let radius = 2;
        let opacity = 0.14 + (wave + 1) * 0.05;

        if (mouse.x !== -9999) {
          const deltaX = x - mouse.x;
          const deltaY = y - mouse.y;
          const distance = Math.hypot(deltaX, deltaY);
          const interactionRadius = 150;

          if (distance < interactionRadius) {
            const force = (interactionRadius - distance) / interactionRadius;
            const angle = Math.atan2(deltaY, deltaX);
            const pushDistance = force * 24;
            x += Math.cos(angle) * pushDistance;
            y += Math.sin(angle) * pushDistance;
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

  function animate(now) {
    animationFrameId = requestAnimationFrame(animate);
    const frameInterval = 1000 / 30;
    const delta = now - lastFrameTime;

    if (delta > frameInterval) {
      lastFrameTime = now - (delta % frameInterval);
      draw();
    }
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    draw();
  } else {
    animationFrameId = requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    cols = Math.floor(width / dotSpacing) + 1;
    rows = Math.floor(height / dotSpacing) + 1;

    if (!animationFrameId) draw();
  });
}

// Spawns a target at a random percentage location on the back wall
function spawnTarget() {
  if (!isPlaying) return;
  isTargetResolving = false;

  const activeLessonData = lessons[currentLesson];
  const chars = activeLessonData.chars;

  // Pick random char from selected lesson
  activeTargetChar = chars[Math.floor(Math.random() * chars.length)];

  // Choose a random coordinate percentage (leaving margins from sides/desk)
  targetPctX = 15 + Math.random() * 70; // 15% to 85%
  targetPctY = 20 + Math.random() * 50; // 20% to 70%

  // Update target element positions
  const targetContainer = document.getElementById('targetContainer');
  targetContainer.style.left = `${targetPctX}%`;
  targetContainer.style.top = `${targetPctY}%`;

  // Update target bullseye badge char
  document.getElementById('targetChar').textContent = activeTargetChar === ';' ? ';' : activeTargetChar;

  // Display target with entry animation
  const laserTarget = document.getElementById('laserTarget');
  laserTarget.classList.remove('target-hit', 'target-error');
  
  // Clear any impact style properties from the active target
  laserTarget.style.removeProperty('--impact-x');
  laserTarget.style.removeProperty('--impact-y');
  laserTarget.style.removeProperty('--hole-rx');
  laserTarget.style.removeProperty('--hole-ry');
  laserTarget.style.removeProperty('--impact-size');
  laserTarget.style.removeProperty('--impact-angle');
  laserTarget.style.removeProperty('--impact-shape');

  // force reflow
  void laserTarget.offsetWidth;

  // Let the moving target settle, then visibly track it with the cannon.
  if (targetAimTimeout) clearTimeout(targetAimTimeout);
  targetAimTimeout = setTimeout(() => aimCannon(false), 360);
  
  // Charge chime sound
  sounds.playCharge();

  // Update tablet screen
  document.getElementById('tabCoords').textContent = activeTargetChar === ';' ? 'Semi' : activeTargetChar;
  document.getElementById('tabStatus').textContent = 'READY';
  document.getElementById('tabStatus').className = 'tablet-value text-green';
  document.getElementById('tabChargeFill').style.width = '100%';
}

// Aim from the cannon's real screen-space pivot to the target's real center.
// The barrel is a top-down 2D silhouette, so this angle also matches the beam.
function aimCannon(instant = false, impactPoint = null) {
  const target = document.getElementById('laserTarget');
  const gunTurret = document.getElementById('gunTurret');
  const yoke = gunTurret?.querySelector('.cannon-yoke');
  const barrelGroup = gunTurret?.querySelector('.cannon-barrel-group');
  if (!target || !yoke || !barrelGroup) return;

  const targetRect = target.getBoundingClientRect();
  const yokeRect = yoke.getBoundingClientRect();
  const pivotX = yokeRect.left + yokeRect.width / 2;
  const pivotY = yokeRect.top + yokeRect.height / 2;
  const targetX = targetRect.left + targetRect.width * (impactPoint?.x ?? 0.5);
  const targetY = targetRect.top + targetRect.height * (impactPoint?.y ?? 0.5);

  const dx = targetX - pivotX;
  const dy = targetY - pivotY;

  // Compute depth (Z distance) relative to screen stage width
  const stage = document.getElementById('missionStage');
  const stageRect = stage.getBoundingClientRect();
  const stageWidth = stageRect.width;
  const dz = stageWidth * 0.65; // depth calibrated for 3D range perspective

  // Altazimuth angles
  const yaw = -Math.atan2(dx, dz) * 180 / Math.PI;
  const slantRange = Math.sqrt(dx * dx + dz * dz);
  const pitch = Math.atan2(slantRange, Math.abs(dy)) * 180 / Math.PI;

  yoke.style.transition = instant
    ? 'none'
    : 'transform 0.18s cubic-bezier(0.25, 0.8, 0.25, 1)';
  barrelGroup.style.transition = instant
    ? 'none'
    : 'transform 0.18s cubic-bezier(0.25, 0.8, 0.25, 1)';

  gunTurret.style.setProperty('--yaw', `${yaw}deg`);
  gunTurret.style.setProperty('--pitch', `${pitch}deg`);

  if (instant) {
    // Ensure the muzzle geometry is measured after the rotation is applied.
    void yoke.offsetWidth;
    void barrelGroup.offsetWidth;
    requestAnimationFrame(() => {
      yoke.style.transition = 'transform 0.18s cubic-bezier(0.25, 0.8, 0.25, 1)';
      barrelGroup.style.transition = 'transform 0.18s cubic-bezier(0.25, 0.8, 0.25, 1)';
    });
  }
}

function createImpactVariation(target) {
  const x = 44 + Math.random() * 12;
  const y = 43 + Math.random() * 14;
  const radiusX = 18 + Math.random() * 8;
  const radiusY = 16 + Math.random() * 9;
  const size = 94 + Math.random() * 34;
  const angle = -38 + Math.random() * 76;
  const pointCount = 10 + Math.floor(Math.random() * 3);
  const shapePoints = [];

  for (let i = 0; i < pointCount; i++) {
    const pointAngle = -Math.PI / 2 + (i / pointCount) * Math.PI * 2;
    const radius = 33 + Math.random() * 12;
    const pointX = 50 + Math.cos(pointAngle) * radius;
    const pointY = 50 + Math.sin(pointAngle) * radius;
    shapePoints.push(`${pointX.toFixed(1)}% ${pointY.toFixed(1)}%`);
  }

  target.style.setProperty('--impact-x', `${x.toFixed(2)}%`);
  target.style.setProperty('--impact-y', `${y.toFixed(2)}%`);
  target.style.setProperty('--hole-rx', `${radiusX.toFixed(1)}px`);
  target.style.setProperty('--hole-ry', `${radiusY.toFixed(1)}px`);
  target.style.setProperty('--impact-size', `${size.toFixed(1)}px`);
  target.style.setProperty('--impact-angle', `${angle.toFixed(1)}deg`);
  target.style.setProperty('--impact-shape', `polygon(${shapePoints.join(', ')})`);

  return { x: x / 100, y: y / 100 };
}

function resetCannonAim() {
  const gunTurret = document.getElementById('gunTurret');
  const yoke = gunTurret?.querySelector('.cannon-yoke');
  const barrelGroup = gunTurret?.querySelector('.cannon-barrel-group');
  if (!gunTurret || !yoke || !barrelGroup) return;
  yoke.style.transition = 'none';
  barrelGroup.style.transition = 'none';
  gunTurret.style.setProperty('--yaw', '0deg');
  gunTurret.style.setProperty('--pitch', '0deg');
  void yoke.offsetWidth;
  void barrelGroup.offsetWidth;
  yoke.style.transition = 'transform 0.18s cubic-bezier(0.25, 0.8, 0.25, 1)';
  barrelGroup.style.transition = 'transform 0.18s cubic-bezier(0.25, 0.8, 0.25, 1)';
}

// Fires the laser turret and hits the target
function fireAndHit() {
  if (isTargetResolving) return;
  isTargetResolving = true;

  sounds.playShot();
  sounds.playHit();

  const target = document.getElementById('laserTarget');
  const impactPoint = createImpactVariation(target);

  // Snap to this shot's randomized impact point before measuring the muzzle.
  if (targetAimTimeout) clearTimeout(targetAimTimeout);
  aimCannon(true, impactPoint);

  // Show muzzle flash
  const flash = document.getElementById('muzzleFlash');
  flash.classList.remove('flash-active');
  void flash.offsetWidth; // trigger reflow
  flash.classList.add('flash-active');

  // Draw laser beam in screen space
  const stage = document.getElementById('missionStage');
  const muzzle = document.getElementById('turretMuzzle');
  const beam = document.getElementById('laserBeam');

  const stageRect = stage.getBoundingClientRect();
  const muzzleRect = muzzle.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  // Center points relative to stage
  const x1 = muzzleRect.left + muzzleRect.width / 2 - stageRect.left;
  const y1 = muzzleRect.top + muzzleRect.height / 2 - stageRect.top;
  const x2 = targetRect.left + targetRect.width * impactPoint.x - stageRect.left;
  const y2 = targetRect.top + targetRect.height * impactPoint.y - stageRect.top;

  // Calculate length and rotation
  const length = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
  const angle = Math.atan2(y2 - y1, x2 - x1);

  beam.style.left = `${x1}px`;
  beam.style.top = `${y1}px`;
  beam.style.width = `${length}px`;
  beam.style.transform = `rotate(${angle}rad)`;

  beam.classList.remove('firing');
  void beam.offsetWidth;
  beam.classList.add('firing');

  // Trigger camera recoil shake
  stage.classList.remove('shake');
  void stage.offsetWidth;
  stage.classList.add('shake');

  // Create wreckage clone at the old target position to play the rupture animation
  const targetContainer = document.getElementById('targetContainer');
  const wreckage = targetContainer.cloneNode(true);
  wreckage.removeAttribute('id');

  // Freeze the wreckage clone at the exact current position of the target
  const computedStyle = window.getComputedStyle(targetContainer);
  wreckage.style.left = computedStyle.left;
  wreckage.style.top = computedStyle.top;
  wreckage.style.transition = 'none';

  const wreckageTarget = wreckage.querySelector('.laser-target');
  if (wreckageTarget) {
    wreckageTarget.removeAttribute('id');
    wreckageTarget.classList.add('target-hit');
  }

  targetContainer.parentNode.appendChild(wreckage);

  // Clean up wreckage after its animation completes (720ms)
  setTimeout(() => {
    wreckage.remove();
  }, 750);

  setTimeout(() => createDebrisExplosion(x2, y2), 315);

  // Update Game Stats
  correctKeysPressed++;
  score += 100 + (combo * 15);
  combo++;
  if (combo > maxCombo) maxCombo = combo;

  updateHud();

  // Update Tablet status
  document.getElementById('tabStatus').textContent = 'FIRE';
  document.getElementById('tabStatus').className = 'tablet-value text-green';
  document.getElementById('tabChargeFill').style.width = '20%';

  // Spawn next target immediately
  spawnTarget();

  // Clean up screen shake after a delay
  setTimeout(() => {
    stage.classList.remove('shake');
  }, 760);
}

// Spawns board fragments, molten droplets, and a small smoke bloom.
function createDebrisExplosion(x, y) {
  const overlay = document.getElementById('effectsOverlay');
  const count = 9;
  const shardColors = ['#eeeeea', '#c9cbc8', '#44484b', '#ff9a32'];

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'explosion-debris';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 72;
    el.style.setProperty('--debris-x', `${Math.cos(angle) * distance}px`);
    el.style.setProperty('--debris-y', `${Math.sin(angle) * distance + 22}px`);
    el.style.setProperty('--debris-rot', `${-150 + Math.random() * 300}deg`);
    el.style.setProperty('--shard-w', `${5 + Math.random() * 10}px`);
    el.style.setProperty('--shard-h', `${4 + Math.random() * 7}px`);
    el.style.setProperty('--shard-color', shardColors[i % shardColors.length]);
    overlay.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  for (let i = 0; i < 14; i++) {
    const droplet = document.createElement('div');
    droplet.className = 'molten-particle';
    droplet.style.left = `${x}px`;
    droplet.style.top = `${y}px`;

    const angle = Math.random() * Math.PI * 2;
    const distance = 28 + Math.random() * 82;
    droplet.style.setProperty('--debris-x', `${Math.cos(angle) * distance}px`);
    droplet.style.setProperty('--debris-y', `${Math.sin(angle) * distance + 38}px`);
    droplet.style.setProperty('--debris-rot', `${-90 + Math.random() * 180}deg`);
    droplet.style.setProperty('--molten-size', `${6 + Math.random() * 6}px`);
    droplet.style.animationDelay = `${Math.random() * 0.08}s`;

    overlay.appendChild(droplet);
    droplet.addEventListener('animationend', () => droplet.remove(), { once: true });
  }

  for (let i = 0; i < 6; i++) {
    const smoke = document.createElement('div');
    smoke.className = 'smoke-particle';
    smoke.style.left = `${x + (Math.random() - 0.5) * 24}px`;
    smoke.style.top = `${y + (Math.random() - 0.5) * 18}px`;
    smoke.style.setProperty('--smoke-x', `${(Math.random() - 0.5) * 75}px`);
    smoke.style.setProperty('--smoke-y', `${-45 - Math.random() * 65}px`);
    smoke.style.setProperty('--smoke-size', `${24 + Math.random() * 24}px`);
    smoke.style.animationDelay = `${Math.random() * 0.12}s`;

    overlay.appendChild(smoke);
    smoke.addEventListener('animationend', () => smoke.remove(), { once: true });
  }
}

// Play typo feedback, reset combo, apply target visual error shake
function registerTypo() {
  sounds.playMiss();
  combo = 0;

  const laserTarget = document.getElementById('laserTarget');
  laserTarget.classList.remove('target-error');
  void laserTarget.offsetWidth;
  laserTarget.classList.add('target-error');

  updateHud();
}

// Calculate and refresh UI readouts
function updateHud() {
  document.getElementById('hudScore').textContent = String(score).padStart(4, '0');
  document.getElementById('hudCombo').textContent = `x${combo}`;

  const accuracy = totalKeysPressed > 0 ? Math.round((correctKeysPressed / totalKeysPressed) * 100) : 100;
  document.getElementById('hudAccuracy').textContent = `${accuracy}%`;

  // Combo HUD Monitor text
  const streakBanner = document.getElementById('hudStreak');
  if (combo >= 25) {
    streakBanner.textContent = 'GODLIKE STREAK!';
    streakBanner.style.color = '#ff3b30';
    streakBanner.style.borderColor = 'rgba(255, 59, 48, 0.4)';
    streakBanner.style.background = 'rgba(255, 59, 48, 0.15)';
  } else if (combo >= 15) {
    streakBanner.textContent = 'UNSTOPPABLE!';
    streakBanner.style.color = '#e48e35';
    streakBanner.style.borderColor = 'rgba(228, 142, 53, 0.4)';
    streakBanner.style.background = 'rgba(228, 142, 53, 0.15)';
  } else if (combo >= 8) {
    streakBanner.textContent = 'KILLER STREAK!';
    streakBanner.style.color = '#9ad744';
    streakBanner.style.borderColor = 'rgba(154, 215, 68, 0.4)';
    streakBanner.style.background = 'rgba(154, 215, 68, 0.15)';
  } else if (combo >= 3) {
    streakBanner.textContent = 'GOOD STREAK';
    streakBanner.style.color = '#9ad744';
    streakBanner.style.borderColor = 'rgba(154, 215, 68, 0.2)';
    streakBanner.style.background = 'rgba(154, 215, 68, 0.08)';
  } else {
    streakBanner.textContent = 'COMBO INACTIEF';
    streakBanner.style.color = 'var(--theme-green)';
    streakBanner.style.borderColor = 'rgba(154, 215, 68, 0.2)';
    streakBanner.style.background = 'rgba(154, 215, 68, 0.1)';
  }
}

// Tick timer and compute characters-per-minute (CPM) speed
function startTimerTick() {
  startTime = Date.now();
  if (gameTimerInterval) clearInterval(gameTimerInterval);

  gameTimerInterval = setInterval(() => {
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    document.getElementById('hudTime').textContent = `${elapsedSeconds.toFixed(1)}s`;

    // CPM calculation
    if (elapsedSeconds > 1) {
      const cpmValue = Math.round((correctKeysPressed / elapsedSeconds) * 60);
      document.getElementById('hudCpm').textContent = String(cpmValue).padStart(3, '0');
    }
  }, 100);
}

function advanceBriefingSlide() {
  if (isPlaying) return;

  const briefing = document.getElementById('briefingOverlay');
  if (!briefing || briefing.style.display === 'none') return;

  const spacebarButton = document.getElementById('spacebarAdvanceBtn');
  spacebarButton.classList.add('pressed');
  setTimeout(() => spacebarButton.classList.remove('pressed'), 100);

  if (activeBriefingSlide < totalBriefingSlides - 1) {
    activeBriefingSlide++;
    briefing.querySelectorAll('.briefing-slide').forEach((slide, index) => {
      slide.classList.toggle('active', index === activeBriefingSlide);
    });
    briefing.querySelectorAll('.briefing-pagination .dot').forEach((dot, index) => {
      dot.classList.toggle('active', index === activeBriefingSlide);
    });

    if (activeBriefingSlide === totalBriefingSlides - 1) {
      briefing.querySelector('.spacebar-instruction').textContent = 'Druk op de spatiebalk om de missie te starten!';
    }
    return;
  }

  startMission();
}

// Main launch sequence
function startMission() {
  sounds.init();
  isPlaying = true;
  resultsAwaiting = false;
  score = 0;
  combo = 0;
  maxCombo = 0;
  totalKeysPressed = 0;
  correctKeysPressed = 0;
  isTargetResolving = false;

  // UI state swap
  document.getElementById('briefingOverlay').style.display = 'none';
  document.getElementById('briefingOverlay').setAttribute('aria-hidden', 'true');
  document.getElementById('resultsOverlay').style.display = 'none';
  document.getElementById('resultsOverlay').setAttribute('aria-hidden', 'true');
  document.getElementById('missionCompletePrompt').hidden = true;

  if (targetAimTimeout) clearTimeout(targetAimTimeout);
  resetCannonAim();
  updateHud();
  startTimerTick();
  spawnTarget();
}

// End sequence and show briefing metrics
function finishMission() {
  isPlaying = false;
  if (gameTimerInterval) clearInterval(gameTimerInterval);
  if (targetAimTimeout) clearTimeout(targetAimTimeout);

  const accuracy = totalKeysPressed > 0 ? Math.round((correctKeysPressed / totalKeysPressed) * 100) : 100;
  const elapsedSeconds = (Date.now() - startTime) / 1000;
  const cpmValue = elapsedSeconds > 0 ? Math.round((correctKeysPressed / elapsedSeconds) * 60) : 0;
  const rank = maxCombo >= 15 ? 'AGENT ELITE' : maxCombo >= 8 ? 'VELDAGENT' : 'AGENT';

  document.getElementById('resScore').textContent = String(score).padStart(4, '0');
  document.getElementById('resAccuracy').textContent = `${accuracy}%`;
  document.getElementById('resMaxCombo').textContent = maxCombo;
  document.getElementById('resCpm').textContent = cpmValue;
  document.getElementById('resHits').textContent = correctKeysPressed;
  document.getElementById('resultsRank').textContent = rank;

  resultsAwaiting = true;
  document.getElementById('missionCompletePrompt').hidden = false;
}

function showResultsReport() {
  if (!resultsAwaiting) return;

  resultsAwaiting = false;
  document.getElementById('missionCompletePrompt').hidden = true;
  document.getElementById('resultsOverlay').style.display = 'flex';
  document.getElementById('resultsOverlay').setAttribute('aria-hidden', 'false');
}

// Key events routing
window.addEventListener('keydown', (e) => {
  if (!isPlaying || isTargetResolving) return;

  // Ignore system commands
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  let keyStr = e.key.toUpperCase();

  // Map Semicolon key specifically
  if (e.key === ';') {
    keyStr = ';';
  }

  // Validate character length to filter modifier keys
  if (keyStr.length !== 1) return;

  totalKeysPressed++;

  // Match target directly (Single key mechanic)
  if (keyStr === activeTargetChar) {
    fireAndHit();
  } else {
    registerTypo();
  }
});

// Setup dropdown selectors
function setupLessonDropdown() {
  const dropdown = document.getElementById('lessonDropdown');
  const header = document.getElementById('lessonDropdownHeader');
  const items = dropdown.querySelectorAll('.dropdown-list li');
  const display = document.getElementById('currentLessonDisplay');

  header.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('active');
  });

  items.forEach(item => {
    item.addEventListener('click', (e) => {
      items.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      currentLesson = item.getAttribute('data-val');
      
      const lessonName = lessons[currentLesson].name;
      display.textContent = lessonName;
      dropdown.classList.remove('active');

      if (isPlaying) {
        startMission();
      }
    });
  });

  window.addEventListener('click', () => {
    dropdown.classList.remove('active');
  });
}

// Wire buttons
document.getElementById('spacebarAdvanceBtn').addEventListener('click', advanceBriefingSlide);
document.getElementById('viewResultsBtn').addEventListener('click', showResultsReport);

window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || isPlaying) return;

  if (resultsAwaiting) {
    event.preventDefault();
    const viewResultsButton = document.getElementById('viewResultsBtn');
    viewResultsButton.classList.add('pressed');
    setTimeout(() => viewResultsButton.classList.remove('pressed'), 100);
    showResultsReport();
    return;
  }

  const results = document.getElementById('resultsOverlay');
  if (results?.getAttribute('aria-hidden') === 'false') {
    event.preventDefault();
    startMission();
    return;
  }

  const briefing = document.getElementById('briefingOverlay');
  if (briefing && briefing.style.display !== 'none') {
    event.preventDefault();
    advanceBriefingSlide();
  }
});

document.getElementById('restartMissionBtn').addEventListener('click', () => {
  startMission();
});

// Initialization
setupMatrix();
setupLessonDropdown();
resetCannonAim();
