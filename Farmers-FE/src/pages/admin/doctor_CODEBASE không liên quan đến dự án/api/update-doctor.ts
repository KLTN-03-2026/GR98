// import { useMutation, useQueryClient } from '@tanstack/react-query'
// import { handleServerError } from '@/shared/lib/handle-server-error'
// import { apiClient } from '@/shared/lib/api'
// import type { DoctorAcademic, DoctorDegree, DoctorInfo, DoctorListItem, DoctorMajor, Gender, UserStatus } from './get-doctor-list'
// 
// export interface UpdateDoctorData {
//   id: string
//   phoneNumber?: string
//   fullName?: string
//   email?: string | null
//   password?: string
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
// async function updateDoctor(data: UpdateDoctorData): Promise<DoctorListItem> {
//   const { id, ...payload } = data
//   const normalizedEmail =
//     typeof payload.email === 'string' ? payload.email.trim() || null : payload.email
//   const response = await apiClient.patch<DoctorListItem>(`/users/doctor/${id}`, {
//     ...payload,
//     email: normalizedEmail,
//     doctorInfo: payload.doctorInfo
//       ? {
//           ...payload.doctorInfo,
//           email: normalizedEmail,
//         }
//       : undefined,
//   })
//   return response.data
// }
// 
// export function useUpdateDoctorMutation() {
//   const queryClient = useQueryClient()
// 
//   return useMutation({
//     mutationFn: updateDoctor,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['doctor-list'] })
//       queryClient.invalidateQueries({ queryKey: ['users-doctor-list'] })
//     },
//     onError: handleServerError,
//   })
// }
