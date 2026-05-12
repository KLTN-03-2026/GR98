# THIẾT KẾ GIAO DIỆN NGƯỜI DÙNG

**Đề tài:** Xây dựng Hệ thống quản lý chuỗi cung ứng nông sản (Farmers — Sầu Riêng & Cà Phê).

**Đối tượng người dùng:**

- **Khách hàng (Client)** — người mua sắm trên cổng thương mại điện tử.
- **Quản trị viên (Admin)** — vận hành toàn hệ thống.
- **Giám sát viên (Supervisor)** — phụ trách Nông Dân, Lô Đất, Hợp Đồng, Báo Cáo Hàng Ngày.
- **Nhân viên kho (Inventory Staff)** — quản lý Kho Hàng, Lô Hàng, Giao Dịch, Sản Phẩm, Đơn Hàng.
- **Shipper** — nhận đơn và xác nhận giao hàng.

---

## 1. SƠ ĐỒ LIÊN KẾT GIAO DIỆN


| Mã UI | Tên                                | Ý nghĩa                                                                                                                      |
| ----- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| UI_01 | Đăng nhập                          | Trang đăng nhập dùng chung cho cả Khách Hàng và các vai trò quản trị (Admin, Giám Sát Viên, Nhân Viên Kho).                  |
| UI_02 | Đăng ký                            | Trang đăng ký tài khoản Khách Hàng mới.                                                                                      |
| UI_03 | Quên mật khẩu                      | Gửi yêu cầu đặt lại mật khẩu qua email.                                                                                      |
| UI_04 | Đặt lại mật khẩu                   | Đặt mật khẩu mới sau khi nhấn link xác thực từ email.                                                                        |
| UI_05 | Trang chủ                          | Trang chủ thương mại điện tử dành cho Khách Hàng.                                                                            |
| UI_06 | Danh sách Sản Phẩm                 | Danh sách sản phẩm kèm bộ lọc theo danh mục, loại cây, giống, hạng và giá.                                                   |
| UI_07 | Chi tiết Sản Phẩm                  | Trang chi tiết một sản phẩm — gồm gallery ảnh, mô tả, chọn số lượng và thêm vào Giỏ Hàng.                                    |
| UI_08 | Truy xuất nguồn gốc — Danh sách    | Danh sách sản phẩm có thể truy xuất nguồn gốc, hỗ trợ tìm kiếm.                                                              |
| UI_09 | Truy xuất nguồn gốc — Chi tiết     | Trang hành trình sản phẩm: lô đất, hợp đồng, timeline báo cáo định kỳ/sự cố/thu hoạch, đánh giá, biểu đồ thống kê.           |
| UI_10 | Giỏ Hàng                           | Quản lý giỏ hàng Khách Hàng: chọn sản phẩm, chỉnh số lượng, xoá, đi tới thanh toán.                                          |
| UI_11 | Thanh Toán                         | Trang thanh toán: chọn địa chỉ giao hàng, mã giảm giá, phương thức thanh toán, đặt đơn.                                      |
| UI_12 | Kết quả thanh toán                 | Hiển thị kết quả trả về sau khi thanh toán qua cổng thanh toán điện tử.                                                      |
| UI_13 | Đơn Hàng của tôi                   | Danh sách Đơn Hàng của Khách Hàng — gồm xem chi tiết, huỷ đơn và gửi đánh giá cho từng sản phẩm trong đơn đã giao.           |
| UI_14 | Tài khoản của tôi                  | Hồ sơ cá nhân, quản lý Địa Chỉ Giao Hàng, đổi mật khẩu, cài đặt thông báo.                                                   |
| UI_15 | Tổng quan Quản Trị                 | Dashboard tổng hợp số liệu vận hành toàn hệ thống cho Admin.                                                                 |
| UI_16 | Quản lý Tài khoản                  | Danh sách tài khoản toàn hệ thống — gồm thêm, cập nhật, xoá tài khoản (Admin tạo Giám Sát Viên / Nhân Viên Kho / Shipper).   |
| UI_17 | Quản lý Vùng Trồng (GIS)           | Bản đồ GIS — Admin xem polygon vùng trồng toàn hệ thống.                                                                     |
| UI_18 | Quản lý Lô Đất                     | Danh sách Lô Đất, lọc theo loại cây/giám sát, cập nhật thông tin, xoá Lô Đất, mở bản đồ.                                     |
| UI_19 | Quản lý hợp đồng (Admin)           | Danh sách Hợp Đồng toàn hệ thống — lọc theo trạng thái.                                                                      |
| UI_20 | Chi tiết & Phê duyệt Hợp Đồng      | Trang chi tiết Hợp Đồng — Admin xem, phê duyệt hoặc từ chối.                                                                 |
| UI_21 | Báo cáo hằng ngày (Admin)          | Danh sách Báo Cáo Hàng Ngày từ Giám Sát Viên, lọc theo loại/Giám Sát Viên/ngày, mở chi tiết.                                 |
| UI_22 | Giám sát Kho hàng (Admin)          | Danh sách Kho Hàng — gồm thêm, cập nhật, gán Nhân Viên Kho phụ trách.                                                        |
| UI_23 | Đơn hàng & Thanh toán (Admin)      | Bảng theo dõi Đơn Hàng toàn hệ thống, lọc theo trạng thái xử lý / thanh toán.                                                |
| UI_24 | Tổng quan Giám Sát Viên            | Dashboard phạm vi phụ trách cho Giám Sát Viên.                                                                               |
| UI_25 | Quản lý Nông Dân (Giám Sát Viên)   | Danh sách Nông Dân thuộc phạm vi Giám Sát Viên — gồm thêm, cập nhật, xoá.                                                    |
| UI_26 | Lô đất phụ trách (Giám Sát Viên)   | Danh sách Lô Đất Giám Sát Viên đang phụ trách — gồm cập nhật, gắn báo cáo.                                                   |
| UI_27 | Quản lý vùng trồng (Giám Sát Viên) | Bản đồ GIS — Giám Sát Viên vẽ polygon cho Lô Đất.                                                                            |
| UI_28 | Hợp đồng liên kết (Giám Sát Viên)  | Danh sách Hợp Đồng do Giám Sát Viên tạo và quản lý.                                                                          |
| UI_29 | Tạo / Chỉnh sửa Hợp Đồng           | Workspace tạo Hợp Đồng Mới hoặc chỉnh sửa Bản Nháp, in PDF.                                                                  |
| UI_30 | Báo cáo hàng ngày (Giám Sát Viên)  | Soạn nháp, đính kèm ảnh, gửi Báo Cáo định kỳ / sự cố / thu hoạch.                                                            |
| UI_31 | Phân tích cây trồng AI             | Bảng kết quả phân tích bệnh cây từ Farmer App, mở chi tiết và xem biểu đồ.                                                   |
| UI_32 | Tổng quan Kho hàng                 | Dashboard vận hành kho cho Nhân Viên Kho.                                                                                    |
| UI_33 | Quản lý Kho (Inventory)            | Danh sách Kho Hàng được phân công cho Nhân Viên Kho.                                                                         |
| UI_34 | Chi tiết Kho Hàng                  | Trang chi tiết một Kho — danh sách Lô Hàng và lịch sử Giao Dịch.                                                             |
| UI_35 | Quản lý Lô hàng                    | Danh sách Lô Hàng theo tab Trong Kho / Chờ Xác Nhận / Sắp Về — gồm xác nhận nhận, từ chối, chấm chất lượng.                  |
| UI_36 | Ghi nhận Xuất/Nhập                 | Danh sách Giao Dịch tồn kho — gồm tạo điều chỉnh tồn kho.                                                                    |
| UI_37 | Sản phẩm (ECM)                     | Danh sách Sản Phẩm niêm yết — sản phẩm tự động tạo khi Hợp Đồng được duyệt; Nhân Viên Kho bổ sung thông tin và đăng bán.      |
| UI_38 | Danh mục                           | Danh sách Danh Mục Sản Phẩm — gồm thêm, cập nhật, xoá, sắp xếp.                                                              |
| UI_39 | Đơn hàng & Thanh toán (Inventory)  | Danh sách Đơn Hàng từ E-commerce, lọc và mở chi tiết để xử lý.                                                               |
| UI_40 | Chi tiết Đơn Hàng (Kho)            | Trang điều phối Đơn Hàng — xác nhận đóng gói, gán Shipper, hoàn tất, huỷ đơn.                                                |
| UI_41 | Reviews / Quản lý Đánh Giá         | Danh sách Đánh Giá Khách Hàng — gồm duyệt, từ chối, xoá.                                                                     |
| UI_42 | Khách hàng (ECM)                   | Danh sách Khách Hàng đã mua hàng — mở Drawer chi tiết.                                                                       |
| UI_43 | Shipper Dashboard                  | Danh sách Đơn Hàng đang giao / đã giao của Shipper — gồm xác nhận đã giao kèm ảnh chứng minh.                                |
| UI_44 | Trang 404                          | Trang báo lỗi không tìm thấy đường dẫn.                                                                                      |


---

## 2. ĐẶC TẢ CHI TIẾT CÁC MÀN HÌNH

### 2.1. UI_01 — Đăng nhập

#### 2.1.1. Bảng mẫu

*Hình 2.1. Giao diện trang Đăng nhập.*

#### 2.1.2. Đặc tả chi tiết


| Màn hình  | Đăng nhập                                                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Cho phép người dùng đăng nhập bằng Email hoặc Số Điện Thoại và Mật Khẩu. Sau khi đăng nhập, hệ thống điều hướng đến trang chủ tương ứng với Vai Trò. |
| Truy cập  | Nhấn nút "Đăng nhập" trên thanh menu trang chủ.                                                                                                      |
| Đối tượng | Tất cả người dùng chưa đăng nhập (Guest).                                                                                                            |



| Mục | Kiểu                | Dữ liệu                                         | Mô tả                                                                          |
| --- | ------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | Label               |                                                 | Tiêu đề "Đăng nhập Farmers" và mô tả phụ "Truy cập hệ thống quản lý nông sản". |
| 2   | Text box            | Mặc định: rỗng / Yêu cầu: có                    | Trường nhập Email hoặc Số Điện Thoại.                                          |
| 3   | Text box (password) | Mặc định: rỗng / Yêu cầu: có, tối thiểu 6 ký tự | Trường nhập Mật Khẩu, có nút mắt để ẩn/hiện.                                   |
| 4   | Button (link)       |                                                 | Liên kết "Quên mật khẩu?" để mở trang Quên mật khẩu.                           |
| 5   | Button              |                                                 | Nút "Đăng nhập" — gửi biểu mẫu.                                                |
| 6   | Button (link)       |                                                 | Liên kết "Đăng ký ngay" để mở trang Đăng ký.                                   |
| 7   | Button (link)       |                                                 | Liên kết "← Quay về trang chủ".                                                |



| Tên              | Mô tả                                                     | Thành công                                                                                  | Thất bại                                                                                |
| ---------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Đăng nhập        | Người dùng nhập Email/SĐT + Mật Khẩu rồi bấm "Đăng nhập". | Hiển thị Toast "Đăng nhập thành công!" và điều hướng về trang chủ tương ứng với Vai Trò.    | Hiển thị Toast "Tài khoản hoặc mật khẩu không chính xác" hoặc thông báo lỗi tương ứng.  |
| Hiện/ẩn mật khẩu | Bấm biểu tượng mắt trong trường Mật Khẩu.                 | Chuyển giữa chế độ ẩn và hiện mật khẩu.                                                     | —                                                                                       |
| Quên mật khẩu    | Bấm liên kết "Quên mật khẩu?".                            | Điều hướng sang trang Quên Mật Khẩu.                                                        | —                                                                                       |
| Đăng ký          | Bấm liên kết "Đăng ký ngay".                              | Điều hướng sang trang Đăng Ký.                                                              | —                                                                                       |


---

### 2.2. UI_02 — Đăng ký

#### 2.2.1. Bảng mẫu

*Hình 2.2. Giao diện trang Đăng ký.*

#### 2.2.2. Đặc tả chi tiết


| Màn hình  | Đăng ký tài khoản                                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Khách Hàng đăng ký tài khoản mới với Họ Tên, Email, Số Điện Thoại (tùy chọn) và Mật Khẩu. Có thanh đo độ mạnh mật khẩu trực quan. |
| Truy cập  | Nhấn nút "Đăng ký ngay" tại trang Đăng nhập hoặc trên trang chủ.                                                                  |
| Đối tượng | Khách Hàng (Guest).                                                                                                               |



| Mục | Kiểu                | Dữ liệu                                                                 | Mô tả                                                                                            |
| --- | ------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | Label               |                                                                         | Tiêu đề "Tạo tài khoản Vietnam Farmer".                                                          |
| 2   | Text box            | Mặc định: rỗng / Yêu cầu: có, tối thiểu 2 ký tự                         | Họ và tên.                                                                                       |
| 3   | Text box (email)    | Mặc định: rỗng / Yêu cầu: có, đúng định dạng email                      | Email.                                                                                           |
| 4   | Text box (tel)      | Mặc định: rỗng / Tuỳ chọn                                               | Số điện thoại.                                                                                   |
| 5   | Text box (password) | Mặc định: rỗng / Yêu cầu: ≥6 ký tự, ký tự đầu in hoa, ≥1 ký tự đặc biệt | Mật khẩu, kèm nút ẩn/hiện.                                                                       |
| 6   | Thanh đo độ mạnh    |                                                                         | Hiển thị mức độ bảo mật ("Chưa an toàn / Yếu / Trung bình / Mạnh") + danh sách điều kiện đã đạt. |
| 7   | Text box (password) | Mặc định: rỗng / Yêu cầu: trùng với mật khẩu                            | Xác nhận mật khẩu.                                                                               |
| 8   | Button              |                                                                         | Nút "Tạo tài khoản".                                                                             |
| 9   | Button (link)       |                                                                         | Liên kết "Đăng nhập ngay" để quay về trang Đăng nhập.                                            |



| Tên                       | Mô tả                                        | Thành công                                                                                                          | Thất bại                                                                                                                                                |
| ------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Đăng ký                   | Người dùng điền form và bấm "Tạo tài khoản". | Hiển thị Toast "Đăng ký thành công! Chào mừng bạn đến với Farmers." và điều hướng về trang chủ với tài khoản mới.   | Hiển thị Toast "Đăng ký thất bại. Vui lòng thử lại." hoặc thông báo lỗi cụ thể (email trùng, mật khẩu không hợp lệ, mật khẩu xác nhận không khớp...).   |
| Kiểm tra độ mạnh mật khẩu | Người dùng nhập mật khẩu.                    | Thanh đo cập nhật theo thời gian thực.                                                                              | —                                                                                                                                                       |


---

### 2.3. UI_03 — Quên mật khẩu

#### 2.3.1. Bảng mẫu

*Hình 2.3. Giao diện trang Quên mật khẩu.*

#### 2.3.2. Đặc tả chi tiết


| Màn hình  | Quên mật khẩu                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------- |
| Mô tả     | Nhận Email người dùng và gửi link đặt lại mật khẩu. Hiển thị màn hình xác nhận đã gửi sau khi thành công. |
| Truy cập  | Nhấn liên kết "Quên mật khẩu?" tại trang Đăng nhập.                                                       |
| Đối tượng | Tất cả người dùng (Guest).                                                                                |



| Mục | Kiểu                 | Dữ liệu                                            | Mô tả                                                                                                                          |
| --- | -------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Button (link)        |                                                    | "← Quay về đăng nhập".                                                                                                         |
| 2   | Label                |                                                    | Tiêu đề "Quên mật khẩu" + mô tả.                                                                                               |
| 3   | Text box (email)     | Mặc định: rỗng / Yêu cầu: có, đúng định dạng email | Email người dùng.                                                                                                              |
| 4   | Button               |                                                    | Nút "Gửi link đặt lại mật khẩu".                                                                                               |
| 5   | Thông báo thành công |                                                    | Sau khi gửi: tiêu đề "Kiểm tra email của bạn", lưu ý link hết hạn 1 giờ, gợi ý kiểm tra thư mục Spam, nút "Quay về đăng nhập". |



| Tên              | Mô tả                            | Thành công                                  | Thất bại                                                  |
| ---------------- | -------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| Gửi link đặt lại | Người dùng nhập email và submit. | Chuyển sang màn hình xác nhận đã gửi email. | Hiển thị Toast "Đã xảy ra lỗi" hoặc thông báo lỗi tương ứng. |


---

### 2.4. UI_04 — Đặt lại mật khẩu

#### 2.4.1. Bảng mẫu

*Hình 2.4. Giao diện trang Đặt lại mật khẩu.*

