// =====================================================================
// IUH Fast Login — Content Script Thời khóa biểu (sv.iuh.edu.vn)
// ---------------------------------------------------------------------
// 1. Đổi "Tiết: X - Y" thành giờ cụ thể (ví dụ Tiết 7-9 -> 12:30 - 15:00).
// 2. Dark Mode Aurora Cosmos đồng bộ 100% (triệt tiêu toàn bộ mảng trắng
//    ở Top bar, Sidebar, Toolbar và chân bảng).
// 3. Nổi bật vượt trội: Tên môn học TRẮNG ĐẬM, Giờ học CYAN/EMERALD, Giảng viên RÕ NÉT.
// 4. Khắc phục triệt để lỗi màu chữ vàng trên nền vàng, trắng trên nền trắng.
// 5. Thu gọn chiều cao ô trống để xem full tuần trên một màn hình không cần cuộn.
// 6. Tự sửa lỗi font hiển thị "Tr?c tuy?n" thành "Trực tuyến".
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

// Tiêm CSS Thời khóa biểu toàn diện
function injectScheduleTheme() {
  if (document.getElementById("iuh-schedule-theme-style")) return;
  const style = document.createElement("style");
  style.id = "iuh-schedule-theme-style";
  style.textContent = `
    /* 1. BẢO VỆ TUYỆT ĐỐI ICON FONTAWESOME (KHÔNG BỊ GẠCH NGANG) */
    *:not(i):not([class*="fa"]):not([class*="glyphicon"]):not([class*="icon"]):not(.k-icon):not([class*="fas"]):not([class*="far"]) {
      font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif !important;
    }
    i, .fa, [class*="fa-"], [class*="glyphicon"], [class*="icon"], .k-icon {
      font-family: FontAwesome, 'Glyphicons Halflings', 'font-awesome' !important;
    }

    /* Nút chuyển đổi Dark/Light mode nổi góc trên */
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

    /* Bảng thời khóa biểu dạng card mềm mại */
    table.fl-table, table[id*="Lich"], .table-responsive table {
      border-collapse: separate !important;
      border-spacing: 5px !important;
      border: none !important;
      width: 100% !important;
    }

    /* Thu gọn chiều cao để xem full tuần không cần cuộn */
    table tbody tr td {
      padding: 3px !important;
      vertical-align: top !important;
      height: auto !important;
    }
    table tbody tr td:empty {
      min-height: 44px !important;
      height: 44px !important;
    }

    /* ========================================================
       2. DARK MODE: AURORA COSMOS GRADIENT ĐỒNG BỘ 100%
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

    /* KHỬ SẠCH MẢNG TRẮNG Ở TOPBAR VÀ HEADER */
    html.iuh-dark header,
    html.iuh-dark .main-header,
    html.iuh-dark .navbar,
    html.iuh-dark .top-header,
    html.iuh-dark div[class*="header"] {
      background: rgba(15, 23, 42, 0.88) !important;
      backdrop-filter: blur(16px) !important;
      border-bottom: 1px solid #1e293b !important;
      color: #f8fafc !important;
    }
    html.iuh-dark .navbar a,
    html.iuh-dark .main-header a,
    html.iuh-dark header a {
      color: #cbd5e1 !important;
    }
    html.iuh-dark .navbar .form-control,
    html.iuh-dark header input {
      background-color: #1e293b !important;
      border-color: #334155 !important;
      color: #f8fafc !important;
    }

    /* KHỬ SẠCH MẢNG TRẮNG Ở SIDEBAR BÊN TRÁI & KHUNG QR CODE */
    html.iuh-dark .main-sidebar,
    html.iuh-dark .sidebar,
    html.iuh-dark aside,
    html.iuh-dark .col-left-tlu,
    html.iuh-dark div[class*="col-left"],
    html.iuh-dark div[class*="menu-left"],
    html.iuh-dark ul.sidebar-menu,
    html.iuh-dark div:has(> .down_ungdung),
    html.iuh-dark .down_ungdung,
    html.iuh-dark div:has(> img[src*="QR"]),
    html.iuh-dark div:has(> img[src*="qr"]) {
      background: rgba(15, 23, 42, 0.88) !important;
      backdrop-filter: blur(16px) !important;
      border-right: 1px solid #1e293b !important;
    }
    html.iuh-dark .sidebar a,
    html.iuh-dark .menu a,
    html.iuh-dark div[class*="col-left"] a,
    html.iuh-dark ul.sidebar-menu li a {
      color: #e2e8f0 !important;
      background: transparent !important;
      font-weight: 600 !important;
    }
    html.iuh-dark .sidebar a:hover,
    html.iuh-dark div[class*="col-left"] a:hover {
      background: rgba(30, 41, 59, 0.8) !important;
      color: #38bdf8 !important;
    }

    /* KHỬ SẠCH MẢNG TRẮNG Ở TOOLBAR TRÊN BẢNG LỊCH */
    html.iuh-dark .content-wrapper,
    html.iuh-dark .wrapper,
    html.iuh-dark .box,
    html.iuh-dark .box-body,
    html.iuh-dark .box-header,
    html.iuh-dark .col-right-tlu,
    html.iuh-dark div:has(> #btnHienTai),
    html.iuh-dark div:has(> #btnInLich),
    html.iuh-dark div:has(> h3) {
      background: rgba(15, 23, 42, 0.85) !important;
      border-color: #1e293b !important;
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

    /* KHỬ SẠCH MẢNG TRẮNG Ở THANH CHÚ THÍCH (LEGEND) Ở DƯỚI BẢNG */
    html.iuh-dark div[class*="ghichu"],
    html.iuh-dark div:has(> span[class*="color-"]),
    html.iuh-dark div:has(> .color-thuchanh),
    html.iuh-dark .table-legend {
      background: rgba(15, 23, 42, 0.85) !important;
      border-color: #1e293b !important;
      border-radius: 10px !important;
      padding: 10px 14px !important;
      color: #94a3b8 !important;
    }

    /* BẢNG LỊCH HỌC TRONG DARK MODE */
    html.iuh-dark thead th,
    html.iuh-dark thead tr th {
      background: #1e293b !important;
      color: #38bdf8 !important;
      border: 1px solid #334155 !important;
      border-radius: 8px !important;
      padding: 8px 4px !important;
      font-weight: 700 !important;
      font-size: 13px !important;
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
      padding: 10px 4px !important;
    }
    html.iuh-dark tbody tr td {
      background-color: rgba(11, 19, 36, 0.6) !important;
      border: 1px dashed rgba(255, 255, 255, 0.1) !important;
      border-radius: 8px !important;
    }

    /* NÚT BẤM & INPUT TRÊN LỊCH */
    html.iuh-dark input[type="text"],
    html.iuh-dark select {
      background-color: #1e293b !important;
      color: #f8fafc !important;
      border: 1px solid #334155 !important;
      border-radius: 8px !important;
      padding: 6px 10px !important;
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
       3. NỔI BẬT VƯỢT TRỘI CÁC THẺ MÔN HỌC (HIGH CONTRAST)
       ======================================================== */
    .content {
      border-radius: 10px !important;
      padding: 8px 10px !important;
      margin: 3px 0 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      transition: all 0.2s ease !important;
    }
    .content:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5) !important;
    }

    /* TÊN MÔN HỌC LUÔN LÀ TRẮNG SÁNG IN ĐẬM */
    .content b {
      color: #ffffff !important;
      font-size: 13.5px !important;
      font-weight: 800 !important;
      display: block !important;
      margin-bottom: 4px !important;
      line-height: 1.35 !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
    }

    /* THỜI GIAN HỌC: HIỂN THỊ DẠNG BADGE NỔI BẬT */
    .content span[lang="lichtheotuan-tiet"],
    .content span:has(+ span[lang="lichtheotuan-tiet"]),
    .content span[data-iuh-gio="1"] {
      font-weight: 800 !important;
      font-size: 11.5px !important;
      display: inline-block !important;
      padding: 2px 6px !important;
      border-radius: 4px !important;
      margin: 2px 0 !important;
    }

    /* TÊN GIẢNG VIÊN VÀ PHÒNG HỌC */
    .content span[lang="lichtheotuan-giangvien"],
    .content font,
    .content p {
      font-weight: 600 !important;
      font-size: 11.5px !important;
      display: block !important;
      margin-top: 3px !important;
    }

    /* 1. Thực hành (Màu xanh ngọc đậm - Nét chữ xanh sáng) */
    .content[style*="background-color: rgb(92, 184, 92)"],
    .content[style*="background: rgb(92, 184, 92)"],
    .content[style*="#5cb85c"],
    .content.color-thuchanh {
      background: #064e3b !important;
      border: 1.5px solid #10b981 !important;
      color: #ecfdf5 !important;
    }
    .content[style*="background-color: rgb(92, 184, 92)"] b,
    .content.color-thuchanh b {
      color: #ffffff !important;
    }
    .content[style*="background-color: rgb(92, 184, 92)"] span,
    .content.color-thuchanh span {
      color: #a7f3d0 !important;
    }

    /* 2. Trực tuyến / Zoom (Màu Cyan đậm - Nét chữ biển sáng) */
    .content[style*="background-color: rgb(91, 192, 222)"],
    .content[style*="background: rgb(91, 192, 222)"],
    .content[style*="#5bc0de"],
    .content.color-tructuyen {
      background: #082f49 !important;
      border: 1.5px solid #0284c7 !important;
      color: #f0f9ff !important;
    }
    .content[style*="background-color: rgb(91, 192, 222)"] b,
    .content.color-tructuyen b {
      color: #ffffff !important;
    }
    .content[style*="background-color: rgb(91, 192, 222)"] span,
    .content.color-tructuyen span {
      color: #7dd3fc !important;
    }

    /* 3. Vàng / Lý thuyết / Phân tích thiết kế mạng */
    .content[style*="background-color: rgb(240, 173, 78)"],
    .content[style*="background: rgb(240, 173, 78)"],
    .content[style*="#f0ad4e"],
    .content[style*="background-color: rgb(252, 248, 227)"],
    .content[style*="#fcf8e3"],
    .content[style*="#ffff99"],
    .content[style*="yellow"] {
      background: #451a03 !important;
      border: 1.5px solid #d97706 !important;
      color: #fffbeb !important;
    }
    .content[style*="background-color: rgb(240, 173, 78)"] b,
    .content[style*="yellow"] b {
      color: #ffffff !important;
    }
    .content[style*="background-color: rgb(240, 173, 78)"] span,
    .content[style*="yellow"] span {
      color: #fde68a !important;
    }

    /* 4. Lịch thi / Đỏ */
    .content[style*="background-color: rgb(217, 83, 79)"],
    .content[style*="#d9534f"],
    .content.color-thi {
      background: #450a0a !important;
      border: 1.5px solid #dc2626 !important;
      color: #fef2f2 !important;
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

// Sửa lỗi hiển thị chữ "Tr?c tuy?n" thành "Trực tuyến"
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
