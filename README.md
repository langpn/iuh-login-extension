# ⚡ IUH Fast Login & Enhanced Student Portal

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?style=for-the-badge&logo=googlechrome" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/IUH-sv.iuh.edu.vn-red?style=for-the-badge" alt="IUH Portal" />
  <img src="https://img.shields.io/badge/Platform-Chrome%20|%20Edge%20|%20Brave%20|%20Firefox-success?style=for-the-badge" alt="Browsers" />
  <img src="https://img.shields.io/badge/Theme-Dark%20%26%20Light%20Aurora-purple?style=for-the-badge" alt="Themes" />
  <img src="https://img.shields.io/badge/Performance-60fps%20GPU-brightgreen?style=for-the-badge" alt="60fps" />
</p>

Bộ công cụ tự động đăng nhập, giữ sống phiên và tối ưu hóa giao diện toàn diện cho sinh viên **Đại học Công nghiệp TP.HCM (IUH)**:
- 🏛️ **Cổng sinh viên** (`sv.iuh.edu.vn`) — Tự động đăng nhập, vượt captcha ở tầng mạng (server bỏ qua kiểm tra captcha).
- 📅 **Thời khóa biểu tuần siêu tối ưu** (`sv.iuh.edu.vn/lich-theo-tuan.html`) — Giao diện Dark/Light Mode Aurora hiện đại, mở rộng 100% full width, menu hover mép trái, chia đều 7 cột, chữ đen sắc nét 100%, in đậm giờ học thực tế và giảng viên.
- 📚 **LMS Moodle** (`lms.iuh.edu.vn`) — Tự động điền tài khoản và đăng nhập siêu tốc.
- 📝 **Cổng ĐKHP** (`dkhp.iuh.edu.vn`) — Tự động điền tài khoản, giao diện phóng to captcha khử nhiễu 4 ô ký tự sắc nét, tự động in hoa và tự submit khi gõ đủ 4 ký tự.
- 🔄 **Giữ phiên sống liên tục (Keepalive)** — Tự động ping ngầm định kỳ 10 phút để không bao giờ bị văng sau 20 phút.
- ⚡ **Siêu nhẹ & Tối ưu hiệu năng** — Áp dụng `document_start` triệt tiêu chớp nháy (0ms FOUC), tăng tốc phần cứng GPU (`will-change: transform`), giảm ~85% xung nhịp CPU.

---

## 🎯 Chọn công cụ phù hợp với bạn

Dự án gồm **4 vùng công cụ độc lập**, bạn chỉ cần lấy phần tương ứng với nhu cầu sử dụng:

| Vùng | Cách dùng | Đối tượng phù hợp | Thư mục / File cần lấy | Yêu cầu cài thêm |
|---|---|---|---|---|
| **1** | **Browser Extension** *(Khuyên dùng)* | Dùng hằng ngày trên trình duyệt, đầy đủ UI Dark/Light & Keepalive | Thư mục `extension/` | Không cần |
| **2** | **Userscript** | Thích siêu nhẹ, đã có Tampermonkey/Violentmonkey | File `iuh-autologin.user.js` | Tiện ích Tampermonkey |
| **3** | **Python CLI Script** | Xem điểm, lịch học, cron keepalive, xuất JSON | File `iuh_login.py` | Không (Python chuẩn) |
| **4** | **Browser Automation** | Dòng lệnh terminal tự bật trình duyệt thật và login | File `iuh_browser.py` | `pip install playwright` |

---

## 🌟 1. Browser Extension (Khuyên dùng)

> Tương thích hoàn hảo với **Google Chrome, Microsoft Edge, Brave, Cốc Cốc, Opera và Mozilla Firefox**.

### 💎 Tính năng nổi bật

#### 1. Giao diện Thời khóa biểu hoàn toàn mới (`sv.iuh.edu.vn/lich-theo-tuan.html`):
- **Chế độ Sáng / Tối (Dark & Light Mode 1-Click)**:
  - Tích hợp nút chuyển đổi nhanh ở góc phải thanh tiêu đề (`☀️ Chế độ sáng` / `🌙 Chế độ tối`), tự động lưu trạng thái vào `storage.local`.
  - Dark Mode mang phong cách **Aurora Cosmos Glassmorphism** (tông Deep Navy huyền bí, viền Cyan phát sáng, hiệu ứng làm mờ kính 20px).
  - Light Mode phong cách **Soft Elevation 3D** dịu mắt, sạch sẽ.
