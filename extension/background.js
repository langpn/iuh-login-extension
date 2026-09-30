// =====================================================================
// IUH Fast Login — Background Service Worker (Manifest V3)
// 1. Quản lý cài đặt mặc định.
// 2. Giữ sống phiên đăng nhập (Session Keepalive) định kỳ 10 phút/lần.
// 3. Tái sử dụng cookie phiên (ASC.AUTH & .ASPXFORMSAUTH).
// =====================================================================

const api = globalThis.browser ?? globalThis.chrome;

// Thiết lập ban đầu
api.runtime.onInstalled.addListener(() => {
  api.storage.local.get({ autoLogin: null, keepalive: null }, (v) => {
    const toSet = {};
    if (v.autoLogin === null) toSet.autoLogin = true;
    if (v.keepalive === null) toSet.keepalive = true;
    if (Object.keys(toSet).length) api.storage.local.set(toSet);
  });

  // Tạo alarm định kỳ 10 phút để giữ session sống
  setupKeepaliveAlarm();
});

api.runtime.onStartup.addListener(() => {
  setupKeepaliveAlarm();
});

function setupKeepaliveAlarm() {
  if (!api.alarms) return;
  api.alarms.create("iuh_session_keepalive", {
    periodInMinutes: 10,
    delayInMinutes: 2
  });
}

// Xử lý báo thức Keepalive: Ping nhẹ cổng trường để không bị timeout
if (api.alarms) {
  api.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== "iuh_session_keepalive") return;

    const cfg = await new Promise((res) => {
      api.storage.local.get({ keepalive: true }, res);
    });
    if (!cfg.keepalive) return;

    // 1. Kiểm tra và ping Cổng sinh viên
    try {
      if (api.cookies) {
        const svCookie = await api.cookies.get({
          url: "https://sv.iuh.edu.vn",
          name: "ASC.AUTH"
        });
        if (svCookie && svCookie.value) {
          // Gửi request ping nhẹ giữ phiên
          await fetch("https://sv.iuh.edu.vn/dashboard.html", {
            method: "GET",
            credentials: "include"
          });
          api.storage.local.set({ sv_active: true, sv_last_ping: Date.now() });
        }
      }
    } catch (_) {}

    // 2. Kiểm tra và ping Cổng ĐKHP
    try {
      if (api.cookies) {
        const dkhpCookie = await api.cookies.get({
          url: "https://dkhp.iuh.edu.vn",
          name: ".ASPXFORMSAUTH"
        });
        if (dkhpCookie && dkhpCookie.value) {
          await fetch("https://dkhp.iuh.edu.vn/DangKyHocPhan/ThongTinPortal", {
            method: "GET",
            credentials: "include"
          });
          api.storage.local.set({ dkhp_active: true, dkhp_last_ping: Date.now() });
        }
      }
    } catch (_) {}
  });
}

// Lắng nghe thông điệp từ popup hoặc content scripts
api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "check_session") {
    (async () => {
      let hasSv = false;
      let hasDkhp = false;
      if (api.cookies) {
        try {
          const sv = await api.cookies.get({ url: "https://sv.iuh.edu.vn", name: "ASC.AUTH" });
          hasSv = Boolean(sv && sv.value);
        } catch (_) {}
        try {
          const dk = await api.cookies.get({ url: "https://dkhp.iuh.edu.vn", name: ".ASPXFORMSAUTH" });
          hasDkhp = Boolean(dk && dk.value);
        } catch (_) {}
      }
      sendResponse({ hasSv, hasDkhp });
    })();
    return true; // async
  }
});
