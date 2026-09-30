#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
iuh_browser.py — Đăng nhập IUH tự động bằng trình duyệt thật (Playwright).

Cơ chế: trang login có <img src=".../GetCaptcha">. Server chỉ bắt buộc
captcha nếu session đã tải ảnh captcha. Tool CHẶN request ảnh đó ngay ở
tầng network (context.route) nên server bỏ qua kiểm tra captcha
-> đăng nhập tự động 100%, không cần OCR.

Nguyên tắc chờ đợi: KHÔNG dùng sleep cố định. Mọi điểm dừng đều là
event/wait của Playwright (wait_for_selector, wait_for_load_state,
wait_for_function, wait_for_event) nên vừa nhanh khi mạng tốt, vừa đủ
kiên nhẫn khi server chậm. Chỗ duy nhất còn "chờ theo đồng hồ" là backoff
khi server giới hạn tần suất đăng nhập — bản chất là một khoảng lặng phía
server, và vẫn được thực hiện bằng page.wait_for_timeout.

Yêu cầu:
    pip install playwright
    playwright install chromium        (hoặc dùng Chrome có sẵn: --channel chrome)

Ví dụ:
    python3 iuh_browser.py 25765251 'matkhau'
    python3 iuh_browser.py --lms 25765251 'matkhau' --headless
    python3 iuh_browser.py 25765251 'matkhau' --keep-open
    python3 iuh_browser.py 25765251 'matkhau' --save-cookies cookies.txt
    python3 iuh_browser.py 25765251 'matkhau' --user-data-dir .pw-profile