#### 2.4.2. Đặc tả chi tiết


| Màn hình  | Đặt lại mật khẩu                                                                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Cho phép người dùng đặt mật khẩu mới sau khi nhấn link xác thực từ email. Nếu link không hợp lệ hoặc đã hết hạn, hệ thống hiển thị màn hình "Link không hợp lệ". |
| Truy cập  | Người dùng nhấn link đặt lại mật khẩu trong email.                                                                                                              |
| Đối tượng | Tất cả người dùng (Guest).                                                                                                                                      |



| Mục | Kiểu                       | Dữ liệu                                                                 | Mô tả                                                                                                               |
| --- | -------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | Label                      |                                                                         | Tiêu đề "Đặt lại mật khẩu".                                                                                         |
| 2   | Text box (password)        | Mặc định: rỗng / Yêu cầu: ≥6 ký tự, ký tự đầu in hoa, ≥1 ký tự đặc biệt | Mật khẩu mới.                                                                                                       |
| 3   | Thanh đo độ mạnh           |                                                                         | Hiển thị "Yếu / Trung bình / Mạnh".                                                                                 |
| 4   | Text box (password)        | Mặc định: rỗng / Yêu cầu: trùng với mật khẩu mới                        | Xác nhận mật khẩu.                                                                                                  |
| 5   | Khối lưu ý                 |                                                                         | Liệt kê yêu cầu mật khẩu.                                                                                           |
| 6   | Button                     |                                                                         | Nút "Xác nhận đặt lại mật khẩu".                                                                                    |
| 7   | Thông báo thành công / lỗi |                                                                         | Hiển thị màn hình thành công kèm nút "Đăng nhập ngay" hoặc màn hình "Link không hợp lệ" kèm nút "Yêu cầu link mới". |



| Tên              | Mô tả                                   | Thành công                                                 | Thất bại                                                              |
| ---------------- | --------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| Đặt lại mật khẩu | Người dùng nhập mật khẩu mới và submit. | Chuyển sang màn hình thành công, có nút quay về đăng nhập. | Hiển thị Toast "Link không hợp lệ" / "Đã xảy ra lỗi" hoặc thông báo lỗi tương ứng. |


---

### 2.5. UI_05 — Trang chủ

#### 2.5.1. Bảng mẫu

*Hình 2.5. Giao diện trang chủ.*

#### 2.5.2. Đặc tả chi tiết


| Màn hình  | Trang chủ                                                                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Trang chủ thương mại điện tử: Hero carousel banner, danh sách Danh Mục, Sản Phẩm Nổi Bật, banner khuyến mãi, lợi thế "Tại sao chọn Farmers" và CTA đăng ký. |
| Truy cập  | Mở trình duyệt vào trang chủ của hệ thống.                                                                                                                  |
| Đối tượng | Tất cả người dùng.                                                                                                                                          |



| Mục | Kiểu                           | Dữ liệu | Mô tả                                                                                 |
| --- | ------------------------------ | ------- | ------------------------------------------------------------------------------------- |
| 1   | Hero Carousel                  |         | Banner ảnh tự động chuyển 2.5s, có dots điều hướng.                                   |
| 2   | Section Danh Mục               |         | Lưới Danh Mục Sản Phẩm — nhấp vào sẽ mở danh sách sản phẩm của danh mục.              |
| 3   | Section Sản Phẩm Nổi Bật       |         | Lưới Sản Phẩm có badge Hạng A/B, hiển thị giá/kg, đánh giá.                           |
| 4   | Banner khuyến mãi              |         | "Giảm 10% cho đơn hàng đầu tiên" — nút "Đăng Ký Ngay" và "Xem sản phẩm".              |
| 5   | Section "Tại Sao Chọn Farmers" |         | 4 thẻ lợi thế: 100% Tự Nhiên, Nguồn Gốc Rõ Ràng, Giao Hàng Nhanh, Cam Kết Chất Lượng. |
| 6   | CTA Section                    |         | Lời mời tạo tài khoản miễn phí.                                                       |



| Tên                   | Mô tả                                              | Thành công                                          | Thất bại |
| --------------------- | -------------------------------------------------- | --------------------------------------------------- | -------- |
| Chuyển banner         | Banner tự động chuyển; người dùng có thể bấm dots. | Hiển thị banner kế tiếp.                            | —        |
| Xem danh mục          | Người dùng bấm một Danh Mục.                       | Điều hướng tới trang Danh sách sản phẩm theo danh mục đã chọn. | —        |
| Xem chi tiết sản phẩm | Bấm vào một Sản Phẩm Nổi Bật.                      | Điều hướng tới trang Chi tiết sản phẩm.             | —        |
| Xem tất cả sản phẩm   | Bấm "Xem tất cả".                                  | Điều hướng tới trang Danh sách sản phẩm.            | —        |
| Đăng ký từ banner     | Bấm "Đăng Ký Ngay".                                | Điều hướng tới trang Đăng ký.                       | —        |


---

### 2.6. UI_06 — Danh sách Sản Phẩm

#### 2.6.1. Bảng mẫu

*Hình 2.6. Giao diện trang Danh sách sản phẩm.*

#### 2.6.2. Đặc tả chi tiết


| Màn hình  | Danh sách Sản Phẩm                                                                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Hiển thị danh sách Sản Phẩm với bộ lọc theo Danh Mục, Loại Cây (Sầu Riêng / Cà Phê), Giống, Hạng chất lượng, Khoảng giá; sắp xếp; phân trang; chọn số cột lưới (2/3/4). Dùng chung cho trang Tất Cả Sản Phẩm và trang Danh Mục cụ thể. |
| Truy cập  | Bấm menu "Sản phẩm" trên thanh điều hướng, hoặc nhấn vào một Danh Mục trên trang chủ.                                                                                                       |
| Đối tượng | Tất cả người dùng.                                                                                                                                                                          |



| Mục | Kiểu              | Dữ liệu        | Mô tả                                                                             |
| --- | ----------------- | -------------- | --------------------------------------------------------------------------------- |
| 1   | Button            |                | Nút "Bộ lọc" (mobile) mở Sheet bộ lọc.                                            |
| 2   | Tag (badge)       |                | Các Tag bộ lọc đang áp dụng + nút "Xóa tất cả".                                   |
| 3   | Dropdown          |                | Sắp xếp (Mới nhất / Giá tăng / Giá giảm / Bán chạy / Đánh giá cao).               |
| 4   | Button group      |                | Toggle số cột lưới: 2 / 3 / 4.                                                    |
| 5   | Text box (search) | Mặc định: rỗng | Tìm theo tên Sản Phẩm (debounce 500ms).                                           |
| 6   | Radio group       |                | Lọc theo Danh Mục.                                                                |
| 7   | Radio group       |                | Lọc theo Loại Cây (Sầu Riêng / Cà Phê).                                           |
| 8   | Radio group       |                | Lọc theo Giống — chỉ hiện khi đã chọn Loại Cây.                                   |
| 9   | Badge togglable   |                | Lọc theo Hạng (A / B).                                                            |
| 10  | Radio group       |                | Lọc theo Khoảng Giá.                                                              |
| 11  | Button            |                | Nút "Xóa tất cả bộ lọc".                                                          |
| 12  | Lưới Sản Phẩm     |                | Mỗi card hiển thị ảnh, badge Hạng/Loại Cây, tên, giá, đánh giá, nút thêm vào giỏ. |
| 13  | Pagination        |                | Nút Trước / Sau và số trang.                                                      |



| Tên              | Mô tả                                  | Thành công                                                                    | Thất bại |
| ---------------- | -------------------------------------- | ----------------------------------------------------------------------------- | -------- |
| Tìm kiếm         | Nhập từ khoá tên sản phẩm.             | Danh sách cập nhật sau 500ms, trang về 1.                                     | —        |
| Áp dụng bộ lọc   | Chọn Danh Mục/Loại Cây/Giống/Hạng/Giá. | Danh sách cập nhật theo bộ lọc, trang về 1.                                   | —        |
| Sắp xếp          | Chọn sắp xếp.                          | Danh sách cập nhật theo tiêu chí.                                             | —        |
| Đổi số cột       | Bấm 2 / 3 / 4 cột.                     | Lưới hiển thị tương ứng.                                                      | —        |
| Phân trang       | Bấm Trước / Sau / số trang.            | Hiển thị trang tương ứng.                                                     | —        |
| Mở chi tiết      | Bấm vào Sản Phẩm.                      | Điều hướng tới trang Chi tiết sản phẩm.                                       | —        |
| Không có kết quả | Khi không tìm thấy.                    | Hiển thị empty state "Không tìm thấy sản phẩm" và nút "Thiết lập lại bộ lọc". | —        |


---

### 2.7. UI_07 — Chi tiết Sản Phẩm

#### 2.7.1. Bảng mẫu

*Hình 2.7. Giao diện trang Chi tiết sản phẩm.*

#### 2.7.2. Đặc tả chi tiết


| Màn hình  | Chi tiết Sản Phẩm                                                                                                                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Trang chi tiết một sản phẩm: gallery ảnh, badge Hạng/Loại Cây, đánh giá trung bình, giá, tồn kho, mô tả, mã QR truy xuất, bộ chọn số lượng (kg), CTA truy xuất nguồn gốc, thêm vào giỏ, đánh giá khách hàng và Sản Phẩm Liên Quan. |
| Truy cập  | Bấm vào một Sản Phẩm từ trang chủ hoặc từ Danh sách Sản Phẩm.                                                                                                                                                                      |
| Đối tượng | Tất cả người dùng (cần đăng nhập khi thêm vào giỏ hàng).                                                                                                                                                                           |



| Mục | Kiểu                       | Dữ liệu              | Mô tả                                                                          |
| --- | -------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| 1   | Breadcrumb                 |                      | Trang chủ / Sản phẩm / [Tên sản phẩm].                                         |
| 2   | Gallery ảnh                |                      | Ảnh chính + thumbnails, nút điều hướng trái/phải.                              |
| 3   | Badge                      |                      | Hạng (A / B) và Loại Cây (Sầu Riêng / Cà Phê).                                 |
| 4   | Label                      |                      | Tên sản phẩm, đánh giá trung bình (sao) + số lượt đánh giá.                    |
| 5   | Label                      |                      | Giá/kg và tình trạng tồn kho.                                                  |
| 6   | Label                      |                      | Mô tả sản phẩm.                                                                |
| 7   | Khối QR                    |                      | Mã QR truy xuất nguồn gốc của sản phẩm.                                        |
| 8   | Bộ chọn số lượng           | Mặc định: số kg tối thiểu | Nút "−"/"+" và ô nhập số kg (bước 0.5).                                       |
| 9   | Label                      |                      | Thành tiền = Giá × Số lượng.                                                   |
| 10  | Button (link)              |                      | CTA "Truy xuất nguồn gốc" để mở trang Hành trình sản phẩm.                     |
| 11  | Button                     |                      | "Thêm vào giỏ hàng" (vô hiệu hoá nếu sản phẩm chưa được niêm yết hoặc hết hàng). |
| 12  | Button (icon)              |                      | Yêu thích, Chia sẻ.                                                            |
| 13  | Trust badges               |                      | Cam kết chất lượng, Giao 24h, Đổi trả 24h.                                     |
| 14  | Section Đánh Giá           |                      | Danh sách đánh giá khách hàng với avatar, sao, bình luận, badge "Đã mua hàng". |
| 15  | Section Sản Phẩm Liên Quan |                      | 4 sản phẩm cùng loại.                                                          |



| Tên                    | Mô tả                            | Thành công                                                  | Thất bại                                                                                          |
| ---------------------- | -------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Đổi ảnh                | Bấm thumbnail hoặc mũi tên.      | Hiển thị ảnh tương ứng.                                     | —                                                                                                 |
| Thay đổi số lượng      | Bấm "−"/"+" hoặc nhập trực tiếp. | Cập nhật Thành Tiền.                                        | Nếu vượt tồn kho hoặc dưới mức tối thiểu, nút bị giới hạn.                                        |
| Thêm vào giỏ hàng      | Bấm "Thêm vào giỏ hàng".         | Hiển thị Toast thành công và đồng bộ giỏ hàng.              | Nếu chưa đăng nhập: hiển thị Toast "Vui lòng đăng nhập để mua hàng" và điều hướng tới trang Đăng nhập. |
| Mở truy xuất nguồn gốc | Bấm CTA truy xuất.               | Điều hướng tới trang Hành trình sản phẩm.                   | —                                                                                                 |
| Sản phẩm không tồn tại | Hệ thống không tìm thấy.         | —                                                           | Hiển thị "Không tìm thấy sản phẩm" và nút "Xem tất cả sản phẩm".                                  |


---

### 2.8. UI_08 — Truy xuất nguồn gốc (Danh sách)

#### 2.8.1. Bảng mẫu

*Hình 2.8. Giao diện trang Truy xuất nguồn gốc.*

#### 2.8.2. Đặc tả chi tiết


| Màn hình  | Truy xuất nguồn gốc — Danh sách                                                      |
| --------- | ------------------------------------------------------------------------------------ |
| Mô tả     | Hiển thị danh sách Sản Phẩm có thể truy xuất nguồn gốc. Có ô tìm kiếm và phân trang. |
| Truy cập  | Bấm menu "Truy xuất nguồn gốc" trên thanh điều hướng.                                |
| Đối tượng | Tất cả người dùng.                                                                   |



| Mục | Kiểu              | Dữ liệu        | Mô tả                                            |
| --- | ----------------- | -------------- | ------------------------------------------------ |
| 1   | Label             |                | Tiêu đề "Truy xuất nguồn gốc sản phẩm" và mô tả. |
| 2   | Text box (search) | Mặc định: rỗng | Tìm sản phẩm cần truy xuất.                      |
| 3   | Lưới Sản Phẩm     |                | Mỗi item bấm vào để mở trang chi tiết truy xuất. |
| 4   | Pagination        |                | Trước / Sau, hiển thị "Trang X / Y".             |



| Tên         | Mô tả            | Thành công                                            | Thất bại |
| ----------- | ---------------- | ----------------------------------------------------- | -------- |
| Tìm kiếm    | Nhập từ khoá.    | Danh sách cập nhật, trang về 1.                       | —        |
| Mở chi tiết | Bấm Sản Phẩm.    | Điều hướng tới trang Chi tiết Truy xuất nguồn gốc.    | —        |
| Phân trang  | Bấm Trước / Sau. | Hiển thị trang tương ứng.                             | —        |


---

### 2.9. UI_09 — Truy xuất nguồn gốc (Chi tiết)

#### 2.9.1. Bảng mẫu

*Hình 2.9. Giao diện trang Chi tiết truy xuất nguồn gốc.*

#### 2.9.2. Đặc tả chi tiết


| Màn hình  | Truy xuất nguồn gốc — Chi tiết                                                                                                                                                                                                                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Trang hành trình nông sản: thông tin Sản Phẩm, Lô Đất (có thể từ nhiều nông trại khác nhau cùng vùng), Hợp Đồng, timeline tổng hợp các sự kiện từ tất cả nông trại đóng góp (gieo trồng / dự kiến thu hoạch / báo cáo định kỳ / sự cố / thu hoạch / phát hiện / nhập kho / giao dịch), danh sách Lô Hàng, đánh giá Khách Hàng, biểu đồ thống kê. |
| Truy cập  | Bấm vào một Sản Phẩm tại trang Truy xuất nguồn gốc — Danh sách, hoặc nhấn CTA "Truy xuất nguồn gốc" tại Chi tiết Sản Phẩm.                                                                                                                                                                                                                             |
| Đối tượng | Tất cả người dùng.                                                                                                                                                                                                                                                                                                                                      |



