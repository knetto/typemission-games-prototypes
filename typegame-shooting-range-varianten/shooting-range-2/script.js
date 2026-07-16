/* ==========================================================================
   REACTION TYPING SHOOTING RANGE — GAME LOGIC
   ========================================================================== */

// Lane configuration matching difficulty and gameplay math
const laneConfigs = {
  1: {
    name: "Lane 1: Easy",
    allowedKeys: ['A'],
    baseLaserSpeed: 1.0,
    speedIncreasePerShot: 0.08,
    jitterAmount: 0,
    movementType: "horizontal",
    rangeX: 62,
    rangeY: 0
  },
  2: {
    name: "Lane 2: Medium",
    allowedKeys: ['A', 'F'],
    baseLaserSpeed: 1.5,
    speedIncreasePerShot: 0.10,
    jitterAmount: 0,
    movementType: "vertical",
    rangeX: 0,
    rangeY: 62
  },
  3: {
    name: "Lane 3: Hard",
    allowedKeys: ['A', 'F', 'J', 'K'],
    baseLaserSpeed: 1.75,
    speedIncreasePerShot: 0.10,
    jitterAmount: 0.5,
    movementType: "diagonal",
    rangeX: 60,
    rangeY: 46
  },
  4: {
    name: "Lane 4: Expert",
    allowedKeys: ['A', 'F', 'J', 'K', 'D', 'S', 'L'],
    baseLaserSpeed: 2.15,
    speedIncreasePerShot: 0.12,
    jitterAmount: 0,
    movementType: "randomWaypoints",
    rangeX: 65,
    rangeY: 65,
    waypointDurationMin: 900,
    waypointDurationMax: 1250,
    centerEvery: 3
  }
};

// Lane 4 travels across the complete firing area, including positions beyond
// the paper. Every few legs still passes the bullseye so center shots stay viable.
function createLane4Waypoint(nearCenter = false) {
  if (nearCenter) {
    return {
      x: 50 + (Math.random() - 0.5) * 4,
      y: 50 + (Math.random() - 0.5) * 4
    };
  }

  const angle = Math.random() * Math.PI * 2;
  const radius = 20 + Math.sqrt(Math.random()) * 45;
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius
  };
}

function createLane4Motion(fromX = 50, fromY = 50, leg = 0, now = performance.now()) {
  const config = laneConfigs[4];
  const nextLeg = leg + 1;
  const start = { x: fromX, y: fromY };
  return {
    // Four control points let Catmull-Rom continue through each waypoint
    // without easing to zero or producing a visible pause.
    p0: start,
    p1: start,
    p2: createLane4Waypoint(nextLeg % config.centerEvery === 0),
    p3: createLane4Waypoint((nextLeg + 1) % config.centerEvery === 0),
    leg: nextLeg,
    startedAt: now,
    duration: config.waypointDurationMin
      + Math.random() * (config.waypointDurationMax - config.waypointDurationMin)
  };
}

function sampleLane4Motion(motion, now, speedScale = 1) {
  const config = laneConfigs[4];
  let scaledDuration = motion.duration / speedScale;

  // Shift the spline forward while preserving its tangent at every join.
  while (now - motion.startedAt >= scaledDuration) {
    motion.startedAt += scaledDuration;
    motion.p0 = motion.p1;
    motion.p1 = motion.p2;
    motion.p2 = motion.p3;
    motion.leg += 1;
    motion.p3 = createLane4Waypoint((motion.leg + 1) % config.centerEvery === 0);
    motion.duration = config.waypointDurationMin
      + Math.random() * (config.waypointDurationMax - config.waypointDurationMin);
    scaledDuration = motion.duration / speedScale;
  }

  const t = Math.min(1, (now - motion.startedAt) / scaledDuration);
  const t2 = t * t;
  const t3 = t2 * t;
  const interpolate = (a, b, c, d) => 0.5 * (
    (2 * b)
    + (-a + c) * t
    + (2 * a - 5 * b + 4 * c - d) * t2
    + (-a + 3 * b - 3 * c + d) * t3
  );

  return {
    x: interpolate(motion.p0.x, motion.p1.x, motion.p2.x, motion.p3.x),
    y: interpolate(motion.p0.y, motion.p1.y, motion.p2.y, motion.p3.y)
  };
}

// Game state variables
let gameState = "briefing"; // briefing, lobby, transitioning, playing, results
let activeLaneId = null;
let currentShot = 1;
const maxShots = 10;
let score = 0;
let combo = 0;
let maxCombo = 0;
let totalKeysPressed = 0;
let correctKeysPressed = 0;
let perfectHits = 0;

// Laser positioning variables
let laserX = 50; // percentage inside target
let laserY = 50; // percentage inside target
let laserAnimationId = null;
let lobbyPreviewAnimationId = null;
let currentKeyPrompt = "";
let isShotResolving = false;
let startTime = null;
let activeBriefingSlide = 0;
const totalBriefingSlides = 3;

