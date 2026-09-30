// =====================================================================
// IUH Fast Login — Content Script cho Đăng ký học phần (DKHP)
// ---------------------------------------------------------------------
// Thiết kế: Tối giản, Tự nhiên, Đẹp mắt, Không chữ thừa, Không lệch.
// Tự động điền MSSV, Mật khẩu, hiển thị 4 ô ký tự sắc nét và tự động hóa.
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

  // Tinh chỉnh form input và nút đăng nhập cho hiện đại, đồng bộ, không lệch
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

  // Khử nhiễu hạt, gạch ngang và chia thành 4 ô ký tự tách biệt rõ nét
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
    const panelWidth = 52;
    const panelHeight = 64;
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

      // Glyph 24x28 cho bộ nhận diện AI
      const glyph24x28 = new Float32Array(24 * 28);

      for (let i = 0; i < h; i++) {
        for (let j = 0; j < sliceWidth; j++) {
          const sIdx = (i * sliceWidth + j) * 4;
          const origIdx = i * w + (xStart + j);
          if (vertClean[origIdx]) {
            sData[sIdx] = 15;
            sData[sIdx + 1] = 23;
            sData[sIdx + 2] = 42;
            sData[sIdx + 3] = 255;
            // Ánh xạ sang glyph 24x28
            const gy = Math.min(27, Math.floor((i * 28) / h));
            glyph24x28[gy * 24 + j] = 1.0;
          } else {
            sData[sIdx] = 255;
            sData[sIdx + 1] = 255;
            sData[sIdx + 2] = 255;
            sData[sIdx + 3] = 255;
          }
        }
      }
      sCtx.putImageData(sImgData, 0, 0);
      ctx.drawImage(sliceCanvas, 0, 0, panelWidth, panelHeight);

      // Nhận diện ký tự nếu có solver
      if (globalThis.IUH_GLYPH_SOLVER && globalThis.IUH_GLYPH_SOLVER.classify) {
        try {
          const char = globalThis.IUH_GLYPH_SOLVER.classify(glyph24x28);
          predictedCode += char;
        } catch (_) {}
      }
    }

    return predictedCode;
  }

  // Khối hiển thị 4 ô ký tự sạch sẽ, gọn gàng, không chữ thừa, không lệch
  function attachCleanPreview(imgEl, capEl) {
    let box = $("#iuh-captcha-preview");
    if (!box) {
      box = document.createElement("div");
      box.id = "iuh-captcha-preview";
      box.style.cssText =
        "display: flex; align-items: center; justify-content: center; gap: 8px; margin: 6px 0 12px 0;";

      box.innerHTML = `
        <canvas id="iuh-panel-0" style="display:block; width:52px; height:64px; border: 1.5px solid #cbd5e1; border-radius: 8px; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.04);"></canvas>
        <canvas id="iuh-panel-1" style="display:block; width:52px; height:64px; border: 1.5px solid #cbd5e1; border-radius: 8px; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.04);"></canvas>
        <canvas id="iuh-panel-2" style="display:block; width:52px; height:64px; border: 1.5px solid #cbd5e1; border-radius: 8px; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.04);"></canvas>
        <canvas id="iuh-panel-3" style="display:block; width:52px; height:64px; border: 1.5px solid #cbd5e1; border-radius: 8px; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.04);"></canvas>
        <button id="iuh-btn-refresh" type="button" title="Đổi mã khác" style="border: 1px solid #cbd5e1; background: #f8fafc; color: #0284c7; width: 38px; height: 38px; border-radius: 8px; cursor: pointer; font-size: 17px; display: flex; align-items: center; justify-content: center; margin-left: 4px; transition: all .2s;">🔄</button>
      `;

      // Chèn ngay trước dòng nhập mã bảo vệ
      const targetGroup = capEl.closest(".form-group") || capEl.parentElement;
      if (targetGroup && targetGroup.parentElement) {
        targetGroup.parentElement.insertBefore(box, targetGroup);
      } else {
        capEl.parentElement.insertBefore(box, capEl);
      }

      // Xử lý nút đổi mã
      $("#iuh-btn-refresh")?.addEventListener("click", () => {
        const refreshBtn = $(".captcharefresh") || $("a[class*='refresh']");
        if (refreshBtn) refreshBtn.click();
        else if (imgEl) imgEl.click();
      });
    }

    if (imgEl) {
      return renderCleanPanels(imgEl);
    }
    return "";
  }

  async function main() {
    if (location.pathname.includes("ThongTinPortal") || location.pathname.includes("DangKyHocPhan")) {
      return;
    }

    // Tinh chỉnh form gọn gàng, hiện đại
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

    // 2. Tự động chuyển chữ thường thành chữ IN HOA
    capEl.addEventListener("input", (e) => {
      const upper = capEl.value.toUpperCase();
      if (capEl.value !== upper) {
        capEl.value = upper;
      }
      // Gõ đủ 4 ký tự -> tự động đăng nhập ngay lập tức
      if (e.isTrusted && capEl.value.trim().length === 4) {
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

    // 3. Quy trình làm sạch ảnh & Tự động hóa
    const runProcess = async () => {
      for (let i = 0; i < 25; i++) {
        if (imgEl.complete && imgEl.naturalWidth >= 40) break;
        await sleep(100);
      }

      // Gắn 4 ô ảnh sạch sẽ và nhận diện mã
      const code = attachCleanPreview(imgEl, capEl);

      // Tự động điền mã nếu nhận diện được 4 ký tự
      if (code && code.length === 4) {
        setValue(capEl, code);
        capEl.focus();
        capEl.select?.();
      } else {
        capEl.focus();
      }
    };

    await runProcess();

    // Tự động cập nhật lại khi bấm đổi ảnh
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