| Mục | Kiểu                    | Dữ liệu | Mô tả                                                                                                                                                                                                          |
| --- | ----------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Hero card               |         | Tên sản phẩm, ảnh đại diện, badge Hạng / Loại Cây; nếu sản phẩm gộp từ nhiều nông trại, hiển thị "N nông trại" thay vì tên một Nông Dân cụ thể.                                                               |
| 2   | Tabs                    |         | Tabs hành trình: Tổng quan / Timeline / Lô Hàng / Đánh giá / Biểu đồ.                                                                                                                                          |
| 3   | Khối thông tin Lô Đất   |         | Nếu một nông trại: Tên Lô, mã, diện tích, địa chỉ Tỉnh / Huyện. Nếu nhiều nông trại: danh sách các lô đóng góp theo dạng lưới thẻ, mỗi thẻ ghi mã lô, diện tích và tên nông dân.                              |
| 4   | Khối thông tin Hợp Đồng |         | Số Hợp Đồng, Phẩm Cấp, ngày ký, ngày dự kiến thu hoạch.                                                                                                                                                        |
| 5   | Timeline                |         | Danh sách sự kiện tổng hợp từ tất cả nông trại đóng góp, mỗi sự kiện có icon/màu theo loại; bên dưới mỗi sự kiện có nhãn nhỏ ghi tên nông trại và mã lô nguồn (khi sản phẩm đến từ nhiều nơi).               |
| 6   | Bảng Lô Hàng            |         | Mã lô, ngày thu hoạch, số lượng, Kho.                                                                                                                                                                           |
| 7   | Danh sách Đánh Giá      |         | Avatar, sao, bình luận, ngày.                                                                                                                                                                                   |
| 8   | Biểu đồ                 |         | AreaChart sản lượng, PieChart loại báo cáo, BarChart phân loại quét; hiển thị thêm số "Nông trại đóng góp" khi lớn hơn 1.                                                                                      |
| 9   | Button (link)           |         | "← Quay lại" để trở về trang Danh sách Truy xuất nguồn gốc.                                                                                                                                                    |



| Tên              | Mô tả                                    | Thành công                       | Thất bại                                           |
| ---------------- | ---------------------------------------- | -------------------------------- | -------------------------------------------------- |
| Chuyển Tab       | Bấm Tab.                                 | Hiển thị nội dung tab tương ứng. | —                                                  |
| Quay lại         | Bấm "Quay lại".                          | Điều hướng về trang danh sách.   | —                                                  |
| Không có dữ liệu | Hệ thống không tìm thấy dữ liệu sản phẩm. | —                                | Hiển thị "Không tìm thấy dữ liệu" và nút Quay lại. |


---

### 2.10. UI_10 — Giỏ Hàng

#### 2.10.1. Bảng mẫu

*Hình 2.10. Giao diện trang Giỏ hàng.*

#### 2.10.2. Đặc tả chi tiết


| Màn hình  | Giỏ Hàng                                                                                                                                                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Danh sách sản phẩm trong giỏ; cho phép chọn (checkbox), chỉnh số lượng, xoá, xoá toàn bộ; bảng "Tổng Quan Đơn Hàng" tính tạm tính + phí vận chuyển (miễn phí khi đơn ≥ 500.000đ); nút "Tiến Hành Thanh Toán" với các sản phẩm đã chọn. |
| Truy cập  | Bấm biểu tượng Giỏ Hàng trên thanh điều hướng (yêu cầu đăng nhập).                                                                                                                                                            |
| Đối tượng | Khách Hàng (Client).                                                                                                                                                                                                          |



| Mục | Kiểu           | Dữ liệu            | Mô tả                                                                                      |
| --- | -------------- | ------------------ | ------------------------------------------------------------------------------------------ |
| 1   | Label          |                    | Tiêu đề "Giỏ Hàng" và số lượng sản phẩm.                                                   |
| 2   | Card item      |                    | Ảnh sản phẩm, tên, badge Loại Cây / Hạng, thành tiền, ô số lượng, nút xoá.                 |
| 3   | Checkbox       |                    | Chọn sản phẩm để thanh toán.                                                               |
| 4   | Bộ tăng giảm   | Mặc định: theo giỏ | Nút "−"/"+" và ô số kg.                                                                    |
| 5   | Button (icon)  |                    | Nút xoá item (icon thùng rác).                                                             |
| 6   | Button         |                    | "Xóa toàn bộ" — xoá toàn bộ giỏ.                                                           |
| 7   | Button (link)  |                    | "Tiếp tục mua sắm" để quay về trang Danh sách sản phẩm.                                    |
| 8   | Khối Tổng Quan |                    | Liệt kê sản phẩm đã chọn, Tạm tính, Phí vận chuyển, gợi ý mua thêm để FREESHIP, Tổng cộng. |
| 9   | Button         |                    | "Tiến Hành Thanh Toán" (vô hiệu hoá nếu không có sản phẩm được chọn).                      |



| Tên                  | Mô tả                                         | Thành công                                                              | Thất bại                                                  |
| -------------------- | --------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| Chọn sản phẩm        | Tick checkbox.                                | Cập nhật bảng Tổng Quan.                                                | —                                                         |
| Thay đổi số lượng    | Bấm "−"/"+" hoặc nhập trực tiếp + blur/Enter. | Cập nhật giỏ hàng, hiển thị Toast thành công.                           | Hiển thị Toast lỗi nếu vượt tồn kho hoặc thao tác không thành công. |
| Xoá item             | Bấm icon thùng rác.                           | Item bị xoá khỏi giỏ.                                                   | Hiển thị Toast lỗi.                                       |
| Xoá toàn bộ          | Bấm "Xóa toàn bộ".                            | Giỏ rỗng, hiển thị empty state.                                         | Hiển thị Toast lỗi.                                       |
| Tiến hành thanh toán | Bấm nút "Tiến Hành Thanh Toán".               | Điều hướng tới trang Thanh toán với danh sách sản phẩm được chọn.       | Vô hiệu hoá nút khi chưa chọn item.                       |
| Chưa đăng nhập       | Mở trang khi chưa đăng nhập.                  | —                                                                       | Hiển thị thông báo "Vui lòng đăng nhập" và nút Đăng nhập. |


---

### 2.11. UI_11 — Thanh Toán

#### 2.11.1. Bảng mẫu

*Hình 2.11. Giao diện trang Thanh toán.*

#### 2.11.2. Đặc tả chi tiết


| Màn hình  | Thanh Toán                                                                                                                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Khách Hàng kiểm tra Địa Chỉ Giao Hàng, danh sách Sản Phẩm, mã giảm giá, phương thức thanh toán (COD / VNPay / MoMo) và ghi chú, rồi đặt đơn. Có Step Indicator (Giỏ hàng → Thanh toán → Hoàn tất). |
| Truy cập  | Bấm nút "Tiến Hành Thanh Toán" tại trang Giỏ Hàng (yêu cầu đăng nhập).                                                                                                                             |
| Đối tượng | Khách Hàng (Client).                                                                                                                                                                               |



| Mục | Kiểu                     | Dữ liệu        | Mô tả                                                                                                                 |
| --- | ------------------------ | -------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | Button (link)            |                | "← Quay lại giỏ hàng".                                                                                                |
| 2   | Step indicator           |                | 3 bước: Giỏ hàng, Thanh toán, Hoàn tất.                                                                               |
| 3   | Khối Địa Chỉ Giao Hàng   |                | Hiển thị địa chỉ đã chọn + nút "Thay đổi" mở dialog chọn địa chỉ; hoặc CTA "Thêm địa chỉ giao hàng mới" mở trang Tài khoản. |
| 4   | Danh sách Sản Phẩm       |                | Ảnh, tên, số kg × đơn giá, thành tiền.                                                                                |
| 5   | Text box (voucher)       | Mặc định: rỗng | Mã giảm giá.                                                                                                          |
| 6   | Button                   |                | "Áp dụng" mã.                                                                                                         |
| 7   | Voucher gợi ý            |                | FARMER10, FREESHIP, WELCOME50.                                                                                        |
| 8   | Radio group              | Mặc định: COD  | Phương thức thanh toán: COD / VNPay / MoMo, mô tả và badge gợi ý.                                                     |
| 9   | Text box                 | Mặc định: rỗng | Ghi chú đơn hàng (tuỳ chọn).                                                                                          |
| 10  | Khối Chi tiết thanh toán |                | Tạm tính, Phí vận chuyển (miễn phí khi đơn ≥ 500.000đ), Giảm giá, Tổng cộng.                                          |
| 11  | Button                   |                | "Đặt hàng" (vô hiệu hoá nếu chưa có Địa Chỉ hoặc giỏ rỗng).                                                            |
| 12  | Dialog Chọn Địa Chỉ      |                | Danh sách Địa Chỉ Giao Hàng đã lưu, badge "Nhà riêng/Văn phòng", "Mặc định", CTA "Thêm địa chỉ mới".                  |



| Tên                   | Mô tả                                           | Thành công                                                                                                | Thất bại                                                                          |
| --------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Chọn địa chỉ          | Bấm "Thay đổi" và chọn địa chỉ.                 | Đóng dialog, cập nhật khối Địa Chỉ.                                                                       | —                                                                                 |
| Áp dụng voucher       | Nhập mã hoặc bấm voucher gợi ý → bấm "Áp dụng". | Hiển thị Toast "Đã áp dụng mã: -X đ", giảm giá hiển thị trong tổng.                                       | —                                                                                 |
| Đặt hàng (COD)        | Bấm "Đặt hàng" với phương thức COD.             | Tạo Đơn Hàng, xoá Giỏ Hàng, chuyển sang màn hình "Đặt hàng thành công" với mã đơn.                        | Hiển thị Toast lỗi; nếu chưa chọn địa chỉ: Toast "Vui lòng chọn địa chỉ giao hàng". |
| Đặt hàng (VNPay/MoMo) | Bấm "Đặt hàng" với phương thức điện tử.         | Tạo Đơn Hàng + tạo phiên thanh toán, chuyển hướng đến cổng thanh toán điện tử.                            | Hiển thị Toast lỗi; nếu không có đường dẫn cổng thanh toán, vẫn hiển thị thành công. |
| Quay lại giỏ hàng     | Bấm "Quay lại giỏ hàng".                        | Điều hướng về trang Giỏ Hàng.                                                                             | —                                                                                 |


---

### 2.12. UI_12 — Kết quả thanh toán

#### 2.12.1. Bảng mẫu

*Hình 2.12. Giao diện trang Kết quả thanh toán.*

#### 2.12.2. Đặc tả chi tiết


| Màn hình  | Kết quả thanh toán                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Trang nhận thông tin trả về từ cổng thanh toán điện tử, xác thực kết quả và hiển thị Thanh toán Thành công / Thất bại kèm chi tiết đơn hàng. |
| Truy cập  | Hệ thống tự động chuyển hướng tới trang này sau khi người dùng hoàn tất thao tác tại cổng thanh toán.                 |
| Đối tượng | Khách Hàng.                                                                                                           |



| Mục | Kiểu               | Dữ liệu | Mô tả                                                                                  |
| --- | ------------------ | ------- | -------------------------------------------------------------------------------------- |
| 1   | Loading            |         | Spinner trong khi hệ thống xác thực kết quả thanh toán.                                |
| 2   | Khối kết quả       |         | Biểu tượng + tiêu đề "Thanh Toán Thành Công!" hoặc "Thanh Toán Thất Bại" + thông điệp. |
| 3   | Khối thông tin đơn |         | Mã đơn hàng, phương thức thanh toán, tổng thanh toán.                                  |
| 4   | Button (link)      |         | "Xem đơn hàng" để mở trang Đơn Hàng của tôi.                                           |
| 5   | Button (link)      |         | "Tiếp tục mua sắm" để quay về trang chủ.                                               |



| Tên              | Mô tả                      | Thành công                           | Thất bại                                                             |
| ---------------- | -------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| Xác thực kết quả | Tự động chạy khi mở trang. | Hiển thị trạng thái và chi tiết đơn. | Hiển thị "Không thể xác thực thanh toán. Vui lòng kiểm tra lại sau." |


---

### 2.13. UI_13 — Đơn Hàng của tôi

#### 2.13.1. Bảng mẫu

*Hình 2.13. Giao diện trang Đơn hàng của tôi.*

#### 2.13.2. Đặc tả chi tiết


| Màn hình  | Đơn Hàng của tôi                                                                                                                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Danh sách Đơn Hàng của Khách Hàng với card hiển thị mã đơn, ngày đặt, badge thanh toán/giao hàng, ảnh sản phẩm, tổng thanh toán; nút "Chi tiết" mở Sheet xem chi tiết, huỷ đơn nếu đơn đang Chờ xử lý, và gửi đánh giá từng sản phẩm nếu đơn đã giao thành công. |
| Truy cập  | Bấm menu/avatar → "Đơn hàng" (yêu cầu đăng nhập).                                                                                                                                                                                                             |
| Đối tượng | Khách Hàng.                                                                                                                                                                                                                                                   |



| Mục | Kiểu               | Dữ liệu | Mô tả                                                                                                                                                                                                                                       |
| --- | ------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Label              |         | Tiêu đề "Đơn Hàng Của Tôi".                                                                                                                                                                                                                 |
| 2   | Card Đơn Hàng      |         | Mã đơn, ngày đặt, badge thanh toán (Chờ / Đã thanh toán / Thất bại / Hoàn tiền), badge giao hàng (Chờ xử lý / Đang đóng gói / Đang giao / Đã giao / Đã hủy), ảnh thumbnail, tổng thanh toán.                                               |
| 3   | Button             |         | "Chi tiết" mở Sheet chi tiết.                                                                                                                                                                                                               |
| 4   | Sheet Chi tiết Đơn |         | Mã đơn, ngày đặt, badge trạng thái, mã vận đơn (nếu có), Địa Chỉ Giao Hàng, danh sách Sản Phẩm kèm nút "Đánh giá" (màu vàng) cho từng dòng hàng khi đơn đã giao; tóm tắt giá; phương thức thanh toán; nút "Hủy đơn" (nếu đơn Chờ xử lý). |
| 5   | Dialog Hủy đơn     |         | Cảnh báo + ô lý do (tuỳ chọn), nút "Không hủy" / "Xác nhận hủy".                                                                                                                                                                           |
| 6   | Dialog Đánh giá    |         | Chọn số sao 1–5 (có nhãn: Rất tệ / Tệ / Bình thường / Tốt / Rất tốt), ô nhập nhận xét (tối đa 1 000 ký tự), tải lên ảnh thực tế (tuỳ chọn, tối đa 5 ảnh), nút "Hủy" / "Gửi đánh giá".                                                     |



| Tên               | Mô tả                                                                  | Thành công                                                                                      | Thất bại                                                          |
| ----------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Xem chi tiết      | Bấm "Chi tiết".                                                        | Mở Sheet với đầy đủ thông tin đơn.                                                              | Hiển thị skeleton khi đang tải.                                   |
| Hủy đơn           | Mở Sheet → bấm "Hủy đơn" → điền lý do → "Xác nhận hủy".               | Đơn chuyển sang trạng thái Đã hủy, danh sách cập nhật.                                          | Hiển thị Toast lỗi nếu đơn không cho phép huỷ.                    |
| Gửi đánh giá      | Bấm "Đánh giá" trên dòng hàng → chọn sao → nhập nội dung → "Gửi".     | Toast "Cảm ơn bạn đã đánh giá!", nút đổi thành "Đã đánh giá ✓" (màu xanh), đánh giá hiển thị công khai ngay trên trang sản phẩm. | Hiển thị Toast lỗi nếu chưa chọn sao hoặc đã đánh giá sản phẩm này trước đó. |
| Khám phá sản phẩm | Empty state — bấm "Khám phá sản phẩm".                                 | Điều hướng tới trang Danh sách sản phẩm.                                                        | —                                                                 |


---

### 2.14. UI_14 — Tài khoản của tôi

#### 2.14.1. Bảng mẫu

*Hình 2.14. Giao diện trang Tài khoản của tôi.*

#### 2.14.2. Đặc tả chi tiết


| Màn hình  | Tài khoản của tôi                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Trang Hồ Sơ Khách Hàng với 4 tab: Hồ sơ (xem/chỉnh sửa Họ Tên + SĐT), Địa chỉ (thêm/cập nhật/xoá Địa Chỉ Giao Hàng), Thông báo, Bảo mật (đổi mật khẩu, xoá tài khoản). |
| Truy cập  | Bấm avatar hoặc menu Tài khoản trên thanh điều hướng (yêu cầu đăng nhập).                                                                                 |
| Đối tượng | Khách Hàng.                                                                                                                                               |



| Mục | Kiểu           | Dữ liệu | Mô tả                                                                                                                             |
| --- | -------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Sidebar Tabs   |         | 4 tab: Hồ sơ / Địa chỉ / Thông báo / Bảo mật + Avatar và tên người dùng.                                                          |
| 2   | Tab Hồ sơ      |         | Hiển thị Avatar, Họ tên, Vai trò, ngày tham gia; các trường Họ Tên, Email (chỉ đọc), SĐT, Ngày tham gia; nút "Chỉnh sửa"/"Lưu".   |
| 3   | Tab Địa chỉ    |         | Danh sách Địa Chỉ Giao Hàng + nút "Thêm địa chỉ"; mỗi card có nút Sửa, Xoá, Đặt làm mặc định.                                     |
| 4   | Dialog Địa chỉ |         | Form: Họ tên *, SĐT *, Địa chỉ chi tiết *, Quận/Huyện, Tỉnh/Thành *, Loại địa chỉ (Nhà riêng / Văn phòng), checkbox đặt mặc định. |
| 5   | Tab Thông báo  |         | Cài đặt nhận thông báo qua email/đẩy/SMS.                                                                                         |
| 6   | Tab Bảo mật    |         | Form đổi mật khẩu: Mật khẩu hiện tại, Mật khẩu mới, Xác nhận mật khẩu (kèm hiển/ẩn). Có khu vực Xoá tài khoản.                    |



