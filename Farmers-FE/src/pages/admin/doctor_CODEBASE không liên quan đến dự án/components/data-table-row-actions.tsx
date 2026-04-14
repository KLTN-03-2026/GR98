// import { DotsHorizontalIcon } from '@radix-ui/react-icons'
// import { type Row } from '@tanstack/react-table'
// import { CalendarClock, Trash2, UserPen } from 'lucide-react'
// import { Button } from '@/shared/components/ui/button'
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuShortcut,
//   DropdownMenuTrigger,
// } from '@/shared/components/ui/dropdown-menu'
// import { type Doctor } from '../data/doctors'
// import { useDoctors } from './doctors-provider'
// 
// type DataTableRowActionsProps = {
//   row: Row<Doctor>
// }
// 
// export function DataTableRowActions({ row }: DataTableRowActionsProps) {
//   const { setOpen, setCurrentRow } = useDoctors()
// 
//   return (
//     <DropdownMenu modal={false}>
//       <DropdownMenuTrigger asChild>
//         <Button
//           variant='ghost'
//           className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
//         >
//           <DotsHorizontalIcon className='h-4 w-4' />
//           <span className='sr-only'>Open menu</span>
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align='end' className='w-[200px]'>
//         <DropdownMenuItem
//           onClick={() => {
//             setCurrentRow(row.original)
//             setOpen('add')
//           }}
//         >
//           Xem lịch rãnh
//           <DropdownMenuShortcut>
//             <CalendarClock size={16} />
//           </DropdownMenuShortcut>
//         </DropdownMenuItem>
//         <DropdownMenuSeparator />
//         <DropdownMenuItem
//           onClick={() => {
//             setCurrentRow(row.original)
//             setOpen('edit')
//           }}
//         >
//           Chỉnh sửa
//           <DropdownMenuShortcut>
//             <UserPen size={16} />
//           </DropdownMenuShortcut>
//         </DropdownMenuItem>
//         <DropdownMenuItem
//           onClick={() => {
//             setCurrentRow(row.original)
//             setOpen('delete')
//           }}
//           className='text-red-500!'
//         >
//           Xoá
//           <DropdownMenuShortcut>
//             <Trash2 size={16} />
//           </DropdownMenuShortcut>
//         </DropdownMenuItem>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   )
// }
// 
