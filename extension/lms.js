// =====================================================================
// IUH Fast Login — content script cho LMS (Moodle)
// ---------------------------------------------------------------------
// Chạy trên https://lms.iuh.edu.vn/login/index.php
//
// Khác với sv.iuh.edu.vn:
//   - LMS là Moodle, KHÔNG có captcha, KHÔNG mã hoá mật khẩu.
//   - Chỉ cần điền username/password rồi bấm nút Đăng nhập.
// =====================================================================

(() => {
  "use strict";

  const api = globalThis.browser ?? globalThis.chrome;
  if (!api || !api.storage) return;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (sel) => document.querySelector(sel);

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

  function setValue(el, value) {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype, "value"
    )?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function main() {
    const cfg = await getStorage({ username: "", password: "", autoLogin: true });
    if (!cfg.username || !cfg.password) return;
    if (!cfg.autoLogin) return;

    let userEl = $("#username") || $("input[name=username]");
    let passEl = $("#password") || $("input[name=password]");
    if (!userEl || !passEl) {
      for (let i = 0; i < 30; i++) {
        await sleep(50);
        userEl = $("#username") || $("input[name=username]");
        passEl = $("#password") || $("input[name=password]");
        if (userEl && passEl) break;
      }
    }
    if (!userEl || !passEl) return;

    banner("IUH LMS: đang tự động đăng nhập...", "#0b6e99");
    setValue(userEl, cfg.username);
    setValue(passEl, cfg.password);
    await sleep(100);

    const btn = $("#loginbtn") ||
      $("form#login button[type=submit]") ||
      $("form#login input[type=submit]") ||
      $("button[type=submit]");
    if (btn) btn.click();
    else {
      const form = $("#login") || $("form");
      if (form) form.submit();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main, { once: true });
  } else {
    main();
  }
})();
