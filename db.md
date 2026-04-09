# Agri Integration — Database Schema (MVP)

---

## Nhóm 1: User & Farm

### 1. `users`

Quản lý tất cả người dùng nội bộ hệ thống (Admin, Supervisor, Inventory).

| Attribute | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `uuid` | PK, Not Null | Khóa chính |
| `name` | `varchar(100)` | Not Null | Họ tên |
| `email` | `varchar(150)` | Unique, Not Null | Email đăng nhập |
| `password_hash` | `varchar(255)` | Not Null | Mật khẩu đã hash |
| `phone` | `varchar(20)` | | Số điện thoại |
| `role` | `enum` | Not Null | `admin`, `supervisor`, `inventory` |
| `is_active` | `boolean` | Default: true | Trạng thái tài khoản |
| `created_at` | `timestamp` | | |
| `updated_at` | `timestamp` | | |

---

### 2. `farmers`

Nông dân — Bên B trong hợp đồng khoán. Mỗi farmer được gán cho 1 supervisor.

| Attribute | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `uuid` | PK, Not Null | Khóa chính |
| `full_name` | `varchar(100)` | Not Null | Họ tên nông dân |
| `phone` | `varchar(20)` | Not Null | SĐT liên hệ |
| `id_card_number` | `varchar(20)` | Unique | Số CCCD/CMND |
| `address` | `text` | | Địa chỉ thường trú |
| `supervisor_id` | `uuid` | FK → `users.id` | Supervisor phụ trách |
| `is_active` | `boolean` | Default: true | Trạng thái |
| `created_at` | `timestamp` | | |
| `updated_at` | `timestamp` | | |

---

### 3. `land_parcels`

Lô đất / vùng trồng. Mỗi lô thuộc 1 farmer, có tọa độ GPS để tracking.

| Attribute | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `uuid` | PK, Not Null | Khóa chính |
| `parcel_code` | `varchar(50)` | Unique, Not Null | Mã lô đất (VD: LD-2026-001) |
| `name` | `varchar(100)` | | Tên gọi lô đất |
| `area_hectares` | `decimal(10,2)` | Not Null | Diện tích (ha) |
| `location_address` | `text` | | Địa chỉ vùng trồng |
| `latitude` | `decimal(10,7)` | | Vĩ độ GPS |
| `longitude` | `decimal(10,7)` | | Kinh độ GPS |
| `farmer_id` | `uuid` | FK → `farmers.id` | Nông dân sở hữu |
| `status` | `enum` | | `available`, `contracted`, `inactive` |
| `crop_type` | `varchar(50)` | | Loại cây đang trồng |
| `created_at` | `timestamp` | | |
| `updated_at` | `timestamp` | | |

---

## Nhóm 2: Contract & Daily Report

### 4. `contracts`

Hợp đồng khoán giữa công ty và nông dân. Các field tài chính chi tiết (dư nợ, tạm ứng, khấu trừ) xử lý ở tầng text-based.

| Attribute | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `uuid` | PK, Not Null | Khóa chính |
| `contract_code` | `varchar(50)` | Unique, Not Null | Mã HĐ (VD: HĐK-2026-001) |
| `farmer_id` | `uuid` | FK → `farmers.id` | Nông dân (Bên B) |
| `land_parcel_id` | `uuid` | FK → `land_parcels.id` | Lô đất thực hiện khoán |
| `supervisor_id` | `uuid` | FK → `users.id` | Supervisor giám sát |
| `status` | `enum` | Not Null | `draft`, `active`, `settled`, `terminated` |
| `crop_type` | `varchar(50)` | | Loại cây trồng khoán |
| `start_date` | `date` | Not Null | Ngày bắt đầu |
| `end_date` | `date` | Not Null | Ngày kết thúc |
| `signature_image_url` | `varchar(500)` | | URL ảnh chụp HĐ đã ký (upload lên S3/storage) |
| `is_signed` | `boolean` | Default: false | `true` khi đã upload ảnh xác nhận, `false` khi chưa |
| `created_at` | `timestamp` | | |
| `updated_at` | `timestamp` | | |

---

### 5. `daily_reports`

Báo cáo hàng ngày của Supervisor về tình hình lô đất. Tích hợp kết quả AI Vision.

