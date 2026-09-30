// =====================================================================
// IUH Fast Login — Content Script Thời khóa biểu (sv.iuh.edu.vn)
// ---------------------------------------------------------------------
// 1. Giữ nguyên 100% bố cục layout gốc (không ép full-width, không phá vỡ grid).
// 2. Nền Aurora Cosmos Gradient đa tầng với dải màu dài sâu khắp trang.
// 3. Header, Sidebar, Toolbar, Legend đồng bộ Dark Mode hoàn toàn (khử sạch mảng trắng).
// 4. Xóa khối mã QR cài app ngớ ngẩn khỏi sidebar.
// 5. Typography thẻ môn học chuẩn theo yêu cầu:
//    - Tên môn học thu nhỏ phông (11.5px), chữ thường không bold to chiếm diện tích.
//    - Toàn bộ text chữ thường tự nhiên, giảm khoảng cách dòng (line-height: 1.25).
//    - Thời gian học: BẮT BUỘC IN ĐẬM VÀ IN NGHIÊNG (Bold & Italic).
//    - Phòng học: CHỈ IN ĐẬM KHI LÀ LỊCH THỰC HÀNH.
//    - Khử sạch toàn bộ chữ trắng trên thẻ môn học (tương phản cao, cực kỳ dịu mắt).
// 6. Đổi "Tiết: X - Y" thành giờ cụ thể (vd: 12:30 - 15:00).
// 7. Bảo vệ icon FontAwesome gốc & tự sửa lỗi "Tr?c tuy?n" -> "Trực tuyến".
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

