// ==UserScript==
// @name         IUH Auto Login (sv.iuh.edu.vn)
// @namespace    https://sv.iuh.edu.vn/
// @version      1.0.0
// @description  Tự động điền tài khoản và bấm đăng nhập trang sinh viên IUH
// @match        https://sv.iuh.edu.vn/sinh-vien-dang-nhap.html*
// @match        https://sv.iuh.edu.vn/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

/* ------------------------------------------------------------------
 * Cách dùng
 *   1. Cài Tampermonkey (Chrome/Edge/Firefox/Safari).
 *   2. Tạo script mới, dán toàn bộ file này, lưu lại.
 *   3. Mở https://sv.iuh.edu.vn/sinh-vien-dang-nhap.html
 *      - Lần đầu script sẽ hỏi MSSV + mật khẩu và tự đăng nhập.
 *      - Các lần sau tự đăng nhập luôn.
 *   4. Muốn đổi tài khoản: menu Tampermonkey > "IUH: xoá tài khoản đã lưu".
 *
 * Lưu ý
 *   - Mật khẩu được lưu bằng GM_setValue (kho của Tampermonkey, nằm trên
 *     máy bạn). Không dùng chung máy với người khác nếu không muốn bị đọc.
 *   - Nếu trang có captcha, script sẽ điền sẵn tài khoản/mật khẩu rồi
 *     dừng lại để bạn tự nhập mã captcha và bấm Đăng nhập.
 * ------------------------------------------------------------------ */

(function () {
  'use strict';

  const KEY_USER = 'iuh_user';
  const KEY_PASS = 'iuh_pass';

  // Chỉ chạy ở trang đăng nhập (trang này có form #form-login).
  function isLoginPage() {
    return !!document.querySelector('#form-login, #UserName, form[action*="dang-nhap"]');
  }

  if (!isLoginPage()) return;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Đặt giá trị vào input + phát sự kiện để framework trong trang nhận ra.
  function setInput(el, value) {
    if (!el) return;
    const proto = Object.getPrototypeOf(el);
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function getCreds() {
    const user = GM_getValue(KEY_USER, '');
    const pass = GM_getValue(KEY_PASS, '');
    return { user, pass };
  }

  function saveCreds(user, pass) {
    GM_setValue(KEY_USER, user);
    GM_setValue(KEY_PASS, pass);
  }

  function askCreds() {
    const user = window.prompt('MSSV / mã hồ sơ đăng nhập IUH:', '');
    if (!user) return null;
    const pass = window.prompt('Mật khẩu IUH:', '');
    if (!pass) return null;
    return { user: user.trim(), pass: pass.trim() };
  }

  function findLoginButton() {
    return (
      document.querySelector('#btnLogin') ||
      document.querySelector('input[type="submit"]') ||
      document.querySelector('button[type="submit"]')
    );
  }

  function captchaVisible() {
    const c = document.querySelector('#Captcha');
    if (!c) return false;
    const img = document.querySelector('#newcaptcha, .captchaContainer img, img[src*="GetCaptcha"]');
    return !!img && img.offsetParent !== null;
  }

  async function doLogin(creds, attempt) {
    attempt = attempt || 0;
    if (attempt > 20) return; // form chưa render xong, bỏ qua

    const userEl = document.querySelector('#UserName');
    const passEl = document.querySelector('#Password');
    if (!userEl || !passEl) {
      await sleep(300);
      return doLogin(creds, attempt + 1);
    }

    // Tránh điền đè nếu người dùng đang nhập tay.
    if (userEl.value && passEl.value) return;

    setInput(userEl, creds.user);
    setInput(passEl, creds.pass);

    // Không tự bấm nếu đang có captcha -> nhường cho người dùng nhập mã.
    if (captchaVisible()) {
      const cap = document.querySelector('#Captcha');
      if (cap) {
        cap.focus();
        console.info('[IUH] Có captcha, hãy nhập mã rồi bấm Đăng nhập.');
      }
      return;
    }

    await sleep(150);
    const btn = findLoginButton();
    if (btn) btn.click();
  }

  function clearSaved() {
    GM_setValue(KEY_USER, '');
    GM_setValue(KEY_PASS, '');
    alert('Đã xoá tài khoản IUH đã lưu.');
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('IUH: xoá tài khoản đã lưu', clearSaved);
    GM_registerMenuCommand('IUH: đăng nhập lại ngay', () => {
      const c = askCreds();
      if (c) {
        saveCreds(c.user, c.pass);
        doLogin(c);
      }
    });
  }

  async function main() {
    let creds = getCreds();
    if (!creds.user || !creds.pass) {
      creds = askCreds();
      if (!creds) return;
      saveCreds(creds.user, creds.pass);
    }
    await doLogin(creds);
  }

  main();
})();