- **Mở rộng 100% Full Width**:
  - Khung thời khóa biểu chiếm trọn 100% diện tích màn hình, giải phóng hơn 230px chiều ngang.
  - Cột thời gian 75px cố định; **7 cột Thứ 2 đến Chủ nhật tự chia đều tuyệt đối** (`calc((100% - 75px) / 7)`).
- **Thu gọn Menu Bar thành Icon Hover mép trái (`☰ MENU`)**:
  - Cột menu chuyển thành ngăn kéo trượt **Off-canvas Drawer** ẩn bên mép trái (`translateX(-100%)`).
  - Rê chuột vào icon `☰ MENU` để menu trượt ra mượt mà 60fps; tích hợp **bộ đệm chống giật 250ms** giúp điều khiển đầm tay, không bị đóng đột ngột.
  - Giữ nguyên ảnh mã QR OneUni và hiệu ứng accordion dropdown trơn tru.
- **Tối ưu khả năng đọc & Tiếp cận (Accessibility)**:
  - **100% Chữ đen sắc nét** (`#000000`) bên trong các thẻ môn học, xóa sạch chữ trắng mờ khó nhìn.
  - **In đậm thời gian học thực tế** (vd: `06:30 - 09:00`) và **in đậm tên Giảng viên**.
  - **Nổi bật cột ngày hôm nay**: Tự động nhận diện chính xác ngày hiện tại theo lịch hệ thống kèm huy hiệu nổi bật `[HÔM NAY]`.
  - Tự động sửa lỗi font hiển thị `Tr?c tuy?n` thành `Trực tuyến`.
  - Căn giữa thanh chú thích (Legend) ở chân bảng.
- **Menu Hồ sơ người dùng sang trọng**:
  - Khắc phục triệt để lỗi chữ trắng trên nền trắng trong dropdown tài khoản cá nhân.
  - Tự động gắn icon trực quan (👤 *Thông tin cá nhân*, 🔑 *Đổi mật khẩu*, 🚪 *Đăng xuất* kèm cảnh báo đỏ).
  - Loại bỏ các thành phần rác: logo trường, thanh tìm kiếm, nút In lịch và nút Zoom toàn màn hình.

#### 2. Cổng Đăng ký học phần (`dkhp.iuh.edu.vn`):
- Đồng bộ Dark/Light Mode với Cổng sinh viên.
- Tự động điền **MSSV** và **Mật khẩu**.
- **Khối Captcha khử nhiễu phóng to**: Hiển thị song song ảnh gốc và 4 ô ký tự đã khử sạch nhiễu hạt, gạch ngang.
- Tự động chuyển chữ in hoa và **tự động Submit** ngay khi gõ đủ 4 ký tự.

#### 3. Cổng sinh viên & LMS Moodle:
- Bỏ qua captcha Cổng SV 100% tự động bằng DeclarativeNetRequest ở tầng mạng.
- Tự động điền và đăng nhập LMS Moodle trong chớp mắt.

#### 4. Phiên đăng nhập sống cả ngày (Session Keepalive):
- Chạy ngầm định kỳ 10 phút gửi ping nhẹ giữ cookie (`ASC.AUTH`, `.ASPXFORMSAUTH`, `MoodleSession`).
- Không còn nỗi lo bị văng ra trang đăng nhập sau 20 phút không hoạt động.

#### 5. Hiệu năng siêu tốc:
- Áp dụng `document_start` giúp nạp theme tức thì, **0ms chớp nháy (FOUC)**.
- Tăng tốc phần cứng GPU (`will-change: transform`).
- Tối ưu hóa `MutationObserver` và bộ nhớ đệm cache, thời gian xử lý chỉ mất **~0.79ms**.

---

### 📦 Hướng dẫn cài đặt Extension (chỉ 1 lần)

1. Tải hoặc clone thư mục `extension/` về máy tính.
2. Trên trình duyệt **Chrome / Edge / Brave / Cốc Cốc**:
   - Truy cập `chrome://extensions` (hoặc `edge://extensions`).
   - Bật công tắc **Developer mode** (Chế độ cho nhà phát triển) ở góc trên bên phải.
   - Bấm nút **Load unpacked** (Tải tiện ích đã giải nén) → chọn thư mục `extension/`.
3. Trên **Mozilla Firefox**:
   - Truy cập `about:debugging#/runtime/this-firefox`.
   - Bấm **Load Temporary Add-on…** → chọn file `extension/manifest.json`.
