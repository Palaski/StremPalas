console.log("=== StremPalas carregado ===");

const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const tokenInput = document.getElementById('token');
const magnetInput = document.getElementById('magnet');
const btnAdd = document.getElementById('btnAdd');

let apiKey = "";

function log(msg) {
  console.log(msg);
  logEl.textContent += new Date().toLocaleTimeString() + ": " + msg + "
";
  logEl.scrollTop = logEl.scrollHeight;
}

statusEl.textContent = "JS carregado OK.";

// Token
tokenInput.addEventListener("change", () => {
  apiKey = tokenInput.value.trim();
  if (apiKey) {
    log("✅ Token configurado (" + apiKey.substring(0,8) + "...)");
  }
});

// Teclas (TVInputDevice)
try {
  if (window.tizen && tizen.tvinputdevice) {
    const keys = ["VolumeUp", "VolumeDown", "MediaPlayPause"];
    tizen.tvinputdevice.registerKeyBatch(keys,
      () => log("✅ Teclas registradas: " + keys.join(", ")),
      (err) => log("❌ Erro teclas: " + err.name)
    );
  }
} catch (e) {
  log("ℹ️ tizen.tvinputdevice não disponível (normal fora da TV)");
}

// Eventos teclado
window.addEventListener("keydown", (ev) => {
  log("⌨️ Key: " + ev.key + " (code: " + ev.keyCode + ")");
});

// Botão Add Torrent
btnAdd.addEventListener("click", () => {
  if (!apiKey) {
    statusEl.textContent = "❌ Configure o token primeiro";
    return;
  }
  if (!magnetInput.value.trim()) {
    statusEl.textContent = "❌ Digite um magnet link";
    return;
  }
  addTorrent();
});

async function addTorrent() {
  const magnet = magnetInput.value.trim();
  try {
    statusEl.textContent = "🔄 Adicionando torrent...";
    
    const resp = await fetch("https://api.real-debrid.com/rest/1.0/torrents/addMagnet", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ magnet })
    });
    
    const data = await resp.json();
    log("✅ Torrent adicionado: ID=" + data.id);
    statusEl.textContent = "✅ Torrent ID: " + data.id;
    
  } catch (e) {
    log("❌ Erro: " + e.message);
    statusEl.textContent = "❌ Erro: " + e.message;
  }
}

log("🚀 StremPalas pronto!");
statusEl.textContent = "✅ Pronto para usar!";
