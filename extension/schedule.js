// =====================================================================
// IUH Fast Login — Content Script Thời khóa biểu (sv.iuh.edu.vn)
// ---------------------------------------------------------------------
// 1. Đổi "Tiết: X - Y" thành giờ cụ thể (ví dụ Tiết 7-9 -> 12:30 - 15:00).
// 2. Dark Mode Aurora Cosmos với dải màu dài sâu (Indigo -> Cyan -> Purple -> Sapphire -> Rose).
// 3. Header đồng bộ Dark Mode 100% (không còn nền trắng), XÓA LOGO TRƯỜNG.
// 4. Nút Menu Sinh Viên nằm gọn ở vị trí logo, bấm để mở/đóng Sidebar mượt mà.
// 5. Bảng lịch học chiếm FULL 100% DIỆN TÍCH màn hình, căn đối xứng hoàn hảo.
// 6. XÓA VĨNH VIỄN MÃ QR NGỚ NGẨN.
// 7. Typography thẻ môn học:
//    - Tên môn: phông nhỏ gọn (11.5px), không bold to chiếm diện tích.
//    - Thời gian: IN ĐẬM VÀ IN NGHIÊNG (Bold & Italic).
//    - Phòng học: CHỈ IN ĐẬM KHI LÀ LỊCH THỰC HÀNH.
//    - Xóa toàn bộ text trắng chói mắt, độ tương phản cao dịu mắt.
// 8. Tự sửa lỗi font "Tr?c tuy?n" thành "Trực tuyến".
// =====================================================================

const api = globalThis.browser ?? globalThis.chrome;

const TIET_GIO = {
  1: ["06:30", "07:20"], 2: ["07:20", "08:10"], 3: ["08:10", "09:00"],
  4: ["09:10", "10:00"], 5: ["10:00", "10:50"], 6: ["10:50", "11:40"],
  7: ["12:30", "13:20"], 8: ["13:20", "14:10"], 9: ["14:10", "15:00"],
  10: ["15:10", "16:00"], 11: ["16:00", "16:50"], 12: ["16:50", "17:40"],
  13: ["18:00", "18:50"], 14: ["18:50", "19:40"], 15: ["19:50", "20:40"],
  16: ["20:40", "21:30"],
};

function gioCua(tiet) {
  const g = TIET_GIO[tiet];
  return g ? `${g[0]} - ${g[1]}` : null;
}

