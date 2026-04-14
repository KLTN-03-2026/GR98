// import { useDeferredValue, useMemo, useState } from 'react'
// import {
//   CalendarClock,
//   Eye,
//   Mail,
//   MessagesSquare,
//   MoreHorizontal,
//   PencilLine,
//   Phone,
//   Plus,
//   RefreshCcw,
//   Search,
//   ShieldCheck,
//   SlidersHorizontal,
//   Stethoscope,
//   Trash2,
//   UserRound,
//   Users,
//   type LucideIcon,
// } from 'lucide-react'
// import { Link } from '@tanstack/react-router'
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from '@/shared/components/ui/alert-dialog'
// import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
// import { Badge } from '@/shared/components/ui/badge'
// import { Button } from '@/shared/components/ui/button'
// import { Card, CardContent } from '@/shared/components/ui/card'
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/shared/components/ui/dropdown-menu'
// import { Input } from '@/shared/components/ui/input'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/shared/components/ui/select'
// import { Combobox } from '@/shared/components/ui/combobox'
// import { Skeleton } from '@/shared/components/ui/skeleton'
// import { Header } from '@/shared/components/layout/header'
// import { Main } from '@/shared/components/layout/main'
// import { PageBreadcrumb } from '@/shared/components/layout/page-breadcrumb'
// import { ProfileDropdown } from '@/shared/components/profile-dropdown'
// import { ThemeSwitch } from '@/shared/components/theme-switch'
// import { cn, getPageNumbers } from '@/shared/lib/utils'
// import { useAuthStore } from '@/shared/stores/auth-store'
// import { UserRole } from '@/shared/types/auth'
// import {
//   useDeleteDoctorMutation,
//   useGetDoctorListQuery,
//   type DoctorAcademic,
//   type DoctorDegree,
//   type DoctorListItem,
//   type DoctorMajor,
//   type Gender,
//   type UserStatus,
// } from './api'
// import { DoctorFormDialog } from './components/doctor-form-dialog'
// import { DoctorsScheduleDialog } from './components/doctors-schedule-dialog'
// import { DoctorsScheduleListDialog } from './components/doctors-schedule-list-dialog'
// 
// const statusMap: Record<UserStatus, { label: string; className: string }> = {
//   ACTIVE: {
//     label: 'Hoạt động',
//     className:
//       'border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300',
//   },
//   INACTIVE: {
//     label: 'Tạm ngừng',
//     className:
//       'border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:text-amber-300',
//   },
//   BLOCKED: {
//     label: 'Đã khóa',
//     className:
//       'border-rose-200 bg-rose-500/10 text-rose-700 dark:border-rose-500/30 dark:text-rose-300',
//   },
// }
// 
// const majorMap: Record<DoctorMajor, string> = {
//   DINH_DUONG: 'Dinh dưỡng',
//   TAM_THAN: 'Tâm thần',
//   TL_PHCHUCNANG: 'Tâm lý - PHCN',
//   NOI_KHOA: 'Nội khoa',
//   CG_UNGTHU: 'Chăm sóc ung thư',
// }
// 
// const degreeMap: Record<DoctorDegree, string> = {
//   CU_NHAN: 'Cử nhân',
//   BAC_SI: 'Bác sĩ',
//   THS: 'ThS',
//   TIEN_SY: 'Tiến sĩ',
// }
// 
// const academicMap: Record<DoctorAcademic, string> = {
//   PGS: 'PGS',
//   GS: 'GS',
// }
// 
// const genderMap: Record<Gender, string> = {
//   NAM: 'Nam',
//   NU: 'Nữ',
// }
// 
// const pageSizeOptions = ['12', '24', '36']
// 
// export function AdminDoctors() {
//   const role = useAuthStore((s) => s.auth.role)
//   const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN
//   
//   const [searchValue, setSearchValue] = useState('')
//   const deferredSearch = useDeferredValue(searchValue.trim())
//   const [page, setPage] = useState(1)
//   const [pageSize, setPageSize] = useState('12')
//   const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL')
//   const [majorFilter, setMajorFilter] = useState<'ALL' | DoctorMajor>('ALL')
//   const [degreeFilter, setDegreeFilter] = useState<'ALL' | DoctorDegree>('ALL')
//   const [createOpen, setCreateOpen] = useState(false)
//   const [editingDoctor, setEditingDoctor] = useState<DoctorListItem | null>(null)
//   const [deleteDoctorId, setDeleteDoctorId] = useState<string | null>(null)
//   const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
//   const [scheduleDoctorId, setScheduleDoctorId] = useState<string | null>(null)
//   const [scheduleListOpen, setScheduleListOpen] = useState(false)
//   const [scheduleListDoctor, setScheduleListDoctor] = useState<DoctorListItem | null>(null)
// 
//   const doctorQuery = useMemo(
//     () => ({
//       page,
//       limit: Number(pageSize),
//       search: deferredSearch || undefined,
//       sortBy: 'createdAt' as const,
//       sortOrder: 'DESC' as const,
//       majorDoctor: majorFilter !== 'ALL' ? majorFilter : undefined,
//       status: statusFilter !== 'ALL' ? statusFilter : undefined,
//       degree: degreeFilter !== 'ALL' ? degreeFilter : undefined,
//     }),
//     [deferredSearch, degreeFilter, majorFilter, page, pageSize, statusFilter]
//   )
// 
//   const { data, isLoading } = useGetDoctorListQuery(doctorQuery)
//   const deleteMutation = useDeleteDoctorMutation()
// 
//   const doctors = data?.data ?? []
//   const pagination = data?.pagination
//   const activeFilterCount = [
//     deferredSearch ? 'search' : null,
//     majorFilter !== 'ALL' ? 'major' : null,
//     degreeFilter !== 'ALL' ? 'degree' : null,
//     statusFilter !== 'ALL' ? 'status' : null,
//   ].filter(Boolean).length
//   const paginationItems = pagination
//     ? getPageNumbers(pagination.currentPage, pagination.totalPages)
//     : []
// 
//   const handleOpenScheduleDialog = (doctorId: string) => {
//     setScheduleDoctorId(doctorId)
//     setScheduleDialogOpen(true)
//   }
// 
//   const handleOpenScheduleListDialog = (doctor: DoctorListItem) => {
//     setScheduleListDoctor(doctor)
//     setScheduleListOpen(true)
//   }
// 
//   const handleDelete = () => {
//     if (!deleteDoctorId) return
//     deleteMutation.mutate(deleteDoctorId, {
//       onSuccess: () => setDeleteDoctorId(null),
//     })
//   }
// 
//   const resetFilters = () => {
//     setSearchValue('')
//     setStatusFilter('ALL')
//     setMajorFilter('ALL')
//     setDegreeFilter('ALL')
//     setPage(1)
//   }
// 
//   return (
//     <>
//       <Header fixed>
//         <PageBreadcrumb />
//         <div className='ms-auto flex items-center space-x-4'>
//           <ThemeSwitch />
//           <ProfileDropdown />
//         </div>
//       </Header>
// 
//       <Main fixed className='overflow-y-auto overflow-x-hidden px-4 py-6 md:px-6'>
//         <section className='relative -mx-1 mb-4 h-fit shrink-0 overflow-hidden rounded-[22px] border border-primary/10 bg-[linear-gradient(180deg,rgba(247,251,252,0.92),rgba(244,248,250,0.82))] px-1 py-1.5 shadow-[0_10px_24px_-24px_rgba(16,24,40,0.22)] backdrop-blur-md dark:bg-[linear-gradient(180deg,rgba(13,20,30,0.94),rgba(10,18,26,0.86))]'>
//           <div className='pointer-events-none absolute inset-x-20 top-0 h-12 rounded-full bg-primary/8 blur-3xl' />
// 
//           <div className='relative h-fit shrink-0 rounded-[20px] border border-primary/10 bg-background/72 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]'>
//             <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
//               <div className='min-w-0'>
//                 <div className='flex items-center gap-2'>
//                   <div className='flex size-7 items-center justify-center rounded-xl border border-primary/12 bg-primary/8'>
//                     <SlidersHorizontal className='size-3.5 text-primary' />
//                   </div>
//                   <h2 className='font-manrope text-lg font-semibold tracking-tight text-foreground'>
//                     Quản lý bác sĩ
//                   </h2>
//                 </div>
//                 <p className='mt-1 text-xs text-muted-foreground'>
//                   {activeFilterCount > 0
//                     ? `${activeFilterCount} bộ lọc đang hoạt động`
//                     : `${pagination?.total ?? 0} hồ sơ bác sĩ trong danh sách hiện tại`}
//                 </p>
//               </div>
// 
//               <div className='flex items-center gap-2'>
//                 <Button
//                   variant='outline'
//                   className='h-8 rounded-full border-primary/12 bg-background/75 px-3 text-[11px]'
//                   onClick={resetFilters}
//                 >
//                   <RefreshCcw className='size-3.5' />
//                   Xóa lọc
//                 </Button>
//                 <Button
//                   className='h-8 gap-1.5 rounded-full px-3 text-[11px]'
//                   onClick={() => setCreateOpen(true)}
//                 >
//                   <Plus className='size-3.5' />
//                   Thêm bác sĩ
//                 </Button>
//               </div>
//             </div>
// 
//             <div className='grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(0,1.7fr)_repeat(4,minmax(0,0.78fr))]'>
//               <div className='relative'>
//                 <Search className='pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
//                 <Input
//                   value={searchValue}
//                   onChange={(event) => {
//                     setSearchValue(event.target.value)
//                     setPage(1)
//                   }}
//                   placeholder='Tìm theo tên, SĐT, email hoặc nơi làm việc...'
//                   className='h-9 rounded-xl border-primary/12 bg-background/82 pl-9 text-sm shadow-none focus-visible:border-primary/30 focus-visible:ring-primary/12'
//                 />
//               </div>
// 
//               <Combobox
//                 label='Chuyên môn'
//                 showLabel={false}
//                 value={majorFilter}
//                 onChange={(value) => {
//                   setMajorFilter(value as 'ALL' | DoctorMajor)
//                   setPage(1)
//                 }}
//                 options={[
//                   { id: 'ALL', label: 'Tất cả chuyên môn' },
//                   ...Object.entries(majorMap).map(([value, label]) => ({ id: value, label })),
//                 ]}
//                 placeholder='Tất cả chuyên môn'
//                 searchPlaceholder='Tìm chuyên môn...'
//                 showAvatar={false}
//               />
// 
//               <Combobox
//                 label='Học vị'
//                 showLabel={false}
//                 value={degreeFilter}
//                 onChange={(value) => {
//                   setDegreeFilter(value as 'ALL' | DoctorDegree)
//                   setPage(1)
//                 }}
//                 options={[
//                   { id: 'ALL', label: 'Tất cả học vị' },
//                   ...Object.entries(degreeMap).map(([value, label]) => ({ id: value, label })),
//                 ]}
//                 placeholder='Tất cả học vị'
//                 searchPlaceholder='Tìm học vị...'
//                 showAvatar={false}
//               />
// 
//               <Combobox
//                 label='Trạng thái'
//                 showLabel={false}
//                 value={statusFilter}
//                 onChange={(value) => {
//                   setStatusFilter(value as 'ALL' | UserStatus)
//                   setPage(1)
//                 }}
//                 options={[
//                   { id: 'ALL', label: 'Tất cả trạng thái' },
//                   ...Object.entries(statusMap).map(([value, meta]) => ({ id: value, label: meta.label })),
//                 ]}
//                 placeholder='Tất cả trạng thái'
//                 searchPlaceholder='Tìm trạng thái...'
//                 showAvatar={false}
//               />
// 
//               <Select
//                 value={pageSize}
//                 onValueChange={(value) => {
//                   setPageSize(value)
//                   setPage(1)
//                 }}
//               >
//                 <SelectTrigger className='h-9 w-full rounded-xl border-primary/12 bg-background/82 text-sm shadow-none focus-visible:border-primary/30 focus-visible:ring-primary/12'>
//                   <SelectValue placeholder='Số thẻ / trang' />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {pageSizeOptions.map((option) => (
//                     <SelectItem key={option} value={option}>
//                       {option} thẻ / trang
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//         </section>
// 
//         <section className='mt-2'>
//           {isLoading ? (
//             <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
//               {Array.from({ length: Number(pageSize) }).map((_, index) => (
//                 <DoctorCardSkeleton key={index} />
//               ))}
//             </div>
//           ) : doctors.length === 0 ? (
//             <Card className='rounded-[28px] border border-dashed border-border/80 bg-card/60 py-0'>
//               <CardContent className='flex flex-col items-center px-6 py-16 text-center'>
//                 <div className='flex size-16 items-center justify-center rounded-full border border-dashed border-primary/20 bg-primary/5'>
//                   <Users className='size-7 text-primary' />
//                 </div>
//                 <h3 className='mt-5 font-manrope text-xl font-semibold'>
//                   Không tìm thấy bác sĩ phù hợp
//                 </h3>
//                 <p className='mt-2 max-w-md text-sm leading-6 text-muted-foreground'>
//                   Hãy thử nới bộ lọc, đổi từ khóa tìm kiếm hoặc tạo hồ sơ bác sĩ mới nếu đây là nhân sự vừa được bổ sung.
//                 </p>
//                 <div className='mt-6 flex flex-wrap items-center justify-center gap-3'>
//                   <Button variant='outline' className='rounded-full' onClick={resetFilters}>
//                     <RefreshCcw className='size-4' />
//                     Làm mới bộ lọc
//                   </Button>
//                   <Button className='rounded-full' onClick={() => setCreateOpen(true)}>
//                     <Plus className='size-4' />
//                     Thêm bác sĩ
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           ) : (
//             <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
//               {doctors.map((doctor) => {
//                 const doctorStatus = statusMap[doctor.status]
//                 const doctorEmail = doctor.doctorInfo?.email ?? doctor.email ?? 'Chưa cập nhật'
//                 const doctorMajorValue = doctor.doctorInfo?.majorDoctor ?? doctor.majorDoctor
//                 const doctorMajor = doctorMajorValue ? majorMap[doctorMajorValue] : 'Chưa gán chuyên môn'
//                 const doctorAvatar = doctor.doctorInfo?.avatar ?? undefined
//                 const doctorAcademic = doctor.doctorInfo?.academic
//                   ? academicMap[doctor.doctorInfo.academic]
//                   : null
//                 const doctorDegreeLabel = doctor.doctorInfo?.degree
//                   ? degreeMap[doctor.doctorInfo.degree]
//                   : null
//                 const doctorDegree = [doctorAcademic, doctorDegreeLabel].filter(Boolean).join('. ') || 'Chưa cập nhật học vị'
//                 const age = getDoctorAge(doctor.birthYear ?? null)
// 
//                 return (
//                   <Card
//                     key={doctor.id}
//                     className='group flex h-full flex-col overflow-hidden rounded-[20px] border border-border/70 bg-card/85 py-0 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md'
//                   >
//                     <CardContent className='flex flex-1 flex-col p-3.5'>
//                       <div className='flex items-start justify-between gap-2.5'>
//                         <button
//                           type='button'
//                           className='flex min-w-0 flex-1 items-start gap-2.5 text-left'
//                           onClick={() => setEditingDoctor(doctor)}
//                         >
//                           <Avatar className='size-10 rounded-[14px] border border-primary/15 bg-primary/5 text-primary'>
//                             <AvatarImage src={doctorAvatar} alt={doctor.fullName} className='rounded-[14px] object-cover' />
//                             <AvatarFallback className='rounded-[14px] bg-primary/10 text-[11px] font-semibold text-primary'>
//                               {getInitials(doctor.fullName)}
//                             </AvatarFallback>
//                           </Avatar>
// 
//                           <div className='min-w-0 flex-1'>
//                             <div className='flex flex-wrap items-center gap-2'>
//                               <h3 className='truncate font-manrope text-sm font-semibold'>
//                                 {doctor.fullName}
//                               </h3>
//                               <Badge
//                                 variant='outline'
//                                 className={cn(
//                                   'rounded-full px-1.5 py-0.5 text-[8px] tracking-[0.12em]',
//                                   doctorStatus.className
//                                 )}
//                               >
//                                 {doctorStatus.label}
//                               </Badge>
//                             </div>
//                             <div className='mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground'>
//                               <InfoPill icon={ShieldCheck} label={doctorDegree} />
//                               <InfoPill icon={Stethoscope} label={doctorMajor} />
//                               <InfoPill
//                                 icon={UserRound}
//                                 label={
//                                   doctor.gender
//                                     ? `${genderMap[doctor.gender]}${age ? `, ${age} tuổi` : ''}`
//                                     : age
//                                       ? `${age} tuổi`
//                                       : 'Chưa rõ nhân khẩu'
//                                 }
//                               />
//                             </div>
//                           </div>
//                         </button>
// 
//                         <DropdownMenu>
//                           <DropdownMenuTrigger asChild>
//                             <Button variant='ghost' size='icon' className='size-7 rounded-full'>
//                               <MoreHorizontal className='size-3.5' />
//                             </Button>
//                           </DropdownMenuTrigger>
//                           <DropdownMenuContent align='end' className='w-52'>
//                             <DropdownMenuItem onClick={() => setEditingDoctor(doctor)}>
//                               <PencilLine className='size-4' />
//                               Chỉnh sửa hồ sơ
//                             </DropdownMenuItem>
//                             <DropdownMenuItem onClick={() => handleOpenScheduleListDialog(doctor)}>
//                               <Eye className='size-4' />
//                               Xem lịch rảnh
//                             </DropdownMenuItem>
//                             {isAdmin && (
//                               <DropdownMenuItem asChild>
//                                 <Link
//                                   to="/dashboard/admin/retrieve-messages/$id"
//                                   params={{ id: doctor.id }}
//                                 >
//                                   <MessagesSquare className='size-4' />
//                                   Truy xuất tin nhắn
//                                 </Link>
//                               </DropdownMenuItem>
//                             )}
//                             <DropdownMenuItem onClick={() => handleOpenScheduleDialog(doctor.id)}>
//                               <CalendarClock className='size-4' />
//                               Tạo lịch rảnh
//                             </DropdownMenuItem>
//                             <DropdownMenuSeparator />
//                             <DropdownMenuItem
//                               className='text-destructive focus:text-destructive'
//                               onClick={() => setDeleteDoctorId(doctor.id)}
//                             >
//                               <Trash2 className='size-4' />
//                               Xóa bác sĩ
//                             </DropdownMenuItem>
//                           </DropdownMenuContent>
//                         </DropdownMenu>
//                       </div>
// 
//                       <div className='mt-3 grid gap-2'>
//                         <ContactItem icon={Phone} label='Số điện thoại' value={doctor.phoneNumber ?? 'Chưa cập nhật'} />
//                         <ContactItem icon={Mail} label='Email' value={doctorEmail} />
//                       </div>
// 
//                       <div className='mt-3 rounded-[16px] border border-border/70 bg-muted/45 p-2.5'>
//                         <div className='flex items-center justify-between gap-3'>
//                           <div className='min-w-0'>
//                             <p className='text-[9px] uppercase tracking-[0.14em] text-muted-foreground'>
//                               Hồ sơ chuyên môn
//                             </p>
//                             <p className='mt-1 truncate text-[13px] font-medium'>
//                               {doctor.doctorInfo?.workplace ?? 'Chưa cập nhật nơi làm việc'}
//                             </p>
//                           </div>
//                           <div className='flex size-7 items-center justify-center rounded-[12px] bg-background/85 shadow-sm dark:bg-background/35'>
//                             <Stethoscope className='size-3 text-primary' />
//                           </div>
//                         </div>
// 
//                         <div className='mt-2.5 grid gap-1 text-[12px] text-muted-foreground'>
//                           <div className='flex items-center justify-between gap-3'>
//                             <span>Khoa / bộ phận</span>
//                             <span className='truncate text-right text-foreground/80'>
//                               {doctor.doctorInfo?.department ?? 'Chưa cập nhật'}
//                             </span>
//                           </div>
//                           <div className='flex items-center justify-between gap-3'>
//                             <span>Bệnh nhân phụ trách</span>
//                             <span className='text-right text-foreground/80'>
//                               {doctor.patientCount ?? 0} bệnh nhân
//                             </span>
//                           </div>
//                           <div className='flex items-center justify-between gap-3'>
//                             <span>Ngày tạo hồ sơ</span>
//                             <span className='text-right text-foreground/80'>
//                               {formatDate(doctor.createdAt)}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
// 
//                       <div className='mt-auto flex flex-wrap items-center gap-1.5 pt-3'>
//                         <Button
//                           className='h-8 flex-1 rounded-full px-2.5 text-[11px]'
//                           onClick={() => setEditingDoctor(doctor)}
//                         >
//                           Chỉnh sửa
//                           <PencilLine className='size-4' />
//                         </Button>
//                         <Button
//                           variant='outline'
//                           className='h-8 rounded-full px-2.5 text-[11px]'
//                           onClick={() => setDeleteDoctorId(doctor.id)}
//                         >
//                           <Trash2 className='size-3.5' />
//                           Xóa
//                         </Button>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 )
//               })}
//             </div>
//           )}
//         </section>
// 
//         {pagination && pagination.totalPages > 1 ? (
//           <section className='mt-6 rounded-[28px] border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm'>
//             <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
//               <div className='text-sm text-muted-foreground'>
//                 Hiển thị{' '}
//                 <span className='font-semibold text-foreground'>
//                   {Math.max((pagination.currentPage - 1) * pagination.limit + 1, 1)}
//                   {' - '}
//                   {Math.min(pagination.currentPage * pagination.limit, pagination.total)}
//                 </span>{' '}
//                 trên tổng{' '}
//                 <span className='font-semibold text-foreground'>{pagination.total}</span> bác sĩ.
//               </div>
// 
//               <div className='flex flex-wrap items-center gap-2'>
//                 <Button
//                   variant='outline'
//                   className='rounded-full'
//                   disabled={!pagination.hasPrevPage}
//                   onClick={() => setPage((currentPage) => currentPage - 1)}
//                 >
//                   Trước
//                 </Button>
// 
//                 <div className='flex flex-wrap items-center gap-2'>
//                   {paginationItems.map((item, index) =>
//                     item === '...' ? (
//                       <span key={`ellipsis-${index}`} className='px-2 text-sm text-muted-foreground'>
//                         ...
//                       </span>
//                     ) : (
//                       <Button
//                         key={item}
//                         variant={item === pagination.currentPage ? 'default' : 'outline'}
//                         className='min-w-10 rounded-full px-3'
//                         onClick={() => setPage(Number(item))}
//                       >
//                         {item}
//                       </Button>
//                     )
//                   )}
//                 </div>
// 
//                 <Button
//                   variant='outline'
//                   className='rounded-full'
//                   disabled={!pagination.hasNextPage}
//                   onClick={() => setPage((currentPage) => currentPage + 1)}
//                 >
//                   Sau
//                 </Button>
//               </div>
//             </div>
//           </section>
//         ) : null}
//       </Main>
// 
//       <DoctorFormDialog
//         key={createOpen ? 'doctor-create-open' : 'doctor-create-closed'}
//         mode='create'
//         open={createOpen}
//         onOpenChange={setCreateOpen}
//       />
// 
//       <DoctorFormDialog
//         key={editingDoctor ? `${editingDoctor.id}-open` : 'doctor-edit-closed'}
//         mode='edit'
//         doctor={editingDoctor}
//         open={!!editingDoctor}
//         onOpenChange={(open) => !open && setEditingDoctor(null)}
//       />
// 
//       <DoctorsScheduleDialog
//         open={scheduleDialogOpen}
//         onOpenChange={(open) => {
//           if (!open) {
//             setScheduleDoctorId(null)
//           }
//           setScheduleDialogOpen(open)
//         }}
//         doctors={doctors}
//         defaultDoctorId={scheduleDoctorId}
//       />
// 
//       <DoctorsScheduleListDialog
//         open={scheduleListOpen}
//         onOpenChange={(open) => {
//           if (!open) {
//             setScheduleListDoctor(null)
//           }
//           setScheduleListOpen(open)
//         }}
//         doctor={scheduleListDoctor}
//       />
// 
//       <AlertDialog
//         open={!!deleteDoctorId}
//         onOpenChange={(open) => !open && setDeleteDoctorId(null)}
//       >
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Xóa bác sĩ?</AlertDialogTitle>
//             <AlertDialogDescription>
//               Hành động này sẽ xóa tài khoản bác sĩ khỏi hệ thống quản trị. Nếu chắc chắn, hãy xác nhận để tiếp tục.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Hủy</AlertDialogCancel>
//             <AlertDialogAction
//               className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
//               onClick={handleDelete}
//             >
//               Xóa bác sĩ
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </>
//   )
// }
// 
// function InfoPill({
//   icon: Icon,
//   label,
// }: {
//   icon?: LucideIcon
//   label: string
// }) {
//   return (
//     <span className='inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/80 px-1.5 py-0.5'>
//       {Icon ? <Icon className='size-2.5' /> : null}
//       {label}
//     </span>
//   )
// }
// 
// function ContactItem({
//   icon: Icon,
//   label,
//   value,
// }: {
//   icon: LucideIcon
//   label: string
//   value: string
// }) {
//   return (
//     <div className='rounded-[14px] border border-border/70 bg-background/70 p-2'>
//       <div className='mb-1 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-muted-foreground'>
//         <Icon className='size-3' />
//         {label}
//       </div>
//       <p className='line-clamp-2 text-[12px] font-medium leading-4'>{value}</p>
//     </div>
//   )
// }
// 
// function DoctorCardSkeleton() {
//   return (
//     <Card className='rounded-[20px] border border-border/70 py-0'>
//       <CardContent className='space-y-3 p-3.5'>
//         <div className='flex items-start gap-2.5'>
//           <Skeleton className='size-10 rounded-[14px]' />
//           <div className='flex-1 space-y-2'>
//             <Skeleton className='h-4 w-2/3' />
//             <Skeleton className='h-3 w-1/2' />
//           </div>
//         </div>
// 
//         <Skeleton className='h-14 rounded-[14px]' />
//         <Skeleton className='h-14 rounded-[14px]' />
//         <Skeleton className='h-24 rounded-[16px]' />
// 
//         <div className='flex gap-2'>
//           <Skeleton className='h-8 flex-1 rounded-full' />
//           <Skeleton className='h-8 w-20 rounded-full' />
//         </div>
//       </CardContent>
//     </Card>
//   )
// }
// 
// function getInitials(fullName: string) {
//   return fullName
//     .trim()
//     .split(/\s+/)
//     .slice(0, 2)
//     .map((part) => part[0]?.toUpperCase() ?? '')
//     .join('')
// }
// 
// function getDoctorAge(birthYear: number | null) {
//   if (!birthYear) return null
//   return new Date().getFullYear() - birthYear
// }
// 
// function formatDate(value?: string | null) {
//   if (!value) return 'Chưa cập nhật'
//   return new Date(value).toLocaleDateString('vi-VN', {
//     day: '2-digit',
//     month: '2-digit',
//     year: 'numeric',
//   })
// }