| Tên              | Mô tả                                       | Thành công                                                       | Thất bại                                                                                          |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Chỉnh sửa hồ sơ  | Bấm "Chỉnh sửa", sửa Họ Tên/SĐT, bấm "Lưu". | Hiển thị Toast thành công, dữ liệu cập nhật.                     | Hiển thị Toast lỗi.                                                                               |
| Thêm địa chỉ     | Bấm "Thêm địa chỉ", điền form, bấm "Lưu".   | Hiển thị Toast thành công, danh sách cập nhật, đóng dialog.      | Hiển thị Toast "Vui lòng điền đầy đủ họ tên, SĐT, địa chỉ và tỉnh/thành."                         |
| Cập nhật địa chỉ | Bấm "Sửa" trên card địa chỉ, sửa, "Lưu".    | Hiển thị Toast thành công, card cập nhật.                        | Hiển thị Toast lỗi.                                                                               |
| Xoá địa chỉ      | Bấm "Xoá", xác nhận.                        | Hiển thị Toast thành công, card biến mất.                        | Hiển thị Toast lỗi.                                                                               |
| Đặt làm mặc định | Bấm "Đặt mặc định".                         | Hiển thị Toast thành công, badge "Mặc định" chuyển sang card mới. | Hiển thị Toast lỗi.                                                                               |
| Đổi mật khẩu     | Tab Bảo mật, nhập 3 trường, submit.         | Hiển thị Toast thành công, làm sạch biểu mẫu.                    | Hiển thị Toast "Mật khẩu mới và xác nhận không khớp." / "Mật khẩu mới phải có ít nhất 6 ký tự." / lỗi tương ứng. |
| Xoá tài khoản    | Bấm "Xoá tài khoản" và xác nhận.            | Tài khoản bị xoá và đăng xuất.                                   | Hiển thị Toast lỗi.                                                                               |


---

### 2.15. UI_15 — Tổng quan Quản Trị

#### 2.15.1. Bảng mẫu

*Hình 2.15. Giao diện trang Tổng quan Quản trị.*

#### 2.15.2. Đặc tả chi tiết


| Màn hình  | Tổng quan Quản Trị                                                                                                                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Dashboard tổng hợp số liệu vận hành toàn hệ thống: KPI Cards, biểu đồ theo thời gian, phân phối trạng thái Đơn Hàng (Giao hàng / Thanh toán), phân phối trạng thái Hợp Đồng, bảng hoạt động gần đây. Có bộ chọn khoảng thời gian. |
| Truy cập  | Đăng nhập với vai trò Admin, sau đó chọn mục "Tổng quan" trên Sidebar.                                                                                                                                               |
| Đối tượng | Admin.                                                                                                                                                                                                               |



| Mục | Kiểu               | Dữ liệu | Mô tả                                                             |
| --- | ------------------ | ------- | ----------------------------------------------------------------- |
| 1   | Tiêu đề            |         | "Tổng quan quản trị".                                             |
| 2   | Time Range         |         | Lựa chọn 7 ngày / 14 ngày / 30 ngày / 90 ngày / Tuỳ chỉnh.        |
| 3   | KPI Cards          |         | Số liệu các section: Người Dùng, Hợp Đồng, Đơn Hàng, Doanh Thu... |
| 4   | Biểu đồ Timeseries |         | Đường thời gian Đơn Hàng & Doanh Thu.                             |
| 5   | Biểu đồ tròn       |         | Phân phối trạng thái Giao hàng / Thanh toán của Đơn Hàng.         |
| 6   | Biểu đồ tròn       |         | Phân phối trạng thái Hợp Đồng.                                    |
| 7   | Bảng hoạt động     |         | Hoạt động gần đây trên hệ thống.                                  |
| 8   | Alert lỗi          |         | Khi không tải được dashboard, hiển thị nút "Thử lại".             |



| Tên                  | Mô tả                            | Thành công                    | Thất bại                                  |
| -------------------- | -------------------------------- | ----------------------------- | ----------------------------------------- |
| Đổi khoảng thời gian | Chọn preset hoặc nhập tuỳ chỉnh. | Dữ liệu KPI/biểu đồ cập nhật. | —                                         |
| Tải lại khi lỗi      | Bấm "Thử lại".                   | Hệ thống tải lại dữ liệu.     | Tiếp tục hiển thị alert lỗi nếu vẫn lỗi.  |


---

### 2.16. UI_16 — Quản lý Tài khoản

#### 2.16.1. Bảng mẫu

*Hình 2.16a. Danh sách Tài khoản.*
*Hình 2.16b. Thêm Tài khoản (Sheet bên phải).*
*Hình 2.16c. Cập nhật Tài khoản (Sheet bên phải).*
*Hình 2.16d. Hộp thoại Xoá Tài khoản.*

#### 2.16.2. Đặc tả chi tiết — Danh sách Tài khoản


| Màn hình  | Danh sách Tài khoản                                                                                                                                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Hiển thị lưới card tài khoản trong hệ thống, có thể lọc theo Vai Trò (Admin / Giám Sát Viên / Nhân Viên Kho / Khách Hàng), Trạng Thái (Hoạt động / Ngưng hoạt động / Tạm khoá), tìm theo tên/email/SĐT. Hỗ trợ chuyển nhanh giữa các nhóm Người Dùng, Giám Sát Viên, Nhân Viên Kho và Nông Dân. |
| Truy cập  | Người dùng chọn "Quản lý Tài khoản" trên Sidebar Admin.                                                                                                                                                            |
| Đối tượng | Admin.                                                                                                                                                                                                            |



| Mục | Kiểu              | Dữ liệu                        | Mô tả                                                                                                                                  |
| --- | ----------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Tiêu đề           |                                | "Quản lý người dùng" + mô tả.                                                                                                          |
| 2   | Text box (search) | Mặc định: rỗng, debounce 300ms | Tìm theo tên, email, SĐT.                                                                                                              |
| 3   | Dropdown          | Mặc định: Tất cả vai trò       | Vai trò: Tất cả / Admin / Giám Sát Viên / Nhân Viên Kho / Khách Hàng.                                                                  |
| 4   | Dropdown          | Mặc định: Tất cả trạng thái    | Trạng thái: Tất cả / Hoạt động / Ngưng hoạt động / Tạm khoá.                                                                           |
| 5   | Button            |                                | "+ Thêm người dùng".                                                                                                                   |
| 6   | Lưới Card         |                                | Mỗi card hiển thị Avatar, Họ Tên, ID rút gọn, badge Vai Trò, badge Trạng Thái, Email, SĐT, Tỉnh (nếu Client). Bấm card mở Sheet sửa.   |
| 7   | Button (icon)     |                                | Sửa / Xoá trên từng card.                                                                                                              |
| 8   | Pagination        |                                | Trang hiện tại / Tổng.                                                                                                                 |
| 9   | Khối tóm tắt      |                                | "Hiển thị X / Y người dùng. Đang hoạt động: N. Giới hạn mỗi trang: 15."                                                                |



| Tên                      | Mô tả                            | Thành công                  | Thất bại                                        |
| ------------------------ | -------------------------------- | --------------------------- | ----------------------------------------------- |
| Tìm kiếm                 | Nhập từ khoá.                    | Lưới cập nhật sau debounce. | —                                               |
| Lọc Vai Trò / Trạng Thái | Chọn dropdown.                   | Lưới cập nhật, trang về 1.  | —                                               |
| Mở Sheet Sửa             | Bấm card hoặc icon Pencil.       | Mở Sheet Cập nhật.          | —                                               |
| Mở Sheet Thêm            | Bấm "+ Thêm người dùng".         | Mở Sheet Thêm.              | Vô hiệu hoá khi đang xem nhóm Khách Hàng.       |
| Mở Dialog Xoá            | Bấm icon Trash.                  | Mở hộp thoại xác nhận xoá.  | —                                               |


#### 2.16.3. Đặc tả chi tiết — Thêm Tài khoản


| Màn hình  | Thêm Tài khoản                                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Sheet bên phải để Admin tạo Tài khoản mới với Vai Trò Giám Sát Viên / Nhân Viên Kho / Shipper. Khi chọn Vai Trò Shipper, hiện thêm trường Phương Tiện và Biển Số. |
| Truy cập  | Bấm nút "+ Thêm người dùng" trên màn hình Danh sách Tài khoản.                                                                                              |
| Đối tượng | Admin.                                                                                                                                                      |



| Mục | Kiểu                | Dữ liệu                      | Mô tả                                                          |
| --- | ------------------- | ---------------------------- | -------------------------------------------------------------- |
| 1   | Text box            | Yêu cầu: có                  | Họ tên.                                                        |
| 2   | Text box (email)    | Yêu cầu: có, định dạng email | Email.                                                         |
| 3   | Text box (tel)      | Tuỳ chọn                     | Số điện thoại.                                                 |
| 4   | Text box (password) | Yêu cầu: có                  | Mật khẩu.                                                      |
| 5   | Dropdown            | Yêu cầu: có                  | Vai trò (Giám Sát Viên / Nhân Viên Kho / Shipper).             |
| 6   | File upload         | Tối đa 5MB                   | Ảnh đại diện.                                                  |
| 7   | Dropdown            | Hiện khi vai trò là Shipper  | Phương tiện: Xe máy / Xe tải / Van.                            |
| 8   | Text box            | Hiện khi vai trò là Shipper  | Biển số xe.                                                    |
| 9   | Button              |                              | "Tạo người dùng".                                              |
| 10  | AlertDialog         |                              | Xác nhận đóng nếu biểu mẫu đã có thay đổi chưa lưu.            |



| Tên               | Mô tả                | Thành công                                                                            | Thất bại                                                                                                |
| ----------------- | -------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Tạo người dùng    | Điền form + submit.  | Hiển thị Toast "Tạo người dùng thành công!", danh sách được cập nhật, đóng Sheet.     | Hiển thị Toast "Tạo người dùng thất bại" hoặc lỗi cụ thể (email trùng, mật khẩu yếu...).                |
| Đóng khi đang sửa | Bấm X / ngoài Sheet. | Mở hộp thoại "Xác nhận đóng biểu mẫu" / "Bạn có thay đổi chưa lưu...".                | —                                                                                                       |


#### 2.16.4. Đặc tả chi tiết — Cập nhật Tài khoản


| Màn hình  | Cập nhật Tài khoản                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| Mô tả     | Sheet bên phải để Admin chỉnh sửa thông tin Tài khoản đã chọn (Họ Tên, Vai Trò, Trạng Thái, SĐT, Avatar).   |
| Truy cập  | Bấm vào card tài khoản hoặc icon Pencil trong danh sách.                                                    |
| Đối tượng | Admin.                                                                                                      |



| Mục | Kiểu             | Dữ liệu | Mô tả                                                       |
| --- | ---------------- | ------- | ----------------------------------------------------------- |
| 1   | Text box         |         | Họ tên.                                                     |
| 2   | Text box (email) | Chỉ đọc | Email không đổi.                                            |
| 3   | Text box         |         | Số điện thoại.                                              |
| 4   | Dropdown         |         | Vai trò.                                                    |
| 5   | Dropdown         |         | Trạng thái (Hoạt động / Ngưng hoạt động / Tạm khoá).        |
| 6   | File upload      |         | Avatar mới.                                                 |
| 7   | Button           |         | "Lưu thay đổi".                                             |



| Tên      | Mô tả             | Thành công                                                  | Thất bại            |
| -------- | ----------------- | ----------------------------------------------------------- | ------------------- |
| Cập nhật | Sửa và bấm "Lưu". | Hiển thị Toast thành công, danh sách được cập nhật.         | Hiển thị Toast lỗi. |


#### 2.16.5. Đặc tả chi tiết — Xoá Tài khoản


| Màn hình  | Xoá Tài khoản                                  |
| --------- | ---------------------------------------------- |
| Mô tả     | Hộp thoại xác nhận xoá Tài khoản đã chọn.      |
| Truy cập  | Bấm icon Trash trên card hoặc trong Sheet sửa. |
| Đối tượng | Admin.                                         |



| Mục | Kiểu                 | Dữ liệu | Mô tả                                                                                                    |
| --- | -------------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| 1   | Label                |         | Tiêu đề "Xóa người dùng" và mô tả "Bạn có chắc muốn xóa người dùng X? Hành động này không thể hoàn tác." |
| 2   | Button               |         | "Hủy".                                                                                                   |
| 3   | Button (destructive) |         | "Xóa".                                                                                                   |



| Tên          | Mô tả      | Thành công                                                  | Thất bại            |
| ------------ | ---------- | ----------------------------------------------------------- | ------------------- |
| Xác nhận xoá | Bấm "Xóa". | Hiển thị Toast thành công, tài khoản bị xoá khỏi danh sách. | Hiển thị Toast lỗi. |
| Huỷ          | Bấm "Hủy". | Đóng hộp thoại.                                             | —                   |


---

### 2.17. UI_17 — Quản lý Vùng Trồng (GIS — Admin)

#### 2.17.1. Bảng mẫu

*Hình 2.17. Giao diện GIS Workspace cho Admin.*

#### 2.17.2. Đặc tả chi tiết


| Màn hình  | Quản lý Vùng Trồng (GIS)                                                                                                          |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Bản đồ GIS toàn hệ thống cho Admin. Hỗ trợ xem polygon Lô Đất; có thể được mở từ trang Quản lý Lô đất kèm danh sách tọa độ Hợp Đồng. |
| Truy cập  | Người dùng chọn "Quản lý Vùng trồng" trên Sidebar Admin. Cũng có thể mở từ nút "Xem lô đất trên bản đồ" tại trang Quản lý Lô đất (UI_18). |
| Đối tượng | Admin.                                                                                                                            |



| Mục | Kiểu           | Dữ liệu | Mô tả                                                                          |
| --- | -------------- | ------- | ------------------------------------------------------------------------------ |
| 1   | Tiêu đề        |         | "Quản Lý Vùng Trồng".                                                          |
| 2   | Bản đồ GIS     |         | Hiển thị bản đồ với polygon Lô Đất.                                            |
| 3   | Khối thông tin |         | Hiển thị số Hợp Đồng và danh sách điểm tọa độ.                                 |



| Tên                   | Mô tả                                              | Thành công                    | Thất bại                                                  |
| --------------------- | -------------------------------------------------- | ----------------------------- | --------------------------------------------------------- |
| Xem polygon từ Lô Đất | Mở trang từ Quản lý Lô đất kèm danh sách tọa độ.   | Hiển thị polygon trên bản đồ. | Nếu dưới 3 điểm hoặc dữ liệu không hợp lệ: không vẽ.      |


---

### 2.18. UI_18 — Quản lý Lô Đất

#### 2.18.1. Bảng mẫu

*Hình 2.18a. Danh sách Lô Đất.*
*Hình 2.18b. Sheet chi tiết / cập nhật Lô Đất.*

#### 2.18.2. Đặc tả chi tiết


| Màn hình  | Quản lý Lô Đất                                                                                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Danh sách Lô Đất với lọc theo Loại Cây (Tất cả / Cà phê / Sầu riêng), Giám Sát Viên, tìm theo tên/mã/Tỉnh/Nông Dân; mở Sheet để cập nhật và xoá; xem polygon Lô Đất trên bản đồ. |
| Truy cập  | Người dùng chọn "Quản lý Lô đất" trên Sidebar Admin.                                                                                                                             |
| Đối tượng | Admin.                                                                                                                                                                           |



| Mục | Kiểu               | Dữ liệu | Mô tả                                                                                                                                                 |
| --- | ------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Text box (search)  |         | Tìm theo tên Lô, mã Lô, Tỉnh, Nông Dân.                                                                                                               |
| 2   | Button group       |         | Lọc Loại Cây: Tất cả / Cà phê / Sầu riêng.                                                                                                            |
| 3   | Dropdown           |         | Lọc Giám Sát Viên.                                                                                                                                    |
| 4   | Khối Quick stats   |         | "Tổng lô: N", "Tổng diện tích: X ha".                                                                                                                 |
| 5   | Lưới Card          |         | Tên Lô, mã Lô, Nông Dân, Giám Sát Viên, Tỉnh/Huyện, Diện tích, badge Loại Cây.                                                                        |
| 6   | Button (icon)      |         | Sửa / Xoá trên card.                                                                                                                                  |
| 7   | Sheet chi tiết     |         | Form: Tên Lô, Nông Dân phụ trách, Mã hợp đồng, Diện tích (ha), Giám Sát Viên phụ trách (dropdown), Loại Cây (Cà phê / Sầu riêng), Bảng tọa độ Lô Đất. |
| 8   | Button trong Sheet |         | "Xem lô đất trên bản đồ" (hiện khi có tọa độ ≥3 điểm).                                                                                                |
| 9   | AlertDialog Xoá    |         | Xác nhận xoá.                                                                                                                                         |
| 10  | Pagination         |         | 6 mục/trang.                                                                                                                                          |



