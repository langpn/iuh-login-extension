// =====================================================================
// IUH Fast Login — Content Script cho Đăng ký học phần (DKHP)
// ---------------------------------------------------------------------
// Chạy trên https://dkhp.iuh.edu.vn/*
//
// Tính năng:
//   1. Giao diện Login Hiện đại, Glassmorphism & Cool ngầu.
//   2. Khử sạch nhiễu chấm, gạch ngang và tách 4 ô ký tự riêng biệt (Black on White).
//   3. Hiển thị 4 ô phông chữ chuẩn khổng lồ (34px) cực kỳ dễ đọc cho người mắt kém.
//   4. Tự động điền MSSV + Mật khẩu đã lưu.
//   5. Tự động chuyển chữ in hoa khi gõ + Tự submit khi gõ đủ 4 ký tự hoặc nhấn Enter.
//   6. Nút 1-click làm mới mã trực tiếp trên giao diện trợ lý.
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

  // Tiêm CSS giao diện Hiện đại, Sang trọng (Glassmorphism UI)
  function injectModernCoolTheme() {
    if ($("#iuh-modern-theme")) return;
    const style = document.createElement("style");
    style.id = "iuh-modern-theme";
    style.textContent = `
      body {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%) !important;
        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif !important;
        min-height: 100vh;
      }
      #page-header {
        margin-bottom: 8px !important;
      }
      #page-header header {
        background: transparent !important;
        box-shadow: none !important;
      }
      .center-login {
        max-width: 490px !important;
        margin: 20px auto 40px auto !important;
        padding: 30px 36px !important;
        background: rgba(255, 255, 255, 0.94) !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border-radius: 20px !important;
        box-shadow: 0 20px 50px rgba(2, 132, 199, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05), 0 0 0 1.5px rgba(2, 132, 199, 0.18) !important;
        transition: all 0.3s ease !important;
      }
      .center-login .input-group-text {
        background: #f1f5f9 !important;
        border: 1.5px solid #cbd5e1 !important;
        border-right: none !important;
        border-radius: 12px 0 0 12px !important;
        font-weight: 600 !important;
        color: #334155 !important;
        font-size: 13px !important;
        padding: 10px 14px !important;
      }
      .center-login input.form-control, .center-login input[type="text"], .center-login input[type="password"] {
        border: 1.5px solid #cbd5e1 !important;
        border-radius: 0 12px 12px 0 !important;
        padding: 10px 14px !important;
        font-size: 15px !important;
        transition: all 0.2s ease !important;
      }
      .center-login input:focus {
        border-color: #0284c7 !important;
        box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.2) !important;
        outline: none !important;
      }
      #btnLogin {
        background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
        border: none !important;
        border-radius: 12px !important;
        padding: 12px 20px !important;
        font-size: 15px !important;
        font-weight: 700 !important;
        letter-spacing: 0.5px !important;
        color: #ffffff !important;
        box-shadow: 0 4px 15px rgba(2, 132, 199, 0.35) !important;
        transition: all 0.2s ease !important;
        cursor: pointer !important;
        margin-top: 10px !important;
      }
      #btnLogin:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 25px rgba(2, 132, 199, 0.45) !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // Khử sạch nhiễu hạt, gạch ngang và chia thành 4 ô ký tự tách biệt rõ nét
  function renderCleanPanels(imgEl) {
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

    // 1. Lọc màu ký tự (diff = Blue - Red)
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

    // 2. Khử nhiễu chấm (Erosion 2x2 rồi Dilation 2x2)
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

    // 3. Lọc bỏ các đường gạch ngang mỏng (chiều cao nét đứng < 3px)
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

    // 4. Thuật toán tìm tâm tự động (Vertical Projection Profile)
    const proj = new Float32Array(w);
    for (let j = 0; j < w; j++) {
      let count = 0;
      for (let i = 0; i < h; i++) {
        if (vertClean[i * w + j]) count++;
      }
      proj[j] = count;
    }

    const smoothed = new Float32Array(w);
    for (let j = 0; j < w; j++) {
      const prev = j > 0 ? proj[j - 1] : proj[j];
      const next = j < w - 1 ? proj[j + 1] : proj[j];
      smoothed[j] = (prev + 2 * proj[j] + next) / 4.0;
    }

    const islands = [];
    let inIsland = false;
    let start = 0;
    for (let j = 0; j < w; j++) {
      if (smoothed[j] > 1.5 && !inIsland) {
        inIsland = true;
        start = j;
      } else if (smoothed[j] <= 1.5 && inIsland) {
        inIsland = false;
        if (j - start >= 5) {
          islands.push({ start, end: j });
        }
      }
    }
    if (inIsland && w - start >= 5) {
      islands.push({ start, end: w });
    }

    let centers = [];
    if (islands.length === 4) {
      centers = islands.map((isl) => Math.round((isl.start + isl.end) / 2));
    } else if (islands.length > 4) {
      islands.sort((a, b) => (b.end - a.start) - (a.end - a.start));
      const top4 = islands.slice(0, 4).sort((a, b) => a.start - b.start);
      centers = top4.map((isl) => Math.round((isl.start + isl.end) / 2));
    } else {
      centers = [12, 38, 66, 94];
    }

    // 5. Cắt 4 ô Canvas đối xứng quanh tâm từng ký tự (nét chữ đen tuyền đậm nét)
    const panelWidth = 66;
    const panelHeight = 84;
    const sliceWidth = 28;

    for (let s = 0; s < 4; s++) {
      const canvas = $(`#iuh-panel-${s}`);
      if (!canvas) continue;
      canvas.width = panelWidth;
      canvas.height = panelHeight;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, panelWidth, panelHeight);

      const cx = centers[s] ?? Math.round(12 + s * 27);
      const xStart = Math.max(0, Math.min(w - sliceWidth, Math.round(cx - sliceWidth / 2)));

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = sliceWidth;
      sliceCanvas.height = h;
      const sCtx = sliceCanvas.getContext("2d");
      const sImgData = sCtx.createImageData(sliceWidth, h);
      const sData = sImgData.data;

      for (let i = 0; i < h; i++) {
        for (let j = 0; j < sliceWidth; j++) {
          const sIdx = (i * sliceWidth + j) * 4;
          const origIdx = i * w + (xStart + j);
          if (vertClean[origIdx]) {
            // Nét chữ: Đen tuyền sắc nét (#000000)
            sData[sIdx] = 0;
            sData[sIdx + 1] = 0;
            sData[sIdx + 2] = 0;
            sData[sIdx + 3] = 255;
          } else {
            // Nền trắng tinh (#ffffff)
            sData[sIdx] = 255;
            sData[sIdx + 1] = 255;
            sData[sIdx + 2] = 255;
            sData[sIdx + 3] = 255;
          }
        }
      }
      sCtx.putImageData(sImgData, 0, 0);
      ctx.drawImage(sliceCanvas, 0, 0, panelWidth, panelHeight);
    }
    return true;
  }

  // Tạo khối giao diện hỗ trợ thị giác cho người mắt kém
  function attachEnhancedUI(imgEl, capEl) {
    let box = $("#iuh-enhanced-box");
    if (!box) {
      box = document.createElement("div");
      box.id = "iuh-enhanced-box";
      box.style.cssText =
        "margin: 12px 0 14px 0; padding: 12px; background: #ffffff; border: 2px solid #0284c7; " +
        "border-radius: 14px; box-shadow: 0 4px 20px rgba(2,132,199,0.15); text-align: center;";

      const header = document.createElement("div");
      header.style.cssText =
        "font: 12px/1.3 system-ui, -apple-system, sans-serif; font-weight: bold; color: #0369a1; " +
        "margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;";
      header.innerHTML = `
        <span>👁️ MÃ BẢO VỆ ĐÃ TÁCH 4 Ô RÕ NÉT (DÀNH CHO MẮT KÉM):</span>
        <button id="iuh-btn-refresh" type="button" style="border:0; background:#e0f2fe; color:#0284c7; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold; transition:all .2s;">🔄 Đổi mã khác</button>
      `;

      // Hàng 1: 4 Ô Canvas ký tự đã khử sạch nhiễu & căn giữa chuẩn
      const panelsRow = document.createElement("div");
      panelsRow.style.cssText = "display: flex; gap: 8px; justify-content: center; margin-bottom: 8px;";
      panelsRow.innerHTML = `
        <canvas id="iuh-panel-0" style="display:block; border: 2px solid #cbd5e1; border-radius: 8px; background: #fff;"></canvas>
        <canvas id="iuh-panel-1" style="display:block; border: 2px solid #cbd5e1; border-radius: 8px; background: #fff;"></canvas>
        <canvas id="iuh-panel-2" style="display:block; border: 2px solid #cbd5e1; border-radius: 8px; background: #fff;"></canvas>
        <canvas id="iuh-panel-3" style="display:block; border: 2px solid #cbd5e1; border-radius: 8px; background: #fff;"></canvas>
      `;

      // Hàng 2: 4 Ô Phông chữ chuẩn khổng lồ (34px) tương ứng
      const fontBoxTitle = document.createElement("div");
      fontBoxTitle.style.cssText =
        "font: 11px/1.2 system-ui, sans-serif; font-weight: bold; color: #475569; margin-bottom: 6px;";
      fontBoxTitle.textContent = "🔤 PHÔNG CHỮ CHUẨN IN HOA TO RÕ KHI BẠN GÕ:";

      const lettersRow = document.createElement("div");
      lettersRow.id = "iuh-letters-row";
      lettersRow.style.cssText = "display: flex; gap: 8px; justify-content: center; margin-bottom: 4px;";
      lettersRow.innerHTML = `
        <div class="iuh-char-box" id="iuh-c0" style="width:66px;height:52px;line-height:50px;font-size:34px;font-weight:900;font-family:system-ui,Arial,sans-serif;background:#f8fafc;color:#0284c7;border:2px solid #38bdf8;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.06);text-align:center;">-</div>
        <div class="iuh-char-box" id="iuh-c1" style="width:66px;height:52px;line-height:50px;font-size:34px;font-weight:900;font-family:system-ui,Arial,sans-serif;background:#f8fafc;color:#0284c7;border:2px solid #38bdf8;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.06);text-align:center;">-</div>
        <div class="iuh-char-box" id="iuh-c2" style="width:66px;height:52px;line-height:50px;font-size:34px;font-weight:900;font-family:system-ui,Arial,sans-serif;background:#f8fafc;color:#0284c7;border:2px solid #38bdf8;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.06);text-align:center;">-</div>
        <div class="iuh-char-box" id="iuh-c3" style="width:66px;height:52px;line-height:50px;font-size:34px;font-weight:900;font-family:system-ui,Arial,sans-serif;background:#f8fafc;color:#0284c7;border:2px solid #38bdf8;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.06);text-align:center;">-</div>
      `;

      const hint = document.createElement("div");
      hint.style.cssText = "font: 11px system-ui, sans-serif; color: #64748b; margin-top: 6px;";
      hint.textContent = "👉 Nhìn 4 ô ảnh trên và gõ nhanh 4 ký tự — hệ thống tự động đăng nhập ngay!";

      box.appendChild(header);
      box.appendChild(panelsRow);
      box.appendChild(fontBoxTitle);
      box.appendChild(lettersRow);
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

    if (imgEl) {
      renderCleanPanels(imgEl);
    }
  }

  // Cập nhật 4 ô phông chữ chuẩn to khi người dùng gõ
  function updateRenderedLetters(text) {
    const val = (text || "").toUpperCase();
    for (let i = 0; i < 4; i++) {
      const el = $(`#iuh-c${i}`);
      if (el) {
        el.textContent = val[i] || "-";
        el.style.color = val[i] ? "#0f172a" : "#94a3b8";
      }
    }
  }

  async function main() {
    if (location.pathname.includes("ThongTinPortal") || location.pathname.includes("DangKyHocPhan")) {
      return;
    }

    // Tiêm theme giao diện hiện đại & cool ngầu
    injectModernCoolTheme();

    const cfg = await getStorage({
      username: "",
      password: "",
      autoLogin: true
    });

    if (!cfg.username || !cfg.password) {
      if ($("#UserName") || $("input[name=UserName]")) {
        banner("IUH ĐKHP: Chưa lưu tài khoản — mở tiện ích để nhập MSSV & Mật khẩu.", "#b00020");
      }
      return;
    }
    if (!cfg.autoLogin) return;

    // Chờ form xuất hiện
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

    // 2. Chức năng thông minh: Gõ chữ thường tự đổi thành chữ IN HOA
    // Hiển thị trực tiếp vào 4 ô chữ to và tự động đăng nhập khi gõ đủ 4 ký tự!
    capEl.addEventListener("input", (e) => {
      const upper = capEl.value.toUpperCase();
      if (capEl.value !== upper) {
        capEl.value = upper;
      }
      updateRenderedLetters(capEl.value);

      // Khi người dùng gõ đủ 4 ký tự -> tự động submit đăng nhập ngay lập tức
      if (e.isTrusted && capEl.value.trim().length === 4) {
        banner("✓ Đã nhập đủ 4 ký tự. Đang đăng nhập...", "#16a34a");
        submit();
      }
    });

    // Nhấn Enter submit ngay lập tức
    capEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });

    // 3. Quy trình khử nhiễu + Tách 4 ô chuẩn tâm
    const runProcess = async () => {
      for (let i = 0; i < 25; i++) {
        if (imgEl.complete && imgEl.naturalWidth >= 40) break;
        await sleep(100);
      }

      // Gắn giao diện hỗ trợ người mắt kém
      attachEnhancedUI(imgEl, capEl);
      banner("IUH ĐKHP: Đã tách 4 ô to rõ — nhìn 4 ô trên và gõ 4 ký tự.", "#0284c7");
      capEl.focus();
    };

    await runProcess();

    // Tự động cập nhật lại khi ảnh thay đổi
    if (imgEl) {
      imgEl.addEventListener("load", () => {
        setTimeout(runProcess, 150);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main, { once: true });
  } else {
    main();
  }
})();
