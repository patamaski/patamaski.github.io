/*************************************************************
 * ONE PARAMETER TO CONTROL ALL ANIMATION SPEED
 * Bigger = slower
 *************************************************************/
const ANIM_SPEED = 10; // <-- change this! (1 = fast, 5 = 5x slower)

function scaled(ms) {
  return ms * ANIM_SPEED;
}

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const statusEl = document.getElementById("status");
const modeSelect = document.getElementById("mode");
const loader = document.getElementById("loader");

const logoWrap = document.getElementById("logoWrap");
const activateText = document.getElementById("activateText");
const ui = document.getElementById("ui");
const ppoLogo = document.getElementById("ppoLogo");

const flashOverlay = document.getElementById("flashOverlay");
const tearLine = document.getElementById("tearLine");
const bootText = document.getElementById("bootText");

const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");

const particlesCanvas = document.getElementById("particles");
const pctx = particlesCanvas.getContext("2d");

const osoite = "patamaski-github-io";

const loadingSound = new Audio("./loading.wav");
loadingSound.volume = 0.9;

let activated = false;
let currentUtterance = null;

/* PARTICLES */
function resizeParticles() {
  particlesCanvas.width = window.innerWidth;
  particlesCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeParticles);
resizeParticles();

let particles = [];
let particlesRunning = false;

function spawnParticles(x, y) {
  const amount = 120;

  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 8;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 120 + Math.random() * 80,
      size: 1 + Math.random() * 3,
      glow: Math.random() > 0.5
    });
  }

  if (!particlesRunning) {
    particlesRunning = true;
    requestAnimationFrame(updateParticles);
  }
}

function updateParticles() {
  pctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.x += p.vx;
    p.y += p.vy;

    p.vx *= 0.98;
    p.vy *= 0.98;
    p.vy += 0.02;

    p.life -= 1;

    const alpha = Math.max(0, p.life / 160);

    pctx.beginPath();
    pctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

    if (p.glow) {
      pctx.fillStyle = `rgba(88,255,177,${alpha})`;
    } else {
      pctx.fillStyle = `rgba(75,180,255,${alpha})`;
    }

    pctx.fill();

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  if (particles.length > 0) {
    requestAnimationFrame(updateParticles);
  } else {
    particlesRunning = false;
  }
}

/* CHAT */
function appendChat(role, text) {
  const prefix = role === "user" ? "🧑 " : "🤖 ";
  chatBox.textContent += prefix + text + "\n\n";
  chatBox.scrollTop = chatBox.scrollHeight;
}

function setLoading(isLoading) {
  loader.style.display = isLoading ? "inline-block" : "none";
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;

  try {
    if (currentUtterance) {
      window.speechSynthesis.cancel();
    }

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = "fi-FI";
    currentUtterance.rate = 1.02;
    currentUtterance.pitch = 1.0;

    currentUtterance.onend = () => {
      currentUtterance = null;
    };

    window.speechSynthesis.speak(currentUtterance);

  } catch (err) {
    console.warn("Speech error:", err);
  }
}

function playLoadingSound() {
  loadingSound.currentTime = 0;
  loadingSound.play().catch(() => {});
}

/* FX */
function screenShake() {
  document.body.classList.remove("shake");
  void document.body.offsetWidth;
  document.body.classList.add("shake");

  setTimeout(() => {
    document.body.classList.remove("shake");
  }, scaled(650));
}

function showFlash() {
  flashOverlay.style.opacity = "1";
  screenShake();

  setTimeout(() => {
    flashOverlay.style.opacity = "0";
  }, scaled(550));
}

function showTear() {
  tearLine.classList.remove("tearAnim");
  void tearLine.offsetWidth;
  tearLine.classList.add("tearAnim");
}

function startBootSequence() {
  const lines = [
    "PPO-YDIN KÄYNNISSÄ...",
    "REVONTULIYHTEYS MUODOSTETTU...",
    "OU LU -SOLMU YHDISTETTY...",
    "PAKKASPROTOKOLLA AKTIVOITU...",
    "TURUN PALOMUURI OHITETTU...",
    "PPO-AI VALMIINA."
  ];

  bootText.textContent = "";
  bootText.classList.add("show");

  let i = 0;
  const interval = setInterval(() => {
    bootText.textContent += lines[i] + "\n";
    i++;
    if (i >= lines.length) clearInterval(interval);
  }, scaled(80));
}

