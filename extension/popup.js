// Popup: nhập/lưu tài khoản, mở nhanh và quản lý phiên.
const api = globalThis.browser ?? globalThis.chrome;

const $ = (id) => document.getElementById(id);
const msg = $("msg");

function setMsg(text, cls) {
  msg.textContent = text;
  msg.className = cls || "";
}

function load() {
  api.storage.local.get(
    { username: "", password: "", autoLogin: true, dkhpAutoSubmit: false },
    (cfg) => {
      const u = $("username");
      const p = $("password");
      const a = $("autoLogin");
      const d = $("dkhpAutoSubmit");
      if (u) u.value = cfg.username || "";
      if (p) p.value = cfg.password || "";
      if (a) a.checked = cfg.autoLogin !== false;
      if (d) d.checked = Boolean(cfg.dkhpAutoSubmit);
    }
  );
  updateSessionStatus();
  checkForUpdates();
}

function updateSessionStatus() {
  if (!api.runtime || !api.runtime.sendMessage) return;
  try {
    api.runtime.sendMessage({ action: "check_session" }, (res) => {
      if (api.runtime.lastError || !res) return;
      const sv = $("statusSv");
      const dk = $("statusDkhp");
      if (sv) {
        sv.className = "pill" + (res.hasSv ? " active" : "");
        sv.title = res.hasSv ? "Phiên Cổng SV: Đang hoạt động" : "Phiên Cổng SV: Chưa đăng nhập";
      }
      if (dk) {
        dk.className = "pill" + (res.hasDkhp ? " active" : "");
        dk.title = res.hasDkhp ? "Phiên ĐKHP: Đang hoạt động" : "Phiên ĐKHP: Chưa đăng nhập";
      }
    });
  } catch (_) {}
}

function checkForUpdates() {
  try {
    const manifest = api.runtime.getManifest ? api.runtime.getManifest() : null;
    const curVer = manifest ? manifest.version : "1.0.0";
    api.storage.local.get({ lastUpdateCheck: 0, latestVer: "" }, (cache) => {
      const now = Date.now();
      if (cache.latestVer && cache.latestVer > curVer) {
        showUpdateBanner(cache.latestVer);
      }
      if (now - cache.lastUpdateCheck < 2 * 3600 * 1000) return;
      fetch("https://api.github.com/repos/langpn/iuh-login-extension/releases/latest")
        .then((r) => r.json())
        .then((data) => {
          const tag = data && data.tag_name ? data.tag_name.replace(/^v/, "") : "";
          if (tag) {
            api.storage.local.set({ lastUpdateCheck: now, latestVer: tag });
            if (tag > curVer) showUpdateBanner(tag);
          }
        })
        .catch(() => {});
    });
  } catch (_) {}
}

function showUpdateBanner(ver) {
  const banner = $("updateBanner");
  if (banner) {
    banner.style.display = "block";
    const link = $("updateLink");
    if (link) link.textContent = `Tải v${ver} ➔`;
  }
}

const shareBtn = $("shareBtn");
if (shareBtn) {
  shareBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const text =
      "⚡ Hướng dẫn cài đặt IUH Fast Login (Tự động đăng nhập, Dark Mode, TKB tràn viền):\n" +
      "1. Tải bản nén tiện ích: https://github.com/langpn/iuh-login-extension/releases/latest/download/iuh-fast-login-latest.zip\n" +
      "2. Mở chrome://extensions (hoặc edge://extensions) bật Developer Mode -> Bấm Load Unpacked chọn thư mục vừa giải nén\n" +
      "3. Nhập MSSV & Mật khẩu trên icon tiện ích để tự động hóa hoàn toàn!";
    navigator.clipboard.writeText(text).then(() => {
      setMsg("Đã sao chép hướng dẫn!", "ok");
      setTimeout(() => setMsg(""), 2500);
    });
  });
}

function save() {
  const u = $("username");
  const p = $("password");
  const a = $("autoLogin");
  const d = $("dkhpAutoSubmit");
  const username = u ? u.value.trim() : "";
  const password = p ? p.value : "";
  const autoLogin = a ? a.checked : true;
  if (!username) {
    setMsg("Vui lòng nhập MSSV.", "err");
    return;
  }
  const data = { username, password, autoLogin };
  if (d) data.dkhpAutoSubmit = d.checked;
  api.storage.local.set(data, () => {
    setMsg("Đã lưu thông tin.", "ok");
    setTimeout(() => setMsg(""), 2000);
  });
}

$("save").addEventListener("click", save);

$("open").addEventListener("click", async () => {
  let target = "https://sv.iuh.edu.vn/sinh-vien-dang-nhap.html";
  if (api.cookies) {
    try {
      const c = await api.cookies.get({ url: "https://sv.iuh.edu.vn", name: "ASC.AUTH" });
      if (c && c.value) target = "https://sv.iuh.edu.vn/dashboard.html";
    } catch (_) {}
  }
  api.tabs.create({ url: target });
});

$("openLms").addEventListener("click", () => {
  api.tabs.create({ url: "https://lms.iuh.edu.vn/my/courses.php" });
});

$("openDkhp").addEventListener("click", async () => {
  let target = "https://dkhp.iuh.edu.vn/Account/Login";
  if (api.cookies) {
    try {
      const c = await api.cookies.get({ url: "https://dkhp.iuh.edu.vn", name: ".ASPXFORMSAUTH" });
      if (c && c.value) target = "https://dkhp.iuh.edu.vn/DangKyHocPhan/ThongTinPortal";
    } catch (_) {}
  }
  api.tabs.create({ url: target });
});

$("openSchedule").addEventListener("click", () => {
  api.storage.local.set({ pendingSchedule: Date.now() }, () => {
    api.tabs.create({ url: "https://sv.iuh.edu.vn/lich-theo-tuan.html" });
  });
});

$("password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") save();
});

load();
