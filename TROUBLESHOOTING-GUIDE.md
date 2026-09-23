# Cẩm Nang Xử Lý Sự Cố & Kinh Nghiệm Phát Triển Extension vBook

Tài liệu này ghi lại những bài học kinh nghiệm, nguyên lý kiến trúc của ứng dụng vBook (Android Rhino Engine) và các giải pháp thực tế đã giải quyết triệt để các lỗi thường gặp (như HTTP 403, 419, kẹt tải chương 0/xx, lỗi nén ZIP, lỗi cập nhật extension).

---

## 1. Cơ Chế Cookie & Khắc Phục Lỗi Nuốt Cookie trên Android

### Triệu chứng
- Người dùng đã mở trình duyệt in-app đăng nhập thành công, app đã nhận danh sách chương, nhưng khi bấm **Tải truyện** thì bị đứng im ở **`0/xx`** (không tải được một chương nào).
- Khi gọi trực tiếp endpoint nội dung hoặc API chương thì bị báo lỗi **HTTP 419 ("Phiên đăng nhập hết hạn")** hoặc **HTTP 403 / 401**.

### Nguyên nhân kỹ thuật
1. Backend (như Laravel, Django, Rails...) thường trả về đồng thời nhiều header `Set-Cookie` (ví dụ `XSRF-TOKEN` và `quykhu_sess_v3`).
2. Khi OkHttp / HttpURLConnection trong vBook gộp các header này lại thành một chuỗi (phân tách bởi dấu phẩy `, `) và extension gọi `localCookie.setCookie(sc)`:
   - `localCookie.setCookie()` gọi xuống `android.webkit.CookieManager.getInstance().setCookie(url, cookieValue)`.
   - **Hàm `CookieManager.setCookie` của Android CHỈ CHẤP NHẬN 1 COOKIE ĐƠN LẺ trên mỗi lần gọi!**
   - Nếu truyền một chuỗi chứa nhiều cookie ghép lại, Android chỉ nhận cookie đầu tiên (`XSRF-TOKEN`) và **vứt bỏ toàn bộ cookie session phía sau** (`quykhu_sess_v3`), hoặc làm mất luôn session đăng nhập hiện tại của người dùng.
3. Khi thiếu cookie phiên, server trả về **HTTP 419**, chương tải về rỗng/lỗi $\rightarrow$ tiến trình tải truyện bị kẹt ở **0/xx**.

### Chuẩn hóa giải pháp trong `config.js`
Luôn cài đặt bộ bóc tách cookie độc lập và gộp cookie an toàn:

```javascript
// Bóc tách từng cookie riêng biệt, bỏ qua các thuộc tính chuẩn như expires, path, domain
function parseCookieMap(str) {
    var map = {};
    if (!str) return map;
    var reserved = /^(?:expires|max-age|path|domain|samesite|secure|httponly|priority)$/i;
    var parts = str.split(/[,;]\s*(?=[a-zA-Z0-9_\-]+=[^;]+)/g);
    for (var i = 0; i < parts.length; i++) {
        var pair = parts[i].split(';')[0].trim();
        var eq = pair.indexOf('=');
        if (eq > 0) {
            var k = pair.substring(0, eq).trim();
            var v = pair.substring(eq + 1).trim();
            if (!reserved.test(k) && !/^(?:mon|tue|wed|thu|fri|sat|sun)\b/i.test(k)) {
                map[k] = v;
            }
        }
    }
    return map;
}

// Lưu từng cookie một vào Android CookieManager
function saveCookie(cookieStr) {
    try {
        if (cookieStr && typeof localCookie !== "undefined") {
            var map = parseCookieMap(cookieStr);
            for (var k in map) {
                if (map.hasOwnProperty(k)) {
                    try {
                        localCookie.setCookie(k + "=" + map[k] + "; path=/; domain=" + BASE_DOMAIN);
                    } catch (err) {}
                }
            }
        }
    } catch (e) {}
}

// Gộp cookie hiện có với Set-Cookie mới nhận từ server
function getCombinedCookieHeader(responseSetCookie) {
    var existingStr = (typeof localCookie !== "undefined") ? (localCookie.getCookie() || "") : "";
    var map = parseCookieMap(existingStr);
    if (responseSetCookie) {
        var newMap = parseCookieMap(responseSetCookie);
        for (var k in newMap) {
            if (newMap.hasOwnProperty(k)) {
                map[k] = newMap[k];
            }
        }
    }
    var arr = [];
    for (var key in map) {
        if (map.hasOwnProperty(key)) {
            arr.push(key + "=" + map[key]);
        }
    }
    return arr.join("; ");
}
```

---

## 2. Tải Ngầm Hàng Loạt (Batch Download) vs Đọc Từng Chương (Direct Read)

### Sự khác biệt cốt lõi
- **Đọc trực tiếp 1 chương**: App chạy trên UI thread, có thể fallback sang `Engine.newBrowser()` (Headless Android WebView).
- **Tải truyện hàng loạt (Batch Download)**: vBook chạy nền tuần tự/song song bằng multi-threading không có WebView. Nếu mở hàng chục WebView trong tiến trình nền, Android sẽ hết RAM và crash ứng dụng.
- **Quy tắc vàng**: **Mọi extension PHẢI tải và giải mã nội dung chương thành công qua luồng `fetch()` thuần túy** (kết hợp giải mã Base64/XOR/AES bằng JavaScript thuần). `Engine.newBrowser()` chỉ là chốt chặn cuối cùng cho người đọc trực tiếp một chương nếu gặp Cloudflare Challenge.

