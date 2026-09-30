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
      $("username").value = cfg.username || "";
      $("password").value = cfg.password || "";
      $("autoLogin").checked = cfg.autoLogin !== false;
      $("dkhpAutoSubmit").checked = Boolean(cfg.dkhpAutoSubmit);
    }
  );
}

function save() {
  const username = $("username").value.trim();
  const password = $("password").value;
  const autoLogin = $("autoLogin").checked;
  const dkhpAutoSubmit = $("dkhpAutoSubmit").checked;
  if (!username) {
    setMsg("Vui lòng nhập MSSV.", "err");
    return;
  }
  api.storage.local.set({ username, password, autoLogin, dkhpAutoSubmit }, () => {
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
  api.tabs.create({ url: "https://lms.iuh.edu.vn/login/index.php" });
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
