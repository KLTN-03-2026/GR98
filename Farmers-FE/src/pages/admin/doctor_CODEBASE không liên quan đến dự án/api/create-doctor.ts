// import { useMutation, useQueryClient } from '@tanstack/react-query'
// import { handleServerError } from '@/shared/lib/handle-server-error'
// import { apiClient } from '@/shared/lib/api'
// import type { DoctorAcademic, DoctorDegree, DoctorInfo, DoctorMajor, DoctorListItem, Gender, UserStatus } from './get-doctor-list'
// 
// export interface CreateDoctorData {
//   phoneNumber?: string
//   email?: string | null
//   password: string
//   fullName: string
//   role?: 'DOCTOR' | 'PATIENT'
//   status?: UserStatus
//   gender?: Gender | null
//   birthYear?: number | null
//   doctorInfo?: Omit<DoctorInfo, 'id' | 'userId' | 'email'> & {
//     majorDoctor?: DoctorMajor | null
//     degree?: DoctorDegree | null
//     academic?: DoctorAcademic | null
//   }
// }
// 
// async function createDoctor(data: CreateDoctorData): Promise<DoctorListItem> {
//   const normalizedEmail =
//     typeof data.email === 'string' ? data.email.trim() || null : data.email
//   const response = await apiClient.post<DoctorListItem>('/users', {
//     ...data,
//     role: data.role ?? 'DOCTOR',
//     email: normalizedEmail,
//     doctorInfo: data.doctorInfo
//       ? {
//           ...data.doctorInfo,
//           email: normalizedEmail,
//         }
//       : undefined,
//   })
//   return response.data
// }
// 
// export function useCreateDoctorMutation() {
//   const queryClient = useQueryClient()
// 
//   return useMutation({
//     mutationFn: createDoctor,
//     meta: { skipGlobalErrorToast: true },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['doctor-list'] })
//       queryClient.invalidateQueries({ queryKey: ['users-doctor-list'] })
//     },
//     onError: handleServerError,
//   })
// }