| Attribute | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `uuid` | PK, Not Null | Khóa chính |
| `contract_id` | `uuid` | FK → `contracts.id` | Thuộc hợp đồng nào |
| `supervisor_id` | `uuid` | FK → `users.id` | Supervisor viết báo cáo |
| `land_parcel_id` | `uuid` | FK → `land_parcels.id` | Lô đất báo cáo |
| `report_date` | `date` | Not Null | Ngày báo cáo |
| `work_description` | `text` | | Mô tả công việc đã làm |
| `ai_vision_result` | `text` | | Kết quả AI Vision phân tích cây trồng |
| `yield_estimate_kg` | `decimal(15,2)` | | Ước lượng sản lượng (kg) |
| `status` | `enum` | | `draft`, `submitted`, `reviewed` |
| `created_at` | `timestamp` | | |

---

### 6. `daily_report_images`

Ảnh đính kèm báo cáo — tách riêng table để hỗ trợ nhiều ảnh/báo cáo và AI scan.

| Attribute | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `uuid` | PK, Not Null | Khóa chính |
| `daily_report_id` | `uuid` | FK → `daily_reports.id` | Thuộc báo cáo nào |
| `image_url` | `varchar(500)` | Not Null | URL ảnh (S3/storage) |
| `image_type` | `enum` | | `field_photo`, `ai_scan` |
| `created_at` | `timestamp` | | |

---

## Nhóm 3: Inventory & Warehouse

### 7. `categories`

Danh mục sản phẩm nông sản.

| Attribute | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `uuid` | PK, Not Null | Khóa chính |
| `name` | `varchar(100)` | Not Null | Tên danh mục |
| `slug` | `varchar(100)` | Unique | Slug URL-friendly |
| `description` | `text` | | Mô tả |
| `is_active` | `boolean` | Default: true | Trạng thái |
| `created_at` | `timestamp` | | |

---

### 8. `products`

Sản phẩm nông sản — dùng cho cả kho lẫn e-commerce.

| Attribute | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `uuid` | PK, Not Null | Khóa chính |
| `name` | `varchar(150)` | Not Null | Tên sản phẩm |
| `sku` | `varchar(50)` | Unique, Not Null | Mã SKU |
| `category_id` | `uuid` | FK → `categories.id` | Danh mục |
| `description` | `text` | | Mô tả sản phẩm |
| `price_vnd` | `decimal(15,2)` | Not Null | Giá bán (VNĐ) |
| `unit` | `varchar(20)` | | Đơn vị: `kg`, `tấn` |
| `thumbnail_url` | `varchar(500)` | | Ảnh đại diện |
| `is_active` | `boolean` | Default: true | Trạng thái |
| `created_at` | `timestamp` | | |
| `updated_at` | `timestamp` | | |

---

### 9. `warehouses`

Kho hàng — quản lý bởi user có role `inventory`.

| Attribute | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `uuid` | PK, Not Null | Khóa chính |
| `name` | `varchar(100)` | Not Null | Tên kho |
| `location_address` | `text` | | Địa chỉ kho |
| `managed_by` | `uuid` | FK → `users.id` | User quản lý (role inventory) |
| `is_active` | `boolean` | Default: true | Trạng thái |
| `created_at` | `timestamp` | | |

---

### 10. `inventory_lots`

Lô hàng nhập kho — liên kết ngược về contract để truy xuất nguồn gốc.

| Attribute | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `uuid` | PK, Not Null | Khóa chính |
| `warehouse_id` | `uuid` | FK → `warehouses.id` | Kho chứa |
| `product_id` | `uuid` | FK → `products.id` | Sản phẩm |
| `contract_id` | `uuid` | FK → `contracts.id`, Nullable | HĐ nguồn (truy xuất nguồn gốc) |
| `quantity_kg` | `decimal(15,2)` | Not Null | Số lượng hiện tại (kg) |
| `harvest_date` | `date` | | Ngày thu hoạch |
| `expiry_date` | `date` | | Hạn sử dụng |
| `quality_grade` | `enum` | | `A`, `B`, `C` |
| `created_at` | `timestamp` | | |
| `updated_at` | `timestamp` | | |

---

### 11. `warehouse_transactions`

Log xuất/nhập/điều chỉnh kho — không sửa, chỉ ghi thêm (append-only).

