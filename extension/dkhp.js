// =====================================================================
// IUH Fast Login — Content Script cho Đăng ký học phần (DKHP)
// ---------------------------------------------------------------------
// Chạy trên https://dkhp.iuh.edu.vn/*
//
// Tính năng:
//   1. Dark Mode mặc định: Nền Aurora Cosmos Gradient đồng bộ 100% toàn trang.
//   2. Khử sạch nền trắng lót phía dưới (transparent wrapper) & tạo khoảng cách
//      thông thoáng giữa các bảng (margin 28px), không còn dính vào nhau.
//   3. Xóa sạch 2 banner trên và dưới (không còn logo trắng hay footer xanh).
//   4. Canh giữa trang portal hoàn hảo, giao diện đơn khối không viền lồng hộp.
//   5. Hiển thị song song: Ảnh gốc đầy đủ nét + 4 ô ký tự khử nhiễu tách biệt.
//   6. Tự động điền MSSV & Mật khẩu + Tự in hoa + Tự submit khi gõ đủ 4 ký tự hoặc bấm Enter.
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

  // Tiêm CSS Dark Mode & Light Mode toàn diện cho toàn bộ Cổng ĐKHP
  function injectDKHPTheme() {
    if ($("#iuh-dkhp-theme")) return;
    const style = document.createElement("style");
    style.id = "iuh-dkhp-theme";
    style.textContent = `
      /* Bảo vệ icon FontAwesome */
      *:not(i):not([class*="fa"]):not([class*="glyphicon"]):not([class*="icon"]):not(.k-icon):not([class*="fas"]):not([class*="far"]) {
        font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif !important;
      }
      i, .fa, [class*="fa-"], [class*="glyphicon"], [class*="icon"], .k-icon {
        font-family: FontAwesome, 'Glyphicons Halflings', 'font-awesome' !important;
      }

      /* 1. XÓA HOÀN TOÀN 2 BANNER TRÊN VÀ DƯỚI */
      #page-header, header, img[src*="banner"], .logo-top,
      footer, .footer, .txt-ft, .info-site-bot, .info-site-top,
      div[style*="background-color:#0069d9"], div[style*="background-color: #0069d9"] {
        display: none !important;
      }

      /* 2. CĂN GIỮA TRANG CHUẨN XÁC, KHÔNG LỆCH SANG TRÁI */
      .container, .body-content {
        max-width: 1200px !important;
        margin: 20px auto !important;
        padding: 0 20px !important;
        float: none !important;
        box-sizing: border-box !important;
      }

      /* FORM ĐĂNG NHẬP: ĐƠN KHỐI, BỎ HOÀN TOÀN VIỀN LỒNG BÊN TRONG */
      .center-login {
        border-radius: 20px !important;
        padding: 32px !important;
        max-width: 460px !important;
        margin: 30px auto !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        box-sizing: border-box !important;
      }
      #form-login, .form-login, .center-login > div, .center-login form {
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .center-login .input-group {
        border-radius: 12px !important;
        overflow: hidden !important;
        margin-bottom: 12px !important;
        transition: all 0.2s ease !important;
      }
      .center-login .input-group-text {
        font-size: 13px !important;
        font-weight: 600 !important;
        padding: 11px 14px !important;
        border: none !important;
      }
      .center-login input.form-control,
      .center-login input[type="text"],
      .center-login input[type="password"] {
        border: none !important;
        box-shadow: none !important;
        font-size: 15px !important;
        padding: 11px 14px !important;
      }

      /* Nút chuyển đổi Dark/Light mode nổi góc trên bên phải */
      #iuh-theme-toggle-btn {
        position: fixed;
        top: 14px;
        right: 18px;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      /* ========================================================
         1. DARK MODE: AURORA COSMOS GRADIENT (MẶC ĐỊNH)
         ======================================================== */
      html.iuh-dark, html.iuh-dark body {
        background-color: #030712 !important;
        background-image: 
          radial-gradient(at 15% 10%, rgba(99, 102, 241, 0.25) 0px, transparent 45%),
          radial-gradient(at 85% 15%, rgba(6, 182, 212, 0.20) 0px, transparent 45%),
          radial-gradient(at 50% 50%, rgba(147, 51, 234, 0.14) 0px, transparent 55%),
          radial-gradient(at 80% 85%, rgba(59, 130, 246, 0.18) 0px, transparent 50%),
          radial-gradient(at 20% 90%, rgba(236, 72, 153, 0.10) 0px, transparent 50%) !important;
        background-attachment: fixed !important;
        background-size: cover !important;
        color: #f8fafc !important;
        min-height: 100vh;
      }

      /* TRIỆT TIÊU TOÀN BỘ MÀN LÓT TRẮNG PHÍA SAU CÁC THẺ */
      html.iuh-dark .container,
      html.iuh-dark .container-fluid,
      html.iuh-dark .body-content,
      html.iuh-dark .row,
      html.iuh-dark [class*="col-"],
      html.iuh-dark div:has(> .info-account),
      html.iuh-dark div:has(> .border-box),
      html.iuh-dark div:has(> table),
      html.iuh-dark div:has(> .table-responsive),
      html.iuh-dark .main,
      html.iuh-dark #main,
      html.iuh-dark .content,
      html.iuh-dark .wrapper,
      html.iuh-dark .content-wrapper,
      html.iuh-dark div[style*="background: #fff"],
      html.iuh-dark div[style*="background:#fff"],
      html.iuh-dark div[style*="background-color: #fff"],
      html.iuh-dark div[style*="background-color:#fff"],
      html.iuh-dark div[style*="background: white"],
      html.iuh-dark div[style*="background-color: white"],
      html.iuh-dark div[style*="background: rgb(255, 255, 255)"],
      html.iuh-dark div[style*="background-color: rgb(255, 255, 255)"],
      html.iuh-dark div[style*="background:rgb(255, 255, 255)"],
      html.iuh-dark div[style*="background-color:rgb(255, 255, 255)"] {
        background: transparent !important;
        background-color: transparent !important;
        box-shadow: none !important;
        border-color: transparent !important;
      }

      /* Card đăng nhập trong Dark Mode */
      html.iuh-dark .center-login {
        background: rgba(15, 23, 42, 0.82) !important;
        backdrop-filter: blur(28px) saturate(190%) !important;
        -webkit-backdrop-filter: blur(28px) saturate(190%) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        box-shadow: 0 30px 70px -10px rgba(0, 0, 0, 0.75), 0 0 30px rgba(99, 102, 241, 0.15) !important;
        color: #f8fafc !important;
      }
      html.iuh-dark .center-login .input-group {
        background: rgba(3, 7, 18, 0.6) !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
      }
      html.iuh-dark .center-login .input-group:focus-within {
        border-color: #38bdf8 !important;
        box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25) !important;
      }
      html.iuh-dark .center-login .input-group-text {
        background: rgba(15, 23, 42, 0.6) !important;
        color: #94a3b8 !important;
        border: none !important;
      }
      html.iuh-dark .center-login input.form-control,
      html.iuh-dark .center-login input[type="text"],
      html.iuh-dark .center-login input[type="password"] {
        background: transparent !important;
        color: #f8fafc !important;
        border: none !important;
      }
      html.iuh-dark #iuh-captcha-card {
        background: rgba(3, 7, 18, 0.6) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
      }
      html.iuh-dark #iuh-btn-refresh {
        background: rgba(15, 23, 42, 0.8) !important;
        border: 1px solid #334155 !important;
        color: #38bdf8 !important;
      }
      html.iuh-dark #btnLogin, html.iuh-dark .center-login .btn-primary {
        background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%) !important;
        border: none !important;
        border-radius: 12px !important;
        padding: 13px 20px !important;
        font-size: 15.5px !important;
        font-weight: 800 !important;
        letter-spacing: 0.5px !important;
        color: #ffffff !important;
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4) !important;
        cursor: pointer !important;
        width: 100% !important;
        margin-top: 10px !important;
      }
      html.iuh-dark #btnLogin:hover, html.iuh-dark .center-login .btn-primary:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 30px rgba(139, 92, 246, 0.55) !important;
      }

      /* TỪNG CARD RIÊNG BIỆT TRONG PORTAL: NỀN DARK SLATE SANG TRỌNG */
      html.iuh-dark .info-account,
      html.iuh-dark .border-box,
      html.iuh-dark .info-sv,
      html.iuh-dark .select-card,
      html.iuh-dark .content-new,
      html.iuh-dark .panel,
      html.iuh-dark .box,
      html.iuh-dark .card,
      html.iuh-dark .well {
        background: #0f172a !important;
        background-color: #0f172a !important;
        border: 1px solid #1e293b !important;
        border-radius: 16px !important;
        box-shadow: 0 6px 25px rgba(0, 0, 0, 0.5) !important;
        color: #f8fafc !important;
        margin-bottom: 20px !important;
      }

      /* TẠO KHOẢNG CÁCH THÔNG THOÁNG GIỮA CÁC BẢNG (KHÔNG DÍNH VÀO NHAU) */
      html.iuh-dark table.table,
      html.iuh-dark table.table-bordered,
      html.iuh-dark .table-responsive {
        background: #0f172a !important;
        border: 1px solid #1e293b !important;
        border-radius: 14px !important;
        margin-top: 10px !important;
        margin-bottom: 28px !important;
        overflow: hidden !important;
        box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45) !important;
      }
      html.iuh-dark table.table thead th,
      html.iuh-dark table.table-bordered thead th {
        background: #1e293b !important;
        color: #38bdf8 !important;
        border: 1px solid #334155 !important;
        font-weight: 700 !important;
        padding: 12px 8px !important;
      }
      html.iuh-dark table.table tbody td,
      html.iuh-dark table.table-bordered tbody td {
        background: #0f172a !important;
        color: #e2e8f0 !important;
        border: 1px solid #1e293b !important;
        padding: 10px 8px !important;
      }
      html.iuh-dark table.table tbody tr:hover td {
        background: #19253d !important;
      }

      /* TIÊU ĐỀ MỤC: CÓ KHOẢNG CÁCH TOP VÀ MÀU CYAN NỔI BẬT */
      html.iuh-dark h1,
      html.iuh-dark h2,
      html.iuh-dark h3,
      html.iuh-dark h4,
      html.iuh-dark .section-title,
      html.iuh-dark .section-title-2,
      html.iuh-dark [style*="color: #007bff"],
      html.iuh-dark [style*="color:#007bff"],
      html.iuh-dark [style*="color: #0099ff"] {
        color: #38bdf8 !important;
        font-weight: 800 !important;
        margin-top: 26px !important;
        margin-bottom: 12px !important;
        display: block !important;
      }

      /* Nhãn thông tin chi tiết: xám sáng rõ nét */
      html.iuh-dark b,
      html.iuh-dark strong,
      html.iuh-dark label,
      html.iuh-dark .info-account b,
      html.iuh-dark .border-box b {
        color: #94a3b8 !important;
      }

      /* Chữ giá trị, nội dung: trắng sáng */
      html.iuh-dark p,
      html.iuh-dark span,
      html.iuh-dark td {
        color: #f8fafc;
      }

      /* Các liên kết menu */
      html.iuh-dark a {
        color: #38bdf8 !important;
      }
      html.iuh-dark a:hover {
        color: #7dd3fc !important;
      }

      /* Dropdown select (Đợt đăng ký...) */
      html.iuh-dark select,
      html.iuh-dark .custom-select,
      html.iuh-dark select.form-control {
        background-color: #1e293b !important;
        color: #f8fafc !important;
        border: 1px solid #334155 !important;
        border-radius: 8px !important;
        padding: 6px 12px !important;
      }

      /* Radio button & labels */
      html.iuh-dark input[type="radio"],
      html.iuh-dark input[type="checkbox"] {
        accent-color: #0284c7 !important;
      }
      html.iuh-dark .radio label,
      html.iuh-dark .checkbox label,
      html.iuh-dark label:has(input[type="radio"]),
      html.iuh-dark label:has(input[type="checkbox"]) {
        color: #f8fafc !important;
        font-weight: 600 !important;
      }

      /* Khối thông tin sinh viên góc trái */
      html.iuh-dark div[style*="background-color: #4a90e2"],
      html.iuh-dark div[style*="background-color:#4a90e2"],
      html.iuh-dark div[style*="background: #4a90e2"],
      html.iuh-dark div[style*="background-color: #007bff"],
      html.iuh-dark div[style*="background-color: #0099ff"] {
        background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%) !important;
        color: #ffffff !important;
        border-radius: 12px !important;
      }
      html.iuh-dark div[style*="background-color: #4a90e2"] *,
      html.iuh-dark div[style*="background-color: #007bff"] * {
        color: #ffffff !important;
      }

      /* Nút Toggle Mode */
      html.iuh-dark #iuh-theme-toggle-btn {
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(12px);
        color: #f8fafc;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      }
      html.iuh-dark #iuh-theme-toggle-btn:hover {
        background: rgba(30, 41, 59, 0.95);
        color: #38bdf8;
      }

      /* ========================================================
         2. LIGHT MODE: TRẮNG DỊU MẮT (SOFT OFF-WHITE) & NỔI 3D
         ======================================================== */
      html.iuh-light, html.iuh-light body {
        background-color: #f1f5f9 !important;
        background-image: 
          radial-gradient(at 50% 0%, #ffffff 0%, #edf2f7 100%) !important;
        background-attachment: fixed !important;
        color: #0f172a !important;
        min-height: 100vh;
      }
      html.iuh-light .center-login {
        background: #ffffff !important;
        border: 1px solid rgba(226, 232, 240, 0.8) !important;
        border-radius: 20px !important;
        box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.07), 0 0 1px 1px rgba(0, 0, 0, 0.04) !important;
      }
      html.iuh-light .center-login .input-group {
        background: #f8fafc !important;
        border: 1.5px solid #cbd5e1 !important;
      }
      html.iuh-light .center-login .input-group:focus-within {
        border-color: #0284c7 !important;
        box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15) !important;
      }
      html.iuh-light .center-login .input-group-text {
        background: #f1f5f9 !important;
        color: #475569 !important;
      }
      html.iuh-light .center-login input.form-control,
      html.iuh-light .center-login input[type="text"],
      html.iuh-light .center-login input[type="password"] {
        background: #f8fafc !important;
        color: #0f172a !important;
      }
      html.iuh-light #iuh-captcha-card {
        background: #f8fafc !important;
        border: 1.5px solid #e2e8f0 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03) !important;
      }
      html.iuh-light #iuh-btn-refresh {
        background: #ffffff !important;
        border: 1px solid #cbd5e1 !important;
        color: #0284c7 !important;
      }
      html.iuh-light #btnLogin, html.iuh-light .center-login .btn-primary {
        background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
        border: none !important;
        border-radius: 12px !important;
        padding: 13px 20px !important;
        font-size: 15px !important;
        font-weight: 700 !important;
        color: #ffffff !important;
        box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3) !important;
        cursor: pointer !important;
        width: 100% !important;
        margin-top: 10px !important;
      }
      /* Portal trong Light Mode: Nền trắng sạch sẽ, nổi 3D */
      html.iuh-light div[style*="border"],
      html.iuh-light .panel,
      html.iuh-light .box,
      html.iuh-light .card,
      html.iuh-light .table-responsive {
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 16px !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.03) !important;
        color: #0f172a !important;
      }
      html.iuh-light table.table {
        margin-bottom: 24px !important;
      }
      html.iuh-light #iuh-theme-toggle-btn {
        background: #ffffff;
        color: #0f172a;
        border: 1px solid #cbd5e1;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      html.iuh-light #iuh-theme-toggle-btn:hover {
        background: #f1f5f9;
        color: #0284c7;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function setupTheme(defaultMode = "dark") {
    injectDKHPTheme();
    api.storage.local.get({ theme_mode: defaultMode }, (res) => {
      const mode = res.theme_mode || defaultMode;
      applyThemeMode(mode);
    });
  }

  function applyThemeMode(mode) {
    const isDark = mode === "dark";
    document.documentElement.classList.remove("iuh-dark", "iuh-light");
    document.documentElement.classList.add(isDark ? "iuh-dark" : "iuh-light");

    let toggleBtn = $("#iuh-theme-toggle-btn");
    if (!toggleBtn) {
      toggleBtn = document.createElement("button");
      toggleBtn.id = "iuh-theme-toggle-btn";
      toggleBtn.type = "button";
      document.body.appendChild(toggleBtn);
      toggleBtn.addEventListener("click", () => {
        const currentIsDark = document.documentElement.classList.contains("iuh-dark");
        const newMode = currentIsDark ? "light" : "dark";
        api.storage.local.set({ theme_mode: newMode }, () => {
          applyThemeMode(newMode);
        });
      });
    }
    toggleBtn.innerHTML = isDark ? "☀️ Chế độ sáng" : "🌙 Chế độ tối";
  }

  // Vẽ ảnh gốc phóng to sắc nét
  function renderOriginalCanvas(imgEl) {
    const canvas = $("#iuh-orig-canvas");
    if (!canvas || !imgEl || !imgEl.complete || imgEl.naturalWidth < 10) return;
    canvas.width = 154;
    canvas.height = 49;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(imgEl, 0, 0, 154, 49);
  }

  // Khử sạch nhiễu hạt, gạch ngang và chia thành 4 ô ký tự theo Center of Mass
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

    // 4. Center of Mass
    const proj = new Float32Array(w);
    for (let j = 0; j < w; j++) {
      let count = 0;
      for (let i = 0; i < h; i++) {
        if (vertClean[i * w + j]) count++;
      }
      proj[j] = count;
    }

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

    // 5. Cắt 4 ô Canvas đối xứng quanh tâm
    const panelWidth = 36;
    const panelHeight = 49;
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
            sData[sIdx] = 15;
            sData[sIdx + 1] = 23;
            sData[sIdx + 2] = 42;
            sData[sIdx + 3] = 255;
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
    }
    return true;
  }

  // Khối hiển thị song song: Ảnh gốc + 4 ô tách rời
  function attachCaptchaCard(imgEl, capEl) {
    let card = $("#iuh-captcha-card");
    if (!card) {
      card = document.createElement("div");
      card.id = "iuh-captcha-card";
      card.style.cssText =
        "margin: 8px 0 14px 0; padding: 12px 14px; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);";

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 5px;">
            <span>🛡️</span> Mã xác nhận
          </span>
          <button id="iuh-btn-refresh" type="button" style="padding: 3px 9px; border-radius: 6px; cursor: pointer; font-size: 11.5px; font-weight: 600; display: flex; align-items: center; gap: 4px; transition: all .2s;">
            🔄 Đổi mã khác
          </button>
        </div>
        <div style="display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap;">
          <div style="text-align: center;">
            <div style="font-size: 10px; font-weight: 700; margin-bottom: 4px; opacity: 0.8;">ẢNH GỐC ĐẦY ĐỦ</div>
            <div style="border: 1.5px solid rgba(255,255,255,0.15); border-radius: 8px; overflow: hidden; background: #fff; display: inline-block; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
              <canvas id="iuh-orig-canvas" style="display: block; width: 154px; height: 49px;"></canvas>
            </div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 10px; font-weight: 700; color: #38bdf8; margin-bottom: 4px;">KHỬ NHIỄU TO RÕ</div>
            <div style="display: flex; gap: 5px;">
              <canvas id="iuh-panel-0" style="width: 36px; height: 49px; border: 1.5px solid rgba(255,255,255,0.15); border-radius: 6px; background: #fff;"></canvas>
              <canvas id="iuh-panel-1" style="width: 36px; height: 49px; border: 1.5px solid rgba(255,255,255,0.15); border-radius: 6px; background: #fff;"></canvas>
              <canvas id="iuh-panel-2" style="width: 36px; height: 49px; border: 1.5px solid rgba(255,255,255,0.15); border-radius: 6px; background: #fff;"></canvas>
              <canvas id="iuh-panel-3" style="width: 36px; height: 49px; border: 1.5px solid rgba(255,255,255,0.15); border-radius: 6px; background: #fff;"></canvas>
            </div>
          </div>
        </div>
      `;

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
    // Kích hoạt theme Dark/Light đồng bộ cho toàn bộ portal
    setupTheme("dark");

    // Nếu đã ở trang portal thì chỉ kích hoạt theme, không can thiệp form login
    if (location.pathname.includes("ThongTinPortal") || location.pathname.includes("DangKyHocPhan") || location.pathname.includes("ChuongTrinhKhung")) {
      return;
    }

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

    // 3. Hiển thị thẻ captcha to rõ & để trống để người dùng gõ
    const runProcess = async () => {
      for (let i = 0; i < 25; i++) {
        if (imgEl.complete && imgEl.naturalWidth >= 40) break;
        await sleep(100);
      }

      attachCaptchaCard(imgEl, capEl);
      capEl.value = "";
      capEl.focus();
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