"""
import argparse
import json
import os
import select
import sys
import time

try:
    from playwright.sync_api import TimeoutError as PWTimeout
    from playwright.sync_api import sync_playwright
except ImportError:  # pragma: no cover - phụ thuộc môi trường
    sys.exit("Thiếu playwright. Cài: pip install playwright && playwright install chromium")

BASE = "https://sv.iuh.edu.vn"
LOGIN_URL = BASE + "/sinh-vien-dang-nhap.html"
DASHBOARD = BASE + "/dashboard.html"
SCHEDULE_URL = BASE + "/lich-theo-tuan.html"
CONFIRM_PATH = "/SinhVien/ConfirmPortalSession"
LMS_BASE = "https://lms.iuh.edu.vn"
LMS_LOGIN_URL = LMS_BASE + "/login/index.php"

DEFAULT_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

# Chọn nút submit của từng cổng (thử lần lượt, cái nào hiện thì bấm).
PORTAL_BUTTONS = (
    "#btnLogin",
    "form#form-login button[type=submit]",
    "form#form-login input[type=submit]",
    "button[type=submit]",
    "input[type=submit]",
)
LMS_BUTTONS = ("#loginbtn", "form#login button[type=submit]", "button[type=submit]")

# Trạng thái trang login cổng SV, đọc bằng 1 hàm JS chạy trong page.
# Trả về chuỗi rỗng khi "chưa có gì mới" (còn đang xử lý).
PORTAL_STATE_JS = r"""() => {
    const href = location.href;
    if (href.indexOf('/dashboard') !== -1) return 'ok';
    if (href.indexOf('sinh-vien-dang-nhap') === -1) return 'ok';
    try { if (window.initialPendingKey) return 'other-device'; } catch (e) {}
    const text = (document.body && document.body.innerText) || '';
    if (text.indexOf('Thông tin đăng nhập không đúng') !== -1) return 'bad-credentials';
    if (text.indexOf('Vui lòng nhập đầy đủ thông tin') !== -1) return 'captcha';
    if (text.indexOf('đang đăng nhập') !== -1) return 'other-device';
    return '';
}"""

# Trạng thái trang login Moodle: rời khỏi /login/index.php là thành công.
LMS_STATE_JS = r"""() => {
    if (location.href.indexOf('/login/index.php') === -1) return 'ok';
    const errs = document.querySelectorAll('.loginerrors, #loginerrormessage, .alert-danger');
    for (const e of errs) {
        if (e.offsetWidth || e.offsetHeight || e.getClientRects().length) {
            return 'bad-credentials';
        }
    }
    return '';
}"""


# ===========================================================================
# Tiện ích chung
# ===========================================================================
def _log(debug, *parts):
    if debug:
        print(*parts)


def _netscape_cookies(cookies, path):
    """Lưu cookie dạng Netscape để dùng với curl --cookie / wget."""
    lines = ["# Netscape HTTP Cookie File", ""]
    for c in cookies:
        domain = c.get("domain") or ""
        lines.append("\t".join([
            domain,
            "TRUE" if domain.startswith(".") else "FALSE",
            c.get("path") or "/",
            "TRUE" if c.get("secure") else "FALSE",
            str(int(c.get("expires") or 0)),
            c["name"], c.get("value") or "",
        ]))
    parent = os.path.dirname(os.path.abspath(path))
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass


def _launch_chromium(p, channel, **kwargs):
    """Mở Chromium, ưu tiên kênh cài sẵn (chrome/msedge), fallback chromium."""
    if channel:
        try:
            return p.chromium.launch(channel=channel, **kwargs)
        except Exception as e:
            print("[!] Không mở được kênh '%s' (%s) → dùng chromium của Playwright."
                  % (channel, str(e).splitlines()[0]))
    return p.chromium.launch(**kwargs)


def open_context(p, *, headless=False, channel="chrome", user_data_dir=None,
                 storage_state=None, slow_mo=0, debug=False):
    """Tạo BrowserContext. Trả về (context, browser).

    browser là None khi dùng persistent context (user_data_dir) — lúc đó
    chính context đóng/mở trình duyệt.
    """
    common = {"headless": headless}
    if slow_mo:
        common["slow_mo"] = slow_mo

    if user_data_dir:
        os.makedirs(user_data_dir, exist_ok=True)
        for ch in ([channel] if channel else []) + [None]:
            try:
                ctx = p.chromium.launch_persistent_context(
                    user_data_dir, locale="vi-VN", user_agent=DEFAULT_UA,
                    channel=ch, **common)
                _log(debug, "[debug] persistent context: %s" % user_data_dir)
                return ctx, None
            except Exception as e:
                _log(debug, "[debug] persistent channel=%s lỗi: %s" % (ch, e))
        raise RuntimeError("Không mở được persistent context tại %s" % user_data_dir)

    browser = _launch_chromium(p, channel, **common)
    kw = {"locale": "vi-VN", "user_agent": DEFAULT_UA}
    if storage_state and os.path.exists(storage_state):
        kw["storage_state"] = storage_state
        _log(debug, "[debug] nạp storage state:", storage_state)
    return browser.new_context(**kw), browser


def block_captcha(ctx, blocked):
    """Chặn mọi request ảnh captcha của cổng SV (mấu chốt để bỏ qua captcha)."""
    def handler(route):
        if "GetCaptcha" in route.request.url:
            blocked.append(route.request.url)
            route.abort()
        else:
            route.continue_()

    ctx.route("**/GetCaptcha*", handler)


def goto(page, url, timeout_ms, debug=False):
    """Mở URL rồi chờ tới khi trang load xong (event load, không sleep)."""
    page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
    try:
        page.wait_for_load_state("load", timeout=timeout_ms)
    except PWTimeout:
        _log(debug, "[debug] trang chưa 'load' hết trong %dms, tiếp tục." % timeout_ms)


def wait_state(page, js, timeout_ms, poll_ms=250, debug=False):
    """Chờ tới khi `js` trả về chuỗi khác rỗng. Hết thời gian → trả ''.

    Dùng wait_for_function của Playwright (poll theo nhịp) thay vì sleep cứng;
    bọc lại để chịu được việc page điều hướng giữa chừng (execution context
    bị huỷ) mà không làm hỏng luồng.
    """
    deadline = time.monotonic() + timeout_ms / 1000.0
    while True:
        remaining = (deadline - time.monotonic()) * 1000
        if remaining <= 0:
            return ""
        try:
            handle = page.wait_for_function(js, timeout=remaining, polling=poll_ms)
            value = handle.json_value()
            if value:
                return value
        except PWTimeout:
            return ""
        except Exception as e:
            # Thường là "Execution context was destroyed" do navigation.
            _log(debug, "[debug] wait_state tạm lỗi:", str(e).splitlines()[0])
            if page.is_closed():
                return ""
            try:
                page.wait_for_timeout(100)
            except Exception:
                return ""


def submit(page, fallback_selector, buttons, debug=False):
    """Bấm nút submit đầu tiên đang hiện; không có thì nhấn Enter."""
    for sel in buttons:
        el = page.query_selector(sel)
        if el and el.is_visible():
            _log(debug, "[debug] bấm nút:", sel)
            try:
                el.click()
                return sel
            except Exception as e:
                _log(debug, "[debug] click %s lỗi: %s" % (sel, e))
    _log(debug, "[debug] không thấy nút submit → nhấn Enter tại", fallback_selector)
    page.press(fallback_selector, "Enter")
    return None


def wait_until_closed(page):
    """Giữ tiến trình tới khi người dùng đóng cửa sổ (event 'close') hoặc Enter."""
    print("Trình duyệt đang mở — đóng cửa sổ (hoặc nhấn Enter) để thoát...")
    try:
        if sys.stdin.isatty():
            while not page.is_closed():
                if select.select([sys.stdin], [], [], 0.5)[0]:
                    try:
                        sys.stdin.readline()
                    except Exception:
                        pass
                    break
        elif not page.is_closed():
            # Không có stdin tương tác → chờ đúng event đóng tab.
            page.wait_for_event("close", timeout=0)
    except Exception:
        pass


def save_state(ctx, *, save_cookies=None, storage_state=None, debug=False):
    """Lưu cookie (Netscape) và/hoặc storage state (JSON) sau khi login."""
    try:
        cookies = ctx.cookies()
    except Exception:
        cookies = []
    if save_cookies:
        _netscape_cookies(cookies, save_cookies)
        _log(debug, "[debug] đã lưu cookie:", save_cookies)
    if storage_state:
        try:
            ctx.storage_state(path=storage_state)
            try:
                os.chmod(storage_state, 0o600)
            except OSError:
                pass
            _log(debug, "[debug] đã lưu storage state:", storage_state)
        except Exception as e:
            print("[!] Không lưu được storage state: %s" % e)
    return cookies


def _finish(browser, ctx):
    try:
        if browser is not None:
            browser.close()
        else:
            ctx.close()
    except Exception:
        pass


# ===========================================================================
# Cổng sinh viên — sv.iuh.edu.vn
# ===========================================================================
def _confirm_portal_session(page, timeout_ms, debug=False):
    """Xử lý ca "tài khoản đang đăng nhập ở thiết bị khác" -> giành phiên."""
    try:
        key = page.evaluate("() => { try { return window.initialPendingKey || ''; } "
                            "catch (e) { return ''; } }")
    except Exception:
        key = ""
    if not key:
        return False
    _log(debug, "[debug] cần xác nhận phiên (pendingKey=%s...)" % str(key)[:12])

    try:
        result = page.evaluate(
            """async (pendingKey) => {
                const t = document.querySelector('input[name=__RequestVerificationToken]');
                const body = new URLSearchParams();
                body.set('__RequestVerificationToken', t ? t.value : '');
                body.set('pendingKey', pendingKey);
                const r = await fetch('/SinhVien/ConfirmPortalSession', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: body.toString(),
                });
                try { return await r.json(); } catch (e) { return {}; }
            }""",
            key,
        )
    except Exception as e:
        _log(debug, "[debug] confirm lỗi:", e)
        return False

    redirect = (result or {}).get("RedirectUrl") or ""
    if redirect:
        if redirect.startswith("/"):
            redirect = BASE + redirect
        elif not redirect.startswith("http"):
            redirect = BASE + "/" + redirect
        _log(debug, "[debug] đi tới", redirect)
        goto(page, redirect, timeout_ms, debug)
        return True

    # Server có thể đã cấp cookie ASC.AUTH dù không trả RedirectUrl.
    try:
        return any(c["name"] == "ASC.AUTH" for c in page.context.cookies())
    except Exception:
        return False


def login(user, password, headless=False, channel="chrome", debug=False,
          timeout=30.0, retries=3, retry_wait=8.0, save_cookies=None,
          keep_open=False, user_data_dir=None, storage_state=None, slow_mo=0,
          open_schedule=False):
    """Đăng nhập cổng sinh viên. Trả về (success: bool, info: dict)."""
    timeout_ms = int(timeout * 1000)
    blocked = []
    info = {"url": "", "title": "", "blocked_captcha": 0, "flash": "", "attempts": 0}
    ok = False

    with sync_playwright() as p:
        ctx, browser = open_context(
            p, headless=headless, channel=channel, user_data_dir=user_data_dir,
            storage_state=storage_state, slow_mo=slow_mo, debug=debug)
        try:
            block_captcha(ctx, blocked)
            page = ctx.new_page()
            page.set_default_timeout(timeout_ms)
            if debug:
                page.on("console", lambda m: print("[console]", m.text))
                page.on("requestfailed",
                        lambda r: print("[failed]", r.url,
                                        (r.failure or "") if hasattr(r, "failure") else ""))

            for attempt in range(1, retries + 1):
                info["attempts"] = attempt
                if attempt > 1 or "sinh-vien-dang-nhap" not in page.url:
                    goto(page, LOGIN_URL, timeout_ms, debug)

                # Chờ form sẵn sàng bằng selector (event), không sleep.
                page.wait_for_selector("#UserName", state="visible", timeout=timeout_ms)
                page.wait_for_selector("#Password", state="visible", timeout=timeout_ms)

                # Phòng khi trang chèn ảnh captcha bằng JS: gỡ luôn trong DOM.
                page.evaluate(
                    """() => document.querySelectorAll('img').forEach(img => {
                        if (img.src && img.src.includes('GetCaptcha')) {
                            img.removeAttribute('src');
                            img.style.display = 'none';
                        }
                    })"""
                )

                page.fill("#UserName", user)
                page.fill("#Password", password)
                cap = page.query_selector("#Captcha, input[name=Captcha]")
                if cap:
                    try:
                        cap.fill("")  # để trống — server đã bỏ qua captcha
                    except Exception:
                        pass

                _log(debug, "[debug] đã chặn %d request captcha" % len(blocked))
                submit(page, "#Password", PORTAL_BUTTONS, debug)

                state = wait_state(page, PORTAL_STATE_JS, timeout_ms, debug=debug)

                if state == "other-device":
                    if _confirm_portal_session(page, timeout_ms, debug):
                        state = "ok"
                    else:
                        state = ""

                if state == "ok":
                    ok = True
                    break
                if state in ("bad-credentials", "captcha"):
                    info["flash"] = {
                        "bad-credentials": "Thông tin đăng nhập không đúng",
                        "captcha": "Server yêu cầu captcha (ảnh captcha đã bị chặn)",
                    }[state]
                    break

                # state == "" → hết thời gian chờ mà chưa có tín hiệu:
                # gần như chắc chắn server đang giới hạn tần suất đăng nhập.
                info["flash"] = "Chưa có phản hồi (có thể bị giới hạn tần suất)"
                if attempt < retries:
                    print("  … chưa vào được, chờ %.0fs rồi thử lại (%d/%d)"
                          % (retry_wait, attempt, retries))
                    page.wait_for_timeout(int(retry_wait * 1000))

            if ok:
                try:
                    has_auth = any(c["name"] == "ASC.AUTH" for c in ctx.cookies())
                    ok = ("dashboard" in page.url) or has_auth
                except Exception:
                    ok = "dashboard" in page.url
                if not ok:
                    info["flash"] = "Không thấy cookie ASC.AUTH"

            if ok:
                info["flash"] = ""
            info["url"] = page.url
            info["title"] = page.title()
            info["blocked_captcha"] = len(blocked)
            info["cookies"] = [c["name"] for c in ctx.cookies()]

            if ok:
                save_state(ctx, save_cookies=save_cookies,
                           storage_state=storage_state, debug=debug)

            # Tính năng riêng: mở thẳng trang lịch theo tuần sau khi đăng nhập.
            # Chỉ chạy khi được yêu cầu tường minh (open_schedule=True),
            # không ảnh hưởng luồng đăng nhập thông thường.
            if ok and open_schedule:
                goto(page, SCHEDULE_URL, timeout_ms, debug)
                info["url"] = page.url
                info["title"] = page.title()
                info["schedule_opened"] = True

            if keep_open:
                wait_until_closed(page)
        finally:
            _finish(browser, ctx)

    return ok, info


# ===========================================================================
# LMS Moodle — lms.iuh.edu.vn
# ===========================================================================
def lms_login(user, password, headless=False, channel="chrome", debug=False,
              timeout=30.0, retries=3, retry_wait=8.0, save_cookies=None,
              keep_open=False, user_data_dir=None, storage_state=None, slow_mo=0):
    """Đăng nhập LMS Moodle. Trả về (success: bool, info: dict)."""
    timeout_ms = int(timeout * 1000)
    info = {"url": "", "title": "", "flash": "", "attempts": 0}
    ok = False

    with sync_playwright() as p:
        ctx, browser = open_context(
            p, headless=headless, channel=channel, user_data_dir=user_data_dir,
            storage_state=storage_state, slow_mo=slow_mo, debug=debug)
        try:
            page = ctx.new_page()
            page.set_default_timeout(timeout_ms)
            if debug:
                page.on("console", lambda m: print("[console]", m.text))

            for attempt in range(1, retries + 1):
                info["attempts"] = attempt
                if attempt > 1 or "/login/index.php" not in page.url:
                    goto(page, LMS_LOGIN_URL, timeout_ms, debug)

                page.wait_for_selector("#username", state="visible", timeout=timeout_ms)
                page.wait_for_selector("#password", state="visible", timeout=timeout_ms)

                page.fill("#username", user)
                page.fill("#password", password)
                submit(page, "#password", LMS_BUTTONS, debug)

                state = wait_state(page, LMS_STATE_JS, timeout_ms, debug=debug)

                if state == "ok":
                    ok = True
                    break
                if state == "bad-credentials":
                    info["flash"] = "Sai tài khoản hoặc mật khẩu (LMS)"
                    break

                info["flash"] = "Chưa có phản hồi từ LMS"
                if attempt < retries:
                    print("  … LMS chưa phản hồi, chờ %.0fs rồi thử lại (%d/%d)"
                          % (retry_wait, attempt, retries))
                    page.wait_for_timeout(int(retry_wait * 1000))

            if ok:
                info["flash"] = ""
            info["url"] = page.url
            info["title"] = page.title()
            try:
                info["cookies"] = [c["name"] for c in ctx.cookies()]
            except Exception:
                info["cookies"] = []

            if ok:
                save_state(ctx, save_cookies=save_cookies,
                           storage_state=storage_state, debug=debug)

            if keep_open:
                wait_until_closed(page)
        finally:
            _finish(browser, ctx)

    return ok, info


# ===========================================================================
# CLI
# ===========================================================================
def build_parser():
    ap = argparse.ArgumentParser(
        description="Đăng nhập IUH tự động bằng trình duyệt (Playwright)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Ví dụ:\n"
               "  iuh_browser.py 25765251 matkhau\n"
               "  iuh_browser.py --lms 25765251 matkhau --headless\n"
               "  iuh_browser.py 25765251 matkhau --keep-open\n")
    ap.add_argument("user", nargs="?", help="mã sinh viên")
    ap.add_argument("password", nargs="?", help="mật khẩu")
    ap.add_argument("--user", dest="user_opt", help="mã sinh viên (tuỳ chọn)")
    ap.add_argument("--password", dest="pass_opt", help="mật khẩu (tuỳ chọn)")
    ap.add_argument("--headless", action="store_true", help="chạy ẩn (không hiện cửa sổ)")
    ap.add_argument("--channel", default="chrome", help="chrome | chromium | msedge (mặc định chrome)")
    ap.add_argument("--timeout", type=float, default=30.0,
                    help="thời gian chờ tối đa mỗi bước, giây (mặc định 30)")
    ap.add_argument("--retries", type=int, default=3,
                    help="số lần thử lại khi server giới hạn tần suất (mặc định 3)")
    ap.add_argument("--retry-wait", type=float, default=8.0,
                    help="giây chờ giữa các lần thử lại (mặc định 8)")
    ap.add_argument("--save-cookies", help="lưu cookie kiểu Netscape để dùng với curl")
    ap.add_argument("--storage-state", help="file JSON lưu/đọc phiên (cookie + localStorage)")
    ap.add_argument("--user-data-dir", help="thư mục profile để giữ phiên giữa các lần chạy")
    ap.add_argument("--slow-mo", type=int, default=0, help="làm chậm thao tác (ms) để dễ quan sát")
    ap.add_argument("--keep-open", action="store_true", help="giữ trình duyệt mở sau khi login")
    ap.add_argument("--lms", action="store_true", help="đăng nhập LMS Moodle thay vì cổng SV")
    ap.add_argument("--schedule", action="store_true",
                    help="sau khi đăng nhập, mở thẳng trang lịch theo tuần")
    ap.add_argument("--json", action="store_true", help="in kết quả dạng JSON")
    ap.add_argument("--debug", action="store_true")
    return ap


def main(argv=None):
    ap = build_parser()
    args = ap.parse_args(argv)

    user = args.user_opt or args.user or os.environ.get("IUH_USER")
    password = args.pass_opt or args.password or os.environ.get("IUH_PASS")
    if not user or not password:
        ap.error("cần mã sinh viên và mật khẩu (tham số hoặc IUH_USER/IUH_PASS)")

    fn = lms_login if args.lms else login
    ok, info = fn(
        user, password,
        headless=args.headless,
        channel=args.channel,
        debug=args.debug,
        timeout=args.timeout,
        retries=args.retries,
        retry_wait=args.retry_wait,
        save_cookies=args.save_cookies,
        keep_open=args.keep_open,
        user_data_dir=args.user_data_dir,
        storage_state=args.storage_state,
        slow_mo=args.slow_mo,
        open_schedule=(args.schedule and not args.lms),
    )
    info["ok"] = ok

    if args.json:
        print(json.dumps(info, ensure_ascii=False, indent=2))
    else:
        print("URL     :", info.get("url"))
        print("Tiêu đề :", info.get("title"))
        if not args.lms:
            print("Captcha : đã chặn %d request" % info.get("blocked_captcha", 0))
        if info.get("cookies"):
            print("Cookies :", ", ".join(info["cookies"]))
        if info.get("attempts"):
            print("Số lần thử:", info["attempts"])
        if ok:
            print("✓ ĐĂNG NHẬP THÀNH CÔNG (tự động, không cần captcha)")
        else:
            print("✗ Đăng nhập thất bại:", info.get("flash") or "không rõ nguyên nhân")
    return 0 if ok else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nĐã dừng.")
        sys.exit(130)
