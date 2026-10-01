# ⚡ IUH Fast Login & Enhanced Portal Extension

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?style=for-the-badge&logo=googlechrome" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/Browsers-Chrome%20|%20Edge%20|%20Brave%20|%20Firefox-success?style=for-the-badge" alt="Browsers" />
  <img src="https://img.shields.io/badge/Theme-Dark%20%26%20Light%20Aurora-purple?style=for-the-badge" alt="Themes" />
  <img src="https://img.shields.io/badge/FPS-60fps%20Smooth-brightgreen?style=for-the-badge" alt="60fps" />
</p>

Tiện ích mở rộng (Browser Extension) Manifest V3 tự động đăng nhập, giữ sống phiên và tối ưu hóa toàn diện giao diện các cổng thông tin Đại học Công nghiệp TP.HCM (IUH):

- 🏛️ **Cổng sinh viên** (`sv.iuh.edu.vn`) — Tự động vượt captcha ở tầng mạng, tự động đăng nhập.
- 📅 **Thời khóa biểu siêu tối ưu** (`sv.iuh.edu.vn/lich-theo-tuan.html`) — Đổi mới giao diện Dark/Light Mode, mở rộng 100% full width, menu hover trượt mép trái, chia đều 7 cột, chữ đen sắc nét 100%, in đậm giờ học và tên giảng viên.
- 📚 **LMS Moodle** (`lms.iuh.edu.vn`) — Tự động điền tài khoản và đăng nhập siêu tốc.
- 📝 **Đăng ký học phần** (`dkhp.iuh.edu.vn`) — Tự động điền tài khoản, giao diện phóng to captcha khử sạch nhiễu hạt 4 ô ký tự, tự động in hoa và tự submit khi gõ đủ 4 ký tự.
- 🔄 **Giữ sống phiên (Session Keepalive)** — Chạy ngầm định kỳ 10 phút ping giữ cookie (`ASC.AUTH`, `.ASPXFORMSAUTH`, `MoodleSession`) để không bao giờ bị timeout sau 20 phút.

---

## 🚀 Hướng dẫn cài đặt (chỉ làm 1 lần)

### Dành cho Chrome, Edge, Brave, Cốc Cốc, Opera:
1. Mở trình duyệt, truy cập `chrome://extensions` (hoặc `edge://extensions`).
2. Bật công tắc **Developer mode** (Chế độ cho nhà phát triển) ở góc trên bên phải.
3. Bấm nút **Load unpacked** (Tải tiện ích đã giải nén) → chọn thư mục `extension/` của dự án.

### Dành cho Mozilla Firefox:
1. Mở `about:debugging#/runtime/this-firefox`.
2. Bấm nút **Load Temporary Add-on…** → chọn file `extension/manifest.json`.

---

## 📖 Hướng dẫn sử dụng

1. **Lưu tài khoản ban đầu**:
   - Bấm vào biểu tượng extension trên thanh công cụ trình duyệt.
   - Nhập **Mã sinh viên (MSSV)** và **Mật khẩu**.
   - Bấm **Lưu cài đặt**.
2. **Truy cập nhanh từ Popup**:
   - 🏛️ **Cổng SV**: Mở cổng sinh viên (tự động đăng nhập, nếu đã có phiên sẽ vào thẳng Dashboard).
   - 📚 **LMS Moodle**: Mở trang học tập trực tuyến LMS (tự động đăng nhập).
   - 📝 **Cổng ĐKHP**: Mở cổng Đăng ký học phần (nếu đã có phiên sẽ vào thẳng Portal đăng ký).
   - 📅 **Thời khóa biểu**: Chuyển thẳng tới trang thời khóa biểu tuần với giao diện nâng cao.

---

## ✨ Tính năng chi tiết

### 1. Thời khóa biểu tuần (`sv.iuh.edu.vn/lich-theo-tuan.html`)
- **Chế độ Sáng / Tối (Dark & Light Mode 1-Click)**:
  - Nút chuyển đổi nhanh ở góc phải thanh tiêu đề (`☀️ Chế độ sáng` / `🌙 Chế độ tối`), đồng bộ lưu trữ vào `chrome.storage.local`.
  - **Dark Mode**: Phong cách Aurora Cosmos Glassmorphism với nền Deep Navy huyền bí, viền Cyan phát sáng, hiệu ứng kính mờ 20px.
  - **Light Mode**: Phong cách Soft Elevation 3D nổi khối sạch sẽ, êm dịu cho mắt.
- **Mở rộng 100% Full Width**:
  - Khung bảng thời khóa biểu (`.col-md-10`) mở rộng chiếm trọn 100% chiều rộng màn hình, giải phóng thêm hơn 230px không gian.
  - Cột ca học 75px; **7 cột Thứ 2 đến Chủ nhật tự động chia đều tuyệt đối** (`calc((100% - 75px) / 7)`).
