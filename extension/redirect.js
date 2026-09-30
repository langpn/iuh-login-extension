// =====================================================================
// IUH Fast Login — quay lại trang lịch sau khi đăng nhập
// ---------------------------------------------------------------------
// Chạy trên mọi trang https://sv.iuh.edu.vn/*
//
// Vì sao cần: trang `lich-theo-tuan.html` khi chưa có phiên sẽ chuyển
// hướng về trang đăng nhập và KHÔNG giữ ReturnUrl. Sau khi `content.js`
// tự đăng nhập, trình duyệt dừng ở `dashboard.html` — không phải lịch.
//
// Cách xử lý: nút "Lịch học" đặt cờ `pendingSchedule` (kèm mốc thời gian)
// trước khi mở trang lịch. Script này đọc cờ:
//   • đang ở trang lịch  → xoá cờ (đã tới đích).
//   • đang ở trang login → không làm gì, để content.js đăng nhập trước.
//   • ở trang khác       → chuyển tiếp tới trang lịch, xoá cờ.
//
// Khi không có cờ, script không làm gì nên đăng nhập thông thường không
// bị ảnh hưởng. Cờ tự hết hạn sau 5 phút để tránh "dính" ngoài ý muốn.
// =====================================================================

(() => {
  "use strict";

  const api = globalThis.browser ?? globalThis.chrome;
  if (!api || !api.storage) return;

  const KEY = "pendingSchedule";
  const SCHEDULE_URL = "https://sv.iuh.edu.vn/lich-theo-tuan.html";
  const TTL_MS = 5 * 60 * 1000;

  function getFlag() {
    return new Promise((resolve) => {
      try {
        const maybe = api.storage.local.get(KEY);
        if (maybe && typeof maybe.then === "function") {
          maybe.then((v) => resolve(v && v[KEY]), () => resolve(null));
        } else {
          api.storage.local.get(KEY, (v) => resolve(v && v[KEY]));
        }
      } catch (e) {
        resolve(null);
      }
    });
  }

  function clearFlag() {
    try {
      const maybe = api.storage.local.remove(KEY);
      if (maybe && typeof maybe.catch === "function") maybe.catch(() => {});
    } catch (e) {}
  }

  async function main() {
    const setAt = await getFlag();
    if (!setAt) return;

    // Cờ cũ (quá 5 phút) coi như bỏ.
    if (typeof setAt === "number" && Date.now() - setAt > TTL_MS) {
      clearFlag();
      return;
    }

    const path = location.pathname;

    // Đã tới đích.
    if (path.indexOf("lich-theo-tuan") !== -1) {
      clearFlag();
      return;
    }

    // Còn ở trang đăng nhập → để content.js đăng nhập trước.
    if (path.indexOf("dang-nhap") !== -1) return;

    // Đã đăng nhập và đang ở trang khác (vd. dashboard.html) → tới lịch.
    clearFlag();
    location.replace(SCHEDULE_URL);
  }

  main();
})();
