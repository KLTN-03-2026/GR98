# Data Grid

Khung `GridView` đa năng dùng chung cho các trang quản lý dạng card-grid.

## Mục tiêu

- Đồng bộ cấu trúc UI giữa các page quản lý (header, search/filter, actions, loading, empty, error, pagination).
- API theo hướng giống `data-table` nhưng render theo card.
- Tách phần domain ra khỏi layout chung bằng `renderCard`.

## Thành phần

- `DataGrid<TItem>`: component lõi.
- `DataGridToolbar`: search/filter/action/reload/export.
- `DataGridPagination`: phân trang chuẩn cho cả local và server.
- `DataGridSkeleton`: skeleton card-grid.
- `types.ts`: toàn bộ contract type để dùng lại.

## Giao diện mặc định

- `appearance="management"` (mặc định): bám layout các page quản lý hiện tại:
  - khối filter/header nằm trong `Card` viền dashed
  - toolbar tách 2 lớp rõ nghĩa:
    - lớp thao tác: search + filter + actions
    - lớp thông tin: `summary` (trái) và `quickStats` (phải)
  - vùng danh sách có scroll riêng
  - chân phân trang tách bằng `border-t`
- `appearance="plain"`: tối giản khi cần dùng trong màn phụ.

## Chuẩn logic dữ liệu

- `DataGrid` hỗ trợ 2 mode:
  - **Hybrid/automatic (mặc định)**: component tự xử lý search + filter + phân trang client khi truyền `data` (hoặc `items`).
  - **Manual (server)**: dùng `manualPagination`, `state`, `onPaginationChange`, `onSearchChange` để page/hook điều khiển hoàn toàn.
- Với server-side:
  - truyền `isLoading`, `error`, `onRetry` theo query state.
  - truyền `manualPagination`, `totalItems`, `pageCount`, `state.pagination`.
  - xử lý callback `onPaginationChange`/`onSearchChange` để gọi API.
- Với client-side:
  - chỉ cần truyền `data` (hoặc `items`) + `toolbar.search`.
  - grid tự filter/search/slice dữ liệu, tự clamp trang hợp lệ khi dữ liệu thay đổi.
  - `toolbar.onResetFilters` vẫn dùng để reset bộ lọc domain ở page.

## Chọn số dòng mỗi trang

- Footer pagination đã có selector `Dòng mỗi trang` như `DataTable`.
- Mặc định options: `[10, 20, 30, 50, 100]`.
- Có thể override qua `pageSizeOptions` (props của `DataGrid`) hoặc `pagination.pageSizeOptions` (legacy).

## Dùng cho card nhiều thông tin (avatar + badge + action)

`DataGrid` đã đủ để render kiểu card như `dashboard/users` (avatar, role badge, status badge, metadata và action icon), vì phần card được truyền qua `renderCard`.

Khi muốn card cao đều và không bị lệch hàng:

- bật `layout.equalHeightCards: true`
- để root card trong `renderCard` dùng `h-full w-full`
- với text dài, dùng `truncate` hoặc `line-clamp-*`

Ví dụ:

```tsx
layout={{
  minCardWidth: 300,
  equalHeightCards: true,
  itemWrapperClassName: "items-stretch",
}}
```

## Ví dụ nhanh

```tsx
import { DataGrid, type DataGridProps } from "@/components/data-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type FarmerItem = {
  id: string;
  fullName: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
};

function FarmerCard({ item }: { item: FarmerItem }) {
  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between">
          <p className="font-semibold">{item.fullName}</p>
          <Badge variant={item.status === "ACTIVE" ? "success" : "secondary"}>
            {item.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">SĐT: {item.phone}</p>
      </CardContent>
    </Card>
  );
}

export function FarmersGridExample(props: {
  items: FarmerItem[];
  isLoading: boolean;
  keyword: string;
  onKeywordChange: (value: string) => void;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <DataGrid<FarmerItem>
      title="Nông dân"
      description="Danh sách nông dân theo bộ lọc hiện tại"
      items={props.items}
      isLoading={props.isLoading}
      keyExtractor={(item) => item.id}
      renderCard={(item) => <FarmerCard item={item} />}
      toolbar={{
        search: {
          value: props.keyword,
          onChange: props.onKeywordChange,
          placeholder: "Tìm theo tên hoặc SĐT...",
        },
        onRefresh: () => {
          // server mode: refetch query
        },
        onResetFilters: () => {
          // client mode: reset keyword/filter/page
        },
        summary: (
          <>
            <span>
              Hiển thị {props.items.length} / {props.totalItems} nông dân.
            </span>
          </>
        ),
      }}
      pagination={{
        page: props.page,
        pageSize: props.pageSize,
        totalItems: props.totalItems,
        totalPages: props.totalPages,
        onPageChange: props.onPageChange,
      }}
      emptyState={{
        title: "Không có nông dân",
        description: "Không có bản ghi nào khớp với điều kiện tìm kiếm.",
      }}
      appearance="management"
    />
  );
}
```

## Ghi chú rollout

- Module này chỉ là khung tái sử dụng.
- Chưa migrate các page hiện tại trong phase đầu.
- Khi migrate, giữ nguyên query/hook/domain logic của page, chỉ thay layout render sang `DataGrid`.
