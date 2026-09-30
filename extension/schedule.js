// =====================================================================
// IUH Fast Login — Content Script Thời khóa biểu (sv.iuh.edu.vn)
// ---------------------------------------------------------------------
// 1. Nút chuyển đổi Dark/Light mode nổi góc trên bên phải, đồng bộ storage.
// 2. Xóa hoàn toàn Logo trường (<div class="logo">) theo yêu cầu.
// 3. Tối ưu tiêu đề & các nút điều hướng (Hiện tại, In lịch, Trở về, Tiếp) đẹp, sắc nét.
// 4. Toàn bộ chữ trong thẻ môn học (kể cả Tiết:, Phòng:, GV:, Ghi chú:)
//    quay về BLACK TEXT (#000000) 100%, không còn chữ trắng mờ khó nhìn.
// 5. IN ĐẬM thời gian học và tên Giảng viên cho toàn bộ các môn.
// 6. Thu gọn Sidebar (div.col-md-2) thành icon mép trái, hover "nẩy" menu ra.
// 7. Cố định và chia đều 7 cột các ngày trong tuần chuẩn xác 100%.
// 8. Tự sửa lỗi font hiển thị "Tr?c tuy?n" -> "Trực tuyến".
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

// 1. Tiêm CSS Theme (Dark / Light)
function injectThemeStyles() {
  if (document.getElementById("iuh-schedule-theme-style")) return;
  const style = document.createElement("style");
  style.id = "iuh-schedule-theme-style";
  style.textContent = `
    /* ========================================================
       1. XÓA HOÀN TOÀN LOGO TRƯỜNG & KHỐI QR THEO YÊU CẦU
       ======================================================== */
    div.logo,
    .logo,
    header .logo,
    div:has(> a[href*="dashboard.html"] > img),
    img[src*="iuh7313e0f8"],
    div.col-md-2 .down_ungdung,
    div.col-md-2 .box-download-app,
    div.col-md-2 div:has(> img[src*="QR"]),
    div.col-md-2 div:has(> img[src*="qr"]),
    div.col-md-2 div:has(> img[src*="Qr"]),
    div.col-md-2 img[src*="qr"],
    div.col-md-2 img[src*="QR"],
    div.col-md-2 div:has(p:contains("OneUni")) {
      display: none !important;
    }

    /* ========================================================
       2. NÚT CHUYỂN ĐỔI THEME GÓC TRÊN BÊN PHẢI
       ======================================================== */
    #iuh-theme-toggle-btn {
      position: fixed !important;
      top: 12px !important;
      right: 18px !important;
      z-index: 9999999 !important;
      display: flex !important;
      align-items: center !important;
      gap: 7px !important;
      padding: 7px 15px !important;
      border-radius: 9999px !important;
      font-size: 12.5px !important;
      font-weight: 700 !important;
      cursor: pointer !important;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
      outline: none !important;
    }

    html.iuh-dark #iuh-theme-toggle-btn {
      background: rgba(15, 23, 42, 0.9) !important;
      backdrop-filter: blur(16px) !important;
      color: #f8fafc !important;
      border: 1.5px solid rgba(255, 255, 255, 0.2) !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), 0 0 10px rgba(56, 189, 248, 0.2) !important;
    }
    html.iuh-dark #iuh-theme-toggle-btn:hover {
      background: rgba(30, 41, 59, 0.95) !important;
      color: #38bdf8 !important;
      border-color: #38bdf8 !important;
      transform: translateY(-1px) !important;
    }

    html.iuh-light #iuh-theme-toggle-btn {
      background: #ffffff !important;
      color: #0f172a !important;
      border: 1.5px solid #cbd5e1 !important;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08) !important;
    }
    html.iuh-light #iuh-theme-toggle-btn:hover {
      background: #f8fafc !important;
      color: #0284c7 !important;
      border-color: #0284c7 !important;
      transform: translateY(-1px) !important;
    }

    /* ========================================================
       3. NÚT ICON TAB VÀ DRAWER SIDEBAR MẸP TRÁI
       ======================================================== */
    #iuh-sidebar-tab {
      position: fixed !important;
      top: 110px !important;
      left: 0 !important;
      width: 38px !important;
      height: 46px !important;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
      color: #ffffff !important;
      border-radius: 0 12px 12px 0 !important;
      box-shadow: 2px 4px 15px rgba(2, 132, 199, 0.4) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      transition: all 0.25s ease !important;
      z-index: 9999999 !important;
    }
    #iuh-sidebar-tab:hover {
      width: 44px !important;
      background: linear-gradient(135deg, #0369a1 0%, #075985 100%) !important;
      box-shadow: 4px 6px 18px rgba(2, 132, 199, 0.55) !important;
    }

    div.col-md-2.d-none.d-sm-block,
    div.col-md-2:has(.sidebar-menu),
    div.col-md-2:has(ul) {
      position: fixed !important;
      top: 85px !important;
      left: 0 !important;
      width: 250px !important;
      max-width: 270px !important;
      box-sizing: border-box !important;
      height: auto !important;
      max-height: calc(100vh - 100px) !important;
      overflow-y: auto !important;
      z-index: 999999 !important;
      border-radius: 0 16px 16px 0 !important;
      transform: translateX(-100%) !important;
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
      padding: 14px 8px !important;
    }

    body:has(#iuh-sidebar-tab:hover) div.col-md-2.d-none.d-sm-block,
    body:has(#iuh-sidebar-tab:hover) div.col-md-2:has(.sidebar-menu),
    body:has(#iuh-sidebar-tab:hover) div.col-md-2:has(ul),
    div.col-md-2.d-none.d-sm-block:hover,
    div.col-md-2:has(.sidebar-menu):hover,
    div.col-md-2:has(ul):hover,
    div.col-md-2.iuh-open {
      transform: translateX(0) !important;
    }

    /* ========================================================
       4. KHUNG CHỨA LỊCH HỌC BUNG 100% DIỆN TÍCH
       ======================================================== */
    div.col-md-10,
    div[class*="col-md-10"],
    .col-md-10 {
      width: 100% !important;
      max-width: 100% !important;
      flex: 0 0 100% !important;
      padding-left: 12px !important;
      padding-right: 12px !important;
      box-sizing: border-box !important;
    }

    .container:has(div.col-md-2),
    div:has(> .row > div.col-md-2) {
      width: 100% !important;
      max-width: 100% !important;
      padding-left: 16px !important;
      padding-right: 16px !important;
    }

    .row:has(> div.col-md-2) {
      margin-left: 0 !important;
      margin-right: 0 !important;
      width: 100% !important;
    }

    /* ========================================================
       5. BẢNG THỜI KHÓA BIỂU: CHIA ĐỀU TẤT CẢ CÁC CỘT CHUẨN XÁC 100%
       ======================================================== */
    .table-responsive,
    .table-responsive table,
    table.fl-table,
    table[id*="Lich"] {
      table-layout: fixed !important;
      width: 100% !important;
      max-width: 100% !important;
      border-collapse: separate !important;
      border-spacing: 4px !important;
    }

    /* Cột đầu tiên: Ca học (Sáng / Chiều / Tối) - 75px */
    .table-responsive table thead th:first-child,
    table.fl-table thead th:first-child,
    table[id*="Lich"] thead th:first-child,
    .table-responsive table tbody tr td:first-child,
    table.fl-table tbody tr td:first-child,
    table[id*="Lich"] tbody tr td:first-child {
      width: 75px !important;
      min-width: 70px !important;
      max-width: 80px !important;
      text-align: center !important;
      box-sizing: border-box !important;
    }

    /* 7 Cột các ngày trong tuần (Thứ 2 -> Chủ nhật): CHIA ĐỀU TUYỆT ĐỐI */
    .table-responsive table thead th:not(:first-child),
    table.fl-table thead th:not(:first-child),
    table[id*="Lich"] thead th:not(:first-child),
    .table-responsive table tbody tr td:not(:first-child),
    table.fl-table tbody tr td:not(:first-child),
    table[id*="Lich"] tbody tr td:not(:first-child) {
      width: calc((100% - 75px) / 7) !important;
      box-sizing: border-box !important;
      word-break: break-word !important;
      overflow-wrap: break-word !important;
    }

    .table-responsive table tbody tr td:not(:first-child),
    table.fl-table tbody tr td:not(:first-child),
    table[id*="Lich"] tbody tr td:not(:first-child) {
      padding: 3px !important;
      vertical-align: top !important;
    }

    /* ========================================================
       6. ĐỊNH DẠNG CHỮ TRONG THẺ MÔN HỌC: BLACK TEXT 100%
       (Tuyệt đối không dùng chữ trắng mờ trong box môn học)
       ======================================================== */
    .content {
      border-radius: 8px !important;
      padding: 6px 8px !important;
      margin: 2px 0 !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18) !important;
      line-height: 1.25 !important;
    }

    /* Toàn bộ chữ bên trong thẻ môn học bắt buộc là Black Text */
    .content,
    .content *,
    .content b,
    .content p,
    .content span,
    .content font,
    .content a,
    .content span[lang*="lichtheotuan"],
    .content .iuh-time-bold,
    .content .iuh-gv-bold {
      color: #000000 !important;
    }

    /* Tên môn học */
    .content b:first-child,
    .content a b,
    .content > b {
      font-size: 11.5px !important;
      font-weight: 700 !important;
      display: block !important;
      margin-bottom: 2px !important;
    }

    /* Mã lớp học phần */
    .content p {
      font-size: 10px !important;
      font-weight: normal !important;
      margin: 1px 0 !important;
      opacity: 0.9 !important;
    }

    /* IN ĐẬM THỜI GIAN VÀ TÊN GIẢNG VIÊN */
    .iuh-time-bold,
    b.iuh-time-bold,
    .iuh-gv-bold,
    b.iuh-gv-bold,
    font.iuh-gv-bold {
      font-weight: 800 !important;
      color: #000000 !important;
    }

    /* ========================================================
       7. GIAO DIỆN DARK MODE CHI TIẾT
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

    /* Header Dark Mode */
    html.iuh-dark header,
    html.iuh-dark header.header,
    html.iuh-dark .header,
    html.iuh-dark .main-header,
    html.iuh-dark header[style*="background"],
    html.iuh-dark .header[style*="background"] {
      background: #0f172a !important;
      background-color: #0f172a !important;
      border-bottom: 1px solid #1e293b !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
      color: #f8fafc !important;
    }
    html.iuh-dark header .container,
    html.iuh-dark header .container-fluid,
    html.iuh-dark header div:not([class*="dropdown-menu"]):not([class*="input"]) {
      background: transparent !important;
    }
    html.iuh-dark header input[type="text"] {
      background-color: #1e293b !important;
      border: 1px solid #334155 !important;
      border-radius: 20px !important;
      color: #f8fafc !important;
      padding: 6px 16px !important;
    }
    html.iuh-dark header input::placeholder {
      color: #94a3b8 !important;
    }
    html.iuh-dark header a,
    html.iuh-dark .header a,
    html.iuh-dark header span:not(.badge),
    html.iuh-dark header .user-name {
      color: #e2e8f0 !important;
    }
    html.iuh-dark header a:hover {
      color: #38bdf8 !important;
    }
    html.iuh-dark header i:not(.fa-search) {
      color: #38bdf8 !important;
    }
    html.iuh-dark header img:not([src*="logo"]):not([src*="Logo"]) {
      border-radius: 50% !important;
      border: 1.5px solid #38bdf8 !important;
    }

    /* Sidebar Drawer Dark Mode */
    html.iuh-dark div.col-md-2.d-none.d-sm-block,
    html.iuh-dark div.col-md-2:has(.sidebar-menu),
    html.iuh-dark div.col-md-2:has(ul) {
      background: rgba(15, 23, 42, 0.96) !important;
      backdrop-filter: blur(20px) !important;
      border: 1px solid #1e293b !important;
      border-left: none !important;
      box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6) !important;
    }
    html.iuh-dark div.col-md-2 a {
      color: #e2e8f0 !important;
    }
    html.iuh-dark div.col-md-2 a:hover {
      color: #38bdf8 !important;
      background: rgba(30, 41, 59, 0.8) !important;
    }

    /* KHUNG TOOLBAR VÀ TIÊU ĐỀ DARK MODE (ĐÈ SẠCH NỀN TRẮNG CỦA .box-df) */
    html.iuh-dark .box-df,
    html.iuh-dark .portlet,
    html.iuh-dark div[class*="box-df"] {
      background: rgba(15, 23, 42, 0.9) !important;
      background-color: rgba(15, 23, 42, 0.9) !important;
      border: 1px solid #1e293b !important;
      border-radius: 12px !important;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4) !important;
      padding: 12px 16px !important;
      margin-bottom: 16px !important;
    }

    /* Tiêu đề "Lịch học, lịch thi theo tuần" */
    html.iuh-dark .portlet-title .caption,
    html.iuh-dark .portlet-title .caption-subject,
    html.iuh-dark .portlet-title h3,
    html.iuh-dark .portlet-title h4,
    html.iuh-dark .box-df [class*="title"] {
      color: #38bdf8 !important;
      font-weight: 700 !important;
      font-size: 16px !important;
      letter-spacing: 0.2px !important;
    }

    /* Nhãn radio chọn loại lịch */
    html.iuh-dark .portlet-title .actions label,
    html.iuh-dark .portlet-title label,
    html.iuh-dark .box-df label {
      color: #e2e8f0 !important;
      font-weight: 500 !important;
      font-size: 13px !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      cursor: pointer !important;
      margin: 0 6px !important;
    }
    html.iuh-dark .box-df input[type="radio"] {
      accent-color: #0284c7 !important;
    }

    /* Ô chọn ngày Datepicker */
    html.iuh-dark .box-df input[type="text"],
    html.iuh-dark .portlet-title input[type="text"] {
      background-color: #1e293b !important;
      border: 1px solid #334155 !important;
      border-right: none !important;
      border-radius: 8px 0 0 8px !important;
      color: #f8fafc !important;
      height: 36px !important;
      padding: 0 10px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      outline: none !important;
    }
    html.iuh-dark .box-df .input-group-addon,
    html.iuh-dark .box-df .input-group-text,
    html.iuh-dark .box-df .input-group .btn,
    html.iuh-dark .portlet-title .input-group-addon {
      background-color: #1e293b !important;
      border: 1px solid #334155 !important;
      border-left: none !important;
      border-radius: 0 8px 8px 0 !important;
      color: #38bdf8 !important;
      height: 36px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 10px !important;
    }

    /* CÁC NÚT ĐIỀU HƯỚNG: ĐỒNG BỘ, ĐẸP MẮT */
    html.iuh-dark .box-df .btn,
    html.iuh-dark .portlet-title .btn,
    html.iuh-dark #btnHienTai,
    html.iuh-dark #btnInLich {
      height: 36px !important;
      line-height: 34px !important;
      padding: 0 14px !important;
      border-radius: 8px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      vertical-align: middle !important;
      border: 1px solid #334155 !important;
      background: #1e293b !important;
      color: #f8fafc !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
      transition: all 0.2s ease !important;
      margin-left: 5px !important;
    }
    /* Nút Hiện tại: Gradient xanh nổi bật */
    html.iuh-dark #btnHienTai,
    html.iuh-dark .box-df .btn-primary {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
      border: none !important;
      color: #ffffff !important;
      box-shadow: 0 2px 10px rgba(2, 132, 199, 0.4) !important;
    }
    html.iuh-dark #btnHienTai:hover,
    html.iuh-dark .box-df .btn-primary:hover {
      background: linear-gradient(135deg, #0369a1 0%, #075985 100%) !important;
      transform: translateY(-1px) !important;
    }
    html.iuh-dark .box-df .btn:hover,
    html.iuh-dark .portlet-title .btn:hover {
      background: #334155 !important;
      color: #38bdf8 !important;
      border-color: #0284c7 !important;
      transform: translateY(-1px) !important;
    }

    /* Bảng Lịch học Dark Mode */
    html.iuh-dark .table-responsive table thead th,
    html.iuh-dark table.fl-table thead th,
    html.iuh-dark table[id*="Lich"] thead th {
      background: #1e293b !important;
      color: #38bdf8 !important;
      border: 1px solid #334155 !important;
      border-radius: 8px !important;
      padding: 8px 4px !important;
      font-weight: 700 !important;
      font-size: 13px !important;
      text-align: center !important;
    }
    html.iuh-dark .table-responsive table thead th:first-child,
    html.iuh-dark table.fl-table thead th:first-child,
    html.iuh-dark table[id*="Lich"] thead th:first-child,
    html.iuh-dark .table-responsive table tbody tr td:first-child,
    html.iuh-dark table.fl-table tbody tr td:first-child,
    html.iuh-dark table[id*="Lich"] tbody tr td:first-child {
      background: #1e293b !important;
      color: #f8fafc !important;
      border: 1px solid #334155 !important;
      border-radius: 8px !important;
      font-weight: 800 !important;
      font-size: 13px !important;
      text-transform: uppercase !important;
      text-align: center !important;
    }
    html.iuh-dark .table-responsive table tbody tr td:not(:first-child),
    html.iuh-dark table.fl-table tbody tr td:not(:first-child),
    html.iuh-dark table[id*="Lich"] tbody tr td:not(:first-child) {
      background-color: rgba(11, 19, 36, 0.65) !important;
      border: 1px dashed rgba(255, 255, 255, 0.1) !important;
      border-radius: 8px !important;
    }

    /* ========================================================
       CHAN BẢNG (LEGEND): HIỂN THỊ CĂN GIỮA 100%
       ======================================================== */
    div[class*="ghichu"],
    div:has(> span[class*="color-"]),
    div:has(> .color-thuchanh),
    div.table-legend,
    .table-legend,
    .iuh-legend-centered {
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      flex-wrap: wrap !important;
      gap: 18px !important;
      text-align: center !important;
      margin-top: 12px !important;
      margin-left: auto !important;
      margin-right: auto !important;
      box-sizing: border-box !important;
    }

    /* Chân bảng trong Dark Mode */
    html.iuh-dark div[class*="ghichu"],
    html.iuh-dark div:has(> span[class*="color-"]),
    html.iuh-dark div:has(> .color-thuchanh),
    html.iuh-dark div.table-legend,
    html.iuh-dark .table-legend,
    html.iuh-dark .iuh-legend-centered {
      background: rgba(15, 23, 42, 0.88) !important;
      border: 1px solid #1e293b !important;
      border-radius: 10px !important;
      padding: 10px 18px !important;
      color: #cbd5e1 !important;
    }

    /* ========================================================
       8. GIAO DIỆN LIGHT MODE (TRẮNG DỊU MẮT, NỔI 3D)
       ======================================================== */
    html.iuh-light, html.iuh-light body {
      background-color: #f1f5f9 !important;
      background-image: radial-gradient(at 50% 0%, #ffffff 0%, #edf2f7 100%) !important;
      background-attachment: fixed !important;
      color: #0f172a !important;
    }
    html.iuh-light .box-df,
    html.iuh-light .portlet {
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px !important;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05) !important;
    }
    html.iuh-light .portlet-title .caption-subject {
      color: #0284c7 !important;
      font-weight: 700 !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

// 2. Xóa Logo trường hoàn toàn theo yêu cầu
function removeLogo() {
  const logo = (
    document.querySelector("div.logo") ||
    document.querySelector(".logo") ||
    document.querySelector("header .logo") ||
    document.querySelector("div:has(> a[href*='dashboard.html'] > img)") ||
    document.querySelector("img[src*='iuh7313e0f8']")?.closest("div")
  );
  if (logo) {
    logo.remove();
  }
}

// 3. Gắn nút Icon tab độc lập sát mép trái
function setupSidebarCollapse() {
  const sidebar = (
    document.querySelector("div.col-md-2.d-none.d-sm-block") ||
    document.querySelector("div.col-md-2") ||
    Array.from(document.querySelectorAll("div[class*='col-md-2']")).find(
      (el) => el.textContent.includes("TRANG CHỦ") && el.textContent.includes("HỌC TẬP")
    )
  );

  if (!sidebar) return;

  // Xóa khối QR OneUni
  sidebar.querySelectorAll("div, p, img, a").forEach((el) => {
    if (
      (el.tagName === "IMG" && (el.src.includes("qr") || el.src.includes("QR"))) ||
      (el.textContent && (el.textContent.includes("OneUni") || el.textContent.includes("cài đặt OneUni")))
    ) {
      const box = el.closest(".down_ungdung") || el.closest(".box-download-app") || el.parentElement;
      if (box && sidebar.contains(box) && box !== sidebar) {
        box.remove();
      }
    }
  });

  // Gắn nút icon tab vào body sát mép trái
  let tab = document.getElementById("iuh-sidebar-tab");
  if (!tab) {
    tab = document.createElement("div");
    tab.id = "iuh-sidebar-tab";
    tab.title = "Menu Sinh Viên (Rê chuột để mở)";
    tab.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;

    tab.addEventListener("mouseenter", () => {
      sidebar.classList.add("iuh-open");
    });

    tab.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.toggle("iuh-open");
    });

    sidebar.addEventListener("mouseleave", () => {
      sidebar.classList.remove("iuh-open");
    });

    document.addEventListener("click", (e) => {
      if (!sidebar.contains(e.target) && e.target !== tab && !tab.contains(e.target)) {
        sidebar.classList.remove("iuh-open");
      }
    });

    document.body.appendChild(tab);
  }

  // Mở rộng cha (container & col-md-10) chiếm full width
  const row = sidebar.parentElement;
  if (row) {
    row.style.setProperty("width", "100%", "important");
    row.style.setProperty("margin", "0", "important");

    const container = row.parentElement;
    if (container) {
      container.style.setProperty("width", "100%", "important");
      container.style.setProperty("max-width", "100%", "important");
      container.style.setProperty("padding", "0 16px", "important");
    }

    const contentCol = row.querySelector("div.col-md-10, div[class*='col-md-10']");
    if (contentCol) {
      contentCol.style.setProperty("width", "100%", "important");
      contentCol.style.setProperty("max-width", "100%", "important");
      contentCol.style.setProperty("flex", "0 0 100%", "important");
    }
  }
}

// 4. Đổi "Tiết: X - Y" thành giờ cụ thể và IN ĐẬM thời gian học
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

    // Tạo thẻ in đậm riêng cho thời gian
    const bTime = document.createElement("b");
    bTime.className = "iuh-time-bold";
    bTime.style.setProperty("font-weight", "800", "important");
    bTime.style.setProperty("color", "#000000", "important");
    bTime.textContent = gio;

    const colon = document.createTextNode(m[1]);
    const remainingText = after.nodeValue.slice(m[0].length);
    const parent = after.parentNode;
    parent.insertBefore(colon, after);
    parent.insertBefore(bTime, after);
    if (remainingText) {
      parent.insertBefore(document.createTextNode(remainingText), after);
    }
    parent.removeChild(after);
    sp.dataset.iuhGio = "1";
  });
}

// 5. In đậm tên Giảng viên cho toàn bộ các môn học
function boldTeacherName(root) {
  const gvSpans = root.querySelectorAll('span[lang="lichtheotuan-giangvien"]');
  gvSpans.forEach((sp) => {
    let cur = sp.nextSibling;
    while (cur) {
      if (cur.nodeType === Node.ELEMENT_NODE) {
        if (cur.tagName === "FONT" || cur.tagName === "SPAN") {
          cur.classList.add("iuh-gv-bold");
          cur.style.setProperty("font-weight", "800", "important");
          cur.style.setProperty("color", "#000000", "important");
          break;
        }
        if (cur.tagName === "BR" || (cur.className && cur.className.includes("content"))) {
          break;
        }
      } else if (cur.nodeType === Node.TEXT_NODE && cur.nodeValue && cur.nodeValue.trim().length > 0) {
        const val = cur.nodeValue;
        const m = val.match(/^(\s*:?\s*)([^\n\r<]+)/);
        if (m && m[2].trim()) {
          const bGv = document.createElement("b");
          bGv.className = "iuh-gv-bold";
          bGv.style.setProperty("font-weight", "800", "important");
          bGv.style.setProperty("color", "#000000", "important");
          bGv.textContent = m[2].trim();
          const prefix = document.createTextNode(m[1]);
          const p = cur.parentNode;
          p.insertBefore(prefix, cur);
          p.insertBefore(bGv, cur);
          const rest = val.slice(m[0].length);
          if (rest) p.insertBefore(document.createTextNode(rest), cur);
          p.removeChild(cur);
          break;
        }
      }
      cur = cur.nextSibling;
    }
  });

  // Quét các thẻ có chữ GV: để chắc chắn 100% không sót tên GV nào
  const contents = root.querySelectorAll(".content");
  contents.forEach((card) => {
    if (card.dataset.iuhGvBold === "1") return;
    const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.includes("GV:")) {
        const parts = node.nodeValue.split(/(GV:\s*)/);
        if (parts.length >= 3 && parts[2].trim()) {
          const name = parts[2].trim();
          const bGv = document.createElement("b");
          bGv.className = "iuh-gv-bold";
          bGv.style.setProperty("font-weight", "800", "important");
          bGv.style.setProperty("color", "#000000", "important");
          bGv.textContent = name;
          const p = node.parentNode;
          p.insertBefore(document.createTextNode(parts[0] + parts[1]), node);
          p.insertBefore(bGv, node);
          p.removeChild(node);
          break;
        }
      }
    }
    card.dataset.iuhGvBold = "1";
  });
}

// 6. Sửa lỗi hiển thị "Tr?c tuy?n" thành "Trực tuyến"
function fixBrokenText(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (n.nodeValue && n.nodeValue.includes("Tr?c tuy?n")) {
      n.nodeValue = n.nodeValue.replace(/Tr\?c tuy\?n/g, "Trực tuyến");
    }
  }
}

// 7. Chia đều khoảng cách các cột thời khóa biểu chuẩn xác 100%
function equalizeColumns() {
  const tables = document.querySelectorAll("table.fl-table, table[id*='Lich'], .table-responsive table, table");
  tables.forEach((table) => {
    const ths = table.querySelectorAll("thead th, tr:first-child th");
    if (ths.length >= 8) {
      table.style.setProperty("table-layout", "fixed", "important");
      table.style.setProperty("width", "100%", "important");
      ths[0].style.setProperty("width", "75px", "important");
      ths[0].style.setProperty("max-width", "80px", "important");
      for (let i = 1; i < ths.length; i++) {
        ths[i].style.setProperty("width", "calc((100% - 75px) / 7)", "important");
        ths[i].style.setProperty("word-break", "break-word", "important");
      }
    }
  });
}

// 8. Căn giữa thanh chú thích (Legend) ở chân bảng
function centerLegend(root) {
  const elements = root.querySelectorAll("div, p, span");
  for (const el of elements) {
    if (
      el.children &&
      el.children.length >= 3 &&
      el.textContent.includes("Lịch học lý thuyết") &&
      el.textContent.includes("Lịch tạm ngưng")
    ) {
      el.classList.add("iuh-legend-centered");
      el.style.setProperty("display", "flex", "important");
      el.style.setProperty("justify-content", "center", "important");
      el.style.setProperty("align-items", "center", "important");
      el.style.setProperty("flex-wrap", "wrap", "important");
      el.style.setProperty("gap", "18px", "important");
      el.style.setProperty("text-align", "center", "important");
      el.style.setProperty("margin-left", "auto", "important");
      el.style.setProperty("margin-right", "auto", "important");
      break;
    }
  }
}

// 9. Quản lý Dark/Light mode và nút Toggle
function setupThemeMode(defaultMode = "dark") {
  injectThemeStyles();
  if (api && api.storage) {
    api.storage.local.get({ theme_mode: defaultMode }, (res) => {
      const mode = res.theme_mode || defaultMode;
      applyThemeMode(mode);
    });
  } else {
    applyThemeMode(defaultMode);
  }
}

function applyThemeMode(mode) {
  const isDark = mode === "dark";
  document.documentElement.classList.remove("iuh-dark", "iuh-light");
  document.documentElement.classList.add(isDark ? "iuh-dark" : "iuh-light");

  let toggleBtn = document.getElementById("iuh-theme-toggle-btn");
  if (!toggleBtn) {
    toggleBtn = document.createElement("button");
    toggleBtn.id = "iuh-theme-toggle-btn";
    toggleBtn.type = "button";
    document.body.appendChild(toggleBtn);
    toggleBtn.addEventListener("click", () => {
      const currentIsDark = document.documentElement.classList.contains("iuh-dark");
      const newMode = currentIsDark ? "light" : "dark";
      if (api && api.storage) {
        api.storage.local.set({ theme_mode: newMode }, () => {
          applyThemeMode(newMode);
        });
      } else {
        applyThemeMode(newMode);
      }
    });
  }
  toggleBtn.innerHTML = isDark ? "☀️ Chế độ sáng" : "🌙 Chế độ tối";
}

function main() {
  setupThemeMode("dark");
  removeLogo();
  setupSidebarCollapse();
  equalizeColumns();
  thayThe(document);
  boldTeacherName(document);
  fixBrokenText(document);
  centerLegend(document);

  const obs = new MutationObserver(() => {
    removeLogo();
    setupSidebarCollapse();
    equalizeColumns();
    thayThe(document);
    boldTeacherName(document);
    fixBrokenText(document);
    centerLegend(document);
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
