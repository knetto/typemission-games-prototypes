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
  
  // Simulated messages database
  const messagesData = [
    { id: 1, sender: "COMMANDANT HQ", time: "13:42", text: "Agent Corne, uw volgende missie is gereed. Open 'Lessen' om de inbraak-protocollen te bestuderen.", unread: true },
    { id: 2, sender: "TECH AFDELING", time: "12:15", text: "We hebben de Spypad geüpgraded naar firmware v4.2. De Secret Shop is nu online gezet.", unread: true },
    { id: 3, sender: "AGENT X", time: "Gisteren", text: "Pas op in Amsterdam Centrum. Codeblaster sleutels zijn gespot bij de coördinaten op uw GPS radar.", unread: true },
    { id: 4, sender: "INLICHTINGENDIENST", time: "09-06", text: "De Lockpicking tests laten een stijging zien in type-snelheid. Uitstekend werk.", unread: false }
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
  btnAuthStart.addEventListener("click", () => {
    initAudio();
    authPrompt.classList.add("hidden");
    playSynthBeep("success");
    addConsoleLog("SYSTEMEN INITIALISEREN... OK", "green");
  });

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

  // ── BACKGROUND CANVAS (CYBER RAIN GRID) ──
  const bgCanvas = document.getElementById("matrix-canvas");
  const bgCtx = bgCanvas.getContext("2d");
  
  let width = (bgCanvas.width = window.innerWidth);
  let height = (bgCanvas.height = window.innerHeight);
  
  window.addEventListener("resize", () => {
    width = (bgCanvas.width = window.innerWidth);
    height = (bgCanvas.height = window.innerHeight);
    columns = Math.floor(width / fontSize);
    drops.fill(1);
  });

  const columnsStr = "1010101010101010010110100101010110SPYPADTYPEMISSIONCLASSCLASSIFIED01";
  const fontSize = 14;
  let columns = Math.floor(width / fontSize);
  const drops = Array(columns).fill(1);

  function drawMatrix() {
    bgCtx.fillStyle = "rgba(5, 2, 7, 0.06)";
    bgCtx.fillRect(0, 0, width, height);
    
    bgCtx.font = `${fontSize}px monospace`;
    
    // Grid nodes glow based on active theme
    let dropColor = "rgba(0, 240, 255, 0.18)"; // Light/Dark cyan
    if (activeTheme === "toxic") dropColor = "rgba(154, 215, 68, 0.18)";
    if (activeTheme === "sunset") dropColor = "rgba(255, 98, 177, 0.18)";
    
    bgCtx.fillStyle = dropColor;

    for (let i = 0; i < drops.length; i++) {
      const text = columnsStr[Math.floor(Math.random() * columnsStr.length)];
      bgCtx.fillText(text, i * fontSize, drops[i] * fontSize);
      
      if (drops[i] * fontSize > height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }
  
  // Slow down loop for aesthetic matrix rain speed
  let matrixTimer = 0;
  function loopMatrix() {
    requestAnimationFrame(loopMatrix);
    matrixTimer++;
    if (matrixTimer % 2 === 0) {
      drawMatrix();
    }
  }
  loopMatrix();

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
  toggleScanlines.addEventListener("change", (e) => {
    if (e.target.checked) {
      scanlinesLayer.classList.remove("disabled");
    } else {
      scanlinesLayer.classList.add("disabled");
    }
    playSynthBeep("click");
  });

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
    let listHTML = `<div class="messages-container">`;
    messagesData.forEach(msg => {
      listHTML += `
        <div class="msg-item ${msg.unread ? 'unread' : ''}" data-msg-id="${msg.id}">
          <div class="msg-avatar">${msg.sender[0]}</div>
          <div class="msg-content">
            <div class="msg-meta">
              <span class="msg-sender">${msg.sender}</span>
              <span class="msg-time">${msg.time}</span>
            </div>
            <div class="msg-text">${msg.text}</div>
          </div>
          ${msg.unread ? '<div class="msg-unread-dot"></div>' : ''}
        </div>
      `;
    });
    listHTML += `</div>`;
    appBodyContent.innerHTML = listHTML;
    
    // Bind click reading message
    document.querySelectorAll(".msg-item").forEach(item => {
      item.addEventListener("click", () => {
        const msgId = parseInt(item.getAttribute("data-msg-id"));
        const msg = messagesData.find(m => m.id === msgId);
        
        if (msg && msg.unread) {
          msg.unread = false;
          item.classList.remove("unread");
          const dot = item.querySelector(".msg-unread-dot");
          if (dot) dot.remove();
          
          // Decrement badges
          messagesUnreadCount = Math.max(0, messagesUnreadCount - 1);
          updateAppBadgeCount();
          playSynthBeep("click");
          addConsoleLog("BERICHT GELEZEN", "cyan");
        }
      });
    });
  }

  function updateAppBadgeCount() {
    const msgCard = document.querySelector('[data-app="messages"]');
    const badge = msgCard.querySelector(".app-badge");
    if (badge) {
      if (messagesUnreadCount > 0) {
        badge.textContent = messagesUnreadCount;
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
