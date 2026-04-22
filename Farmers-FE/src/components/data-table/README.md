# DataTable (TanStack Table)

Bộ component trong thư mục này bọc [@tanstack/react-table](https://tanstack.com/table/latest) với UI dự án (toolbar tìm kiếm, phân trang, ẩn/hiện cột, in).

## Cài đặt

Các package cần có trong `Farmers-FE` (đã khai báo trong `package.json`):

- `@tanstack/react-table`
- `lodash` (toolbar debounce ô tìm)
- `@radix-ui/react-checkbox` (cột chọn hàng)

## Import

```ts
import { DataTable, DataTableColumnHeader } from '@/components/data-table';
```

## Hai kiểu dùng phổ biến

### 1. Client — đủ dữ liệu một lần

- Truyền `data` là toàn bộ mảng.
- **Không** bật `manualPagination` (mặc định `false`): phân trang và lọc trên client.
- Ô tìm trên toolbar dùng `globalFilter` (debounce 500ms) — phù hợp bảng nhỏ.

```tsx
<DataTable columns={columns} data={allRows} />
```

### 2. Server — phân trang / tìm kiếm từ API

Dùng khi dữ liệu lấy theo trang từ backend (ví dụ báo cáo hàng ngày).

- `manualPagination={true}`
- `pageCount={totalPages}` (từ API)
- `totalItems={total}` (tổng bản ghi — hiển thị đúng ở footer)
- Đồng bộ trang & page size:

```tsx
const [page, setPage] = useState(1);
const [limit, setLimit] = useState(15);

const handlePaginationChange = (updater: Updater<PaginationState>) => {
  const prev = { pageIndex: page - 1, pageSize: limit };
  const next = typeof updater === 'function' ? updater(prev) : updater;
  setPage(next.pageIndex + 1);
  setLimit(next.pageSize);
};

<DataTable
  columns={columns}
  data={rows}
  manualPagination
  pageCount={totalPages}
  totalItems={total}
  onPaginationChange={handlePaginationChange}
  state={{ pagination: { pageIndex: page - 1, pageSize: limit } }}
  pageSizeOptions={[10, 15, 20, 30, 50]}
  hiddenSearch
  enableSorting={false}
  filterToolbar={<YourServerFilters />}
/>
```

- **`hiddenSearch={true}`**: ẩn ô tìm mặc định (vì nó gắn `globalFilter` trên client). Đặt input tìm kiếm của bạn trong **`filterToolbar`** và debounce → gọi API.
- **`enableSorting={false}`**: nên tắt nếu BE chưa hỗ trợ sort — tránh hiểu nhầm sort chỉ trên một trang.

### `pageSizeOptions`

Prop tùy chọn trên `DataTable` — danh sách số dòng mỗi trang hiển thị trong `Select` phân trang. Mặc định nội bộ là `[10, 20, 30, 50, 100]`; có thể truyền `[10, 15, 20, 30, 50]` để khớp `limit` API.

## Định nghĩa cột

Dùng `ColumnDef<TData>[]` từ `@tanstack/react-table`. Header có sort (client) có thể dùng `DataTableColumnHeader`:

```tsx
{
  accessorKey: 'name',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Tên" />
  ),
}
```

## `onRowClick` và nút trong hàng

`DataTable` gắn `onRowClick` trên `<TableRow>`. Nếu trong ô có `Button` / link, gọi **`e.stopPropagation()`** trong handler để tránh vừa bấm nút vừa kích hoạt mở chi tiết theo hàng.

## Checkbox & xóa nhiều

- `enableCheckbox={true}` — thêm cột chọn (dùng `@/components/ui/checkbox`).
- `onDeleteMultiple={(rows) => { ... }}` — hiện nút xóa khi có dòng được chọn.

## In

Toolbar có nút in (khi có callback nội bộ). Bảng render với `id="data-table-unified"` để lấy HTML khi in.

## Tham khảo trong repo

- Trang admin: [`src/pages/admin/daily-reports/index.tsx`](../../pages/admin/daily-reports/index.tsx) + [`daily-reports-columns.tsx`](../../pages/admin/daily-reports/daily-reports-columns.tsx)
- Trang supervisor: [`src/pages/supervisor/daily-reports/index.tsx`](../../pages/supervisor/daily-reports/index.tsx) + [`components/daily-reports-columns.tsx`](../../pages/supervisor/daily-reports/components/daily-reports-columns.tsx) + [`api/use-supervisor-daily-dashboard.ts`](../../pages/supervisor/daily-reports/api/use-supervisor-daily-dashboard.ts)