| Tên         | Mô tả                         | Thành công                                                                                                                  | Thất bại                                                                                                  |
| ----------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Lọc & Tìm   | Nhập search/chọn filter.      | Danh sách cập nhật, trang về 1.                                                                                             | —                                                                                                         |
| Mở chi tiết | Bấm card.                     | Mở Sheet với dữ liệu Lô.                                                                                                    | —                                                                                                         |
| Cập nhật Lô | Sửa form → "Lưu thay đổi".    | Hiển thị Toast thành công, dữ liệu được cập nhật; nếu thiếu Giám Sát Viên → Toast "Vui lòng chọn giám sát viên phụ trách". | Hiển thị Toast lỗi hoặc cảnh báo kiểm tra ("Vui lòng nhập tên lô đất", "Diện tích phải lớn hơn 0").       |
| Xoá Lô      | Bấm Trash → "Xác nhận xóa".   | Hiển thị Toast thành công, Lô biến mất.                                                                                     | Hiển thị Toast lỗi.                                                                                       |
| Xem bản đồ  | Bấm "Xem lô đất trên bản đồ". | Điều hướng tới trang Quản lý Vùng trồng kèm danh sách tọa độ.                                                               | —                                                                                                         |


---

### 2.19. UI_19 — Quản lý hợp đồng (Admin)

#### 2.19.1. Bảng mẫu

*Hình 2.19. Danh sách Hợp Đồng (Admin).*

#### 2.19.2. Đặc tả chi tiết


| Màn hình  | Quản lý hợp đồng (Admin)                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mô tả     | Danh sách Hợp Đồng toàn hệ thống với tìm kiếm theo số hợp đồng/Nông Dân/Lô Đất; lọc Trạng Thái: Chờ phê duyệt / Bị từ chối / Đang hiệu lực / Hết hiệu lực. Bấm card để mở chi tiết. |
| Truy cập  | Người dùng chọn "Quản lý hợp đồng" trên Sidebar Admin.                                                                                                                         |
| Đối tượng | Admin.                                                                                                                                                                         |



| Mục | Kiểu              | Dữ liệu | Mô tả                                                                                      |
| --- | ----------------- | ------- | ------------------------------------------------------------------------------------------ |
| 1   | Text box (search) |         | Tìm theo số hợp đồng, Nông Dân, Lô Đất (debounce 300ms).                                   |
| 2   | Dropdown          |         | Trạng thái: Tất cả / Chờ phê duyệt / Bị từ chối / Đang hiệu lực / Hết hiệu lực.            |
| 3   | Quick stats       |         | Đang hiệu lực, Chờ duyệt, Bị từ chối, Hết hiệu lực.                                        |
| 4   | Lưới Card         |         | Số hợp đồng, Nông Dân, mã Lô, badge Trạng Thái, badge Loại Cây, badge Phẩm Cấp, diện tích. |
| 5   | Pagination        |         | 12 mục/trang.                                                                              |



| Tên         | Mô tả                             | Thành công                                                | Thất bại |
| ----------- | --------------------------------- | --------------------------------------------------------- | -------- |
| Tìm & Lọc   | Nhập search hoặc chọn trạng thái. | Danh sách cập nhật.                                       | —        |
| Mở chi tiết | Bấm card.                         | Điều hướng tới trang Chi tiết & Phê duyệt Hợp Đồng.       | —        |


---

### 2.20. UI_20 — Chi tiết & Phê duyệt Hợp Đồng

#### 2.20.1. Bảng mẫu

*Hình 2.20. Giao diện Chi tiết Hợp Đồng (Admin).*

#### 2.20.2. Đặc tả chi tiết


| Màn hình  | Chi tiết Hợp Đồng                                                                                                                                                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mô tả     | Trang chi tiết Hợp Đồng — Admin xem nội dung theo mẫu hợp đồng pháp lý, in PDF; nếu Hợp Đồng đang chờ duyệt thì có thể Phê duyệt hoặc Từ chối. Nếu là Bản nháp do Giám Sát Viên mở chế độ chỉnh sửa, hỗ trợ chỉnh các trường Tỉnh/Huyện Lô Đất, Diện tích, Tọa độ, Loại Cây, Phẩm Cấp, Ngày Ký, Ngày Thu Hoạch và "Gửi duyệt". |
| Truy cập  | Bấm card tại trang Quản lý hợp đồng (Admin — UI_19) hoặc trang Hợp đồng liên kết (Giám Sát Viên — UI_28).                                                                                                                                                                                                    |
| Đối tượng | Admin / Giám Sát Viên.                                                                                                                                                                                                                                                                                       |



| Mục | Kiểu                  | Dữ liệu | Mô tả                                                                                                                                             |
| --- | --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Breadcrumb            |         | "Hợp đồng / [Số HĐ]".                                                                                                                             |
| 2   | Header                |         | Số Hợp Đồng, badge Trạng Thái, Loại Cây, Phẩm Cấp.                                                                                                |
| 3   | Mẫu hợp đồng pháp lý  |         | Hiển thị Hợp Đồng đầy đủ theo mẫu pháp lý.                                                                                                        |
| 4   | Khối thông tin Lô Đất |         | Tỉnh/Huyện/Diện tích/Tọa độ — chỉ đọc khi không ở chế độ Bản nháp, có thể chỉnh khi Bản nháp.                                                     |
| 5   | Combobox / Input      |         | Tỉnh, Huyện, Diện tích (ha), Loại Cây (Cà phê / Sầu riêng), Phẩm Cấp (Tiêu Chuẩn / Cao Cấp), Ngày Ký, Ngày Thu Hoạch.                             |
| 6   | Bảng tọa độ           |         | Danh sách điểm Lat/Lng (mỗi điểm có nút xoá, có nút "+ Thêm điểm").                                                                               |
| 7   | Button                |         | "Lưu nháp" (chế độ Bản nháp).                                                                                                                     |
| 8   | Button                |         | "Gửi duyệt" — chuyển Bản nháp sang trạng thái Chờ phê duyệt.                                                                                      |
| 9   | Button                |         | "Phê duyệt" (Admin, khi đang Chờ phê duyệt).                                                                                                      |
| 10  | Button (destructive)  |         | "Từ chối" (Admin, khi đang Chờ phê duyệt).                                                                                                        |
| 11  | Button                |         | "In PDF" — mở cửa sổ in của trình duyệt.                                                                                                          |
| 12  | Button (link)         |         | "← Quay về danh sách".                                                                                                                            |



| Tên       | Mô tả                                | Thành công                                                            | Thất bại                                                                                                                  |
| --------- | ------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Lưu nháp  | Bấm "Lưu nháp" với Bản nháp hợp lệ.  | Hiển thị Toast thành công, dữ liệu được lưu.                          | Hiển thị Toast lỗi kiểm tra ("Nhập Tỉnh/Thành...", "Diện tích chuẩn không hợp lệ", "Danh sách tọa độ phải là các số hợp lệ"). |
| Gửi duyệt | Bấm "Gửi duyệt" trên Bản nháp.       | Hợp Đồng chuyển sang Chờ phê duyệt, đẩy vào hàng chờ duyệt.           | Hiển thị Toast lỗi.                                                                                                       |
| Phê duyệt | Admin bấm "Phê duyệt".               | Hợp Đồng chuyển sang Đang hiệu lực; hiển thị Toast thành công.        | Hiển thị Toast lỗi.                                                                                                       |
| Từ chối   | Admin bấm "Từ chối", nhập lý do.     | Hợp Đồng chuyển sang Bị từ chối.                                      | Hiển thị Toast lỗi.                                                                                                       |
| In PDF    | Bấm "In PDF".                        | Mở cửa sổ in của trình duyệt.                                         | —                                                                                                                         |


---

### 2.21. UI_21 — Báo cáo hằng ngày (Admin)

#### 2.21.1. Bảng mẫu

*Hình 2.21a. Danh sách Báo Cáo Hàng Ngày.*
*Hình 2.21b. Dialog chi tiết Báo Cáo.*

#### 2.21.2. Đặc tả chi tiết


| Màn hình  | Báo cáo hằng ngày (Admin)                                                                                                                                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Bảng danh sách Báo Cáo Hàng Ngày từ Giám Sát Viên với tabs Loại Báo Cáo (Tất cả / Định kỳ / Sự cố / Thu hoạch), lọc theo Giám Sát Viên, khoảng ngày (Từ — Đến hoặc "Chỉ hôm nay"), tìm theo nội dung; mở dòng để xem chi tiết và ảnh đính kèm. |
| Truy cập  | Người dùng chọn "Báo cáo hằng ngày" trên Sidebar Admin.                                                                                                                                                                                       |
| Đối tượng | Admin.                                                                                                                                                                                                                                        |



| Mục | Kiểu              | Dữ liệu | Mô tả                                                                             |
| --- | ----------------- | ------- | --------------------------------------------------------------------------------- |
| 1   | Badge             |         | "Đã nộp hôm nay: N", "Chưa gửi hôm nay: N lô".                                    |
| 2   | Tabs              |         | Tất cả / Định kỳ / Sự cố / Thu hoạch (badge số lượng cần xử lý).                  |
| 3   | Card sản lượng    |         | (Tab Thu hoạch) Tổng sản lượng dự kiến (kg).                                      |
| 4   | Text box (search) |         | Tìm theo nội dung.                                                                |
| 5   | Combobox          |         | Giám Sát Viên (gồm "Tất cả Giám Sát Viên").                                       |
| 6   | Date picker       |         | Từ ngày.                                                                          |
| 7   | Date picker       |         | Đến ngày.                                                                         |
| 8   | Checkbox          |         | "Chỉ hôm nay" — tự động đặt Từ/Đến = hôm nay.                                     |
| 9   | DataTable         |         | Cột: Ngày, Loại, Lô Đất, Giám Sát Viên, Nội dung, Trạng Thái, Ảnh.                |
| 10  | Dialog chi tiết   |         | Mở dòng → hiển thị Báo Cáo: Lô Đất, Loại, Nội dung, Sản lượng, Ngày, Ảnh đính kèm. |



| Tên          | Mô tả             | Thành công                     | Thất bại                                                                                        |
| ------------ | ----------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| Lọc          | Chỉnh các bộ lọc. | DataTable cập nhật.            | Hiển thị lỗi "Khoảng ngày không hợp lệ: Từ ngày phải nhỏ hơn hoặc bằng Đến ngày" khi sai khoảng ngày. |
| Mở chi tiết  | Bấm dòng.         | Dialog mở với dữ liệu báo cáo. | —                                                                                               |
| Đổi tab Loại | Bấm tab.          | Cột danh sách lọc theo loại.   | —                                                                                               |


---

### 2.22. UI_22 — Giám sát Kho hàng (Admin)

#### 2.22.1. Bảng mẫu

*Hình 2.22a. Danh sách Kho Hàng.*
*Hình 2.22b. Sheet Thêm / Sửa Kho.*

#### 2.22.2. Đặc tả chi tiết


| Màn hình  | Giám sát Kho hàng (Admin)                                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Admin tạo, cập nhật và gán Nhân Viên Kho phụ trách cho từng Kho Hàng. Có thể lọc theo Trạng Thái (Tất cả / Hoạt động / Ngưng) và mở Sheet chi tiết. |
| Truy cập  | Người dùng chọn "Giám sát Kho hàng" trên Sidebar Admin.                                                                                             |
| Đối tượng | Admin.                                                                                                                                              |



| Mục | Kiểu             | Dữ liệu | Mô tả                                                                                           |
| --- | ---------------- | ------- | ----------------------------------------------------------------------------------------------- |
| 1   | Tiêu đề          |         | "Quản lý kho hàng".                                                                             |
| 2   | Button           |         | "+ Thêm kho".                                                                                   |
| 3   | Dropdown         |         | Lọc Trạng Thái: Tất cả / Hoạt động / Ngưng.                                                     |
| 4   | DataTable        |         | Cột: Tên Kho, Địa chỉ, Sức chứa (kg), Nhân Viên Kho phụ trách, Trạng Thái.                      |
| 5   | Sheet Thêm / Sửa |         | Form: Tên kho *, Địa chỉ, Sức chứa (kg), Trạng thái (toggle), Nhân Viên Kho (Combobox + ô tìm). |



| Tên               | Mô tả                               | Thành công                                            | Thất bại            |
| ----------------- | ----------------------------------- | ----------------------------------------------------- | ------------------- |
| Thêm Kho          | Bấm "+ Thêm kho", điền form, "Lưu". | Hiển thị Toast thành công, danh sách được cập nhật.   | Hiển thị Toast lỗi. |
| Sửa Kho           | Bấm dòng → Sheet, sửa, "Lưu".       | Hiển thị Toast thành công.                            | Hiển thị Toast lỗi. |
| Gán Nhân Viên Kho | Chọn trong Combobox.                | Cập nhật người quản lý của Kho.                       | —                   |
| Xem chi tiết      | Bấm dòng.                           | Mở Sheet chi tiết.                                    | —                   |


---

### 2.23. UI_23 — Đơn hàng & Thanh toán (Admin)

#### 2.23.1. Bảng mẫu

*Hình 2.23a. Danh sách Đơn Hàng.*
*Hình 2.23b. Sheet chi tiết Đơn Hàng.*

#### 2.23.2. Đặc tả chi tiết


| Màn hình  | Đơn hàng & Thanh toán (Admin)                                                                                                                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Bảng theo dõi Đơn Hàng toàn hệ thống — tìm theo mã đơn, lọc Trạng Thái Giao Hàng + Thanh Toán; Sheet chi tiết hiển thị thông tin đơn, sản phẩm, địa chỉ, tóm tắt giá. Chỉ xem (không cập nhật từ trang này). |
| Truy cập  | Người dùng chọn "Đơn hàng & Thanh toán" trên Sidebar Admin.                                                                                                                                                 |
| Đối tượng | Admin.                                                                                                                                                                                                      |



| Mục | Kiểu              | Dữ liệu | Mô tả                                                                                                                                                    |
| --- | ----------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Text box (search) |         | Tìm mã đơn.                                                                                                                                              |
| 2   | Dropdown          |         | Trạng thái giao: Tất cả / Chờ xử lý / Đang đóng gói / Đang giao / Đã giao / Đã huỷ.                                                                      |
| 3   | Dropdown          |         | Thanh toán: Tất cả / Chờ / Đã thanh toán / Thất bại / Hoàn tiền.                                                                                          |
| 4   | DataTable         |         | Cột: Mã đơn, Khách, Tổng, Ngày, Thanh toán, Giao hàng, Hành động.                                                                                        |
| 5   | Sheet chi tiết    |         | Hiển thị: Mã đơn, ngày, Khách + SĐT, badge Thanh toán/Giao hàng, mã vận đơn, Địa Chỉ Giao Hàng, danh sách Sản Phẩm, tóm tắt giá, Phương Thức Thanh Toán. |



| Tên         | Mô tả                            | Thành công                            | Thất bại |
| ----------- | -------------------------------- | ------------------------------------- | -------- |
| Tìm & Lọc   | Nhập search hoặc chọn dropdown.  | Bảng cập nhật, trang về 1.            | —        |
| Mở chi tiết | Bấm icon Eye.                    | Mở Sheet chi tiết.                    | —        |


---

### 2.24. UI_24 — Tổng quan Giám Sát Viên

#### 2.24.1. Bảng mẫu

*Hình 2.24. Giao diện trang Tổng quan Giám Sát Viên.*

#### 2.24.2. Đặc tả chi tiết


| Màn hình  | Tổng quan Giám Sát Viên                                                                                                                                                                      |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Dashboard giám sát theo phạm vi của Giám Sát Viên: KPI Cards, biểu đồ theo thời gian, phân phối trạng thái Hợp Đồng & Báo Cáo, bảng hoạt động gần đây; cảnh báo nếu còn Lô chưa Báo Cáo hôm nay. |
| Truy cập  | Đăng nhập với vai trò Giám Sát Viên, sau đó chọn "Tổng quan" trên Sidebar.                                                                                                                  |
| Đối tượng | Giám Sát Viên.                                                                                                                                                                              |



