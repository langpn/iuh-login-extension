// =====================================================================
// IUH Fast Login — Content Script Thời khóa biểu (sv.iuh.edu.vn)
// ---------------------------------------------------------------------
// 1. Đổi "Tiết: X - Y" thành giờ cụ thể (ví dụ Tiết 7-9 -> 12:30 - 15:00).
// 2. Remake giao diện thời khóa biểu: Font chữ Inter cao cấp, thẻ môn học
//    hiện đại, bo góc 10px, hiệu ứng nổi bật khi di chuột.
// 3. Tự động highlight nổi bật cột "Hôm nay" để sinh viên nhận biết ngay.
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

function injectModernScheduleTheme() {
  if (document.getElementById("iuh-schedule-modern-theme")) return;
  const style = document.createElement("style");
  style.id = "iuh-schedule-modern-theme";
  style.textContent = `
    * {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }
    /* Khung bảng thời khóa biểu hiện đại */
    table.fl-table, table[id*="Lich"], .table-responsive table {
      border-collapse: separate !important;
      border-spacing: 5px !important;
      border: none !important;
    }
    /* Tiêu đề các thứ */
    thead th, thead tr th {
      background: #f8fafc !important;
      color: #0369a1 !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      padding: 10px 4px !important;
      font-weight: 700 !important;
      font-size: 13px !important;
      text-align: center !important;
    }
    /* Hàng buổi Sáng, Chiều, Tối */
    tbody tr td:first-child, tbody th {
      border-radius: 8px !important;
      font-weight: 800 !important;
      font-size: 13.5px !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      text-align: center !important;
      padding: 12px 6px !important;
      border: none !important;
    }
    /* Các ô thẻ môn học */
    .content {
      border-radius: 10px !important;
      padding: 10px 12px !important;
      margin: 4px 2px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
      line-height: 1.4 !important;
    }
    .content:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.14) !important;
    }
    .content b {
      font-size: 13.5px !important;
      font-weight: 800 !important;
      display: block !important;
      margin-bottom: 4px !important;
    }
    .content p {
      font-size: 11px !important;
      opacity: 0.85 !important;
      margin-bottom: 4px !important;
    }
    /* Nút bấm thanh công cụ lịch */
    .btn-group .btn, #btnHienTai, #btnInLich, .btn-primary {
      border-radius: 8px !important;
      font-weight: 600 !important;
      font-size: 12.5px !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08) !important;
      transition: all 0.2s ease !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

function highlightToday(root) {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, "0");
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const y = today.getFullYear();
  const dateStr = `${d}/${m}/${y}`;
  const ths = root.querySelectorAll("thead th");
  ths.forEach((th) => {
    if (th.textContent.includes(dateStr)) {
      th.style.cssText =
        "background: #e0f2fe !important; border: 2px solid #0284c7 !important; " +
        "color: #0284c7 !important; font-weight: 800 !important; border-radius: 8px !important;";
    }
  });
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
  injectModernScheduleTheme();
  thayThe(document);
  highlightToday(document);

  const obs = new MutationObserver(() => {
    thayThe(document);
    highlightToday(document);
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
