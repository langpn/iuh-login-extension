// =====================================================================
// IUH Fast Login — content script
// ---------------------------------------------------------------------
// Chạy trên https://sv.iuh.edu.vn/sinh-vien-dang-nhap.html
//
// Nhiệm vụ:
//   1. Đọc MSSV + mật khẩu đã lưu trong storage.
//   2. Điền vào form rồi bấm nút "Đăng nhập".
//   3. Để CHÍNH JS CỦA TRANG mã hoá mật khẩu lúc submit (không tự mã hoá).
//
// Captcha: ảnh captcha đã bị chặn ở tầng mạng (rules.json), nên server
// không bật kiểm tra captcha cho phiên này.
// =====================================================================

(() => {
  "use strict";

  const api = globalThis.browser ?? globalThis.chrome;
  if (!api || !api.storage) return;

  const STATE_KEY = "iuh_fl_state";   // lưu trong sessionStorage
  const RETRY_WINDOW_MS = 60000;      // còn trong 60s thì coi là lần thử lại
  const MAX_ATTEMPTS = 2;             // tối đa 2 lần tự động cho mỗi tab
  const RETRY_WAIT_MS = 11000;        // server giới hạn tần suất ~10s

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- storage (hỗ trợ cả callback của Chrome lẫn Promise) ----------
  function getStorage(defaults) {
    return new Promise((resolve) => {
      try {
        const maybe = api.storage.local.get(defaults);
        if (maybe && typeof maybe.then === "function") {
          maybe.then((v) => resolve(v || defaults), () => resolve(defaults));
        } else {
          api.storage.local.get(defaults, (v) => resolve(v || defaults));
        }
      } catch (e) {
        resolve(defaults);
      }
    });
  }

  // ---------- banner nhỏ ở góc trên ----------
  function banner(text, color) {
    let el = document.getElementById("iuh-fl-banner");
    if (!el) {
      el = document.createElement("div");
      el.id = "iuh-fl-banner";
      el.style.cssText = [
        "position:fixed", "z-index:2147483647", "top:12px", "left:50%",
        "transform:translateX(-50%)", "padding:8px 14px", "border-radius:6px",
        "font:13px/1.4 system-ui,sans-serif", "color:#fff",
        "box-shadow:0 2px 10px rgba(0,0,0,.25)", "max-width:90vw",
        "text-align:center", "pointer-events:none",
      ].join(";");
      (document.body || document.documentElement).appendChild(el);
    }
    el.style.background = color || "#333";
    el.textContent = text;
    return el;
  }

  const $ = (sel) => document.querySelector(sel);

  // Đặt giá trị "thân thiện" với jQuery/framework của trang.
  function setValue(el, value) {
    const proto = HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function main() {
    const cfg = await getStorage({ username: "", password: "", autoLogin: true });

    if (!cfg.username || !cfg.password) {
      banner("IUH: chưa lưu tài khoản — mở tiện ích để nhập.", "#b00020");
      return;
    }
    if (!cfg.autoLogin) return;

    // Chờ form xuất hiện (nhanh chóng bắt ngay khi có)
    let userEl = $("#UserName") || $("input[name=UserName]");
    let passEl = $("#Password") || $("input[name=Password]");
    if (!userEl || !passEl) {
      for (let i = 0; i < 30; i++) {
        await sleep(50);
        userEl = $("#UserName") || $("input[name=UserName]");
        passEl = $("#Password") || $("input[name=Password]");
        if (userEl && passEl) break;
      }
    }
    if (!userEl || !passEl) {
      banner("IUH: không tìm thấy form đăng nhập.", "#b00020");
      return;
    }

    // Đếm số lần thử trong tab này (sessionStorage sống qua điều hướng).
    let state = null;
    try { state = JSON.parse(sessionStorage.getItem(STATE_KEY) || "null"); } catch (e) {}
    const now = Date.now();
    let attempts = (state && now - state.t < RETRY_WINDOW_MS) ? (state.n || 0) : 0;

    if (attempts >= MAX_ATTEMPTS) {
      banner("IUH: đã thử 2 lần nhưng chưa vào được. Kiểm tra lại tài khoản.", "#b00020");
      return;
    }

    // Lần thử lại => chờ cho hết giới hạn tần suất.
    if (attempts > 0) {
      const wait = Math.min(RETRY_WAIT_MS, 6000 + attempts * 5000);
      banner(`IUH: chờ ${Math.round(wait / 1000)}s rồi thử lại...`, "#a15c00");
      await sleep(wait);
    } else {
      banner("IUH: đang tự động đăng nhập...", "#0b6e99");
    }

    sessionStorage.setItem(STATE_KEY, JSON.stringify({ n: attempts + 1, t: Date.now() }));

    setValue(userEl, cfg.username);
    setValue(passEl, cfg.password);

    const cap = $("#Captcha") || $("input[name=Captcha]");
    if (cap) setValue(cap, ""); // để trống — server đã bỏ qua captcha

    await sleep(120);

    const btn = $(
      "#btnLogin, form#form-login button[type=submit], " +
      "form#form-login input[type=submit], button[type=submit], input[type=submit]"
    );
    if (btn) btn.click();
    else {
      const form = $("#form-login") || $("form");
      if (form) form.submit();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main, { once: true });
  } else {
    main();
  }
})();
