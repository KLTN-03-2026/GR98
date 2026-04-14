// 'use client'
// 
// import { z } from 'zod'
// import { useForm } from 'react-hook-form'
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
// import type { Doctor } from '../data/doctors'
// import { useUpdateDoctorMutation } from '../api'
// 
// const editDoctorFormSchema = z.object({
//   id: z
//     .string()
//     .trim()
//     .min(1, 'ID là bắt buộc.'),
//   phoneNumber: z
//     .string()
//     .trim()
//     .min(1, 'Số điện thoại là bắt buộc.'),
//   fullName: z
//     .string()
//     .trim()
//     .min(1, 'Họ và tên là bắt buộc.'),
// })
// 
// type EditDoctorFormValues = z.infer<typeof editDoctorFormSchema>
// 
// type DoctorsEditDialogProps = {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   currentRow: Doctor
// }
// 
// export function DoctorsEditDialog({ open, onOpenChange, currentRow }: DoctorsEditDialogProps) {
//   const updateDoctorMutation = useUpdateDoctorMutation()
// 
//   const form = useForm<EditDoctorFormValues>({
//     resolver: zodResolver(editDoctorFormSchema),
//     defaultValues: {
//       id: currentRow.id,
//       phoneNumber: currentRow.phone,
//       fullName: currentRow.name,
//     },
//   })
// 
//   const handleClose = (state: boolean) => {
//     if (!state) {
//       form.reset()
//     }
//     onOpenChange(state)
//   }
// 
//   const onSubmit = (values: EditDoctorFormValues) => {
//     updateDoctorMutation.mutate(
//       {
//         id: values.id,
//         phoneNumber: values.phoneNumber,
//         fullName: values.fullName,
//       },
//       {
//         onSuccess: () => {
//           toast.success('Cập nhật bác sĩ thành công.')
//           form.reset()
//           onOpenChange(false)
//         },
//       }
//     )
//   }
// 
//   return (
//     <Dialog
//       open={open}
//       onOpenChange={handleClose}
//     >
//       <DialogContent className='sm:max-w-lg'>
//         <DialogHeader className='text-start'>
//           <DialogTitle>Cập nhật bác sĩ</DialogTitle>
//           <DialogDescription>
//             Chỉnh sửa thông tin bác sĩ, sau đó nhấn Cập nhật để lưu.
//           </DialogDescription>
//         </DialogHeader>
// 
//         <div className='max-h-[420px] w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
//           <Form {...form}>
//             <form
//               id='edit-doctor-form'
//               onSubmit={form.handleSubmit(onSubmit)}
//               className='space-y-4 px-0.5'
//             >
//               <FormField
//                 control={form.control}
//                 name='id'
//                 render={({ field }) => (
//                   <FormItem hidden>
//                     <FormLabel>ID</FormLabel>
//                     <FormControl>
//                       <Input
//                         type='text'
//                         disabled
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
// 
//               <FormField
//                 control={form.control}
//                 name='phoneNumber'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Số điện thoại</FormLabel>
//                     <FormControl>
//                       <Input
//                         type='tel'
//                         placeholder='Nhập số điện thoại'
//                         autoComplete='off'
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
// 
//               <FormField
//                 control={form.control}
//                 name='fullName'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Họ và tên</FormLabel>
//                     <FormControl>
//                       <Input
//                         type='text'
//                         placeholder='Nhập họ và tên'
//                         autoComplete='off'
//                         {...field}
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
//             form='edit-doctor-form'
//             disabled={updateDoctorMutation.isPending}
//           >
//             {updateDoctorMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }
// 
