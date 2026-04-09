# Agri Integration — Danh sách chức năng theo Role

---

## 1. Admin

Admin là người quản trị toàn bộ hệ thống, có quyền cao nhất. Xem dashboard tổng quan, quản lý user, giám sát toàn bộ hoạt động.

### 1.1. Quản lý User (CRUD)

- Tạo, xem, sửa, xóa (vô hiệu hóa) tài khoản user hệ thống (Admin, Supervisor, Inventory).
- Phân quyền role cho từng user.
- Kích hoạt / vô hiệu hóa tài khoản (`is_active`).

### 1.2. Quản lý Farmer

- Tạo, xem, sửa, xóa (vô hiệu hóa) thông tin nông dân.
- Gán / thay đổi Supervisor phụ trách cho từng farmer.
- Xem danh sách farmer theo supervisor.

### 1.3. Quản lý Inventory User

- Tạo tài khoản cho nhân viên kho (role `inventory`).
- Gán nhân viên kho vào warehouse cụ thể.

### 1.4. Quản lý Client

- Xem danh sách khách hàng đã đăng ký trên hệ thống e-commerce.
- Kích hoạt / vô hiệu hóa tài khoản client.

### 1.5. Quản lý Supervisor

- Xem danh sách supervisor và các farmer, lô đất, hợp đồng mà supervisor đang phụ trách.
- Theo dõi hiệu suất supervisor qua daily report.

### 1.6. Quản lý Hợp đồng (Contract)

- Xem toàn bộ danh sách hợp đồng trong hệ thống.
- Tạo hợp đồng mới (gán farmer, lô đất, supervisor).
- Cập nhật trạng thái hợp đồng (`draft` → `active` → `settled` / `terminated`).
- Xem trạng thái ký xác nhận (`is_signed`, ảnh chụp HĐ đã ký).

### 1.7. Quản lý Lô đất (Land Parcel)

- Xem toàn bộ lô đất trên hệ thống.
- Xem vị trí địa lý (GPS) của từng lô.
- Xem trạng thái lô đất (`available`, `contracted`, `inactive`).

### 1.8. Xem Daily Report

- Xem toàn bộ daily report từ các supervisor.
- Lọc report theo supervisor, lô đất, hợp đồng, ngày.
- Duyệt report (chuyển status từ `submitted` → `reviewed`).

### 1.9. Quản lý Kho (Warehouse)

- Xem tổng quan tồn kho tất cả warehouse.
- Xem chi tiết sản lượng, cung cầu theo từng kho.

### 1.10. Quản lý Danh mục & Sản phẩm

- CRUD danh mục sản phẩm (`categories`).
- CRUD sản phẩm (`products`): tên, SKU, giá, đơn vị, ảnh.

### 1.11. Xem Đơn hàng (Order)

- Xem toàn bộ đơn hàng từ module e-commerce.
- Theo dõi trạng thái đơn hàng.

### 1.12. Dashboard tổng quan

- Xem các chỉ số: tổng doanh thu, sản lượng, số lượng hợp đồng active, tồn kho.
- Xem biểu đồ cung cầu.
- Xem vị trí địa lý các lô đất đang quản lý trên bản đồ.

---

## 2. Supervisor

Supervisor là người trực tiếp giám sát nông dân, quản lý lô đất và hợp đồng khoán. Mỗi supervisor phụ trách tối đa 10 lô đất.

### 2.1. Quản lý Lô đất (Land Parcel)

- Xem danh sách lô đất mình được gán phụ trách.
- Cập nhật thông tin lô đất (loại cây trồng, trạng thái).
- Xem vị trí GPS của lô đất.

### 2.2. Quản lý Sản lượng

- Ghi nhận sản lượng thu hoạch thực tế từ các lô đất.
- Cập nhật ước lượng sản lượng (`yield_estimate_kg`) trong daily report.

### 2.3. Quản lý Hợp đồng cá nhân

- Xem danh sách hợp đồng mà mình đang giám sát.
- Xem chi tiết từng hợp đồng (farmer, lô đất, thời hạn, trạng thái ký).
- Không được tạo/xóa hợp đồng (chỉ Admin có quyền).

### 2.4. Quản lý Daily Report (CRUD)

- Tạo daily report hàng ngày cho từng lô đất / hợp đồng.
- Nhập mô tả công việc đã làm (`work_description`).
- Upload ảnh thực địa (`field_photo`) đính kèm report.
- Gửi report cho Admin duyệt (chuyển status `draft` → `submitted`).
- Xem lại lịch sử report của mình.

### 2.5. AI Vision (PWA Screen)

- Chụp ảnh cây trồng qua PWA screen trên điện thoại.
- Hệ thống tự động gọi AI Vision để phân tích tình trạng cây trồng.
- Kết quả AI lưu vào `ai_vision_result` trong daily report.
- Ảnh AI scan lưu vào `daily_report_images` với type `ai_scan`.

### 2.6. Upload ảnh xác nhận Hợp đồng

- Upload ảnh chụp hợp đồng đã ký bản cứng (`signature_image_url`).
- Sau khi upload thành công, hệ thống tự chuyển `is_signed` = `true`.

