// Service worker (MV3) — chỉ để đặt giá trị mặc định cho lần cài đầu.
// Không chứa logic đăng nhập; việc đăng nhập do content.js đảm nhiệm.
const api = globalThis.browser ?? globalThis.chrome;

api.runtime.onInstalled.addListener(() => {
  api.storage.local.get({ autoLogin: null }, (v) => {
    if (v.autoLogin === null) {
      api.storage.local.set({ autoLogin: true });
    }
  });
});
