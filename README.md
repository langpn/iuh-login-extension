# IUH Fast Login

Bộ công cụ tự động đăng nhập các cổng thông tin Đại học Công nghiệp TP.HCM (IUH):
- **Cổng sinh viên** (`sv.iuh.edu.vn`) — Tự động vượt captcha bằng cơ chế chặn request ảnh ở tầng mạng (server tự bỏ qua kiểm tra captcha).
- **LMS Moodle** (`lms.iuh.edu.vn`) — Tự động điền tài khoản và đăng nhập nhanh.
- **Cổng ĐKHP** (`dkhp.iuh.edu.vn`) — **Tự động giải captcha** bằng mô hình Micro-CNN offline (< 150 KB, chạy 100% trong browser) và tự động đăng nhập.
- **Giữ phiên sống cả ngày (Keepalive)** — Tự động ping ngầm giữ cookie (`ASC.AUTH`, `.ASPXFORMSAUTH`) để không bị văng ra sau 20 phút.
- **Lịch học theo tuần** — Tự động quy đổi số tiết (*Tiết 7-9*) thành **khung giờ cụ thể** (*12:30 - 15:00*).

---

## 🎯 Chọn công cụ phù hợp với bạn

Dự án gồm **4 vùng công cụ độc lập**. Bạn chỉ cần tải đúng thư mục hoặc file tương ứng với nhu cầu, **không cần tải toàn bộ mã nguồn**:

| Vùng | Cách dùng | Đối tượng phù hợp | File / Thư mục cần lấy | Cài đặt thêm |
|---|---|---|---|---|
| **1** | **Browser Extension** *(Khuyên dùng)* | Dùng hằng ngày trên trình duyệt, có popup tiện lợi | Thư mục `extension/` | Không cần |
| **2** | **Userscript** | Thích siêu nhẹ, đã có Tampermonkey/Violentmonkey | File `iuh-autologin.user.js` | Tiện ích Tampermonkey |
| **3** | **Python CLI Script** | Xem điểm, lịch học, cron keepalive, xuất JSON | File `iuh_login.py` | Không (Python chuẩn) |
| **4** | **Browser Automation** | Dòng lệnh tự bật trình duyệt thật và đăng nhập sẵn | File `iuh_browser.py` | `pip install playwright` |

---

## 1. Browser Extension (Khuyên dùng)

> Phù hợp nhất cho đa số sinh viên. Hoạt động trên Chrome, Edge, Brave, Cốc Cốc, Firefox.

### Điểm nổi bật
- **Bỏ qua captcha** cổng sinh viên 100% tự động.
- **Tự động giải captcha ĐKHP**: Mô hình AI Micro-CNN siêu nhẹ tích hợp sẵn bên trong extension, đọc và điền mã 4 ký tự in hoa trong chớp mắt.
- **Giữ phiên sống cả ngày**: Tự động duy trì phiên đăng nhập (keepalive), không lo bị timeout. Tái sử dụng session cookie mở thẳng portal.
- **Popup tiện ích**: Mở nhanh Cổng SV, LMS, ĐKHP hoặc nhảy thẳng vào trang Lịch học chỉ với 1 click.
- **Hiện giờ học thực tế**: Tự đổi các số tiết trên trang thời khóa biểu sang giờ học cụ thể.

### Hướng dẫn cài đặt
1. Tải riêng thư mục `extension/` về máy.
2. Trên trình duyệt (Chrome, Edge, Brave, Cốc Cốc):
   - Truy cập `chrome://extensions` (hoặc `edge://extensions`).
   - Bật **Developer mode** (Chế độ dành cho nhà phát triển).
   - Bấm **Load unpacked** (Tải tiện ích đã giải nén) → chọn thư mục `extension/`.  
   *(Với Firefox: Mở `about:debugging#/runtime/this-firefox` → chọn **Load Temporary Add-on** → chọn file `extension/manifest.json`)*.
3. Bấm icon extension trên thanh công cụ → nhập **MSSV** và **Mật khẩu** → bấm **Lưu**.
4. Khi mở các trang cổng trường, extension sẽ tự động điền và đăng nhập.

---

## 2. Userscript (Tampermonkey)

> Giải pháp siêu nhẹ dành cho ai đã quen dùng tiện ích quản lý userscript.

