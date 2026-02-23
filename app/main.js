const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');

function log(msg) {
  logEl.textContent += msg + "
";
}

// TVInputDevice: registra algumas teclas
try {
  const keys = ["VolumeUp", "VolumeDown", "MediaPlayPause"];
  if (window.tizen && tizen.tvinputdevice) {
    tizen.tvinputdevice.registerKeyBatch(keys, () => {
      log("Teclas registradas: " + keys.join(", "));
    }, (err) => {
      log("Erro ao registrar teclas: " + err.name);
    });
  } else {
    log("tizen.tvinputdevice não disponível (ok em browser, mas na TV deve existir).");
  }
} catch (e) {
  log("Exceção TVInputDevice: " + e);
}

window.addEventListener("keydown", (ev) => {
  log("Keydown: " + ev.keyCode);
});

statusEl.textContent = "App iniciado.";
