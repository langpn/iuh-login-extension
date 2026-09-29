# IUH Auto Login

Tự động đăng nhập cổng sinh viên **sv.iuh.edu.vn**. Không cần nhập captcha.

Có 4 cách dùng, chọn **một**:

| Cách | Khi nào dùng | Cần cài |
|---|---|---|
| **Extension** | Muốn login nhanh nhất trên trình duyệt | Không |
| **Userscript** | Dùng Tampermonkey, chạy mọi trình duyệt | Tampermonkey |
| **`iuh_browser.py`** | Mở sẵn trình duyệt đã đăng nhập để dùng web | `pip install playwright` |
| **`iuh_login.py`** | Viết script / lấy dữ liệu (điểm, lịch…) | Không (Python chuẩn) |

---

## 1. Extension (nhanh nhất, khuyến nghị)

1. Mở `chrome://extensions` (hoặc `edge://extensions`, `brave://extensions`).
2. Bật **Developer mode**.
3. Bấm **Load unpacked** → chọn thư mục `extension/`.
4. Bấm icon extension → nhập **MSSV + mật khẩu** → **Lưu**.
5. Mở https://sv.iuh.edu.vn/sinh-vien-dang-nhap.html → tự đăng nhập.

Firefox: mở `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → chọn `extension/manifest.json`.

> Nếu bạn muốn tài khoản chỉ nằm trên máy mình: bấm icon → **Xoá tài khoản** sau khi dùng.

---

## 2. Userscript (Tampermonkey)

1. Cài extension **Tampermonkey**.
2. Mở dashboard Tampermonkey → **Create a new script** → dán toàn bộ nội dung `iuh-autologin.user.js` → **Save**.
3. Lần đầu mở trang login, script hỏi tài khoản/mật khẩu → nhập một lần, các lần sau tự đăng nhập.

Đổi tài khoản: menu Tampermonkey → *IUH Fast Login* → **Xoá tài khoản đã lưu**.

---

## 3. `iuh_browser.py` (mở trình duyệt đã đăng nhập)

```bash
pip install playwright
python3 iuh_browser.py <MSSV> <MATKHAU>            # mở Chrome, tự đăng nhập rồi để đó dùng tiếp
python3 iuh_browser.py --headless                   # chạy ẩn, đọc IUH_USER / IUH_PASS
python3 iuh_browser.py --channel msedge             # dùng Edge
python3 iuh_browser.py --save-cookies cookies.txt   # lưu cookie để dùng với curl
```

Tùy chọn: `--headless`, `--channel chrome|chromium|msedge`, `--keep-open`, `--save-cookies FILE`, `--debug`.

---

## 4. `iuh_login.py` (script / lấy dữ liệu)

Không cần cài gì (Python chuẩn).

```bash
python3 iuh_login.py login <MSSV> <MATKHAU>     # đăng nhập, lưu session.json
python3 iuh_login.py check                       # session còn sống không
python3 iuh_login.py grades                      # bảng điểm
python3 iuh_login.py schedule                    # lịch học tuần này (giờ cụ thể)
python3 iuh_login.py schedule --week -1          # tuần trước
python3 iuh_login.py schedule --exam             # lịch thi
python3 iuh_login.py info                        # thông tin sinh viên
python3 iuh_login.py cookie                      # in cookie đang dùng
python3 iuh_login.py keepalive --interval 600    # giữ session sống, 10 phút/lần
python3 iuh_login.py logout                      # đăng xuất
```

Thêm `--json` để xuất JSON (dễ đưa vào script khác). Ví dụ:

```bash
python3 iuh_login.py grades --json > diem.json
```

### Lưu tài khoản

Không muốn gõ mật khẩu mỗi lần, chọn một trong hai:

```bash
export IUH_USER=<MSSV>
export IUH_PASS=<MATKHAU>
```

Hoặc copy `config.example.json` → `config.json` rồi điền (file này đã bị `.gitignore`).

---

## Captcha — nói thẳng

Server IUH **bắt buộc captcha nếu ảnh captcha đã được tải**. Cả 4 công cụ trên đều
dùng chung một mẹo: **chặn request ảnh captcha** (ở tầng mạng hoặc không gọi
endpoint), nên server bỏ qua captcha.

- Extension / userscript / `iuh_browser.py`: chặn request ảnh captcha.
- `iuh_login.py`: không bao giờ gọi endpoint ảnh captcha.

Nếu server vá lỗ hổng này, `iuh_login.py` vẫn có đường nhập tay / OCR:
`--captcha manual` (tự nhập), `--captcha ocr` (dùng tesseract), `--captcha text:ABCD` (điền sẵn).

---

## Lưu ý

- **Một phiên mỗi tài khoản.** Đang đăng nhập nơi khác thì login mới có thể bị từ chối;
  đợi vài giây rồi thử lại (các tool đã tự thử lại).
- Đừng đăng nhập quá nhanh liên tục (chờ ~6–8 giây giữa các lần).
- `session.json`, `cookies.txt`, `config.json` chứa thông tin đăng nhập — đã bị `.gitignore`, **đừng** commit.
- Chỉ dùng cho tài khoản của chính bạn.

## Cấu trúc

```
iuh_login.py            # script chính (Python chuẩn)
iuh_browser.py          # mở trình duyệt tự đăng nhập (Playwright)
iuh-autologin.user.js   # userscript Tampermonkey
extension/              # tiện ích trình duyệt (Chrome/Edge/Firefox)
config.example.json     # mẫu cấu hình
```
