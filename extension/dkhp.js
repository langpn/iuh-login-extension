// =====================================================================
// IUH Fast Login — content script cho Đăng ký học phần (DKHP)
// ---------------------------------------------------------------------
// Chạy trên https://dkhp.iuh.edu.vn/Account/Login
//
// Khác với cổng SV và LMS:
//   - DKHP là hệ ASCVN khác, KHÔNG dùng chung phiên với cổng SV.
//   - Server LUÔN kiểm tra captcha ("Mã bảo vệ") ở phía server, nên không
//     thể bỏ qua captcha như cổng SV.
//   - Mật khẩu do JS của chính trang mã hoá (AES + khoá từ GetPrivateKey)
//     ngay lúc submit.
//
// Vì vậy script này chỉ:
//   1. Điền sẵn MSSV + mật khẩu đã lưu.
//   2. Đưa con trỏ vào ô "Mã bảo vệ" để bạn gõ captcha.
//   3. Cho phép bấm Enter ở ô captcha để đăng nhập ngay.
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

  // Đặt giá trị "thân thiện" với jQuery/framework của trang.
  function setValue(el, value) {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype, "value"
    )?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function submit() {
    const btn = $("#btnLogin") ||
      $("form#form-login button[type=submit]") ||
      $("form#form-login input[type=submit]");
    if (btn) btn.click();
    else {
      const form = $("#form-login") || $("form");
      if (form) form.submit();
    }
  }

  async function main() {
    const cfg = await getStorage({ username: "", password: "", autoLogin: true });
    if (!cfg.username || !cfg.password) {
      banner("IUH ĐKHP: chưa lưu tài khoản — mở tiện ích để nhập.", "#b00020");
      return;
    }
    if (!cfg.autoLogin) return;

    // Trang dùng jQuery, form có thể render chậm.
    let userEl = null, passEl = null, capEl = null;
    for (let i = 0; i < 40; i++) {
      userEl = $("#UserName") || $("input[name=UserName]");
      passEl = $("#Password") || $("input[name=Password]");
      capEl = $("#Captcha") || $("input[name=Captcha]");
      if (userEl && passEl) break;
      await sleep(150);
    }
    if (!userEl || !passEl) {
      banner("IUH ĐKHP: không tìm thấy form đăng nhập.", "#b00020");
      return;
    }

    setValue(userEl, cfg.username);
    setValue(passEl, cfg.password);

    // Không tự submit: server bắt buộc captcha, cần người dùng gõ mã.
    if (capEl) {
      banner("IUH ĐKHP: đã điền tài khoản — nhập mã bảo vệ rồi Enter.", "#0b6e99");
      capEl.focus();
      capEl.select?.();
      capEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      });
    } else {
      banner("IUH ĐKHP: đã điền tài khoản — bấm Đăng nhập.", "#0b6e99");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main, { once: true });
  } else {
    main();
  }
})();
