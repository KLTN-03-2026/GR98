// import { useEffect, useMemo, useState } from 'react'
// import {
//   type SortingState,
//   type VisibilityState,
//   flexRender,
//   getCoreRowModel,
//   getFacetedRowModel,
//   getFacetedUniqueValues,
//   getFilteredRowModel,
//   getSortedRowModel,
//   useReactTable,
// } from '@tanstack/react-table'
// import { cn } from '@/shared/lib/utils'
// import { type NavigateFn, useTableUrlState } from '@/shared/hooks/use-table-url-state'
// import { Skeleton } from '@/shared/components/ui/skeleton'
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/shared/components/ui/table'
// import { DataTablePagination, DataTableToolbar } from '@/shared/components/data-table'
// import { type Doctor } from '../data/doctors.ts'
// import { doctorsColumns as columns } from './doctors-columns.tsx'
// 
// type DoctorsTableProps = {
//   data: Doctor[]
//   isLoading?: boolean
//   pageCount?: number
//   search: Record<string, unknown>
//   navigate: NavigateFn
// }
// 
// export function DoctorsTable({
//   data,
//   isLoading = false,
//   pageCount = 1,
//   search,
//   navigate,
// }: DoctorsTableProps) {
//   const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
//   const [sorting, setSorting] = useState<SortingState>([])
//   const specialtyFilterOptions = useMemo(
//     () =>
//       Array.from(new Set(data.map((doctor) => doctor.specialty)))
//         .filter((v) => Boolean(v) && v !== '—' && v !== '_')
//         .map((label) => ({
//           label,
//           value: label,
//         })),
//     [data]
//   )
// 
//   const {
//     columnFilters,
//     onColumnFiltersChange,
//     onPaginationChange,
//     ensurePageInRange,
//   } = useTableUrlState({
//     search,
//     navigate,
//     pagination: { defaultPage: 1, defaultPageSize: 10 },
//     globalFilter: { enabled: false },
//     columnFilters: [
//       { columnId: 'name', searchKey: 'name', type: 'string' },
//       { columnId: 'status', searchKey: 'status', type: 'array' },
//       { columnId: 'specialty', searchKey: 'specialty', type: 'array' },
//     ],
//   })
// 
//   // Đồng bộ lại pagination state của table theo search (hỗ trợ cả string | number)
//   const rawPage = search.page
//   const rawPageSize = search.pageSize
// 
//   const page =
//     typeof rawPage === 'number'
//       ? rawPage
//       : typeof rawPage === 'string'
//         ? Number.parseInt(rawPage, 10) || 1
//         : 1
// 
//   const pageSize =
//     typeof rawPageSize === 'number'
//       ? rawPageSize
//       : typeof rawPageSize === 'string'
//         ? Number.parseInt(rawPageSize, 10) || 10
//         : 10
// 
//   const tablePagination = {
//     pageIndex: Math.max(0, page - 1),
//     pageSize,
//   }
// 
//   // eslint-disable-next-line react-hooks/incompatible-library
//   const table = useReactTable({
//     data,
//     columns,
//     pageCount,
//     manualPagination: true,
//     state: {
//       sorting,
//       pagination: tablePagination,
//       columnFilters,
//       columnVisibility,
//     },
//     onPaginationChange,
//     onColumnFiltersChange,
//     onSortingChange: setSorting,
//     onColumnVisibilityChange: setColumnVisibility,
//     getCoreRowModel: getCoreRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     getFacetedRowModel: getFacetedRowModel(),
//     getFacetedUniqueValues: getFacetedUniqueValues(),
//   })
// 
//   useEffect(() => {
//     ensurePageInRange(table.getPageCount())
//   }, [table, ensurePageInRange])
// 
//   return (
//     <div
//       className={cn(
//         'max-sm:has-[div[role="toolbar"]]:mb-16',
//         'flex flex-1 flex-col gap-4'
//       )}
//     >
//       <DataTableToolbar
//         table={table}
//         searchPlaceholder='Lọc bác sĩ...'
//         searchKey='name'
//         filters={[
//           {
//             columnId: 'status',
//             title: 'Trạng thái',
//             options: [
//               { label: 'Đang hoạt động', value: 'active' },
//               { label: 'Không hoạt động', value: 'inactive' },
//             ],
//           },
//           {
//             columnId: 'specialty',
//             title: 'Chuyên khoa',
//             options: specialtyFilterOptions,
//           },
//         ]}
//       />
//       <div className='overflow-hidden rounded-md border'>
//         <Table>
//           <TableHeader>
//             {table.getHeaderGroups().map((headerGroup) => (
//               <TableRow key={headerGroup.id} className='group/row'>
//                 {headerGroup.headers.map((header) => {
//                   return (
//                     <TableHead
//                       key={header.id}
//                       colSpan={header.colSpan}
//                       className={cn(
//                         'bg-background group-hover/row:bg-muted',
//                         header.column.columnDef.meta?.className,
//                         header.column.columnDef.meta?.thClassName
//                       )}
//                     >
//                       {header.isPlaceholder
//                         ? null
//                         : flexRender(
//                             header.column.columnDef.header,
//                             header.getContext()
//                           )}
//                     </TableHead>
//                   )
//                 })}
//               </TableRow>
//             ))}
//           </TableHeader>
//           <TableBody>
//             {isLoading ? (
//               Array.from({ length: 8 }).map((_, idx) => (
//                 <TableRow key={`skeleton-row-${idx}`} className='group/row'>
//                   <TableCell className='bg-background group-hover/row:bg-muted'>
//                     <Skeleton className='h-4 w-48' />
//                   </TableCell>
//                   <TableCell className='bg-background group-hover/row:bg-muted'>
//                     <Skeleton className='h-6 w-28' />
//                   </TableCell>
//                   <TableCell className='bg-background group-hover/row:bg-muted'>
//                     <Skeleton className='h-4 w-28' />
//                   </TableCell>
//                   <TableCell className='bg-background group-hover/row:bg-muted'>
//                     <Skeleton className='h-6 w-20' />
//                   </TableCell>
//                 </TableRow>
//               ))
//             ) : table.getRowModel().rows?.length ? (
//               table.getRowModel().rows.map((row) => (
//                 <TableRow key={row.id} className='group/row'>
//                   {row.getVisibleCells().map((cell) => (
//                     <TableCell
//                       key={cell.id}
//                       className={cn(
//                         'bg-background group-hover/row:bg-muted',
//                         cell.column.columnDef.meta?.className,
//                         cell.column.columnDef.meta?.tdClassName
//                       )}
//                     >
//                       {flexRender(
//                         cell.column.columnDef.cell,
//                         cell.getContext()
//                       )}
//                     </TableCell>
//                   ))}
//                 </TableRow>
//               ))
//             ) : (
//               <TableRow>
//                 <TableCell colSpan={4} className='h-24 text-center'>
//                   Không có dữ liệu.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>
//       <DataTablePagination table={table} className='mt-auto' />
//     </div>
//   )
// }
