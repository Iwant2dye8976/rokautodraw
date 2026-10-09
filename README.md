# Lilith Auto Draw

Chrome extension Manifest V3 hỗ trợ lấy token, xem nhân vật/lượt quay và tự động quay sự kiện cho **Plutomall** và **Lilith Store**. Extension cũng có thể tự đăng nhập lại khi phát hiện token hết hạn.

## Yêu cầu

- Google Chrome hoặc trình duyệt Chromium hỗ trợ extension Manifest V3.
- Tài khoản có quyền truy cập Plutomall hoặc Lilith Store.
- Mạng Internet để truy cập cửa hàng, passport và API sự kiện.

## Cài đặt extension

1. Tải hoặc clone thư mục dự án về máy. Giữ nguyên cấu trúc thư mục, bao gồm `manifest.json`, các file JavaScript/CSS/HTML và thư mục `images`.
2. Mở `chrome://extensions`.
3. Bật **Developer mode / Chế độ dành cho nhà phát triển**.
4. Chọn **Load unpacked / Tải tiện ích đã giải nén**.
5. Chọn thư mục dự án chứa `manifest.json`.
6. Ghim extension từ menu Extensions trên thanh công cụ để mở popup thuận tiện.

Khi cập nhật mã nguồn, quay lại `chrome://extensions` và bấm nút **Reload** trên extension.

## Lấy token và làm mới dữ liệu

Thực hiện riêng cho từng cửa hàng:

1. Mở popup extension.
2. Trong phần **Thao tác**, chọn **Plutomall** hoặc **Lilith Store**.
3. Bấm **Lấy Token**. Extension sẽ mở trang cửa hàng đã chọn và tự lưu token khi trang gửi yêu cầu đến API sự kiện.
4. Đợi trang cửa hàng tải và phát sinh yêu cầu API. Trạng thái token/nhân vật sẽ hiển thị trong popup.
5. Bấm **Làm mới** để tải lại thông tin nhân vật và tổng số lượt quay.

Token, nhân vật và lượt quay được lưu riêng theo từng cửa hàng. Khi trang cửa hàng không phát sinh yêu cầu API cần thiết, extension có thể chưa lấy được token ngay; hãy đợi trang tải xong hoặc tải lại trang cửa hàng rồi kiểm tra popup.

## Quay thưởng

- Chọn đúng cửa hàng trong phần **Thao tác**.
- Bấm **Quay thưởng ngay** để chạy lượt quay cho các nhân vật có lượt.
- Theo dõi tiến trình và kết quả trong phần **Nhật ký**.
- Extension cũng kiểm tra và chạy quay tự động khi Chrome khởi động và theo chu kỳ một giờ. Chỉ các cửa hàng đã có token được lưu mới có thể chạy.

Các yêu cầu API có timeout 20 giây; giữa các nhân vật có khoảng nghỉ 0,5 giây. Nếu token hết hạn, extension có thể mở luồng tự đăng nhập lại theo cài đặt bên dưới.

## Cấu hình Auto đăng nhập lại

1. Mở rộng phần **Auto đăng nhập lại** bằng nút mũi tên nếu phần cài đặt đang thu gọn.
2. Chọn tab cửa hàng cần cấu hình: **Plutomall** hoặc **Lilith Store**.
3. Nhập tài khoản và mật khẩu cho đúng cửa hàng rồi bấm **Lưu thông tin**. Thông tin của hai cửa hàng được lưu tách biệt.
4. Bật checkbox **Auto đăng nhập lại**. Có thể thu nhỏ phần cài đặt bằng nút mũi tên; thao tác này không tắt tính năng.
5. Khi extension nhận diện token hết hạn từ phản hồi API, extension mở trang đăng nhập trong một tab nền, không chuyển focus khỏi tab hiện tại. Sau khi đăng nhập và quay về cửa hàng, extension đợi token mới rồi làm mới nhân vật và lượt quay.

Nút **Check Plutomall** hoặc **Check Lilith Store** mở thủ công tab đăng nhập tương ứng để kiểm tra. Nút này không giả lập token hết hạn. Cần bật Auto đăng nhập lại và lưu tài khoản/mật khẩu của cửa hàng trước khi kiểm tra.

