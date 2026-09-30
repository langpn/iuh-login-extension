// =====================================================================
// IUH Fast Login — Content Script Thời khóa biểu (sv.iuh.edu.vn)
// ---------------------------------------------------------------------
// 1. Thu gọn Sidebar (div.col-md-2.d-none.d-sm-block) thành một icon
//    nằm sát mép trái màn hình. Khi hover vào thì "nẩy" menu ra mượt mà.
// 2. Xóa sạch khối mã QR OneUni thừa trong sidebar.
// 3. Mở rộng vùng lịch học (col-md-10) chiếm trọn 100% diện tích màn hình.
// 4. Giữ nguyên 100% màu sắc và giao diện gốc của trường (không can thiệp màu sắc).
// 5. Đổi "Tiết: X - Y" thành giờ cụ thể (vd: 12:30 - 15:00).
// =====================================================================

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

// 1. Tiêm CSS: Icon sát mép trái, hiệu ứng nẩy Sidebar và Bung 100% bảng lịch
function injectLayoutStyles() {
  if (document.getElementById("iuh-schedule-layout-style")) return;
  const style = document.createElement("style");
  style.id = "iuh-schedule-layout-style";
  style.textContent = `
    /* XÓA KHỐI MÃ QR ONEUNI THỪA */
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

    /* NÚT ICON NẰM SÁT MÉP TRÁI MÀN HÌNH */
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

    /* THU GỌN SIDEBAR THÀNH DRAWER NẰM ẨN BÊN TRÁI */
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
      background: #ffffff !important;
      border: 1px solid #cbd5e1 !important;
      border-left: none !important;
      border-radius: 0 16px 16px 0 !important;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.18) !important;
      transform: translateX(-100%) !important;
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
      padding: 14px 8px !important;
    }

    /* KHI HOVER VÀO ICON HOẶC SIDEBAR -> "NẨY" MENU RA MƯỢT MÀ */
    body:has(#iuh-sidebar-tab:hover) div.col-md-2.d-none.d-sm-block,
    body:has(#iuh-sidebar-tab:hover) div.col-md-2:has(.sidebar-menu),
    body:has(#iuh-sidebar-tab:hover) div.col-md-2:has(ul),
    div.col-md-2.d-none.d-sm-block:hover,
    div.col-md-2:has(.sidebar-menu):hover,
    div.col-md-2:has(ul):hover,
    div.col-md-2.iuh-open {
      transform: translateX(0) !important;
    }

    /* BẢNG THỜI KHÓA BIỂU VÀ CONTAINER CHIẾM TRỌN 100% DIỆN TÍCH */
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

    /* BẢNG THỜI KHÓA BIỂU: CHIA ĐỀU TẤT CẢ CÁC CỘT CHUẨN XÁC 100% */
    .table-responsive,
    .table-responsive table,
    table.fl-table,
    table[id*="Lich"] {
      table-layout: fixed !important;
      width: 100% !important;
      max-width: 100% !important;
    }

    /* Cột đầu tiên: Ca học (Sáng / Chiều / Tối) - thu gọn vừa vặn */
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

    /* Nếu bảng có thẻ colgroup / col */
    .table-responsive table col:first-child,
    table.fl-table col:first-child,
    table[id*="Lich"] col:first-child {
      width: 75px !important;
    }
    .table-responsive table col:not(:first-child),
    table.fl-table col:not(:first-child),
    table[id*="Lich"] col:not(:first-child) {
      width: calc((100% - 75px) / 7) !important;
    }

    /* IN ĐẬM THỜI GIAN TRONG TIẾT VÀ TÊN GIẢNG VIÊN (ÁP DỤNG CHO TẤT CẢ) */
    .iuh-time-bold,
    b.iuh-time-bold,
    .iuh-gv-bold,
    b.iuh-gv-bold,
    font.iuh-gv-bold,
    .content span[lang="lichtheotuan-giangvien"] ~ font,
    .content span[lang="lichtheotuan-giangvien"] + font {
      font-weight: 700 !important;
    }

    /* ========================================================
       DARK MODE CHO HEADER
       ======================================================== */
    header,
    header.header,
    .header,
    .main-header,
    .top-header,
    .wapper-login .header,
    header[style*="background"],
    .header[style*="background"] {
      background: #0f172a !important;
      background-color: #0f172a !important;
      border-bottom: 1px solid #1e293b !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25) !important;
      color: #f8fafc !important;
    }

    /* Các khối chứa bên trong header trong suốt */
    header .container,
    header .container-fluid,
    header div:not([class*="dropdown-menu"]):not([class*="input"]) {
      background: transparent !important;
      background-color: transparent !important;
    }

    /* Logo trường trên nền tối */
    header img[src*="logo"],
    header img[src*="Logo"] {
      filter: brightness(0) invert(1) !important;
    }

    /* Ô tìm kiếm trong Header */
    header input[type="text"],
    header input[type="search"],
    header input.form-control,
    .header input {
      background-color: #1e293b !important;
      border: 1px solid #334155 !important;
      border-radius: 20px !important;
      color: #f8fafc !important;
      padding: 6px 16px !important;
    }
    header input::placeholder,
    .header input::placeholder {
      color: #94a3b8 !important;
    }
    header input:focus,
    .header input:focus {
      border-color: #38bdf8 !important;
      outline: none !important;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2) !important;
    }
    header .fa-search,
    header i.fa-search {
      color: #94a3b8 !important;
    }

    /* Liên kết & chữ trong Header */
    header a,
    .header a,
    header span:not(.badge),
    .header span:not(.badge),
    header .user-name {
      color: #e2e8f0 !important;
    }
    header a:hover,
    .header a:hover {
      color: #38bdf8 !important;
    }
    header i:not(.fa-search),
    .header i:not(.fa-search) {
      color: #38bdf8 !important;
    }

    /* Avatar người dùng */
    header img:not([src*="logo"]):not([src*="Logo"]) {
      border-radius: 50% !important;
      border: 1.5px solid #38bdf8 !important;
    }

    /* Dropdown menu người dùng */
    header .dropdown-menu,
    .header .dropdown-menu {
      background-color: #0f172a !important;
      border: 1px solid #334155 !important;
      border-radius: 10px !important;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5) !important;
    }
    header .dropdown-menu a,
    header .dropdown-menu li > a {
      color: #cbd5e1 !important;
    }
    header .dropdown-menu a:hover,
    header .dropdown-menu li > a:hover {
      background-color: #1e293b !important;
      color: #38bdf8 !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

// 2. Gắn nút Icon tab độc lập sát mép trái
function setupSidebarCollapse() {
  const sidebar = (
    document.querySelector("div.col-md-2.d-none.d-sm-block") ||
    document.querySelector("div.col-md-2") ||
    Array.from(document.querySelectorAll("div[class*='col-md-2']")).find(
      (el) => el.textContent.includes("TRANG CHỦ") && el.textContent.includes("HỌC TẬP")
    )
  );

  if (!sidebar) return;

  // Xóa khối QR OneUni nếu còn tồn tại
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

    // Sự kiện mở khi hover hoặc click
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

// 3. Đổi "Tiết: X - Y" thành giờ cụ thể và IN ĐẬM thời gian học
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
    bTime.style.setProperty("font-weight", "bold", "important");
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

// 4. In đậm tên Giảng viên (áp dụng cho tất cả các môn)
function boldTeacherName(root) {
  // Cách 1: Tìm qua thẻ span lichtheotuan-giangvien
  const gvSpans = root.querySelectorAll('span[lang="lichtheotuan-giangvien"]');
  gvSpans.forEach((sp) => {
    let cur = sp.nextSibling;
    while (cur) {
      if (cur.nodeType === Node.ELEMENT_NODE) {
        if (cur.tagName === "FONT" || cur.tagName === "SPAN") {
          cur.classList.add("iuh-gv-bold");
          cur.style.setProperty("font-weight", "bold", "important");
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
          bGv.style.setProperty("font-weight", "bold", "important");
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

  // Cách 2: Quét tất cả thẻ chứa text "GV:" trong các card lịch
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
          bGv.style.setProperty("font-weight", "bold", "important");
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

// 5. Sửa lỗi hiển thị "Tr?c tuy?n" thành "Trực tuyến"
function fixBrokenText(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (n.nodeValue && n.nodeValue.includes("Tr?c tuy?n")) {
      n.nodeValue = n.nodeValue.replace(/Tr\?c tuy\?n/g, "Trực tuyến");
    }
  }
}

// 6. Chia đều khoảng cách các cột thời khóa biểu chuẩn xác 100%
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

function main() {
  injectLayoutStyles();
  setupSidebarCollapse();
  equalizeColumns();
  thayThe(document);
  boldTeacherName(document);
  fixBrokenText(document);

  const obs = new MutationObserver(() => {
    setupSidebarCollapse();
    equalizeColumns();
    thayThe(document);
    boldTeacherName(document);
    fixBrokenText(document);
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