// Audio Synthesizer Class using Web Audio API
class SoundManager {
  constructor() {
    this.ctx = null;
    this.laserHumNode = null;
    this.laserHumGain = null;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  startHum() {
    this.init();
    if (!this.ctx) return;
    try {
      this.stopHum();
      
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, this.ctx.currentTime); // Low hum
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(110, this.ctx.currentTime);

      gainNode.gain.setValueAtTime(0.06, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start();
      
      this.laserHumNode = osc;
      this.laserHumGain = gainNode;
    } catch (e) {
      console.warn("Failed to start hum sound", e);
    }
  }

  updateHumPitch(speedRatio) {
    if (!this.laserHumNode || !this.ctx) return;
    // Map speed ratio to subtle pitch escalation
    const freq = 65 + (speedRatio * 15);
    this.laserHumNode.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
  }

  stopHum() {
    if (this.laserHumNode) {
      try {
        this.laserHumNode.stop();
      } catch (e) {}
      this.laserHumNode = null;
    }
    this.laserHumGain = null;
  }

  playShot() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  playChime(pitch, isPerfect = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Clear ringing chime
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    
    gain.gain.setValueAtTime(isPerfect ? 0.20 : 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.36);

    // If perfect, add a brief higher octave harmony
    if (isPerfect) {
      const harm = this.ctx.createOscillator();
      const harmGain = this.ctx.createGain();
      
      harm.type = 'sine';
      harm.frequency.setValueAtTime(pitch * 2, now);
      harmGain.gain.setValueAtTime(0.08, now);
      harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      harm.connect(harmGain);
      harmGain.connect(this.ctx.destination);
      
      harm.start(now);
      harm.stop(now + 0.26);
    }
  }

  playHitSound(ring) {
    this.init();
    if (!this.ctx) return;
    
    // Play laser zap
    this.playShot();

    // Map ring to chime frequencies
    if (ring === 10) {
      this.playChime(987.77, true); // B5 (Bright/High)
    } else if (ring === 9) {
      this.playChime(783.99, false); // G5 (Great)
    } else if (ring === 8) {
      this.playChime(659.25, false); // E5 (Good)
    } else if (ring === 7) {
      this.playChime(523.25, false); // C5 (Duller)
    }
  }

  playMissSound() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(130, now);
    osc1.frequency.linearRampToValueAtTime(80, now + 0.2);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(145, now);
    osc2.frequency.linearRampToValueAtTime(90, now + 0.2);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.2);
    osc2.stop(now + 0.2);
  }

  playMilestone() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // Ascending C Major chord
    
    notes.forEach((pitch, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now + i * 0.08);
      
      gain.gain.setValueAtTime(0.08, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.26);
    });
  }
}

const sounds = new SoundManager();

// Setup Matrix Rain Background
function setupMatrix() {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789;:-=+*';
  const fontSize = 14;
  let colsCount = Math.floor(canvas.width / fontSize) + 1;
  const drops = Array(colsCount).fill(1);
  
  function draw() {
    ctx.fillStyle = 'rgba(5, 2, 7, 0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(189, 0, 255, 0.1)'; // Purple matrix flow for reaction range
    ctx.font = fontSize + 'px monospace';
    
    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);
      
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }
  setInterval(draw, 35);
}