| Mục | Kiểu           | Dữ liệu | Mô tả                                                                |
| --- | -------------- | ------- | -------------------------------------------------------------------- |
| 1   | Tiêu đề        |         | "Tổng quan giám sát viên".                                           |
| 2   | Time Range     |         | 7 / 14 / 30 / 90 ngày / Tuỳ chỉnh.                                   |
| 3   | Alert          |         | "Hôm nay còn lô chưa báo cáo" — kèm link "Đi tới báo cáo hàng ngày". |
| 4   | KPI Cards      |         | Số Nông Dân, Lô Đất, Hợp Đồng, Báo Cáo...                            |
| 5   | Biểu đồ        |         | Theo thời gian, phân phối trạng thái Hợp Đồng, phân phối Báo Cáo.    |
| 6   | Bảng hoạt động |         | Hoạt động gần đây trong phạm vi.                                     |



| Tên            | Mô tả                    | Thành công                                          | Thất bại |
| -------------- | ------------------------ | --------------------------------------------------- | -------- |
| Đổi Time Range | Chọn preset / tuỳ chỉnh. | KPI & biểu đồ cập nhật.                             | —        |
| Đi tới báo cáo | Bấm link alert.          | Điều hướng tới trang Báo cáo hàng ngày của Giám Sát Viên. | —        |


---

### 2.25. UI_25 — Quản lý Nông Dân (Giám Sát Viên)

#### 2.25.1. Bảng mẫu

*Hình 2.25. Danh sách / Thêm / Sửa Nông Dân theo phạm vi Giám Sát Viên.*

#### 2.25.2. Đặc tả chi tiết


| Màn hình  | Quản lý Nông Dân (Giám Sát Viên)                                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Giám Sát Viên quản lý Nông Dân thuộc phạm vi mình — không có trường gán Giám Sát Viên (mặc định là chính mình).                          |
| Truy cập  | Người dùng chọn "Nông dân" trên Sidebar Giám Sát Viên.                                                                                    |
| Đối tượng | Giám Sát Viên.                                                                                                                            |



| Mục | Kiểu              | Dữ liệu | Mô tả                                                                                             |
| --- | ----------------- | ------- | ------------------------------------------------------------------------------------------------- |
| 1   | Text box (search) |         | Tìm theo Họ tên, SĐT, CCCD.                                                                       |
| 2   | Button            |         | "+ Thêm nông dân".                                                                                |
| 3   | Lưới Card         |         | Họ tên, SĐT, CCCD, Tỉnh, Địa chỉ, Trạng thái.                                                     |
| 4   | Sheet Thêm / Sửa  |         | Form: Họ tên *, SĐT *, CCCD *, Tỉnh, Địa chỉ, Tên ngân hàng, Chi nhánh, Số tài khoản, Trạng thái. |
| 5   | AlertDialog Xoá   |         | Xác nhận xoá.                                                                                     |



| Tên                   | Mô tả                                                                  | Thành công                | Thất bại                          |
| --------------------- | ---------------------------------------------------------------------- | ------------------------- | --------------------------------- |
| Thêm / Cập nhật / Xoá | Nông Dân tự động gắn với Giám Sát Viên đang đăng nhập.                | Hiển thị Toast thành công. | Hiển thị Toast lỗi kiểm tra dữ liệu. |


---

### 2.26. UI_26 — Lô đất phụ trách (Giám Sát Viên)

#### 2.26.1. Bảng mẫu

*Hình 2.26. Danh sách Lô Đất phụ trách + Sheet chi tiết.*

#### 2.26.2. Đặc tả chi tiết


| Màn hình  | Lô đất phụ trách (Giám Sát Viên)                                                                                                              |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Giám Sát Viên xem danh sách Lô Đất mình phụ trách, lọc theo Loại Cây, mở Sheet chỉnh sửa và đính kèm báo cáo.                                |
| Truy cập  | Người dùng chọn "Lô đất phụ trách" trên Sidebar Giám Sát Viên.                                                                                |
| Đối tượng | Giám Sát Viên.                                                                                                                                |



| Mục | Kiểu              | Dữ liệu | Mô tả                                                                      |
| --- | ----------------- | ------- | -------------------------------------------------------------------------- |
| 1   | Text box (search) |         | Tìm theo tên Lô, mã Lô, Nông Dân, Tỉnh.                                    |
| 2   | Button group      |         | Lọc Loại Cây.                                                              |
| 3   | Quick stats       |         | Tổng số Lô, Tổng diện tích.                                                |
| 4   | Lưới Card         |         | Thông tin Lô tương tự trang Quản lý Lô Đất.                                |
| 5   | Sheet chi tiết    |         | Cập nhật tên Lô, Nông Dân, Mã hợp đồng, Diện tích, Loại Cây, ảnh đính kèm. |
| 6   | Button            |         | "Vẽ GIS" — mở bản đồ để vẽ vùng cho Lô đất hiện tại.                       |



| Tên           | Mô tả                       | Thành công                                                  | Thất bại            |
| ------------- | --------------------------- | ----------------------------------------------------------- | ------------------- |
| Cập nhật Lô   | Sửa Sheet → "Lưu thay đổi". | Hiển thị Toast thành công, danh sách được cập nhật.         | Hiển thị Toast lỗi. |
| Đi tới bản đồ | Bấm "Vẽ GIS".               | Điều hướng tới trang Quản lý vùng trồng để vẽ cho Lô đất.   | —                   |


---

### 2.27. UI_27 — Quản lý vùng trồng (Giám Sát Viên)

#### 2.27.1. Bảng mẫu

*Hình 2.27. Giao diện GIS Workspace cho Giám Sát Viên.*

#### 2.27.2. Đặc tả chi tiết


| Màn hình  | Quản lý vùng trồng (Giám Sát Viên)                                                            |
| --------- | --------------------------------------------------------------------------------------------- |
| Mô tả     | Cho phép Giám Sát Viên vẽ polygon GIS và lưu tọa độ vào Lô Đất đang phụ trách.               |
| Truy cập  | Người dùng chọn "Quản lý vùng trồng" trên Sidebar Giám Sát Viên, hoặc nhấn nút "Vẽ GIS" tại trang Lô đất phụ trách (UI_26). |
| Đối tượng | Giám Sát Viên.                                                                                |



| Mục | Kiểu             | Dữ liệu | Mô tả                                        |
| --- | ---------------- | ------- | -------------------------------------------- |
| 1   | Tiêu đề          |         | "Vẽ GIS cho lô đất".                         |
| 2   | Bản đồ tương tác |         | Cho phép vẽ polygon, chỉnh điểm.             |
| 3   | Tool chú thích   |         | Hiển thị số Hợp Đồng, danh sách điểm tọa độ. |
| 4   | Button           |         | "Lưu tọa độ".                                |



| Tên        | Mô tả                        | Thành công                                          | Thất bại                          |
| ---------- | ---------------------------- | --------------------------------------------------- | --------------------------------- |
| Vẽ polygon | Click trên bản đồ, kéo điểm. | Polygon hiển thị.                                   | —                                 |
| Lưu tọa độ | Bấm Lưu.                     | Hiển thị Toast thành công, lưu tọa độ vào Lô Đất.   | Hiển thị Toast lỗi nếu dưới 3 điểm. |


---

### 2.28. UI_28 — Hợp đồng liên kết (Giám Sát Viên)

#### 2.28.1. Bảng mẫu

*Hình 2.28. Danh sách Hợp Đồng do Giám Sát Viên quản lý.*

#### 2.28.2. Đặc tả chi tiết


| Màn hình  | Hợp đồng liên kết (Giám Sát Viên)                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| Mô tả     | Hiển thị Hợp Đồng do Giám Sát Viên tạo và quản lý; lọc Trạng Thái (bao gồm Bản nháp) và nút "+ Tạo hợp đồng". |
| Truy cập  | Người dùng chọn "Hợp đồng liên kết" trên Sidebar Giám Sát Viên.                                              |
| Đối tượng | Giám Sát Viên.                                                                                               |



| Mục | Kiểu              | Dữ liệu | Mô tả                                                                                |
| --- | ----------------- | ------- | ------------------------------------------------------------------------------------ |
| 1   | Text box (search) |         | Tìm theo số hợp đồng/Nông Dân/Lô.                                                    |
| 2   | Dropdown          |         | Trạng thái: Tất cả / Bản nháp / Chờ phê duyệt / Bị từ chối / Đang hiệu lực / Hết hiệu lực. |
| 3   | Button            |         | "+ Tạo hợp đồng" — mở workspace tạo mới.                                             |
| 4   | Quick stats       |         | Đang hiệu lực, Chờ duyệt, Bị từ chối, Hết hiệu lực, Bản nháp.                        |
| 5   | Lưới Card         |         | Số HĐ, Nông Dân, mã Lô, badge Trạng thái/Loại Cây/Phẩm Cấp.                          |



| Tên          | Mô tả                      | Thành công                                              | Thất bại |
| ------------ | -------------------------- | ------------------------------------------------------- | -------- |
| Tạo Hợp Đồng | Bấm "+ Tạo hợp đồng".      | Điều hướng tới trang Workspace tạo Hợp Đồng mới.        | —        |
| Mở chi tiết  | Bấm card.                  | Điều hướng tới trang Chi tiết & Phê duyệt Hợp Đồng.     | —        |
| Tìm & Lọc    | Nhập search hoặc dropdown. | Lưới cập nhật.                                          | —        |


---

### 2.29. UI_29 — Tạo / Chỉnh sửa Hợp Đồng (Workspace)

#### 2.29.1. Bảng mẫu

*Hình 2.29. Giao diện Workspace tạo Hợp Đồng.*

#### 2.29.2. Đặc tả chi tiết


| Màn hình  | Workspace Hợp Đồng                                                                                                                                                                                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Trang Workspace: chọn Nông Dân, nhập thông tin Lô Đất (Tỉnh/Huyện/Diện tích/Tọa độ), Loại Cây, Giống, Phẩm Cấp, Ngày Thu Hoạch dự kiến; hiển thị preview Hợp Đồng theo mẫu pháp lý; lưu nháp; in PDF. Sau khi đã tạo, trang sẽ hiển thị thông tin Hợp Đồng tương tự trang Chi tiết & Phê duyệt Hợp Đồng (UI_20). |
| Truy cập  | Bấm "+ Tạo hợp đồng" tại trang Hợp đồng liên kết (UI_28) hoặc bấm vào card Hợp Đồng để chỉnh sửa.                                                                                                                                                                                                                  |
| Đối tượng | Giám Sát Viên.                                                                                                                                                                                                                                                                                                      |



| Mục | Kiểu              | Dữ liệu                  | Mô tả                                                       |
| --- | ----------------- | ------------------------ | ----------------------------------------------------------- |
| 1   | Breadcrumb        |                          | "Hợp đồng / Tạo mới".                                       |
| 2   | Combobox          | Yêu cầu: có (tạo mới)    | Nông Dân (danh sách Nông Dân phạm vi Giám Sát Viên).        |
| 3   | Combobox          | Yêu cầu: có              | Tỉnh/Thành.                                                 |
| 4   | Combobox          | Yêu cầu: có              | Quận/Huyện (phụ thuộc Tỉnh).                                |
| 5   | Text box (number) | Yêu cầu: > 0             | Diện tích chuẩn (ha).                                       |
| 6   | Bảng tọa độ       | Yêu cầu: ≥ 3 điểm        | Cặp Lat, Lng — có nút "+" thêm điểm, "X" xoá điểm.          |
| 7   | Dropdown          | Yêu cầu: có              | Loại Cây: Cà phê / Sầu riêng.                               |
| 8   | Dropdown          | Tuỳ chọn                 | Giống (theo Loại Cây).                                      |
| 9   | Dropdown          | Mặc định: Tiêu Chuẩn     | Phẩm Cấp: Tiêu Chuẩn / Cao Cấp.                             |
| 10  | Date picker       |                          | Ngày Thu Hoạch dự kiến (≥ ngày mai).                        |
| 11  | Khối preview      |                          | Mẫu hợp đồng pháp lý — cập nhật trực tiếp khi nhập.         |
| 12  | Button            |                          | "Lưu nháp".                                                 |
| 13  | Button            |                          | "In PDF".                                                   |
| 14  | Button            |                          | "Gửi duyệt" (sau khi đã lưu Bản nháp).                      |



| Tên       | Mô tả                                    | Thành công                                                                                            | Thất bại                                                                                                                  |
| --------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Lưu nháp  | Bấm "Lưu nháp" sau khi điền.             | Hiển thị Toast thành công, chuyển sang chế độ chỉnh sửa Bản nháp.                                     | Hiển thị Toast lỗi kiểm tra ("Chọn Nông Dân", "Nhập Tỉnh/Thành", "Diện tích chuẩn không hợp lệ", "Tọa độ chưa đủ 3 điểm hợp lệ"). |
| In PDF    | Bấm "In PDF".                            | Mở cửa sổ in của trình duyệt.                                                                         | —                                                                                                                         |
| Gửi duyệt | Trên Bản nháp đã lưu, bấm "Gửi duyệt".   | Hợp Đồng chuyển sang Chờ phê duyệt, vào hàng chờ Admin duyệt.                                         | Hiển thị Toast lỗi nếu thiếu thông tin.                                                                                   |


---

### 2.30. UI_30 — Báo cáo hàng ngày (Giám Sát Viên)

#### 2.30.1. Bảng mẫu

*Hình 2.30a. Danh sách Báo Cáo (Giám Sát Viên).*
*Hình 2.30b. Sheet Soạn / Sửa / Xem Báo Cáo.*
*Hình 2.30c. Dialog Tạo Lô Hàng từ Báo Cáo Thu Hoạch.*

#### 2.30.2. Đặc tả chi tiết


| Màn hình  | Báo cáo hàng ngày (Giám Sát Viên)                                                                                                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Giám Sát Viên soạn nháp / sửa / gửi Báo Cáo (Định kỳ / Sự cố / Thu hoạch) gắn với Lô Đất; đính kèm tối đa 10 ảnh (≤2MB/ảnh); sau khi gửi, báo cáo không sửa được. Báo cáo Thu Hoạch có thể tạo Lô Hàng trực tiếp.                  |
| Truy cập  | Người dùng chọn "Báo cáo hàng ngày" trên Sidebar Giám Sát Viên.                                                                                                                                                                    |
| Đối tượng | Giám Sát Viên.                                                                                                                                                                                                                     |



| Mục | Kiểu         | Dữ liệu | Mô tả                                                                                                                                                                                                                                                                       |
| --- | ------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Button       |         | "+ Tạo báo cáo".                                                                                                                                                                                                                                                            |
| 2   | Button group |         | Nhóm: Tất cả / Báo cáo sản lượng / Báo cáo khác.                                                                                                                                                                                                                            |
| 3   | Quick stat   |         | (Tab Thu hoạch) Tổng sản lượng (kg).                                                                                                                                                                                                                                        |
| 4   | Button group |         | Trạng thái: Tất cả / Nháp / Đã gửi.                                                                                                                                                                                                                                         |
| 5   | DataTable    |         | Cột: Ngày, Loại, Lô, Trạng thái, Nội dung, Sản lượng (nếu Thu hoạch).                                                                                                                                                                                                       |
| 6   | Sheet        |         | Form: Lô đất (Combobox; không đổi khi sửa), Loại báo cáo (Thường kỳ / Sự cố — ẩn khi tick Thu hoạch), Checkbox "Báo cáo thu hoạch", Sản lượng (kg) khi Thu hoạch, Nội dung (textarea, 8 dòng), Ảnh đính kèm (≤10 ảnh, ≤2MB/ảnh), Button "Hủy" / "Lưu nháp" / "Gửi báo cáo". |
| 7   | Dialog       |         | Tạo Lô Hàng từ Báo Cáo Thu Hoạch.                                                                                                                                                                                                                                           |



