// =====================================================================
// IUH Fast Login — content script cho Đăng ký học phần (DKHP)
// ---------------------------------------------------------------------
// Chạy trên https://dkhp.iuh.edu.vn/Account/Login
//
// Tính năng:
//   1. Tự động điền MSSV + Mật khẩu đã lưu.
//   2. Tự động giải Captcha bằng Micro-CNN offline (< 150 KB, không cần server).
//   3. Tự động điền Mã bảo vệ và Đăng nhập.
//   4. Tự động thử lại nếu mã bảo vệ chưa khớp (tối đa 3 lần).
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
        "padding:10px 14px;font:13px/1.4 system-ui,-apple-system,sans-serif;color:#fff;" +
        "font-weight:bold;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.3);transition:all .3s ease;";
      (document.body || document.documentElement).appendChild(el);
    }
    el.style.background = color;
    el.textContent = text;
  }

  function submit() {
    const btn =
      $("#btnDangNhap") ||
      $("#btnLogin") ||
      $("form#form-login button[type=submit]") ||
      $("form#form-login input[type=submit]") ||
      $("button[type=submit]");
    if (btn) btn.click();
    else {
      const form = $("#form-login") || $("form");
      if (form) form.submit();
    }
  }

  // Chờ ảnh load hoàn tất
  function waitForImage(img, timeoutMs = 4000) {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve(true);
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), timeoutMs);
      img.addEventListener("load", () => {
        clearTimeout(timer);
        resolve(true);
      }, { once: true });
      img.addEventListener("error", () => {
        clearTimeout(timer);
        resolve(false);
      }, { once: true });
    });
  }

  // Vẽ ảnh vào Canvas 110x35 để giải mã
  function imageToCanvas(img) {
    const canvas = document.createElement("canvas");
    canvas.width = 110;
    canvas.height = 35;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 110, 35);
    return canvas;
  }

  async function solveCaptcha(imgEl) {
    const ok = await waitForImage(imgEl);
    if (!ok) return "";
    if (!globalThis.IUH_DKHP_SOLVER || !globalThis.IUH_DKHP_SOLVER.predict) {
      console.warn("[IUH Fast Login] Chưa tìm thấy IUH_DKHP_SOLVER");
      return "";
    }
    try {
      const canvas = imageToCanvas(imgEl);
      const code = globalThis.IUH_DKHP_SOLVER.predict(canvas);
      return (code || "").toUpperCase();
    } catch (e) {
      console.error("[IUH Fast Login] Lỗi khi giải captcha:", e);
      return "";
    }
  }

  async function main() {
    // Nếu trang hiện tại đã ở trong portal hoặc không có form đăng nhập -> thoát
    if (location.pathname.includes("ThongTinPortal")) {
      sessionStorage.removeItem("iuh_dkhp_attempts");
      return;
    }

    const cfg = await getStorage({ username: "", password: "", autoLogin: true });
    if (!cfg.username || !cfg.password) {
      banner("IUH ĐKHP: Chưa lưu tài khoản — mở icon tiện ích để nhập MSSV & Mật khẩu.", "#b00020");
      return;
    }
    if (!cfg.autoLogin) return;

    // Tìm các trường form
    let userEl = null, passEl = null, capEl = null, imgEl = null;
    for (let i = 0; i < 40; i++) {
      userEl = $("#UserName") || $("input[name=UserName]");
      passEl = $("#Password") || $("input[name=Password]");
      capEl = $("#Captcha") || $("input[name=Captcha]");
      imgEl = $("#newcaptcha") || $("img[src*='GetCaptcha']") || $(".imgcaptcha_fafb3") || $(".imgcaptcha_ffc66");
      if (userEl && passEl) break;
      await sleep(150);
    }
    if (!userEl || !passEl) {
      return;
    }

    // Điền tài khoản và mật khẩu
    setValue(userEl, cfg.username);
    setValue(passEl, cfg.password);

    // Kiểm tra số lần thử trước đó để tránh lặp vô hạn nếu có lỗi
    const attemptStr = sessionStorage.getItem("iuh_dkhp_attempts") || "0";
    let attempts = parseInt(attemptStr, 10);

    // Nếu trang vừa tải lại có thông báo lỗi mã bảo vệ
    const pageHtml = document.body.innerHTML || "";
    const hasCaptchaError = pageHtml.includes("không khớp") || pageHtml.includes("kh&#244;ng khớp");

    if (hasCaptchaError) {
      attempts += 1;
      sessionStorage.setItem("iuh_dkhp_attempts", attempts.toString());
    }

    if (attempts >= 3) {
      sessionStorage.removeItem("iuh_dkhp_attempts");
      banner("IUH ĐKHP: Đã thử 3 lần. Vui lòng nhập mã bảo vệ và bấm Đăng nhập.", "#b00020");
      if (capEl) capEl.focus();
      return;
    }

    // Tự động giải captcha
    if (imgEl && capEl) {
      banner("IUH ĐKHP: Đang tự động giải mã bảo vệ...", "#0284c7");
      await sleep(250);

      const code = await solveCaptcha(imgEl);
      if (code && code.length === 4) {
        setValue(capEl, code);
        banner(`✓ IUH ĐKHP: Đã điền tài khoản & giải mã [${code}]. Đang đăng nhập...`, "#16a34a");
        sessionStorage.setItem("iuh_dkhp_attempts", (attempts + 1).toString());

        // Lắng nghe phím Enter dự phòng
        capEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        });

        await sleep(350);
        submit();
        return;
      }
    }

    // Phương án dự phòng nếu không nhận diện được
    if (capEl) {
      banner("IUH ĐKHP: Đã điền sẵn tài khoản — nhập mã bảo vệ rồi Enter.", "#0b6e99");
      capEl.focus();
      capEl.select?.();
      capEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      });
    } else {
      banner("IUH ĐKHP: Đã điền tài khoản — bấm Đăng nhập.", "#0b6e99");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main, { once: true });
  } else {
    main();
  }
})();
