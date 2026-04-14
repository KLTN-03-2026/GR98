// 'use client'
// 
// import { useEffect, useMemo } from 'react'
// import { z } from 'zod'
// import { type SubmitHandler, useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { toast } from 'sonner'
// import { Button } from '@/shared/components/ui/button'
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/shared/components/ui/dialog'
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/shared/components/ui/form'
// import { Input } from '@/shared/components/ui/input'
// import { Combobox } from '@/shared/components/ui/combobox'
// import type { DoctorListItem } from '../api/get-doctor-list'
// import {
//   type CreateDoctorScheduleData,
//   type DoctorSchedule,
//   type UpdateDoctorScheduleData,
//   useCreateDoctorScheduleMutation,
//   useUpdateDoctorScheduleMutation,
// } from '../api'
// 
// const createDoctorScheduleFormSchema = z
//   .object({
//     userId: z
//       .string()
//       .trim()
//       .min(1, 'Bác sĩ là bắt buộc.'),
//     startDate: z
//       .string()
//       .trim()
//       .min(1, 'Thời gian bắt đầu là bắt buộc.')
//       .refine(
//         (value) => !Number.isNaN(Date.parse(value)),
//         'Thời gian bắt đầu không hợp lệ.'
//       ),
//     endDate: z
//       .string()
//       .trim()
//       .min(1, 'Thời gian kết thúc là bắt buộc.')
//       .refine(
//         (value) => !Number.isNaN(Date.parse(value)),
//         'Thời gian kết thúc không hợp lệ.'
//       ),
//   })
//   .refine(
//     (values) => {
//       const start = new Date(`${values.startDate}Z`)
//       const end = new Date(`${values.endDate}Z`)
//       return end > start
//     },
//     {
//       path: ['endDate'],
//       message: 'Thời gian kết thúc phải sau thời gian bắt đầu.',
//     }
//   )
// 
// function formatLocalDateTimeInput(value: string) {
//   const date = new Date(value)
//   if (Number.isNaN(date.getTime())) return ''
// 
//   const pad = (n: number) => n.toString().padStart(2, '0')
//   return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
//     date.getUTCDate()
//   )}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
// }
// 
// type CreateDoctorScheduleFormInput = z.input<
//   typeof createDoctorScheduleFormSchema
// >
// type CreateDoctorScheduleFormOutput = z.output<
//   typeof createDoctorScheduleFormSchema
// >
// 
// type DoctorsScheduleDialogProps = {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   doctors: DoctorListItem[]
//   defaultDoctorId?: string | null
//   mode?: 'create' | 'edit'
//   schedule?: DoctorSchedule | null
// }
// 
// export function DoctorsScheduleDialog({
//   open,
//   onOpenChange,
//   doctors,
//   defaultDoctorId,
//   mode = 'create',
//   schedule,
// }: DoctorsScheduleDialogProps) {
//   const createScheduleMutation = useCreateDoctorScheduleMutation()
//   const updateScheduleMutation = useUpdateDoctorScheduleMutation()
// 
//   const form = useForm<
//     CreateDoctorScheduleFormInput,
//     unknown,
//     CreateDoctorScheduleFormOutput
//   >({
//     resolver: zodResolver(createDoctorScheduleFormSchema),
//     defaultValues: {
//       userId: defaultDoctorId ?? '',
//       startDate: '',
//       endDate: '',
//     },
//   })
// 
//   useEffect(() => {
//     if (open) {
//       if (mode === 'edit' && schedule) {
//         form.reset({
//           userId: schedule.userId,
//           startDate: schedule.startDate
//             ? formatLocalDateTimeInput(schedule.startDate)
//             : '',
//           endDate: schedule.endDate
//             ? formatLocalDateTimeInput(schedule.endDate)
//             : '',
//         })
//       } else {
//         form.reset({
//           userId: defaultDoctorId ?? '',
//           startDate: '',
//           endDate: '',
//         })
//       }
//     }
//   }, [open, defaultDoctorId, form, mode, schedule])
// 
//   const selectedDoctor =
//     defaultDoctorId != null
//       ? doctors.find((doctor) => doctor.id === defaultDoctorId) ?? null
//       : null
//   const doctorOptions = useMemo(
//     () => doctors.map((doctor) => ({ id: doctor.id, label: doctor.fullName })),
//     [doctors]
//   )
// 
//   const handleClose = (state: boolean) => {
//     if (!state) {
//       if (mode === 'edit' && schedule) {
//         form.reset({
//           userId: schedule.userId,
//           startDate: schedule.startDate
//             ? formatLocalDateTimeInput(schedule.startDate)
//             : '',
//           endDate: schedule.endDate
//             ? formatLocalDateTimeInput(schedule.endDate)
//             : '',
//         })
//       } else {
//         form.reset({
//           userId: defaultDoctorId ?? '',
//           startDate: '',
//           endDate: '',
//         })
//       }
//     }
//     onOpenChange(state)
//   }
// 
//   const onSubmit: SubmitHandler<CreateDoctorScheduleFormOutput> = async (
//     values
//   ) => {
//     const basePayload: UpdateDoctorScheduleData = {
//       startDate: new Date(`${values.startDate}Z`).toISOString(),
//       endDate: new Date(`${values.endDate}Z`).toISOString(),
//     }
// 
//     if (mode === 'edit' && schedule) {
//       updateScheduleMutation.mutate(
//         {
//           id: schedule.id,
//           data: basePayload,
//         },
//         {
//           onSuccess: () => {
//             form.reset({
//               userId: schedule.userId,
//               startDate: schedule.startDate
//                 ? formatLocalDateTimeInput(schedule.startDate)
//                 : '',
//               endDate: schedule.endDate
//                 ? formatLocalDateTimeInput(schedule.endDate)
//                 : '',
//             })
//             onOpenChange(false)
//           },
//         }
//       )
//     } else {
//       const payload: CreateDoctorScheduleData = {
//         userId: values.userId,
//         ...basePayload,
//       }
// 
//       createScheduleMutation.mutate(payload, {
//         onSuccess: () => {
//           toast.success('Đã tạo lịch rảnh cho bác sĩ thành công.')
//           form.reset({
//             userId: defaultDoctorId ?? '',
//             startDate: '',
//             endDate: '',
//           })
//           onOpenChange(false)
//         },
//       })
//     }
//   }
// 
//   const isSubmitting =
//     form.formState.isSubmitting ||
//     createScheduleMutation.isPending ||
//     updateScheduleMutation.isPending
// 
//   const title =
//     mode === 'edit' ? 'Cập nhật lịch rảnh cho bác sĩ' : 'Tạo lịch rảnh cho bác sĩ'
// 
//   return (
//     <Dialog open={open} onOpenChange={handleClose}>
//       <DialogContent className='sm:max-w-lg'>
//         <DialogHeader className='text-start'>
//           <DialogTitle>{title}</DialogTitle>
//           <DialogDescription>
//             Chọn khoảng thời gian rảnh, sau đó nhấn Tạo để lưu lại
//             lịch rảnh.
//           </DialogDescription>
//         </DialogHeader>
// 
//         <div className='max-h-[420px] w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
//           <Form {...form}>
//             <form
//               id='create-doctor-schedule-form'
//               onSubmit={form.handleSubmit(onSubmit)}
//               className='space-y-4 px-0.5'
//             >
//               {defaultDoctorId ? (
//                 <>
//                   <FormField
//                     control={form.control}
//                     name='userId'
//                     render={({ field }) => (
//                       <FormItem className='hidden'>
//                         <FormLabel>Bác sĩ</FormLabel>
//                         <FormControl>
//                           <Input type='hidden' {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
// 
//                   <div className='space-y-1'>
//                     <p className='text-sm font-medium text-foreground'>Bác sĩ</p>
//                     <p className='rounded-lg border border-border/70 bg-muted/60 px-3 py-2 text-sm font-semibold'>
//                       {selectedDoctor?.fullName ?? 'Không tìm thấy thông tin bác sĩ'}
//                     </p>
//                   </div>
//                 </>
//               ) : (
//                 <FormField
//                   control={form.control}
//                   name='userId'
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Bác sĩ</FormLabel>
//                       <FormControl>
//                         <Combobox
//                           label='Bác sĩ'
//                           showLabel={false}
//                           value={field.value}
//                           options={doctorOptions}
//                           placeholder='Chọn bác sĩ'
//                           searchPlaceholder='Tìm bác sĩ'
//                           onChange={field.onChange}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               )}
// 
//               <FormField
//                 control={form.control}
//                 name='startDate'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Thời gian bắt đầu</FormLabel>
//                     <FormControl>
//                       <Input
//                         type='datetime-local'
//                         value={field.value}
//                         onChange={(event) => {
//                           const { value } = event.target
//                           field.onChange(value)
// 
//                           const start = new Date(`${value}Z`)
//                           if (Number.isNaN(start.getTime())) return
// 
//                           const currentEndValue = form.getValues('endDate')
//                           const currentEnd = currentEndValue
//                             ? new Date(`${currentEndValue}Z`)
//                             : null
// 
//                           if (
//                             !currentEnd ||
//                             Number.isNaN(currentEnd.getTime()) ||
//                             currentEnd <= start
//                           ) {
//                             const autoEnd = new Date(start.getTime() + 30 * 60 * 1000)
//                             const pad = (n: number) =>
//                               n.toString().padStart(2, '0')
//                             const autoEndValue = `${autoEnd.getUTCFullYear()}-${pad(
//                               autoEnd.getUTCMonth() + 1
//                             )}-${pad(autoEnd.getUTCDate())}T${pad(
//                               autoEnd.getUTCHours()
//                             )}:${pad(autoEnd.getUTCMinutes())}`
// 
//                             form.setValue('endDate', autoEndValue, {
//                               shouldValidate: true,
//                             })
//                           }
//                         }}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
// 
//               <FormField
//                 control={form.control}
//                 name='endDate'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Thời gian kết thúc</FormLabel>
//                     <FormControl>
//                       <Input
//                         type='datetime-local'
//                         value={field.value}
//                         onChange={field.onChange}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </form>
//           </Form>
//         </div>
// 
//         <DialogFooter className='flex justify-end space-x-2'>
//           <Button
//             type='button'
//             variant='ghost'
//             onClick={() => handleClose(false)}
//           >
//             Hủy
//           </Button>
//           <Button
//             type='submit'
//             form='create-doctor-schedule-form'
//             disabled={isSubmitting}
//           >
//             Tạo
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }
