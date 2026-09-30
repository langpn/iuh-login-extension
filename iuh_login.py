#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
iuh_login - Tool auto login cổng thông tin sinh viên IUH (https://sv.iuh.edu.vn)

Cơ chế đăng nhập của site (đã reverse-engineer từ sinh-vien-dang-nhap.html):

  1. GET  /sinh-vien-dang-nhap.html
         -> lấy __RequestVerificationToken + cookie ASP.NET_SessionId
  2. GET  /Common/GetPrivateKey?salt=<MSSV>
         -> trả về 1 private key (hex, random mỗi lần)
  3. Mật khẩu mã hoá client-side bằng AES-128-CBC rồi Base64:
         key = PBKDF2-HMAC-SHA1(private_key.encode(), b"CryptographyPMT-EMS", 1000, 16)
         iv  = e84ad660c4721ae0e84ad660c4721ae0
         Password = base64(AES-CBC-PKCS7(plaintext))
  4. POST /sinh-vien-dang-nhap.html
         -> thành công: redirect /dashboard.html + cookie ASC.AUTH

Về captcha: server chỉ bắt captcha nếu session đã tải ảnh /WebCommon/GetCaptcha.
Vì vậy mặc định tool KHÔNG tải ảnh captcha. Có sẵn chế độ --captcha ocr|manual|text
cho trường hợp server đổi luật.

Tool chỉ dùng thư viện chuẩn Python 3.8+ (không cần pip install gì).

Ví dụ:
    python3 iuh_login.py login YOUR_MSSV 'matkhau'
    python3 iuh_login.py check
    python3 iuh_login.py info --json
    python3 iuh_login.py grades
    python3 iuh_login.py schedule --week -1
    python3 iuh_login.py keepalive --interval 600
    python3 iuh_login.py cookie
    python3 iuh_login.py get /dashboard.html
"""

import argparse
import base64
import datetime as _dt
import hashlib
import html as _html
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

BASE = "https://sv.iuh.edu.vn"
LMS_BASE = "https://lms.iuh.edu.vn"
LMS_LOGIN = "/login/index.php"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/125.0 Safari/537.36")
DEFAULT_SESSION_FILE = "session.json"
DEFAULT_LMS_SESSION_FILE = "lms_session.json"
DEFAULT_COOKIES_FILE = "cookies.txt"
DEFAULT_CONFIG_FILE = "config.json"
DKHP_BASE = "https://dkhp.iuh.edu.vn"
DKHP_LOGIN = "/Account/Login"
DKHP_CAPTCHA_URL = "/WebCommon/GetCaptcha"
DKHP_KEY_URL = "/Common/GetPrivateKey"
DKHP_PORTAL = "/DangKyHocPhan/ThongTinPortal"
CAPTCHA_LEN = 4
DEFAULT_DKHP_SESSION_FILE = "dkhp_session.json"

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
    def __init__(self, timeout=30, base=None):
        self.cj = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cj),
            urllib.request.HTTPSHandler(context=_CTX),
        )
        self.timeout = timeout
        self.username = None
        self.base = base or BASE

    def _url(self, path):
        return path if path.startswith("http") else self.base + path

    # ---- request ----
    def get(self, path, headers=None):
        url = self._url(path)
        req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
        return self.opener.open(req, timeout=self.timeout)

    def post(self, path, data, referer=None, headers=None):
        url = self._url(path)
        body = urllib.parse.urlencode(data).encode()
        req = urllib.request.Request(url, data=body, headers={
            "User-Agent": UA,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": referer or (self.base + "/sinh-vien-dang-nhap.html"),
            **(headers or {}),
        })
        return self.opener.open(req, timeout=self.timeout)

    def post_json(self, path, obj, referer=None):
        url = self._url(path)
        req = urllib.request.Request(url, data=json.dumps(obj).encode(), headers={
            "User-Agent": UA,
            "Content-Type": "application/json; charset=utf-8",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": referer or (self.base + "/dashboard.html"),
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
            "base": self.base,
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
        s = cls(base=data.get("base") or BASE)
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


# ===========================================================================
# 4b. LMS (Moodle) — lms.iuh.edu.vn
#   Moodle dùng logintoken + POST form thường, KHÔNG captcha, KHÔNG mã hoá.
# ===========================================================================
def lms_login(username, password, session=None, debug=False):
    s = session or Session(base=LMS_BASE)
    s.base = LMS_BASE

    if debug:
        print("[lms] GET %s" % LMS_LOGIN)
    _, html = s.fetch(LMS_LOGIN)

    m = re.search(r'name="logintoken"\s+value="([^"]+)"', html)
    token = m.group(1) if m else ""

    if debug:
        print("[lms] logintoken = %s" % (token[:24] or "(không có)"))
        print("[lms] captcha     = %s" % ("có" if "captcha" in html.lower() else "không"))

    data = {
        "anchor": "",
        "logintoken": token,
        "username": username,
        "password": password,
        "rememberusername": "1",
    }
    resp = s.post(LMS_LOGIN, data, referer=LMS_BASE + LMS_LOGIN,
                  headers={"X-Requested-With": ""})
    final = resp.geturl()
    body = s.text(resp)

    ok = ("/login/index.php" not in final) or ("MoodleSession" in [c.name for c in s.cj])
    if not ok:
        msg = ""
        e = re.search(r'class="loginerrors[^"]*"[^>]*>(.*?)</div>', body, re.S)
        if e:
            msg = clean(e.group(1))
        raise LoginError("LMS: %s" % (msg or "đăng nhập thất bại"))

    s.username = username
    if debug:
        print("[lms] ✓ vào %s" % final)
    return s


def is_lms_logged_in(s):
    try:
        url, body = s.fetch("/my/")
    except Exception:
        return False
    if "/login/index.php" in url:
        return False
    return "MoodleSession" in [c.name for c in s.cj] and "loginform" not in body


# ===========================================================================
# 4c. ĐKHP (dkhp.iuh.edu.vn) — đăng ký học phần
#   Cùng họ ASCVN với cổng SV (cùng AES-128-CBC + PBKDF2) NHƯNG server LUÔN
#   kiểm tra captcha, không có cơ chế bỏ qua như cổng SV. Vì vậy:
#     - tự đọc captcha bằng ddddocr (nếu đã cài) trong một ngân sách thời gian
#       ngắn, thử lại nhiều lần với phiên mới (mỗi lần thử rất nhẹ);
#     - hết ngân sách thì nhờ người dùng nhập tay;
#     - MỌI lần đăng nhập thành công (tự động hoặc nhập tay) đều được lưu lại
#       thành một mẫu (ảnh, nhãn) đã được server xác nhận — dùng làm dữ liệu
#       huấn luyện về sau.
# ===========================================================================
_OCR = None


def _norm_captcha(text):
    """Chuẩn hoá theo đúng luật của server: đúng 4 ký tự, chữ in hoa."""
    text = re.sub(r"[^A-Za-z0-9]", "", text or "").upper()
    return text if len(text) == CAPTCHA_LEN else ""


def _ocr_captcha(raw, debug=False):
    """Đọc captcha DKHP bằng ddddocr. Trả về mã 4 ký tự hoặc '' nếu không chắc.

    ddddocr là tuỳ chọn: nếu chưa cài, hàm trả về '' để caller chuyển sang
    nhập tay. Cài bằng: pip install ddddocr
    """
    global _OCR
    try:
        if _OCR is None:
            import ddddocr
            _OCR = ddddocr.DdddOcr(show_ad=False)
        text = _OCR.classification(raw)
    except Exception as e:
        if debug:
            print("[dkhp] OCR không khả dụng:", e)
        return ""
    code = _norm_captcha(text)
    if debug:
        print("[dkhp] OCR = %r → %r" % (text, code))
    return code


def _dkhp_failure(body):
    """Suy ra loại lỗi từ nội dung trang trả về sau POST."""
    if "Mã bảo vệ" in body or "mã bảo vệ" in body:
        return CaptchaRequiredError("DKHP: captcha sai")
    m = re.search(r'class="[^"]*(?:validation|error|alert)[^"]*"[^>]*>(.*?)<',
                  body, re.I | re.S)
    msg = clean(m.group(1)) if m else ""
    if "không đúng" in msg or "không chính xác" in msg:
        return LoginError("DKHP: sai tài khoản hoặc mật khẩu")
    return LoginError("DKHP: %s" % (msg or "đăng nhập thất bại"))


def _dkhp_attempt(username, password, guess_fn, debug=False):
    """Một lần thử đăng nhập DKHP trên phiên mới.

    guess_fn(nh_bytes) -> mã captcha (str). Trả về None nghĩa là "chưa đoán
    được, bỏ lượt này" (không POST để đỡ tải server).
    Trả về (ok, session, url_cuối, body, ảnh_bytes, mã_đã_dùng).
    """
    s = Session(base=DKHP_BASE)
    _, page = s.fetch(DKHP_LOGIN)
    token = _find_token(page)
    if not token:
        raise LoginError("DKHP: không tìm thấy __RequestVerificationToken")

    pk = s.get(DKHP_KEY_URL + "?salt=" + urllib.parse.quote(username)) \
          .read().decode("utf-8", "replace").strip()
    if not pk:
        raise LoginError("DKHP: không lấy được private key")

    raw = s.get(DKHP_CAPTCHA_URL + "?r=" + str(time.time())).read()
    cap = guess_fn(raw)
    if cap is None:
        return False, s, DKHP_BASE + DKHP_LOGIN, "", raw, ""

    data = {
        "ReturnUrl": "",
        "__RequestVerificationToken": token,
        "UserName": username,
        "Password": encrypt_password(password, pk),
        "Captcha": cap,
    }
    resp = s.post(DKHP_LOGIN, data, referer=DKHP_BASE + DKHP_LOGIN)
    final = resp.geturl()
    body = s.text(resp)
    ok = ("ThongTinPortal" in final
          or any(c.name == ".ASPXFORMSAUTH" for c in s.cj))
    return ok, s, final, body, raw, cap


def _dkhp_manual_guess(raw):
    """Hiện ảnh captcha và nhờ người dùng nhập."""
    path = os.path.join(tempfile.gettempdir(), "iuh_dkhp_captcha.jpg")
    with open(path, "wb") as f:
        f.write(raw)
    print("  → ảnh captcha:", path)
    if sys.platform == "darwin":
        subprocess.call(["open", path])
    while True:
        code = _norm_captcha(input("  Nhập captcha (4 ký tự, in hoa): "))
        if code:
            return code
        print("  ! Cần đúng 4 ký tự, thử lại.")


def dkhp_login(username, password, session=None, captcha="auto", debug=False,
               auto_seconds=6.0, max_attempts=40):
    """Đăng nhập dkhp.iuh.edu.vn, trả về Session có cookie .ASPXFORMSAUTH.

    captcha:
      "auto"      - tự đọc captcha trong `auto_seconds` giây (bằng ddddocr nếu có); hết thì nhập tay
      "manual"    - nhập tay ngay
      "text:XXXX" - dùng mã có sẵn
    """
    mode = (captcha or "auto").strip()
    fixed = mode[5:].strip() if mode.startswith("text:") else None

    def ocr_guess(raw):
        code = _ocr_captcha(raw, debug)
        return code or None  # None: bỏ lượt, không POST

    if mode == "manual":
        guess = _dkhp_manual_guess
    elif fixed is not None:
        guess = lambda raw: fixed
    else:
        guess = ocr_guess

    deadline = time.time() + max(1.0, float(auto_seconds))
    attempts = 0
    last = None

    while True:
        attempts += 1
        # Hết ngân sách tự đọc → chuyển sang nhập tay (nếu có bàn phím).
        if guess is ocr_guess and time.time() >= deadline:
            if sys.stdin.isatty():
                print("  ! Hết %.0fs tự đọc captcha → nhờ bạn nhập tay."
                      % auto_seconds)
                guess = _dkhp_manual_guess
            else:
                raise last or LoginError(
                    "DKHP: không tự đọc được captcha (hết %.0fs)"
                    % auto_seconds)

        try:
            ok, s, final, body, raw, cap = _dkhp_attempt(
                username, password, guess, debug)
        except LoginError:
            raise
        except urllib.error.HTTPError as e:
            last = LoginError("DKHP: HTTP %s" % e.code)
            if attempts >= max_attempts:
                raise last
            continue

        if ok:
            s.username = username
            if debug:
                print("[dkhp] ✓ %s (lần %d)" % (final, attempts))
            return s

        if not cap:
            # chưa đoán được (OCR bỏ lượt) → thử phiên khác
            if attempts >= max_attempts:
                raise LoginError("DKHP: không tự đọc được captcha")
            continue

        last = _dkhp_failure(body)
        # captcha cố định / nhập tay sai thì dừng, không đoán lại.
        if fixed is not None or guess is _dkhp_manual_guess:
            raise last
        if attempts >= max_attempts:
            if sys.stdin.isatty():
                print("  ! Đã thử %d lần tự động → nhờ bạn nhập tay." % attempts)
                guess = _dkhp_manual_guess
                attempts = 0
                continue
            raise last


def is_dkhp_logged_in(s):
    """Kiểm tra session DKHP còn sống."""
    try:
        url, body = s.fetch(DKHP_PORTAL)
    except Exception:
        return False
    if DKHP_LOGIN in url or "form-login" in body:
        return False
    return True


# ===========================================================================
# 5. Tiện ích HTML
# ===========================================================================
def clean(text):
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", _html.unescape(text)).strip()


def parse_table(html_text, table_id=None, raw=False):
    """Đọc <table> thành list hàng, đã xử lý rowspan/colspan.

    raw=False: cell là text đã làm sạch; raw=True: giữ nguyên HTML bên trong cell.
    """
    if table_id:
        m = re.search(r'<table[^>]*id="%s"[^>]*>' % re.escape(table_id), html_text)
        if not m:
            return []
        start = m.start()
    else:
        start = html_text.find("<table")
        if start < 0:
            return []
    end = html_text.find("</table>", start)
    table = html_text[start:end if end > 0 else len(html_text)]

    m = re.search(r"<tbody[^>]*>(.*?)</tbody>", table, re.S)
    if m:
        body = m.group(1)
    else:
        m = re.search(r"</thead>(.*)", table, re.S)
        body = m.group(1) if m else table

    rows, pending = [], {}
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", body, re.S):
        cells = re.findall(r"<t[dh]([^>]*)>(.*?)</t[dh]>", tr, re.S)
        row, col, used = [], 0, set()
        it = iter(cells)
        while True:
            if col in pending and col not in used:
                left, text = pending[col]
                row.append(text)
                used.add(col)
                if left - 1 <= 0:
                    del pending[col]
                else:
                    pending[col] = (left - 1, text)
                col += 1
                continue
            try:
                attrs, content = next(it)
            except StopIteration:
                while col in pending:
                    left, text = pending[col]
                    row.append(text)
                    if left - 1 <= 0:
                        del pending[col]
                    else:
                        pending[col] = (left - 1, text)
                    col += 1
                break
            cs = re.search(r'colspan="(\d+)"', attrs)
            rs = re.search(r'rowspan="(\d+)"', attrs)
            cs = int(cs.group(1)) if cs else 1
            rs = int(rs.group(1)) if rs else 1
            text = content if raw else clean(content)
            for k in range(cs):
                row.append(text)
                if rs > 1:
                    pending[col + k] = (rs - 1, text)
                used.add(col + k)
            col += cs
        rows.append(row)
    return rows


def _kv_pairs(html_text):
    """Lấy các cặp 'Nhãn: giá trị' trong khối thông tin (label/b/span)."""
    out = {}
    for label, value in re.findall(
            r"<span[^>]*>(.*?)</span>\s*:\s*<(?:b|span)[^>]*>(.*?)</(?:b|span)>",
            html_text, re.S):
        key = clean(label).rstrip(":").strip()
        val = clean(value)
        if key and key not in out:
            out[key] = val
    return out


# ===========================================================================
# 6. Lấy dữ liệu
# ===========================================================================
GRADE_COLS = ["STT", "Mã lớp học phần", "Tên môn học/học phần", "Số tín chỉ",
              "Giữa kỳ", "TX1", "TX2", "TX3", "TX4", "TX5", "TX6", "TX7", "TX8", "TX9",
              "TH1", "TH2", "TH3", "TH4", "TH5", "Cuối kỳ",
              "Điểm tổng kết", "Thang điểm 4", "Điểm chữ", "Xếp loại", "Ghi chú"]


def get_grades(s):
    body = s.text(s.get("/ket-qua-hoc-tap.html"))
    rows = parse_table(body, "xemDiem_aaa")
    out, hoc_ky = [], None
    for r in rows:
        if not r or not any(r):
            continue
        if len(set(x for x in r if x)) == 1 and re.match(r"^HK\d+\s*\(", r[0].strip() or " "):
            hoc_ky = r[0].strip()
            continue
        if not re.match(r"^\d+$", (r[0] or "").strip()):
            continue
        item = {"hoc_ky": hoc_ky}
        for i, name in enumerate(GRADE_COLS):
            item[name] = (r[i] if i < len(r) else "").strip()
        out.append(item)
    return out


# Bảng quy đổi tiết -> giờ của IUH (theo lịch tuần).
TIET_GIO = {
    # Buổi sáng
    1: ("06:30", "07:20"), 2: ("07:20", "08:10"), 3: ("08:10", "09:00"),
    4: ("09:10", "10:00"), 5: ("10:00", "10:50"), 6: ("10:50", "11:40"),
    # Buổi chiều
    7: ("12:30", "13:20"), 8: ("13:20", "14:10"), 9: ("14:10", "15:00"),
    10: ("15:10", "16:00"), 11: ("16:00", "16:50"), 12: ("16:50", "17:40"),
    # Buổi tối
    13: ("18:00", "18:50"), 14: ("18:50", "19:40"), 15: ("19:50", "20:40"),
    16: ("20:40", "21:30"),
}


def tiet_to_gio(tiet):
    """Chuỗi '13 - 15' -> '18:00 - 20:40'. Trả '' nếu không đọc được tiết."""
    nums = [int(n) for n in re.findall(r"\d+", str(tiet))]
    if not nums:
        return ""
    start, end = nums[0], nums[-1]
    if start not in TIET_GIO or end not in TIET_GIO:
        return ""
    return "%s - %s" % (TIET_GIO[start][0], TIET_GIO[end][1])


def tiet_to_phut(tiet):
    """Số phút của khoảng tiết, dùng để tính tổng giờ học."""
    nums = [int(n) for n in re.findall(r"\d+", str(tiet))]
    if not nums or nums[0] not in TIET_GIO or nums[-1] not in TIET_GIO:
        return 0
    a, b = TIET_GIO[nums[0]][0], TIET_GIO[nums[-1]][1]
    to_min = lambda t: int(t[:2]) * 60 + int(t[3:])
    return to_min(b) - to_min(a)


def get_schedule(s, week_offset=0, exam=False):
    """Lịch theo tuần -> list [{thu, ngay, buoi, mon, ma_lop, lop, tiet, gio, phong, gv}]."""
    day = _dt.date.today() + _dt.timedelta(days=7 * week_offset)
    loai = 2 if exam else 1
    resp = s.post("/SinhVien/GetDanhSachLichTheoTuan",
                  {"pNgayHienTai": day.strftime("%d/%m/%Y"), "pLoaiLich": loai},
                  referer="%s/lich-theo-tuan.html?pLoaiLich=%d" % (BASE, loai))
    html_text = s.text(resp)

    rows = parse_table(html_text, raw=True)

    # Header (thead) chứa tên thứ + ngày: bỏ ô đầu tiên ("Ca học").
    days = []
    head = re.search(r"<thead[^>]*>(.*?)</thead>", html_text, re.S)
    if head:
        for attrs, content in re.findall(r"<t[dh]([^>]*)>(.*?)</t[dh]>",
                                         head.group(1), re.S):
            txt = clean(content)
            d = re.search(r"(\d{2}/\d{2}/\d{4})", txt)
            ten = re.sub(r"\(?\s*\d{2}/\d{2}/\d{4}\s*\)?", "", txt).strip()
            days.append((ten, d.group(1) if d else ""))
        days = days[1:]

    out = []
    for r in rows:
        if not r:
            continue
        buoi = clean(r[0])
        if buoi not in ("Sáng", "Chiều", "Tối"):
            continue
        for idx, cell in enumerate(r[1:1 + len(days)]):
            if not cell or "<div" not in cell:
                continue
            for block in re.findall(r'<div class="content[^"]*"[^>]*>(.*?)(?=<div class="content|</td>|$)',
                                    cell, re.S):
                mon = re.search(r"<a[^>]*>(.*?)</a>", block, re.S)
                lop = re.search(r"<p>(.*?)</p>", block, re.S)
                tiet = re.search(r"Tiết</span>\s*:\s*([^<]+)", block)
                phong = re.search(r"Phòng</span>\s*:\s*<font>([^<]+)", block)
                gv = re.search(r"GV</span>\s*:\s*<font>([^<]+)", block)
                ghi = re.search(r"Ghi chú[^<]*</span>\s*:\s*([^<]+)", block)
                lop_txt = clean(lop.group(1)) if lop else ""
                ma = re.search(r"-\s*([0-9A-Za-z_]+)\s*$", lop_txt)
                tiet_txt = clean(tiet.group(1)) if tiet else ""
                out.append({
                    "thu": days[idx][0], "ngay": days[idx][1], "buoi": buoi,
                    "mon": clean(mon.group(1)) if mon else "",
                    "lop": lop_txt,
                    "ma_lop": ma.group(1) if ma else "",
                    "tiet": tiet_txt,
                    "gio": tiet_to_gio(tiet_txt),
                    "phong": clean(phong.group(1)) if phong else "",
                    "gv": clean(gv.group(1)) if gv else "",
                    "ghi_chu": clean(ghi.group(1)) if ghi else "",
                })
    return out


def get_info(s):
    body = s.text(s.get("/thong-tin-sinh-vien.html"))
    # Chỉ lấy trong khối thông tin sinh viên để tránh dính menu/CSS/JS
    start = body.find("Thông tin học vấn")
    end = body.find("Quan hệ gia đình", start)
    block = body[start:end if end > 0 else len(body)]
    data = _kv_pairs(block)
    m = re.search(r"<img[^>]*src=\"(data:image/[^;]+;base64[^\"]*)\"", body)
    return {"fields": data, "anh_the": m.group(1) if m else None}


# ===========================================================================
# 7. Cấu hình + tiện ích
# ===========================================================================
def load_config(path):
    if path and os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return {}


def resolve_credentials(args, cfg):
    use_pos = getattr(args, "command", "login") in ("login", "dkhp", "dkhp-harvest")
    user = (args.username or (args.arg if use_pos else None)
            or cfg.get("username") or os.environ.get("IUH_USER"))
    pw = (args.password or (args.arg2 if use_pos else None)
          or cfg.get("password") or os.environ.get("IUH_PASS"))
    return user, pw


def open_session(args, cfg):
    """Dùng lại session đã lưu, nếu hết hạn thì đăng nhập lại."""
    path = args.session or cfg.get("session_file") or DEFAULT_SESSION_FILE
    if os.path.exists(path) and not args.force:
        try:
            s = Session.load(path)
            if is_logged_in(s):
                if args.debug:
                    print("[debug] dùng lại session:", path)
                return s, path
        except Exception as e:
            if args.debug:
                print("[debug] lỗi đọc session:", e)
        if args.debug:
            print("[debug] session hết hạn → đăng nhập lại")
    user, pw = resolve_credentials(args, cfg)
    if not user or not pw:
        raise LoginError("Thiếu tài khoản/mật khẩu (config.json hoặc IUH_USER/IUH_PASS)")
    s = login(user, pw, uid=str(cfg.get("uid", args.uid)),
              captcha=cfg.get("captcha", args.captcha), debug=args.debug)
    s.save(path, username=user)
    return s, path


def _print_json(obj):
    print(json.dumps(obj, ensure_ascii=False, indent=2))


# ===========================================================================
# 8. CLI
# ===========================================================================
def _print_schedule(data, exam=False):
    """In lịch theo tuần, hiển thị giờ cụ thể thay cho số tiết."""
    if not data:
        print("(tuần này không có lịch)")
        return
    order = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]
    data = sorted(data, key=lambda x: (order.index(x["thu"]) if x["thu"] in order else 9,
                                       x["gio"][0]))
    for x in data:
        print("%-9s %-10s | %-6s | %-14s | %-40s | %-26s | %s" % (
            x["thu"], x["ngay"], x["buoi"], x["gio"], x["mon"][:40],
            x["lop"][:26], x["gv"]))
        if x.get("phong") or x.get("ghi_chu"):
            print(" " * 29 + "└ %s%s" % (
                ("Tiết %s · " % x["tiet"]) if x.get("tiet") else "",
                " · ".join(v for v in [x.get("phong"), x.get("ghi_chu")] if v)))
    total = sum(tiet_to_phut(x.get("tiet")) for x in data)
    print("\nTổng: %d buổi, %d giờ %02d phút" % (
        len(data), total // 60, total % 60))


def main(argv=None):
    ap = argparse.ArgumentParser(
        prog="iuh_login",
        description="Auto login + lấy dữ liệu cổng sinh viên IUH (sv.iuh.edu.vn)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Ví dụ:\n"
               "  iuh_login.py login YOUR_MSSV matkhau\n"
               "  iuh_login.py grades --json\n"
               "  iuh_login.py schedule --week -1\n"
               "  iuh_login.py keepalive --interval 600\n")
    ap.add_argument("command", nargs="?", default="login",
                    choices=["login", "check", "keepalive", "get", "grades",
                             "schedule", "info", "cookie", "logout", "lms",
                             "dkhp"])
    ap.add_argument("arg", nargs="?", help="với `login`: MSSV; với `get`: đường dẫn trang")
    ap.add_argument("arg2", nargs="?", help="với `login`: mật khẩu")
    ap.add_argument("--config", default=DEFAULT_CONFIG_FILE, help="file cấu hình JSON")
    ap.add_argument("--session", help="file session (mặc định session.json)")
    ap.add_argument("--username", help="MSSV")
    ap.add_argument("--password", help="mật khẩu")
    ap.add_argument("--uid", default="88")
    ap.add_argument("--captcha", default="skip",
                    help="skip | ocr | manual | text:<mã>")
    ap.add_argument("--force", action="store_true", help="bỏ session cũ, đăng nhập lại")
    ap.add_argument("--json", action="store_true", help="xuất JSON")
    ap.add_argument("--save-cookies", metavar="FILE", help="lưu cookie kiểu Netscape")
    ap.add_argument("--week", type=int, default=0, help="lệch tuần cho `schedule`")
    ap.add_argument("--exam", action="store_true", help="lịch thi thay vì lịch học")
    ap.add_argument("--interval", type=int, default=600, help="giây giữa 2 lần keepalive")
    ap.add_argument("--once", action="store_true", help="keepalive chạy 1 lần rồi thoát")
    ap.add_argument("--retries", type=int, default=3,
                    help="số lần thử lại khi bị chặn đăng nhập liên tiếp")
    ap.add_argument("--retry-wait", type=int, default=8,
                    help="giây chờ giữa các lần thử lại")
    ap.add_argument("--captcha-budget", type=float, default=5.0,
                    help="giây tối đa để tự đọc captcha trước khi hỏi người dùng")
    ap.add_argument("--debug", action="store_true")
    args = ap.parse_args(argv)
    cfg = load_config(args.config)
    t0 = time.time()

    # ---------- logout ----------
    if args.command == "logout":
        path = args.session or cfg.get("session_file") or DEFAULT_SESSION_FILE
        if os.path.exists(path):
            try:
                Session.load(path).get("/SinhVien/Logout").read()
            except Exception:
                pass
            os.remove(path)
        print("✓ Đã xoá session:", path)
        return 0

    # ---------- login ----------
    if args.command == "login":
        user, pw = resolve_credentials(args, cfg)
        if not user or not pw:
            ap.error("Thiếu username/password (truyền trực tiếp, config.json hoặc IUH_USER/IUH_PASS)")
        try:
            s = login(user, pw, uid=args.uid, captcha=args.captcha, debug=args.debug)
        except LoginError as e:
            print("✗ Đăng nhập thất bại:", e)
            return 1
        path = args.session or cfg.get("session_file") or DEFAULT_SESSION_FILE
        s.save(path, username=user)
        print("✓ Đăng nhập thành công (%.2fs)" % (time.time() - t0))
        print("  session :", path)
        print("  cookies :", [c.name for c in s.cj])
        out = args.save_cookies or cfg.get("cookies_file")
        if out:
            s.save_cookies_netscape(out)
            print("  file    :", out)
        return 0

    # ---------- LMS (Moodle) ----------
    if args.command == "lms":
        user, pw = resolve_credentials(args, cfg)
        path = args.session or cfg.get("lms_session_file") or DEFAULT_LMS_SESSION_FILE
        # Tái dùng session còn sống nếu có, tránh đăng nhập lại.
        s = None
        if not args.force and os.path.exists(path):
            try:
                cand = Session.load(path)
                if is_lms_logged_in(cand):
                    s = cand
                    print("✓ Session LMS còn sống (%s)" % path)
            except Exception:
                s = None
        if s is None:
            if not user or not pw:
                ap.error("Thiếu username/password (truyền trực tiếp, config.json hoặc IUH_USER/IUH_PASS)")
            try:
                s = lms_login(user, pw, debug=args.debug)
            except LoginError as e:
                print("✗ Đăng nhập LMS thất bại:", e)
                return 1
            s.save(path, username=user)
            print("✓ Đăng nhập LMS thành công (%.2fs)" % (time.time() - t0))
        print("  session :", path)
        print("  cookies :", [c.name for c in s.cj])
        out = args.save_cookies or cfg.get("lms_cookies_file")
        if out:
            s.save_cookies_netscape(out)
            print("  file    :", out)
        return 0

    # ---------- DKHP (đăng ký học phần) ----------
    if args.command == "dkhp":
        user, pw = resolve_credentials(args, cfg)
        if not user or not pw:
            ap.error("Thiếu username/password (truyền trực tiếp, config.json hoặc IUH_USER/IUH_PASS)")
        path = args.session or cfg.get("dkhp_session_file") or DEFAULT_DKHP_SESSION_FILE
        if os.path.exists(path) and not args.force:
            try:
                s = Session.load(path)
                if is_dkhp_logged_in(s):
                    print("✓ Session ĐKHP còn sống (%s)" % path)
                    print("  cookies :", [c.name for c in s.cj])
                    return 0
            except Exception:
                pass
        try:
            cap_mode = args.captcha
            if cap_mode in ("skip", "ocr"):
                cap_mode = "auto"
            s = dkhp_login(user, pw, captcha=cap_mode,
                           auto_seconds=args.captcha_budget,
                           debug=args.debug)
        except LoginError as e:
            print("✗ Đăng nhập ĐKHP thất bại:", e)
            return 1
        s.save(path, username=user)
        print("✓ Đăng nhập ĐKHP thành công (%.2fs)" % (time.time() - t0))
        print("  session :", path)
        print("  cookies :", [c.name for c in s.cj])
        return 0

    # ---------- các lệnh cần session ----------
    try:
        s, path = open_session(args, cfg)
    except LoginError as e:
        print("✗ Đăng nhập thất bại:", e)
        return 1

    if args.command == "check":
        ok = is_logged_in(s)
        print(("✓ Session còn sống" if ok else "✗ Session đã hết hạn")
              + " (%s, %.2fs)" % (path, time.time() - t0))
        return 0 if ok else 1

    if args.command == "cookie":
        print(s.cookie_header())
        return 0

    if args.command == "get":
        url, body = s.fetch(args.arg or "/dashboard.html")
        print(body)
        return 0

    if args.command == "grades":
        data = get_grades(s)
        if args.json:
            _print_json(data)
        else:
            for g in data:
                print("%-12s %-36s %2s tc | TK: %-5s | %-3s | %s" % (
                    g["Mã lớp học phần"][:12], g["Tên môn học/học phần"][:36],
                    g["Số tín chỉ"], g["Điểm tổng kết"], g["Điểm chữ"], g["Xếp loại"]))
        return 0

    if args.command == "schedule":
        data = get_schedule(s, args.week, args.exam)
        if args.json:
            _print_json(data)
        else:
            _print_schedule(data, exam=args.exam)
        return 0

    if args.command == "info":
        data = get_info(s)
        if args.json:
            _print_json({k: v for k, v in data.items() if k != "anh_the"})
        else:
            for k, v in data["fields"].items():
                print("%-20s: %s" % (k, v))
        return 0

    if args.command == "keepalive":
        interval = max(30, args.interval)
        print("Giữ session sống mỗi %ds (Ctrl+C để dừng)" % interval)
        while True:
            stamp = _dt.datetime.now().strftime("%H:%M:%S")
            if is_logged_in(s):
                print("  [%s] ✓ session OK" % stamp)
            else:
                print("  [%s] session hết hạn → đăng nhập lại" % stamp)
                user, pw = resolve_credentials(args, cfg)
                try:
                    s = login(user, pw, uid=args.uid, captcha=args.captcha, debug=args.debug)
                    s.save(path, username=user)
                    print("  [%s] ✓ đã đăng nhập lại" % stamp)
                except LoginError as e:
                    print("  [%s] ✗ %s" % (stamp, e))
            if args.once:
                return 0
            time.sleep(interval)

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nĐã dừng.")
