# IUH Auto Login

Tool tự động đăng nhập và lấy dữ liệu cổng sinh viên IUH
(<https://sv.iuh.edu.vn/sinh-vien-dang-nhap.html>).

Gồm 3 phần độc lập:

| File | Dạng | Cần cài gì |
|---|---|---|
| `iuh_browser.py` | Trình duyệt thật (Playwright) — **khuyến nghị** | `pip install playwright` |
| `iuh_login.py` | Python CLI (headless, thuần stdlib) | Không, chỉ Python 3.8+ |
| `iuh-autologin.user.js` | Userscript Tampermonkey | Tampermonkey + trình duyệt |

---

## 1. Cách hoạt động (tóm tắt kỹ thuật)

Trang đăng nhập không gửi mật khẩu dạng thô. Luồng thật của trang:

1. `GET /sinh-vien-dang-nhap.html` → lấy `__RequestVerificationToken`.
2. `GET /SinhVien/GetPrivateKey` → server sinh một khoá riêng cho phiên.
3. Trình duyệt **mã hoá mật khẩu bằng AES** rồi mới gửi.
4. `POST /sinh-vien-dang-nhap.html` (AJAX) → server trả JSON, thành công thì
   chuyển tới `/dashboard.html` và cấp cookie `ASC.AUTH`.

`iuh_login.py` tái hiện đúng luồng đó bằng Python thuần (không thư viện
ngoài). Phần AES-128-CBC + PBKDF2-HMAC-SHA1 được cài đặt thủ công trong file
(khoá do server cấp, IV/salt lấy từ chính trang).

Các endpoint dữ liệu dùng sau khi đăng nhập:

| Lệnh | Endpoint |
|---|---|
| `schedule` | `/SinhVien/GetDanhSachLichTheoTuan` |
| `grades` | `/ket-qua-hoc-tap.html` |
| `info` | `/thong-tin-sinh-vien.html` |
| `check` | `/dashboard.html` |

---

## 2. Nói thẳng về captcha

Trang có captcha 4 ký tự, và **server CÓ kiểm tra đúng/sai** (đã xác nhận
bằng thực nghiệm: gửi mã sai → bị từ chối).

Điểm mấu chốt: server chỉ bắt captcha **nếu phiên đã tải ảnh captcha**
(`GET /WebCommon/GetCaptcha`). Nếu ảnh chưa từng được tải, server bỏ qua bước
kiểm tra.

Ba cách tiếp cận trong repo này:

| Cách | Cơ chế | Tự động? |
|---|---|---|
| `iuh_browser.py` | Chặn request ảnh captcha → server không thấy captcha | 100% |
| `iuh_login.py` | Không bao giờ gọi endpoint ảnh captcha | 100% |
| `iuh-autologin.user.js` | Trang tự tải ảnh → phải nhập mã tay | Không |

Cả hai cách tự động đều **phụ thuộc vào điểm yếu phía server** và có thể bị vá
bất cứ lúc nào.

`iuh_login.py` có sẵn chế độ dự phòng nếu server vá lỗi:

```bash
python3 iuh_login.py login <MSSV> <mật-khẩu> --captcha auto
python3 iuh_login.py login <MSSV> <mật-khẩu> --captcha ocr     # cần tesseract
python3 iuh_login.py login <MSSV> <mật-khẩu> --captcha manual  # tự nhập tay
python3 iuh_login.py login <MSSV> <mật-khẩu> --captcha text:2I60
```

---

## 3. Một phiên đăng nhập tại một thời điểm

Server giới hạn **mỗi tài khoản chỉ một phiên**. Hệ quả thực tế:

- Đăng nhập liên tiếp quá nhanh sẽ bị từ chối, dù mật khẩu đúng.
- Sau một lần thất bại, cần chờ khoảng **4–6 giây** mới đăng nhập lại được.
- Nếu đang mở web ở nơi khác, lần đăng nhập mới sẽ tranh phiên.

`iuh_login.py` đã tự xử lý: khi gặp lỗi dạng này, nó chờ rồi thử lại (mặc định
tối đa 3 lần). Chỉnh bằng `--retries` và `--retry-wait`.

---

## 4. Cách khuyến nghị: `iuh_browser.py` (Playwright)

Mở Chrome thật, chặn ảnh captcha, tự đăng nhập, rồi **giữ trình duyệt mở** để
bạn dùng web bình thường.

```bash
pip install playwright
playwright install chromium

# Mở trình duyệt, tự đăng nhập, giữ nguyên cho bạn dùng
python3 iuh_browser.py --user YOUR_MSSV --pass YOUR_PASSWORD

# Chạy ẩn (không hiện cửa sổ), lưu cookie rồi thoát
python3 iuh_browser.py --user YOUR_MSSV --pass YOUR_PASSWORD --headless

# Dùng Chrome có sẵn thay vì Chromium tải về
python3 iuh_browser.py --user YOUR_MSSV --pass YOUR_PASSWORD --channel chrome

# Lưu cookie ra file để dùng với curl
python3 iuh_browser.py --user YOUR_MSSV --pass YOUR_PASSWORD --save-cookies cookies.txt

# Xuất JSON (dễ ghép với jq / script khác)
python3 iuh_browser.py --user YOUR_MSSV --pass YOUR_PASSWORD --headless --json
```

Có thể dùng biến môi trường `IUH_USER` / `IUH_PASS` thay cho `--user` / `--pass`.

---

## 5. Python CLI thuần: `iuh_login.py`

Không cần cài gì (chỉ Python 3.8+). Phù hợp cho server/CI không có trình duyệt.

```bash
python3 iuh_login.py login YOUR_MSSV YOUR_PASSWORD
python3 iuh_login.py login YOUR_MSSV YOUR_PASSWORD --save-cookies cookies.txt
python3 iuh_login.py check
python3 iuh_login.py keepalive --interval 600
python3 iuh_login.py schedule            # lịch tuần này, in GIỜ cụ thể
python3 iuh_login.py schedule --week -1
python3 iuh_login.py schedule --exam     # lịch thi
python3 iuh_login.py grades
python3 iuh_login.py info
python3 iuh_login.py grades --json | jq .
python3 iuh_login.py logout
```

### Không muốn gõ mật khẩu mỗi lần

```bash
export IUH_USER=YOUR_MSSV
export IUH_PASS=YOUR_PASSWORD
python3 iuh_login.py login
```

Hoặc tạo `config.json` (copy từ `config.example.json`), nhớ `chmod 600`.

### Ghi chú về cookie

Cookie lưu ra `cookies.txt` dùng được với `curl`, nhưng server **chặn
User-Agent lạ**. Phải gửi kèm UA trình duyệt:

```bash
curl -b cookies.txt \
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" \
  https://sv.iuh.edu.vn/dashboard.html
```

---

## 6. Userscript Tampermonkey

Dùng khi bạn muốn tự động điền trên trình duyệt mà không cài Python:

1. Cài extension Tampermonkey.
2. Tạo script mới, dán nội dung `iuh-autologin.user.js`, lưu.
3. Mở trang đăng nhập IUH. Lần đầu script hỏi MSSV + mật khẩu rồi tự điền.
   Các lần sau tự động điền.

Lưu ý: trên trình duyệt, ảnh captcha **có được tải** (trang tự tải), nên server
sẽ yêu cầu captcha. Script điền sẵn tài khoản/mật khẩu rồi dừng để bạn nhập mã
và bấm Đăng nhập. Muốn tự động 100% trên trình duyệt, dùng `iuh_browser.py`.

Đổi tài khoản: menu Tampermonkey → *IUH: xoá tài khoản đã lưu*.

---

## 7. Bảo mật

- `session.json` chứa cookie đăng nhập — đặt quyền `600` và **đừng** commit.
- `config.json` chứa mật khẩu dạng thô — cũng đặt `600`.
- Userscript lưu mật khẩu trong kho Tampermonkey trên máy bạn.
- Không chia sẻ `session.json`, `cookies.txt`, `config.json` cho ai.
- Repo đã có `.gitignore` chặn các file trên.

---

## 8. Yêu cầu

- `iuh_login.py`: Python 3.8+. Không cần `pip install` gì.
- `iuh_browser.py`: `pip install playwright` + `playwright install chromium`.
- `tesseract` chỉ cần khi dùng `--captcha ocr` (không bắt buộc).

---

## 9. Giới hạn đã biết

- Hai cách tự động đều dựa vào việc server bỏ qua captcha khi ảnh chưa được
  tải. Nếu IUH vá lỗi, phải chuyển sang `--captcha ocr` hoặc `--captcha manual`.
- Cơ chế một-phiên khiến đăng nhập nhanh liên tiếp dễ thất bại; tool đã tự chờ
  và thử lại.
- Parser dựa trên HTML hiện tại của trang. Nếu IUH đổi giao diện, phần lấy dữ
  liệu (`schedule`, `grades`, `info`) có thể cần cập nhật.
