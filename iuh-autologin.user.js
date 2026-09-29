// ==UserScript==
// @name         IUH Fast Login
// @namespace    https://github.com/langpn/iuh-bypass-login
// @version      2.2.0
// @description  Tự động đăng nhập cổng sinh viên IUH (sv.iuh.edu.vn) và LMS (lms.iuh.edu.vn). Cổng SV chặn ảnh captcha ở tầng mạng nên server bỏ qua captcha; LMS (Moodle) đăng nhập POST thường.
// @author       langpn
// @match        https://sv.iuh.edu.vn/sinh-vien-dang-nhap.html*
// @match        https://lms.iuh.edu.vn/login/index.php*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @noframes
// @webRequest   [{"selector":"*://sv.iuh.edu.vn/WebCommon/GetCaptcha*","action":"cancel"}]
// ==/UserScript==

(function () {
  "use strict";

  const RETRY_WAIT_MS = 12000; // chờ khi bị giới hạn tần suất (cổng SV)
  const MAX_ATTEMPTS = 2;
  const STATE_KEY = "iuh_autologin_state";

  // -------------------- lưu/đọc tài khoản --------------------
  const getCreds = () => ({
    u: GM_getValue("iuh_user", ""),
    p: GM_getValue("iuh_pass", ""),
  });
  const saveCreds = (u, p) => {
    GM_setValue("iuh_user", u);
    GM_setValue("iuh_pass", p);
  };

  GM_registerMenuCommand("Đặt tài khoản IUH…", () => {
    const c = getCreds();
    const u = prompt("Mã sinh viên:", c.u || "");
    if (u === null) return;
    const p = prompt("Mật khẩu:", c.p || "");
    if (p === null) return;
    saveCreds(u.trim(), p);
    alert("Đã lưu. Mở lại trang đăng nhập để dùng.");
  });

  GM_registerMenuCommand("Xoá tài khoản đã lưu", () => {
    saveCreds("", "");
    alert("Đã xoá.");
  });

  // -------------------- tiện ích --------------------
  const $ = (sel) => document.querySelector(sel);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function setValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function banner(text, color) {
    let el = $("#iuh-banner");
    if (!el) {
      el = document.createElement("div");
      el.id = "iuh-banner";
      el.style.cssText =
        "position:fixed;top:0;left:0;right:0;z-index:2147483647;" +
        "padding:8px 12px;font:13px/1.4 system-ui,sans-serif;color:#fff;" +
        "text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.25)";
      (document.body || document.documentElement).appendChild(el);
    }
    el.style.background = color || "#0b6e99";
    el.textContent = text;
  }

  // ===================================================================
  // Cổng sinh viên sv.iuh.edu.vn
  // ===================================================================
  async function mainPortal() {
    const { u, p } = getCreds();
    if (!u || !p) {
      banner("IUH: chưa cấu hình tài khoản (menu Tampermonkey → Đặt tài khoản IUH…)", "#a15c00");
      return;
    }

    let userEl, passEl;
    for (let i = 0; i < 60; i++) {
      userEl = $("#UserName") || $("input[name=UserName]");
      passEl = $("#Password") || $("input[name=Password]");
      if (userEl && passEl) break;
      await sleep(150);
    }
    if (!userEl || !passEl) {
      console.warn("[IUH] Không tìm thấy form đăng nhập.");
      return;
    }

    let state = null;
    try { state = JSON.parse(sessionStorage.getItem(STATE_KEY) || "null"); } catch (e) {}
    const attempts = (state && Date.now() - state.t < 60000) ? (state.n || 0) : 0;

    if (attempts >= MAX_ATTEMPTS) {
      banner("IUH: đã thử 2 lần nhưng chưa vào được. Kiểm tra lại tài khoản.", "#b00020");
      return;
    }

    if (attempts > 0) {
      banner(`IUH: chờ ${Math.round(RETRY_WAIT_MS / 1000)}s rồi thử lại…`, "#a15c00");
      await sleep(RETRY_WAIT_MS);
    } else {
      banner("IUH: đang tự động đăng nhập…", "#0b6e99");
    }

    sessionStorage.setItem(STATE_KEY, JSON.stringify({ n: attempts + 1, t: Date.now() }));

    setValue(userEl, u);
    setValue(passEl, p);

    // Captcha đã bị @webRequest chặn → để trống là được.
    const cap = $("#Captcha") || $("input[name=Captcha]");
    if (cap) setValue(cap, "");

    await sleep(250);

    const btn = $("#btnLogin") ||
      $("#form-login button[type=submit]") ||
      $("#form-login input[type=submit]") ||
      $("button[type=submit]") ||
      $("input[type=submit]");
    if (btn) btn.click();
    else {
      const form = $("#form-login") || $("form");
      if (form) form.submit();
    }
  }

  // ===================================================================
  // LMS lms.iuh.edu.vn (Moodle) — POST thường, không captcha
  // ===================================================================
  async function mainLms() {
    const { u, p } = getCreds();
    if (!u || !p) {
      banner("IUH LMS: chưa cấu hình tài khoản (menu Tampermonkey → Đặt tài khoản IUH…)", "#a15c00");
      return;
    }

    let userEl, passEl, form;
    for (let i = 0; i < 60; i++) {
      form = $("#login") || $("form.login-form");
      userEl = $("#username") || $("input[name=username]");
      passEl = $("#password") || $("input[name=password]");
      if (form && userEl && passEl) break;
      await sleep(150);
    }
    if (!form || !userEl || !passEl) {
      console.warn("[IUH LMS] Không tìm thấy form đăng nhập.");
      return;
    }

    banner("IUH LMS: đang tự động đăng nhập…", "#0b6e99");
    setValue(userEl, u);
    setValue(passEl, p);

    // logintoken đã có sẵn trong form; chỉ cần submit.
    await sleep(250);
    const btn = $("#loginbtn") || $("button[type=submit]") || $("input[type=submit]");
    if (btn) btn.click();
    else form.submit();
  }

  // -------------------- định tuyến theo host --------------------
  const run = location.hostname === "lms.iuh.edu.vn" ? mainLms : mainPortal;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
