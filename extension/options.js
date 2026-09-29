// Trang tuỳ chọn: nhập/lưu/xoá tài khoản.
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

$("save").addEventListener("click", () => {
  const username = $("username").value.trim();
  const password = $("password").value;
  const autoLogin = $("autoLogin").checked;
  if (!username || !password) {
    setMsg("Nhập đủ MSSV và mật khẩu đã.", "err");
    return;
  }
  api.storage.local.set({ username, password, autoLogin }, () => {
    setMsg("Đã lưu tài khoản.", "ok");
  });
});

$("clear").addEventListener("click", () => {
  api.storage.local.remove(["username", "password"], () => {
    $("username").value = "";
    $("password").value = "";
    setMsg("Đã xoá tài khoản đã lưu.", "ok");
  });
});

load();
