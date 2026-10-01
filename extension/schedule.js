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
    div.col-md-2 img[src*="image-qr-code-one-uni"],
    div.col-md-2 img[src*="one-uni"],
    div.col-md-2 img[src*="qr"],
    div.col-md-2 img[src*="QR"],
    img[src*="image-qr-code-one-uni"],
    img[src*="one-uni"],
    img[src*="one_uni"],
    .box-download-app,
    .down_ungdung {
      display: none !important;
    }

    /* XÓA BUTTON ZOOM / TOÀN MÀN HÌNH */
    #full-table,
    #btn_InLich,
    .portlet-title a#btn_InLich,
    .portlet-title a#full-table,
    .portlet-title a.fullscreen,
    .portlet-title button.fullscreen,
    .portlet-title .btn:has(i[class*="expand"]),
    .portlet-title .btn:has(i[class*="compress"]),
    .portlet-title a:has(i[class*="expand"]),
    .portlet-title a:has(i[class*="compress"]),
    .box-df .btn:has(i[class*="expand"]),
    .box-df a[class*="fullscreen"],
    .box-df button[class*="fullscreen"],
    .fullscreen {
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
      transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
      z-index: 9999999 !important;
      opacity: 1 !important;
      transform: scale(1) !important;
    }
    #iuh-sidebar-tab:hover {
      width: 44px !important;
      background: linear-gradient(135deg, #0369a1 0%, #075985 100%) !important;
      box-shadow: 4px 6px 18px rgba(2, 132, 199, 0.55) !important;
    }

    /* KHI MỞ MENU RA THÌ ẨN ICON ĐI ĐỂ KHÔNG ĐÈ LÊN NỘI DUNG */
    #iuh-sidebar-tab.iuh-tab-hidden,
    body:has(div.col-md-2:hover) #iuh-sidebar-tab,
    body:has(div.col-md-2.iuh-open) #iuh-sidebar-tab,
    div.col-md-2:hover ~ #iuh-sidebar-tab {
      opacity: 0 !important;
      pointer-events: none !important;
      transform: scale(0.7) !important;
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
       5. BẢNG THỜI KHÓA BIỂU: BO GÓC VÀ CHIA ĐỀU CÁC CỘT CHUẨN XÁC
       ======================================================== */
    .table-responsive,
    div:has(> table.fl-table),
    div:has(> table[id*="Lich"]) {
      border-radius: 14px !important;
      overflow: hidden !important;
      border: 1px solid #1e293b !important;
      box-sizing: border-box !important;
    }

    .table-responsive,
    .table-responsive table,
    table.fl-table,
    table[id*="Lich"] {
      table-layout: fixed !important;
      width: 100% !important;
      max-width: 100% !important;
      border-collapse: collapse !important;
      border-spacing: 0 !important;
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
      padding: 4px !important;
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
    html.iuh-dark div.col-md-2:has(ul),
    html.iuh-dark div.col-md-2 {
      background: #0f172a !important;
      background-color: #0f172a !important;
      border: 1px solid #1e293b !important;
      border-left: none !important;
      border-radius: 0 16px 16px 0 !important;
      box-shadow: 0 16px 45px rgba(0, 0, 0, 0.75) !important;
      padding: 14px 0 !important;
    }

    /* Các khối chứa bên trong menu phải trong suốt */
    html.iuh-dark div.col-md-2 .box-df,
    html.iuh-dark div.col-md-2 #accordion-menu,
    html.iuh-dark div.col-md-2 .accordion-menu,
    html.iuh-dark div.col-md-2 ul,
    html.iuh-dark div.col-md-2 li,
    html.iuh-dark div.col-md-2 div:not(#iuh-sidebar-tab) {
      background: transparent !important;
      background-color: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    /* Từng mục danh mục (TRANG CHỦ, THÔNG TIN CHUNG, HỌC TẬP...): Nhỏ gọn, vừa vặn, thanh lịch */
    html.iuh-dark div.col-md-2 a,
    html.iuh-dark div.col-md-2 li a,
    html.iuh-dark div.col-md-2 ul li a,
    html.iuh-dark div.col-md-2 span:not(.badge) {
      color: #f1f5f9 !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      padding: 10px 16px !important;
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
      transition: all 0.2s ease !important;
      text-decoration: none !important;
    }

    html.iuh-dark div.col-md-2 a i,
    html.iuh-dark div.col-md-2 a .fa,
    html.iuh-dark div.col-md-2 a [class*="fa-"] {
      color: #38bdf8 !important;
      font-size: 15px !important;
      width: 18px !important;
      text-align: center !important;
    }
    html.iuh-dark div.col-md-2 .submenu-indicator,
    html.iuh-dark div.col-md-2 .submenu-indicator i {
      color: #64748b !important;
      font-size: 11px !important;
      margin-left: auto !important;
    }

    html.iuh-dark div.col-md-2 a:hover,
    html.iuh-dark div.col-md-2 li:hover > a {
      background: rgba(30, 41, 59, 0.9) !important;
      color: #38bdf8 !important;
      padding-left: 20px !important;
    }

    /* Submenu xổ xuống bên trong */
    html.iuh-dark div.col-md-2 .submenu {
      background: #111c35 !important;
      padding: 2px 0 !important;
      list-style: none !important;
    }
    html.iuh-dark div.col-md-2 .submenu li a {
      font-size: 12px !important;
      padding: 7px 16px 7px 36px !important;
      color: #94a3b8 !important;
      border-bottom: none !important;
    }
    html.iuh-dark div.col-md-2 .submenu li a:hover {
      color: #38bdf8 !important;
      background: rgba(56, 189, 248, 0.08) !important;
    }

    /* ========================================================
       DUY NHẤT 1 BOX BỌC NGOÀI (.box-df), TRIỆT TIÊU CÁC KHỐI LỒNG
       ======================================================== */
    html.iuh-dark .box-df {
      background: rgba(15, 23, 42, 0.82) !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-radius: 16px !important;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45) !important;
      padding: 16px !important;
      margin-bottom: 20px !important;
    }

    /* Triệt tiêu toàn bộ nền và viền lồng nhau bên trong (chỉ giữ 1 box bọc duy nhất) */
    html.iuh-dark .portlet,
    html.iuh-dark #viewLichTheoTuan,
    html.iuh-dark .table-responsive,
    html.iuh-dark div:has(> #tableLich),
    html.iuh-dark div:has(> .table-responsive),
    html.iuh-dark div:has(> #btnHienTai),
    html.iuh-dark .box,
    html.iuh-dark .box-body {
      background: transparent !important;
      background-color: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
    }

    /* BỐ CỤC TOOLBAR MỚI (CHỐNG DỒN CỤC CHÍNH GIỮA) */
    .portlet-title,
    .box-df .portlet-title {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 16px !important;
      margin-bottom: 16px !important;
      border: none !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    /* Tiêu đề "Lịch học, lịch thi theo tuần" */
    .portlet-title .caption,
    .portlet-title .caption-subject,
    html.iuh-dark .portlet-title .caption,
    html.iuh-dark .portlet-title .caption-subject {
      color: #38bdf8 !important;
      font-weight: 700 !important;
      font-size: 16.5px !important;
      letter-spacing: 0.2px !important;
      white-space: nowrap !important;
      flex-shrink: 0 !important;
    }

    /* THANH ACTIONS CHỨA CÁC ĐIỀU KHIỂN */
    .portlet-title .actions {
      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;
      gap: 20px !important;
      margin-left: auto !important;
      width: auto !important;
      flex: 1 1 auto !important;
    }

    /* ========================================================
       3 RADIO BUTTONS: DÀN TRẢI ĐỀU 1 HÀNG NGANG, GIÃN CÁCH ĐẸP
       ======================================================== */
    .portlet-title .mt-radio-inline,
    div.mt-radio-inline {
      width: auto !important;
      float: none !important;
      padding: 0 !important;
      margin: 0 !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 24px !important;
      white-space: nowrap !important;
      flex-shrink: 0 !important;
    }

    /* Các nhãn radio: dàn ngang, không bao giờ bị rớt dòng */
    .portlet-title label.mt-radio,
    .box-df label.mt-radio,
    label.mt-radio {
      position: relative !important;
      display: inline-flex !important;
      align-items: center !important;
      padding-left: 26px !important;
      margin: 0 !important;
      cursor: pointer !important;
      font-size: 13.5px !important;
      font-weight: 600 !important;
      user-select: none !important;
      white-space: nowrap !important;
      line-height: 20px !important;
      min-height: 20px !important;
    }
    label.mt-radio label,
    .mt-radio label {
      margin: 0 !important;
      padding: 0 !important;
      cursor: pointer !important;
      color: #e2e8f0 !important;
      font-size: 13.5px !important;
      font-weight: 600 !important;
      display: inline-block !important;
    }

    /* Đảm bảo input radio nằm gọn trong label */
    label.mt-radio > input[type="radio"],
    .mt-radio > input[type="radio"] {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      opacity: 0 !important;
      cursor: pointer !important;
      z-index: 2 !important;
      margin: 0 !important;
    }

    /* VÒNG TRÒN NÚT RADIO (.mt-radio > span) */
    label.mt-radio > span,
    .mt-radio > span {
      display: block !important;
      position: absolute !important;
      top: 1px !important;
      left: 0 !important;
      width: 18px !important;
      height: 18px !important;
      border-radius: 50% !important;
      box-sizing: border-box !important;
      transition: all 0.2s ease !important;
      pointer-events: none !important;
      z-index: 1 !important;
    }

    /* Vòng tròn trong Dark Mode */
    html.iuh-dark label.mt-radio > span,
    html.iuh-dark .mt-radio > span {
      background-color: #1e293b !important;
      border: 2px solid #64748b !important;
    }
    html.iuh-dark label.mt-radio:hover > span {
      border-color: #38bdf8 !important;
    }
    html.iuh-dark label.mt-radio > input:checked ~ span,
    html.iuh-dark .mt-radio > input:checked ~ span {
      border-color: #38bdf8 !important;
      background-color: #1e293b !important;
    }
    html.iuh-dark label.mt-radio > input:checked ~ span:after,
    html.iuh-dark .mt-radio > input:checked ~ span:after {
      content: "" !important;
      position: absolute !important;
      display: block !important;
      top: 3px !important;
      left: 3px !important;
      width: 8px !important;
      height: 8px !important;
      border-radius: 50% !important;
      background-color: #38bdf8 !important;
      box-shadow: 0 0 8px rgba(56, 189, 248, 0.7) !important;
    }
    html.iuh-dark label.mt-radio:has(input:checked) label {
      color: #38bdf8 !important;
      font-weight: 700 !important;
    }

    /* Vòng tròn trong Light Mode */
    html.iuh-light label.mt-radio > span,
    html.iuh-light .mt-radio > span {
      background-color: #ffffff !important;
      border: 2px solid #94a3b8 !important;
    }
    html.iuh-light label.mt-radio:hover > span {
      border-color: #0284c7 !important;
    }
    html.iuh-light label.mt-radio > input:checked ~ span,
    html.iuh-light .mt-radio > input:checked ~ span {
      border-color: #0284c7 !important;
      background-color: #ffffff !important;
    }
    html.iuh-light label.mt-radio > input:checked ~ span:after,
    html.iuh-light .mt-radio > input:checked ~ span:after {
      content: "" !important;
      position: absolute !important;
      display: block !important;
      top: 3px !important;
      left: 3px !important;
      width: 8px !important;
      height: 8px !important;
      border-radius: 50% !important;
      background-color: #0284c7 !important;
    }
    html.iuh-light label.mt-radio:has(input:checked) label {
      color: #0284c7 !important;
      font-weight: 700 !important;
    }

    /* ========================================================
       CỤM 4 NÚT ĐIỀU KHIỂN BÊN PHẢI (DATEPICKER + HIỆN TẠI + TRỞ VỀ + TIẾP)
       Tuyệt đối không bao giờ bị xếp chồng lên nhau
       ======================================================== */
    .iuh-right-controls {
      display: inline-flex !important;
      flex-direction: row !important;
      flex-wrap: nowrap !important;
      align-items: center !important;
      gap: 8px !important;
      margin-left: auto !important;
      flex-shrink: 0 !important;
      white-space: nowrap !important;
    }
    .iuh-right-controls > * {
      flex-shrink: 0 !important;
      white-space: nowrap !important;
    }

    /* ========================================================
       RESPONSIVE KHI MÀN HÌNH NHỎ HƠN (DƯỚI 1350PX HOẶC MỞ DEVTOOLS)
       ======================================================== */
    @media (max-width: 1350px) {
      .portlet-title,
      .box-df .portlet-title {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 14px !important;
      }

      /* Hàng 1: Title nằm CHÍNH GIỮA màn hình */
      .portlet-title .caption,
      html.iuh-dark .portlet-title .caption {
        width: 100% !important;
        text-align: center !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        margin: 0 !important;
      }
      .portlet-title .caption .caption-subject {
        font-size: 17px !important;
        text-align: center !important;
      }

      /* Hàng 2: Actions chiếm 100% bề ngang, chia 2 bên */
      .portlet-title .actions {
        width: 100% !important;
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        justify-content: space-between !important;
        align-items: center !important;
        margin: 0 !important;
      }

      /* 3 nút Radio dạt về BÊN TRÁI */
      .portlet-title .actions .mt-radio-inline {
        margin-right: auto !important;
      }

      /* Cụm 4 nút điều khiển (Datepicker + Hiện tại + Trở về + Tiếp) dồn về BÊN PHẢI */
      .iuh-right-controls {
        margin-left: auto !important;
      }
    }

    /* ========================================================
       TỐI ƯU KENDO DATEPICKER & LỊCH POPUP
       ======================================================== */
    /* Khung Datepicker Wrapper */
    html.iuh-dark .k-datepicker,
    html.iuh-dark .k-picker-wrap,
    html.iuh-dark span.k-datepicker,
    html.iuh-dark span.k-picker-wrap,
    html.iuh-dark .input-group:has(input[id*="Ngay"]) {
      background-color: #1e293b !important;
      border: 1.5px solid #334155 !important;
      border-radius: 8px !important;
      height: 36px !important;
      box-sizing: border-box !important;
      display: inline-flex !important;
      align-items: center !important;
      overflow: hidden !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25) !important;
      padding: 0 !important;
    }
    html.iuh-dark .k-picker-wrap:hover,
    html.iuh-dark .k-picker-wrap.k-state-hover,
    html.iuh-dark .k-picker-wrap.k-state-focused {
      border-color: #38bdf8 !important;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2) !important;
    }

    /* Ô input ngày tháng */
    html.iuh-dark .k-datepicker .k-input,
    html.iuh-dark input.k-input,
    html.iuh-dark .box-df input[type="text"],
    html.iuh-dark .portlet-title input[type="text"],
    html.iuh-dark input[id*="Ngay"] {
      background-color: transparent !important;
      color: #f8fafc !important;
      font-size: 13.5px !important;
      font-weight: 700 !important;
      height: 34px !important;
      line-height: 34px !important;
      padding: 0 12px !important;
      border: none !important;
      outline: none !important;
    }

    /* Nút icon lịch bên phải */
    html.iuh-dark .k-datepicker .k-select,
    html.iuh-dark span.k-select,
    html.iuh-dark .k-picker-wrap .k-select,
    html.iuh-dark .k-state-default > .k-select,
    html.iuh-dark .box-df .input-group-addon,
    html.iuh-dark .box-df .input-group-text,
    html.iuh-dark .portlet-title .input-group-addon,
    html.iuh-dark .portlet-title .input-group-btn .btn {
      background-color: #1e293b !important;
      background: #1e293b !important;
      border: none !important;
      border-left: 1px solid #334155 !important;
      color: #38bdf8 !important;
      width: 36px !important;
      height: 34px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      padding: 0 !important;
      transition: background 0.2s ease, color 0.2s ease !important;
    }
    html.iuh-dark .k-datepicker .k-select:hover,
    html.iuh-dark span.k-select:hover {
      background-color: #334155 !important;
      color: #7dd3fc !important;
    }
    html.iuh-dark .k-icon.k-i-calendar,
    html.iuh-dark .k-select i,
    html.iuh-dark .k-select .fa {
      color: #38bdf8 !important;
    }

    /* Lịch Popup (Kendo Calendar Popup) Dark Mode */
    html.iuh-dark .k-calendar-container,
    html.iuh-dark .k-popup,
    html.iuh-dark .k-calendar {
      background-color: #0f172a !important;
      border: 1px solid #334155 !important;
      border-radius: 12px !important;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75) !important;
      color: #f8fafc !important;
      overflow: hidden !important;
    }
    html.iuh-dark .k-calendar .k-header {
      background: #1e293b !important;
      border-bottom: 1px solid #334155 !important;
      color: #f8fafc !important;
      padding: 8px 12px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
    }
    html.iuh-dark .k-calendar .k-header .k-link {
      color: #f8fafc !important;
      font-weight: 700 !important;
      font-size: 13.5px !important;
    }
    html.iuh-dark .k-calendar .k-nav-prev,
    html.iuh-dark .k-calendar .k-nav-next,
    html.iuh-dark .k-calendar .k-header .k-icon {
      color: #38bdf8 !important;
      cursor: pointer !important;
    }
    html.iuh-dark .k-calendar th {
      background: #0f172a !important;
      color: #38bdf8 !important;
      font-weight: 700 !important;
      font-size: 12px !important;
      padding: 6px 4px !important;
      border-bottom: 1px solid #1e293b !important;
      text-align: center !important;
    }
    html.iuh-dark .k-calendar td .k-link {
      color: #cbd5e1 !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      padding: 6px !important;
      border-radius: 8px !important;
      display: block !important;
      transition: all 0.15s ease !important;
    }
    html.iuh-dark .k-calendar td .k-link:hover {
      background-color: #1e293b !important;
      color: #38bdf8 !important;
    }
    html.iuh-dark .k-calendar td.k-other-month .k-link {
      color: #475569 !important;
      opacity: 0.6 !important;
    }
    html.iuh-dark .k-calendar td.k-state-selected .k-link,
    html.iuh-dark .k-calendar td.k-selected .k-link {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
      color: #ffffff !important;
      font-weight: 800 !important;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.5) !important;
    }
    html.iuh-dark .k-calendar td.k-today .k-link {
      border: 1.5px solid #38bdf8 !important;
      color: #38bdf8 !important;
    }
    html.iuh-dark .k-calendar .k-footer,
    html.iuh-dark .k-calendar .k-footer .k-link {
      background: #1e293b !important;
      border-top: 1px solid #334155 !important;
      color: #38bdf8 !important;
      font-weight: 700 !important;
      font-size: 12.5px !important;
      text-align: center !important;
      padding: 8px !important;
    }

    /* CÁC NÚT ĐIỀU HƯỚNG: ĐỒNG BỘ, ĐẸP MẮT */
    html.iuh-dark .box-df .btn,
    html.iuh-dark .portlet-title .btn,
    html.iuh-dark .btn-action,
    html.iuh-dark #btn_HienTai,
    html.iuh-dark #btn_TroVe,
    html.iuh-dark #btn_Tiep {
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
      text-decoration: none !important;
    }
    /* Nút Hiện tại: Gradient xanh nổi bật */
    html.iuh-dark #btn_HienTai,
    html.iuh-dark .box-df .btn-primary {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
      border: none !important;
      color: #ffffff !important;
      box-shadow: 0 2px 10px rgba(2, 132, 199, 0.4) !important;
    }
    html.iuh-dark #btn_HienTai:hover,
    html.iuh-dark .box-df .btn-primary:hover {
      background: linear-gradient(135deg, #0369a1 0%, #075985 100%) !important;
      transform: translateY(-1px) !important;
    }
    html.iuh-dark .box-df .btn:hover,
    html.iuh-dark .portlet-title .btn:hover,
    html.iuh-dark #btn_TroVe:hover,
    html.iuh-dark #btn_Tiep:hover {
      background: #334155 !important;
      color: #38bdf8 !important;
      border-color: #0284c7 !important;
      transform: translateY(-1px) !important;
    }

    /* XÓA NÚT IN LỊCH VÀ PHÓNG TO */
    #btn_InLich,
    #full-table,
    .portlet-title a#btn_InLich,
    .portlet-title a#full-table {
      display: none !important;
    }

    /* ========================================================
       BIẾN MẤT TOÀN BỘ ĐƯỜNG KẺ MÀU TRẮNG TRÊN TABLE (ĐỒNG NHẤT 100%)
       ======================================================== */
    html.iuh-dark table,
    html.iuh-dark table.fl-table,
    html.iuh-dark table[id*="Lich"],
    html.iuh-dark .table-bordered,
    html.iuh-dark .table-responsive table {
      border: none !important;
      border-color: transparent !important;
      border-collapse: collapse !important;
      border-spacing: 0 !important;
      box-shadow: none !important;
      background: transparent !important;
    }

    /* Triệt tiêu đường viền trắng của Bootstrap trên mọi th và td */
    html.iuh-dark .table-bordered > :not(caption) > * > *,
    html.iuh-dark .table-bordered th,
    html.iuh-dark .table-bordered td,
    html.iuh-dark table th,
    html.iuh-dark table td {
      border: 1px solid #1e293b !important; /* Đường kẻ tối tiệp màu với nền, KHÔNG CÒN ĐƯỜNG KẺ TRẮNG */
    }

    /* Tiêu đề Thứ và Ngày (thead th): Phẳng, liền mạch, tiệp màu */
    html.iuh-dark .table-responsive table thead th,
    html.iuh-dark table.fl-table thead th,
    html.iuh-dark table[id*="Lich"] thead th {
      background: #111c35 !important;
      color: #38bdf8 !important;
      border: 1px solid #1e293b !important;
      border-top: none !important;
      border-radius: 0 !important;
      padding: 10px 4px !important;
      font-weight: 700 !important;
      font-size: 13px !important;
      text-align: center !important;
    }

    /* Cột Ca học (Sáng / Chiều / Tối) - Phẳng, liền mạch, tiệp màu */
    html.iuh-dark .table-responsive table thead th:first-child,
    html.iuh-dark table.fl-table thead th:first-child,
    html.iuh-dark table[id*="Lich"] thead th:first-child,
    html.iuh-dark .table-responsive table tbody tr td:first-child,
    html.iuh-dark table.fl-table tbody tr td:first-child,
    html.iuh-dark table[id*="Lich"] tbody tr td:first-child {
      width: 75px !important;
      min-width: 70px !important;
      max-width: 80px !important;
      background: #111c35 !important;
      color: #f8fafc !important;
      border: 1px solid #1e293b !important;
      border-left: none !important;
      border-radius: 0 !important;
      font-weight: 800 !important;
      font-size: 13px !important;
      text-transform: uppercase !important;
      text-align: center !important;
    }

    /* Các ô học tập: Đường kẻ tối siêu mảnh mờ, KHÔNG KẺ TRẮNG */
    html.iuh-dark .table-responsive table tbody tr td:not(:first-child),
    html.iuh-dark table.fl-table tbody tr td:not(:first-child),
    html.iuh-dark table[id*="Lich"] tbody tr td:not(:first-child) {
      background-color: rgba(11, 19, 36, 0.45) !important;
      border: 1px solid #1e293b !important;
      border-radius: 0 !important;
      padding: 4px !important;
      vertical-align: top !important;
    }

    /* KHỬ TUYỆT ĐỐI NỀN VÀ VIỀN CỦA .wrapper ĐỂ KHÔNG CHE NỀN GRADIENT */
    .wrapper,
    div.wrapper,
    html.iuh-dark .wrapper,
    html.iuh-dark div.wrapper,
    .wapper-login,
    main.wapper-login {
      background: transparent !important;
      background-color: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }

    /* ========================================================
       CHAN BẢNG (LEGEND): HIỂN THỊ CĂN GIỮA, NỀN TRONG SUỐT
       ======================================================== */
    div.table-legend,
    .table-legend,
    .iuh-legend-centered {
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      flex-wrap: wrap !important;
      gap: 20px !important;
      text-align: center !important;
      margin: 14px auto 0 !important;
      padding: 6px 0 !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      box-sizing: border-box !important;
      width: 100% !important;
    }

    /* Chân bảng trong Dark Mode */
    html.iuh-dark div.table-legend,
    html.iuh-dark .table-legend,
    html.iuh-dark .iuh-legend-centered {
      background: transparent !important;
      border: none !important;
      color: #cbd5e1 !important;
    }

    /* ========================================================
       LÀM NỔI BẬT CỘT HÔM NAY (TODAY'S COLUMN HIGHLIGHT)
       ======================================================== */
    /* Header cột hôm nay */
    html.iuh-dark .table-responsive table thead th.iuh-today-header,
    html.iuh-dark table.fl-table thead th.iuh-today-header,
    html.iuh-dark table[id*="Lich"] thead th.iuh-today-header,
    html.iuh-dark th.iuh-today-header,
    html.iuh-dark thead th.iuh-today-header {
      background: linear-gradient(180deg, #0284c7 0%, #0369a1 100%) !important;
      color: #ffffff !important;
      font-weight: 800 !important;
      border-color: #38bdf8 !important;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.45) !important;
      position: relative !important;
    }
    .iuh-today-badge {
      display: block !important;
      clear: both !important;
      font-size: 10px !important;
      font-weight: 800 !important;
      letter-spacing: 0.8px !important;
      color: #f8fafc !important;
      background: rgba(14, 165, 233, 0.45) !important;
      padding: 2px 10px !important;
      border-radius: 9999px !important;
      margin: 6px auto 2px !important;
      width: fit-content !important;
      border: 1px solid rgba(255, 255, 255, 0.35) !important;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25) !important;
      line-height: 1.4 !important;
    }

    /* Toàn bộ các ô trong cột hôm nay (Sáng, Chiều, Tối) */
    html.iuh-dark .table-responsive table tbody tr td.iuh-today-col,
    html.iuh-dark table.fl-table tbody tr td.iuh-today-col,
    html.iuh-dark table[id*="Lich"] tbody tr td.iuh-today-col,
    html.iuh-dark td.iuh-today-col,
    html.iuh-dark tbody td.iuh-today-col {
      background-color: rgba(2, 132, 199, 0.16) !important; /* Ánh sáng xanh dịu dàng làm sáng cả cột hôm nay */
      border-left: 2px solid #38bdf8 !important;
      border-right: 2px solid #38bdf8 !important;
    }

    /* Light Mode */
    html.iuh-light .table-responsive table thead th.iuh-today-header,
    html.iuh-light th.iuh-today-header,
    html.iuh-light thead th.iuh-today-header {
      background: linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%) !important;
      color: #0369a1 !important;
      font-weight: 800 !important;
      border: 1.5px solid #0284c7 !important;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.2) !important;
    }
    html.iuh-light .iuh-today-badge {
      background: #0284c7 !important;
      color: #ffffff !important;
      border: none !important;
    }
    html.iuh-light .table-responsive table tbody tr td.iuh-today-col,
    html.iuh-light td.iuh-today-col,
    html.iuh-light tbody td.iuh-today-col {
      background-color: rgba(224, 242, 254, 0.45) !important;
      border-left: 2px solid #38bdf8 !important;
      border-right: 2px solid #38bdf8 !important;
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
      tab.classList.add("iuh-tab-hidden");
    });

    tab.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.toggle("iuh-open");
      if (sidebar.classList.contains("iuh-open")) {
        tab.classList.add("iuh-tab-hidden");
      } else {
        tab.classList.remove("iuh-tab-hidden");
      }
    });

    sidebar.addEventListener("mouseleave", () => {
      sidebar.classList.remove("iuh-open");
      tab.classList.remove("iuh-tab-hidden");
    });

    document.addEventListener("click", (e) => {
      if (!sidebar.contains(e.target) && e.target !== tab && !tab.contains(e.target)) {
        sidebar.classList.remove("iuh-open");
        tab.classList.remove("iuh-tab-hidden");
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (sidebar.classList.contains("iuh-open")) {
        const r = sidebar.getBoundingClientRect();
        if (e.clientX > r.right + 35) {
          sidebar.classList.remove("iuh-open");
          tab.classList.remove("iuh-tab-hidden");
        }
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
    if (sp.dataset.iuhGvBold === "1") return;
    sp.dataset.iuhGvBold = "1";
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

// 8. Căn giữa thanh chú thích (Legend) ở chân bảng (nền trong suốt, không đè lên .wrapper)
function centerLegend(root) {
  // Gỡ bỏ class iuh-legend-centered nếu từng bị gán nhầm lên .wrapper hoặc container lớn
  root.querySelectorAll(".wrapper, .main-content, .container, .box-df, div[class*='wrapper']").forEach((el) => {
    el.classList.remove("iuh-legend-centered");
  });

  const textNodes = Array.from(root.querySelectorAll("span, p, b, strong")).filter(
    (el) => el.textContent.trim() === "Lịch học lý thuyết" || el.textContent.includes("Lịch học lý thuyết")
  );
  for (const t of textNodes) {
    const parent = t.parentElement;
    if (
      parent &&
      !parent.classList.contains("wrapper") &&
      !parent.classList.contains("main-content") &&
      !parent.classList.contains("container") &&
      !parent.classList.contains("box-df") &&
      !parent.classList.contains("portlet")
    ) {
      parent.classList.add("iuh-legend-centered");
      parent.style.setProperty("display", "flex", "important");
      parent.style.setProperty("justify-content", "center", "important");
      parent.style.setProperty("align-items", "center", "important");
      parent.style.setProperty("flex-wrap", "wrap", "important");
      parent.style.setProperty("gap", "20px", "important");
      parent.style.setProperty("text-align", "center", "important");
      parent.style.setProperty("margin", "14px auto 0", "important");
      parent.style.setProperty("background", "transparent", "important");
      parent.style.setProperty("border", "none", "important");
      parent.style.setProperty("box-shadow", "none", "important");
      break;
    }
  }
}

// 9. Đảm bảo 3 nút radio dàn trải thành 1 hàng ngang duy nhất & giãn cách đẹp
function ensureRadioRow() {
  const radioInline = document.querySelector(".mt-radio-inline") || document.querySelector("div:has(> input[type='radio'])");
  if (radioInline) {
    radioInline.style.setProperty("display", "inline-flex", "important");
    radioInline.style.setProperty("flex-direction", "row", "important");
    radioInline.style.setProperty("flex-wrap", "nowrap", "important");
    radioInline.style.setProperty("align-items", "center", "important");
    radioInline.style.setProperty("gap", "28px", "important");
    radioInline.style.setProperty("white-space", "nowrap", "important");
    radioInline.style.setProperty("flex-shrink", "0", "important");
    radioInline.style.setProperty("width", "auto", "important");
    radioInline.style.setProperty("float", "none", "important");
  }
  const actions = document.querySelector(".portlet-title .actions");
  if (actions) {
    actions.style.removeProperty("width");
    actions.style.removeProperty("min-width");
  }
  document.querySelectorAll(".portlet-title label.mt-radio, .box-df label.mt-radio, label.mt-radio").forEach((lbl) => {
    lbl.style.setProperty("display", "inline-flex", "important");
    lbl.style.setProperty("align-items", "center", "important");
    lbl.style.setProperty("padding-left", "26px", "important");
    lbl.style.setProperty("margin", "0", "important");
    lbl.style.setProperty("white-space", "nowrap", "important");
    lbl.style.setProperty("cursor", "pointer", "important");

    const input = lbl.querySelector("input[type='radio']");
    if (input && !lbl.dataset.iuhClickBound) {
      lbl.dataset.iuhClickBound = "1";
      lbl.addEventListener("click", () => {
        if (!input.checked) {
          input.checked = true;
          input.dispatchEvent(new Event("change", { bubbles: true }));
          input.dispatchEvent(new Event("click", { bubbles: true }));
        }
      });
    }
  });
}

// 10. Xóa nút Zoom / Toàn màn hình & nút In lịch, gom cụm điều hướng dồn về bên phải
function organizeToolbar() {
  const actions = document.querySelector(".portlet-title .actions");
  if (!actions) return;

  // Xóa nút In lịch và Phóng to
  const inLich = document.getElementById("btn_InLich") || actions.querySelector("a[onclick*='PrintElem']");
  if (inLich) inLich.remove();

  const fullTable = document.getElementById("full-table") || actions.querySelector("a:has(.glyphicon-resize-full), a:has(.fa-expand)");
  if (fullTable) fullTable.remove();

  // Xóa bất kỳ nút fullscreen nào còn sót
  document.querySelectorAll(".portlet-title .btn, .portlet-title a, .box-df .btn, .box-df a, button, a").forEach((btn) => {
    const hasExpandIcon = btn.querySelector("i.fa-expand, i[class*='expand'], i[class*='compress'], i[class*='arrows-alt'], span.glyphicon-resize-full");
    const isFullscreenBtn = (
      btn.id === "full-table" ||
      btn.id === "btn_InLich" ||
      btn.classList.contains("fullscreen") ||
      (btn.getAttribute("title") && (btn.getAttribute("title").toLowerCase().includes("màn hình") || btn.getAttribute("title").toLowerCase().includes("fullscreen")))
    );
    if ((hasExpandIcon || isFullscreenBtn) && (btn.tagName === "BUTTON" || btn.tagName === "A" || btn.classList.contains("btn"))) {
      btn.style.setProperty("display", "none", "important");
      btn.remove();
    }
  });

  // Tạo cụm điều khiển bên phải (Datepicker + Hiện tại + Trở về + Tiếp) dồn về phải
  let rightGroup = actions.querySelector(".iuh-right-controls");
  if (!rightGroup) {
    rightGroup = document.createElement("div");
    rightGroup.className = "iuh-right-controls";
    actions.appendChild(rightGroup);
  }

  const datepicker = actions.querySelector(".k-datepicker, span:has(#dateNgayXemLich)");
  const btnHienTai = document.getElementById("btn_HienTai");
  const btnTroVe = document.getElementById("btn_TroVe");
  const btnTiep = document.getElementById("btn_Tiep");

  if (datepicker && rightGroup !== datepicker.parentElement) rightGroup.appendChild(datepicker);
  if (btnHienTai && rightGroup !== btnHienTai.parentElement) rightGroup.appendChild(btnHienTai);
  if (btnTroVe && rightGroup !== btnTroVe.parentElement) rightGroup.appendChild(btnTroVe);
  if (btnTiep && rightGroup !== btnTiep.parentElement) rightGroup.appendChild(btnTiep);
}

// 11. Xóa sạch khối mã QR OneUni trên toàn trang
function removeOneUniQR() {
  document.querySelectorAll("img[src*='image-qr-code-one-uni'], img[src*='one-uni'], img[src*='one_uni']").forEach((img) => {
    img.style.setProperty("display", "none", "important");
    img.remove();
  });
  document.querySelectorAll("div, p, span, a, img, section").forEach((el) => {
    const text = el.textContent || "";
    const isQRText = text.includes("OneUni") || text.includes("Quét QR") || text.includes("cài đặt OneUni");
    const isQRImg = el.tagName === "IMG" && (el.src.toLowerCase().includes("qr") || el.src.toLowerCase().includes("oneuni") || (el.alt && el.alt.toLowerCase().includes("qr")));

    if (isQRText || isQRImg) {
      const card = (
        el.closest(".box-download-app") ||
        el.closest(".down_ungdung") ||
        el.closest("div[style*='background']") ||
        el.closest("div[class*='download']") ||
        el.closest("div[class*='app']") ||
        (el.tagName === "DIV" ? el : el.parentElement)
      );
      if (
        card &&
        !card.classList.contains("col-md-2") &&
        !card.classList.contains("col-md-10") &&
        !card.classList.contains("main-content") &&
        !card.classList.contains("container") &&
        !card.classList.contains("row") &&
        !card.classList.contains("box-df") &&
        !card.classList.contains("wrapper")
      ) {
        card.style.setProperty("display", "none", "important");
        card.remove();
      }
    }
  });
}

// 12. Làm nổi bật toàn bộ cột ngày hôm nay (Header + Tất cả các ca học)
function highlightTodayColumn(root) {
  const today = new Date();
  const d = today.getDate();
  const m = today.getMonth() + 1;
  const y = today.getFullYear();

  const tables = (root || document).querySelectorAll("table.fl-table, table[id*='Lich'], .table-responsive table, table");
  tables.forEach((table) => {
    const ths = table.querySelectorAll("thead th, tr:first-child th");
    let todayIndex = -1;
    for (let i = 1; i < ths.length; i++) {
      const dateMatch = ths[i].textContent.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
      if (dateMatch) {
        const colD = parseInt(dateMatch[1], 10);
        const colM = parseInt(dateMatch[2], 10);
        const colY = dateMatch[3] ? parseInt(dateMatch[3], 10) : y;
        if (colD === d && colM === m && colY === y) {
          todayIndex = i;
          break;
        }
      }
    }

    if (todayIndex === -1) {
      // Tuần này không chứa ngày hôm nay -> Gỡ sạch toàn bộ highlight cũ
      table.querySelectorAll(".iuh-today-col, .iuh-today-header").forEach((el) => {
        el.classList.remove("iuh-today-col", "iuh-today-header");
      });
      table.querySelectorAll(".iuh-today-badge").forEach((el) => el.remove());
      return;
    }

    const todayTh = ths[todayIndex];
    if (todayTh.classList.contains("iuh-today-header") && todayTh.querySelector(".iuh-today-badge")) {
      // Đã có highlight hôm nay rồi, không lặp lại
      return;
    }

    // Reset highlight cũ nếu có
    table.querySelectorAll(".iuh-today-col, .iuh-today-header").forEach((el) => {
      el.classList.remove("iuh-today-col", "iuh-today-header");
    });
    table.querySelectorAll(".iuh-today-badge").forEach((el) => el.remove());

    // Highlight header
    todayTh.classList.add("iuh-today-header");
    const badge = document.createElement("div");
    badge.className = "iuh-today-badge";
    badge.textContent = "HÔM NAY";
    todayTh.appendChild(badge);

    // Highlight body cells
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach((r) => {
      const cells = r.querySelectorAll("td");
      if (cells[todayIndex]) {
        cells[todayIndex].classList.add("iuh-today-col");
      }
    });
  });
}

// 13. Quản lý Dark/Light mode và nút Toggle
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

let isUpdating = false;
let updateTimer = null;
let obs = null;

function runAll() {
  if (isUpdating) return;
  isUpdating = true;
  try {
    // Tạm ngắt observer để tránh vòng lặp DOM mutation gây treo tab
    if (obs) obs.disconnect();

    removeLogo();
    organizeToolbar();
    setupSidebarCollapse();
    removeOneUniQR();
    equalizeColumns();
    ensureRadioRow();
    thayThe(document);
    boldTeacherName(document);
    fixBrokenText(document);
    centerLegend(document);
    highlightTodayColumn(document);
  } finally {
    if (obs) {
      obs.observe(document.body, { childList: true, subtree: true });
    }
    isUpdating = false;
  }
}

function scheduleUpdate() {
  if (updateTimer) clearTimeout(updateTimer);
  updateTimer = setTimeout(runAll, 300);
}

function main() {
  setupThemeMode("dark");
  runAll();

  obs = new MutationObserver(scheduleUpdate);
  obs.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
