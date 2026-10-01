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
- 📅 **Thời khóa biểu tuần siêu tối ưu** (`sv.iuh.edu.vn/lich-theo-tuan.html`) — Giao diện Dark/Light Mode Aurora hiện đại, mở rộng 100% full width, menu hover mép trái, chia đều 7 cột, chữ đen sắc nét 100%, hiển thị song song số tiết và giờ học cụ thể in đậm phía dưới.
- 📚 **LMS Moodle** (`lms.iuh.edu.vn`) — Tự động điền tài khoản và đăng nhập siêu tốc.
- 📝 **Cổng ĐKHP** (`dkhp.iuh.edu.vn`) — Tự động điền tài khoản, giao diện phóng to captcha khử nhiễu 4 ô ký tự sắc nét, tự động in hoa và tự submit khi gõ đủ 4 ký tự.
- 🔄 **Giữ phiên sống liên tục (Keepalive)** — Tự động ping ngầm định kỳ 10 phút để không bao giờ bị văng sau 20 phút.
- ⚡ **Siêu nhẹ & Tối ưu hiệu năng** — Áp dụng `document_start` triệt tiêu chớp nháy (0ms FOUC), tăng tốc phần cứng GPU (`will-change: transform`), giảm ~85% xung nhịp CPU.

---

## 📸 Hình ảnh giao diện thực tế

### 1. Bảng điều khiển Popup tiện ích (⚡ IUH Portal Sync)
<p align="center">
  <img src="docs/screenshots/extension_popup.jpg" alt="IUH Portal Sync Popup" width="340px" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.5);" />
</p>

### 2. Thời khóa biểu tuần Dark Mode Aurora (Mở rộng 100% Full Width & Menu Hover mép trái)
<p align="center">
  <img src="docs/screenshots/schedule_dark_mode.jpg" alt="Thời khóa biểu tuần Dark Mode" width="95%" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.5);" />
</p>

### 3. Cổng Đăng ký học phần — Đăng nhập & Captcha phóng to khử nhiễu 4 ô ký tự
<p align="center">
  <img src="docs/screenshots/dkhp_login_captcha.jpg" alt="Cổng ĐKHP Đăng nhập và Captcha Khử nhiễu" width="95%" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.5);" />
</p>

### 4. Cổng Đăng ký học phần — Giao diện Portal Dark Mode
<p align="center">
  <img src="docs/screenshots/dkhp_portal.jpg" alt="Cổng ĐKHP Portal Dark Mode" width="95%" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.5);" />
</p>

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

## 📖 HƯỚNG DẪN DÀNH CHO NGƯỜI DÙNG CHỈ CÀI EXTENSION

> Dành riêng cho các bạn sinh viên chỉ muốn cài tiện ích vào trình duyệt để sử dụng hằng ngày nhanh gọn và tiện lợi nhất.

### 🛠️ Bước 1: Cài đặt tiện ích vào trình duyệt (Chỉ làm 1 lần)

#### 👉 Dành cho Chrome, Edge, Cốc Cốc, Brave, Opera:
1. Bạn tải hoặc clone mã nguồn về máy, bạn sẽ thấy thư mục tên là **`extension/`**.
2. Mở trình duyệt, nhập vào thanh địa chỉ:
   - Trên Chrome / Cốc Cốc / Brave: `chrome://extensions`
   - Trên Microsoft Edge: `edge://extensions`
3. Gạt bật công tắc **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải.
4. Bấm nút **Tải tiện ích đã giải nén (Load unpacked)** ở góc trên bên trái.
5. Chọn đúng thư mục **`extension/`** vừa tải về.
6. *Mẹo nhỏ:* Bấm vào biểu tượng **Mảnh ghép (Extensions)** trên thanh công cụ trình duyệt rồi bấm **Ghim (Pin 📌)** icon của IUH Fast Login ra ngoài để tiện click mở nhanh.

#### 👉 Dành cho Mozilla Firefox:
1. Mở Firefox, nhập `about:debugging#/runtime/this-firefox` vào thanh địa chỉ.
2. Bấm **Load Temporary Add-on…** (Tải tiện ích tạm thời) → Chọn file `manifest.json` trong thư mục `extension/`.

---

### 🔐 Bước 2: Thiết lập tài khoản ban đầu (Chỉ làm 1 lần)

1. Click vào biểu tượng **Tia sét ⚡ IUH Fast Login** trên thanh công cụ trình duyệt.
2. Bảng điều khiển nhỏ (Popup) xuất hiện:
   - **Mã sinh viên:** Nhập mã số sinh viên của bạn (ví dụ: `21000000`).
   - **Mật khẩu:** Nhập mật khẩu Cổng sinh viên của bạn.
   - Tích chọn: **Tự động đăng nhập & giữ phiên**.
3. Bấm **Lưu cài đặt** (xuất hiện dòng chữ xanh *"Đã lưu thông tin"* là hoàn tất).

> 🔒 **Bảo mật an toàn 100%:** Mật khẩu của bạn chỉ lưu trữ cục bộ trong bộ nhớ an toàn của trình duyệt (`chrome.storage.local`), tuyệt đối không gửi về bất kỳ máy chủ nào khác.

