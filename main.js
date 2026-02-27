// REGISTRA TECLAS PRIMEIRO (antes de qualquer coisa)
if (window.tizen && tizen.tvinputdevice) {
  const keys = [
    "Enter", "Back", "ArrowLeft", "ArrowRight", 
    "ArrowUp", "ArrowDown", "VolumeUp", "VolumeDown", 
    "MediaPlayPause"
  ];
  tizen.tvinputdevice.registerKeyBatch(keys);
}

const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const tokenInput = document.getElementById('token');
const magnetInput = document.getElementById('magnet');
const btnAdd = document.getElementById('btnAdd');
const btnPlay = document.getElementById('btnPlay');
const player = document.getElementById('player');
const ui = document.getElementById('ui');

let apiKey = "";
let currentTorrentId = null;
let streamUrl = null;
let focusedBtn = btnAdd; // Controle remoto

function log(msg) {
  console.log(msg);
  logEl.textContent += new Date().toLocaleTimeString() + ": " + msg + "
";
  logEl.scrollTop = logEl.scrollHeight;
}

function focusBtn(btn) {
  focusedBtn.classList.remove('focused');
  focusedBtn = btn;
  btn.classList.add('focused');
  log("Foco: " + btn.id);
}

function showUI(show) {
  ui.style.display = show ? 'block' : 'none';
  player.classList.toggle('hidden', show);
}

// Foco inicial
focusBtn(btnAdd);

// Navegação teclado
window.addEventListener("keydown", (e) => {
  log("Tecla: " + e.code);
  
  if (player.classList.contains('hidden')) { // UI visível
    switch(e.code) {
      case "ArrowDown":
        e.preventDefault();
        if (focusedBtn === btnAdd && btnPlay.style.display !== 'none') focusBtn(btnPlay);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (focusedBtn === btnPlay) focusBtn(btnAdd);
        break;
      case "Enter":
      case "Space":
      case "MediaPlayPause":
        e.preventDefault();
        focusedBtn.click();
        break;
    }
  } else { // Player fullscreen
    switch(e.code) {
      case "MediaPlayPause":
      case "Space":
        e.preventDefault();
        if (player.paused) player.play();
        else player.pause();
        break;
      case "Back":
        showUI(true);
        break;
    }
  }
});

// Token
tokenInput.addEventListener("input", () => {
  apiKey = tokenInput.value.trim();
});

// TORBOX API (não Real-Debrid)
btnAdd.addEventListener("click", addTorboxTorrent);

async function addTorboxTorrent() {
  if (!apiKey) {
    statusEl.textContent = "❌ Token Torbox vazio";
    return;
  }
  
  const magnet = magnetInput.value.trim();
  try {
    statusEl.textContent = "🔄 Adicionando no Torbox...";
    
    // Torbox API: cria torrent
    const resp = await fetch("https://api.torbox.app/api/v1/torrents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        magnet: magnet,
        save_path: "/downloads"
      })
    });
    
    const data = await resp.json();
    if (data.id) {
      currentTorrentId = data.id;
      log("✅ Torbox ID: " + currentTorrentId);
      
      // Polling pra stream pronto (Torbox demora ~1min)
      pollTorboxStream();
    } else {
      throw new Error(data.message || "Erro Torbox");
    }
    
  } catch (e) {
    log("❌ Torbox: " + e.message);
    statusEl.textContent = "❌ " + e.message;
  }
}

async function pollTorboxStream() {
  const check = async () => {
    try {
      const resp = await fetch(`https://api.torbox.app/api/v1/torrents/${currentTorrentId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });
      const data = await resp.json();
      
      if (data.status === "downloading" || data.progress < 100) {
        statusEl.textContent = `⏳ ${data.progress}% baixado...`;
        setTimeout(check, 5000); // Poll 5s
      } else {
        // Pronto! Pega stream link
        streamUrl = data.stream_url || data.content_path;
        statusEl.textContent = "✅ Pronto! ▶️";
        btnPlay.style.display = "block";
        focusBtn(btnPlay);
      }
    } catch (e) {
      log("Poll erro: " + e);
    }
  };
  check();
}

// Play
btnPlay.addEventListener("click", () => {
  player.src = streamUrl;
  player.play();
  showUI(false);
});

// Player events
player.addEventListener("loadedmetadata", () => log("📹 Metadata carregada"));
player.addEventListener("play", () => log("▶️ Tocando"));
player.addEventListener("error", (e) => {
  log("❌ Player: " + player.error?.message);
  showUI(true);
});

log("🚀 StremPalas + Torbox pronto!");
