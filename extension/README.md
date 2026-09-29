# IUH Fast Login — Chrome / Edge / Brave / Firefox Extension

Extension tự động đăng nhập các cổng IUH, chạy được trên nhiều trình duyệt nhân
Chromium và Firefox:

- **Cổng sinh viên** `sv.iuh.edu.vn` — không cần nhập captcha.
- **LMS Moodle** `lms.iuh.edu.vn` — điền form và đăng nhập (Moodle không có captcha).

## Cách hoạt động (tóm tắt)

1. `rules.json` dùng `declarativeNetRequest` để **chặn request ảnh captcha**
   (`/WebCommon/GetCaptcha`) ngay ở tầng mạng.
2. Server chỉ bật kiểm tra captcha khi ảnh đó **đã được tải trong phiên** →
   không tải được ⇒ server bỏ qua captcha.
3. `content.js` điền MSSV + mật khẩu rồi bấm nút đăng nhập cổng SV. Mật khẩu do
   **JS của chính trang** mã hoá (extension không tự mã hoá, tránh sai thuật toán).
4. `lms.js` điền form Moodle (`#username`/`#password` + `logintoken`) và submit.

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
4. Tài khoản chỉ lưu cục bộ trên máy (`storage.local`), không gửi đi đâu khác.

## Lưu ý
- Cổng SV giới hạn tần suất đăng nhập (~10 giây/lần). Extension tự chờ rồi thử lại (tối đa 2 lần/tab).
- LMS (Moodle) không giới hạn kiểu này, đăng nhập gần như tức thì.
- Nếu IUH đổi đường dẫn ảnh captcha, sửa `rules.json` cho khớp.
- Không commit `storage` hay thông tin đăng nhập lên Git.
