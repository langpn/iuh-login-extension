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
