// =====================================================================
// IUH Fast Login — Content Script cho Đăng ký học phần (DKHP)
// ---------------------------------------------------------------------
// Thiết kế: Tinh tế, Hiện đại, Gọn gàng, Hiển thị song song:
//   1. Ảnh gốc phóng to sắc nét (không bị bóp méo, đầy đủ 100% nét).
//   2. 4 ô ký tự đã khử sạch nhiễu & căn chuẩn tâm (Center-of-Mass).
//   3. Tự động điền MSSV & Mật khẩu + Tự in hoa + Tự submit khi gõ đủ 4 ký tự.
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

  // Tinh chỉnh form gọn gàng, hiện đại
  function injectCleanTheme() {
    if ($("#iuh-clean-theme")) return;
    const style = document.createElement("style");
    style.id = "iuh-clean-theme";
    style.textContent = `
      * {
        font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif !important;
      }
      .center-login {
        border-radius: 16px !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
        border: 1px solid #e2e8f0 !important;
        padding: 28px 32px !important;
      }
      .center-login .input-group {
        border: 1.5px solid #cbd5e1 !important;
        border-radius: 10px !important;
        overflow: hidden !important;
        transition: all 0.2s ease !important;
        background: #ffffff !important;
        margin-bottom: 12px !important;
      }
      .center-login .input-group:focus-within {
        border-color: #0284c7 !important;
        box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15) !important;
      }
      .center-login .input-group-text {
        background: #f8fafc !important;
        border: none !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        color: #475569 !important;
        padding: 10px 14px !important;
      }
      .center-login input.form-control,
      .center-login input[type="text"],
      .center-login input[type="password"] {
        border: none !important;
        box-shadow: none !important;
        font-size: 14.5px !important;
        padding: 10px 14px !important;
      }
      #btnLogin, .center-login .btn-primary {
        background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
        border: none !important;
        border-radius: 10px !important;
        padding: 12px 20px !important;
        font-size: 15px !important;
        font-weight: 700 !important;
        letter-spacing: 0.5px !important;
        color: #ffffff !important;
        box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3) !important;
        transition: all 0.2s ease !important;
        cursor: pointer !important;
        width: 100% !important;
        margin-top: 10px !important;
      }
      #btnLogin:hover, .center-login .btn-primary:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 20px rgba(2, 132, 199, 0.4) !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // Vẽ ảnh gốc phóng to sắc nét (không bị bóp méo hình ảnh)
  function renderOriginalCanvas(imgEl) {
    const canvas = $("#iuh-orig-canvas");
    if (!canvas || !imgEl || !imgEl.complete || imgEl.naturalWidth < 10) return;
    canvas.width = 154;
    canvas.height = 49;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(imgEl, 0, 0, 154, 49);
  }

  // Khử sạch nhiễu hạt, gạch ngang và chia thành 4 ô ký tự tách biệt rõ nét theo tâm điểm khối lượng (Center of Mass)
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

    // 4. Thuật toán tìm tâm từng ký tự bằng Center of Mass (không bao giờ bị mất ký tự thứ 4)
    const proj = new Float32Array(w);
    for (let j = 0; j < w; j++) {
      let count = 0;
      for (let i = 0; i < h; i++) {
        if (vertClean[i * w + j]) count++;
      }
      proj[j] = count;
    }

    // Chia làm 4 vùng tự nhiên: 0..29, 26..56, 52..82, 78..110
    const quarters = [
      [0, 29],
      [26, 56],
      [52, 82],
      [78, 110]
    ];

    const centers = [];
    for (let s = 0; s < 4; s++) {
      const [qStart, qEnd] = quarters[s];
      let totalW = 0;
      let weightedSum = 0;
      for (let x = qStart; x < qEnd; x++) {
        const val = proj[x];
        totalW += val;
        weightedSum += x * val;
      }
      if (totalW > 0) {
        centers.push(Math.round(weightedSum / totalW));
      } else {
        centers.push(Math.round((qStart + qEnd) / 2));
      }
    }

    // 5. Cắt 4 ô Canvas đối xứng quanh tâm từng ký tự (nét chữ đen tuyền đậm nét)
    const panelWidth = 36;
    const panelHeight = 49;
    const sliceWidth = 24;
    let predictedCode = "";

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

      const glyph24x28 = new Float32Array(24 * 28);

      for (let i = 0; i < h; i++) {
        for (let j = 0; j < sliceWidth; j++) {
          const sIdx = (i * sliceWidth + j) * 4;
          const origIdx = i * w + (xStart + j);
          if (vertClean[origIdx]) {
            sData[sIdx] = 15;
            sData[sIdx + 1] = 23;
            sData[sIdx + 2] = 42;
            sData[sIdx + 3] = 255; // Nét chữ đậm đen
            const gy = Math.min(27, Math.floor((i * 28) / h));
            glyph24x28[gy * 24 + j] = 1.0;
          } else {
            sData[sIdx] = 255;
            sData[sIdx + 1] = 255;
            sData[sIdx + 2] = 255;
            sData[sIdx + 3] = 255; // Nền trắng
          }
        }
      }
      sCtx.putImageData(sImgData, 0, 0);
      ctx.drawImage(sliceCanvas, 0, 0, panelWidth, panelHeight);

      if (globalThis.IUH_GLYPH_SOLVER && globalThis.IUH_GLYPH_SOLVER.classify) {
        try {
          const char = globalThis.IUH_GLYPH_SOLVER.classify(glyph24x28);
          predictedCode += char;
        } catch (_) {}
      }
    }

    return predictedCode;
  }

  // Khối hiển thị song song: Ảnh gốc sắc nét + 4 ô khử nhiễu tách rời
  function attachCaptchaCard(imgEl, capEl) {
    let card = $("#iuh-captcha-card");
    if (!card) {
      card = document.createElement("div");
      card.id = "iuh-captcha-card";
      card.style.cssText =
        "margin: 8px 0 14px 0; padding: 12px 14px; background: #f8fafc; border: 1.5px solid #e2e8f0; " +
        "border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);";

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 5px;">
            <span>🛡️</span> Mã xác nhận
          </span>
          <button id="iuh-btn-refresh" type="button" style="border: 1px solid #cbd5e1; background: #ffffff; color: #0284c7; padding: 3px 9px; border-radius: 6px; cursor: pointer; font-size: 11.5px; font-weight: 600; display: flex; align-items: center; gap: 4px; transition: all .2s;">
            🔄 Đổi mã khác
          </button>
        </div>
        <div style="display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap;">
          <div style="text-align: center;">
            <div style="font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 4px;">ẢNH GỐC ĐẦY ĐỦ</div>
            <div style="border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #fff; display: inline-block; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
              <canvas id="iuh-orig-canvas" style="display: block; width: 154px; height: 49px;"></canvas>
            </div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 10px; font-weight: 700; color: #0284c7; margin-bottom: 4px;">KHỬ NHIỄU TO RÕ</div>
            <div style="display: flex; gap: 5px;">
              <canvas id="iuh-panel-0" style="width: 36px; height: 49px; border: 1.5px solid #cbd5e1; border-radius: 6px; background: #fff;"></canvas>
              <canvas id="iuh-panel-1" style="width: 36px; height: 49px; border: 1.5px solid #cbd5e1; border-radius: 6px; background: #fff;"></canvas>
              <canvas id="iuh-panel-2" style="width: 36px; height: 49px; border: 1.5px solid #cbd5e1; border-radius: 6px; background: #fff;"></canvas>
              <canvas id="iuh-panel-3" style="width: 36px; height: 49px; border: 1.5px solid #cbd5e1; border-radius: 6px; background: #fff;"></canvas>
            </div>
          </div>
        </div>
      `;

      // Chèn card ngay trên hàng nhập captcha
      const targetGroup = capEl.closest(".form-group") || capEl.closest(".input-group") || capEl.parentElement;
      if (targetGroup && targetGroup.parentElement) {
        targetGroup.parentElement.insertBefore(card, targetGroup);
      } else {
        capEl.parentElement.insertBefore(card, capEl);
      }

      // Ẩn ảnh captcha cũ bị bóp méo trong ô input để ô nhập mã rộng rãi
      const origContainer = $("div[class*='captchaContainer']") || imgEl.parentElement;
      if (origContainer && origContainer !== card) {
        origContainer.style.display = "none";
      }
      const origRefreshBtn = $("a[class*='refresh']");
      if (origRefreshBtn) {
        origRefreshBtn.style.display = "none";
      }

      $("#iuh-btn-refresh")?.addEventListener("click", () => {
        if (origRefreshBtn) origRefreshBtn.click();
        else if (imgEl) imgEl.click();
      });
    }

    renderOriginalCanvas(imgEl);
    return renderCleanPanels(imgEl);
  }

  async function main() {
    if (location.pathname.includes("ThongTinPortal") || location.pathname.includes("DangKyHocPhan")) {
      return;
    }

    injectCleanTheme();

    const cfg = await getStorage({
      username: "",
      password: "",
      autoLogin: true
    });

    if (!cfg.username || !cfg.password) return;
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

    // 2. Tự động chuyển chữ in hoa & Tự submit khi gõ đủ 4 ký tự
    capEl.addEventListener("input", (e) => {
      const upper = capEl.value.toUpperCase();
      if (capEl.value !== upper) {
        capEl.value = upper;
      }
      if (e.isTrusted && capEl.value.trim().length === 4) {
        submit();
      }
    });

    capEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });

    // 3. Quy trình hiển thị song song & Nhận diện tự động
    const runProcess = async () => {
      for (let i = 0; i < 25; i++) {
        if (imgEl.complete && imgEl.naturalWidth >= 40) break;
        await sleep(100);
      }

      const code = attachCaptchaCard(imgEl, capEl);
      if (code && code.length === 4) {
        setValue(capEl, code);
        capEl.focus();
        capEl.select?.();
      } else {
        capEl.focus();
      }
    };

    await runProcess();

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
