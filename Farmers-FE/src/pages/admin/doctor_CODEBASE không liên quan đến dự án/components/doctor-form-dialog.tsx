// import { type FormEvent, useState } from 'react'
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
// import { Input } from '@/shared/components/ui/input'
// import { Label } from '@/shared/components/ui/label'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/shared/components/ui/select'
// import { Textarea } from '@/shared/components/ui/textarea'
// import { Combobox } from '@/shared/components/ui/combobox'
// import {
//   useCreateDoctorMutation,
//   useUpdateDoctorMutation,
//   type DoctorAcademic,
//   type DoctorDegree,
//   type DoctorListItem,
//   type DoctorMajor,
//   type Gender,
//   type UserStatus,
// } from '../api'
// 
// type DoctorFormDialogProps = {
//   mode: 'create' | 'edit'
//   doctor?: DoctorListItem | null
//   open: boolean
//   onOpenChange: (open: boolean) => void
// }
// 
// type DoctorFormState = {
//   fullName: string
//   phoneNumber: string
//   email: string
//   password: string
//   majorDoctor: DoctorMajor | ''
//   status: UserStatus
//   gender: Gender | ''
//   birthYear: string
//   degree: DoctorDegree | ''
//   academic: DoctorAcademic | ''
//   workplace: string
//   department: string
//   bio: string
// }
// 
// const majorOptions: Array<{ value: DoctorMajor; label: string }> = [
//   { value: 'DINH_DUONG', label: 'Dinh dưỡng' },
//   { value: 'TAM_THAN', label: 'Tâm thần' },
//   { value: 'TL_PHCHUCNANG', label: 'Tâm lý - Phục hồi chức năng' },
//   { value: 'NOI_KHOA', label: 'Nội khoa' },
//   { value: 'CG_UNGTHU', label: 'Chăm sóc ung thư' },
// ]
// 
// const degreeOptions: Array<{ value: DoctorDegree; label: string }> = [
//   { value: 'CU_NHAN', label: 'Cử nhân' },
//   { value: 'BAC_SI', label: 'Bác sĩ' },
//   { value: 'THS', label: 'Thạc sĩ' },
//   { value: 'TIEN_SY', label: 'Tiến sĩ' },
// ]
// 
// const academicOptions: Array<{ value: DoctorAcademic; label: string }> = [
//   { value: 'PGS', label: 'Phó giáo sư' },
//   { value: 'GS', label: 'Giáo sư' },
// ]
// 
// const statusOptions: Array<{ value: UserStatus; label: string }> = [
//   { value: 'ACTIVE', label: 'Hoạt động' },
//   { value: 'INACTIVE', label: 'Tạm ngừng' },
//   { value: 'BLOCKED', label: 'Đã khóa' },
// ]
// 
// const genderOptions: Array<{ value: Gender; label: string }> = [
//   { value: 'NAM', label: 'Nam' },
//   { value: 'NU', label: 'Nữ' },
// ]
// 
// function createEmptyForm(): DoctorFormState {
//   return {
//     fullName: '',
//     phoneNumber: '',
//     email: '',
//     password: '',
//     majorDoctor: 'DINH_DUONG',
//     status: 'ACTIVE',
//     gender: '',
//     birthYear: '',
//     degree: 'THS',
//     academic: '',
//     workplace: '',
//     department: '',
//     bio: '',
//   }
// }
// 
// function createFormFromDoctor(doctor?: DoctorListItem | null): DoctorFormState {
//   if (!doctor) {
//     return createEmptyForm()
//   }
// 
//   return {
//     fullName: doctor.fullName,
//     phoneNumber: doctor.phoneNumber ?? '',
//     email: doctor.doctorInfo?.email ?? doctor.email ?? '',
//     password: '',
//     majorDoctor: doctor.doctorInfo?.majorDoctor ?? doctor.majorDoctor ?? 'DINH_DUONG',
//     status: doctor.status,
//     gender: doctor.gender ?? '',
//     birthYear: doctor.birthYear?.toString() ?? '',
//     degree: doctor.doctorInfo?.degree ?? 'THS',
//     academic: doctor.doctorInfo?.academic ?? '',
//     workplace: doctor.doctorInfo?.workplace ?? '',
//     department: doctor.doctorInfo?.department ?? '',
//     bio: doctor.doctorInfo?.bio ?? '',
//   }
// }
// 
// export function DoctorFormDialog({
//   mode,
//   doctor,
//   open,
//   onOpenChange,
// }: DoctorFormDialogProps) {
//   const createMutation = useCreateDoctorMutation()
//   const updateMutation = useUpdateDoctorMutation()
//   const [form, setForm] = useState<DoctorFormState>(() =>
//     mode === 'edit' ? createFormFromDoctor(doctor) : createEmptyForm()
//   )
// 
//   const activeMutation = mode === 'create' ? createMutation : updateMutation
//   const parsedBirthYear = form.birthYear ? Number(form.birthYear) : null
//   const isSubmitDisabled =
//     activeMutation.isPending ||
//     !form.fullName.trim() ||
//     !form.phoneNumber.trim() ||
//     !form.majorDoctor ||
//     !form.degree ||
//     (mode === 'create' && !form.password.trim())
// 
//   const handleSubmit = (event: FormEvent) => {
//     event.preventDefault()
// 
//     const payload = {
//       fullName: form.fullName.trim(),
//       phoneNumber: form.phoneNumber.trim(),
//       email: form.email.trim() || null,
//       password: form.password.trim() || undefined,
//       status: form.status,
//       gender: form.gender || null,
//       birthYear: parsedBirthYear,
//       doctorInfo: {
//         majorDoctor: form.majorDoctor || undefined,
//         degree: form.degree || undefined,
//         academic: form.academic || null,
//         workplace: form.workplace.trim() || null,
//         department: form.department.trim() || null,
//         bio: form.bio.trim() || null,
//       },
//     }
// 
//     if (mode === 'create') {
//       createMutation.mutate(
//         {
//           ...payload,
//           password: payload.password ?? '',
//           role: 'DOCTOR',
//         },
//         {
//           onSuccess: () => {
//             toast.success('Thêm bác sĩ thành công')
//             onOpenChange(false)
//             setForm(createEmptyForm())
//           },
//         }
//       )
// 
//       return
//     }
// 
//     if (!doctor) return
// 
//     updateMutation.mutate(
//       {
//         id: doctor.id,
//         ...payload,
//       },
//       {
//         onSuccess: () => {
//           toast.success('Cập nhật bác sĩ thành công')
//           onOpenChange(false)
//         },
//       }
//     )
//   }
// 
//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className='w-[calc(100vw-2rem)] max-h-[92vh] overflow-y-auto border-border/70 p-0 sm:max-w-4xl'>
//         <DialogHeader className='border-b bg-muted/30 px-6 py-5 text-start md:border-none md:bg-transparent md:p-6 md:pb-2'>
//           <DialogTitle className='font-manrope text-xl tracking-tight md:text-lg'>
//             {mode === 'create' ? 'Thêm bác sĩ mới' : 'Cập nhật bác sĩ'}
//           </DialogTitle>
//           <DialogDescription className='mt-1.5 max-w-2xl text-sm leading-6'>
//             {mode === 'create'
//               ? 'Tạo tài khoản và hồ sơ chuyên môn cho bác sĩ trong hệ thống.'
//               : `Cập nhật thông tin hành chính và chuyên môn cho ${doctor?.fullName ?? 'bác sĩ'}.`}
//           </DialogDescription>
//         </DialogHeader>
// 
//         <form id='doctor-form' onSubmit={handleSubmit} className='space-y-6 px-6 py-4'>
//           <div className='grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)]'>
//             <section className='space-y-5 rounded-[24px] border border-border/70 bg-card p-5 shadow-sm'>
//               <div>
//                 <h3 className='font-manrope text-base font-semibold'>Thông tin tài khoản</h3>
//                 <p className='mt-1 text-sm text-muted-foreground'>
//                   Dùng cho danh sách bác sĩ, đăng nhập và trạng thái hoạt động.
//                 </p>
//               </div>
// 
//               <div className='grid gap-4 md:grid-cols-2'>
//                 <div className='space-y-2 md:col-span-2'>
//                   <Label>
//                     Họ tên <span className='text-destructive'>*</span>
//                   </Label>
//                   <Input
//                     value={form.fullName}
//                     onChange={(event) =>
//                       setForm((previous) => ({ ...previous, fullName: event.target.value }))
//                     }
//                     placeholder='BS. Nguyễn Văn A'
//                     className='h-11 w-full rounded-xl'
//                     required
//                   />
//                 </div>
// 
//                 <div className='space-y-2'>
//                   <Label>
//                     Số điện thoại <span className='text-destructive'>*</span>
//                   </Label>
//                   <Input
//                     value={form.phoneNumber}
//                     onChange={(event) =>
//                       setForm((previous) => ({ ...previous, phoneNumber: event.target.value }))
//                     }
//                     placeholder='0912345678'
//                     className='h-11 w-full rounded-xl'
//                     required
//                   />
//                 </div>
// 
//                 <div className='space-y-2'>
//                   <Label>Email</Label>
//                   <Input
//                     type='email'
//                     value={form.email}
//                     onChange={(event) =>
//                       setForm((previous) => ({ ...previous, email: event.target.value }))
//                     }
//                     placeholder='doctor@sns.vn'
//                     className='h-11 w-full rounded-xl'
//                   />
//                 </div>
// 
//                 <div className='space-y-2'>
//                   <Combobox
//                     label='Chuyên môn *'
//                     value={form.majorDoctor}
//                     options={majorOptions.map((option) => ({
//                       id: option.value,
//                       label: option.label,
//                     }))}
//                     showAvatar={false}
//                     onChange={(value) =>
//                       setForm((previous) => ({
//                         ...previous,
//                         majorDoctor: (value as DoctorMajor) || '',
//                       }))
//                     }
//                   />
//                 </div>
// 
//                 <div className='space-y-2'>
//                   <Label>Trạng thái</Label>
//                   <Select
//                     value={form.status}
//                     onValueChange={(value) =>
//                       setForm((previous) => ({ ...previous, status: value as UserStatus }))
//                     }
//                   >
//                     <SelectTrigger className='h-11 w-full rounded-xl'>
//                       <SelectValue placeholder='Chọn trạng thái' />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {statusOptions.map((option) => (
//                         <SelectItem key={option.value} value={option.value}>
//                           {option.label}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
// 
//                 <div className='space-y-2'>
//                   <Label>Giới tính</Label>
//                   <Select
//                     value={form.gender || '__none__'}
//                     onValueChange={(value) =>
//                       setForm((previous) => ({
//                         ...previous,
//                         gender: value === '__none__' ? '' : (value as Gender),
//                       }))
//                     }
//                   >
//                     <SelectTrigger className='h-11 w-full rounded-xl'>
//                       <SelectValue placeholder='Chọn giới tính' />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value='__none__'>Chưa cập nhật</SelectItem>
//                       {genderOptions.map((option) => (
//                         <SelectItem key={option.value} value={option.value}>
//                           {option.label}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
// 
//                 <div className='space-y-2'>
//                   <Label>Năm sinh</Label>
//                   <Input
//                     type='number'
//                     value={form.birthYear}
//                     onChange={(event) =>
//                       setForm((previous) => ({ ...previous, birthYear: event.target.value }))
//                     }
//                     min={1900}
//                     max={new Date().getFullYear()}
//                     placeholder='1988'
//                     className='h-11 w-full rounded-xl'
//                   />
//                 </div>
// 
//                 <div className='space-y-2 md:col-span-2'>
//                   <Label>
//                     {mode === 'create' ? 'Mật khẩu' : 'Đổi mật khẩu'}
//                     {mode === 'create' ? <span className='text-destructive'> *</span> : null}
//                   </Label>
//                   <Input
//                     type='password'
//                     value={form.password}
//                     onChange={(event) =>
//                       setForm((previous) => ({ ...previous, password: event.target.value }))
//                     }
//                     minLength={6}
//                     placeholder={mode === 'create' ? 'Tối thiểu 6 ký tự' : 'Để trống nếu không thay đổi'}
//                     className='h-11 w-full rounded-xl'
//                     required={mode === 'create'}
//                   />
//                 </div>
//               </div>
//             </section>
// 
//             <section className='space-y-5 rounded-[24px] border border-border/70 bg-muted/20 p-5'>
//               <div>
//                 <h3 className='font-manrope text-base font-semibold'>Hồ sơ chuyên môn</h3>
//                 <p className='mt-1 text-sm text-muted-foreground'>
//                   Thông tin này được dùng để hiển thị hồ sơ và vận hành nội bộ.
//                 </p>
//               </div>
// 
//               <div className='grid gap-4 md:grid-cols-2'>
//                 <div className='space-y-2'>
//                   <Combobox
//                     label='Học vị *'
//                     value={form.degree}
//                     options={degreeOptions.map((option) => ({
//                       id: option.value,
//                       label: option.label,
//                     }))}
//                     showAvatar={false}
//                     onChange={(value) =>
//                       setForm((previous) => ({
//                         ...previous,
//                         degree: (value as DoctorDegree) || '',
//                       }))
//                     }
//                   />
//                 </div>
// 
//                 <div className='space-y-2'>
//                   <Combobox
//                     label='Học hàm'
//                     value={form.academic}
//                     options={academicOptions.map((option) => ({
//                       id: option.value,
//                       label: option.label,
//                     }))}
//                     showAvatar={false}
//                     onChange={(value) =>
//                       setForm((previous) => ({
//                         ...previous,
//                         academic: (value as DoctorAcademic) || '',
//                       }))
//                     }
//                   />
//                 </div>
// 
//                 <div className='space-y-2'>
//                   <Label>Nơi làm việc</Label>
//                   <Input
//                     value={form.workplace}
//                     onChange={(event) =>
//                       setForm((previous) => ({ ...previous, workplace: event.target.value }))
//                     }
//                     placeholder='Bệnh viện / phòng khám'
//                     className='h-11 w-full rounded-xl bg-background'
//                   />
//                 </div>
// 
//                 <div className='space-y-2'>
//                   <Label>Khoa / bộ phận</Label>
//                   <Input
//                     value={form.department}
//                     onChange={(event) =>
//                       setForm((previous) => ({ ...previous, department: event.target.value }))
//                     }
//                     placeholder='Khoa Tâm thần'
//                     className='h-11 w-full rounded-xl bg-background'
//                   />
//                 </div>
// 
//                 <div className='space-y-2 md:col-span-2'>
//                   <Label>Giới thiệu</Label>
//                   <Textarea
//                     value={form.bio}
//                     onChange={(event) =>
//                       setForm((previous) => ({ ...previous, bio: event.target.value }))
//                     }
//                     rows={5}
//                     placeholder='Mô tả kinh nghiệm, định hướng điều trị hoặc thế mạnh chuyên môn...'
//                     className='min-h-32 w-full rounded-2xl bg-background'
//                   />
//                 </div>
//               </div>
//             </section>
//           </div>
//           <DialogFooter className='border-t pt-5 sm:justify-end md:border-none md:p-0 md:pt-4'>
//             <Button
//               type='button'
//               variant='outline'
//               onClick={() => onOpenChange(false)}
//             >
//               Hủy
//             </Button>
//             <Button
//               type='submit'
//               disabled={isSubmitDisabled}
//             >
//               {activeMutation.isPending
//                 ? mode === 'create'
//                   ? 'Đang tạo...'
//                   : 'Đang lưu...'
//                 : mode === 'create'
//                   ? 'Tạo bác sĩ'
//                   : 'Lưu thay đổi'}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   )
// }