---

### 🚀 Bước 3: Trải nghiệm các tính năng hằng ngày

#### 1. Truy cập nhanh qua Popup 1-Click
Bất cứ lúc nào bạn bấm vào icon tiện ích, có sẵn 4 nút truy cập tốc độ cao:
* 🏛️ **Cổng SV**: Mở cổng sinh viên. Nếu đã có phiên, tiện ích sẽ đưa bạn vào thẳng Dashboard.
* 📚 **LMS Moodle**: Mở thẳng trang học trực tuyến LMS Moodle.
* 📝 **Cổng ĐKHP**: Mở cổng Đăng ký học phần. Nếu phiên còn sống, sẽ tự vào thẳng trang đăng ký học phần.
* 📅 **Thời khóa biểu**: Mở thẳng trang Lịch học tuần với giao diện nâng cao tràn viền.

#### 2. Tự động đăng nhập siêu tốc & Bỏ qua Captcha
* **Tại Cổng sinh viên (`sv.iuh.edu.vn`):**
  - Tự động chặn ảnh captcha ở tầng mạng, server trường tự động bỏ qua kiểm tra captcha.
  - Tự động điền MSSV, mật khẩu và đăng nhập ngay khi mở trang mà không cần thao tác tay.
* **Tại LMS Moodle (`lms.iuh.edu.vn`):**
  - Tự động điền tài khoản và đăng nhập ngay lập tức.
* **Tại Cổng ĐKHP (`dkhp.iuh.edu.vn`):**
  - Tự động điền sẵn MSSV và Mật khẩu.
  - Mã captcha được phóng to và **khử sạch nhiễu hạt, chia thành 4 ô ký tự to rõ** giúp bạn nhìn cực dễ.
  - Bạn chỉ cần gõ 4 chữ cái (tiện ích **tự chuyển thành chữ IN HOA**). Ngay khi bạn gõ xong chữ thứ 4, tiện ích sẽ **tự động bấm Đăng nhập luôn**, giúp bạn đăng ký môn cực nhanh!

#### 3. Giữ phiên đăng nhập sống cả ngày (Session Keepalive)
* Bình thường, nếu không thao tác khoảng 20 phút thì cổng trường sẽ tự out và bắt đăng nhập lại.
* Khi cài tiện ích, hệ thống ngầm sẽ **tự động gửi tín hiệu giữ phiên 10 phút/lần**. Bạn có thể treo máy làm việc cả ngày mà không lo bị văng ra ngoài.

#### 4. Giao diện Thời khóa biểu mới (`sv.iuh.edu.vn/lich-theo-tuan.html`)
Khi bạn vào trang Lịch theo tuần, giao diện đã được nâng cấp toàn diện:
* 🌙 / ☀️ **Đổi giao diện Dark / Light Mode:**
  - Nút **`☀️ Chế độ sáng` / `🌙 Chế độ tối`** ở góc phải thanh tiêu đề. Bấm 1 click là đổi màu toàn bộ trang, tiện ích tự nhớ chế độ bạn chọn.
* ☰ **Menu Bar thu gọn mép trái:**
  - Thanh menu bên trái được thu gọn vào icon tab **`☰ MENU`** ở sát mép trái màn hình để nhường chỗ cho bảng học.
  - Chỉ cần **rê chuột vào nút `☰ MENU`**, menu sẽ tự động trượt êm ra. Rê chuột trở lại bảng học là menu tự thu gọn lại.
  - Mã QR ứng dụng OneUni vẫn nằm đầy đủ bên dưới menu khi mở ra.
* 📅 **Bảng lịch học mở rộng 100% tràn viền:**
  - Bảng học rộng hơn trước 230px, **7 ngày từ Thứ 2 đến Chủ nhật chia đều tăm tắp**.
  - Toàn bộ chữ trong thẻ môn học là **màu đen sắc nét 100%** dễ đọc.
  - **Hiển thị song song cả Số tiết và Giờ học thực tế ngay phía dưới** (ví dụ dòng trên `Tiết: 1 - 3`, dòng dưới `06:30 - 09:00` in đậm sắc nét).
  - Tên Giảng viên được in đậm rõ ràng.
  - Cột ngày hôm nay tự động phát sáng nổi bật với huy hiệu **`[HÔM NAY]`**.
* 👤 **Menu tài khoản cá nhân:**
  - Click vào tên của bạn ở góc trên bên phải để mở menu: Giao diện nền tối kính mờ sang trọng, chữ trắng rõ nét, có đầy đủ icon (👤 *Thông tin cá nhân*, 🔑 *Đổi mật khẩu*, 🚪 *Đăng xuất* có màu đỏ cảnh báo chống bấm nhầm).

---

### 🔄 Bước 4: Cách cập nhật khi có phiên bản mới
Mỗi khi có bản cập nhật mới từ tác giả:
1. Bạn chỉ cần tải/kéo code mới về đè vào thư mục `extension/`.
2. Vào `chrome://extensions` bấm nút **Làm mới (Reload 🔄)** trên thẻ tiện ích IUH Fast Login là mọi tính năng mới sẽ được cập nhật ngay lập tức!

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
