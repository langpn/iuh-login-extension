// Popup: nhập/lưu tài khoản và mở nhanh trang đăng nhập.
const api = globalThis.browser ?? globalThis.chrome;

const $ = (id) => document.getElementById(id);
const msg = $("msg");

function setMsg(text, cls) {
  msg.textContent = text;
  msg.className = cls || "";
}

function load() {
  api.storage.local.get(
    { username: "", password: "", autoLogin: true },
    (cfg) => {
      $("username").value = cfg.username || "";
      $("password").value = cfg.password || "";
      $("autoLogin").checked = cfg.autoLogin !== false;
    }
  );
}

function save() {
  const username = $("username").value.trim();
  const password = $("password").value;
  const autoLogin = $("autoLogin").checked;

  if (!username || !password) {
    setMsg("Nhập đủ MSSV và mật khẩu đã.", "err");
    return;
  }
  api.storage.local.set({ username, password, autoLogin }, () => {
    setMsg("Đã lưu. Mở trang login để tự đăng nhập.", "ok");
  });
}

$("save").addEventListener("click", save);
$("open").addEventListener("click", () => {
  api.tabs.create({ url: "https://sv.iuh.edu.vn/sinh-vien-dang-nhap.html" });
});
$("password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") save();
});

load();