| Attribute | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `uuid` | PK, Not Null | Khóa chính |
| `warehouse_id` | `uuid` | FK → `warehouses.id` | Kho |
| `product_id` | `uuid` | FK → `products.id` | Sản phẩm |
| `inventory_lot_id` | `uuid` | FK → `inventory_lots.id` | Lô hàng bị ảnh hưởng |
| `type` | `enum` | Not Null | `inbound`, `outbound`, `adjustment` |
| `quantity_kg` | `decimal(15,2)` | Not Null | Số lượng (+ nhập, - xuất) |
| `note` | `text` | | Ghi chú |
| `created_by` | `uuid` | FK → `users.id` | Người thực hiện |
| `created_at` | `timestamp` | | |

---

## Nhóm 4: E-commerce (Client)

### 12. `clients`

Khách hàng — người mua hàng qua module e-commerce.

| Attribute | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `uuid` | PK, Not Null | Khóa chính |
| `full_name` | `varchar(100)` | Not Null | Họ tên |
| `email` | `varchar(150)` | Unique, Not Null | Email đăng nhập |
| `phone` | `varchar(20)` | | SĐT |
| `password_hash` | `varchar(255)` | Not Null | Mật khẩu đã hash |
| `shipping_address` | `text` | | Địa chỉ giao hàng mặc định |
| `is_active` | `boolean` | Default: true | Trạng thái |
| `created_at` | `timestamp` | | |
| `updated_at` | `timestamp` | | |

---

### 13. `orders`

Đơn hàng từ client.

| Attribute | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `uuid` | PK, Not Null | Khóa chính |
| `order_code` | `varchar(50)` | Unique, Not Null | Mã đơn hàng (VD: ĐH-20260409-001) |
| `client_id` | `uuid` | FK → `clients.id` | Khách đặt hàng |
| `status` | `enum` | Not Null | `pending`, `confirmed`, `shipping`, `delivered`, `cancelled` |
| `total_amount_vnd` | `decimal(15,2)` | Not Null | Tổng giá trị đơn |
| `shipping_address` | `text` | Not Null | Địa chỉ giao hàng cho đơn này |
| `note` | `text` | | Ghi chú |
| `created_at` | `timestamp` | | |
| `updated_at` | `timestamp` | | |

---

### 14. `order_items`

Chi tiết từng sản phẩm trong đơn hàng.

| Attribute | Data Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `uuid` | PK, Not Null | Khóa chính |
| `order_id` | `uuid` | FK → `orders.id` | Thuộc đơn hàng nào |
| `product_id` | `uuid` | FK → `products.id` | Sản phẩm |
| `quantity` | `decimal(10,2)` | Not Null | Số lượng đặt |
| `unit_price_vnd` | `decimal(15,2)` | Not Null | Đơn giá tại thời điểm đặt |
| `subtotal_vnd` | `decimal(15,2)` | Not Null | Thành tiền (quantity × unit_price) |
| `created_at` | `timestamp` | | |

---

## Tổng kết quan hệ

```
users (1) ──→ (N) farmers           : supervisor quản lý farmer
farmers (1) ──→ (N) land_parcels    : farmer sở hữu lô đất
farmers (1) ──→ (N) contracts       : farmer ký HĐ
land_parcels (1) ──→ (N) contracts  : lô đất gắn HĐ
users (1) ──→ (N) contracts         : supervisor giám sát HĐ
contracts (1) ──→ (N) daily_reports  : HĐ có nhiều báo cáo
daily_reports (1) ──→ (N) daily_report_images : báo cáo có nhiều ảnh
categories (1) ──→ (N) products     : danh mục chứa SP
users (1) ──→ (N) warehouses        : inventory user quản lý kho
warehouses (1) ──→ (N) inventory_lots : kho chứa lô hàng
products (1) ──→ (N) inventory_lots  : SP có nhiều lô
contracts (1) ──→ (N) inventory_lots : truy xuất nguồn gốc
warehouses (1) ──→ (N) warehouse_transactions : log kho
clients (1) ──→ (N) orders          : client đặt đơn
orders (1) ──→ (N) order_items      : đơn có nhiều SP
products (1) ──→ (N) order_items    : SP xuất hiện trong đơn
```