#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
iuh_browser.py — Đăng nhập IUH tự động hoàn toàn bằng trình duyệt thật.

Cơ chế: trang login có <img src=".../GetCaptcha">. Server chỉ bắt buộc
captcha nếu session đã tải ảnh captcha. Bằng cách CHẶN request ảnh đó,
server bỏ qua kiểm tra captcha -> đăng nhập tự động 100%, không cần OCR.

Yêu cầu:
    pip install playwright
    playwright install chromium   (hoặc dùng Chrome có sẵn: --channel chrome)

Cách dùng:
    python3 iuh_browser.py YOUR_MSSV YOUR_PASSWORD
    python3 iuh_browser.py --user YOUR_MSSV --password YOUR_PASSWORD --headless
    python3 iuh_browser.py ... --save-cookies cookies.txt
"""
import argparse
import json
import os
import sys
import time

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit("Thiếu playwright. Cài: pip install playwright && playwright install chromium")

BASE = "https://sv.iuh.edu.vn"
LOGIN_URL = BASE + "/sinh-vien-dang-nhap.html"
DASHBOARD = BASE + "/dashboard.html"

DEFAULT_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)


def login(user, password, headless=False, channel="chrome", debug=False,
          timeout=30000, save_cookies=None, keep_open=False):
    """Đăng nhập. Trả về (success: bool, info: dict)."""
    blocked = []

    with sync_playwright() as p:
        launch_kwargs = {"headless": headless}
        if channel:
            launch_kwargs["channel"] = channel
        browser = p.chromium.launch(**launch_kwargs)

        ctx = browser.new_context(user_agent=DEFAULT_UA, locale="vi-VN")

        # Mấu chốt: chặn mọi request ảnh captcha.
        def route_handler(route):
            if "GetCaptcha" in route.request.url:
                blocked.append(route.request.url)
                route.abort()
            else:
                route.continue_()

        ctx.route("**/GetCaptcha*", route_handler)

        page = ctx.new_page()
        page.set_default_timeout(timeout)

        if debug:
            page.on("console", lambda m: print("[console]", m.text))

        page.goto(LOGIN_URL, wait_until="domcontentloaded")
        page.wait_for_selector("#UserName", timeout=timeout)

        # Tắt ảnh captcha nếu có phần tử (đề phòng trang chèn qua JS).
        page.evaluate(
            """() => {
                document.querySelectorAll('img').forEach(img => {
                    if (img.src && img.src.includes('GetCaptcha')) {
                        img.removeAttribute('src');
                        img.style.display = 'none';
                    }
                });
            }"""
        )

        page.fill("#UserName", user)
        page.fill("#Password", password)

        if debug:
            print("[debug] đã chặn %d request captcha" % len(blocked))
            print("[debug] submit form...")

        # Submit: ưu tiên click nút đăng nhập, fallback Enter.
        btn = page.query_selector("input[type=submit], button[type=submit], #btnLogin")
        if btn:
            btn.click()
        else:
            page.press("#Password", "Enter")

        try:
            page.wait_for_url("**/dashboard.html", timeout=timeout)
        except Exception:
            pass

        ok = "dashboard" in page.url
        body = page.content() if not ok else ""
        flash = ""
        if not ok:
            for kw in ("Thông tin đăng nhập không đúng",
                       "Vui lòng nhập đầy đủ thông tin",
                       "Captcha sai",
                       "đang đăng nhập"):
                if kw in body:
                    flash = kw
                    break

        if save_cookies and ok:
            cookies = ctx.cookies()
            lines = ["# Netscape HTTP Cookie File"]
            for c in cookies:
                lines.append("\t".join([
                    c["domain"], "TRUE" if c["domain"].startswith(".") else "FALSE",
                    c["path"], "TRUE" if c.get("secure") else "FALSE",
                    str(int(c.get("expires") or 0)), c["name"], c["value"],
                ]))
            with open(save_cookies, "w") as f:
                f.write("\n".join(lines) + "\n")

        info = {
            "url": page.url,
            "title": page.title(),
            "blocked_captcha": len(blocked),
            "flash": flash,
        }
        if debug and save_cookies and ok:
            info["cookies_file"] = save_cookies

        if keep_open:
            print("Trình duyệt đang mở. Nhấn Enter để đóng...")
            try:
                input()
            except EOFError:
                time.sleep(30)

        browser.close()
        return ok, info


def main(argv=None):
    ap = argparse.ArgumentParser(description="Đăng nhập IUH tự động bằng trình duyệt")
    ap.add_argument("user", nargs="?", help="mã sinh viên")
    ap.add_argument("password", nargs="?", help="mật khẩu")
    ap.add_argument("--user", dest="user_opt", help="mã sinh viên (tuỳ chọn)")
    ap.add_argument("--password", dest="pass_opt", help="mật khẩu (tuỳ chọn)")
    ap.add_argument("--headless", action="store_true", help="chạy ẩn (không hiện cửa sổ)")
    ap.add_argument("--channel", default="chrome", help="chrome | chromium | msedge")
    ap.add_argument("--save-cookies", help="lưu cookie kiểu Netscape để dùng với curl")
    ap.add_argument("--keep-open", action="store_true", help="giữ trình duyệt mở sau khi login")
    ap.add_argument("--debug", action="store_true")
    args = ap.parse_args(argv)

    user = args.user_opt or args.user or os.environ.get("IUH_USER")
    password = args.pass_opt or args.password or os.environ.get("IUH_PASS")
    if not user or not password:
        ap.error("cần mã sinh viên và mật khẩu (tham số hoặc IUH_USER/IUH_PASS)")

    ok, info = login(
        user, password,
        headless=args.headless,
        channel=args.channel,
        debug=args.debug,
        save_cookies=args.save_cookies,
        keep_open=args.keep_open,
    )

    print(json.dumps(info, ensure_ascii=False, indent=2))
    if ok:
        print("✓ ĐĂNG NHẬP THÀNH CÔNG (tự động, không cần captcha)")
    else:
        print("✗ Đăng nhập thất bại:", info.get("flash") or "không rõ nguyên nhân")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