// 3D Lobby Mode Initialization
function setupLobby() {
  const lanes = document.querySelectorAll('.lane');
  lanes.forEach(lane => {
    // The whole architectural bay is selectable, not only the target or sign.
    lane.addEventListener('click', () => {
      if (gameState !== "lobby") return;
      const laneId = parseInt(lane.getAttribute('data-lane-id'), 10);
      selectLane(laneId);
    });

    lane.addEventListener('keydown', (event) => {
      if (gameState !== "lobby" || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      const laneId = parseInt(lane.getAttribute('data-lane-id'), 10);
      selectLane(laneId);
    });

    // Symmetrical gun hover aim
    lane.addEventListener('mouseenter', () => {
      if (gameState === "lobby") {
        const laneId = parseInt(lane.getAttribute('data-lane-id'), 10);
        aimRangeCannon(laneId);
      }
    });

    lane.addEventListener('mouseleave', () => {
      if (gameState === "lobby") {
        aimRangeCannon(null);
      }
    });
  });
  
  // Set lobby class
  document.getElementById('rangeEnv').classList.add('lobby-active');
  gameState = "briefing";

  // Start continuous lobby preview animations
  startLobbyPreviews();
}

// Continuous Lobby Target Movement Preview Dot Animation
function startLobbyPreviews() {
  if (lobbyPreviewAnimationId) cancelAnimationFrame(lobbyPreviewAnimationId);

  const previewDots = {
    1: document.querySelector('#lane-1 .laser-dot-preview'),
    2: document.querySelector('#lane-2 .laser-dot-preview'),
    3: document.querySelector('#lane-3 .laser-dot-preview'),
    4: document.querySelector('#lane-4 .laser-dot-preview')
  };

  const startTime = Date.now();
  const lane4PreviewMotion = createLane4Motion(50, 50);

  function update() {
    if (gameState !== "lobby" && gameState !== "briefing") {
      for (let id in previewDots) {
        if (previewDots[id]) previewDots[id].style.display = 'none';
      }
      return;
    }

    const t = (Date.now() - startTime) / 1000;

    // Lane 1: Horizontal (speed 1.0, rangeX 38)
    if (previewDots[1]) {
      const x = 50 + Math.sin(t * 1.0 * Math.PI) * 38;
      previewDots[1].style.left = `${x}%`;
      previewDots[1].style.top = `50%`;
      previewDots[1].style.display = 'block';
    }

    // Lane 2: Vertical, like lane 1 rotated 90 degrees
    if (previewDots[2]) {
      const y = 50 + Math.sin(t * 1.5 * Math.PI) * 38;
      previewDots[2].style.left = `50%`;
      previewDots[2].style.top = `${y}%`;
      previewDots[2].style.display = 'block';
    }

    // Lane 3: The former lane 2 diagonal movement, slightly slowed down
    if (previewDots[3]) {
      const x = 50 + Math.sin(t * 1.75 * Math.PI) * 38;
      const y = 50 + Math.cos(t * 1.75 * 0.7 * Math.PI) * 25;
      previewDots[3].style.left = `${x}%`;
      previewDots[3].style.top = `${y}%`;
      previewDots[3].style.display = 'block';
    }

    // Lane 4: slow, smooth random route with regular bullseye passages
    if (previewDots[4]) {
      const point = sampleLane4Motion(
        lane4PreviewMotion,
        performance.now(),
        laneConfigs[4].baseLaserSpeed
      );
      previewDots[4].style.left = `${point.x}%`;
      previewDots[4].style.top = `${point.y}%`;
      previewDots[4].style.display = 'block';
    }

    lobbyPreviewAnimationId = requestAnimationFrame(update);
  }

  lobbyPreviewAnimationId = requestAnimationFrame(update);
}

// Aim the cannon turret dynamically at specific coordinates on any lane target.
function aimCannonAtTarget(laneId, pctX, pctY, instant = false) {
  const laneEl = document.getElementById(`lane-${laneId}`);
  if (!laneEl) return;
  const target = laneEl.querySelector('.laser-target');
  const gunTurret = document.getElementById('gunTurret');
  const yoke = gunTurret?.querySelector('.cannon-yoke');
  const barrelGroup = gunTurret?.querySelector('.cannon-barrel-group');
  if (!target || !yoke || !barrelGroup) return;

  const targetRect = target.getBoundingClientRect();
  const yokeRect = yoke.getBoundingClientRect();
  
  // Pivot point center of turret in screen coordinates
  const pivotX = yokeRect.left + yokeRect.width / 2;
  const pivotY = yokeRect.top + yokeRect.height / 2;
  
  // Hit coords on target in screen space
  const targetX = targetRect.left + targetRect.width * pctX;
  const targetY = targetRect.top + targetRect.height * pctY;

  const dx = targetX - pivotX;
  const dy = targetY - pivotY;

  const stage = document.getElementById('missionStage');
  const stageRect = stage.getBoundingClientRect();
  const stageWidth = stageRect.width;
  const dz = stageWidth * 0.65; // depth calibrated for 3D range perspective

  // Calculate altazimuth angles (yaw direction corrected to follow left/right correctly)
  const yaw = -Math.atan2(dx, dz) * 180 / Math.PI;
  const slantRange = Math.sqrt(dx * dx + dz * dz);
  const rawPitch = Math.atan2(slantRange, Math.abs(dy)) * 180 / Math.PI;
  // Near-90deg pitch makes the barrel's thin 3D side faces project as a huge
  // rectangular outline. The physical mount cannot tilt that far anyway.
  const pitch = Math.max(48, Math.min(70, rawPitch));

  yoke.style.transition = instant ? 'none' : 'transform 0.05s linear';
  barrelGroup.style.transition = instant ? 'none' : 'transform 0.05s linear';

  gunTurret.style.setProperty('--yaw', `${yaw}deg`);
  gunTurret.style.setProperty('--pitch', `${pitch}deg`);
}

function aimCannonAtLaserDot(pctX, pctY, instant = false) {
  if (!activeLaneId) return;
  aimCannonAtTarget(activeLaneId, pctX, pctY, instant);
}

// Generate organic random target damage and hole geometries
function createImpactVariation(targetEl, pctX, pctY) {
  const radiusX = 10 + Math.random() * 4;
  const radiusY = 9 + Math.random() * 5;
  const size = 52 + Math.random() * 16;
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

  const borderContainer = targetEl.querySelector('.hole-borders-container');
  const centerContainer = targetEl.querySelector('.hole-centers-container');

  if (borderContainer && centerContainer) {
    // 1. Create and add the border shape (glowing orange border)
    const border = document.createElement('div');
    border.className = 'impact-border';
    border.style.left = `${pctX}%`;
    border.style.top = `${pctY}%`;
    border.style.width = `${size}px`;
    border.style.height = `${size}px`;
    border.style.setProperty('--hole-rx', `${radiusX.toFixed(1)}px`);
    border.style.setProperty('--hole-ry', `${radiusY.toFixed(1)}px`);
    border.style.setProperty('--impact-angle', `${angle.toFixed(1)}deg`);
    border.style.setProperty('--impact-shape', `polygon(${shapePoints.join(', ')})`);
    border.style.transform = `translate(-50%, -50%) rotate(${angle.toFixed(1)}deg)`;
    borderContainer.appendChild(border);

    // 2. Create and add the center shape (dark center masking on top of borders)
    const center = document.createElement('div');
    center.className = 'impact-center';
    center.style.left = `${pctX}%`;
    center.style.top = `${pctY}%`;
    center.style.width = `${size}px`;
    center.style.height = `${size}px`;
    center.style.setProperty('--hole-rx', `${radiusX.toFixed(1)}px`);
    center.style.setProperty('--hole-ry', `${radiusY.toFixed(1)}px`);
    center.style.setProperty('--impact-angle', `${angle.toFixed(1)}deg`);
    center.style.setProperty('--impact-shape', `polygon(${shapePoints.join(', ')})`);
    center.style.transform = `translate(-50%, -50%) rotate(${angle.toFixed(1)}deg)`;
    centerContainer.appendChild(center);
  }
}

// Fires the laser beam and ruptures the target board
function fireLaserBeamAndHole(pctX, pctY, ringHit) {
  sounds.playShot();
  if (ringHit > 0) {
    sounds.playHitSound(ringHit);
  } else {
    sounds.playMissSound();
  }

  const activeLaneEl = document.getElementById(`lane-${activeLaneId}`);
  const targetEl = activeLaneEl.querySelector('.laser-target');

  // A complete miss lands on the back wall and must not tear the paper.
  const boardDistance = Math.hypot(pctX - 50, pctY - 50);
  if (boardDistance <= 48) {
    createImpactVariation(targetEl, pctX, pctY);
  }

  // Only pulse the physical board when the projectile actually touches it.
  targetEl.classList.remove('target-pulse');
  if (boardDistance <= 48) {
    void targetEl.offsetWidth; // force reflow
    targetEl.classList.add('target-pulse');
  }

  // Snap turret aim to hit point
  aimCannonAtLaserDot(pctX / 100, pctY / 100, true);

  // Trigger muzzle flash visual
  fireRangeCannon();

  // Draw laser beam in screen space
  const stage = document.getElementById('missionStage');
  const muzzle = document.getElementById('turretMuzzle');
  const beam = document.getElementById('laserBeam');

  const stageRect = stage.getBoundingClientRect();
  const muzzleRect = muzzle.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  const x1 = muzzleRect.left + muzzleRect.width / 2 - stageRect.left;
  const y1 = muzzleRect.top + muzzleRect.height / 2 - stageRect.top;
  const x2 = targetRect.left + (pctX / 100) * targetRect.width - stageRect.left;
  const y2 = targetRect.top + (pctY / 100) * targetRect.height - stageRect.top;

  const length = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
  const angle = Math.atan2(y2 - y1, x2 - x1);

  beam.style.left = `${x1}px`;
  beam.style.top = `${y1}px`;
  beam.style.width = `${length}px`;
  beam.style.transform = `rotate(${angle}rad)`;

  beam.classList.remove('firing');
  void beam.offsetWidth; // force reflow
  beam.classList.add('firing');

  // Camera Shake
  stage.classList.remove('shake');
  void stage.offsetWidth;
  stage.classList.add('shake');
  setTimeout(() => stage.classList.remove('shake'), 200);

  // Spawn explosion particles
  setTimeout(() => createDebrisExplosion(x2, y2, ringHit), 150);
}

// Spawns debris and particles at the hit coordinate
function createDebrisExplosion(x, y, ringHit) {
  const overlay = document.getElementById('effectsOverlay');
  const count = ringHit === 10 ? 12 : ringHit >= 8 ? 8 : 4;
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

  const moltenCount = ringHit === 10 ? 16 : ringHit >= 8 ? 10 : 5;
  for (let i = 0; i < moltenCount; i++) {
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

  for (let i = 0; i < 4; i++) {
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

// Close the mission briefing and hand control to the lane selector.
function openLaneSelection() {
  const briefingOverlay = document.getElementById('briefingOverlay');
  briefingOverlay.style.display = "none";
  briefingOverlay.setAttribute('aria-hidden', 'true');
  document.getElementById('headerStatusText').textContent = "SELECT_LANE_1-4";
  gameState = "lobby";
}

function advanceBriefingSlide() {
  if (gameState !== "briefing") return;

  const briefing = document.getElementById('briefingOverlay');
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
      briefing.querySelector('.spacebar-instruction').textContent = 'Druk op de spatiebalk om de schietbaan te openen!';
    }
    return;
  }

  sounds.init();
  openLaneSelection();
}

// Keep the selected target centered at every viewport size without pushing the
// whole 3D room through the perspective camera.
function frameSelectedLane(laneId) {
  const stage = document.getElementById('missionStage');
  const rangeEnv = document.getElementById('rangeEnv');
  if (!stage || !rangeEnv || !laneConfigs[laneId]) return;

  const stageWidth = stage.clientWidth;
  const stageHeight = stage.clientHeight;
  if (!stageWidth || !stageHeight) return;

  const perspective = 1000;
  // Never drive the room planes through the perspective camera. The stable
  // gameplay tunnel handles the architecture while the target is enlarged.
  const cameraZ = 0;
  const targetDepth = 750;
  const projectedScale = perspective / (perspective + targetDepth - cameraZ);
  const desiredTargetSize = Math.min(380, stageWidth * 0.28, stageHeight * 0.38);
  const targetWorldSize = desiredTargetSize / projectedScale;

  // Keep this in sync with the responsive lane percentages in styles.css.
  const laneCenterRatios = { 1: 0.125, 2: 0.375, 3: 0.625, 4: 0.875 };
  const perspectiveOriginY = stageHeight * 0.4;
  const desiredCenterY = stageHeight * 0.38;
  const targetCenterY = 310;
  // The environment translation is projected by the same factor as its lane,
  // so the unscaled world-space center difference gives an exact screen center.
  const cameraX = (stageWidth * 0.5) - (stageWidth * laneCenterRatios[laneId]);
  const cameraY = perspectiveOriginY
    + ((desiredCenterY - perspectiveOriginY) / projectedScale)
    - targetCenterY;

  rangeEnv.style.setProperty('--camera-x', `${cameraX}px`);
  rangeEnv.style.setProperty('--camera-y', `${cameraY}px`);
  rangeEnv.style.setProperty('--camera-z', `${cameraZ}px`);
  rangeEnv.style.setProperty('--game-target-size', `${targetWorldSize}px`);
}

function aimRangeCannon(laneId = null) {
  const turret = document.getElementById('gunTurret');
  if (!turret) return;

  if (laneId) {
    // Wait one frame so the hovered target's forward animation has started,
    // then calculate its real screen position instead of using preset angles.
    requestAnimationFrame(() => aimCannonAtTarget(laneId, 0.5, 0.5));
    return;
  }

  const yoke = turret.querySelector('.cannon-yoke');
  const barrelGroup = turret.querySelector('.cannon-barrel-group');
  if (yoke) yoke.style.transition = 'transform 0.18s cubic-bezier(0.25, 0.8, 0.25, 1)';
  if (barrelGroup) barrelGroup.style.transition = 'transform 0.18s cubic-bezier(0.25, 0.8, 0.25, 1)';
  turret.style.setProperty('--yaw', '0deg');
  turret.style.setProperty('--pitch', '58deg');
}

function fireRangeCannon() {
  const flash = document.getElementById('muzzleFlash');
  if (!flash) return;
  flash.classList.remove('flash-active');
  void flash.offsetWidth;
  flash.classList.add('flash-active');
  setTimeout(() => flash.classList.remove('flash-active'), 180);
}

// Select Lane and Zoom Transition
function selectLane(laneId) {
  if (gameState !== "lobby") return;
  gameState = "transitioning";
  activeLaneId = laneId;
  const rangeWrapper = document.getElementById('rangeWrapper');
  rangeWrapper?.classList.add('gameplay-lane-active');
  if (rangeWrapper) rangeWrapper.dataset.lane = laneId;
  document.getElementById('gameplayTunnel')?.classList.add('active');

  // Stop lobby preview dots and hide them
  if (lobbyPreviewAnimationId) {
    cancelAnimationFrame(lobbyPreviewAnimationId);
    lobbyPreviewAnimationId = null;
  }
  const previewDots = document.querySelectorAll('.laser-dot-preview');
  previewDots.forEach(dot => {
    dot.style.display = 'none';
  });

  // Lock environment interactions
  const rangeEnv = document.getElementById('rangeEnv');
  rangeEnv.classList.remove('lobby-active');

  // Trigger camera zoom CSS transform class
  frameSelectedLane(laneId);
  aimRangeCannon(laneId);
  rangeEnv.classList.add(`zoom-lane-${laneId}`);

  // Fade out lobby briefing overlay
  const briefingOverlay = document.getElementById('briefingOverlay');
  briefingOverlay.style.transition = "opacity 0.6s ease";
  briefingOverlay.style.opacity = 0;

  // Sync status
  document.getElementById('headerStatusText').textContent = `ZOOMING_LANE_0${laneId}`;

  // Complete transition after CSS animation finishes (1.2s)
  setTimeout(() => {
    briefingOverlay.style.display = "none";
    briefingOverlay.style.opacity = 1;
    startPlaying();
  }, 1200);
}

// Start Gameplay Loop
function startPlaying() {
  gameState = "playing";
  currentShot = 1;
  score = 0;
  combo = 0;
  maxCombo = 0;
  totalKeysPressed = 0;
  correctKeysPressed = 0;
  perfectHits = 0;
  isShotResolving = false;
  frameSelectedLane(activeLaneId);
  document.getElementById('rangeEnv').classList.add('gameplay-active');
  
  // Clear all previous impact holes from target paper containers
  const targets = document.querySelectorAll('.laser-target');
  targets.forEach(target => {
    const borderCont = target.querySelector('.hole-borders-container');
    const centerCont = target.querySelector('.hole-centers-container');
    if (borderCont) borderCont.innerHTML = "";
    if (centerCont) centerCont.innerHTML = "";
  });

  // Update UI Elements
  document.getElementById('headerStatusText').textContent = "WEAPON_ONLINE";
  document.getElementById('gameplayHud').style.display = "flex";
  
  // Load Best Score from localStorage
  const savedBest = localStorage.getItem(`typegame_range2_best_lane_${activeLaneId}`) || 0;
  document.getElementById('hudBest').textContent = savedBest;

  sounds.startHum();
  updateHud();
  nextShot();
}

// Load Next Key Target and Reset State
function nextShot() {
  if (currentShot > maxShots) {
    finishGame();
    return;
  }

  isShotResolving = false;
  
  // Update shot counter UI
  document.getElementById('hudCurrentShot').textContent = currentShot;
  document.getElementById('hudShotProgress').style.width = `${(currentShot / maxShots) * 100}%`;

  // Get active config
  const config = laneConfigs[activeLaneId];
  
  // Choose random key from allowed keys
  const keys = config.allowedKeys;
  currentKeyPrompt = keys[Math.floor(Math.random() * keys.length)];
  
  // Display key badge
  const keyBadge = document.getElementById('promptKeyBadge');
  keyBadge.textContent = currentKeyPrompt;
  keyBadge.className = 'prompt-key-badge'; // reset style

  // Reset target visual statuses (only clean-up animations, do NOT delete bullet holes)
  const activeLaneEl = document.getElementById(`lane-${activeLaneId}`);
  const targetEl = activeLaneEl.querySelector('.laser-target');
  targetEl.classList.remove('target-error', 'target-pulse', 'incoming');
  
  // Trigger incoming slide transition only on the FIRST shot of the game
  if (currentShot === 1) {
    targetEl.style.opacity = '1';
    targetEl.style.transform = 'scale(1)';
    void targetEl.offsetWidth; // Reflow
    targetEl.classList.add('incoming');
  }

  // Start continuous laser movement animation
  startLaserMovement();
}

// continuous laser movement logic
function startLaserMovement() {
  if (laserAnimationId) cancelAnimationFrame(laserAnimationId);

  const config = laneConfigs[activeLaneId];
  // Calculate speed factor increasing with current shot
  const speed = config.baseLaserSpeed + (currentShot - 1) * config.speedIncreasePerShot;
  
  // Update laser hum sound pitch based on speed
  sounds.updateHumPitch(speed / 3.0);

  const rangeX = config.rangeX;
  const rangeY = config.rangeY;
  const jitterAmount = config.jitterAmount;
  const movementType = config.movementType;
  
  const startTime = Date.now();
  const activeLaneEl = document.getElementById(`lane-${activeLaneId}`);
  const laserDotEl = activeLaneEl.querySelector('.laser-dot');
  const lane4Motion = movementType === "randomWaypoints"
    ? createLane4Motion(laserX, laserY, currentShot - 1)
    : null;
  
  // Make active lane target active playing
  activeLaneEl.classList.add('playing-active');

  function update() {
    if (gameState !== "playing" || isShotResolving) return;

    const t = (Date.now() - startTime) / 1000;
    
    // Calculate new position based on movement config
    if (movementType === "horizontal") {
      laserX = 50 + Math.sin(t * speed * Math.PI) * rangeX;
      laserY = 50;
    } else if (movementType === "vertical") {
      laserX = 50;
      laserY = 50 + Math.sin(t * speed * Math.PI) * rangeY;
    } else if (movementType === "diagonal") {
      laserX = 50 + Math.sin(t * speed * Math.PI) * rangeX;
      laserY = 50 + Math.cos(t * speed * 0.7 * Math.PI) * rangeY;
    } else if (movementType === "circular") {
      laserX = 50 + Math.sin(t * speed * Math.PI) * rangeX;
      laserY = 50 + Math.cos(t * speed * Math.PI) * rangeY;
    } else if (movementType === "randomWaypoints") {
      const point = sampleLane4Motion(lane4Motion, performance.now(), speed);
      laserX = point.x;
      laserY = point.y;
    }

    // The firing area extends beyond the paper for genuine complete misses.
    laserX = Math.max(-18, Math.min(118, laserX));
    laserY = Math.max(-18, Math.min(118, laserY));

    // Update laser element visual position
    laserDotEl.style.left = `${laserX}%`;
    laserDotEl.style.top = `${laserY}%`;

    // Aim the cannon in real-time to point at the laser dot
    aimCannonAtLaserDot(laserX / 100, laserY / 100);

    laserAnimationId = requestAnimationFrame(update);
  }

  laserAnimationId = requestAnimationFrame(update);
}

// Handle key press check
window.addEventListener('keydown', (e) => {
  if (gameState !== "playing" || isShotResolving) return;
  
  // Block system commands
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  
  const pressedKey = e.key.toUpperCase();
  
  // Ignore keys that are not letters / digits
  if (pressedKey.length !== 1) return;

  resolveShot(pressedKey);
});

// Numeric lane selection keys from Lobby
window.addEventListener('keydown', (e) => {
  if (gameState !== "lobby") return;
  if (e.key >= '1' && e.key <= '4') {
    const laneId = parseInt(e.key, 10);
    selectLane(laneId);
  }
});

// Resolve the shot based on timing and key accuracy
function resolveShot(pressedKey) {
  isShotResolving = true;
  totalKeysPressed++;

  // Stop laser movement update
  if (laserAnimationId) cancelAnimationFrame(laserAnimationId);

  const activeLaneEl = document.getElementById(`lane-${activeLaneId}`);
  const targetEl = activeLaneEl.querySelector('.laser-target');

  // Verify Key matching
  if (pressedKey !== currentKeyPrompt) {
    // WRONG KEY miss state
    sounds.playMissSound();
    combo = 0;
    
    // Animate target error shake
    targetEl.classList.remove('target-error');
    void targetEl.offsetWidth; // Reflow
    targetEl.classList.add('target-error');

    // Trigger visual screen red morph flash
    const flash = document.getElementById('morphFlash');
    flash.className = "morph-flash typo";
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 100);

    // Create Feedback Popup
    showFeedbackPopup("WRONG KEY", "wrong-key");

    updateHud();
    
    // Advance shot count after delay
    currentShot++;
    setTimeout(nextShot, 800);
    return;
  }

  // CORRECT KEY hit state -> Calculate timing distance to center
  correctKeysPressed++;
  
  // Distance from center (50, 50) on 100x100 grid scale
  const dx = laserX - 50;
  const dy = laserY - 50;
  const dist = Math.sqrt(dx * dx + dy * dy);

  let ringHit = 0; // 0, 7, 8, 9, 10
  let baseScore = 0;
  let label = "MISS";
  let popupClass = "miss";

  // Visual thresholds mapping to target circles in CSS
  if (dist <= 5) {
    ringHit = 10;
    baseScore = 100;
    label = "PERFECT HIT";
    popupClass = "perfect";
    perfectHits++;
  } else if (dist <= 16) {
    ringHit = 9;
    baseScore = 80;
    label = "GREAT SHOT";
    popupClass = "great";
  } else if (dist <= 28) {
    ringHit = 8;
    baseScore = 60;
    label = "GOOD HIT";
    popupClass = "good";
  } else if (dist <= 38) {
    ringHit = 7;
    baseScore = 40;
    label = "HIT";
    popupClass = "hit";
  }

  // Handle combo tracking
  if (ringHit >= 8) {
    combo++;
    if (combo > maxCombo) maxCombo = combo;
    
    // Play milestone chord for streak milestones
    if (combo % 5 === 0) {
      sounds.playMilestone();
    }
  } else {
    combo = 0;
  }

  // Calculate final score with combo multiplier
  const comboMultiplier = 1 + (combo * 0.15);
  const shotScore = Math.round(baseScore * comboMultiplier);
  score += shotScore;

  // Trigger cyan flash
  const flash = document.getElementById('morphFlash');
  flash.className = "morph-flash";
  flash.classList.add('active');
  setTimeout(() => flash.classList.remove('active'), 100);

  // Fire laser beam, rupture target and spawn debris explosion
  fireLaserBeamAndHole(laserX, laserY, ringHit);

  // Create Feedback Popup
  const popupMsg = shotScore > 0 ? `${label} +${shotScore}` : "MISS";
  showFeedbackPopup(popupMsg, popupClass);

  updateHud();

  currentShot++;
  setTimeout(nextShot, 800);
}

// Spawn sparks inside target board relative to laser percentage location
function createVisualSparks(pctX, pctY, ringHit) {
  const container = document.getElementById('effectsOverlay');
  const targetContainer = document.querySelector(`#lane-${activeLaneId} .target-container`);
  const targetRect = targetContainer.getBoundingClientRect();
  const stageRect = document.getElementById('missionStage').getBoundingClientRect();

  // Convert target % coordinates to absolute stage overlay coordinates
  const absoluteX = targetRect.left + (pctX / 100) * targetRect.width - stageRect.left;
  const absoluteY = targetRect.top + (pctY / 100) * targetRect.height - stageRect.top;

  const sparkCount = ringHit === 10 ? 25 : ringHit === 9 ? 16 : ringHit === 8 ? 10 : 5;
  const colors = ringHit === 10 ? ['#00f0ff', '#ffffff', '#bd00ff'] : ['#ff9900', '#ffea00', '#ffffff'];

  for (let i = 0; i < sparkCount; i++) {
    const spark = document.createElement('div');
    spark.className = 'spark-particle';
    
    // Choose random trajectory
    const angle = Math.random() * Math.PI * 2;
    const distance = 25 + Math.random() * 65;
    const dx = `${Math.cos(angle) * distance}px`;
    const dy = `${Math.sin(angle) * distance}px`;
    
    spark.style.left = `${absoluteX}px`;
    spark.style.top = `${absoluteY}px`;
    spark.style.setProperty('--dx', dx);
    spark.style.setProperty('--dy', dy);
    spark.style.setProperty('--spark-w', `${4 + Math.random() * 6}px`);
    spark.style.setProperty('--spark-h', `${4 + Math.random() * 6}px`);
    spark.style.setProperty('--spark-color', colors[i % colors.length]);
    spark.style.setProperty('--spark-d', `${0.3 + Math.random() * 0.3}s`);

    container.appendChild(spark);
    
    // Clean up particles
    spark.addEventListener('animationend', () => spark.remove(), { once: true });
  }
}

// Show popup feedback texts
function showFeedbackPopup(msg, typeClass) {
  const container = document.getElementById('hitFeedbackContainer');
  
  // Clear previous popup if any
  container.innerHTML = "";
  
  const el = document.createElement('div');
  el.className = `feedback-popup ${typeClass}`;
  el.textContent = msg;
  container.appendChild(el);
}

// Update HUD texts
function updateHud() {
  document.getElementById('hudScore').textContent = score;
  document.getElementById('hudCombo').textContent = `x${combo}`;

  // Update streak label
  const badge = document.getElementById('hudStreakBadge');
  if (combo >= 8) {
    badge.textContent = "ON FIRE!";
    badge.className = "streak-badge streak-onfire";
  } else if (combo >= 5) {
    badge.textContent = "KILLER STREAK!";
    badge.className = "streak-badge streak-killer";
  } else if (combo >= 3) {
    badge.textContent = "GOOD STREAK";
    badge.className = "streak-badge streak-good";
  } else {
    badge.textContent = "STREAK INACTIVE";
    badge.className = "streak-badge";
  }
}

// End game and show results overlay
function finishGame() {
  gameState = "results";
  sounds.stopHum();
  sounds.playMilestone();
  document.getElementById('headerStatusText').textContent = "MISSION_COMPLETE";
  
  // Disable laser animations and hides laser dot
  if (laserAnimationId) cancelAnimationFrame(laserAnimationId);
  const activeLaneEl = document.getElementById(`lane-${activeLaneId}`);
  activeLaneEl.classList.remove('playing-active');

  // Hide gameplay HUD
  document.getElementById('gameplayHud').style.display = "none";
  
  // Calculate results metrics
  const accuracy = totalKeysPressed > 0 ? Math.round((correctKeysPressed / totalKeysPressed) * 100) : 100;
  const coinsFromScore = Math.floor(score / 100);
  const coinsFromPerfect = perfectHits * 1;
  const totalCoins = coinsFromScore + coinsFromPerfect;

  // Grade message ranking
  let rank = "D";
  let gradeText = "TRAINING VOLTOOID";
  if (score >= 900) {
    rank = "S";
    gradeText = "ELITE SCHERPSCHUTTER";
  } else if (score >= 700) {
    rank = "A";
    gradeText = "UITSTEKENDE MISSIE";
  } else if (score >= 500) {
    rank = "B";
    gradeText = "MISSIE GESLAAGD";
  } else if (score >= 300) {
    rank = "C";
    gradeText = "GOEDE POGING";
  }

  const savedBest = parseInt(localStorage.getItem(`typegame_range2_best_lane_${activeLaneId}`) || 0, 10);
  const bestScore = Math.max(score, savedBest);
  
  document.getElementById('resultsRank').textContent = rank;
  document.getElementById('resultsGradeText').textContent = gradeText;
  document.getElementById('resultsSubtitle').textContent = `LANE 0${activeLaneId} VOLTOOID • ${maxShots} SCHOTEN GEREGISTREERD`;
  document.getElementById('resScore').textContent = score;
  document.getElementById('resBest').textContent = bestScore;
  document.getElementById('resAccuracy').textContent = `${accuracy}%`;
  document.getElementById('resMaxCombo').textContent = `x${maxCombo}`;
  document.getElementById('resPerfect').textContent = `${perfectHits}/${maxShots}`;
  document.getElementById('resCoins').textContent = `+${totalCoins}`;

  document.getElementById('breakdownBaseCoins').textContent = coinsFromScore;
  document.getElementById('breakdownPerfectBonus').textContent = coinsFromPerfect;

  // Save Highscore to LocalStorage
  if (score > savedBest) {
    localStorage.setItem(`typegame_range2_best_lane_${activeLaneId}`, score);
    document.getElementById('resultsCode').textContent = "NIEUW RECORD";
  } else {
    document.getElementById('resultsCode').textContent = "STATUS: GEVERIFIEERD";
  }

  // Display results view
  const resultsOverlay = document.getElementById('resultsOverlay');
  resultsOverlay.style.display = "flex";
  resultsOverlay.setAttribute('aria-hidden', 'false');
}

// Exit results back to main lobby selection
function exitToLobby() {
  gameState = "lobby";
  document.getElementById('rangeWrapper')?.classList.remove('gameplay-lane-active');
  document.getElementById('gameplayTunnel')?.classList.remove('active');
  
  // Hide results overlay
  const resultsOverlay = document.getElementById('resultsOverlay');
  resultsOverlay.style.display = "none";
  resultsOverlay.setAttribute('aria-hidden', 'true');

  // Reset camera view transforms
  const rangeEnv = document.getElementById('rangeEnv');
  rangeEnv.className = 'range-3d-env lobby-active'; // reset zoom classes
  rangeEnv.style.removeProperty('--camera-x');
  rangeEnv.style.removeProperty('--camera-y');
  rangeEnv.style.removeProperty('--camera-z');
  rangeEnv.style.removeProperty('--game-target-size');
  aimRangeCannon();

  // Clear all previous impact holes from target paper containers
  const targets = document.querySelectorAll('.laser-target');
  targets.forEach(target => {
    const borderCont = target.querySelector('.hole-borders-container');
    const centerCont = target.querySelector('.hole-centers-container');
    if (borderCont) borderCont.innerHTML = "";
    if (centerCont) centerCont.innerHTML = "";
  });

  // Return directly to the four-lane overview. The briefing is only shown at entry.
  const briefingOverlay = document.getElementById('briefingOverlay');
  briefingOverlay.style.display = "none";
  briefingOverlay.setAttribute('aria-hidden', 'true');
  
  // Sync status
  document.getElementById('headerStatusText').textContent = "SELECT_LANE_1-4";
  activeLaneId = null;

  // Start lobby preview dots!
  startLobbyPreviews();
}

// Button Events setup
document.getElementById('retryLaneBtn').addEventListener('click', () => {
  // Hide results
  document.getElementById('resultsOverlay').style.display = "none";
  document.getElementById('resultsOverlay').setAttribute('aria-hidden', 'true');
  startPlaying();
});

document.getElementById('exitRangeBtn').addEventListener('click', () => {
  exitToLobby();
});

document.getElementById('spacebarAdvanceBtn').addEventListener('click', advanceBriefingSlide);

window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || gameState !== "briefing") return;
  event.preventDefault();
  advanceBriefingSlide();
});

// Initialize on Load
setupMatrix();
setupLobby();

window.addEventListener('resize', () => {
  if (activeLaneId && (gameState === "transitioning" || gameState === "playing")) {
    frameSelectedLane(activeLaneId);
  }
});
