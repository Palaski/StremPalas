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

function log(msg) {
  console.log(msg);
  logEl.textContent += new Date().toLocaleTimeString() + ": " + msg + "
";
  logEl.scrollTop = logEl.scrollHeight;
}

function showUI(show) {
  ui.style.display = show ? 'block' : 'none';
  player.classList.toggle('hidden', show);
}

statusEl.textContent = "Carregado OK!";

// Token
tokenInput.addEventListener("input", () => {
  apiKey = tokenInput.value.trim();
  if (apiKey.length > 20) {
    log("✅ Token OK");
  }
});

// Add Torrent
btnAdd.addEventListener("click", addTorrent);

async function addTorrent() {
  if (!apiKey) {
    statusEl.textContent = "❌ Token vazio";
    return;
  }
  if (!magnetInput.value.trim()) {
    statusEl.textContent = "❌ Magnet vazio";
    return;
  }

  const magnet = magnetInput.value.trim();
  try {
    statusEl.textContent = "🔄 Adicionando...";
    
    // 1. Add magnet
    const resp1 = await fetch("https://api.real-debrid.com/rest/1.0/torrents/addMagnet", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ magnet })
    });
    
    const data1 = await resp1.json();
    currentTorrentId = data1.id;
    log("Torrent ID: " + currentTorrentId);
    
    // 2. Select files (primeiro arquivo)
    await fetch(`https://api.real-debrid.com/rest/1.0/torrents/${currentTorrentId}/selectFiles`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    
    // 3. Get stream links
    const resp3 = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/${currentTorrentId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    
    const data3 = await resp3.json();
    streamUrl = data3.links[0]; // Primeiro HLS
    
    statusEl.textContent = "✅ Pronto! Clique ▶️";
    btnPlay.style.display = "block";
    
  } catch (e) {
    log("❌ Erro: " + e.message);
    statusEl.textContent = "❌ " + e.message;
  }
}

// Play
btnPlay.addEventListener("click", () => {
  if (!streamUrl) {
    statusEl.textContent = "❌ Sem stream. Adicione torrent primeiro.";
    return;
  }
  
  player.src = streamUrl;
  player.play();
  showUI(false); // Esconde UI, mostra player fullscreen
  log("▶️ Tocando: " + streamUrl.substring(0,50) + "...");
});

// Teclas remotas
try {
  if (window.tizen && tizen.tvinputdevice) {
    tizen.tvinputdevice.registerKeyBatch(["MediaPlayPause", "VolumeUp", "VolumeDown"], 
      () => log("✅ Teclas remotas OK"),
      (err) => log("❌ Teclas: " + err.name)
    );
  }
} catch (e) {
  log("ℹ️ tizen.tvinputdevice: " + e);
}

window.addEventListener("keydown", (e) => {
  if (e.key === "MediaPlayPause" || e.code === "Space") {
    if (player.paused) player.play();
    else player.pause();
  }
  
  log("Tecla: " + e.code);
});

// Player events
player.addEventListener("play", () => log("▶️ Tocando"));
player.addEventListener("pause", () => log("⏸️ Pausado"));
player.addEventListener("error", (e) => {
  log("❌ Player error: " + e);
  showUI(true);
});

log("🚀 StremPalas pronto!");
