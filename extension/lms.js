// =====================================================================
// IUH Fast Login — content script cho LMS (Moodle)
// ---------------------------------------------------------------------
// Chạy trên https://lms.iuh.edu.vn/login/index.php
//
// Khác với sv.iuh.edu.vn:
//   - LMS là Moodle, KHÔNG có captcha, KHÔNG mã hoá mật khẩu.
//   - Chỉ cần điền username/password rồi bấm nút Đăng nhập.
// =====================================================================

(() => {
  "use strict";

  const api = globalThis.browser ?? globalThis.chrome;
  if (!api || !api.storage) return;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (sel) => document.querySelector(sel);

  function getStorage(defaults) {
    return new Promise((resolve) => {
      try {
        const maybe = api.storage.local.get(defaults);
        if (maybe && typeof maybe.then === "function") {
          maybe.then((v) => resolve(v || defaults), () => resolve(defaults));
        } else {
          api.storage.local.get(defaults, (v) => resolve(v || defaults));
        }
      } catch (e) {
        resolve(defaults);
      }
    });
  }

  function banner(text, color) {
    let el = document.getElementById("iuh-fl-banner");
    if (!el) {
      el = document.createElement("div");
      el.id = "iuh-fl-banner";
      el.style.cssText = [
        "position:fixed", "z-index:2147483647", "top:12px", "left:50%",
        "transform:translateX(-50%)", "padding:8px 14px", "border-radius:6px",
        "font:13px/1.4 system-ui,sans-serif", "color:#fff",
        "box-shadow:0 2px 10px rgba(0,0,0,.25)", "max-width:90vw",
        "text-align:center", "pointer-events:none",
      ].join(";");
      (document.body || document.documentElement).appendChild(el);
    }
    el.style.background = color || "#333";
    el.textContent = text;
    return el;
  }

  function setValue(el, value) {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype, "value"
    )?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Bắt form LMS ngay khi DOM node xuất hiện
  function waitForForm(timeoutMs = 5000) {
    return new Promise((resolve) => {
      const check = () => {
        const u = $("#username") || $("input[name=username]");
        const p = $("#password") || $("input[name=password]");
        if (u && p) return { userEl: u, passEl: p };
        return null;
      };

      const found = check();
      if (found) return resolve(found);

      const observer = new MutationObserver(() => {
        const res = check();
        if (res) {
          observer.disconnect();
          resolve(res);
        }
      });

      if (document.documentElement) {
        observer.observe(document.documentElement, { childList: true, subtree: true });
      }

      setTimeout(() => {
        observer.disconnect();
        resolve(check());
      }, timeoutMs);
    });
  }

  async function main() {
    const path = location.pathname;

    // 1. Nếu đang ở trang dashboard chung (/my/ hoặc /my/index.php hoặc /) -> Chuyển thẳng vào trang Khóa học
    if (path === "/my/" || path === "/my/index.php" || path === "/") {
      location.replace("https://lms.iuh.edu.vn/my/courses.php");
      return;
    }

    // Nếu không phải trang đăng nhập -> bỏ qua
    if (!path.includes("/login/")) return;

    const [cfg, formEls] = await Promise.all([
      getStorage({ username: "", password: "", autoLogin: true }),
      waitForForm()
    ]);

    if (!cfg.username || !cfg.password) return;
    if (!cfg.autoLogin) return;
    if (!formEls || !formEls.userEl || !formEls.passEl) return;

    const { userEl, passEl } = formEls;

    banner("IUH LMS: đang tự động đăng nhập...", "#0b6e99");
    setValue(userEl, cfg.username);
    setValue(passEl, cfg.password);

    // Gắn wantsurl để Moodle sau khi login chuyển thẳng vào trang Khóa học
    const form = $("#login") || $("form");
    if (form) {
      let wants = form.querySelector("input[name=wantsurl]");
      if (!wants) {
        wants = document.createElement("input");
        wants.type = "hidden";
        wants.name = "wantsurl";
        form.appendChild(wants);
      }
      wants.value = "https://lms.iuh.edu.vn/my/courses.php";
    }

    await sleep(40);

    const btn = $("#loginbtn") ||
      $("form#login button[type=submit]") ||
      $("form#login input[type=submit]") ||
      $("button[type=submit]");

    if (form && typeof form.requestSubmit === "function") {
      try {
        form.requestSubmit(btn || undefined);
      } catch (_) {
        if (btn) btn.click();
        else form.submit();
      }
    } else if (btn) {
      btn.click();
    } else if (form) {
      form.submit();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main, { once: true });
  } else {
    main();
  }
})();