function hideBootSequence() {
  bootText.style.opacity = "0";
  bootText.style.transform = "translateY(10px)";

  setTimeout(() => {
    bootText.classList.remove("show");
    bootText.style.display = "none";
  }, scaled(90));
}

/* UI ACTIVATE */
function activateUI() {
  if (activated) return;
  activated = true;

  playLoadingSound();

  const rect = ppoLogo.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  spawnParticles(centerX, centerY);

  activateText.style.opacity = "0";

  showFlash();
  showTear();
  startBootSequence();

  ppoLogo.style.width = "min(240px, 70vw)";
  ppoLogo.style.opacity = "0.95";
  ppoLogo.style.transform = "translateY(-25px) scale(0.98)";

  setTimeout(() => {
    ui.style.display = "block";
    activateText.style.display = "none";
    userInput.focus();

    setTimeout(() => {
      hideBootSequence();
    }, scaled(1));

  }, scaled(650));

  setTimeout(() => {
  userInput.focus();
}, 200);
}

logoWrap.onclick = activateUI;

/* SETTINGS */
settingsBtn.onclick = () => {
  settingsPanel.style.display =
    (settingsPanel.style.display === "block") ? "none" : "block";
};

/* BACKEND */
let requestInProgress = false;

async function askBackend(text) {
  console.log("askBackend called:", text);
  
  if (requestInProgress) return;

  const backend = "https://" + osoite + ".onrender.com";

  requestInProgress = true;

  appendChat("user", text);
  statusEl.textContent = "Analysoidaan...";
  setLoading(true);

  try {
    const res = await fetch(backend + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        mode: modeSelect.value
      })
    });

    const raw = await res.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { reply: raw };
    }

    if (!res.ok) {
      appendChat("assistant", "Virhe: " + (data.error || "tuntematon virhe"));
      statusEl.textContent = "Virhe.";
      return;
    }

    if (!data.reply) {
      appendChat("assistant", "Virhe: backend ei palauttanut reply-kenttää.");
      statusEl.textContent = "Virhe.";
      return;
    }

    appendChat("assistant", data.reply);
    speak(data.reply);

    statusEl.textContent = "Valmis.";

  } catch (err) {
    console.error(err);
    appendChat("assistant", "Backend ei vastaa. Oisko Oulu jäässä?");
    statusEl.textContent = "Ei yhteyttä.";

  } finally {
    requestInProgress = false;
    setLoading(false);
  }
}

/* INPUT ENTER HANDLING */
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    document.getElementById("askBtn").click();
  }
});

/* BUTTONS */
document.getElementById("askBtn").onclick = () => {
  const text = userInput.value.trim();
  if (!text) return;

  userInput.value = "";
  askBackend(text);
};

document.getElementById("clearBtn").onclick = () => {
  chatBox.textContent = "";
  userInput.value = "";
  window.speechSynthesis.cancel();
  statusEl.textContent = "Tyhjennetty.";
  setLoading(false);
};

/* SPEECH */
let recognition = null;
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = "fi-FI";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    statusEl.textContent = "Kuuntelen...";
    setLoading(true);
  };

  recognition.onend = () => {
    statusEl.textContent = "Kuuntelu loppui.";
    setLoading(false);
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    if (!transcript) return;

    userInput.value = "";
    askBackend(transcript);
  };
} else {
  statusEl.textContent = "Puhe ei toimi tässä selaimessa.";
}

document.getElementById("talkBtn").onclick = () => {
  if (!recognition) {
    alert("Puheentunnistus ei toimi. Kokeile Chromea.");
    return;
  }
  recognition.start();
};

document.getElementById("stopBtn").onclick = () => {
  if (recognition) recognition.stop();
  window.speechSynthesis.cancel();
  statusEl.textContent = "Pysäytetty.";
  setLoading(false);
};