// Tiêm CSS Thời khóa biểu
function injectScheduleTheme() {
  if (document.getElementById("iuh-schedule-theme-style")) return;
  const style = document.createElement("style");
  style.id = "iuh-schedule-theme-style";
  style.textContent = `
    /* 1. BẢO VỆ TUYỆT ĐỐI ICON FONTAWESOME (KHÔNG ĐÈ FONT) */
    *:not(i):not([class*="fa"]):not([class*="glyphicon"]):not([class*="icon"]):not(.k-icon):not([class*="fas"]):not([class*="far"]) {
      font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif !important;
    }
    i, .fa, [class*="fa-"], [class*="glyphicon"], [class*="icon"], .k-icon {
      font-family: FontAwesome, 'Glyphicons Halflings', 'font-awesome' !important;
    }

    /* 2. XÓA KHỐI MÃ QR CÀI APP NGỚ NGẨN (KHÔNG PHÁ HỎNG SIDEBAR) */
    .down_ungdung,
    .box-download-app,
    div:has(> img[src*="QR"]),
    div:has(> img[src*="qr"]),
    div:has(> .down_ungdung) {
      display: none !important;
    }

    /* 3. NÚT CHUYỂN ĐỔI DARK/LIGHT MODE NỔI GÓC TRÊN */
    #iuh-schedule-theme-toggle {
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

    /* 4. CẤU TRÚC BẢNG LỊCH HỌC DẠNG CARD GỌN GÀNG */
    table.fl-table, table[id*="Lich"], .table-responsive table {
      border-collapse: separate !important;
      border-spacing: 4px !important;
      border: none !important;
    }
    table tbody tr td {
      padding: 2px !important;
      vertical-align: top !important;
      height: auto !important;
    }
    table tbody tr td:empty {
      min-height: 38px !important;
      height: 38px !important;
      opacity: 0.25 !important;
    }

    /* ========================================================
       5. TYPOGRAPHY THẺ MÔN HỌC (CHUẨN THEO YÊU CẦU BẠN):
       - Không bold tràn lan, chữ thường tự nhiên.
       - Chỉ bold phòng nếu là lịch thực hành.
       - Thời gian học: IN ĐẬM VÀ IN NGHIÊNG (Bold & Italic).
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
      color: #0d381e !important; /* Xanh lá thẫm tương phản cao, không dùng chữ trắng */
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
      color: #063462 !important; /* Xanh navy thẫm tương phản cao, không dùng chữ trắng */
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
      color: #5c3b00 !important; /* Nâu thẫm tương phản cao, không dùng chữ trắng */
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
      color: #490606 !important; /* Đỏ thẫm rõ nét */
    }

    /* ========================================================
       6. DARK MODE: AURORA COSMOS VỚI DẢI MÀU DÀI SÂU
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

    /* ĐỒNG BỘ 100% HEADER TRÊN CÙNG SANG DARK MODE (KHỬ SẠCH NỀN TRẮNG INLINE) */
    html.iuh-dark header,
    html.iuh-dark header.header,
    html.iuh-dark .header,
    html.iuh-dark .main-header,
    html.iuh-dark .navbar,
    html.iuh-dark .top-header,
    html.iuh-dark header[style*="background"],
    html.iuh-dark .header[style*="background"] {
      background: #0f172a !important;
      background-color: #0f172a !important;
      border-bottom: 1px solid #1e293b !important;
      color: #f8fafc !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
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

    /* SIDEBAR BÊN TRÁI TRONG DARK MODE */
    html.iuh-dark .col-left-tlu,
    html.iuh-dark .sidebar,
    html.iuh-dark aside.main-sidebar,
    html.iuh-dark ul.sidebar-menu,
    html.iuh-dark div:has(> ul.sidebar-menu) {
      background: rgba(15, 23, 42, 0.88) !important;
      background-color: rgba(15, 23, 42, 0.88) !important;
      border: 1px solid #1e293b !important;
      border-radius: 14px !important;
    }
    html.iuh-dark ul.sidebar-menu li {
      border-color: #1e293b !important;
      background: transparent !important;
    }
    html.iuh-dark .sidebar a,
    html.iuh-dark div[class*="col-left"] a,
    html.iuh-dark ul.sidebar-menu li a {
      color: #e2e8f0 !important;
      background: transparent !important;
      font-weight: 600 !important;
    }
    html.iuh-dark .sidebar a:hover,
    html.iuh-dark div[class*="col-left"] a:hover,
    html.iuh-dark ul.sidebar-menu li.active a,
    html.iuh-dark ul.sidebar-menu li:hover a {
      background: rgba(30, 41, 59, 0.8) !important;
      color: #38bdf8 !important;
    }

    /* KHỬ SẠCH MẢNG TRẮNG Ở TOOLBAR TRÊN BẢNG LỊCH HỌC */
    html.iuh-dark .content-wrapper,
    html.iuh-dark .wrapper,
    html.iuh-dark .box,
    html.iuh-dark .box-body,
    html.iuh-dark .box-header,
    html.iuh-dark .col-right-tlu,
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

    /* INPUTS & NÚT BẤM TRÊN TOOLBAR */
    html.iuh-dark input[type="text"],
    html.iuh-dark select,
    html.iuh-dark .form-control {
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

    /* DROPDOWNS & POPUPS TRÊN LỊCH */
    html.iuh-dark .select2-dropdown,
    html.iuh-dark .dropdown-menu,
    html.iuh-dark .k-popup,
    html.iuh-dark .k-list-container {
      background-color: #0f172a !important;
      border: 1.5px solid #334155 !important;
      border-radius: 10px !important;
      box-shadow: 0 14px 35px rgba(0, 0, 0, 0.75) !important;
      color: #f8fafc !important;
    }
    html.iuh-dark .select2-results__option,
    html.iuh-dark .k-item,
    html.iuh-dark .dropdown-menu > li > a {
      background-color: #0f172a !important;
      color: #cbd5e1 !important;
      padding: 8px 12px !important;
    }
    html.iuh-dark .select2-results__option--highlighted,
    html.iuh-dark .select2-results__option:hover,
    html.iuh-dark .k-item:hover,
    html.iuh-dark .dropdown-menu > li > a:hover {
      background-color: #1e293b !important;
      color: #38bdf8 !important;
    }

    /* NÚT TOGGLE KHI Ở DARK MODE */
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
       7. LIGHT MODE: TRẮNG DỊU MẮT & NỔI 3D
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

function setupScheduleTheme(defaultMode = "dark") {
  injectScheduleTheme();
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