### 2.7. Quản lý Farmer (xem)

- Xem danh sách farmer mà mình phụ trách.
- Xem thông tin chi tiết farmer (SĐT, CCCD, địa chỉ).
- Không được thêm/xóa farmer (chỉ Admin có quyền).

---

## 3. Inventory

Inventory là nhân viên quản lý kho và logistics. Quản lý xuất/nhập kho, theo dõi tồn kho, cung cầu.

### 3.1. Quản lý Kho (Warehouse)

- Xem thông tin kho mình được gán quản lý.
- Xem tổng quan tồn kho: số lượng theo sản phẩm, theo lô hàng.

### 3.2. Quản lý Lô hàng (Inventory Lot)

- Tạo lô hàng mới khi nhập kho (gắn với product, warehouse, contract nguồn).
- Cập nhật số lượng lô hàng.
- Ghi nhận ngày thu hoạch, hạn sử dụng, phân loại chất lượng (`A`, `B`, `C`).
- Xem truy xuất nguồn gốc: lô hàng này đến từ hợp đồng nào, farmer nào.

### 3.3. Ghi nhận Xuất / Nhập kho (Warehouse Transaction)

- Tạo phiếu nhập kho (`inbound`): khi sản lượng từ farm chuyển về kho.
- Tạo phiếu xuất kho (`outbound`): khi xuất hàng cho đơn hàng e-commerce hoặc đối tác.
- Tạo phiếu điều chỉnh (`adjustment`): khi kiểm kê phát hiện chênh lệch.
- Ghi chú cho mỗi giao dịch.
- Xem lịch sử giao dịch xuất/nhập của kho.

### 3.4. Quản lý Cung cầu

- Xem báo cáo cung cầu: sản lượng dự kiến từ các hợp đồng vs. tồn kho thực tế vs. đơn hàng đang chờ.
- Theo dõi sản lượng từ daily report của supervisor để dự báo nhập kho.

### 3.5. Quản lý Logistics (cơ bản)

- Xem danh sách đơn hàng cần xuất kho (status `confirmed`).
- Cập nhật trạng thái đơn hàng khi đã xuất kho → `shipping`.

---

## 4. Client (Khách hàng)

Client là người mua hàng qua module e-commerce. Đây là khách hàng thu mua nguồn cung.

### 4.1. Đăng ký / Đăng nhập

- Đăng ký tài khoản (họ tên, email, SĐT, mật khẩu).
- Đăng nhập bằng email + mật khẩu.
- Cập nhật thông tin cá nhân, địa chỉ giao hàng mặc định.

### 4.2. Duyệt sản phẩm (Browse)

- Xem danh sách sản phẩm nông sản theo danh mục.
- Xem chi tiết sản phẩm (mô tả, giá, đơn vị, ảnh).
- Tìm kiếm sản phẩm theo tên, danh mục.

### 4.3. Đặt hàng (Purchase)

- Thêm sản phẩm vào giỏ hàng.
- Chỉnh sửa số lượng trong giỏ hàng.
- Xác nhận đơn hàng (chọn địa chỉ giao hàng, ghi chú).
- Xem tổng tiền đơn hàng.

### 4.4. Quản lý Đơn hàng

- Xem danh sách đơn hàng đã đặt.
- Xem chi tiết đơn hàng (sản phẩm, số lượng, giá, trạng thái).
- Theo dõi trạng thái đơn hàng (`pending` → `confirmed` → `shipping` → `delivered`).
- Hủy đơn hàng (chỉ khi status còn `pending`).

---

## Tổng kết ma trận phân quyền

| Chức năng | Admin | Supervisor | Inventory | Client |
|:---|:---:|:---:|:---:|:---:|
| CRUD Users | ✅ | ❌ | ❌ | ❌ |
| CRUD Farmers | ✅ | Xem | ❌ | ❌ |
| CRUD Land Parcels | ✅ | Sửa (của mình) | ❌ | ❌ |
| CRUD Contracts | ✅ | Xem (của mình) | ❌ | ❌ |
| Upload ảnh ký HĐ | ❌ | ✅ | ❌ | ❌ |
| CRUD Daily Reports | Duyệt | ✅ | ❌ | ❌ |
| AI Vision scan | ❌ | ✅ | ❌ | ❌ |
| CRUD Categories | ✅ | ❌ | ❌ | ❌ |
| CRUD Products | ✅ | ❌ | ❌ | ❌ |
| Quản lý Warehouse | Xem tổng | ❌ | ✅ | ❌ |
| CRUD Inventory Lots | ❌ | ❌ | ✅ | ❌ |
| Xuất/Nhập kho | ❌ | ❌ | ✅ | ❌ |
| Báo cáo cung cầu | ✅ | ❌ | ✅ | ❌ |
| Dashboard tổng quan | ✅ | ❌ | ❌ | ❌ |
| Browse sản phẩm | ❌ | ❌ | ❌ | ✅ |
| Đặt hàng | ❌ | ❌ | ❌ | ✅ |
| Quản lý đơn hàng | Xem | ❌ | Xuất kho | ✅ |
| CRUD Clients | ✅ | ❌ | ❌ | Sửa (của mình) |