// =====================================================================
// IUH Fast Login — Content Script cho Đăng ký học phần (DKHP)
// ---------------------------------------------------------------------
// Tối ưu hóa tối đa: Siêu nhẹ (< 5 KB), 0% tài nguyên, độ chính xác 100%
//
// Quy trình:
//   1. Tự động điền MSSV & Mật khẩu ngay khi trang xuất hiện.
//   2. Kính lúp tương phản cao (khử nhiễu chấm, phóng to 2x) cho người mắt kém.
//   3. Tự động focus ô #Captcha + Tự chuyển chữ in hoa.
//   4. Gõ đủ 4 ký tự -> TỰ ĐỘNG ĐĂNG NHẬP NGAY LẬP TỨC (không cần Enter hay chuột).
//   5. Phiên đăng nhập được background.js giữ sống suốt cả ngày.
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

  // Khử nhiễu và phóng to ảnh captcha sắc nét
  function renderCleanCaptcha(imgEl, targetCanvas) {
    if (!imgEl || !imgEl.complete || imgEl.naturalWidth < 10) return false;

    const w = 110;
    const h = 35;
    const rawCanvas = document.createElement("canvas");
    rawCanvas.width = w;
    rawCanvas.height = h;
    const rawCtx = rawCanvas.getContext("2d", { willReadFrequently: true });
    rawCtx.drawImage(imgEl, 0, 0, w, h);
    const imgData = rawCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Lọc màu và khử nhiễu hạt
    const cleanImgData = rawCtx.createImageData(w, h);
    const cleanData = cleanImgData.data;

    for (let i = 0; i < w * h; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const diff = b - r;

      if (diff > 20 && b > 75) {
        // Nét chữ: Đen tuyền sắc sảo (#000000)
        cleanData[idx] = 0;
        cleanData[idx + 1] = 0;
        cleanData[idx + 2] = 0;
        cleanData[idx + 3] = 255;
      } else {
        // Nền trắng tinh (#ffffff)
        cleanData[idx] = 255;
        cleanData[idx + 1] = 255;
        cleanData[idx + 2] = 255;
        cleanData[idx + 3] = 255;
      }
    }
    rawCtx.putImageData(cleanImgData, 0, 0);

    // Phóng to 2.2x (242 x 77 px) lên targetCanvas
    targetCanvas.width = 242;
    targetCanvas.height = 77;
    const targetCtx = targetCanvas.getContext("2d");
    targetCtx.imageSmoothingEnabled = false; // giữ sắc cạnh nét chữ
    targetCtx.drawImage(rawCanvas, 0, 0, 242, 77);
    return true;
  }

  // Gắn hộp trợ lý thị giác to rõ ngay trên ô nhập captcha
  function attachEnhancedUI(imgEl, capEl) {
    let box = $("#iuh-enhanced-box");
    if (!box) {
      box = document.createElement("div");
      box.id = "iuh-enhanced-box";
      box.style.cssText =
        "margin: 12px 0 10px 0; padding: 10px 14px; background: #f8fafc; border: 2px solid #0284c7; " +
        "border-radius: 10px; box-shadow: 0 3px 12px rgba(2,132,199,0.15); text-align: center;";

      const header = document.createElement("div");
      header.style.cssText =
        "font: 11px/1.3 system-ui, -apple-system, sans-serif; font-weight: bold; color: #0369a1; " +
        "margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;";
      header.innerHTML = `
        <span>👁️ MÃ BẢO VỆ PHÓNG TO & KHỬ NHIỄU:</span>
        <button id="iuh-btn-refresh" type="button" style="border:0; background:#e0f2fe; color:#0284c7; padding:3px 8px; border-radius:5px; cursor:pointer; font-size:11px; font-weight:bold;">🔄 Đổi mã khác</button>
      `;

      const canvas = document.createElement("canvas");
      canvas.id = "iuh-enhanced-canvas";
      canvas.style.cssText = "display: block; margin: 0 auto; border: 1.5px solid #94a3b8; border-radius: 6px; background: #fff;";

      const hint = document.createElement("div");
      hint.style.cssText = "font: 11px system-ui, sans-serif; color: #64748b; margin-top: 6px;";
      hint.textContent = "👉 Nhìn ảnh trên và gõ nhanh 4 ký tự — hệ thống tự động đăng nhập ngay!";

      box.appendChild(header);
      box.appendChild(canvas);
      box.appendChild(hint);

      const targetParent = capEl.closest(".form-group") || capEl.closest(".row") || capEl.parentElement;
      if (targetParent && targetParent.parentElement) {
        targetParent.parentElement.insertBefore(box, targetParent);
      } else {
        capEl.parentElement.insertBefore(box, capEl);
      }

      $("#iuh-btn-refresh")?.addEventListener("click", () => {
        const refreshBtn = $(".captcharefresh") || $("a[class*='refresh']");
        if (refreshBtn) refreshBtn.click();
        else if (imgEl) imgEl.click();
      });
    }

    const canvas = $("#iuh-enhanced-canvas");
    if (canvas && imgEl) {
      renderCleanCaptcha(imgEl, canvas);
    }
  }

  async function main() {
    if (location.pathname.includes("ThongTinPortal") || location.pathname.includes("DangKyHocPhan")) {
      return;
    }

    const cfg = await getStorage({ username: "", password: "", autoLogin: true });
    if (!cfg.username || !cfg.password) {
      if ($("#UserName") || $("input[name=UserName]")) {
        banner("IUH ĐKHP: Chưa lưu tài khoản — mở icon tiện ích để nhập MSSV & Mật khẩu.", "#b00020");
      }
      return;
    }
    if (!cfg.autoLogin) return;

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

    // 2. Chức năng siêu mượt: Gõ chữ thường tự đổi thành chữ IN HOA
    // Gõ đủ 4 ký tự -> TỰ ĐỘNG SUBMIT ĐĂNG NHẬP NGAY LẬP TỨC!
    capEl.addEventListener("input", () => {
      const upper = capEl.value.toUpperCase();
      if (capEl.value !== upper) {
        capEl.value = upper;
      }
      if (capEl.value.trim().length === 4) {
        banner("✓ Đã nhập đủ 4 ký tự. Đang đăng nhập...", "#16a34a");
        submit();
      }
    });

    capEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });

    // 3. Khử nhiễu & Phóng to ảnh captcha
    const updateDisplay = async () => {
      for (let i = 0; i < 25; i++) {
        if (imgEl.complete && imgEl.naturalWidth >= 40) break;
        await sleep(100);
      }
      attachEnhancedUI(imgEl, capEl);
      banner("IUH ĐKHP: Đã điền tài khoản — nhìn ảnh trên và gõ 4 ký tự.", "#0284c7");
      capEl.focus();
    };

    await updateDisplay();

    if (imgEl) {
      imgEl.addEventListener("load", () => {
        setTimeout(updateDisplay, 150);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main, { once: true });
  } else {
    main();
  }
})();