### Chờ AJAX khi dùng `Engine.newBrowser()`
Đối với các website không server-render mà dùng client-side script giải mã nội dung (ví dụ `fetch("/doc/chuong/...")` rồi chèn vào `#ct-p`):
- Gọi `browser.launch(url, 5000)` thông thường sẽ trả về DOM ngay khi tải xong HTML tĩnh (khi đó `#ct-p` chỉ có icon loading xoay SVG).
- **Giải pháp**: Phải dùng `browser.waitUrl(["doc/chuong"], 6000)` để đợi request AJAX giải mã hoàn tất trước khi gọi `browser.html()`:
  ```javascript
  var browser = Engine.newBrowser();
  browser.launch(url, 4000);
  try {
      browser.waitUrl(["doc/chuong"], 6000); // Đợi request AJAX nạp nội dung
  } catch (e) {}
  var bDoc = browser.html(1500);
  browser.close();
  ```

---

## 3. Dự Phòng CSRF Token Rỗng

Nhiều website (như Quy Khư) render thẻ meta CSRF rỗng trên một số trang:
```html
<meta name="csrf-token" content="">
```
Trong khi token thực tế lại nằm trong biến JavaScript inline:
```javascript
var csrfToken = csrfMeta ? csrfMeta.content : "otRR2pD3ktBtUmbuOjRHDa9CTkz2FyyrjFxPZiBC";
```
**Giải pháp**: Bắt buộc quét 2 bước:
```javascript
var csrfToken = "";
var csrfMeta = text.match(/<meta[^>]*name="csrf-token"[^>]*content="([^"]+)"/i);
if (csrfMeta && csrfMeta[1]) {
    csrfToken = csrfMeta[1];
} else {
    var csrfScript = text.match(/csrfToken\s*=\s*csrfMeta\s*\?\s*csrfMeta\.content\s*:\s*"([^"]+)"/i);
    if (csrfScript && csrfScript[1]) {
        csrfToken = csrfScript[1];
    }
}
```

---

## 4. Chuẩn Đóng Gói PKZIP cho vBook Android

App vBook trên Android sử dụng lớp `java.util.zip.ZipFile` đọc file tuần tự nghiêm ngặt. Nếu tạo file `.zip` sai quy cách, vBook sẽ báo "File zip không hợp lệ" hoặc "Không tìm thấy plugin.json":

1. **Vị trí Entry #0**: File `plugin.json` **bắt buộc** phải là entry đầu tiên trong Central Directory và Local Header.
2. **Vị trí Entry #1**: File `icon.png` (nếu có) phải là entry thứ hai.
3. **Thư mục code**: Các file script nằm trong `src/*.js`.
4. **General Purpose Bit Flags**: Bắt buộc `flags = 0` (Deflate method 8). Tuyệt đối không bật bit 3 (Data Descriptor) hay bit 11 (UTF-8 descriptor lạ).
5. **Cảnh báo Windows**: **Không được dùng lệnh `tar.exe` mặc định trên Windows** để tạo file zip cho vBook vì `tar` bật bit flag streaming khiến Android ZipFile từ chối. Hãy sử dụng script đóng gói Node.js chuyên dụng (`build_vbook_zip.mjs`).

---

## 5. Xử Lý Xung Đột Cập Nhật Extension (Update Conflicts)

### Nguyên nhân app báo "Không cập nhật được"
vBook lưu danh sách tiện ích đã cài đặt trong cơ sở dữ liệu SQLite cục bộ theo khóa chính là trường `source` trong `plugin.json` (ví dụ `https://truyenfull.vn`).
- Khi tác giả cập nhật domain của tiện ích sang tên miền mới (ví dụ `https://truyenfull.live`), vBook phát hiện khóa ID khác nhau hoặc xung đột thư mục đã tồn tại, dẫn đến lỗi cập nhật.
- Ngoài ra, nếu người dùng cài tiện ích từ một repository bên thứ ba khác, vBook vẫn nhớ repo gốc ban đầu để kiểm tra cập nhật.

### Hướng dẫn chuẩn hóa cho người dùng
Khi một tiện ích đổi domain `source`:
1. Vào tab **"Đã cài đặt"** $\rightarrow$ chọn tiện ích cũ $\rightarrow$ bấm **"Gỡ cài đặt"** (để xóa sạch bản ghi trong SQLite).
2. Quay lại kho extension mới $\rightarrow$ bấm **"Cài đặt"** bản mới. Mọi dữ liệu sẽ được thiết lập sạch sẽ và cập nhật trơn tru.

---

## 6. Checklist Kiểm Tra Toàn Diện Trước Khi Release

Trước khi phát hành hoặc commit một extension mới / sửa đổi:
- [ ] 1. Kiểm tra syntax bằng Rhino/Node: không dùng cú pháp ES2020+ (`?.`, `??`, `async/await`, arrow function, template string). Dùng cú pháp `function`, `var`, `+`.
- [ ] 2. Kiểm tra `load('config.js')`: Không khai báo trùng tên biến với khóa `config` trong `plugin.json`.
- [ ] 3. Kiểm tra User-Agent: Luôn giả lập Android Chrome (`Mozilla/5.0 (Linux; Android 10; K) ... Mobile Safari/537.36`).
- [ ] 4. Kiểm tra cookie: Sử dụng `parseCookieMap` và `saveCookie` an toàn.
- [ ] 5. Chạy mô phỏng tải chương (Static HTML và XOR/AJAX Encrypted).
- [ ] 6. Đóng gói ZIP bằng `build_vbook_zip.mjs` (Entry #0 là `plugin.json`).
- [ ] 7. Nâng version trong cả `folder/plugin.json`, `plugin.json` gốc, và `my_plugins.json`.
