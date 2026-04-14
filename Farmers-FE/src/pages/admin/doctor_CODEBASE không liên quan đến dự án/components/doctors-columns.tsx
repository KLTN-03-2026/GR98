// import { type ColumnDef } from '@tanstack/react-table'
// import { cn } from '@/shared/lib/utils'
// import { Badge } from '@/shared/components/ui/badge'
// import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
// import { DataTableColumnHeader } from '@/shared/components/data-table'
// import { LongText } from '@/shared/components/long-text'
// import { type Doctor } from '../data/doctors.ts'
// import { DataTableRowActions } from './data-table-row-actions'
// 
// type BadgeVariant =
//   | 'default'
//   | 'secondary'
//   | 'outline'
//   | 'destructive'
//   | 'success'
//   | 'warning'
//   | 'indigo'
//   | 'glass'
// 
// const specialtyVariants: Record<string, BadgeVariant> = {
//   'Dinh dưỡng': 'success',
//   'Tâm thần': 'warning',
//   'Tâm lý - PHCN': 'indigo',
//   'Chuyên gia ung thư': 'destructive',
// }
// 
// export const doctorsColumns: ColumnDef<Doctor>[] = [
//   {
//     accessorKey: 'name',
//     header: ({ column }) => (
//       <DataTableColumnHeader column={column} title='Tên bác sĩ' />
//     ),
//     cell: ({ row }) => {
//       const doctor = row.original
//       const fullName = doctor.name
// 
//       const getVietnameseInitial = (name: string) => {
//         if (!name) return '?'
//         const parts = name.trim().split(/\s+/)
//         const last = parts[parts.length - 1] ?? ''
//         const initial = last.charAt(0) || name.charAt(0)
//         return initial.toUpperCase()
//       }
// 
//       const initial = getVietnameseInitial(fullName)
// 
//       return (
//         <div className='flex items-center gap-3 ps-1'>
//           <Avatar className='size-9'>
//             {doctor.avatarUrl ? (
//               <AvatarImage src={doctor.avatarUrl} alt={fullName} />
//             ) : (
//               <AvatarFallback>{initial}</AvatarFallback>
//             )}
//           </Avatar>
//           <LongText className='max-w-60'>{fullName}</LongText>
//         </div>
//       )
//     },
//     meta: {
//       className: cn(
//         'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
//         'ps-0.5'
//       ),
//     },
//     enableHiding: false,
//   },
//   {
//     accessorKey: 'specialty',
//     header: ({ column }) => (
//       <DataTableColumnHeader column={column} title='Chuyên khoa' />
//     ),
//     cell: ({ row }) => {
//       const specialty = row.getValue('specialty') as string
//       return (
//         <Badge variant={specialtyVariants[specialty] ?? 'secondary'}>
//           {specialty}
//         </Badge>
//       )
//     },
//     filterFn: (row, id, value) => {
//       return value.includes(row.getValue(id))
//     },
//     enableSorting: false,
//   },
//   {
//     accessorKey: 'phone',
//     header: ({ column }) => (
//       <DataTableColumnHeader column={column} title='Số điện thoại' />
//     ),
//     cell: ({ row }) => (
//       <div className='text-muted-foreground'>{row.getValue('phone')}</div>
//     ),
//     enableSorting: false,
//   },
//   {
//     accessorKey: 'status',
//     header: ({ column }) => (
//       <DataTableColumnHeader column={column} title='Trạng thái' />
//     ),
//     cell: ({ row }) => {
//       const status = row.getValue('status') as Doctor['status']
//       return status === 'active' ? (
//         <Badge className='bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20'>
//           Đang hoạt động
//         </Badge>
//       ) : (
//         <Badge className='bg-gray-500/15 text-gray-600 border-gray-200 hover:bg-gray-500/20'>
//           Không hoạt động
//         </Badge>
//       )
//     },
//     filterFn: (row, id, value) => {
//       return value.includes(row.getValue(id))
//     },
//     enableSorting: false,
//   },
//   {
//     id: 'actions',
//     cell: DataTableRowActions,
//   },
// ]
