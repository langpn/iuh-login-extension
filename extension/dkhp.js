// =====================================================================
// IUH Fast Login — Content Script cho Đăng ký học phần (DKHP)
// ---------------------------------------------------------------------
// Tinh gọn, sạch sẽ, không rườm rà:
//   1. Tự động điền MSSV & Mật khẩu ngay khi trang mở.
//   2. Tinh chỉnh ảnh captcha gốc: Phóng to 1.35x & tăng tương phản tự nhiên (không vỡ nét, không cắt xén).
//   3. Tự động focus ô nhập mã + Tự động chuyển chữ in hoa khi gõ.
//   4. Gõ đủ 4 ký tự hoặc nhấn Enter -> Tự động đăng nhập ngay lập tức.
// =====================================================================

(() => {
  "use strict";

  const api = globalThis.browser ?? globalThis.chrome;
  if (!api || !api.storage) return;

  const $ = (sel) => document.querySelector(sel);
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  function getStorage(keys) {
    return new Promise((resolve) => {
      api.storage.local.get(keys, (v) => resolve(v || {}));
    });
  }

  function setValue(el, value) {
    if (!el) return;
    const proto = Object.getPrototypeOf(el);
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function banner(text, color = "#0b6e99") {
    let el = $("#iuh-banner");
    if (!el) {
      el = document.createElement("div");
      el.id = "iuh-banner";
      el.style.cssText =
        "position:fixed;top:0;left:0;right:0;z-index:2147483647;" +
        "padding:9px 16px;font:13px/1.4 system-ui,-apple-system,sans-serif;color:#fff;" +
        "font-weight:bold;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.3);transition:all .3s ease;";
      (document.body || document.documentElement).appendChild(el);
    }
    el.style.background = color;
    el.textContent = text;
  }

  function submit() {
    const btn = $("#btnLogin") || $("form#form-login button") || $("button[type=submit]");
    if (btn) {
      btn.click();
    } else {
      const form = $("#form-login") || $("form");
      if (form) {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }
    }
  }

  async function main() {
    if (location.pathname.includes("ThongTinPortal") || location.pathname.includes("DangKyHocPhan")) {
      return;
    }

    const cfg = await getStorage({ username: "", password: "", autoLogin: true });
    if (!cfg.username || !cfg.password || !cfg.autoLogin) return;

    // Chờ form đăng nhập xuất hiện
    let userEl = null, passEl = null, capEl = null, imgEl = null;
    for (let i = 0; i < 35; i++) {
      userEl = $("#UserName") || $("input[name=UserName]");
      passEl = $("#Password") || $("input[name=Password]");
      capEl = $("#Captcha") || $("input[name=Captcha]");
      imgEl = $("#newcaptcha") || $("img[src*='GetCaptcha']") || $("img[class*='imgcaptcha']");
      if (userEl && passEl) break;
      await sleep(150);
    }

    if (!userEl || !passEl || !capEl) return;

    // 1. Tự động điền tài khoản & mật khẩu
    setValue(userEl, cfg.username);
    setValue(passEl, cfg.password);

    // 2. Tinh chỉnh ảnh captcha gốc: Phóng to to rõ, sắc nét, tương phản cao tự nhiên
    if (imgEl) {
      imgEl.style.cssText =
        "transform: scale(1.35); transform-origin: left center; " +
        "filter: contrast(135%) brightness(102%); border-radius: 4px; " +
        "margin-right: 16px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: transform .2s ease;";
      imgEl.title = "Bấm vào ảnh để đổi mã mới";
      imgEl.addEventListener("click", () => {
        const refreshBtn = $(".captcharefresh") || $("a[class*='refresh']");
        if (refreshBtn) refreshBtn.click();
      });
    }

    // 3. Tối ưu ô nhập captcha: Font to, rõ, tự in hoa
    capEl.style.cssText = "font-size: 16px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;";
    capEl.placeholder = "Mã 4 ký tự";

    capEl.addEventListener("input", (e) => {
      const upper = capEl.value.toUpperCase();
      if (capEl.value !== upper) {
        capEl.value = upper;
      }
      // Người dùng gõ đủ 4 ký tự -> tự động đăng nhập ngay lập tức
      if (e.isTrusted && capEl.value.trim().length === 4) {
        banner("✓ Đang đăng nhập ĐKHP...", "#16a34a");
        submit();
      }
    });

    capEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });

    banner("IUH ĐKHP: Đã điền tài khoản — gõ 4 ký tự để vào ngay.", "#0b6e99");
    capEl.focus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main, { once: true });
  } else {
    main();
  }
})();