// Tiêm CSS Thời khóa biểu tối ưu toàn diện
function injectScheduleTheme() {
  if (document.getElementById("iuh-schedule-theme-style")) return;
  const style = document.createElement("style");
  style.id = "iuh-schedule-theme-style";
  style.textContent = `
    /* 1. BẢO VỆ ICON FONTAWESOME */
    *:not(i):not([class*="fa"]):not([class*="glyphicon"]):not([class*="icon"]):not(.k-icon):not([class*="fas"]):not([class*="far"]) {
      font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif !important;
    }
    i, .fa, [class*="fa-"], [class*="glyphicon"], [class*="icon"], .k-icon {
      font-family: FontAwesome, 'Glyphicons Halflings', 'font-awesome' !important;
      color: #38bdf8 !important;
    }

    /* 2. XÓA LOGO TRƯỜNG & XÓA MÃ QR NGỚ NGẨN (THEO YÊU CẦU) */
    header a.logo,
    header .logo,
    header img,
    a[class*="logo"],
    img[src*="logo"],
    img[src*="Logo"],
    img[src*="favicon"],
    .down_ungdung,
    .box-download-app,
    div:has(> img[src*="QR"]),
    div:has(> img[src*="qr"]),
    div:has(> .down_ungdung) {
      display: none !important;
    }

    /* 3. BẢNG THỜI KHÓA BIỂU CHIẾM TRỌN 100% BỀ NGANG, CĂN ĐỐI XỨNG */
    .content-wrapper,
    .wrapper,
    .col-right-tlu,
    .col-lg-9,
    .col-md-9,
    div:has(> table.fl-table),
    div:has(> table[id*="Lich"]),
    .table-responsive {
      width: 100% !important;
      max-width: 100% !important;
      flex: 0 0 100% !important;
      margin: 0 auto !important;
      padding: 0 12px !important;
      box-sizing: border-box !important;
      float: none !important;
    }

    /* 4. SIDEBAR BIẾN THÀNH FLYOUT DRAWER GÓC TRÊN TRÁI */
    .col-left-tlu,
    .col-lg-3:has(.sidebar-menu),
    .col-md-3:has(.sidebar-menu),
    div:has(> ul.sidebar-menu),
    aside.main-sidebar,
    #iuh-dynamic-sidebar {
      position: fixed !important;
      top: 56px !important;
      left: 0 !important;
      width: 250px !important;
      height: calc(100vh - 56px) !important;
      overflow-y: auto !important;
      z-index: 999999 !important;
      background: rgba(15, 23, 42, 0.95) !important;
      backdrop-filter: blur(20px) !important;
      border-right: 1.5px solid #1e293b !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7) !important;
      transform: translateX(-100%) !important;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .col-left-tlu.iuh-open,
    #iuh-dynamic-sidebar.iuh-open {
      transform: translateX(0) !important;
    }

    /* Nút Menu Sinh Viên nằm gọn ở góc trên trái nơi logo cũ */
    #iuh-menu-toggle-btn {
      position: fixed !important;
      top: 10px !important;
      left: 14px !important;
      z-index: 999999 !important;
      display: flex !important;
      align-items: center !important;
      gap: 7px !important;
      padding: 7px 14px !important;
      border-radius: 9px !important;
      font-size: 13px !important;
      font-weight: 700 !important;
      cursor: pointer !important;
      background: #1e293b !important;
      color: #38bdf8 !important;
      border: 1.5px solid #334155 !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
      transition: all 0.2s ease !important;
    }
    #iuh-menu-toggle-btn:hover {
      background: #334155 !important;
      color: #7dd3fc !important;
      transform: translateY(-1px) !important;
    }

    /* Nút chuyển đổi Dark/Light mode nổi góc trên bên phải */
    #iuh-schedule-theme-toggle {
      position: fixed;
      top: 10px;
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

    /* Bảng thời khóa biểu dạng card mềm mại */
    table.fl-table, table[id*="Lich"], .table-responsive table {
      border-collapse: separate !important;
      border-spacing: 4px !important;
      border: none !important;
      width: 100% !important;
    }

    /* Thu gọn chiều cao để xem full tuần trên một màn hình không cần cuộn */
    table tbody tr td {
      padding: 3px !important;
      vertical-align: top !important;
      height: auto !important;
    }
    table tbody tr td:empty {
      min-height: 40px !important;
      height: 40px !important;
      opacity: 0.25 !important;
    }

    /* ========================================================
       2. DARK MODE: AURORA COSMOS VỚI DẢI MÀU DÀI SÂU
       ======================================================== */
    html.iuh-dark, html.iuh-dark body {
      background-color: #020617 !important;
      background-image: 
        radial-gradient(at 10% 0%, rgba(99, 102, 241, 0.26) 0px, transparent 40%),
        radial-gradient(at 90% 0%, rgba(6, 182, 212, 0.20) 0px, transparent 40%),
        radial-gradient(at 0% 30%, rgba(168, 85, 247, 0.16) 0px, transparent 45%),
        radial-gradient(at 100% 45%, rgba(59, 130, 246, 0.18) 0px, transparent 45%),
        radial-gradient(at 30% 65%, rgba(236, 72, 153, 0.12) 0px, transparent 40%),
        radial-gradient(at 90% 80%, rgba(14, 165, 233, 0.18) 0px, transparent 45%),
        radial-gradient(at 10% 100%, rgba(139, 92, 246, 0.16) 0px, transparent 50%),
        radial-gradient(at 70% 100%, rgba(16, 185, 129, 0.14) 0px, transparent 45%) !important;
      background-attachment: fixed !important;
      background-size: cover !important;
      color: #f8fafc !important;
      min-height: 100vh !important;
    }

    /* ĐỒNG BỘ 100% HEADER VÀ TOPBAR SANG MÀU TỐI (KHỬ SẠCH MÀNG TRẮNG) */
    html.iuh-dark header,
    html.iuh-dark .header,
    html.iuh-dark .main-header,
    html.iuh-dark .navbar,
    html.iuh-dark .top-header,
    html.iuh-dark div[class*="header"],
    html.iuh-dark header div,
    html.iuh-dark .main-header div {
      background: #0f172a !important;
      background-color: #0f172a !important;
      border-bottom: 1px solid #1e293b !important;
      color: #f8fafc !important;
    }
    html.iuh-dark header a,
    html.iuh-dark .navbar a,
    html.iuh-dark .main-header a,
    html.iuh-dark span[class*="name"] {
      color: #e2e8f0 !important;
    }
    html.iuh-dark .navbar .form-control,
    html.iuh-dark header input {
      background-color: #1e293b !important;
      border-color: #334155 !important;
      color: #f8fafc !important;
    }

    /* KHỬ SẠCH MẢNG TRẮNG Ở TOOLBAR TRÊN BẢNG */
    html.iuh-dark .content-wrapper,
    html.iuh-dark .wrapper,
    html.iuh-dark .box,
    html.iuh-dark .box-body,
    html.iuh-dark .box-header,
    html.iuh-dark div:has(> #btnHienTai),
    html.iuh-dark div:has(> #btnInLich),
    html.iuh-dark div:has(> h3) {
      background: rgba(15, 23, 42, 0.88) !important;
      background-color: rgba(15, 23, 42, 0.88) !important;
      border: 1px solid #1e293b !important;
      color: #f8fafc !important;
      border-radius: 14px !important;
    }
    html.iuh-dark h1,
    html.iuh-dark h2,
    html.iuh-dark h3,
    html.iuh-dark h4,
    html.iuh-dark .box-title {
      color: #38bdf8 !important;
      font-weight: 800 !important;
    }
    html.iuh-dark label,
    html.iuh-dark span {
      color: #e2e8f0 !important;
      font-weight: 600 !important;
    }

    /* KHỬ SẠCH MẢNG TRẮNG Ở CHÂN BẢNG (LEGEND) */
    html.iuh-dark div[class*="ghichu"],
    html.iuh-dark div:has(> span[class*="color-"]),
    html.iuh-dark div:has(> .color-thuchanh),
    html.iuh-dark .table-legend {
      background: rgba(15, 23, 42, 0.88) !important;
      background-color: rgba(15, 23, 42, 0.88) !important;
      border: 1px solid #1e293b !important;
      border-radius: 10px !important;
      padding: 8px 12px !important;
      color: #cbd5e1 !important;
      margin-top: 8px !important;
    }

    /* TIÊU ĐỀ THỨ & CA HỌC */
    html.iuh-dark thead th,
    html.iuh-dark thead tr th {
      background: #1e293b !important;
      color: #38bdf8 !important;
      border: 1px solid #334155 !important;
      border-radius: 8px !important;
      padding: 7px 4px !important;
      font-weight: 700 !important;
      font-size: 12.5px !important;
      text-align: center !important;
    }
    html.iuh-dark tbody tr td:first-child,
    html.iuh-dark tbody th {
      background: #1e293b !important;
      color: #f8fafc !important;
      border-radius: 8px !important;
      font-weight: 800 !important;
      font-size: 13px !important;
      text-transform: uppercase !important;
      text-align: center !important;
      border: none !important;
      padding: 8px 4px !important;
    }
    html.iuh-dark tbody tr td {
      background-color: rgba(11, 19, 36, 0.65) !important;
      border: 1px dashed rgba(255, 255, 255, 0.1) !important;
      border-radius: 8px !important;
    }

    /* INPUTS & NÚT TRÊN TOOLBAR */
    html.iuh-dark input[type="text"],
    html.iuh-dark select {
      background-color: #1e293b !important;
      color: #f8fafc !important;
      border: 1px solid #334155 !important;
      border-radius: 8px !important;
      padding: 5px 10px !important;
    }
    html.iuh-dark .btn,
    html.iuh-dark button {
      background-color: #1e293b !important;
      color: #f8fafc !important;
      border: 1px solid #334155 !important;
      border-radius: 8px !important;
    }
    html.iuh-dark .btn:hover {
      background-color: #334155 !important;
      color: #38bdf8 !important;
    }
    html.iuh-dark .btn-primary,
    html.iuh-dark #btnHienTai {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
      border: none !important;
      color: #ffffff !important;
    }

    /* ========================================================
       3. TYPOGRAPHY THẺ MÔN HỌC (CHUẨN XÁC THEO YÊU CẦU BẠN):
       - Không bold tràn lan, chữ thường tự nhiên.
       - Chỉ bold phòng nếu là lịch thực hành.
       - Thời gian học: IN ĐẬM VÀ IN NGHIÊNG.
       - Tên môn học thu nhỏ phông (11.5px), giảm khoảng cách dòng.
       - XÓA SẠCH TOÀN BỘ TEXT TRẮNG CHÓI MẮT.
       ======================================================== */
    .content {
      border-radius: 8px !important;
      padding: 6px 8px !important;
      margin: 2px 0 !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
      line-height: 1.25 !important;
    }

    /* Tên môn học: thu nhỏ phông (11.5px), không bold quá to */
    .content b {
      font-size: 11.5px !important;
      font-weight: 600 !important;
      display: block !important;
      margin-bottom: 2px !important;
      line-height: 1.25 !important;
      text-transform: none !important;
    }

    /* Mã lớp học phần */
    .content p {
      font-size: 10px !important;
      font-weight: normal !important;
      margin: 1px 0 !important;
      opacity: 0.85 !important;
      line-height: 1.2 !important;
    }

    /* THỜI GIAN HỌC: BẮT BUỘC IN ĐẬM VÀ IN NGHIÊNG */
    .content span[lang="lichtheotuan-tiet"],
    .content span:has(+ span[lang="lichtheotuan-tiet"]),
    .content span[data-iuh-gio="1"] {
      font-weight: bold !important;
      font-style: italic !important;
      font-size: 11px !important;
      display: inline-block !important;
      margin: 2px 0 !important;
      line-height: 1.2 !important;
    }

    /* Giảng viên & Phòng học: Chữ thường (regular) */
    .content span[lang="lichtheotuan-giangvien"],
    .content span[lang="lichtheotuan-phong"],
    .content font,
    .content span {
      font-weight: normal !important;
      font-size: 10.5px !important;
      line-height: 1.2 !important;
    }

    /* CHỈ IN ĐẬM PHÒNG HỌC KHI LÀ LỊCH THỰC HÀNH */
    .content[style*="background-color: rgb(92, 184, 92)"] span[lang="lichtheotuan-phong"],
    .content[style*="background: rgb(92, 184, 92)"] span[lang="lichtheotuan-phong"],
    .content.color-thuchanh span[lang="lichtheotuan-phong"],
    .content[style*="#5cb85c"] span[lang="lichtheotuan-phong"] {
      font-weight: bold !important;
    }

    /* MÀU SẮC TỪNG LOẠI THẺ (LOẠI BỎ TOÀN BỘ CHỮ TRẮNG CHÓI MẮT): */
    /* 1. Lịch thực hành (Xanh lá) */
    .content[style*="background-color: rgb(92, 184, 92)"],
    .content[style*="background: rgb(92, 184, 92)"],
    .content[style*="#5cb85c"],
    .content.color-thuchanh {
      background: #76c043 !important;
      border: 1px solid #5ca030 !important;
    }
    .content[style*="background-color: rgb(92, 184, 92)"] *,
    .content[style*="background: rgb(92, 184, 92)"] *,
    .content.color-thuchanh * {
      color: #0d381e !important;
    }

    /* 2. Lịch trực tuyến (Xanh dương) */
    .content[style*="background-color: rgb(91, 192, 222)"],
    .content[style*="background: rgb(91, 192, 222)"],
    .content[style*="#5bc0de"],
    .content.color-tructuyen {
      background: #74b9ff !important;
      border: 1px solid #0984e3 !important;
    }
    .content[style*="background-color: rgb(91, 192, 222)"] *,
    .content[style*="background: rgb(91, 192, 222)"] *,
    .content.color-tructuyen * {
      color: #063462 !important;
    }

    /* 3. Lịch lý thuyết / Vàng */
    .content[style*="background-color: rgb(240, 173, 78)"],
    .content[style*="background: rgb(240, 173, 78)"],
    .content[style*="#f0ad4e"],
    .content[style*="background-color: rgb(252, 248, 227)"],
    .content[style*="#fcf8e3"],
    .content[style*="#ffff99"],
    .content[style*="yellow"] {
      background: #ffeaa7 !important;
      border: 1px solid #fdcb6e !important;
    }
    .content[style*="background-color: rgb(240, 173, 78)"] *,
    .content[style*="#fcf8e3"] *,
    .content[style*="yellow"] * {
      color: #5c3b00 !important;
    }

    /* 4. Lịch thi / Đỏ */
    .content[style*="background-color: rgb(217, 83, 79)"],
    .content[style*="#d9534f"],
    .content.color-thi {
      background: #ff7675 !important;
      border: 1px solid #d63031 !important;
    }
    .content[style*="background-color: rgb(217, 83, 79)"] *,
    .content.color-thi * {
      color: #490606 !important;
    }

    /* Nút Toggle Mode */
    html.iuh-dark #iuh-schedule-theme-toggle {
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      color: #f8fafc;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    }
    html.iuh-dark #iuh-schedule-theme-toggle:hover {
      background: rgba(30, 41, 59, 0.95);
      color: #38bdf8;
    }

    /* ========================================================
       4. LIGHT MODE: TRẮNG DỊU MẮT & NỔI 3D
       ======================================================== */
    html.iuh-light, html.iuh-light body {
      background-color: #f1f5f9 !important;
      background-image: 
        radial-gradient(at 50% 0%, #ffffff 0%, #edf2f7 100%) !important;
      background-attachment: fixed !important;
      color: #0f172a !important;
    }
    html.iuh-light thead th,
    html.iuh-light thead tr th {
      background: #f8fafc !important;
      color: #0369a1 !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      padding: 8px 4px !important;
      font-weight: 700 !important;
      font-size: 13px !important;
      text-align: center !important;
    }
    html.iuh-light .table-responsive table {
      background: #ffffff !important;
      border-radius: 14px !important;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05) !important;
    }
    html.iuh-light #iuh-schedule-theme-toggle {
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    html.iuh-light #iuh-schedule-theme-toggle:hover {
      background: #f1f5f9;
      color: #0284c7;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

// Tìm và gán ID chuẩn cho Sidebar
function getSidebarElement() {
  const existing = document.getElementById("iuh-dynamic-sidebar");
  if (existing) return existing;

  const candidate = (
    document.querySelector(".col-left-tlu") ||
    document.querySelector("aside.main-sidebar") ||
    document.querySelector("div:has(> ul.sidebar-menu)") ||
    Array.from(document.querySelectorAll("div, aside, nav")).find(
      (el) =>
        el.children &&
        el.children.length > 2 &&
        el.textContent.includes("TRANG CHỦ") &&
        el.textContent.includes("THÔNG TIN CHUNG")
    )
  );

  if (candidate) {
    candidate.id = "iuh-dynamic-sidebar";
  }
  return candidate;
}

// Thêm nút Menu Sinh Viên thay thế góc trên bên trái nơi logo cũ
function attachMenuButton() {
  if (document.getElementById("iuh-menu-toggle-btn")) return;
  const btn = document.createElement("button");
  btn.id = "iuh-menu-toggle-btn";
  btn.type = "button";
  btn.innerHTML = `<span>☰</span> <span>Menu Sinh Viên</span>`;
  document.body.appendChild(btn);

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const sidebar = getSidebarElement();
    if (sidebar) {
      sidebar.classList.toggle("iuh-open");
    }
  });

  // Bấm ra ngoài sidebar tự động đóng
  document.addEventListener("click", (e) => {
    const sidebar = getSidebarElement();
    if (sidebar && sidebar.classList.contains("iuh-open")) {
      if (!sidebar.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        sidebar.classList.remove("iuh-open");
      }
    }
  });
}

function setupScheduleTheme(defaultMode = "dark") {
  injectScheduleTheme();
  attachMenuButton();
  if (api && api.storage) {
    api.storage.local.get({ theme_mode: defaultMode }, (res) => {
      const mode = res.theme_mode || defaultMode;
      applyScheduleThemeMode(mode);
    });
  } else {
    applyScheduleThemeMode(defaultMode);
  }
}

function applyScheduleThemeMode(mode) {
  const isDark = mode === "dark";
  document.documentElement.classList.remove("iuh-dark", "iuh-light");
  document.documentElement.classList.add(isDark ? "iuh-dark" : "iuh-light");

  let toggleBtn = document.getElementById("iuh-schedule-theme-toggle");
  if (!toggleBtn) {
    toggleBtn = document.createElement("button");
    toggleBtn.id = "iuh-schedule-theme-toggle";
    toggleBtn.type = "button";
    document.body.appendChild(toggleBtn);
    toggleBtn.addEventListener("click", () => {
      const currentIsDark = document.documentElement.classList.contains("iuh-dark");
      const newMode = currentIsDark ? "light" : "dark";
      if (api && api.storage) {
        api.storage.local.set({ theme_mode: newMode }, () => {
          applyScheduleThemeMode(newMode);
        });
      } else {
        applyScheduleThemeMode(newMode);
      }
    });
  }
  toggleBtn.innerHTML = isDark ? "☀️ Chế độ sáng" : "🌙 Chế độ tối";
}

function highlightToday(root) {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, "0");
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const y = today.getFullYear();
  const dateStr = `${d}/${m}/${y}`;
  const ths = root.querySelectorAll("thead th");
  const isDark = document.documentElement.classList.contains("iuh-dark");

  ths.forEach((th) => {
    if (th.textContent.includes(dateStr)) {
      if (isDark) {
        th.style.cssText =
          "background: #0e304f !important; border: 2px solid #0284c7 !important; " +
          "color: #38bdf8 !important; font-weight: 800 !important; border-radius: 8px !important;";
      } else {
        th.style.cssText =
          "background: #e0f2fe !important; border: 2px solid #0284c7 !important; " +
          "color: #0284c7 !important; font-weight: 800 !important; border-radius: 8px !important;";
      }
    }
  });
}

// Sửa lỗi font "Tr?c tuy?n" thành "Trực tuyến"
function fixBrokenText(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue && node.nodeValue.includes("Tr?c tuy?n")) {
      node.nodeValue = node.nodeValue.replace(/Tr\?c tuy\?n/g, "Trực tuyến");
    }
  }
}

function thayThe(root) {
  const spans = root.querySelectorAll('span[lang="lichtheotuan-tiet"]');
  spans.forEach((sp) => {
    if (sp.dataset.iuhGio === "1") return;
    const after = sp.nextSibling;
    if (!after || !after.nodeValue) return;
    const m = after.nodeValue.match(/^(\s*:\s*)(\d{1,2})\s*[-–]\s*(\d{1,2})/);
    if (!m) return;
    const t1 = parseInt(m[2], 10);
    const t2 = parseInt(m[3], 10);
    const a = gioCua(t1);
    const b = gioCua(t2);
    if (!a || !b) return;
    const gio = `${a.split(" - ")[0]} - ${b.split(" - ")[1]}`;
    after.nodeValue = after.nodeValue.replace(m[0], `${m[1]}${gio}`);
    sp.dataset.iuhGio = "1";
  });
}

function main() {
  setupScheduleTheme("dark");
  thayThe(document);
  highlightToday(document);
  fixBrokenText(document);

  const obs = new MutationObserver(() => {
    thayThe(document);
    highlightToday(document);
    fixBrokenText(document);
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
