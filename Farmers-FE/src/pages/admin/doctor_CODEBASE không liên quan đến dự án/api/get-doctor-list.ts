// import { useQuery } from '@tanstack/react-query'
// import { apiClient } from '@/shared/lib/api'
// import { type UserRole } from '@/shared/types/auth'
// 
// export type DoctorMajor =
//   | 'DINH_DUONG'
//   | 'TAM_THAN'
//   | 'TL_PHCHUCNANG'
//   | 'NOI_KHOA'
//   | 'CG_UNGTHU'
// 
// export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
// 
// export type DoctorDegree = 'CU_NHAN' | 'BAC_SI' | 'THS' | 'TIEN_SY'
// 
// export type DoctorAcademic = 'PGS' | 'GS'
// 
// export type Gender = 'NAM' | 'NU'
// 
// export interface DoctorInfo {
//   id?: string
//   userId?: string
//   majorDoctor?: DoctorMajor | null
//   degree?: DoctorDegree | null
//   academic?: DoctorAcademic | null
//   bio?: string | null
//   workplace?: string | null
//   department?: string | null
//   email?: string | null
//   avatar?: string | null
//   bankAccountNumber?: string | null
//   bankName?: string | null
// }
// 
// export interface DoctorListItem {
//   id: string
//   phoneNumber: string | null
//   email: string | null
//   fullName: string
//   role: UserRole
//   status: UserStatus
//   majorDoctor?: DoctorMajor | null
//   gender?: Gender | null
//   birthYear?: number | null
//   lastLoginAt?: string | null
//   createdAt: string
//   updatedAt: string
//   doctorInfo?: DoctorInfo | null
//   patientCount?: number
// }
// 
// export type User = DoctorListItem
// 
// export interface DoctorListPagination {
//   currentPage: number
//   limit: number
//   total: number
//   totalPages: number
//   hasNextPage: boolean
//   hasPrevPage: boolean
// }
// 
// export interface DoctorListResponse {
//   data: DoctorListItem[]
//   pagination?: DoctorListPagination
// }
// 
// type DoctorListPayload = {
//   data: DoctorListItem[]
//   pagination?: DoctorListPagination
// }
// 
// type DoctorListEnvelope = {
//   data: DoctorListPayload
// }
// 
// export type DoctorListSortOrder = 'ASC' | 'DESC'
// 
// export interface DoctorListQueryParams {
//   page?: number
//   limit?: number
//   sortBy?: string
//   sortOrder?: DoctorListSortOrder
//   search?: string
//   majorDoctor?: DoctorMajor
//   status?: UserStatus
//   degree?: DoctorDegree
// }
// 
// async function getDoctorList(
//   params: DoctorListQueryParams
// ): Promise<DoctorListResponse> {
//   const response = await apiClient.get('/users/doctor-list/paginated', { params })
//   const raw = response.data
// 
//   // Trường hợp BE trả về mảng thuần (kiểu cũ)
//   if (Array.isArray(raw)) {
//     const page = params.page ?? 1
//     const limit = params.limit ?? raw.length
//     const total = raw.length
//     const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1
//     const start = Math.max(0, (page - 1) * limit)
//     const end = start + limit
// 
//     return {
//       data: (raw as DoctorListItem[]).slice(start, end),
//       pagination: {
//         currentPage: page,
//         limit,
//         total,
//         totalPages,
//         hasNextPage: page < totalPages,
//         hasPrevPage: page > 1,
//       },
//     }
//   }
// 
//   // Trường hợp BE trả về đúng { data: User[], pagination }
//   if (raw && typeof raw === 'object') {
//     const rawPayload = raw as Partial<DoctorListPayload>
//     if (Array.isArray(rawPayload.data)) {
//       return {
//         data: rawPayload.data,
//         pagination: rawPayload.pagination,
//       }
//     }
//   }
// 
//   // Trường hợp BE bọc thêm 1 lớp: { data: { data: User[], pagination } }
//   if (raw && typeof raw === 'object') {
//     const envelope = raw as Partial<DoctorListEnvelope>
//     const innerPayload = envelope.data
//     if (
//       innerPayload &&
//       typeof innerPayload === 'object' &&
//       Array.isArray((innerPayload as DoctorListPayload).data)
//     ) {
//       const typedPayload = innerPayload as DoctorListPayload
// 
//       return {
//         data: typedPayload.data,
//         pagination: typedPayload.pagination,
//       }
//     }
//   }
// 
//   return { data: [], pagination: undefined }
// }
// 
// export function useGetDoctorListQuery(params: DoctorListQueryParams) {
//   return useQuery({
//     queryKey: ['doctor-list', params],
//     queryFn: () => getDoctorList(params),
//     staleTime: 60 * 1000,
//     placeholderData: (previousData) => previousData,
//   })
// }
