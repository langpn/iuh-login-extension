# IUH Auto Login

Tự động đăng nhập các cổng của IUH:

- **Cổng sinh viên** — [sv.iuh.edu.vn](https://sv.iuh.edu.vn/sinh-vien-dang-nhap.html) (cần captcha → tool bỏ qua được).
- **LMS Moodle** — [lms.iuh.edu.vn](https://lms.iuh.edu.vn/login/index.php) (không captcha).

> Đăng nhập cổng trường vốn là việc lặp đi lặp lại: mở trang, gõ MSSV, gõ mật khẩu,
> nhập captcha, bấm nút. Mỗi lần mất vài chục giây. Repo này gói việc đó lại thành
> một cú bấm — hoặc một dòng lệnh — và kèm luôn phần lấy lịch học, bảng điểm.
> Điểm thú vị nằm ở chỗ không có mô hình OCR nào ở đây cả: tool **chặn ảnh captcha**
> ngay từ lúc request, và server tự bỏ qua bước kiểm tra. Đơn giản, nhanh, không cần
> model nặng.

## Tính năng

- **Đăng nhập tự động** cổng sinh viên — không cần nhập captcha (xem mục *Captcha*).
- **Đăng nhập tự động LMS Moodle** (`lms.iuh.edu.vn`) — không có captcha, nhanh gọn.
- **Xem điểm** (`grades`) — bảng điểm theo học kỳ.
- **Thời gian biểu** (`schedule`) — lịch học trong tuần, hiển thị **giờ cụ thể**
  (ví dụ *Tiết 7 – 9 → 12:30 – 15:00*) thay vì chỉ số tiết, kèm môn, lớp, phòng,
  giảng viên và link Zoom nếu có.
- **Lịch thi** (`schedule --exam`) và **tuần trước / tuần sau** (`--week -1`, `--week 1`).
- **Thông tin sinh viên** (`info`) — họ tên, MSSV, lớp, khoa, ngành…
- **Giữ session sống** (`keepalive`) — tự động đăng nhập lại khi hết hạn.
- **Xuất JSON** (`--json`) — dễ đưa sang script/app khác.
- **4 cách dùng** — extension, userscript, mở trình duyệt sẵn, hoặc script dòng lệnh.

### Quy đổi tiết → giờ (theo bảng chính thức của IUH)

| Buổi | Tiết | Giờ |
|---|---|---|
| Sáng | 1–3 | 06:30 – 09:00 |
| Sáng | 4–6 | 09:10 – 11:40 |
| Chiều | 7–9 | 12:30 – 15:00 |
| Chiều | 10–12 | 15:10 – 17:40 |
| Tối | 13–15 | 18:00 – 20:40 |
| Tối | 16 | 20:40 – 21:30 |

*(Giữa các nhóm có 10 phút nghỉ giải lao.)*

## Dùng nhanh (chỉ cần đọc mục này)

**Cách đơn giản nhất — dùng Extension** (làm 1 lần, sau đó mở trang login là tự vào):

1. Chrome/Edge/Brave: mở `chrome://extensions` → bật **Developer mode** → **Load unpacked** → chọn thư mục `extension/`
   *(Firefox: mở `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → chọn `extension/manifest.json`)*
2. Bấm icon extension → nhập **MSSV + mật khẩu** → **Lưu**
3. Mở https://sv.iuh.edu.vn/sinh-vien-dang-nhap.html → tự đăng nhập
4. Muốn vào LMS: bấm icon → **Mở LMS** (hoặc mở thẳng https://lms.iuh.edu.vn/login/index.php) → tự đăng nhập
5. Muốn vào ĐKHP: bấm icon → **Mở ĐKHP** → form điền sẵn, chỉ cần gõ **mã bảo vệ** rồi Enter

**Nếu chỉ muốn chạy bằng dòng lệnh** (không cài gì, cần Python sẵn có):

```bash
cd "/Users/langpn/Documents/Default Project/iuh_login"
python3 iuh_login.py login <MSSV> <MATKHAU>   # đăng nhập cổng SV, lưu session.json
python3 iuh_login.py lms                     # đăng nhập LMS, lưu lms_session.json
python3 iuh_login.py grades                  # xem điểm
python3 iuh_login.py schedule                # lịch học tuần này
python3 iuh_login.py info                    # thông tin sinh viên
```

**Chọn theo nhu cầu:**

| Bạn muốn | Dùng |
|---|---|
| Đăng nhập nhanh trên trình duyệt (SV + LMS) | **Extension** (đơn giản nhất) |
| Không cài extension, chạy mọi trình duyệt | Userscript (cần Tampermonkey) |
| Mở trình duyệt đã login sẵn để dùng web | `iuh_browser.py` |
| Lấy điểm/lịch, viết script | `iuh_login.py` |

---

## Chi tiết từng cách

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
6. Vào LMS: bấm icon → **Mở LMS**, hoặc mở thẳng https://lms.iuh.edu.vn/login/index.php.

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

Tùy chọn: `--headless`, `--channel chrome|chromium|msedge`, `--keep-open`, `--save-cookies FILE`, `--lms`, `--debug`.

Thêm `--lms` để đăng nhập LMS Moodle thay vì cổng SV:

```bash
python3 iuh_browser.py --lms <MSSV> <MATKHAU>     # mở LMS, tự đăng nhập
```

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
python3 iuh_login.py lms <MSSV> <MATKHAU>         # đăng nhập LMS Moodle, lưu lms_session.json
python3 iuh_login.py logout                      # đăng xuất cổng SV
```

Thêm `--json` để xuất JSON (dễ đưa vào script khác). Ví dụ:

```bash
python3 iuh_login.py grades --json > diem.json
```

### Ví dụ kết quả thời gian biểu

```
Thứ 3  29/09/2026 | Tối    | 18:50 - 21:30 | Phát triển hệ thống tích hợp | DHCNTT21BVL - 428801447201 | Trần Thị Minh Khoa
                            └ Tiết 14 - 16 · Trực tuyến (Cơ sở 1) · Zoom FIT30: 662 722 8932 / 123456

Tổng: 7 buổi, 18 giờ 10 phút
```

Giờ được tính từ số tiết theo bảng chính thức, kèm tổng số buổi và tổng giờ.

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
- `session.json`, `lms_session.json`, `cookies.txt`, `config.json` chứa thông tin đăng nhập — đã bị `.gitignore`, **đừng** commit.
- Chỉ dùng cho tài khoản của chính bạn.

## Cấu trúc

```
iuh_login.py            # script chính (Python chuẩn)
iuh_browser.py          # mở trình duyệt tự đăng nhập (Playwright)
iuh-autologin.user.js   # userscript Tampermonkey
extension/              # tiện ích trình duyệt (Chrome/Edge/Firefox)
config.example.json     # mẫu cấu hình
```
