// 'use client'
// 
// import { format } from 'date-fns'
// import { vi } from 'date-fns/locale'
// import { PencilLine, Trash2 } from 'lucide-react'
// import { Button } from '@/shared/components/ui/button'
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from '@/shared/components/ui/dialog'
// import { Badge } from '@/shared/components/ui/badge'
// import { ScrollArea } from '@/shared/components/ui/scroll-area'
// import type { DoctorListItem } from '../api/get-doctor-list'
// import {
//   type DoctorSchedule,
//   useDeleteDoctorScheduleMutation,
//   useDoctorSchedulesByUserIdQuery,
// } from '../api'
// 
// type DoctorsScheduleListDialogProps = {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   doctor: DoctorListItem | null
//   onEditSchedule?: (schedule: DoctorSchedule) => void
// }
// 
// const statusMeta: Record<
//   DoctorSchedule['status'],
//   { label: string; variant: 'outline' | 'default'; className: string }
// > = {
//   FREE: {
//     label: 'Rảnh',
//     variant: 'outline',
//     className:
//       'border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300',
//   },
//   BOOKED: {
//     label: 'Đã đặt',
//     variant: 'outline',
//     className:
//       'border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:text-amber-300',
//   },
// }
// 
// export function DoctorsScheduleListDialog({
//   open,
//   onOpenChange,
//   doctor,
//   onEditSchedule,
// }: DoctorsScheduleListDialogProps) {
//   const { data: schedules = [], isLoading } = useDoctorSchedulesByUserIdQuery(
//     doctor?.id ?? null
//   )
//   const deleteMutation = useDeleteDoctorScheduleMutation()
// 
//   const handleDelete = (scheduleId: string) => {
//     deleteMutation.mutate(scheduleId)
//   }
// 
//   const formatDateTime = (value: string) => {
//     return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: vi })
//   }
// 
//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className='flex h-[380px] flex-col sm:max-w-xl'>
//         <DialogHeader className='text-start'>
//           <DialogTitle className='text-lg sm:text-xl'>
//             Lịch rảnh của bác sĩ{doctor ? ` - ${doctor.fullName}` : ''}
//           </DialogTitle>
//           <DialogDescription className='text-sm sm:text-[15px]'>
//             Danh sách các khoảng thời gian rảnh của bác sĩ, bạn có thể cập nhật
//             hoặc xóa từng lịch.
//           </DialogDescription>
//         </DialogHeader>
// 
//         <ScrollArea className='flex-1 pt-1 pb-3'>
//           <div className='space-y-3'>
//             {isLoading ? (
//               <p className='text-sm text-muted-foreground px-1'>
//                 Đang tải danh sách lịch rảnh...
//               </p>
//             ) : schedules.length === 0 ? (
//               <p className='text-sm text-muted-foreground px-1'>
//                 Hiện chưa có lịch rảnh nào cho bác sĩ này.
//               </p>
//             ) : (
//               schedules.map((schedule) => {
//                 const meta = statusMeta[schedule.status]
// 
//                 return (
//                   <div
//                     key={schedule.id}
//                     className='flex w-full items-start justify-between gap-3 rounded-2xl border border-border/70 bg-card/90 px-4 py-3'
//                   >
//                     <div className='space-y-2'>
//                       <div className='flex items-center gap-2'>
//                         <span className='text-sm font-medium text-muted-foreground'>
//                           Trạng thái:
//                         </span>
//                         <Badge
//                           variant={meta.variant}
//                           className={`px-2.5 py-0.5 text-[12px] ${meta.className}`}
//                         >
//                           {meta.label}
//                         </Badge>
//                       </div>
//                       <p className='text-sm text-muted-foreground'>
//                         <span className='font-medium text-foreground'>Bắt đầu:</span>{' '}
//                         {formatDateTime(schedule.startDate)}
//                       </p>
//                       <p className='text-sm text-muted-foreground'>
//                         <span className='font-medium text-foreground'>Kết thúc:</span>{' '}
//                         {formatDateTime(schedule.endDate)}
//                       </p>
//                     </div>
// 
//                     <div className='flex flex-col items-end gap-1.5'>
//                       <Button
//                         variant='ghost'
//                         size='icon'
//                         className='h-9 w-9 rounded-full'
//                         onClick={() => onEditSchedule?.(schedule)}
//                       >
//                         <PencilLine className='size-4.5' />
//                       </Button>
//                       <Button
//                         variant='ghost'
//                         size='icon'
//                         className='h-9 w-9 rounded-full text-destructive hover:bg-destructive/10'
//                         onClick={() => handleDelete(schedule.id)}
//                         disabled={deleteMutation.isPending}
//                       >
//                         <Trash2 className='size-4.5' />
//                       </Button>
//                     </div>
//                   </div>
//                 )
//               })
//             )}
//           </div>
//         </ScrollArea>
//       </DialogContent>
//     </Dialog>
//   )
// }
// 