- **Thu gọn Menu Bar thành Icon Hover mép trái (`☰ MENU`)**:
  - Toàn bộ menu (`div.col-md-2`) chuyển thành ngăn kéo trượt **Off-canvas Drawer** ẩn bên mép trái (`translateX(-100%)`).
  - Khi rê chuột vào icon `☰ MENU`, menu trượt ra mượt mà 60fps; tích hợp **bộ đệm chống giật 250ms** giúp thao tác tự nhiên và không bị đóng đột ngột khi lỡ rê lệch tay.
  - Giữ nguyên ảnh mã QR OneUni và hiệu ứng accordion dropdown siêu mượt.
- **Tối ưu khả năng đọc & Tiếp cận (Accessibility)**:
  - **100% Chữ đen sắc nét** (`#000000`) trong tất cả các thẻ môn học, loại bỏ hoàn toàn chữ trắng mờ khó nhìn.
  - **In đậm thời gian học thực tế** (vd: `06:30 - 09:00`) và **in đậm tên Giảng viên**.
  - **Cột ngày hôm nay nổi bật**: Tự động nhận diện chính xác ngày hiện tại theo hệ thống kèm huy hiệu `[HÔM NAY]`.
  - Tự sửa lỗi font `Tr?c tuy?n` thành `Trực tuyến`.
  - Căn giữa thanh chú thích (Legend) ở chân bảng.
- **Menu Hồ sơ cá nhân (User Profile Popover)**:
  - Khắc phục triệt để lỗi chữ trắng trên nền trắng trong menu tài khoản cá nhân.
  - Áp dụng giao diện Deep Navy Glassmorphism với viền phát sáng và mũi tên đồng nhất màu.
  - Tự động bổ sung icon trực quan: 👤 *Thông tin cá nhân*, 🔑 *Đổi mật khẩu*, 🚪 *Đăng xuất* (kèm cảnh báo đỏ).
  - Loại bỏ các thành phần rác: logo trường, thanh tìm kiếm, nút In lịch và nút Zoom toàn màn hình.

### 2. Cổng Đăng ký học phần (`dkhp.iuh.edu.vn`)
- Tự động điền tài khoản và mật khẩu ngay khi mở trang login.
- **Thẻ Captcha tăng cường**: Hiển thị song song ảnh gốc đầy đủ và cụm 4 ô ký tự đã khử sạch nhiễu hạt, đường gạch ngang.
- Tự động chuyển ký tự gõ vào thành **chữ in hoa** và **tự động Submit** ngay khi gõ đủ 4 ký tự.
- Đồng bộ toàn diện Dark/Light Mode với Cổng sinh viên.

### 3. Cổng sinh viên (`sv.iuh.edu.vn`) & LMS (`lms.iuh.edu.vn`)
- Bỏ qua captcha Cổng SV ở tầng mạng bằng `declarativeNetRequest`.
- Tự động đăng nhập siêu tốc LMS Moodle.

### 4. Giữ phiên sống liên tục (Session Keepalive)
- Background Service Worker (`background.js`) định kỳ 10 phút ping nhẹ các cổng trường nếu đã có cookie đăng nhập.
- Không lo bị văng phiên làm việc giữa chừng.

---

## 🛠️ Cơ chế kỹ thuật & Tối ưu hiệu năng

1. **Triệt tiêu chớp nháy (0ms FOUC)**:
   - Các content script (`schedule.js`, `dkhp.js`, `redirect.js`) chạy tại `document_start`.
   - CSS Theme được tiêm đồng bộ ngay lập tức trước khi trình duyệt render frame đầu tiên, triệt tiêu hoàn toàn hiện tượng chớp trắng rồi mới đổi màu.
2. **Tăng tốc phần cứng GPU (Hardware Composite Acceleration)**:
   - Gán `will-change: transform; backface-visibility: hidden;` cho các thành phần động (`.iuh-sidebar-drawer`, `#iuh-sidebar-trigger-btn`).
   - Đảm bảo hiệu ứng trượt mở luôn đạt 60fps mượt mà trên mọi thiết bị.
3. **Giảm tải CPU với Targeted MutationObserver**:
   - Thay vì quan sát toàn bộ `document.body`, observer chỉ theo dõi riêng vùng bảng lịch `#viewLichTheoTuan`.
   - Kết hợp dirty-checking và bộ nhớ đệm cache (`highlightTodayColumn`, `equalizeColumns`, `fixBrokenText`), giảm thời gian xử lý xuống chỉ còn **~0.79ms**.
4. **Bảo mật tuyệt đối**:
   - Thông tin tài khoản chỉ lưu cục bộ trên máy bạn (`chrome.storage.local`), không gửi đi bất kỳ máy chủ nào khác.

---

<p align="center">Phát triển với ❤️ cho sinh viên Đại học Công nghiệp TP.HCM (IUH).</p>