| Tên                | Mô tả                                                       | Thành công                                                                  | Thất bại                                                                                                                                                          |
| ------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tạo báo cáo        | Mở Sheet → điền form → "Lưu nháp".                          | Hiển thị Toast "Đã tạo báo cáo nháp", danh sách được cập nhật.              | Hiển thị Toast "Vui lòng chọn lô đất" hoặc thông báo lỗi tương ứng.                                                                                              |
| Cập nhật nháp      | Mở dòng Bản nháp → sửa → "Lưu nháp".                        | Hiển thị Toast "Đã cập nhật nháp".                                          | Hiển thị Toast lỗi.                                                                                                                                              |
| Gửi báo cáo        | Bấm "Gửi báo cáo".                                          | Hiển thị Toast "Đã gửi báo cáo", dòng chuyển sang Đã gửi, badge cập nhật.   | Hiển thị Toast "Cần nội dung chữ trước khi gửi" / "Cần ít nhất một ảnh đính kèm khi gửi" / "Lô đất này đã có báo cáo sản lượng đang xử lý hoặc đã hoàn tất."     |
| Xem báo cáo đã gửi | Bấm dòng Đã gửi.                                            | Mở Sheet chế độ Xem (chỉ đọc).                                              | —                                                                                                                                                                |
| Thêm ảnh           | Bấm "Thêm ảnh" → chọn ảnh.                                  | Tải ảnh lên, hiển thị thumbnail.                                            | Hiển thị Toast "Chỉ chấp nhận file ảnh" / "Ảnh vượt quá 2MB" / "Tối đa 10 ảnh".                                                                                  |
| Xoá ảnh            | Bấm icon thùng rác trên ảnh.                                | Xoá khỏi danh sách.                                                         | —                                                                                                                                                                |
| Tạo Lô Hàng        | Trên báo cáo Thu Hoạch đã gửi, bấm "Tạo Lô Hàng".           | Mở Dialog → điền Kho/Số lượng/Chất lượng → tạo Lô Hàng.                     | Hiển thị Toast lỗi.                                                                                                                                              |


---

### 2.31. UI_31 — Phân tích cây trồng AI

#### 2.31.1. Bảng mẫu

*Hình 2.31. Trang Phân tích cây trồng AI.*

#### 2.31.2. Đặc tả chi tiết


| Màn hình  | Phân tích cây trồng AI                                                                                                                                                                       |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Bảng tổng hợp kết quả phân tích bệnh cây trồng từ Farmer App; có Stat Cards (số ảnh, số bệnh, số sự cố, mức nguy hiểm), biểu đồ, bộ lọc Mức Nguy Hiểm / Loại Bệnh, mở Sheet chi tiết kết quả. |
| Truy cập  | Người dùng chọn "Phân tích cây trồng AI" trên Sidebar Giám Sát Viên.                                                                                                                          |
| Đối tượng | Giám Sát Viên.                                                                                                                                                                                |



| Mục | Kiểu           | Dữ liệu | Mô tả                                                                |
| --- | -------------- | ------- | -------------------------------------------------------------------- |
| 1   | Stat Cards     |         | Tổng ảnh quét, số bệnh phát hiện, sự cố nghiêm trọng, cây khoẻ...    |
| 2   | Button         |         | Mở Farmer App (liên kết ngoài).                                      |
| 3   | Button         |         | "Làm mới".                                                           |
| 4   | Dropdown       |         | Mức Nguy Hiểm: Tất cả / Thấp / Trung bình / Cao / Rất cao.           |
| 5   | Dropdown       |         | Loại Bệnh: Tất cả / Nấm / Vi khuẩn / Virus / Tảo / Cây khoẻ.         |
| 6   | Button         |         | "Xoá lọc".                                                           |
| 7   | Biểu đồ        |         | Tổng hợp phân phối nguy hiểm và xu hướng.                            |
| 8   | DataTable      |         | Cột: Ngày, Lô, Loại bệnh, Mức nguy hiểm, Ảnh thumbnail.              |
| 9   | Sheet chi tiết |         | Hiển thị ảnh quét, kết quả phân tích, đề xuất xử lý.                 |



| Tên               | Mô tả             | Thành công                | Thất bại |
| ----------------- | ----------------- | ------------------------- | -------- |
| Lọc               | Chỉnh Dropdown.   | Bảng cập nhật.            | —        |
| Mở Sheet chi tiết | Bấm dòng.         | Hiển thị chi tiết quét.   | —        |
| Làm mới           | Bấm icon refresh. | Tải lại dữ liệu.          | —        |


---

### 2.32. UI_32 — Tổng quan Kho hàng

#### 2.32.1. Bảng mẫu

*Hình 2.32. Giao diện Tổng quan Kho Hàng.*

#### 2.32.2. Đặc tả chi tiết


| Màn hình  | Tổng quan Kho hàng                                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Dashboard cho Nhân Viên Kho: KPI Cards, biểu đồ vận hành, danh sách Kho Hàng (kèm progress bar sức chứa), bảng Giao Dịch gần đây. |
| Truy cập  | Đăng nhập với vai trò Nhân Viên Kho, sau đó chọn "Tổng quan" trên Sidebar.                                                       |
| Đối tượng | Nhân Viên Kho.                                                                                                                    |



| Mục | Kiểu           | Dữ liệu | Mô tả                                                            |
| --- | -------------- | ------- | ---------------------------------------------------------------- |
| 1   | Tiêu đề        |         | "Tổng quan Kho hàng".                                            |
| 2   | Button (icon)  |         | "Làm mới".                                                       |
| 3   | KPI Cards      |         | Tổng Lô Hàng, Tồn Kho, Đơn Hàng đang xử lý, Giao Dịch hôm nay... |
| 4   | Biểu đồ        |         | Biểu đồ Giao Dịch, Sản lượng nhập kho.                           |
| 5   | Danh sách Kho  |         | Mỗi Kho hiển thị tên, địa chỉ, số Lô, sức chứa (progress bar %). |
| 6   | Button         |         | "Quản lý toàn bộ kho" — mở trang Quản lý Kho.                    |
| 7   | Bảng hoạt động |         | Giao Dịch gần đây.                                               |



| Tên            | Mô tả     | Thành công                          | Thất bại |
| -------------- | --------- | ----------------------------------- | -------- |
| Làm mới        | Bấm icon. | Tải lại dashboard.                  | —        |
| Mở quản lý kho | Bấm nút.  | Điều hướng tới trang Quản lý Kho.   | —        |


---

### 2.33. UI_33 — Quản lý Kho (Inventory)

#### 2.33.1. Bảng mẫu

*Hình 2.33. Danh sách Kho Hàng được phân công.*

#### 2.33.2. Đặc tả chi tiết


| Màn hình  | Quản lý Kho (Inventory)                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Lưới Kho Hàng được phân công cho Nhân Viên Kho, có tìm kiếm, lọc theo quy mô (Nhỏ / Vừa / Lớn dựa trên số Lô) và Khu Vực (Tỉnh/Thành). |
| Truy cập  | Người dùng chọn "Quản lý Kho" trên Sidebar Nhân Viên Kho.                                                                              |
| Đối tượng | Nhân Viên Kho.                                                                                                                         |



| Mục | Kiểu              | Dữ liệu | Mô tả                              |
| --- | ----------------- | ------- | ---------------------------------- |
| 1   | Text box (search) |         | Tìm theo tên/địa chỉ Kho.          |
| 2   | Dropdown          |         | Quy mô: Tất cả / Nhỏ / Vừa / Lớn.  |
| 3   | Dropdown          |         | Khu vực (lấy từ địa chỉ).          |
| 4   | Quick stats       |         | Tổng Lô, Tổng Kho.                 |
| 5   | Lưới Card         |         | Tên kho, địa chỉ, số Lô, ngày tạo. |



| Tên             | Mô tả                        | Thành công                                  | Thất bại |
| --------------- | ---------------------------- | ------------------------------------------- | -------- |
| Lọc & Tìm       | Nhập search / chọn dropdown. | Lưới cập nhật.                              | —        |
| Mở chi tiết Kho | Bấm card.                    | Điều hướng tới trang Chi tiết Kho Hàng.     | —        |


---

### 2.34. UI_34 — Chi tiết Kho Hàng

#### 2.34.1. Bảng mẫu

*Hình 2.34. Giao diện Chi tiết Kho Hàng.*

#### 2.34.2. Đặc tả chi tiết


| Màn hình  | Chi tiết Kho Hàng                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Hiển thị thông tin Kho, các tab Lô Hàng trong kho và lịch sử Giao Dịch. Lô Hàng có cột Mã Lô, Sản Phẩm, Hạng Chất Lượng, Ngày Thu Hoạch, Số Lượng. |
| Truy cập  | Bấm vào card Kho tại trang Quản lý Kho (UI_33).                                                                                                    |
| Đối tượng | Nhân Viên Kho.                                                                                                                                     |



| Mục | Kiểu               | Dữ liệu | Mô tả                                                                                       |
| --- | ------------------ | ------- | ------------------------------------------------------------------------------------------- |
| 1   | Button (link)      |         | "← Quay lại danh sách".                                                                     |
| 2   | Khối thông tin Kho |         | Tên, Địa chỉ, ngày tạo, Tổng tồn kho.                                                       |
| 3   | Tabs               |         | Lô Hàng / Hoạt động.                                                                        |
| 4   | Text box (search)  |         | Tìm Lô theo Mã/Tên SP/SKU.                                                                  |
| 5   | DataTable          |         | Cột: Mã lô, Sản phẩm (+ SKU), Hạng (A/B/C), Ngày Thu Hoạch, Số Lượng, Hành động "Chi tiết". |
| 6   | Tab Hoạt động      |         | Lịch sử Giao Dịch trong Kho.                                                                |



| Tên            | Mô tả           | Thành công                                          | Thất bại |
| -------------- | --------------- | --------------------------------------------------- | -------- |
| Tìm Lô         | Nhập search.    | Bảng cập nhật.                                      | —        |
| Mở chi tiết Lô | Bấm "Chi tiết". | Mở Drawer chi tiết Lô (trang Quản lý Lô hàng — UI_35). | —        |


---

### 2.35. UI_35 — Quản lý Lô hàng

#### 2.35.1. Bảng mẫu

*Hình 2.35a. Danh sách Lô Hàng theo tab.*
*Hình 2.35b. Drawer chi tiết Lô.*
*Hình 2.35c. Dialog Xác nhận nhận / Từ chối / Chấm chất lượng / Điều chỉnh trọng lượng / Cập nhật HSD.*

#### 2.35.2. Đặc tả chi tiết


| Màn hình  | Quản lý Lô hàng                                                                                                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Bảng Lô Hàng với 3 tab Trong Kho / Chờ Xác Nhận / Sắp Về; hỗ trợ Xác Nhận Nhận, Từ Chối, Chấm Chất Lượng. Có Drawer chi tiết Lô và các dialog điều chỉnh trọng lượng, cập nhật hạn sử dụng. |
| Truy cập  | Người dùng chọn "Quản lý Lô hàng" trên Sidebar Nhân Viên Kho.                                                                                                                               |
| Đối tượng | Nhân Viên Kho.                                                                                                                                                                              |



| Mục | Kiểu                          | Dữ liệu | Mô tả                                                                 |
| --- | ----------------------------- | ------- | --------------------------------------------------------------------- |
| 1   | Tabs                          |         | Trong kho / Chờ xác nhận / Sắp về (kèm số đếm).                       |
| 2   | Quick stats                   |         | Thực tồn (kg), Đang chờ (kg).                                         |
| 3   | Filter bar                    |         | Lọc theo Kho, Sản Phẩm, Trạng thái, Khoảng ngày.                      |
| 4   | DataTable                     |         | Cột: Mã lô, Sản phẩm, Kho, Số lượng, Hạng, Ngày Thu Hoạch, Hành động. |
| 5   | Drawer chi tiết Lô            |         | Thông tin đầy đủ Lô, lịch sử Giao Dịch, ảnh chứng minh, nút thao tác. |
| 6   | Dialog xác nhận nhận          |         | Nhập số lượng thực nhận.                                              |
| 7   | Dialog từ chối                |         | Nhập lý do từ chối.                                                   |
| 8   | Dialog chấm chất lượng        |         | Chọn Hạng A/B/C, ghi chú.                                             |
| 9   | Dialog điều chỉnh trọng lượng |         | Số lượng mới + lý do.                                                 |
| 10  | Dialog cập nhật HSD           |         | Ngày hết hạn.                                                         |



| Tên                    | Mô tả                                   | Thành công                                                       | Thất bại                                  |
| ---------------------- | --------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------- |
| Xác nhận nhận          | Tab Chờ xác nhận → Dialog → "Xác nhận". | Lô chuyển sang Đã nhận, hiển thị Toast thành công.               | Hiển thị Toast lỗi (số lượng không hợp lệ). |
| Từ chối Lô             | Tab Chờ xác nhận → Dialog → "Từ chối".  | Lô chuyển sang trạng thái Bị từ chối.                            | Hiển thị Toast lỗi.                       |
| Chấm chất lượng        | Drawer → Chấm chất lượng → "Lưu".       | Hạng được cập nhật.                                              | Hiển thị Toast lỗi.                       |
| Điều chỉnh trọng lượng | Drawer → "Điều chỉnh" → Dialog.         | Cập nhật trọng lượng + ghi nhận Giao Dịch điều chỉnh.            | Hiển thị Toast lỗi.                       |
| Cập nhật HSD           | Drawer → Dialog HSD → "Lưu".            | Ngày hết hạn được cập nhật.                                      | Hiển thị Toast lỗi.                       |


---

### 2.36. UI_36 — Ghi nhận Xuất/Nhập

#### 2.36.1. Bảng mẫu

*Hình 2.36a. Danh sách Giao Dịch.*
*Hình 2.36b. Dialog điều chỉnh tồn kho.*

#### 2.36.2. Đặc tả chi tiết


| Màn hình  | Ghi nhận Xuất/Nhập                                                                                 |
| --------- | -------------------------------------------------------------------------------------------------- |
| Mô tả     | Theo dõi biến động tồn kho theo Giao Dịch (nhập từ thu hoạch / xuất / điều chỉnh kiểm kê thực tế). |
| Truy cập  | Người dùng chọn "Ghi nhận Xuất/Nhập" trên Sidebar Nhân Viên Kho.                                   |
| Đối tượng | Nhân Viên Kho.                                                                                     |



| Mục | Kiểu              | Dữ liệu | Mô tả                                                                                           |
| --- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| 1   | Filter bar        |         | Kho, Loại Giao Dịch (Nhập / Xuất / Điều chỉnh), Sản Phẩm, Khoảng ngày, Lô Hàng, Ghi chú.        |
| 2   | Button            |         | "+ Điều chỉnh tồn kho".                                                                         |
| 3   | DataTable         |         | Cột: Thời gian, Loại, Kho, Lô Hàng, Sản Phẩm, Số lượng, Ghi chú.                                |
| 4   | Dialog điều chỉnh |         | Form: Kho, Lô Hàng (Combobox), Số lượng mới, Lý do, ghi chú.                                    |



| Tên                    | Mô tả                                         | Thành công                                                       | Thất bại            |
| ---------------------- | --------------------------------------------- | ---------------------------------------------------------------- | ------------------- |
| Lọc                    | Chỉnh Filter Bar.                             | Bảng cập nhật.                                                   | —                   |
| Tạo điều chỉnh tồn kho | Bấm "+ Điều chỉnh tồn kho", điền form, "Lưu". | Hiển thị Toast thành công, Giao Dịch xuất hiện trên bảng.        | Hiển thị Toast lỗi. |


---

### 2.37. UI_37 — Sản phẩm (ECM)

#### 2.37.1. Bảng mẫu

*Hình 2.37a. Danh sách Sản Phẩm niêm yết.*
*Hình 2.37b. Dialog Chi tiết / Cập nhật Sản Phẩm.*

#### 2.37.2. Đặc tả chi tiết


| Màn hình  | Sản phẩm (ECM)                                                                                                                                                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Khi một Hợp Đồng được Admin phê duyệt, hệ thống tự động tạo một Sản Phẩm ở trạng thái Nháp. Nhân Viên Kho vào đây để bổ sung thông tin (mô tả, ảnh, danh mục, giá) rồi chuyển sang Đang bán khi kho đã có hàng; cũng có thể xoá (lưu trữ). |
| Truy cập  | Người dùng chọn "Sản phẩm (ECM)" trên Sidebar Nhân Viên Kho.                                                                                                                                                                        |
| Đối tượng | Nhân Viên Kho.                                                                                                                                                                                                                      |



| Mục | Kiểu            | Dữ liệu | Mô tả                                                                                                                                      |
| --- | --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Filter bar      |         | Tìm theo tên / SKU, lọc Trạng thái, Danh Mục, Phẩm Cấp, Loại Cây.                                                                         |
| 2   | DataTable       |         | Cột: Ảnh, Tên SP, SKU, Danh Mục, Loại Cây, Hạng, Tồn kho, Giá/kg, Trạng thái.                                                             |
| 3   | Dialog Chi tiết |         | Hiển thị đầy đủ thông tin Sản Phẩm; chuyển sang chế độ Chỉnh sửa để cập nhật mô tả, giá, ảnh, danh mục, trạng thái.                       |
| 4   | Stock guard     |         | Nếu tồn kho đang bằng 0, tuỳ chọn "Đang bán" bị khoá — hệ thống hiển thị gợi ý "Chưa có hàng — nhập kho để đăng bán".                    |



