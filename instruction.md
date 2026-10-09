Bạn là một chuyên gia Senior Chrome Extension Developer và Code Auditor. Hãy đóng vai trò là Tech Lead để tiến hành **Code Review & Audit toàn diện** cho toàn bộ source code của extension Manifest V3 này (gồm `manifest.json`, `background.js`, `content.js`, `popup.js`, `popup.html`, `popup.css`).

Mục tiêu chính:
1. Phát hiện tất cả các lỗi tiềm ẩn (Bugs, Edge Cases, Memory Leaks, Race Conditions).
2. Tối ưu theo chuẩn Manifest V3 và Chrome Web Store Guidelines.
3. Đề xuất cải tiến kiến trúc, bảo mật và trải nghiệm người dùng (UX/UI).

Hãy rà soát theo các khía cạnh sau:

### 1. Chuẩn Manifest V3 & Vòng đời Service Worker:
- `background.js` có phụ thuộc vào biến global trong bộ nhớ hay không (Service Worker bị terminate định kỳ có làm mất state/dữ liệu phiên làm việc không)?
- Quản lý `chrome.storage.local/sync`, `chrome.alarms` và `chrome.notifications` đã chuẩn chưa?
- Quyền khai báo trong `permissions` và `host_permissions` có bị thừa (dư thừa quyền bảo mật) hoặc thiếu không?

### 2. Message Passing & Xử lý bất đồng bộ:
- Các hàm lắng nghe `chrome.runtime.onMessage.addListener` có xử lý đúng callback bất đồng bộ (`return true;` khi cần `sendResponse`) không?
- Có xảy ra hiện tượng "Unchecked runtime.lastError: The message port closed before a response was received" không?
- Xử lý promise/async-await và bắt lỗi `try...catch` ở các API fetch / network requests đã đầy đủ chưa?

### 3. Logic nghiệp vụ & Tự động hóa (Auto Draw / Bot):
- Kiểm tra cơ chế retry, rate limit, timeout và anti-ban/anti-spam khi gửi request lên API game/store.
- Kiểm tra khả năng xử lý response lỗi (401 Unauthorized, 403, 429 Too Many Requests, Token hết hạn, JSON parse failure).
- Logic vòng lặp tự động (auto loop) có nguy cơ gây treo tab/service worker hoặc chạy vô tận không?

### 4. DOM & Content Script:
- Content script inject vào trang đích có kiểm tra sự tồn tại của elements trước khi thao tác không?
- Có bị xung đột với script của trang chủ (Lilith/Plutomall) không?

### 5. Popup UI/UX & CSS:
- Giao diện có hiển thị rõ trạng thái đang chạy (Loading, Progress, Log, Error states) không?
- Trạng thái các nút bấm (Start/Stop/Reset) có được đồng bộ đúng với trạng thái thực tế dưới background không?

---

### Yêu cầu định dạng báo cáo đầu ra:
1. **Bảng tóm tắt tổng quan:** Phân loại lỗi theo mức độ nghiêm trọng (`Critical`, `Major`, `Minor`, `Improvement`).
2. **Chi tiết từng vấn đề:**
   - Vị trí file & dòng code cụ thể.
   - Nguyên nhân & rủi ro thực tế nếu không sửa.
   - Đoạn code đề xuất sửa đổi (Diff/Code snippet trước & sau khi sửa).
3. **Lộ trình tối ưu hóa (Action Plan):** Các bước ưu tiên cần thực hiện trước.