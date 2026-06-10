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
  let activeMsgId = 1;
  const userReplies = {}; // format: { msgId: [ { sender: "AGENT CORNE", time: "13:58", text: "..." } ] }

  function renderMessagesApp() {
    let listHTML = `
      <div class="messages-layout">
        <div class="messages-sidebar">
          <div class="sidebar-header">SECURE INBOX</div>
          <div class="msg-list">
    `;

    messagesData.forEach(msg => {
      listHTML += `
        <div class="msg-sidebar-item ${msg.id === activeMsgId ? 'active' : ''} ${msg.unread ? 'unread' : ''}" data-msg-id="${msg.id}">
          <div class="msg-item-avatar">${msg.sender[0]}</div>
          <div class="msg-item-info">
            <div class="msg-item-sender">${msg.sender}</div>
            <div class="msg-item-preview">${msg.text}</div>
          </div>
          ${msg.unread ? '<div class="msg-item-dot"></div>' : ''}
        </div>
      `;
    });

    listHTML += `
          </div>
        </div>
        <div class="messages-chat-pane" id="active-chat-container">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;

    appBodyContent.innerHTML = listHTML;

    // Attach click events
    const sidebarItems = appBodyContent.querySelectorAll(".msg-sidebar-item");
    sidebarItems.forEach(item => {
      item.addEventListener("click", () => {
        const msgId = parseInt(item.getAttribute("data-msg-id"));
        activeMsgId = msgId;
        
        sidebarItems.forEach(si => si.classList.remove("active"));
        item.classList.add("active");

        const msg = messagesData.find(m => m.id === msgId);
        if (msg && msg.unread) {
          msg.unread = false;
          item.classList.remove("unread");
          const dot = item.querySelector(".msg-item-dot");
          if (dot) dot.remove();

          messagesUnreadCount = Math.max(0, messagesUnreadCount - 1);
          updateAppBadgeCount();
          playSynthBeep("click");
          addConsoleLog(`BERICHT GELEZEN VAN ${msg.sender}`, "cyan");
        } else {
          playSynthBeep("click");
        }

        renderActiveChatPane(msgId);
      });
    });

    renderActiveChatPane(activeMsgId);
  }

  function renderActiveChatPane(msgId) {
    const chatContainer = document.getElementById("active-chat-container");
    if (!chatContainer) return;

    const msg = messagesData.find(m => m.id === msgId);
    if (!msg) {
      chatContainer.innerHTML = `<div class="chat-placeholder">Selecteer een bericht</div>`;
      return;
    }

    let chatHTML = `
      <div class="chat-header">
        <span class="chat-header-user">${msg.sender}</span>
        <span class="chat-header-status">VERBINDING: SECURE AES-256</span>
      </div>
      <div class="chat-body" id="chat-body-scroll">
        <div class="chat-bubble incoming">
          <div class="msg-text">${msg.text}</div>
          <div class="chat-bubble-time">${msg.time}</div>
        </div>
    `;

    if (userReplies[msgId]) {
      userReplies[msgId].forEach(reply => {
        chatHTML += `
          <div class="chat-bubble outgoing">
            <div class="msg-text">${reply.text}</div>
            <div class="chat-bubble-time">${reply.time}</div>
          </div>
        `;
      });
    }

    chatHTML += `
      </div>
      <div class="chat-footer">
        <input type="text" placeholder="Typ een veilig antwoord..." class="chat-input" id="chat-reply-input">
        <button class="chat-send-btn" id="btn-send-reply">VERSTUUR</button>
      </div>
    `;

    chatContainer.innerHTML = chatHTML;

    const chatBody = document.getElementById("chat-body-scroll");
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    const btnSend = document.getElementById("btn-send-reply");
    const chatInput = document.getElementById("chat-reply-input");

    const sendMessage = () => {
      const text = chatInput.value.trim();
      if (!text) return;

      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

      if (!userReplies[msgId]) {
        userReplies[msgId] = [];
      }
      userReplies[msgId].push({ sender: "AGENT CORNE", time: timeStr, text: text });
      
      chatInput.value = "";
      playSynthBeep("success");
      addConsoleLog(`ANTWOORD VERSTUURD NAAR ${msg.sender}`, "green");

      renderActiveChatPane(msgId);
    };

    if (btnSend && chatInput) {
      btnSend.addEventListener("click", sendMessage);
      chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          sendMessage();
        }
      });
    }
  }

  // ── APP SIMULATOR: 2. PROFILE APP ──
  function renderProfileApp() {
    const speedDemonUnlocked = true;
    const perfectLockUnlocked = true;
    const levelUnlocked = true;
    const shopaholicUnlocked = purchasedItems.size > 0;

    appBodyContent.innerHTML = `
      <div class="profile-dashboard">
        <div class="profile-dossier-card">
          <div class="profile-avatar-outer">
            <svg class="lvl-ring-svg" viewBox="0 0 80 80">
              <circle class="lvl-ring-bg" cx="40" cy="40" r="36" fill="none" stroke-width="4"></circle>
              <circle class="lvl-ring-fill" id="profile-ring-fill" cx="40" cy="40" r="36" fill="none" stroke-width="4" style="stroke-dashoffset: 226;"></circle>
            </svg>
            <div class="profile-avatar-inner">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
              </svg>
            </div>
            <div class="dossier-level-badge">4</div>
          </div>
          <div class="dossier-username">Agent Corne</div>
          <div class="dossier-rank">Elite Decryptor</div>
          
          <div class="dossier-details-table">
            <div class="dossier-row">
              <span class="lbl">Systeem Link:</span>
              <span class="val" style="color: var(--neon-cyan);">ACTIEF</span>
            </div>
            <div class="dossier-row">
              <span class="lbl">Decryptie IP:</span>
              <span class="val">192.168.88.4</span>
            </div>
            <div class="dossier-row">
              <span class="lbl">Last Login:</span>
              <span class="val">Vandaag</span>
            </div>
          </div>
        </div>

        <div class="profile-stats-pane">
          <div class="profile-stats-grid">
            <div class="profile-stat-box">
              <span class="profile-stat-num pink">82%</span>
              <span class="profile-stat-lbl">Missions XP</span>
            </div>
            <div class="profile-stat-box">
              <span class="profile-stat-num green">84</span>
              <span class="profile-stat-lbl">WPM Speed</span>
            </div>
            <div class="profile-stat-box">
              <span class="profile-stat-num cyan">98%</span>
              <span class="profile-stat-lbl">Accuracy</span>
            </div>
          </div>

          <div class="profile-achievements-header">PRESTATIES (ACHIEVEMENTS)</div>
          <div class="profile-achievements-grid">
            <div class="achievement-card ${speedDemonUnlocked ? 'unlocked' : ''}">
              <div class="achievement-icon">⚡</div>
              <div class="achievement-details">
                <div class="achievement-title">Speed Demon</div>
                <div class="achievement-desc">Behaal > 80 WPM</div>
              </div>
            </div>
            <div class="achievement-card ${perfectLockUnlocked ? 'unlocked' : ''}">
              <div class="achievement-icon">🎯</div>
              <div class="achievement-details">
                <div class="achievement-title">Perfect Lock</div>
                <div class="achievement-desc">> 95% Nauwkeurigheid</div>
              </div>
            </div>
            <div class="achievement-card ${levelUnlocked ? 'unlocked' : ''}">
              <div class="achievement-icon">🛡️</div>
              <div class="achievement-details">
                <div class="achievement-title">Decryptie Pro</div>
                <div class="achievement-desc">Behaal niveau 4</div>
              </div>
            </div>
            <div class="achievement-card ${shopaholicUnlocked ? 'unlocked' : ''}">
              <div class="achievement-icon">🛍️</div>
              <div class="achievement-details">
                <div class="achievement-title">Veld Uitrusting</div>
                <div class="achievement-desc">Koop gadget in de Shop</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      const ringFill = document.getElementById("profile-ring-fill");
      if (ringFill) {
        ringFill.style.strokeDashoffset = "40.68";
        ringFill.style.transition = "stroke-dashoffset 1s ease-out";
      }
    }, 50);
  }

  // ── APP SIMULATOR: 3. SECRET SHOP APP ──
  const shopCatalog = [
    { id: "laser_pen", name: "Laser Brandpen", desc: "Smelt stalen deursloten en barrières.", cost: 35, icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="18" x2="18" y2="6"></line><path d="M12 6h6v6"></path><circle cx="5" cy="19" r="1"></circle><path d="M18 6l3-3"></path><circle cx="21" cy="3" r="1"></circle></svg>` },
    { id: "cloner", name: "Keycard Simulator v3", desc: "Draadloos dupliceren van toegangspassen.", cost: 60, icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect><line x1="7" y1="8" x2="17" y2="8"></line><line x1="7" y1="12" x2="13" y2="12"></line><rect x="7" y="16" width="3" height="2"></rect></svg>` },
    { id: "tracker", name: "Nano GPS Bugs", desc: "Volg spionnen via RF signalen.", cost: 45, icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="14" rx="4"></rect><line x1="6" y1="6" x2="8" y2="7"></line><line x1="6" y1="10" x2="8" y2="10"></line><line x1="6" y1="14" x2="8" y2="13"></line><line x1="18" y1="6" x2="16" y2="7"></line><line x1="18" y1="10" x2="16" y2="10"></line><line x1="18" y1="14" x2="16" y2="13"></line><line x1="12" y1="16" x2="12" y2="22"></line></svg>` },
    { id: "goggles", name: "Nachtkijker Mod", desc: "Upgrade nachtvisie classificatie.", cost: 110, icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="4"></circle><circle cx="18" cy="12" r="4"></circle><line x1="10" y1="12" x2="14" y2="12"></line><path d="M6 8a6 6 0 0 1 12 0"></path></svg>` }
  ];

  function renderShopApp() {
    let shopHTML = `
      <div class="shop-catalog-layout">
        <div class="shop-balance-bar">
          <span class="shop-balance-title">GEHEIME UITRUSTINGEN WINKEL</span>
          <div class="shop-balance-coins">
            <span id="shop-coins-val">${typingCoins}</span>
            <div class="coin-icon"></div>
          </div>
        </div>
        <div class="shop-catalog-grid">
    `;

    shopCatalog.forEach(item => {
      const isOwned = purchasedItems.has(item.id);
      shopHTML += `
        <div class="gadget-card">
          <div class="gadget-icon-wrapper">
            ${item.icon}
          </div>
          <div class="gadget-info">
            <div class="gadget-name">${item.name}</div>
            <div class="gadget-desc">${item.desc}</div>
          </div>
          <div class="gadget-buy-section">
            <span class="gadget-price">${item.cost} <div class="gadget-price-dot"></div></span>
            <button class="gadget-btn ${isOwned ? 'purchased' : ''}" 
                    data-shop-id="${item.id}" 
                    data-cost="${item.cost}" 
                    ${isOwned ? 'disabled' : ''}>
              ${isOwned ? 'GEKOCHT' : 'KOOP'}
            </button>
          </div>
        </div>
      `;
    });

    shopHTML += `
        </div>
      </div>
    `;

    appBodyContent.innerHTML = shopHTML;

    appBodyContent.querySelectorAll(".gadget-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const itemId = btn.getAttribute("data-shop-id");
        const cost = parseInt(btn.getAttribute("data-cost"));
        const item = shopCatalog.find(i => i.id === itemId);

        if (purchasedItems.has(itemId)) return;

        if (typingCoins >= cost) {
          typingCoins -= cost;
          purchasedItems.add(itemId);
          
          playSynthBeep("success");

          document.getElementById("shop-coins-val").textContent = typingCoins;
          btn.textContent = "GEKOCHT";
          btn.classList.add("purchased");
          btn.disabled = true;

          addConsoleLog(`GELUKT: ${item.name.toUpperCase()} AANGESCHAFT`, "green");
        } else {
          playSynthBeep("denied");
          btn.classList.add("lock-shake");
          setTimeout(() => btn.classList.remove("lock-shake"), 400);
          addConsoleLog("Mislukt: Saldo ontoereikend", "red");
        }
      });
    });
  }

  // ── APP SIMULATOR: 4. GPS RADAR APP ──
  function renderGPSApp() {
    appBodyContent.innerHTML = `
      <div class="gps-radar-layout">
        <div class="radar-display-panel">
          <div class="radar-ring-outer" id="radar-ripple-container">
            <div class="radar-ring-east">90°</div>
            <div class="radar-ring-west">270°</div>
            <div class="radar-grid-line radar-line-h"></div>
            <div class="radar-grid-line radar-line-v"></div>
            <div class="radar-grid-circle radar-circle-1"></div>
            <div class="radar-grid-circle radar-circle-2"></div>
            <div class="radar-grid-circle radar-circle-3"></div>
            <div class="radar-sweep-bar"></div>
            <div class="radar-blip radar-target-1" id="blip-1"></div>
            <div class="radar-blip radar-target-2" id="blip-2"></div>
            <div class="radar-blip radar-target-3" id="blip-3"></div>
          </div>
        </div>
        <div class="radar-hud-readout">
          <div class="hud-title">TACTISCHE SCANNER v8.2</div>
          <div class="hud-list">
            <div class="hud-item">
              <span class="hud-item-name">TARGET ALPHA</span>
              <span class="hud-item-dist" id="dist-target-1">142m</span>
              <span class="hud-item-state active">BEWEEGT</span>
            </div>
            <div class="hud-item">
              <span class="hud-item-name">TARGET BETA</span>
              <span class="hud-item-dist" id="dist-target-2">418m</span>
              <span class="hud-item-state active">STATISCH</span>
            </div>
            <div class="hud-item">
              <span class="hud-item-name">TARGET GAMMA</span>
              <span class="hud-item-dist" id="dist-target-3">815m</span>
              <span class="hud-item-state active">STATIONAIR</span>
            </div>
          </div>
          <button id="btn-radar-ping" class="settings-action-btn" style="margin-top: 4px;">VERSTUUR SCAN-PING</button>
        </div>
      </div>
    `;

    const distTarget1 = document.getElementById("dist-target-1");
    const distTarget2 = document.getElementById("dist-target-2");
    const distTarget3 = document.getElementById("dist-target-3");

    const driftInterval = setInterval(() => {
      if (!distTarget1 || !distTarget2 || !distTarget3 || !document.getElementById("btn-radar-ping")) {
        clearInterval(driftInterval);
        return;
      }
      
      const val1 = Math.round(140 + (Math.random() - 0.5) * 8);
      const val2 = Math.round(418 + (Math.random() - 0.5) * 4);
      const val3 = Math.round(815 + (Math.random() - 0.5) * 6);

      distTarget1.textContent = `${val1}m`;
      distTarget2.textContent = `${val2}m`;
      distTarget3.textContent = `${val3}m`;
    }, 1800);

    const btnPing = document.getElementById("btn-radar-ping");
    btnPing.addEventListener("click", () => {
      playSynthBeep("radar");
      addConsoleLog("TACTISCH SCAN-PINGSIGNAAL EMITTEERT...", "cyan");

      const blips = appBodyContent.querySelectorAll(".radar-blip");
      blips.forEach(blip => {
        blip.style.transform = "translate(-50%, -50%) scale(2.8)";
        blip.style.filter = "brightness(2) drop-shadow(0 0 10px var(--neon-cyan))";
        blip.style.transition = "transform 0.12s ease-out, filter 0.12s ease-out";

        setTimeout(() => {
          blip.style.transform = "translate(-50%, -50%) scale(1)";
          blip.style.filter = "none";
          blip.style.transition = "transform 1.4s ease-out, filter 1.4s ease-out";
        }, 150);
      });

      const container = document.getElementById("radar-ripple-container");
      if (container) {
        const ripple = document.createElement("div");
        ripple.style.position = "absolute";
        ripple.style.border = "2px solid var(--neon-cyan)";
        ripple.style.borderRadius = "50%";
        ripple.style.width = "0%";
        ripple.style.height = "0%";
        ripple.style.top = "50%";
        ripple.style.left = "50%";
        ripple.style.transform = "translate(-50%, -50%)";
        ripple.style.pointerEvents = "none";
        ripple.style.opacity = "0.8";
        ripple.style.transition = "width 1.2s ease-out, height 1.2s ease-out, opacity 1.2s ease-out";
        
        container.appendChild(ripple);
        ripple.offsetHeight; // Reflow

        ripple.style.width = "100%";
        ripple.style.height = "100%";
        ripple.style.opacity = "0";

        setTimeout(() => {
          ripple.remove();
        }, 1300);
      }
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
