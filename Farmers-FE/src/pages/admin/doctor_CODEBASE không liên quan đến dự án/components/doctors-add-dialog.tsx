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
// import { PasswordInput } from '@/shared/components/password-input'
// import { SelectDropdown } from '@/shared/components/select-dropdown'
// import { useCreateDoctorMutation } from '../api'
// 
// const majorDoctorValues = ['DINH_DUONG', 'TAM_THAN', 'TL_PHCHUCNANG', 'NOI_KHOA', 'CG_UNGTHU'] as const
// 
// const roleValues = ['DOCTOR', 'PATIENT'] as const
// 
// const addDoctorFormSchema = z.object({
//   phoneNumber: z
//     .string()
//     .trim()
//     .min(1, 'Số điện thoại là bắt buộc.'),
//   password: z
//     .string()
//     .trim()
//     .min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
//   majorDoctor: z.enum(majorDoctorValues, {
//     message: 'Chuyên môn là bắt buộc.',
//   }),
//   fullName: z
//     .string()
//     .trim()
//     .min(1, 'Họ và tên là bắt buộc.'),
//   role: z.enum(roleValues, {
//     message: 'Vai trò là bắt buộc.',
//   }),
// })
// 
// type AddDoctorFormValues = z.infer<typeof addDoctorFormSchema>
// 
// type DoctorsAddDialogProps = {
//   open: boolean
//   onOpenChange: (open: boolean) => void
// }
// 
// export function DoctorsAddDialog({ open, onOpenChange }: DoctorsAddDialogProps) {
//   const createDoctorMutation = useCreateDoctorMutation()
// 
//   const form = useForm<AddDoctorFormValues>({
//     resolver: zodResolver(addDoctorFormSchema),
//     defaultValues: {
//       phoneNumber: '',
//       password: '',
//       majorDoctor: 'DINH_DUONG',
//       fullName: '',
//       role: 'DOCTOR',
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
//   const onSubmit = (values: AddDoctorFormValues) => {
//     createDoctorMutation.mutate(values, {
//       onSuccess: () => {
//         toast.success('Thêm bác sĩ thành công.')
//         form.reset()
//         onOpenChange(false)
//       },
//     })
//   }
// 
//   return (
//     <Dialog
//       open={open}
//       onOpenChange={handleClose}
//     >
//       <DialogContent className='sm:max-w-lg'>
//         <DialogHeader className='text-start'>
//           <DialogTitle>Thêm bác sĩ</DialogTitle>
//           <DialogDescription>
//             Điền thông tin bác sĩ mới, sau đó nhấn Thêm để lưu.
//           </DialogDescription>
//         </DialogHeader>
// 
//         <div className='max-h-[420px] w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
//           <Form {...form}>
//             <form
//               id='add-doctor-form'
//               onSubmit={form.handleSubmit(onSubmit)}
//               className='space-y-4 px-0.5'
//             >
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
//                 name='password'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Mật khẩu</FormLabel>
//                     <FormControl>
//                       <PasswordInput
//                         placeholder='Ít nhất 6 ký tự'
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
//                 name='majorDoctor'
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Chuyên môn</FormLabel>
//                     <FormControl>
//                       <SelectDropdown
//                         className='w-full'
//                         defaultValue={field.value}
//                         onValueChange={field.onChange}
//                         placeholder='Chọn chuyên môn'
//                         items={[
//                           { label: 'Chuyên gia Dinh dưỡng', value: 'DINH_DUONG' },
//                           { label: 'Chuyên gia Tâm thần', value: 'TAM_THAN' },
//                           { label: 'Chuyên gia phục hồi chức năng', value: 'TL_PHCHUCNANG' },
//                           { label: 'Chuyên gia Nội khoa', value: 'NOI_KHOA' },
//                           { label: 'Chuyên gia Ung thư', value: 'CG_UNGTHU' },
//                         ]}
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
// 
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
//             form='add-doctor-form'
//             disabled={createDoctorMutation.isPending}
//           >
//             Thêm
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }
// 