| Tên         | Mô tả                                                                                          | Thành công                                                                       | Thất bại                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Cập nhật SP | Bấm vào dòng sản phẩm → Dialog Chi tiết → chỉnh sửa thông tin → "Lưu".                         | Hiển thị Toast thành công, thông tin cập nhật ngay trên bảng.                    | Hiển thị Toast lỗi.                                                                 |
| Đăng bán    | Trong Dialog Chi tiết, chọn trạng thái "Đang bán" → "Lưu".                                     | Sản phẩm hiển thị công khai trên cửa hàng.                                       | Nếu tồn kho = 0, hệ thống chặn và yêu cầu nhập kho trước.                           |
| Xoá SP      | Bấm Xoá trên dòng → xác nhận.                                                                  | Hiển thị Toast thành công, SP chuyển sang lưu trữ, không còn hiển thị công khai. | Hiển thị Toast lỗi.                                                                 |


---

### 2.38. UI_38 — Danh mục

#### 2.38.1. Bảng mẫu

*Hình 2.38a. Danh sách Danh Mục.*
*Hình 2.38b. Dialog Thêm / Sửa Danh Mục.*

#### 2.38.2. Đặc tả chi tiết


| Màn hình  | Danh mục                                                                                                               |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Quản lý Danh Mục Sản Phẩm: tên, slug, mô tả, ảnh đại diện, thứ tự sắp xếp, trạng thái. Cho phép sắp xếp lại bằng kéo thả. |
| Truy cập  | Người dùng chọn "Danh mục" trên Sidebar Nhân Viên Kho.                                                                 |
| Đối tượng | Nhân Viên Kho.                                                                                                         |



| Mục | Kiểu              | Dữ liệu | Mô tả                                                                             |
| --- | ----------------- | ------- | --------------------------------------------------------------------------------- |
| 1   | Filter bar        |         | Tìm kiếm theo tên/slug.                                                           |
| 2   | Button            |         | "+ Thêm danh mục".                                                                |
| 3   | DataTable         |         | Cột: Ảnh, Tên, Slug, Mô tả, Thứ tự, Trạng thái, Hành động (Sửa/Xoá).              |
| 4   | Dialog Thêm / Sửa |         | Form: Tên *, Slug (tự sinh từ tên), Mô tả, Ảnh (tải lên), Thứ tự, Checkbox Kích hoạt. |
| 5   | AlertDialog Xoá   |         | Xác nhận xoá.                                                                     |



| Tên           | Mô tả                        | Thành công                       | Thất bại                                |
| ------------- | ---------------------------- | -------------------------------- | --------------------------------------- |
| Thêm Danh Mục | Dialog → điền form → "Lưu".  | Hiển thị Toast thành công.       | Hiển thị Toast lỗi (slug trùng...).     |
| Sửa Danh Mục  | Bấm Pencil → Dialog → "Lưu". | Hiển thị Toast thành công.       | Hiển thị Toast lỗi.                     |
| Xoá Danh Mục  | Bấm Trash → "Xác nhận".      | Hiển thị Toast thành công.       | Hiển thị Toast lỗi nếu Danh Mục có SP.  |
| Sắp xếp       | Kéo thả dòng.                | Cập nhật thứ tự hiển thị.        | —                                       |


---

### 2.39. UI_39 — Đơn hàng & Thanh toán (Inventory)

#### 2.39.1. Bảng mẫu

*Hình 2.39. Danh sách Đơn Hàng (Kho).*

#### 2.39.2. Đặc tả chi tiết


| Màn hình  | Đơn hàng & Thanh toán (Inventory)                                                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Danh sách Đơn Hàng từ kênh thương mại điện tử để Nhân Viên Kho điều phối. Có thể tìm theo mã đơn / vận đơn, lọc Trạng Thái Giao Hàng + Thanh Toán. |
| Truy cập  | Người dùng chọn "Đơn hàng & Thanh toán" trên Sidebar Nhân Viên Kho.                                                                              |
| Đối tượng | Nhân Viên Kho.                                                                                                                                  |



| Mục | Kiểu              | Dữ liệu | Mô tả                                                                                |
| --- | ----------------- | ------- | ------------------------------------------------------------------------------------ |
| 1   | Stats             |         | Tổng đơn, Chờ xử lý, Đang giao, Đã giao.                                             |
| 2   | Text box (search) |         | Mã đơn, vận đơn.                                                                     |
| 3   | Dropdown          |         | Trạng thái xử lý: Tất cả / Chờ xử lý / Đang đóng gói / Đang giao / Đã giao / Đã huỷ. |
| 4   | Dropdown          |         | Thanh toán: Tất cả / Chờ / Đã thanh toán / Thất bại / Hoàn tiền.                     |
| 5   | DataTable         |         | Cột: Mã đơn, Khách, Tổng, Ngày, Thanh toán, Giao hàng, Hành động "Chi tiết".         |



| Tên         | Mô tả                            | Thành công                                              | Thất bại |
| ----------- | -------------------------------- | ------------------------------------------------------- | -------- |
| Tìm / Lọc   | Nhập search hoặc chọn dropdown.  | Bảng cập nhật.                                          | —        |
| Mở chi tiết | Bấm "Chi tiết" hoặc dòng.        | Điều hướng tới trang Chi tiết Đơn Hàng (UI_40).         | —        |


---

### 2.40. UI_40 — Chi tiết Đơn Hàng (Kho)

#### 2.40.1. Bảng mẫu

*Hình 2.40. Giao diện Chi tiết Đơn Hàng (Kho).*

#### 2.40.2. Đặc tả chi tiết


| Màn hình  | Chi tiết Đơn Hàng (Kho)                                                                                                                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Trang điều phối Đơn Hàng: hiển thị thông tin Khách, Địa chỉ, Sản phẩm, tóm tắt thanh toán. Tuỳ trạng thái cho phép Xác Nhận Đóng Gói, Gán Shipper, Hoàn Tất (Đánh dấu đã giao), Hủy Đơn. Có thể xuất phiếu PDF.            |
| Truy cập  | Bấm "Chi tiết" tại trang Đơn hàng & Thanh toán (UI_39).                                                                                                                                                                      |
| Đối tượng | Nhân Viên Kho.                                                                                                                                                                                                               |



| Mục | Kiểu                   | Dữ liệu | Mô tả                                                                  |
| --- | ---------------------- | ------- | ---------------------------------------------------------------------- |
| 1   | Header                 |         | Mã đơn, badge Thanh toán + Giao hàng, Ngày đặt.                        |
| 2   | Khối Khách             |         | Tên, SĐT (bấm để quay số), Avatar.                                     |
| 3   | Khối Địa Chỉ Giao Hàng |         | Họ tên, SĐT, Địa chỉ chi tiết, Tỉnh/Huyện.                             |
| 4   | Bảng Sản Phẩm          |         | Mỗi item: ảnh, tên (snapshot), số kg × giá, thành tiền.                |
| 5   | Khối tóm tắt           |         | Tạm tính, Phí vận chuyển, Giảm giá, Tổng cộng, Phương Thức Thanh Toán. |
| 6   | Button                 |         | "Xác nhận đóng gói" (khi đơn đang Chờ xử lý).                          |
| 7   | Dropdown / Select      |         | Gán Shipper — danh sách Shipper sẵn sàng (tên, mã, phương tiện).       |
| 8   | Button                 |         | "Gán Shipper" (khi đơn đang Đóng gói).                                 |
| 9   | Button                 |         | "Đánh dấu đã giao" (khi đơn đang Giao).                                |
| 10  | Button (destructive)   |         | "Huỷ đơn" — Dialog nhập lý do.                                         |
| 11  | Button                 |         | "Xuất PDF".                                                            |



| Tên               | Mô tả                                        | Thành công                                                       | Thất bại                                                                |
| ----------------- | -------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Xác nhận đóng gói | Bấm "Xác nhận đóng gói".                     | Đơn chuyển sang Đóng gói, hiển thị Toast thành công.             | Hiển thị Toast lỗi.                                                     |
| Gán Shipper       | Chọn Shipper trong dropdown → "Gán Shipper". | Đơn chuyển sang Đang giao, hiển thị Toast thành công, Shipper nhận đơn. | Hiển thị Toast lỗi nếu chưa chọn Shipper hoặc Shipper không sẵn sàng. |
| Hoàn tất          | Bấm "Đánh dấu đã giao".                      | Đơn chuyển sang Đã giao, hiển thị Toast thành công.              | Hiển thị Toast lỗi.                                                     |
| Huỷ đơn           | Mở Dialog → nhập lý do → "Xác nhận".         | Đơn chuyển sang Đã huỷ, tồn kho được hoàn lại.                   | Hiển thị Toast lỗi.                                                     |
| Xuất PDF          | Bấm "Xuất PDF".                              | Tải file PDF phiếu giao.                                         | —                                                                       |


---

### 2.41. UI_41 — Reviews / Quản lý Đánh Giá

#### 2.41.1. Bảng mẫu

*Hình 2.41. Giao diện Quản lý Đánh Giá.*

#### 2.41.2. Đặc tả chi tiết


| Màn hình  | Reviews / Quản lý Đánh Giá                                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Đánh giá của Khách Hàng tự động hiển thị công khai ngay sau khi gửi. Nhân Viên Kho vào đây để kiểm duyệt — từ chối hoặc xoá những đánh giá không phù hợp; lọc và tìm kiếm theo nội dung / trạng thái. |
| Truy cập  | Người dùng chọn "Reviews" trên Sidebar Nhân Viên Kho.                                                                                                                   |
| Đối tượng | Nhân Viên Kho.                                                                                                                                                          |



| Mục | Kiểu              | Dữ liệu | Mô tả                                                                                 |
| --- | ----------------- | ------- | ------------------------------------------------------------------------------------- |
| 1   | Text box (search) |         | Tìm theo nội dung / sản phẩm / tên khách hàng.                                        |
| 2   | Dropdown          |         | Trạng thái: Tất cả / Chờ duyệt / Đã duyệt / Từ chối.                                  |
| 3   | Button            |         | "Xóa lọc".                                                                            |
| 4   | DataTable         |         | Cột: Sản phẩm, Khách hàng, Đánh giá (sao), Nội dung, Trạng thái, Ngày tạo, Hành động. |
| 5   | DropdownMenu      |         | Hành động: Từ chối / Xoá vĩnh viễn (tuỳ trạng thái hiện tại).                         |



| Tên           | Mô tả                                | Thành công                                                                               | Thất bại            |
| ------------- | ------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------- |
| Từ chối       | Chọn "Từ chối đánh giá".             | Trạng thái chuyển sang Từ chối, đánh giá bị ẩn khỏi trang sản phẩm, hiển thị Toast thành công. | Hiển thị Toast lỗi. |
| Xoá vĩnh viễn | Chọn "Xoá vĩnh viễn" → xác nhận.     | Đánh giá bị xoá hoàn toàn, không thể khôi phục.                                          | Hiển thị Toast lỗi. |


---

### 2.42. UI_42 — Khách hàng (ECM)

#### 2.42.1. Bảng mẫu

*Hình 2.42. Giao diện Quản lý Khách Hàng (Inventory).*

#### 2.42.2. Đặc tả chi tiết


| Màn hình  | Khách hàng (ECM)                                                                                                  |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Bảng Khách Hàng đã giao dịch trên kênh thương mại điện tử; Drawer chi tiết hiển thị thông tin và lịch sử Đơn Hàng. |
| Truy cập  | Người dùng chọn "Khách hàng (ECM)" trên Sidebar Nhân Viên Kho.                                                    |
| Đối tượng | Nhân Viên Kho.                                                                                                    |



| Mục | Kiểu              | Dữ liệu | Mô tả                                                     |
| --- | ----------------- | ------- | --------------------------------------------------------- |
| 1   | Text box (search) |         | Tìm kiếm Khách Hàng.                                      |
| 2   | DataTable         |         | Cột: Họ tên, Email, SĐT, Tỉnh, Số đơn hàng, Tổng giá trị. |
| 3   | Drawer chi tiết   |         | Hiển thị thông tin liên hệ, lịch sử Đơn Hàng.             |



| Tên       | Mô tả         | Thành công                | Thất bại |
| --------- | ------------- | ------------------------- | -------- |
| Tìm kiếm  | Nhập từ khoá. | Bảng cập nhật.            | —        |
| Mở Drawer | Bấm dòng.     | Hiển thị Drawer chi tiết. | —        |


---

### 2.43. UI_43 — Shipper Dashboard

#### 2.43.1. Bảng mẫu

*Hình 2.43a. Dashboard Shipper.*
*Hình 2.43b. Dialog Xác nhận giao hàng.*

#### 2.43.2. Đặc tả chi tiết


| Màn hình  | Shipper Dashboard                                                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mô tả     | Trang chính cho Shipper: danh sách Đơn Hàng được gán (Đang giao / Đã giao); xem địa chỉ, gọi điện cho Khách; xác nhận "Đã giao" kèm ảnh chứng minh và ghi chú; tự động báo vị trí GPS mỗi phút khi đang giao. |
| Truy cập  | Đăng nhập với vai trò Shipper.                                                                                                                                                                                |
| Đối tượng | Shipper.                                                                                                                                                                                                      |



| Mục | Kiểu            | Dữ liệu | Mô tả                                                                                        |
| --- | --------------- | ------- | -------------------------------------------------------------------------------------------- |
| 1   | Header          |         | Logo Truck, tên Shipper, nút Refresh, Đăng xuất.                                             |
| 2   | Button group    |         | Tabs lọc: "Đang giao" / "Đã giao".                                                           |
| 3   | Card đơn        |         | Mã đơn, badge Trạng Thái; Họ Tên + SĐT (bấm để quay số) + Địa chỉ; danh sách Sản Phẩm; Tổng tiền. |
| 4   | Button          |         | "Đã giao hàng" mở Dialog xác nhận.                                                           |
| 5   | Dialog Xác nhận |         | Tải lên ảnh chứng minh (≤5MB), ô ghi chú, nút "Xác nhận".                                    |
| 6   | Empty state     |         | "Chưa có đơn nào được gán cho bạn." / "Chưa có đơn đã giao."                                 |



| Tên                 | Mô tả                                                              | Thành công                                                  | Thất bại                                            |
| ------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------- |
| Đổi tab             | Bấm "Đang giao" / "Đã giao".                                       | Danh sách cập nhật.                                         | —                                                   |
| Refresh             | Bấm icon refresh.                                                  | Tải lại + hiển thị Toast "Đã làm mới".                      | —                                                   |
| Gọi điện Khách      | Bấm SĐT.                                                           | Mở trình quay số trên thiết bị.                             | —                                                   |
| Xác nhận giao       | Bấm "Đã giao hàng" → tải ảnh (tuỳ chọn) + ghi chú → "Xác nhận".    | Đơn chuyển sang Đã giao, hiển thị Toast thành công.         | Hiển thị Toast lỗi (ảnh không hợp lệ, thao tác không thành công). |
| Cập nhật vị trí GPS | Tự động khi đang ở tab Đang giao.                                  | Gửi vị trí lên hệ thống mỗi 60 giây.                        | Im lặng khi bị từ chối quyền hoặc hết thời gian.    |
| Đăng xuất           | Bấm icon Đăng xuất.                                                | Đăng xuất, quay về trang đăng nhập.                         | —                                                   |


---

### 2.44. UI_44 — Trang 404

#### 2.44.1. Bảng mẫu

*Hình 2.44. Giao diện trang 404.*

#### 2.44.2. Đặc tả chi tiết


| Màn hình  | Trang 404                                                 |
| --------- | --------------------------------------------------------- |
| Mô tả     | Hiển thị khi đường dẫn không khớp với màn hình nào trong hệ thống. |
| Truy cập  | Người dùng truy cập một đường dẫn không tồn tại.          |
| Đối tượng | Tất cả người dùng.                                        |



| Mục | Kiểu          | Dữ liệu | Mô tả                        |
| --- | ------------- | ------- | ---------------------------- |
| 1   | Label         |         | "404 — Trang không tồn tại." |
| 2   | Button (link) |         | "Quay về trang chủ".         |



| Tên               | Mô tả    | Thành công                       | Thất bại |
| ----------------- | -------- | -------------------------------- | -------- |
| Quay về trang chủ | Bấm nút. | Điều hướng về trang chủ.         | —        |


---

*— Hết tài liệu Thiết Kế Giao Diện Người Dùng —*
