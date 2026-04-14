// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
// import { toast } from 'sonner'
// import { handleServerError } from '@/shared/lib/handle-server-error'
// import { apiClient } from '@/shared/lib/api'
// 
// export interface CreateDoctorScheduleData {
//   userId: string
//   startDate: string
//   endDate: string
// }
// 
// export interface DoctorSchedule {
//   id: string
//   userId: string
//   status: 'FREE' | 'BOOKED'
//   startDate: string
//   endDate: string
// }
// 
// export interface DoctorSchedulesResponse {
//   data: DoctorSchedule[]
// }
// 
// export interface UpdateDoctorScheduleData {
//   startDate: string
//   endDate: string
// }
// 
// interface SingleDoctorScheduleResponse {
//   data: DoctorSchedule
// }
// 
// async function createDoctorSchedule(data: CreateDoctorScheduleData): Promise<DoctorSchedule> {
//   const response = await apiClient.post<SingleDoctorScheduleResponse | DoctorSchedule>('/doctor-schedules', data)
//   const payload = response.data
// 
//   if ('data' in (payload as SingleDoctorScheduleResponse)) {
//     return (payload as SingleDoctorScheduleResponse).data
//   }
// 
//   return payload as DoctorSchedule
// }
// 
// async function getDoctorSchedulesByUserId(userId: string): Promise<DoctorSchedule[]> {
//   const response = await apiClient.get<DoctorSchedulesResponse | DoctorSchedule[]>(
//     `/doctor-schedules/user/${userId}`
//   )
//   const payload = response.data
// 
//   if (Array.isArray(payload)) return payload
//   return payload.data
// }
// 
// async function updateDoctorSchedule(params: {
//   id: string
//   data: UpdateDoctorScheduleData
// }): Promise<DoctorSchedule> {
//   const response = await apiClient.patch<SingleDoctorScheduleResponse | DoctorSchedule>(
//     `/doctor-schedules/${params.id}`,
//     params.data
//   )
//   const payload = response.data
// 
//   if ('data' in (payload as SingleDoctorScheduleResponse)) {
//     return (payload as SingleDoctorScheduleResponse).data
//   }
// 
//   return payload as DoctorSchedule
// }
// 
// async function deleteDoctorSchedule(id: string): Promise<void> {
//   await apiClient.delete(`/doctor-schedules/${id}`)
// }
// 
// export function useCreateDoctorScheduleMutation() {
//   const queryClient = useQueryClient()
// 
//   return useMutation({
//     mutationFn: createDoctorSchedule,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['doctor-schedules'] })
//     },
//     onError: handleServerError,
//   })
// }
// 
// export function useDoctorSchedulesByUserIdQuery(userId: string | null) {
//   return useQuery({
//     queryKey: ['doctor-schedules', userId],
//     queryFn: () => {
//       if (!userId) return Promise.resolve<DoctorSchedule[]>([])
//       return getDoctorSchedulesByUserId(userId)
//     },
//     enabled: !!userId,
//     staleTime: 30 * 1000,
//   })
// }
// 
// export function useUpdateDoctorScheduleMutation() {
//   const queryClient = useQueryClient()
// 
//   return useMutation({
//     mutationFn: updateDoctorSchedule,
//     onSuccess: () => {
//       toast.success('Cập nhật lịch rảnh thành công.')
//       queryClient.invalidateQueries({ queryKey: ['doctor-schedules'] })
//     },
//     onError: handleServerError,
//   })
// }
// 
// export function useDeleteDoctorScheduleMutation() {
//   const queryClient = useQueryClient()
// 
//   return useMutation({
//     mutationFn: deleteDoctorSchedule,
//     onSuccess: () => {
//       toast.success('Xóa lịch rảnh thành công.')
//       queryClient.invalidateQueries({ queryKey: ['doctor-schedules'] })
//     },
//     onError: handleServerError,
//   })
// }
// 
// 