4. Bấm vào icon tiện ích trên thanh công cụ → nhập **MSSV** và **Mật khẩu** → bấm **Lưu cài đặt**.
5. Mở Cổng sinh viên, ĐKHP hoặc Thời khóa biểu để tận hưởng trải nghiệm!

---

## 📜 2. Userscript (Tampermonkey / Violentmonkey)

> Giải pháp siêu nhẹ dành cho người dùng đã có sẵn tiện ích quản lý userscript.

1. Cài đặt tiện ích **Tampermonkey** hoặc **Violentmonkey** trên trình duyệt.
2. Tạo script mới, copy toàn bộ nội dung file `iuh-autologin.user.js` dán vào và lưu lại.
3. Khi mở Cổng SV hoặc LMS, userscript sẽ tự động lưu thông tin và đăng nhập cho các lần sau.

---

## 💻 3. Python CLI Script (Chuẩn không cần cài thư viện)

> Dành cho lập trình viên, tra cứu nhanh trong terminal, chạy cron job giữ phiên hoặc xuất dữ liệu JSON. Chỉ cần file `iuh_login.py`.

```bash
# Đăng nhập Cổng sinh viên (lưu phiên vào session.json)
python3 iuh_login.py login <MSSV> <MATKHAU>

# Xem thời khóa biểu tuần hiện tại (kèm giờ học, phòng học, giảng viên)
python3 iuh_login.py schedule

# Xem lịch tuần sau (--week 1) hoặc tuần trước (--week -1)
python3 iuh_login.py schedule --week 1

# Xem lịch thi
python3 iuh_login.py schedule --exam

# Xem bảng điểm chi tiết
python3 iuh_login.py grades

# Xuất dữ liệu ra file JSON
python3 iuh_login.py schedule --json > lich_hoc.json
python3 iuh_login.py grades --json > bang_diem.json

# Đăng nhập LMS Moodle
python3 iuh_login.py lms <MSSV> <MATKHAU>

# Đăng nhập Cổng ĐKHP
python3 iuh_login.py dkhp <MSSV> <MATKHAU>

# Giữ phiên đăng nhập liên tục (mặc định 10 phút ping 1 lần)
python3 iuh_login.py keepalive --interval 600

# Kiểm tra trạng thái phiên / Đăng xuất
python3 iuh_login.py check
python3 iuh_login.py logout
```

---

## 🤖 4. Browser Automation Script (Playwright)

> Dùng lệnh dòng lệnh để tự động bật trình duyệt thật, login và chuyển thẳng đến trang cần xem.

```bash
# Cài đặt môi trường
pip install playwright
playwright install chromium

# Đăng nhập và mở thẳng trang Lịch học tuần
python3 iuh_browser.py --schedule <MSSV> <MATKHAU>

# Đăng nhập và mở LMS Moodle
python3 iuh_browser.py --lms <MSSV> <MATKHAU>

# Giữ trình duyệt luôn mở không tự tắt
python3 iuh_browser.py --keep-open <MSSV> <MATKHAU>
```

---

## ⏰ Bảng quy đổi Tiết → Giờ học chuẩn IUH

| Buổi | Tiết học | Khung giờ chi tiết |
|:---:|:---:|:---:|
| **Sáng** | Tiết 1 – 3 | **06:30 – 09:00** |
| **Sáng** | Tiết 4 – 6 | **09:10 – 11:40** |
| **Chiều** | Tiết 7 – 9 | **12:30 – 15:00** |
| **Chiều** | Tiết 10 – 12 | **15:10 – 17:40** |
| **Tối** | Tiết 13 – 15 | **18:00 – 20:40** |
| **Tối** | Tiết 16 | **20:40 – 21:30** |

*(Giữa các ca học có 10 phút giải lao).*

---

## 🔒 Bảo mật & Riêng tư

- **100% Cục bộ**: Toàn bộ thông tin tài khoản và mật khẩu được lưu trữ an toàn ngay trên máy tính của bạn (`chrome.storage.local` hoặc file `session.json` cục bộ).
- **Không qua trung gian**: Tiện ích không sử dụng bất kỳ máy chủ trung gian hay dịch vụ theo dõi/phân tích nào. Mọi kết nối đều truyền trực tiếp giữa máy bạn và hệ thống của Đại học Công nghiệp TP.HCM (`*.iuh.edu.vn`).
- **Mã nguồn mở**: Bạn hoàn toàn có thể kiểm tra từng dòng mã nguồn để an tâm sử dụng.

---

<p align="center">Được phát triển với ❤️ dành cho cộng đồng sinh viên IUH.</p>
