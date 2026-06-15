/* ==========================================================================
   SPYPAD MAIN MENU - INTERACTION & SYNTHESIS LOGIC
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  
  // ── STATE VARIABLES ──
  let sfxEnabled = true;
  let audioCtx = null;
  let typingCoins = 140;
  let appState = "dashboard"; // "dashboard" or "app"
  let messagesUnreadCount = 3;
  let activeTheme = "light";
  
  // Simulated purchased item ids
  const purchasedItems = new Set();
  
  // Simulated contacts and messages database (matching original screenshot)
  const contactsData = [
    {
      id: "qwerty",
      name: "Qwerty",
      avatar: "./assets/media__1781266267882.png", // Orange cat selfie
      description: "Professor Qwerty is raketgeleerde, uitvinder, electrotechnicus, programmeur, alchemist en studeerde oosterse filosofie. Hij maakte nooit een studie af, maar noemt zich toch professor.",
      unread: true,
      messages: [
        { sender: "other", type: "text", content: "Hallo Agent Corne! Heb je de inbraak-protocollen al bestudeerd?" },
        { sender: "other", type: "image", content: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=400&auto=format&fit=crop" }, // Cursed cat with sunglasses
        { sender: "self", type: "text", content: "Ja, professor. Ik ben momenteel bezig met de decodering." },
        { sender: "other", type: "video", content: "./assets/video1.mp4" }, // Local video placeholder (Big Buck Bunny)
        { sender: "other", type: "text", content: "Uitstekend. Hier is een instructievideo die je kan helpen." }
      ]
    },
    {
      id: "kyra",
      name: "Kyra",
      avatar: "./assets/media__1781266332686.png", // Smiling cat
      description: "Kyra is de tech-expert en hacker van het team. Ze kraakt elk complex beveiligingssysteem in no-time en beheert onze beveiligde netwerkverbindingen.",
      unread: true,
      messages: [
        { sender: "other", type: "text", content: "Ik heb zojuist de firewall van de tegenpartij omzeild. Zie deze screenshot:" },
        { sender: "other", type: "image", content: "https://images.unsplash.com/photo-1560942485-b2a11cc13456?q=80&w=400&auto=format&fit=crop" }, // Cursed mannequin head
        { sender: "self", type: "text", content: "Super gedaan Kyra! Stuur me de toegangscodes zodra je ze hebt." },
        { sender: "other", type: "video", content: "./assets/video2.mp4" }, // Local video placeholder (Bear sliding)
        { sender: "other", type: "text", content: "Hier is de videostream van hun serverruimte. Succes!" }
      ]
    },
    {
      id: "missj",
      name: "Miss J",
      avatar: "./assets/media__1781266345650.png", // Confused cat
      description: "Miss J is het hoofd van de inlichtingendienst. Altijd geheimzinnig en zeer professioneel, zij coördineert alle active operaties in het veld.",
      unread: true,
      messages: [
        { sender: "other", type: "text", content: "Agent Corne, we hebben een verdachte activiteit waargenomen in sector 7. Bekijk dit:" },
        { sender: "other", type: "image", content: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=400&auto=format&fit=crop" }, // Cursed glowing jack-o-lantern
        { sender: "self", type: "text", content: "Ik ga er direct op af, Miss J." },
        { sender: "other", type: "video", content: "./assets/video1.mp4" } // Local video placeholder
      ]
    },
    {
      id: "schoolhoofd",
      name: "Schoolhoofd",
      avatar: "./assets/media__1781266530662.png", // Cat with tongue out (new)
      description: "Het Schoolhoofd coördineert de trainingen en oefeningen voor jonge geheim agenten op de HQ academie. Hij tolereert geen fouten en eist absolute perfectie.",
      unread: false,
      messages: [
        { sender: "other", type: "text", content: "Je type-snelheid is uitstekend vooruitgegaan. Blijf oefenen met de losse letters!" },
        { sender: "self", type: "text", content: "Dank u wel, meneer. Ik doe mijn best." }
      ]
    },
    {
      id: "mri",
      name: "Mr. I",
      avatar: "./assets/media__1781266546244.png", // Close-up cute cat (new)
      description: "Niemand weet waar de I voor staat in zijn codenaam. Dat is een mysterie. Contact opnemen met Mr. I is onmogelijk. Hij neemt contact met jou op... als hij dat nodig vindt.",
      unread: false,
      messages: [
        { sender: "other", type: "text", content: "De vijand heeft de gecodeerde bestanden verplaatst. Wees op je hoede." },
        { sender: "self", type: "text", content: "Heb je een locatie?" },
        { sender: "other", type: "text", content: "Nog niet. Ik neem contact op als ik meer weet." }
      ]
    }
  ];

  // ── DOM ELEMENTS ──
  const consoleEl = document.getElementById("spypad-console");
  const authPrompt = document.getElementById("audio-auth-prompt");
  const btnAuthStart = document.getElementById("btn-auth-start");
  const liveTimeEl = document.getElementById("live-time");
  const dashboardContent = document.getElementById("dashboard-content");
  const appViewContainer = document.getElementById("app-view-container");
  const appTitleText = document.getElementById("app-title-text");
  const appBodyContent = document.getElementById("app-body-content");
  const appBackBtn = document.getElementById("app-back-btn");
  const btnCloseSpypad = document.getElementById("btn-close-spypad");
  const scanlinesLayer = document.getElementById("scanlines-layer");
  
  // Settings controls
  const settingsToggleBtn = document.getElementById("settings-toggle-btn");
  const settingsPanel = document.getElementById("settings-panel");
  const selectTheme = document.getElementById("theme-select");
  const toggleSfx = document.getElementById("toggle-sfx");
  const toggleScanlines = document.getElementById("toggle-scanlines");
  const btnSoundTest = document.getElementById("btn-sound-test");
  
  // Left joystick & handle buttons
  const leftJoystick = document.getElementById("left-joystick");
  const ctrlBtnUp = document.getElementById("ctrl-btn-up");
  const ctrlBtnDown = document.getElementById("ctrl-btn-down");
  const ctrlBtnLeft = document.getElementById("ctrl-btn-left");
  const ctrlBtnRight = document.getElementById("ctrl-btn-right");
  const logoBadge = document.getElementById("logo-badge");
  
  // Right screen logs & canvas
  const terminalTicker = document.getElementById("vss-terminal-ticker");
  const vssCanvas = document.getElementById("vss-mini-chart");
  const vssCtx = vssCanvas.getContext("2d");

  // ── INITIALIZATION & AUDIO INITIALIZER ──
  const startInitialization = () => {
    initAudio();
    playSynthBeep("success");
    addConsoleLog("SYSTEMEN INITIALISEREN... OK", "green");
    if (authPrompt) authPrompt.classList.add("hidden");
  };

  if (btnAuthStart) {
    btnAuthStart.addEventListener("click", startInitialization);
  } else {
    // Automatically initialize systems on first user click anywhere if overlay is absent
    document.addEventListener("click", startInitialization, { once: true });
  }

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // ── WEB AUDIO API SYNTHESIZER BEERS ──
  function playSynthBeep(type) {
    if (!sfxEnabled || !audioCtx) return;
    
    // Ensure context is active
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === "click") {
      // Short clicky beep
      osc.type = "sine";
      osc.frequency.setValueAtTime(700, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } 
    else if (type === "hover") {
      // Very short high chirp
      osc.type = "sine";
      osc.frequency.setValueAtTime(1300, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } 
    else if (type === "success") {
      // Double note rising chime
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.setValueAtTime(0.12, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } 
    else if (type === "denied") {
      // Buzzing error note
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      // Filter out high harsh buzzing
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 500;
      osc.disconnect(gain);
      osc.connect(filter);
      filter.connect(gain);
      
      osc.start(now);
      osc.stop(now + 0.25);
    } 
    else if (type === "slide") {
      // Ramping sweep
      osc.type = "sine";
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
    else if (type === "radar") {
      // Radar sweep sound
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.8);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    }
  }

  // ── LIVE CLOCK TIMER ──
  function updateClock() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    liveTimeEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // ── RANDOM BATTERY PERCENTAGE ──
  const batteryPercentEl = document.querySelector(".battery-percent");
  const batteryLevelEl = document.querySelector(".custom-battery-level");
  if (batteryPercentEl && batteryLevelEl) {
    let charge = Math.floor(Math.random() * (99 - 55 + 1)) + 55; // 55% to 99%
    
    const updateBatteryDisplay = (val) => {
      batteryPercentEl.textContent = `${val}%`;
      batteryLevelEl.style.width = `${val}%`;
    };
    
    // Initial set
    updateBatteryDisplay(charge);
    
    // Fluctuate battery slowly for dynamic realism
    setInterval(() => {
      if (Math.random() > 0.6) {
        const delta = Math.random() > 0.7 ? 1 : -1;
        charge = Math.max(5, Math.min(100, charge + delta));
        updateBatteryDisplay(charge);
      }
    }, 15000);
  }

  // ── BACKGROUND CANVAS (INTERACTIVE DOTTED WAVE) ──
  const bgCanvas = document.getElementById("matrix-canvas");
  const bgCtx = bgCanvas.getContext("2d");
  
  let width = (bgCanvas.width = window.innerWidth);
  let height = (bgCanvas.height = window.innerHeight);

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

  function drawDottedBackground() {
    bgCtx.fillStyle = "#050206";
    bgCtx.fillRect(0, 0, width, height);
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

        bgCtx.fillStyle = `rgba(154, 215, 68, ${opacity})`;
        bgCtx.beginPath();
        bgCtx.arc(x, y, radius, 0, Math.PI * 2);
        bgCtx.fill();
      }
    }
  }

  let lastTime = 0;
  const fps = 30;
  const interval = 1000 / fps;

  function loopDottedBackground(now) {
    requestAnimationFrame(loopDottedBackground);
    const delta = now - lastTime;
    if (delta > interval) {
      lastTime = now - (delta % interval);
      drawDottedBackground();
    }
  }
  requestAnimationFrame(loopDottedBackground);

  window.addEventListener("resize", () => {
    width = bgCanvas.width = window.innerWidth;
    height = bgCanvas.height = window.innerHeight;
    cols = Math.floor(width / dotSpacing) + 1;
    rows = Math.floor(height / dotSpacing) + 1;
  });


  // ── RIGHT STATUS PANEL DRAWING: OSCILLOSCOPE ──
  vssCanvas.width = 110;
  vssCanvas.height = 60;
  let oscPhase = 0;

  function drawOscilloscope() {
    requestAnimationFrame(drawOscilloscope);
    vssCtx.clearRect(0, 0, vssCanvas.width, vssCanvas.height);
    
    vssCtx.lineWidth = 1.5;
    
    // Neon trace style based on active theme
    let traceGlow = "rgba(0, 240, 255, 0.4)";
    let traceColor = "#00f0ff";
    if (activeTheme === "toxic") {
      traceGlow = "rgba(154, 215, 68, 0.4)";
      traceColor = "#9ad744";
    } else if (activeTheme === "sunset") {
      traceGlow = "rgba(255, 98, 177, 0.4)";
      traceColor = "#ff62b1";
    }

    vssCtx.strokeStyle = traceColor;
    vssCtx.shadowBlur = 4;
    vssCtx.shadowColor = traceColor;
    
    vssCtx.beginPath();
    for (let x = 0; x < vssCanvas.width; x++) {
      // Compose multiple sine waves for high tech noise pattern
      const y = vssCanvas.height / 2 + 
                Math.sin(x * 0.1 + oscPhase) * 12 * Math.sin(oscPhase * 0.5) +
                Math.cos(x * 0.05 - oscPhase * 2) * 4;
      if (x === 0) {
        vssCtx.moveTo(x, y);
      } else {
        vssCtx.lineTo(x, y);
      }
    }
    vssCtx.stroke();
    vssCtx.shadowBlur = 0; // reset
    
    oscPhase += 0.08;
  }
  drawOscilloscope();

  // ── RIGHT STATUS TICKER LOGGER ──
  const logQueue = [
    "GPS LATITUDE ADJUSTED",
    "ENCRYPTED DECRYPTING RUN...",
    "AUDIO DRIVER READY",
    "RADAR SWEEP SIGNAL: 100%",
    "AGENT CORNE AUTHORIZED",
    "SECRET COINS DETECTED",
    "MATRIX SHIELD ON",
    "BATTERY STATUS: NOMINAL",
    "SECURITY LOGGING ACTIVE",
    "SPY STACK LOADED: OK",
    "NO SUSPICIOUS OVERLAYS",
    "INTRUDERS: 0 DETECTED",
    "KEYBOARD CALIBRATION SUCCESS",
    "TRANSMITTING ON FREQ 88.4"
  ];

  function addConsoleLog(text, colorClass = "") {
    const line = document.createElement("div");
    line.className = "ticker-line";
    if (colorClass) {
      line.classList.add(`text-${colorClass}`);
    }
    line.textContent = `> ${text}`;
    terminalTicker.appendChild(line);
    
    // Limit log rows to 6 items
    while (terminalTicker.children.length > 6) {
      terminalTicker.removeChild(terminalTicker.firstChild);
    }
    
    // Autoscroll logs
    terminalTicker.scrollTop = terminalTicker.scrollHeight;
  }

  // Periodic random diagnostic logger
  setInterval(() => {
    const text = logQueue[Math.floor(Math.random() * logQueue.length)];
    const classes = ["", "green", "orange", "cyan"];
    const col = classes[Math.floor(Math.random() * classes.length)];
    addConsoleLog(text, col);
  }, 4200);

  // ── LEFT CONTROLLER GRIP: ANALOG STICK DRAGGING ──
  let isDraggingJoystick = false;
  let startX = 0, startY = 0;
  const maxRadius = 10; // Pixels thumbstick can move
  let lastNavTime = 0;

  leftJoystick.addEventListener("pointerdown", (e) => {
    isDraggingJoystick = true;
    leftJoystick.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
    leftJoystick.style.transition = "none";
    playSynthBeep("click");
  });

  leftJoystick.addEventListener("pointermove", (e) => {
    if (!isDraggingJoystick) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    let moveX = dx;
    let moveY = dy;
    
    if (distance > maxRadius) {
      const angle = Math.atan2(dy, dx);
      moveX = Math.cos(angle) * maxRadius;
      moveY = Math.sin(angle) * maxRadius;
    }
    
    leftJoystick.style.transform = `translate(${moveX}px, ${moveY}px)`;
    
    // Trigger navigation tick noise if dragged hard in a direction
    const now = Date.now();
    if (distance > maxRadius * 0.8 && now - lastNavTime > 350) {
      playSynthBeep("hover");
      lastNavTime = now;
      
      // Print direction to system logs
      let dir = "CENTER";
      if (Math.abs(moveX) > Math.abs(moveY)) {
        dir = moveX > 0 ? "RIGHT" : "LEFT";
      } else {
        dir = moveY > 0 ? "DOWN" : "UP";
      }
      addConsoleLog(`JOYSTICK: ${dir}`, "cyan");
    }
  });

  leftJoystick.addEventListener("pointerup", (e) => {
    if (!isDraggingJoystick) return;
    isDraggingJoystick = false;
    leftJoystick.releasePointerCapture(e.pointerId);
    leftJoystick.style.transition = "transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    leftJoystick.style.transform = "translate(0px, 0px)";
  });

  // Physical buttons feedback beeps
  [ctrlBtnUp, ctrlBtnDown, ctrlBtnLeft, ctrlBtnRight].forEach((btn, idx) => {
    btn.addEventListener("click", () => {
      playSynthBeep("click");
      const directions = ["UP", "LEFT", "RIGHT", "DOWN"];
      addConsoleLog(`ACTION BUTTON: ${directions[idx]}`, "orange");
    });
  });

  logoBadge.addEventListener("click", () => {
    playSynthBeep("success");
    addConsoleLog("TYPEMISSION BRAND SYSTEEM STATUS: OK", "green");
  });

  // ── SETTINGS PANEL TOGGLES ──
  settingsToggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    playSynthBeep("click");
    settingsPanel.classList.toggle("open");
  });

  // Close settings clicking elsewhere
  document.addEventListener("click", (e) => {
    if (!settingsPanel.contains(e.target) && e.target !== settingsToggleBtn) {
      settingsPanel.classList.remove("open");
    }
  });

  // Sound FX toggle checkbox
  toggleSfx.addEventListener("change", (e) => {
    sfxEnabled = e.target.checked;
    if (sfxEnabled) {
      initAudio();
      playSynthBeep("click");
    }
  });

  // Scanline overlay checkbox
  if (toggleScanlines) {
    toggleScanlines.addEventListener("change", (e) => {
      if (scanlinesLayer) {
        if (e.target.checked) {
          scanlinesLayer.classList.remove("disabled");
        } else {
          scanlinesLayer.classList.add("disabled");
        }
      }
      playSynthBeep("click");
    });
  }

  // Customizer theme case drop down
  selectTheme.addEventListener("change", (e) => {
    const val = e.target.value;
    consoleEl.className = `gamepad-body theme-${val}`;
    activeTheme = val;
    playSynthBeep("slide");
    addConsoleLog(`THEMA VERANDERD: ${val.toUpperCase()}`, "cyan");
  });

  // Geluidstest button
  btnSoundTest.addEventListener("click", () => {
    initAudio();
    playSynthBeep("success");
  });

  // ── SLUITEN PILL BUTTON (CONSOLE POWER TOGGLE) ──
  let powerOff = false;
  btnCloseSpypad.addEventListener("click", () => {
    powerOff = !powerOff;
    if (powerOff) {
      playSynthBeep("denied");
      document.querySelector(".spypad-screen").style.opacity = "0.02";
      document.querySelector(".spypad-screen").style.pointerEvents = "none";
      btnCloseSpypad.style.borderColor = "var(--neon-green)";
      btnCloseSpypad.querySelector(".btn-text").textContent = "OPSTARTEN";
      btnCloseSpypad.querySelector(".btn-text").style.textShadow = "0 0 5px var(--neon-green-glow)";
      btnCloseSpypad.style.boxShadow = "0 0 10px var(--neon-green-glow)";
      btnCloseSpypad.style.background = "rgba(154, 215, 68, 0.1)";
      addConsoleLog("SCHERM OFFLINE GEZET", "red");
    } else {
      initAudio();
      playSynthBeep("success");
      document.querySelector(".spypad-screen").style.opacity = "1";
      document.querySelector(".spypad-screen").style.pointerEvents = "auto";
      btnCloseSpypad.style.borderColor = "var(--neon-red)";
      btnCloseSpypad.querySelector(".btn-text").textContent = "SLUITEN";
      btnCloseSpypad.querySelector(".btn-text").style.textShadow = "0 0 5px var(--neon-red-glow)";
      btnCloseSpypad.style.boxShadow = "0 0 10px var(--neon-red-glow)";
      btnCloseSpypad.style.background = "rgba(255, 59, 48, 0.1)";
      addConsoleLog("SCHERM ON-LINE", "green");
    }
  });

  // ── APP DASHBOARD ROUTING ──
  const appCards = document.querySelectorAll(".app-card");

  appCards.forEach(card => {
    card.addEventListener("click", () => {
      const appKey = card.getAttribute("data-app");
      
      // If card is locked
      if (card.classList.contains("app-locked")) {
        playSynthBeep("denied");
        card.classList.add("lock-shake");
        setTimeout(() => card.classList.remove("lock-shake"), 400);
        addConsoleLog("TOEGANG GEWEIGERD: NIVEAU TE LAAG", "red");
        return;
      }
      
      // Unlocked triggers navigation
      playSynthBeep("slide");
      loadAppView(appKey);
    });
  });

  appBackBtn.addEventListener("click", () => {
    playSynthBeep("click");
    dashboardContent.style.display = "flex";
    appViewContainer.classList.remove("active");
    appState = "dashboard";
    addConsoleLog("TERUG NAAR HOOFDMENU", "cyan");
  });

  // ── LOAD APP SIMULATED INTERFACES ──
  function loadAppView(key) {
    appState = "app";
    dashboardContent.style.display = "none";
    appViewContainer.classList.add("active");
    
    // Set custom page header label
    const appNames = {
      messages: "BERICHTEN HQ",
      profile: "AGENT STATISTIEKEN",
      shop: "CLASSIFIED WEAPONS SHOP",
      practice: "PRACTICE CODES",
      status: "AGENT VOORTGANG",
      typetris: "TYPETRIS ARCADE",
      lessons: "TYPETEST TRAININGEN",
      gps: "RADAR COÖRDINATEN TRACKER"
    };
    appTitleText.textContent = appNames[key] || "SYS APPLICATION";
    
    // Render matching body content mockup
    appBodyContent.innerHTML = "";
    addConsoleLog(`GEINITIALISEERD: ${key.toUpperCase()}`, "green");

    if (key === "messages") {
      renderMessagesApp();
    } else if (key === "profile") {
      renderProfileApp();
    } else if (key === "shop") {
      renderShopApp();
    } else if (key === "gps") {
      renderGPSApp();
    } else {
      renderGenericMockup(key);
    }
  }

  // ── APP SIMULATOR: 1. MESSAGES APP ──
  function renderMessagesApp() {
    let listHTML = `
      <div class="messages-container">
        <!-- Left Contacts Panel -->
        <div class="contacts-panel">
          <div class="contacts-header">
            <span class="contacts-status-dot"></span>
            <span class="contacts-title">CONTACTEN</span>
          </div>
          <div class="contacts-list">
    `;

    contactsData.forEach(contact => {
      listHTML += `
        <div class="contact-item ${contact.unread ? 'unread-contact' : ''}" data-contact-id="${contact.id}">
          <img class="contact-avatar" src="${contact.avatar}" alt="${contact.name}">
          <span class="contact-name">${contact.name}</span>
          <span class="contact-chevron">&gt;</span>
        </div>
      `;
    });

    listHTML += `
          </div>
        </div>

        <!-- Right Conversation Panel -->
        <div class="conversation-panel" id="conversation-panel-container">
          <!-- Dynamically populated conversations go here -->
        </div>
      </div>
    `;

    appBodyContent.innerHTML = listHTML;

    // Default load first contact
    if (contactsData.length > 0) {
      loadConversation(contactsData[0].id);
    }

    // Bind contact clicks
    document.querySelectorAll(".contact-item").forEach(item => {
      item.addEventListener("click", () => {
        const contactId = item.getAttribute("data-contact-id");
        playSynthBeep("click");
        loadConversation(contactId);
      });
    });
  }

  function loadConversation(contactId) {
    const contact = contactsData.find(c => c.id === contactId);
    if (!contact) return;

    // Mark as read
    if (contact.unread) {
      contact.unread = false;
      const item = document.querySelector(`.contact-item[data-contact-id="${contactId}"]`);
      if (item) item.classList.remove("unread-contact");
      updateAppBadgeCount();
      addConsoleLog(`CHAT MET ${contact.name.toUpperCase()} GELEZEN`, "cyan");
    }

    // Set active item styling
    document.querySelectorAll(".contact-item").forEach(item => {
      if (item.getAttribute("data-contact-id") === contactId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    const panel = document.getElementById("conversation-panel-container");
    if (!panel) return;

    // Build right panel
    let chatHTML = `
      <!-- Profile Header -->
      <div class="conversation-profile-header">
        <div class="avatar-container">
          <img class="conversation-profile-avatar" src="${contact.avatar}" alt="${contact.name}">
        </div>
        <div class="conversation-profile-info">
          <div class="conversation-profile-name">${contact.name}</div>
          <div class="conversation-profile-desc">${contact.description}</div>
        </div>
      </div>

      <!-- Section Divider -->
      <div class="conversation-section-divider">
        <span class="conversation-section-title">${contact.name}</span>
        <span class="conversation-section-line"></span>
      </div>

      <!-- Conversation History -->
      <div class="conversation-history">
    `;

    if (contact.messages.length === 0) {
      chatHTML += `<div class="conversation-empty">Geen nieuwe berichten...</div>`;
    } else {
      contact.messages.forEach(msg => {
        const alignment = msg.sender === "self" ? "outgoing" : "incoming";
        chatHTML += `
          <div class="message-bubble ${alignment}">
        `;

        if (msg.type === "text") {
          chatHTML += `<div class="message-text-card">${msg.content}</div>`;
        } else if (msg.type === "image") {
          chatHTML += `
            <div class="message-image-card">
              <img src="${msg.content}" alt="Gedeelde foto">
            </div>
          `;
        } else if (msg.type === "video") {
          chatHTML += `
            <div class="message-video-card video-paused">
              <video src="${msg.content}" controls style="width: 100%; height: 100%; object-fit: cover;"></video>
              <div class="video-overlay-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="#ffffff">
                  <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                  <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                </svg>
              </div>
            </div>
          `;
        }

        chatHTML += `
          </div>
        `;
      });
    }

    chatHTML += `
      </div>
    `;

    panel.innerHTML = chatHTML;

    // Scroll conversation history to bottom
    const historyContainer = panel.querySelector(".conversation-history");
    if (historyContainer) {
      historyContainer.scrollTop = historyContainer.scrollHeight;
    }

    // Bind video play/pause expansion
    const videos = panel.querySelectorAll(".message-video-card video");
    videos.forEach(vid => {
      const card = vid.closest(".message-video-card");
      if (!card) return;
      
      vid.addEventListener("play", () => {
        card.classList.add("video-expanded");
        card.classList.add("video-playing");
        card.classList.remove("video-paused");
        vid.style.objectFit = "contain";
        // Delay scroll to allow transition layout to begin so height is calculated correctly
        setTimeout(() => {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
      });
      
      vid.addEventListener("pause", () => {
        card.classList.remove("video-expanded");
        card.classList.remove("video-playing");
        card.classList.add("video-paused");
        vid.style.objectFit = "cover";
      });
      
      vid.addEventListener("ended", () => {
        card.classList.remove("video-expanded");
        card.classList.remove("video-playing");
        card.classList.add("video-paused");
        vid.style.objectFit = "cover";
      });
    });
  }

  function updateAppBadgeCount() {
    const unreadCount = contactsData.filter(c => c.unread).length;
    const msgCard = document.querySelector('[data-app="messages"]');
    const badge = msgCard.querySelector(".app-badge");
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = "flex";
      } else {
        badge.style.display = "none";
      }
    }
  }

  // ── APP SIMULATOR: 2. PROFILE APP ──
  function renderProfileApp() {
    appBodyContent.innerHTML = `
      <div class="profile-dashboard">
        <div class="profile-left">
          <div class="profile-avatar-box">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
            </svg>
            <div class="profile-badge-lvl">4</div>
          </div>
          <div class="profile-username">Agent Corne</div>
          <div class="profile-rank">Elite Decryptor</div>
        </div>
        <div class="profile-right">
          
          <div class="metric-bar-group">
            <div class="metric-header">
              <span>Missions XP</span>
              <span class="metric-val">82%</span>
            </div>
            <div class="metric-progress-outer">
              <div class="metric-progress-fill profile-xp-fill" style="width: 0%;"></div>
            </div>
          </div>

          <div class="metric-bar-group">
            <div class="metric-header">
              <span>Type Snelheid</span>
              <span class="metric-val">84 WPM</span>
            </div>
            <div class="metric-progress-outer">
              <div class="metric-progress-fill profile-wpm-fill" style="width: 0%;"></div>
            </div>
          </div>

          <div class="metric-bar-group">
            <div class="metric-header">
              <span>Nauwkeurigheid</span>
              <span class="metric-val">98%</span>
            </div>
            <div class="metric-progress-outer">
              <div class="metric-progress-fill profile-acc-fill" style="width: 0%;"></div>
            </div>
          </div>

        </div>
      </div>
    `;
    
    // Animate profile bars progress loading up
    setTimeout(() => {
      const bars = appBodyContent.querySelectorAll(".metric-progress-fill");
      if (bars.length >= 3) {
        bars[0].style.width = "82%";
        bars[0].style.transition = "width 0.8s ease-out";
        bars[1].style.width = "84%";
        bars[1].style.transition = "width 0.8s ease-out 0.1s";
        bars[2].style.width = "98%";
        bars[2].style.transition = "width 0.8s ease-out 0.2s";
      }
    }, 50);
  }

  // ── APP SIMULATOR: 3. SECRET SHOP APP ──
  const shopCatalog = [
    { id: "laser_pen", name: "Laser Brandpen", desc: "Smelt stalen deursloten en barrières.", cost: 35 },
    { id: "cloner", name: "Keycard Simulator v3", desc: "Draadloos dupliceren van toegangspassen.", cost: 60 },
    { id: "tracker", name: "Nano GPS Bugs", desc: "Volg spionnen via RF signalen.", cost: 45 },
    { id: "goggles", name: "Nachtkijker Mod", desc: "Upgrade nachtvisie classificatie.", cost: 110 }
  ];

  function renderShopApp() {
    let shopHTML = `
      <div class="shop-header-stats">
        <span class="shop-desc">Koop gadgets met verdiende Type Coins.</span>
        <div class="shop-coins-counter">
          <span id="shop-coins-val">${typingCoins}</span>
          <div class="coin-dot"></div>
        </div>
      </div>
      <div class="shop-grid">
    `;
    
    shopCatalog.forEach(item => {
      const isOwned = purchasedItems.has(item.id);
      shopHTML += `
        <div class="shop-item">
          <div class="shop-info">
            <div class="shop-name">${item.name}</div>
            <div class="shop-desc">${item.desc}</div>
          </div>
          <div class="shop-action">
            <span class="shop-cost">${item.cost} <div class="shop-cost-icon"></div></span>
            <button class="shop-buy-btn ${isOwned ? 'purchased' : ''}" 
                    data-shop-id="${item.id}" 
                    data-cost="${item.cost}" 
                    ${isOwned ? 'disabled' : ''}>
              ${isOwned ? 'GEKOCHT' : 'KOOP'}
            </button>
          </div>
        </div>
      `;
    });
    
    shopHTML += `</div>`;
    appBodyContent.innerHTML = shopHTML;
    
    // Bind buy event
    appBodyContent.querySelectorAll(".shop-buy-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const itemId = btn.getAttribute("data-shop-id");
        const cost = parseInt(btn.getAttribute("data-cost"));
        const item = shopCatalog.find(i => i.id === itemId);

        if (purchasedItems.has(itemId)) return;

        if (typingCoins >= cost) {
          // Process purchase
          typingCoins -= cost;
          purchasedItems.add(itemId);
          
          // Sound chime
          playSynthBeep("success");
          
          // Re-render Shop header coins and button
          document.getElementById("shop-coins-val").textContent = typingCoins;
          btn.textContent = "GEKOCHT";
          btn.classList.add("purchased");
          btn.disabled = true;
          
          addConsoleLog(`GELUKT: ${item.name.toUpperCase()} GEKOCHT`, "green");
        } else {
          // Denied
          playSynthBeep("denied");
          btn.classList.add("lock-shake");
          setTimeout(() => btn.classList.remove("lock-shake"), 400);
          addConsoleLog("Mislukt: Niet genoeg coins", "red");
        }
      });
    });
  }

  // ── APP SIMULATOR: 4. GPS RADAR APP ──
  function renderGPSApp() {
    appBodyContent.innerHTML = `
      <div class="radar-layout">
        <div class="radar-scope-wrapper">
          <div class="radar-grid-circle circle-1"></div>
          <div class="radar-grid-circle circle-2"></div>
          <div class="radar-grid-circle circle-3"></div>
          <div class="radar-crosshair-h"></div>
          <div class="radar-crosshair-v"></div>
          <div class="radar-sweep-line"></div>
          <!-- Scanning Targets -->
          <div class="radar-target-dot radar-target-1"></div>
          <div class="radar-target-dot radar-target-2"></div>
          <div class="radar-target-dot radar-target-3"></div>
        </div>
        <div class="radar-stats">
          <div class="radar-stat-row">
            <span>Radar status:</span>
            <span class="cyan-text">ONLINE</span>
          </div>
          <div class="radar-stat-row">
            <span>Latitude:</span>
            <span id="gps-lat">52.37021 °N</span>
          </div>
          <div class="radar-stat-row">
            <span>Longitude:</span>
            <span id="gps-lng">4.89516 °O</span>
          </div>
          <div class="radar-stat-row">
            <span>Actieve Doelen:</span>
            <span class="cyan-text">3 VERBINDINGEN</span>
          </div>
          <button id="btn-radar-ping" class="settings-action-btn" style="margin-top: 5px;">VERSTUUR PING-SIGNAAL</button>
        </div>
      </div>
    `;
    
    // Animate target dots and GPS coordinate shifts
    const gpsInterval = setInterval(() => {
      const latSpan = document.getElementById("gps-lat");
      const lngSpan = document.getElementById("gps-lng");
      if (!latSpan || !lngSpan) {
        clearInterval(gpsInterval);
        return;
      }
      
      // Simulate minor noise in coordination measurements
      const randomNoiseLat = (52.37021 + (Math.random() - 0.5) * 0.001).toFixed(5);
      const randomNoiseLng = (4.89516 + (Math.random() - 0.5) * 0.0015).toFixed(5);
      latSpan.textContent = `${randomNoiseLat} °N`;
      lngSpan.textContent = `${randomNoiseLng} °O`;
    }, 1500);

    // Active Radar Ping sound & flash effect
    const btnPing = document.getElementById("btn-radar-ping");
    btnPing.addEventListener("click", () => {
      playSynthBeep("radar");
      addConsoleLog("RADAR PING SIGNAL VERSTUURD", "cyan");
      
      const dots = appBodyContent.querySelectorAll(".radar-target-dot");
      dots.forEach(dot => {
        dot.style.transform = "translate(-50%, -50%) scale(2.5)";
        dot.style.filter = "brightness(2) drop-shadow(0 0 10px var(--neon-cyan))";
        dot.style.transition = "transform 0.1s, filter 0.1s";
        
        setTimeout(() => {
          dot.style.transform = "translate(-50%, -50%) scale(1)";
          dot.style.filter = "none";
          dot.style.transition = "transform 1.2s ease-out, filter 1.2s ease-out";
        }, 120);
      });
    });
  }

  // ── APP SIMULATOR: 5. GENERIC MOCKUP PAGE ──
  function renderGenericMockup(key) {
    const mockupDetails = {
      practice: {
        title: "Snelle Codeoefeningen",
        icon: "⌨️",
        desc: "Dit is uw typeoefen-omgeving. Train uw vingerzetting op willekeurige codereeksen om de serverdeuren te hacken en coins te verdienen.",
        label: "LANCEER TRAINING"
      },
      status: {
        title: "Voortgangs-monitor",
        icon: "📈",
        desc: "Bekijk gedetailleerde grafieken over uw type-nauwkeurigheid, gemiddelde WPM over 30 dagen en voltooiingspercentages van missies.",
        label: "SYNC MET CLOUD"
      },
      typetris: {
        title: "Typetris Arcade",
        icon: "🧱",
        desc: "Verbind blokken door de getoonde letters of woorden snel in te voeren. Blokken vallen sneller naarmate uw WPM toeneemt. Behaal de highscore!",
        label: "START ARCADE SPEL"
      },
      lessons: {
        title: "Lessen & Cursussen",
        icon: "🎓",
        desc: "Selecteer een leertraject om uw basishouding, vingerplaatsing en specifieke karakters (zoals symbolen en getallen) te perfectioneren.",
        label: "OPEN LESROOSTER"
      }
    };
    
    const details = mockupDetails[key] || { title: "Spypad App", icon: "🌐", desc: "Gelicenseerde applicatie voor operationeel veldwerk.", label: "INITIALISEREN" };

    appBodyContent.innerHTML = `
      <div class="mock-${key}-body">
        <div style="font-size: 2.8rem; margin-bottom: 5px;">${details.icon}</div>
        <h4>${details.title}</h4>
        <p>${details.desc}</p>
        <button class="settings-action-btn" id="btn-mock-action" style="max-width: 200px;">${details.label}</button>
      </div>
    `;
    
    document.getElementById("btn-mock-action").addEventListener("click", () => {
      playSynthBeep("success");
      addConsoleLog(`ACTIE UITGEVOERD OP [${key.toUpperCase()}]`, "green");
    });
  }

});
