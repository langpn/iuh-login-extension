// =====================================================================
// IUH Fast Login — content script cho Đăng ký học phần (DKHP)
// ---------------------------------------------------------------------
// Chạy trên https://dkhp.iuh.edu.vn/*
//
// Tính năng:
//   1. Tự động điền MSSV + Mật khẩu đã lưu.
//   2. Tự động giải Captcha bằng Micro-CNN offline (< 150 KB, không cần server).
//   3. Tự động điền Mã bảo vệ vào ô #Captcha.
//   4. Tự động đăng nhập (Auto-submit).
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
        "padding:10px 16px;font:13px/1.4 system-ui,-apple-system,sans-serif;color:#fff;" +
        "font-weight:bold;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.35);transition:all .3s ease;";
      (document.body || document.documentElement).appendChild(el);
    }
    el.style.background = color;
    el.textContent = text;
  }

  function submit() {
    const btn =
      $("#btnLogin") ||
      $("#btnDangNhap") ||
      $("form#form-login button") ||
      $("button.btn-primary") ||
      $("button[type=submit]");
    if (btn) {
      btn.click();
    } else {
      const form = $("#form-login") || $("form");
      if (form) {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }
    }
  }

  async function solveCaptcha(imgEl) {
    if (!imgEl) return "";
    // Chờ ảnh load hoàn tất
    for (let i = 0; i < 30; i++) {
      if (imgEl.complete && imgEl.naturalWidth >= 40) break;
      await sleep(100);
    }
    if (!imgEl.complete || imgEl.naturalWidth < 10) {
      console.warn("[IUH Fast Login] Ảnh captcha chưa sẵn sàng");
      return "";
    }

    if (!globalThis.IUH_DKHP_SOLVER || !globalThis.IUH_DKHP_SOLVER.predict) {
      console.warn("[IUH Fast Login] Chưa tìm thấy IUH_DKHP_SOLVER");
      return "";
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 110;
      canvas.height = 35;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(imgEl, 0, 0, 110, 35);
      const code = globalThis.IUH_DKHP_SOLVER.predict(canvas);
      console.log("[IUH Fast Login] Captcha giải được:", code);
      return (code || "").toUpperCase();
    } catch (e) {
      console.error("[IUH Fast Login] Lỗi khi giải captcha:", e);
      return "";
    }
  }

  async function main() {
    // Nếu đang ở trang trong portal (đã đăng nhập) -> thoát
    if (location.pathname.includes("ThongTinPortal") || location.pathname.includes("DangKyHocPhan")) {
      sessionStorage.removeItem("iuh_dkhp_tries");
      return;
    }

    // Kiểm tra cấu hình tài khoản
    const cfg = await getStorage({ username: "", password: "", autoLogin: true });
    if (!cfg.username || !cfg.password) {
      // Chỉ hiện banner nếu đang ở trang login
      if ($("#UserName") || $("input[name=UserName]")) {
        banner("IUH ĐKHP: Chưa lưu tài khoản — mở icon tiện ích để nhập MSSV & Mật khẩu.", "#b00020");
      }
      return;
    }
    if (!cfg.autoLogin) return;

    // Chờ form xuất hiện (tối đa 5 giây)
    let userEl = null, passEl = null, capEl = null, imgEl = null;
    for (let i = 0; i < 35; i++) {
      userEl = $("#UserName") || $("input[name=UserName]");
      passEl = $("#Password") || $("input[name=Password]");
      capEl = $("#Captcha") || $("input[name=Captcha]");
      imgEl = $("#newcaptcha") || $("img[src*='GetCaptcha']") || $(".imgcaptcha_fafb3") || $(".imgcaptcha_ffc66");
      if (userEl && passEl) break;
      await sleep(150);
    }

    // Nếu không có form đăng nhập trên trang này -> dừng
    if (!userEl || !passEl) {
      return;
    }

    // 1. Tự động điền tài khoản và mật khẩu
    setValue(userEl, cfg.username);
    setValue(passEl, cfg.password);

    // 2. Kiểm tra số lần thử trước đó trong phiên duyệt
    const tries = parseInt(sessionStorage.getItem("iuh_dkhp_tries") || "0", 10);
    if (tries >= 3) {
      banner("IUH ĐKHP: Đã thử tự động 3 lần. Vui lòng nhập mã bảo vệ rồi bấm Đăng nhập.", "#b00020");
      if (capEl) {
        capEl.focus();
        capEl.select?.();
      }
      return;
    }

    // 3. Tự động giải Captcha
    if (imgEl && capEl) {
      banner("IUH ĐKHP: Đang nhận diện mã bảo vệ...", "#0284c7");
      await sleep(150);

      const code = await solveCaptcha(imgEl);
      if (code && code.length === 4) {
        setValue(capEl, code);
        capEl.focus();
        capEl.select?.();

        // Gắn sự kiện Enter: nhấn Enter là submit ngay
        capEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        });

        // Nếu bật chế độ auto-submit rảnh tay
        if (cfg.dkhpAutoSubmit) {
          banner(`✓ IUH ĐKHP: Đã điền [${code}]. Đang tự động đăng nhập...`, "#16a34a");
          sessionStorage.setItem("iuh_dkhp_tries", (tries + 1).toString());
          await sleep(400);
          submit();
          return;
        } else {
          // Chế độ hỗ trợ thông minh an toàn 100%: điền sẵn, người dùng chỉ cần gõ Enter
          banner(`✓ IUH ĐKHP: Đã điền sẵn mã [${code}]. Nhấn Enter để vào ngay!`, "#16a34a");
          return;
        }
      }
    }

    // 4. Dự phòng: nếu không giải được thì focus ô captcha để người dùng gõ
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
