# IUH Fast Login — Chrome / Edge / Brave / Firefox Extension

Extension tự động đăng nhập các cổng IUH, chạy được trên nhiều trình duyệt nhân
Chromium và Firefox:

- **Cổng sinh viên** `sv.iuh.edu.vn` — không cần nhập captcha.
- **LMS Moodle** `lms.iuh.edu.vn` — điền form và đăng nhập (Moodle không có captcha).
- **Đăng ký học phần** `dkhp.iuh.edu.vn` — điền sẵn MSSV + mật khẩu, bạn chỉ cần
  gõ **mã bảo vệ** rồi Enter (xem mục *Lưu ý* — trang này bắt buộc captcha).
- **Lịch theo tuần** `sv.iuh.edu.vn/.../lich-theo-tuan.html` — đổi *“Tiết: X - Y”*
  thành **giờ cụ thể** (ví dụ *Tiết 7 - 9 → 12:30 - 15:00*) ngay trên trang.

## Cách hoạt động (tóm tắt)

1. `rules.json` dùng `declarativeNetRequest` để **chặn request ảnh captcha**
   (`/WebCommon/GetCaptcha`) ngay ở tầng mạng.
2. Server chỉ bật kiểm tra captcha khi ảnh đó **đã được tải trong phiên** →
   không tải được ⇒ server bỏ qua captcha.
3. `content.js` điền MSSV + mật khẩu rồi bấm nút đăng nhập cổng SV. Mật khẩu do
   **JS của chính trang** mã hoá (extension không tự mã hoá, tránh sai thuật toán).
4. `lms.js` điền form Moodle (`#username`/`#password` + `logintoken`) và submit.
5. `dkhp.js` điền sẵn form ĐKHP (`#UserName`/`#Password`) rồi focus ô `#Captcha`;
   việc mã hoá mật khẩu do JS của chính trang làm lúc submit, nên **không** thể bỏ
   qua captcha như cổng SV (server kiểm tra captcha ở phía server).
6. `schedule.js` chạy trên trang lịch tuần, thay số tiết bằng khung giờ tương ứng
   (bảng quy đổi tiết → giờ của IUH) và theo dõi DOM để cập nhật cả nội dung nạp bằng AJAX.

## Cài đặt

### Chrome / Edge / Brave / Cốc Cốc
1. Mở `chrome://extensions` (Edge: `edge://extensions`).
2. Bật **Developer mode**.
3. Bấm **Load unpacked** → chọn thư mục `extension/`.

### Firefox
1. Mở `about:debugging#/runtime/this-firefox`.
2. Bấm **Load Temporary Add-on…** → chọn `extension/manifest.json`.
3. (Bản cài vĩnh viễn cần ký qua addons.mozilla.org.)

## Sử dụng
1. Bấm icon extension → nhập **MSSV** và **mật khẩu** → **Lưu**.
2. Bấm **Mở trang login** (hoặc tự mở trang đăng nhập). Extension tự điền và đăng nhập.
3. Muốn vào LMS: bấm **Mở LMS** (hoặc mở thẳng `https://lms.iuh.edu.vn/login/index.php`).
4. Muốn vào ĐKHP: bấm **Mở ĐKHP** — form đã điền sẵn, chỉ cần gõ **mã bảo vệ** và Enter.
5. Muốn xem lịch học nhanh: bấm **Lịch học** — mở thẳng `sv.iuh.edu.vn/lich-theo-tuan.html`.
   Nếu chưa có phiên đăng nhập, extension tự đăng nhập rồi **quay lại đúng trang lịch**
   (trang lịch không tự giữ `ReturnUrl`; cơ chế này dùng cờ `pendingSchedule`, chỉ áp
   dụng khi bạn bấm nút, không ảnh hưởng đăng nhập thông thường).
6. Tài khoản chỉ lưu cục bộ trên máy (`storage.local`), không gửi đi đâu khác.

## Lưu ý
- Cổng SV giới hạn tần suất đăng nhập (~10 giây/lần). Extension tự chờ rồi thử lại (tối đa 2 lần/tab).
- LMS (Moodle) không giới hạn kiểu này, đăng nhập gần như tức thì.
- Nếu IUH đổi đường dẫn ảnh captcha, sửa `rules.json` cho khớp.
- **ĐKHP luôn bắt captcha ở phía server** (khác cổng SV): đã thử bỏ trống, chặn ảnh,
  OCR và cả SSO `DkhpSsoRedirect` từ cổng SV đều không qua được. Extension chỉ có thể
  điền sẵn tài khoản để bạn gõ mã bảo vệ nhanh hơn.
- Không commit `storage` hay thông tin đăng nhập lên Git.
