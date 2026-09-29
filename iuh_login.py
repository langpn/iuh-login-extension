#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""iuh_login - giai doan 2: HTTP session + luong dang nhap IUH.

Da reverse-engineer tu sinh-vien-dang-nhap.html:
  1. GET  /sinh-vien-dang-nhap.html  -> __RequestVerificationToken
  2. GET  /Common/GetPrivateKey?salt=<MSSV> -> private key (random)
  3. POST /sinh-vien-dang-nhap.html voi Password da ma hoa
  4. Thanh cong -> redirect /dashboard.html + cookie ASC.AUTH
"""

import base64
import datetime as _dt
import hashlib
import http.cookiejar
import json
import os
import re
import ssl
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

# ===========================================================================
# 1. AES-128-CBC thuần Python (không cần pycryptodome)
# ===========================================================================
SBOX = [
    0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
    0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
    0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
    0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
    0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
    0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
    0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
    0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
    0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
    0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
    0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
    0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
    0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
    0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
    0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
    0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16,
]
RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36]


def _xtime(a):
    a <<= 1
    return (a ^ 0x1b) & 0xff if a & 0x100 else a


def _expand(key):
    w = [list(key[i * 4:i * 4 + 4]) for i in range(4)]
    for i in range(4, 44):
        t = list(w[i - 1])
        if i % 4 == 0:
            t = t[1:] + t[:1]
            t = [SBOX[b] for b in t]
            t[0] ^= RCON[i // 4 - 1]
        w.append([w[i - 4][j] ^ t[j] for j in range(4)])
    return w


def _encrypt_block(block, w):
    """Mã hoá 1 block AES-128. `block`: 16 byte theo thứ tự column-major."""
    st = list(block)

    def addrk(rnd):
        for i in range(16):
            st[i] ^= w[rnd * 4 + i // 4][i % 4]

    addrk(0)
    for rnd in range(1, 11):
        st = [SBOX[b] for b in st]
        ns = [0] * 16                                    # ShiftRows
        for r in range(4):
            for c in range(4):
                ns[r + 4 * c] = st[r + 4 * ((c + r) % 4)]
        st = ns
        if rnd != 10:                                    # MixColumns
            for c in range(4):
                s0, s1, s2, s3 = st[4 * c:4 * c + 4]
                st[4 * c]     = _xtime(s0) ^ (_xtime(s1) ^ s1) ^ s2 ^ s3
                st[4 * c + 1] = s0 ^ _xtime(s1) ^ (_xtime(s2) ^ s2) ^ s3
                st[4 * c + 2] = s0 ^ s1 ^ _xtime(s2) ^ (_xtime(s3) ^ s3)
                st[4 * c + 3] = (_xtime(s0) ^ s0) ^ s1 ^ s2 ^ _xtime(s3)
        addrk(rnd)
    return bytes(st)


def aes_cbc_encrypt(plaintext, key, iv):
    w = _expand(key)
    pad = 16 - (len(plaintext) % 16)
    data = plaintext + bytes([pad]) * pad
    out, prev = bytearray(), iv
    for i in range(0, len(data), 16):
        blk = bytes(a ^ b for a, b in zip(data[i:i + 16], prev))
        prev = _encrypt_block(blk, w)
        out += prev
    return bytes(out)

# ===========================================================================
# 2. Đặc thù IUH
# ===========================================================================
AES_IV = bytes.fromhex("e84ad660c4721ae0e84ad660c4721ae0")
AES_SALT = b"CryptographyPMT-EMS"
CAPTCHA_URL = "/WebCommon/GetCaptcha"


def encrypt_password(password: str, private_key: str) -> str:
    key = hashlib.pbkdf2_hmac("sha1", private_key.encode(), AES_SALT, 1000, 16)
    return base64.b64encode(aes_cbc_encrypt(password.encode("utf-8"), key, AES_IV)).decode()

# ===========================================================================
# 3. HTTP session
# ===========================================================================
_CTX = ssl.create_default_context()
_CTX.check_hostname = False
_CTX.verify_mode = ssl.CERT_NONE


class LoginError(Exception):
    pass


class RateLimitError(LoginError):
    """Server tạm chặn vì đăng nhập quá nhanh."""
    pass


class CaptchaRequiredError(LoginError):
    """Server yêu cầu captcha nhưng chưa có/không đúng."""
    pass


class Session:
    def __init__(self, timeout=30):
        self.cj = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cj),
            urllib.request.HTTPSHandler(context=_CTX),
        )
        self.timeout = timeout
        self.username = None

    # ---- request ----
    def get(self, path, headers=None):
        url = path if path.startswith("http") else BASE + path
        req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
        return self.opener.open(req, timeout=self.timeout)

    def post(self, path, data, referer=None, headers=None):
        url = path if path.startswith("http") else BASE + path
        body = urllib.parse.urlencode(data).encode()
        req = urllib.request.Request(url, data=body, headers={
            "User-Agent": UA,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": referer or (BASE + "/sinh-vien-dang-nhap.html"),
            **(headers or {}),
        })
        return self.opener.open(req, timeout=self.timeout)

    def post_json(self, path, obj, referer=None):
        url = path if path.startswith("http") else BASE + path
        req = urllib.request.Request(url, data=json.dumps(obj).encode(), headers={
            "User-Agent": UA,
            "Content-Type": "application/json; charset=utf-8",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": referer or (BASE + "/dashboard.html"),
        })
        return self.opener.open(req, timeout=self.timeout)

    @staticmethod
    def text(resp):
        raw = resp.read()
        if "image" in resp.headers.get("Content-Type", ""):
            return raw
        return raw.decode("utf-8", "replace")

    def fetch(self, path, headers=None):
        """Trả về (url_cuối, nội_dung)."""
        resp = self.get(path, headers)
        return resp.geturl(), self.text(resp)

    # ---- cookies ----
    def cookie(self, name):
        for c in self.cj:
            if c.name == name:
                return c.value
        return None

    def flash(self):
        """Thông báo Flash.Warning server gửi qua cookie (URL-encoded)."""
        v = self.cookie("Flash.Warning")
        if not v:
            return ""
        try:
            return urllib.parse.unquote_plus(v).strip()
        except Exception:
            return v.strip()

    def cookie_header(self):
        return "; ".join("%s=%s" % (c.name, c.value) for c in self.cj)

    def save_cookies_netscape(self, path):
        """Lưu cookie dạng Netscape để dùng với curl --cookie / wget."""
        lines = ["# Netscape HTTP Cookie File", ""]
        for c in self.cj:
            domain = c.domain or ""
            lines.append("\t".join([
                domain,
                "TRUE" if domain.startswith(".") else "FALSE",
                c.path or "/",
                "TRUE" if c.secure else "FALSE",
                str(int(c.expires)) if c.expires else "0",
                c.name, c.value or "",
            ]))
        with open(path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")

    # ---- session (JSON) ----
    def save(self, path, username=None):
        data = {
            "username": username or self.username,
            "saved_at": _dt.datetime.now().isoformat(timespec="seconds"),
            "cookies": [
                {"domain": c.domain, "path": c.path or "/", "name": c.name,
                 "value": c.value, "secure": bool(c.secure), "expires": c.expires}
                for c in self.cj
            ],
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        try:
            os.chmod(path, 0o600)
        except OSError:
            pass

    @classmethod
    def load(cls, path):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        s = cls()
        for c in data.get("cookies", []):
            s.cj.set_cookie(http.cookiejar.Cookie(
                version=0, name=c["name"], value=c.get("value") or "",
                port=None, port_specified=False,
                domain=c.get("domain") or "sv.iuh.edu.vn",
                domain_specified=True, domain_initial_dot=False,
                path=c.get("path") or "/", path_specified=True,
                secure=bool(c.get("secure")), expires=c.get("expires"),
                discard=False, comment=None, comment_url=None,
                rest={}, rfc2109=False,
            ))
        s.username = data.get("username")
        return s

# ===========================================================================
# 4. Đăng nhập
# ===========================================================================
def _find_token(html_text):
    m = re.search(r'name="__RequestVerificationToken"[^>]*value="([^"]+)"', html_text)
    return m.group(1) if m else None


def _get_captcha(s, mode, debug=False):
    """mode: skip (không tải ảnh) | ocr | manual | text:<mã>.

    Trả về mã captcha (chuỗi). Việc có tải ảnh captcha hay không ảnh hưởng
    đến việc server có bắt buộc kiểm tra captcha hay không.
    """
    if not mode or mode in ("skip", "auto"):
        # "auto" bắt đầu bằng việc KHÔNG tải ảnh captcha.
        return ""
    if mode.startswith("text:"):
        return mode[5:].strip()

    raw = s.get(CAPTCHA_URL + "?r=" + str(time.time())).read()
    path = os.path.join(tempfile.gettempdir(), "iuh_captcha.png")
    with open(path, "wb") as f:
        f.write(raw)

    if mode == "manual":
        print("  → ảnh captcha:", path)
        if sys.platform == "darwin":
            subprocess.call(["open", path])
        return input("  Nhập captcha: ").strip()

    # ocr (cần tesseract: brew install tesseract)
    try:
        out = subprocess.run(["tesseract", path, "stdout", "--psm", "7"],
                             capture_output=True, text=True, timeout=20).stdout
        code = re.sub(r"[^A-Za-z0-9]", "", out)
        if debug:
            print("[debug] captcha OCR =", code)
        return code
    except Exception as e:
        print("  ! Không OCR được captcha (%s). Cài: brew install tesseract" % e)
        return ""


def _submit_login(s, username, password, uid, captcha_value, debug=False):
    """Gửi 1 lần POST đăng nhập. Trả về (thành_công, url_cuối, body)."""
    page = s.get("/sinh-vien-dang-nhap.html").read().decode("utf-8", "replace")
    token = _find_token(page)
    if not token:
        raise LoginError("Không tìm thấy __RequestVerificationToken (site đổi giao diện?)")

    pk = s.get("/Common/GetPrivateKey?salt=" + urllib.parse.quote(username)) \
          .read().decode("utf-8", "replace").strip()
    if not pk:
        raise LoginError("Không lấy được private key từ /Common/GetPrivateKey")
    if debug:
        print("[debug] private_key =", pk)

    data = {
        "UID": uid,
        "__RequestVerificationToken": token,
        "SSOData": "",
        "ReturnUrl": "",
        "UserName": username,
        "Password": encrypt_password(password, pk),
        "Captcha": captcha_value,
        "IsSinhVienDaTotNghiep": "false",
    }
    resp = s.post("/sinh-vien-dang-nhap.html", data)
    body = s.text(resp)
    final = resp.geturl()

    # Server hỏi "tài khoản đang đăng nhập ở thiết bị khác" -> xác nhận giành phiên
    if "dashboard.html" not in final:
        m = re.search(r"initialPendingKey\s*=\s*'([^']*)'", body)
        if m and m.group(1):
            if debug:
                print("[debug] cần xác nhận portal session:", m.group(1))
            tok2 = _find_token(body) or token
            r2 = s.post("/SinhVien/ConfirmPortalSession",
                        {"__RequestVerificationToken": tok2, "pendingKey": m.group(1)})
            try:
                j = json.loads(s.text(r2))
            except Exception:
                j = {}
            if j.get("RedirectUrl"):
                s.get(j["RedirectUrl"]).read()
                final = BASE + "/dashboard.html"

    ok = ("dashboard.html" in final) or bool(s.cookie("ASC.AUTH"))
    return ok, final, body, s.flash()


def _classify_failure(body, flash=""):
    """Phân loại lỗi đăng nhập dựa trên thông báo Flash.Warning của server.

    Bảng phân loại (đã kiểm chứng thực nghiệm):
      "Thông tin đăng nhập không đúng"  -> sai tài khoản/mật khẩu
      "Vui lòng nhập đầy đủ thông tin"  -> captcha sai hoặc còn thiếu
      flash rỗng, vẫn ở trang login     -> đăng nhập quá nhanh (rate-limit)
    """
    f = flash or ""
    if "Thông tin đăng nhập không đúng" in f:
        return LoginError("Sai tài khoản hoặc mật khẩu")
    if "Vui lòng nhập đầy đủ thông tin" in f:
        return CaptchaRequiredError("Captcha sai hoặc còn thiếu")
    if not f:
        # Không có flash mà vẫn bị trả về trang login: gần như chắc chắn do
        # gửi quá nhanh (server chống đăng nhập đồng thời).
        return RateLimitError("Server tạm chặn do đăng nhập quá nhanh")
    return LoginError("Đăng nhập thất bại: %s" % f.strip())


def login(username, password, session=None, uid="88", captcha="skip",
          debug=False, retries=3, retry_wait=8):
    """Đăng nhập, trả về Session có cookie ASC.AUTH.

    captcha:
      "skip"     - KHÔNG tải ảnh captcha (server bỏ qua kiểm tra) [nhanh nhất]
      "auto"     - thử 'skip' trước; nếu bị chặn vì captcha thì tải ảnh và xử lý
      "ocr"      - tải ảnh captcha và giải bằng tesseract
      "manual"   - tải ảnh captcha, mở ảnh cho người dùng nhập
      "text:XXXX"- dùng mã captcha có sẵn
    retries: số lần thử lại khi gặp RateLimitError.
    """
    s = session or Session()
    s.username = username
    mode = captcha or "skip"

    last_err = None
    for attempt in range(1, retries + 1):
        try:
            cap = _get_captcha(s, mode, debug)
            ok, final, body, flash = _submit_login(
                s, username, password, uid, cap, debug)
            if ok:
                if debug:
                    print("[debug] final =", final, "| cookies =", [c.name for c in s.cj])
                return s

            err = _classify_failure(body, flash)

            # auto: nếu bị chặn vì captcha thì thử lại với captcha thật
            if mode == "auto" and isinstance(err, CaptchaRequiredError):
                if debug:
                    print("[debug] captcha được yêu cầu → thử lại với captcha")
                sub = "manual" if sys.stdin.isatty() else "ocr"
                cap = _get_captcha(s, sub, debug)
                ok, final, body, flash = _submit_login(
                    s, username, password, uid, cap, debug)
                if ok:
                    return s
                err = _classify_failure(body, flash)

            last_err = err
            if isinstance(err, RateLimitError) and attempt < retries:
                if debug:
                    print("[debug] rate-limit, chờ %ds rồi thử lại (%d/%d)"
                          % (retry_wait, attempt, retries))
                time.sleep(retry_wait)
                continue
            raise err

        except urllib.error.HTTPError as e:
            last_err = LoginError("HTTP %s khi đăng nhập" % e.code)
            if attempt < retries:
                time.sleep(retry_wait)
                continue
            raise last_err

    raise last_err or LoginError("Đăng nhập thất bại")


def is_logged_in(s):
    """Kiểm tra session còn sống."""
    try:
        url, body = s.fetch("/dashboard.html")
    except Exception:
        return False
    if "sinh-vien-dang-nhap" in url:
        return False
    return 'id="form-login"' not in body and "ĐĂNG NHẬP HỆ THỐNG" not in body
