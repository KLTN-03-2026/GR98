# Hướng dẫn sử dụng Postman Collection

## Cài đặt

1. **Import Collection vào Postman:**
   - Mở Postman
   - Click vào **Import** ở góc trên bên trái
   - Chọn file `postman_collection.json`
   - Click **Import**

2. **Import Environment:**
   - Click vào **Import** lần nữa
   - Chọn file `postman_environment.json`
   - Click **Import**
   - Chọn environment **Library Management - Local** ở góc trên bên phải

## Cấu trúc Collection

Collection được chia thành các folder:

### 1. Authentication
- **Register**: Đăng ký tài khoản mới
- **Login**: Đăng nhập và lấy JWT token (tự động lưu token vào environment)

### 2. Branches
- **Get All Branches**: Lấy danh sách chi nhánh (có pagination)
- **Get Branch By ID**: Lấy chi tiết chi nhánh
- **Create Branch**: Tạo chi nhánh mới (ADMIN, MANAGER)
- **Update Branch**: Cập nhật chi nhánh (ADMIN, MANAGER)
- **Delete Branch**: Xóa chi nhánh (ADMIN)

### 3. Users
- **Get All Users**: Lấy danh sách user (có pagination)
- **Get User By ID**: Lấy chi tiết user
- **Create User (Staff)**: Tạo user mới (ADMIN, STAFF)
- **Update User**: Cập nhật user (ADMIN, MANAGER, STAFF)
- **Delete User**: Xóa user (ADMIN, MANAGER)

### 4. Books
- **Get All Books**: Lấy danh sách sách (có pagination)
- **Get Book By ID**: Lấy chi tiết sách
- **Create Book**: Tạo sách mới (ADMIN, MANAGER)
- **Update Book**: Cập nhật sách (ADMIN, MANAGER)
- **Delete Book**: Xóa sách (ADMIN, MANAGER)

### 5. Borrows
- **Get All Borrows**: Lấy danh sách lượt mượn (có pagination)
- **Get Borrow By ID**: Lấy chi tiết lượt mượn
- **Create Borrow**: Tạo lượt mượn mới (ADMIN, MANAGER, STAFF)
- **Return Book**: Trả sách (ADMIN, MANAGER, STAFF)
- **Delete Borrow**: Xóa lượt mượn (ADMIN, MANAGER)

## Quy trình test

### Bước 1: Đăng nhập với Super Admin

Khi ứng dụng khởi động lần đầu, hệ thống tự động tạo super admin:
- **Email**: `admin@library.com`
- **Password**: `admin123`

1. Chọn request **Authentication > Login**
2. Điền thông tin:
   ```json
   {
     "email": "admin@library.com",
     "password": "admin123"
   }
   ```
3. Click **Send**
4. Token sẽ tự động được lưu vào environment

### Bước 2: Đăng ký tài khoản mới (tùy chọn)

1. Chọn request **Authentication > Register**
2. Điền thông tin:
   ```json
   {
     "username": "reader1",
     "email": "reader1@example.com",
     "password": "password123",
     "branchId": "<branch-id>"
   }
   ```
3. Click **Send**
4. Copy `branchId` từ response và paste vào environment variable `branchId`

### Bước 3: Đăng nhập

1. Chọn request **Authentication > Login**
2. Điền thông tin:
   ```json
   {
     "email": "reader1@example.com",
     "password": "password123"
   }
   ```
3. Click **Send**
4. Token sẽ tự động được lưu vào environment variable `access_token`

### Bước 4: Test các API khác

Sau khi đăng nhập, tất cả các request khác sẽ tự động sử dụng token từ environment.

## Environment Variables

Collection sử dụng các biến môi trường sau:

- `baseUrl`: URL của API (mặc định: http://localhost:3000)
- `access_token`: JWT token (tự động lưu sau khi login)
- `branchId`: ID của chi nhánh
- `userId`: ID của user
- `bookId`: ID của sách
- `borrowId`: ID của lượt mượn
- `userRole`: Role của user hiện tại
- `createdUserId`: ID của user vừa tạo

## Auto-save Variables

Một số request có script tự động lưu response vào environment variables:

- **Login**: Lưu `access_token`, `userId`, `userRole`, `branchId`
- **Create Branch**: Lưu `branchId`
- **Create User**: Lưu `createdUserId`
- **Create Book**: Lưu `bookId`
- **Create Borrow**: Lưu `borrowId`

## Lưu ý

1. **Thứ tự thực hiện:**
   - Phải đăng nhập trước khi sử dụng các API khác
   - Tạo chi nhánh trước khi đăng ký user
   - Tạo user và sách trước khi tạo lượt mượn

2. **Phân quyền:**
   - Một số API chỉ dành cho ADMIN hoặc MANAGER
   - Đảm bảo bạn đang sử dụng token của user có đủ quyền

3. **Pagination:**
   - Tất cả API GET danh sách đều hỗ trợ pagination
   - Sử dụng query params `page` và `limit`

4. **Token hết hạn:**
   - Token có thời hạn 7 ngày
   - Nếu token hết hạn, đăng nhập lại để lấy token mới

## Troubleshooting

### Lỗi 401 Unauthorized
- Kiểm tra token có được lưu trong environment không
- Đảm bảo header `Authorization: Bearer <token>` được gửi kèm
- Token có thể đã hết hạn, đăng nhập lại

### Lỗi 403 Forbidden
- User hiện tại không có quyền thực hiện action này
- Kiểm tra role của user trong token

### Lỗi 404 Not Found
- Kiểm tra ID có đúng không
- Đảm bảo resource tồn tại trong database

### Lỗi 409 Conflict
- Email hoặc username đã tồn tại (khi register)
- Branch không tồn tại (khi tạo user)

