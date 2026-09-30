// =====================================================================
// IUH Fast Login — Content Script cho Đăng ký học phần (DKHP)
// ---------------------------------------------------------------------
// Chạy trên https://dkhp.iuh.edu.vn/*
//
// Tính năng trợ năng & tự động hóa:
//   1. Tự động điền MSSV + Mật khẩu đã lưu.
//   2. Khử sạch nhiễu chấm, gạch ngang và TỰ ĐỘNG TÌM TÂM TỪNG KÝ TỰ (Dynamic Projection).
//   3. Tách thành 4 ô ký tự nguyên vẹn, KHÔNG BỊ CẮT ĐÔI, phóng to 2.4x (66x84px) sắc nét.
//   4. AI gợi ý mã phông chữ chuẩn to (32px) bên dưới từng ô tương ứng.
//   5. Tự động xuất mã vào ô #Captcha + Tự in hoa + Tự submit khi gõ đủ 4 ký tự hoặc nhấn Enter.
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

  // Khử sạch nhiễu hạt, gạch ngang và tự động tìm tâm 4 ký tự để không bao giờ bị cắt đôi
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
    // Tính mật độ nét vẽ trên từng cột X
    const proj = new Float32Array(w);
    for (let j = 0; j < w; j++) {
      let count = 0;
      for (let i = 0; i < h; i++) {
        if (vertClean[i * w + j]) count++;
      }
      proj[j] = count;
    }

    // Làm mượt biểu đồ mật độ (Moving average)
    const smoothed = new Float32Array(w);
    for (let j = 0; j < w; j++) {
      const prev = j > 0 ? proj[j - 1] : proj[j];
      const next = j < w - 1 ? proj[j + 1] : proj[j];
      smoothed[j] = (prev + 2 * proj[j] + next) / 4.0;
    }

    // Tìm các cụm ký tự (islands)
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

    // Xác định tâm của 4 ký tự chính xác
    let centers = [];
    if (islands.length === 4) {
      centers = islands.map((isl) => Math.round((isl.start + isl.end) / 2));
    } else if (islands.length > 4) {
      // Lấy 4 cụm ký tự nổi bật nhất
      islands.sort((a, b) => (b.end - b.start) - (a.end - a.start));
      const top4 = islands.slice(0, 4).sort((a, b) => a.start - b.start);
      centers = top4.map((isl) => Math.round((isl.start + isl.end) / 2));
    } else {
      // Dự phòng căn đều nếu có chữ dính nhau
      centers = [12, 38, 66, 94];
    }

    // 5. Cắt 4 ô Canvas đối xứng quanh tâm từng ký tự (không bao giờ bị cắt đôi)
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

      // Nền trắng tinh
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, panelWidth, panelHeight);

      // Cắt đối xứng 28px quanh tâm của ký tự đó
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
            // Nét chữ: Xanh navy đậm tuyệt đối
            sData[sIdx] = 10;
            sData[sIdx + 1] = 37;
            sData[sIdx + 2] = 155;
            sData[sIdx + 3] = 255;
          } else {
            // Nền trắng
            sData[sIdx] = 255;
            sData[sIdx + 1] = 255;
            sData[sIdx + 2] = 255;
            sData[sIdx + 3] = 255;
          }
        }
      }
      sCtx.putImageData(sImgData, 0, 0);

      // Phóng to lên panel 66x84
      ctx.drawImage(sliceCanvas, 0, 0, panelWidth, panelHeight);
    }
    return true;
  }

  async function solveCaptcha(imgEl) {
    if (!imgEl) return "";
    for (let i = 0; i < 30; i++) {
      if (imgEl.complete && imgEl.naturalWidth >= 40) break;
      await sleep(100);
    }
    if (!imgEl.complete || imgEl.naturalWidth < 10) return "";
    if (!globalThis.IUH_DKHP_SOLVER || !globalThis.IUH_DKHP_SOLVER.predict) return "";

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 110;
      canvas.height = 35;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(imgEl, 0, 0, 110, 35);
      const code = globalThis.IUH_DKHP_SOLVER.predict(canvas);
      return (code || "").toUpperCase();
    } catch (e) {
      console.error("[IUH Fast Login] Lỗi khi giải captcha:", e);
      return "";
    }
  }

  // Tạo khối giao diện hỗ trợ thị giác cho người mắt kém
  function attachEnhancedUI(imgEl, capEl) {
    let box = $("#iuh-enhanced-box");
    if (!box) {
      box = document.createElement("div");
      box.id = "iuh-enhanced-box";
      box.style.cssText =
        "margin: 12px 0 14px 0; padding: 12px; background: #f8fafc; border: 2px solid #0284c7; " +
        "border-radius: 12px; box-shadow: 0 4px 16px rgba(2,132,199,0.18); text-align: center;";

      // Tiêu đề & Nút đổi mã
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
        <canvas id="iuh-panel-0" style="display:block; border: 2px solid #94a3b8; border-radius: 8px; background: #fff;"></canvas>
        <canvas id="iuh-panel-1" style="display:block; border: 2px solid #94a3b8; border-radius: 8px; background: #fff;"></canvas>
        <canvas id="iuh-panel-2" style="display:block; border: 2px solid #94a3b8; border-radius: 8px; background: #fff;"></canvas>
        <canvas id="iuh-panel-3" style="display:block; border: 2px solid #94a3b8; border-radius: 8px; background: #fff;"></canvas>
      `;

      // Hàng 2: 4 Ô Phông chữ chuẩn khổng lồ (32px) tương ứng
      const fontBoxTitle = document.createElement("div");
      fontBoxTitle.style.cssText =
        "font: 11px/1.2 system-ui, sans-serif; font-weight: bold; color: #475569; margin-bottom: 6px;";
      fontBoxTitle.textContent = "🔤 GỢI Ý PHÔNG CHỮ CHUẨN ĐÃ NHẬN DIỆN:";

      const lettersRow = document.createElement("div");
      lettersRow.id = "iuh-letters-row";
      lettersRow.style.cssText = "display: flex; gap: 8px; justify-content: center; margin-bottom: 4px;";
      lettersRow.innerHTML = `
        <div class="iuh-char-box" id="iuh-c0" style="width:66px;height:52px;line-height:50px;font-size:32px;font-weight:900;font-family:system-ui,Arial,sans-serif;background:#ffffff;color:#0284c7;border:2px solid #38bdf8;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.06);text-align:center;">-</div>
        <div class="iuh-char-box" id="iuh-c1" style="width:66px;height:52px;line-height:50px;font-size:32px;font-weight:900;font-family:system-ui,Arial,sans-serif;background:#ffffff;color:#0284c7;border:2px solid #38bdf8;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.06);text-align:center;">-</div>
        <div class="iuh-char-box" id="iuh-c2" style="width:66px;height:52px;line-height:50px;font-size:32px;font-weight:900;font-family:system-ui,Arial,sans-serif;background:#ffffff;color:#0284c7;border:2px solid #38bdf8;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.06);text-align:center;">-</div>
        <div class="iuh-char-box" id="iuh-c3" style="width:66px;height:52px;line-height:50px;font-size:32px;font-weight:900;font-family:system-ui,Arial,sans-serif;background:#ffffff;color:#0284c7;border:2px solid #38bdf8;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.06);text-align:center;">-</div>
      `;

      box.appendChild(header);
      box.appendChild(panelsRow);
      box.appendChild(fontBoxTitle);
      box.appendChild(lettersRow);

      // Chèn khối trợ lý ngay trên hàng nhập captcha
      const targetParent = capEl.closest(".form-group") || capEl.closest(".row") || capEl.parentElement;
      if (targetParent && targetParent.parentElement) {
        targetParent.parentElement.insertBefore(box, targetParent);
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
      renderCleanPanels(imgEl);
    }
  }

  // Cập nhật 4 ô phông chữ chuẩn khổng lồ
  function updateRenderedLetters(code) {
    if (!code || code.length < 4) return;
    for (let i = 0; i < 4; i++) {
      const el = $(`#iuh-c${i}`);
      if (el) {
        el.textContent = code[i];
        el.style.color = "#0284c7";
      }
    }
  }

  async function main() {
    if (location.pathname.includes("ThongTinPortal") || location.pathname.includes("DangKyHocPhan")) {
      return;
    }

    const cfg = await getStorage({
      username: "",
      password: "",
      autoLogin: true,
      dkhpAutoSubmit: false
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
    capEl.addEventListener("input", (e) => {
      const upper = capEl.value.toUpperCase();
      if (capEl.value !== upper) {
        capEl.value = upper;
      }
      // Đồng bộ vào 4 ô chữ to
      if (capEl.value.length === 4) {
        updateRenderedLetters(capEl.value);
      }
      // Nếu người dùng tự tay gõ đủ 4 ký tự -> tự động đăng nhập ngay lập tức
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

    // 3. Quy trình khử nhiễu + Tách 4 ô chuẩn tâm + Nhận diện phông chữ + Tự động hóa
    const runProcess = async () => {
      for (let i = 0; i < 25; i++) {
        if (imgEl.complete && imgEl.naturalWidth >= 40) break;
        await sleep(100);
      }

      // Gắn giao diện hỗ trợ người mắt kém
      attachEnhancedUI(imgEl, capEl);

      // AI nhận diện mã
      banner("IUH ĐKHP: Đang nhận diện & chuyển thành phông chữ chuẩn...", "#0284c7");
      const code = await solveCaptcha(imgEl);

      if (code && code.length === 4) {
        // Cập nhật ra 4 ô chữ to rõ ràng
        updateRenderedLetters(code);
        // Tự động xuất vào ô input
        setValue(capEl, code);
        capEl.focus();
        capEl.select?.();

        if (cfg.dkhpAutoSubmit) {
          banner(`✓ Đã điền [${code}]. Đang tự động đăng nhập...`, "#16a34a");
          await sleep(450);
          submit();
        } else {
          banner(`✓ Đã điền mã [${code}]. Nhìn 4 ô chữ to & bấm Enter để vào ngay!`, "#16a34a");
        }
      } else {
        banner("IUH ĐKHP: Đã tách 4 ô to rõ — nhìn 4 ô trên và gõ 4 ký tự rồi Enter.", "#0b6e99");
        capEl.focus();
      }
    };

    await runProcess();

    // Tự động nhận diện & cập nhật lại khi ảnh thay đổi
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
