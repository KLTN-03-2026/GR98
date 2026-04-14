// import { useMutation, useQueryClient } from '@tanstack/react-query'
// import { toast } from 'sonner'
// import { handleServerError } from '@/shared/lib/handle-server-error'
// import { apiClient } from '@/shared/lib/api'
// 
// async function deleteDoctor(id: string) {
//   const response = await apiClient.delete(`/users/doctor/${id}`)
//   return response.data
// }
// 
// export function useDeleteDoctorMutation() {
//   const queryClient = useQueryClient()
// 
//   return useMutation({
//     mutationFn: deleteDoctor,
//     onSuccess: () => {
//       toast.success('Xóa bác sĩ thành công')
//       queryClient.invalidateQueries({ queryKey: ['doctor-list'] })
//       queryClient.invalidateQueries({ queryKey: ['users-doctor-list'] })
//     },
//     onError: handleServerError,
//   })
// }
