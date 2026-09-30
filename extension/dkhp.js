// =====================================================================
// IUH Fast Login — Content Script cho Đăng ký học phần (DKHP)
// ---------------------------------------------------------------------
// Thiết kế: Hiện đại, Tự nhiên, Mượt mà (Aesthetic Glassmorphism & Smooth UX)
// Lấy cảm hứng từ Linear & Vercel Design System.
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

  function banner(text, color = "#0284c7") {
    let el = $("#iuh-status-pill");
    if (!el) {
      el = document.createElement("div");
      el.id = "iuh-status-pill";
      el.style.cssText =
        "position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:99999;" +
        "padding:8px 18px;background:rgba(15,23,42,0.85);backdrop-filter:blur(16px);" +
        "-webkit-backdrop-filter:blur(16px);border:1px solid rgba(56,189,248,0.3);" +
        "border-radius:9999px;font:12px/1.4 system-ui,-apple-system,sans-serif;color:#f8fafc;" +
        "font-weight:600;box-shadow:0 10px 25px -5px rgba(0,0,0,0.5);display:flex;align-items:center;gap:8px;" +
        "transition:all .3s cubic-bezier(0.16,1,0.3,1);";
      (document.body || document.documentElement).appendChild(el);
    }
    el.innerHTML = `<span>⚡</span> <span>${text}</span>`;
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

  // Khử nhiễu và làm nét ảnh captcha (nét đen tuyền, nền trắng tinh, sạch bóng nhiễu)
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

    // 1. Lọc màu ký tự
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        const idx = (i * w + j) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const diff = b - r;
        if (diff > 22 && b > 75) {
          mask[i * w + j] = 1;
        }
      }
    }

    // 2. Khử chấm nhiễu đơn lẻ
    const eroded = new Uint8Array(w * h);
    for (let i = 0; i < h - 1; i++) {
      for (let j = 0; j < w - 1; j++) {
        if (
          mask[i * w + j] &&
          mask[i * w + j + 1] &&
          mask[(i + 1) * w + j] &&
          mask[(i + 1) * w + j + 1]
        ) {
          eroded[i * w + j] = 1;
        }
      }
    }
    const opened = new Uint8Array(w * h);
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (
          eroded[i * w + j] ||
          (i > 0 && eroded[(i - 1) * w + j]) ||
          (j > 0 && eroded[i * w + j - 1]) ||
          (i > 0 && j > 0 && eroded[(i - 1) * w + j - 1])
        ) {
          opened[i * w + j] = 1;
        }
      }
    }

    // 3. Khử các đường gạch ngang mỏng
    const vertClean = new Uint8Array(w * h);
    for (let j = 0; j < w; j++) {
      for (let i = 1; i < h - 1; i++) {
        if (
          opened[i * w + j] &&
          (opened[(i - 1) * w + j] || opened[(i + 1) * w + j])
        ) {
          vertClean[i * w + j] = 1;
        }
      }
    }

    // 4. Vẽ lại ra Canvas siêu nét
    const cleanImgData = rawCtx.createImageData(w, h);
    const cleanData = cleanImgData.data;

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        const idx = (i * w + j) * 4;
        if (vertClean[i * w + j]) {
          cleanData[idx] = 15;
          cleanData[idx + 1] = 23;
          cleanData[idx + 2] = 42;
          cleanData[idx + 3] = 255; // Nét chữ đậm đen (#0f172a)
        } else {
          cleanData[idx] = 255;
          cleanData[idx + 1] = 255;
          cleanData[idx + 2] = 255;
          cleanData[idx + 3] = 255; // Nền trắng tinh (#ffffff)
        }
      }
    }
    rawCtx.putImageData(cleanImgData, 0, 0);

    // Phóng to lên targetCanvas (tỷ lệ 2.2x: 242 x 77 px)
    targetCanvas.width = 242;
    targetCanvas.height = 77;
    const targetCtx = targetCanvas.getContext("2d");
    targetCtx.imageSmoothingEnabled = false;
    targetCtx.drawImage(rawCanvas, 0, 0, 242, 77);
    return true;
  }

  // Tiêm CSS giao diện Hiện đại, Sang trọng (Aesthetic Theme)
  function injectAestheticTheme() {
    if ($("#iuh-aesthetic-theme")) return;
    const style = document.createElement("style");
    style.id = "iuh-aesthetic-theme";
    style.textContent = `
      :root {
        --iuh-bg: #070d18;
        --iuh-card: rgba(15, 23, 42, 0.85);
        --iuh-border: rgba(255, 255, 255, 0.08);
        --iuh-accent: #0284c7;
        --iuh-glow: rgba(56, 189, 248, 0.15);
      }
      body {
        background-color: var(--iuh-bg) !important;
        background-image: 
          radial-gradient(at 50% 0%, rgba(14, 165, 233, 0.12) 0px, transparent 60%),
          radial-gradient(at 100% 100%, rgba(30, 58, 138, 0.12) 0px, transparent 60%) !important;
        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif !important;
        color: #f8fafc !important;
        min-height: 100vh;
        margin: 0;
      }
      #page-header, footer {
        display: none !important;
      }
      .center-login {
        max-width: 440px !important;
        margin: 50px auto !important;
        padding: 36px 32px !important;
        background: var(--iuh-card) !important;
        backdrop-filter: blur(24px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
        border: 1px solid var(--iuh-border) !important;
        border-radius: 24px !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px var(--iuh-border) !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .center-login:hover {
        border-color: rgba(56, 189, 248, 0.25) !important;
        box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.8), 0 0 20px var(--iuh-glow) !important;
      }
      .form-group {
        margin-bottom: 14px !important;
      }
      .center-login .input-group-text {
        background: rgba(30, 41, 59, 0.6) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-right: none !important;
        border-radius: 12px 0 0 12px !important;
        color: #94a3b8 !important;
        font-size: 13px !important;
        font-weight: 600 !important;
      }
      .center-login input.form-control,
      .center-login input[type="text"],
      .center-login input[type="password"] {
        background: rgba(11, 19, 36, 0.75) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 0 12px 12px 0 !important;
        padding: 12px 14px !important;
        font-size: 14px !important;
        color: #f8fafc !important;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .center-login input:focus {
        border-color: #38bdf8 !important;
        box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2) !important;
        outline: none !important;
      }
      #btnLogin {
        background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%) !important;
        border: none !important;
        border-radius: 14px !important;
        padding: 13px 20px !important;
        font-size: 15px !important;
        font-weight: 700 !important;
        letter-spacing: 0.3px !important;
        color: #ffffff !important;
        box-shadow: 0 4px 16px rgba(14, 165, 233, 0.35) !important;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        cursor: pointer !important;
        width: 100% !important;
        margin-top: 14px !important;
      }
      #btnLogin:hover {
        transform: translateY(-1.5px) !important;
        box-shadow: 0 8px 24px rgba(37, 99, 235, 0.45) !important;
      }
      #btnLogin:active {
        transform: scale(0.99) !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // Khối hỗ trợ hiển thị captcha & 4 ô nhập chữ
  function attachCaptchaAssistant(imgEl, capEl) {
    let box = $("#iuh-assistant-card");
    if (!box) {
      box = document.createElement("div");
      box.id = "iuh-assistant-card";
      box.style.cssText =
        "margin: 14px 0 16px 0; padding: 14px 16px; background: rgba(30, 41, 59, 0.45); " +
        "border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; " +
        "box-shadow: 0 8px 24px rgba(0,0,0,0.25); text-align: center;";

      // Header thẻ
      const header = document.createElement("div");
      header.style.cssText =
        "font-size: 11px; font-weight: 700; color: #38bdf8; letter-spacing: 0.6px; " +
        "margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;";
      header.innerHTML = `
        <span style="display:flex;align-items:center;gap:5px;">👁️ MÃ BẢO VỆ ĐÃ KHỬ NHIỄU:</span>
        <button id="iuh-btn-refresh" type="button" style="border:1px solid rgba(56,189,248,0.25); background:rgba(56,189,248,0.1); color:#38bdf8; padding:3px 9px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:600; transition:all .2s;">🔄 Đổi mã</button>
      `;

      // Canvas hiển thị ảnh to, sạch, rõ ràng
      const canvas = document.createElement("canvas");
      canvas.id = "iuh-clean-canvas";
      canvas.style.cssText =
        "display: block; margin: 0 auto 12px auto; border-radius: 10px; border: 1.5px solid rgba(255,255,255,0.15); box-shadow: 0 4px 12px rgba(0,0,0,0.15);";

      // 4 ô hiển thị ký tự to rõ khi người dùng gõ
      const slotsRow = document.createElement("div");
      slotsRow.id = "iuh-slots-row";
      slotsRow.style.cssText = "display: flex; gap: 8px; justify-content: center; margin-bottom: 8px;";
      slotsRow.innerHTML = `
        <div class="iuh-slot" id="iuh-s0" style="width:52px;height:52px;line-height:48px;font-size:32px;font-weight:800;font-family:system-ui,sans-serif;background:rgba(15,23,42,0.8);color:#38bdf8;border:1.5px solid rgba(56,189,248,0.3);border-radius:12px;text-align:center;transition:all .15s ease;">·</div>
        <div class="iuh-slot" id="iuh-s1" style="width:52px;height:52px;line-height:48px;font-size:32px;font-weight:800;font-family:system-ui,sans-serif;background:rgba(15,23,42,0.8);color:#38bdf8;border:1.5px solid rgba(56,189,248,0.3);border-radius:12px;text-align:center;transition:all .15s ease;">·</div>
        <div class="iuh-slot" id="iuh-s2" style="width:52px;height:52px;line-height:48px;font-size:32px;font-weight:800;font-family:system-ui,sans-serif;background:rgba(15,23,42,0.8);color:#38bdf8;border:1.5px solid rgba(56,189,248,0.3);border-radius:12px;text-align:center;transition:all .15s ease;">·</div>
        <div class="iuh-slot" id="iuh-s3" style="width:52px;height:52px;line-height:48px;font-size:32px;font-weight:800;font-family:system-ui,sans-serif;background:rgba(15,23,42,0.8);color:#38bdf8;border:1.5px solid rgba(56,189,248,0.3);border-radius:12px;text-align:center;transition:all .15s ease;">·</div>
      `;

      const guide = document.createElement("div");
      guide.style.cssText = "font-size: 11px; color: #94a3b8; font-weight: 500;";
      guide.textContent = "Nhìn ảnh to & gõ 4 ký tự — hệ thống tự động đăng nhập ngay!";

      box.appendChild(header);
      box.appendChild(canvas);
      box.appendChild(slotsRow);
      box.appendChild(guide);

      const targetParent = capEl.closest(".form-group") || capEl.parentElement;
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

    const canvas = $("#iuh-clean-canvas");
    if (canvas && imgEl) {
      renderCleanCaptcha(imgEl, canvas);
    }
  }

  // Cập nhật 4 ô hiển thị ký tự to khi gõ
  function updateSlots(val) {
    const text = (val || "").toUpperCase();
    for (let i = 0; i < 4; i++) {
      const el = $(`#iuh-s${i}`);
      if (el) {
        const char = text[i] || "·";
        el.textContent = char;
        if (text[i]) {
          el.style.borderColor = "#38bdf8";
          el.style.color = "#38bdf8";
          el.style.background = "rgba(14, 165, 233, 0.15)";
          el.style.boxShadow = "0 0 12px rgba(56, 189, 248, 0.25)";
        } else {
          el.style.borderColor = "rgba(255, 255, 255, 0.1)";
          el.style.color = "#475569";
          el.style.background = "rgba(15, 23, 42, 0.8)";
          el.style.boxShadow = "none";
        }
      }
    }
  }

  // Header hiện đại trên form
  function attachModernHeader(formEl) {
    if ($("#iuh-modern-header")) return;
    const header = document.createElement("div");
    header.id = "iuh-modern-header";
    header.style.cssText = "margin-bottom: 24px; text-align: left;";
    header.innerHTML = `
      <div style="font-size: 11px; font-weight: 700; color: #38bdf8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
        <span style="display:inline-block;width:6px;height:6px;border-radius:9999px;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
        Cổng trực tuyến sinh viên
      </div>
      <div style="font-size: 22px; font-weight: 800; color: #f8fafc; letter-spacing: -0.02em;">
        Đăng ký học phần
      </div>
      <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
        Tự động điền tài khoản, trợ lý captcha thị giác & duy trì phiên làm việc.
      </div>
    `;
    formEl.insertBefore(header, formEl.firstChild);
  }

  // Thẻ tài khoản cố định phong cách hiện đại
  function attachAccountPill(userEl, username) {
    if (!username || $("#iuh-account-pill")) return;
    const pill = document.createElement("div");
    pill.id = "iuh-account-pill";
    pill.style.cssText =
      "margin-bottom: 14px; padding: 10px 14px; background: rgba(30, 41, 59, 0.5); " +
      "border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; " +
      "display: flex; justify-content: space-between; align-items: center;";
    pill.innerHTML = `
      <div>
        <div style="font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 0.6px; text-transform: uppercase;">Mã sinh viên</div>
        <div style="font-size: 15px; font-weight: 700; color: #38bdf8; font-family: ui-monospace, monospace;">${username}</div>
      </div>
      <div style="font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
        ✓ Đã lưu
      </div>
    `;
    const formGroup = userEl.closest(".form-group");
    if (formGroup) {
      formGroup.parentElement.insertBefore(pill, formGroup);
      formGroup.style.display = "none";
    }
  }

  async function main() {
    if (location.pathname.includes("ThongTinPortal") || location.pathname.includes("DangKyHocPhan")) {
      return;
    }

    // Tiêm theme giao diện Aesthetic
    injectAestheticTheme();

    const cfg = await getStorage({
      username: "",
      password: "",
      autoLogin: true
    });

    if (!cfg.username || !cfg.password) {
      if ($("#UserName") || $("input[name=UserName]")) {
        banner("Chưa lưu tài khoản — mở tiện ích để nhập MSSV & Mật khẩu.", "#f59e0b");
      }
      return;
    }
    if (!cfg.autoLogin) return;

    // Chờ form xuất hiện
    let userEl = null, passEl = null, capEl = null, imgEl = null, formEl = null;
    for (let i = 0; i < 35; i++) {
      userEl = $("#UserName") || $("input[name=UserName]");
      passEl = $("#Password") || $("input[name=Password]");
      capEl = $("#Captcha") || $("input[name=Captcha]");
      imgEl = $("#newcaptcha") || $("img[src*='GetCaptcha']") || $("img[class*='imgcaptcha']");
      formEl = $("#form-login") || $("form");
      if (userEl && passEl) break;
      await sleep(150);
    }

    if (!userEl || !passEl || !capEl) return;

    // 1. Tự động điền tài khoản & mật khẩu
    setValue(userEl, cfg.username);
    setValue(passEl, cfg.password);

    if (formEl) attachModernHeader(formEl);
    attachAccountPill(userEl, cfg.username);

    // 2. Tự động in hoa + Cập nhật 4 ô chữ to + Tự submit khi gõ đủ 4 ký tự
    capEl.addEventListener("input", (e) => {
      const upper = capEl.value.toUpperCase();
      if (capEl.value !== upper) {
        capEl.value = upper;
      }
      updateSlots(capEl.value);

      if (e.isTrusted && capEl.value.trim().length === 4) {
        banner("Đang đăng nhập vào cổng...", "#10b981");
        submit();
      }
    });

    capEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });

    // 3. Khử sạch nhiễu & hiển thị giao diện trợ lý
    const runDisplay = async () => {
      for (let i = 0; i < 25; i++) {
        if (imgEl.complete && imgEl.naturalWidth >= 40) break;
        await sleep(100);
      }
      attachCaptchaAssistant(imgEl, capEl);
      banner("Nhìn ảnh trên & gõ 4 ký tự để vào ngay", "#0284c7");
      capEl.focus();
    };

    await runDisplay();

    if (imgEl) {
      imgEl.addEventListener("load", () => {
        setTimeout(runDisplay, 150);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main, { once: true });
  } else {
    main();
  }
})();