### Hướng dẫn cài đặt
1. Tải file `iuh-autologin.user.js`.
2. Cài đặt tiện ích **Tampermonkey** hoặc **Violentmonkey** trên trình duyệt của bạn.
3. Mở tiện ích → Thêm script mới → dán toàn bộ nội dung file `iuh-autologin.user.js` vào và lưu lại.
4. Mở trang đăng nhập Cổng sinh viên hoặc LMS, script sẽ hỏi lưu MSSV / mật khẩu và tự đăng nhập cho các lần sau.

---

## 3. CLI Script (Python chuẩn)

> Dành cho lập trình viên, tra cứu thông tin nhanh bằng terminal, chạy cron job giữ phiên, hoặc xuất dữ liệu điểm/lịch ra JSON. Không cần cài thêm thư viện `pip` nào.

### File cần tải
Chỉ cần tải 1 file `iuh_login.py`.

### Các lệnh thường dùng
```bash
# Đăng nhập Cổng sinh viên (lưu session vào session.json)
python3 iuh_login.py login <MSSV> <MATKHAU>

# Xem lịch học tuần này (kèm giờ học chi tiết, phòng, giảng viên)
python3 iuh_login.py schedule

# Xem lịch tuần trước (--week -1) hoặc tuần sau (--week 1)
python3 iuh_login.py schedule --week 1

# Xem lịch thi
python3 iuh_login.py schedule --exam

# Xem bảng điểm theo học kỳ
python3 iuh_login.py grades

# Xuất kết quả ra file JSON
python3 iuh_login.py schedule --json > lich_hoc.json
python3 iuh_login.py grades --json > bang_diem.json

# Đăng nhập LMS Moodle
python3 iuh_login.py lms <MSSV> <MATKHAU>

# Đăng nhập Cổng ĐKHP
python3 iuh_login.py dkhp <MSSV> <MATKHAU>

# Giữ phiên đăng nhập sống liên tục (mặc định 10 phút ping 1 lần)
python3 iuh_login.py keepalive --interval 600

# Kiểm tra trạng thái session / Đăng xuất
python3 iuh_login.py check
python3 iuh_login.py logout
```

---

## 4. Browser Automation Script (Playwright)

> Dùng lệnh terminal để tự động bật một cửa sổ trình duyệt thật, tự login và chuyển thẳng đến trang bạn cần.

### Cài đặt môi trường
```bash
pip install playwright
playwright install chromium
```

### Sử dụng
Chỉ cần tải file `iuh_browser.py`:
```bash
# Đăng nhập và mở thẳng trang Lịch học tuần
python3 iuh_browser.py --schedule <MSSV> <MATKHAU>

# Đăng nhập và mở LMS Moodle
python3 iuh_browser.py --lms <MSSV> <MATKHAU>

# Giữ trình duyệt luôn mở không tự tắt
python3 iuh_browser.py --keep-open <MSSV> <MATKHAU>
```

---

## ⏰ Bảng quy đổi Tiết → Giờ học chuẩn IUH

| Buổi | Tiết | Khung giờ |
|---|---|---|
| **Sáng** | Tiết 1 – 3 | 06:30 – 09:00 |
| **Sáng** | Tiết 4 – 6 | 09:10 – 11:40 |
| **Chiều** | Tiết 7 – 9 | 12:30 – 15:00 |
| **Chiều** | Tiết 10 – 12 | 15:10 – 17:40 |
| **Tối** | Tiết 13 – 15 | 18:00 – 20:40 |
| **Tối** | Tiết 16 | 20:40 – 21:30 |

*(Giữa các ca học có 10 phút giải lao).*

---

## 🔒 Lưu ý & Bảo mật
- **Bảo mật tuyệt đối**: Tài khoản và mật khẩu chỉ lưu cục bộ trên máy bạn (`storage.local` của extension hoặc file `.json` nội bộ), không bao giờ gửi ra bên ngoài.
- **Giới hạn phiên**: Cổng SV IUH chỉ cho phép duy nhất 1 phiên đăng nhập tại một thời điểm cho mỗi tài khoản.
- **Cổng ĐKHP**: Cổng ĐKHP bắt buộc kiểm tra mã bảo vệ (4 ký tự in hoa/số). Extension đã tích hợp sẵn mô hình Micro-CNN offline tự động nhận diện và điền mã cho bạn. Nếu lần đầu đoán sai, extension tự làm mới ảnh và thử lại.
