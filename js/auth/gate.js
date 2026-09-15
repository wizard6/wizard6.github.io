/**
 * Asymmetric gate: password unwraps RSA private key, then decrypts challenge.
 * Password is never stored in the repo; only salt + ciphertext live in config/auth.json.
 */

const SESSION_KEY = "wb_gate_v1";

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function pemToPkcs8(pem) {
  const b64 = String(pem)
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  return b64ToBytes(b64);
}

async function loadAuthConfig() {
  const res = await fetch("./config/auth.json?v=" + Date.now());
  if (!res.ok) throw new Error("auth config missing");
  return res.json();
}

async function unlockWithPassword(password, auth) {
  const enc = new TextEncoder();
  const salt = b64ToBytes(auth.salt);
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const aesKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: auth.iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  let privPemBytes;
  try {
    privPemBytes = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(auth.wrap.iv) },
      aesKey,
      b64ToBytes(auth.wrap.ciphertext)
    );
  } catch (_) {
    throw new Error("口令错误");
  }

  const privPem = new TextDecoder().decode(privPemBytes);
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(privPem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );

  let plainBuf;
  try {
    plainBuf = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      b64ToBytes(auth.challenge.ciphertext)
    );
  } catch (_) {
    throw new Error("解密失败");
  }

  const plain = new TextDecoder().decode(plainBuf);
  if (plain !== auth.gateId) throw new Error("校验失败");
  return true;
}

function isUnlocked() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "ok";
  } catch (_) {
    return false;
  }
}

function setUnlocked() {
  try {
    sessionStorage.setItem(SESSION_KEY, "ok");
  } catch (_) {}
}

function mountGateUI() {
  if (document.getElementById("auth-gate")) return;
  const el = document.createElement("div");
  el.id = "auth-gate";
  el.className = "auth-gate";
  el.innerHTML = `
    <div class="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div class="auth-kicker">CLOUD WORKBENCH</div>
      <h1 id="auth-title">需要口令</h1>
      <p class="auth-desc">非对称门禁：口令解开私钥，再解密挑战。口令不在前端明文中。</p>
      <form class="auth-form" id="auth-form">
        <label class="auth-label" for="auth-pass">口令</label>
        <input id="auth-pass" class="auth-input" type="password" autocomplete="current-password" required autofocus />
        <button class="auth-btn" type="submit">进入</button>
        <p class="auth-error" id="auth-error" hidden></p>
      </form>
    </div>
  `;
  document.body.appendChild(el);
  document.documentElement.classList.add("is-locked");
  return el;
}

function removeGateUI() {
  document.getElementById("auth-gate")?.remove();
  document.documentElement.classList.remove("is-locked");
}

/**
 * Block until unlocked. Resolves when session is valid or password succeeds.
 */
export async function requireGate() {
  if (isUnlocked()) {
    removeGateUI();
    return;
  }

  const auth = await loadAuthConfig();
  mountGateUI();
  const form = document.getElementById("auth-form");
  const input = document.getElementById("auth-pass");
  const err = document.getElementById("auth-error");

  await new Promise((resolve) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.hidden = true;
      const btn = form.querySelector(".auth-btn");
      btn.disabled = true;
      btn.textContent = "校验中…";
      try {
        await unlockWithPassword(input.value, auth);
        setUnlocked();
        removeGateUI();
        resolve();
      } catch (ex) {
        err.textContent = ex.message || "无法解锁";
        err.hidden = false;
        input.select();
      } finally {
        btn.disabled = false;
        btn.textContent = "进入";
      }
    });
  });
}
