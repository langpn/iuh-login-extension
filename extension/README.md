# IUH Fast Login — Chrome / Edge / Brave / Firefox Extension

Tiện ích mở rộng tự động đăng nhập các cổng thông tin Đại học Công nghiệp TP.HCM (IUH), chạy trực tiếp trên các trình duyệt Chromium và Firefox:

- **Cổng sinh viên** (`sv.iuh.edu.vn`) — Tự động vượt captcha (bằng chặn request mạng, server tự bỏ qua kiểm tra).
- **LMS Moodle** (`lms.iuh.edu.vn`) — Tự động điền form và đăng nhập.
- **Đăng ký học phần** (`dkhp.iuh.edu.vn`) — **Tự động giải captcha 4 ký tự bằng mô hình Micro-CNN tích hợp sẵn** (< 150 KB, chạy 100% offline, không cần server ngoài) và tự động đăng nhập.
- **Giữ sống phiên (Session Keepalive)** — Chạy ngầm định kỳ ping giữ cookie (`ASC.AUTH` & `.ASPXFORMSAUTH`) để bạn không bị văng ra trang đăng nhập sau 20 phút.
- **Lịch theo tuần** (`sv.iuh.edu.vn/.../lich-theo-tuan.html`) — Đổi *“Tiết: X - Y”* thành **giờ cụ thể** (*Tiết 7 - 9 → 12:30 - 15:00*) ngay trên giao diện thời khóa biểu.

---

## Cách cài đặt (chỉ làm 1 lần)

### Chrome / Edge / Brave / Cốc Cốc
1. Mở trình duyệt, truy cập `chrome://extensions` (hoặc `edge://extensions`).
2. Bật công tắc **Developer mode** (Chế độ cho nhà phát triển).
3. Bấm nút **Load unpacked** (Tải tiện ích đã giải nén) → chọn thư mục `extension/`.

### Firefox
1. Mở `about:debugging#/runtime/this-firefox`.
2. Bấm **Load Temporary Add-on…** → chọn file `extension/manifest.json`.

---

## Hướng dẫn sử dụng
1. Bấm vào biểu tượng extension trên thanh công cụ → nhập **MSSV** và **Mật khẩu** → bấm **Lưu**.
2. **Khi vào cổng trường**:
   - Mở Cổng SV hoặc bấm **Mở cổng SV**: Tự động đăng nhập, không cần captcha.
   - Mở LMS hoặc bấm **Mở LMS**: Tự động đăng nhập Moodle.
   - Mở ĐKHP hoặc bấm **Mở ĐKHP**: Extension tự động điền tài khoản, tự giải mã bảo vệ 4 ký tự và tự đăng nhập! Nếu phiên còn sống, nút mở sẽ đưa bạn vào thẳng trang Portal mà không cần qua trang Login.
   - Bấm **Lịch học**: Nhảy thẳng vào trang thời khóa biểu tuần đã được quy đổi sẵn sang giờ học chi tiết.

---

## Cơ chế kỹ thuật
1. **Cổng SV**: Dùng `declarativeNetRequest` (`rules.json`) chặn URL `/WebCommon/GetCaptcha`. Khi client không tải ảnh captcha, server backend của cổng SV tự động bỏ qua bước kiểm tra captcha.
2. **Cổng ĐKHP**:
   - `dkhp_model.js` chứa mạng nơ-ron tích chập (Micro-CNN) siêu nhẹ (~136 KB) viết bằng pure JavaScript.
   - Tự động bóc tách các nét màu ký tự, khử nhiễu và suy luận ra 4 ký tự in hoa (A-Z, 0-9) trong ~15 mili-giây.
   - Tự điền và submit; nếu lần đầu trượt (rất hiếm), extension tự đổi mã mới và thử lại.
3. **Session Keepalive**:
   - `background.js` sử dụng `chrome.alarms` để ping định kỳ mỗi 10 phút.
   - Giúp phiên đăng nhập tồn tại liên tục trong ngày làm việc mà không bị timeout.
4. **Bảo mật tuyệt đối**: Mật khẩu và cookie chỉ lưu trữ cục bộ trong trình duyệt của bạn (`chrome.storage.local`), không gửi đi bất kỳ bên thứ ba nào.