Chọn **Xóa thông tin** để xóa thông tin đăng nhập của cả hai cửa hàng và tắt Auto đăng nhập lại. Mật khẩu được lưu trong `chrome.storage.local` của hồ sơ Chrome đang sử dụng; không gửi hoặc chia sẻ thư mục dữ liệu/trạng thái extension nếu trong đó có thông tin nhạy cảm.

## Ý nghĩa trạng thái

- **Chưa có dữ liệu, hãy Capture Token**: chưa có token lưu cho cửa hàng đang chọn.
- **Token đã lưu**: token có trong bộ nhớ extension nhưng chưa được xác nhận qua lần làm mới gần nhất.
- **Token OK**: lần làm mới API gần nhất thành công.
- **Token không hợp lệ** hoặc lỗi 401/403: token đã hết hạn/không hợp lệ; kiểm tra cài đặt Auto đăng nhập lại hoặc lấy token mới.
- **Đã trở về cửa hàng; đang chờ token mới**: đăng nhập đã chuyển hướng về cửa hàng; extension đang chờ bắt token và làm mới dữ liệu.

## Khắc phục sự cố

### Popup báo chưa có token

1. Kiểm tra cửa hàng đang chọn có đúng với tab cần sử dụng không.
2. Bấm **Lấy Token** để mở trang tương ứng.
3. Đợi cửa hàng tải xong; nếu cần, tải lại tab cửa hàng.
4. Mở popup lại và bấm **Làm mới**.

### Auto đăng nhập lại không mở tab

- Bật checkbox Auto đăng nhập lại.
- Kiểm tra đã lưu đủ tài khoản và mật khẩu trong đúng tab cửa hàng.
- Mở mục trạng thái trong phần Auto đăng nhập lại để xem thông báo lỗi.
- Để thử luồng, bấm nút kiểm tra của đúng cửa hàng. Nếu tab đăng nhập đã được mở gần đây, extension có thể dùng lại phiên tab đó thay vì mở tab khác.

### Đăng nhập xong nhưng dữ liệu chưa được làm mới

- Xác nhận passport chuyển hướng về đúng cửa hàng và đúng trang sự kiện.
- Giữ nguyên tab nền vừa mở cho đến khi trạng thái cập nhật.
- Kiểm tra đăng nhập có bị từ chối hay cần thao tác bổ sung trên passport.
- Mở popup và bấm **Làm mới** sau khi token mới đã được bắt.

### Extension không hoạt động sau khi cập nhật

- Tải lại extension tại `chrome://extensions`.
- Tải lại tab Plutomall/Lilith Store sau khi extension được reload.
- Kiểm tra extension đang bật và quyền truy cập website đã được cấp trong Chrome.

## Cấu trúc chính

- `manifest.json`: khai báo Manifest V3, quyền và các trang extension hoạt động.
- `background.js`: bắt token, gọi API, quay thưởng, lịch chạy tự động và điều phối Auto đăng nhập lại.
- `relogin.js`: tự điền form đăng nhập trên passport Plutomall/Lilith Store.
- `content.js`: gửi thông tin CSRF cho tính năng khảo sát trên trang Lilith phù hợp.
- `popup.html`, `popup.js`, `popup.css`: giao diện và tương tác popup.
- `images/`: biểu tượng extension và hình phần thưởng.

## Quyền riêng tư và lưu ý

Extension cần quyền truy cập các miền cửa hàng, passport và API sự kiện được liệt kê trong `manifest.json` để thực hiện các chức năng trên. Token và thông tin đăng nhập được lưu cục bộ trong hồ sơ Chrome; hãy chỉ sử dụng trên thiết bị tin cậy và xóa thông tin đăng nhập trước khi chia sẻ hồ sơ hoặc thiết bị.

Tự động hóa phụ thuộc vào việc website/API còn giữ nguyên cấu trúc và giao thức. Thay đổi từ phía nhà cung cấp có thể khiến bắt token, đăng nhập hoặc quay thưởng ngừng hoạt động; không có đảm bảo rằng mọi lần đăng nhập/quay đều thành công.
