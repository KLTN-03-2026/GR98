import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractData } from '@/client/lib/api-client';
import { categoryApi, type CategoryResponse, type CreateCategoryPayload } from '@/client/api/categories';

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCategoryPayload) => {
      const response = await categoryApi.create(data);
      return extractData<CategoryResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Đã tạo danh mục mới');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không tạo được danh mục');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateCategoryPayload>;
    }) => {
      const response = await categoryApi.update(id, data);
      return extractData<CategoryResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Đã cập nhật danh mục');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không cập nhật được danh mục');
    },
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orders: Array<{ id: string; sortOrder: number }>) => {
      await categoryApi.reorder(orders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Đã cập nhật thứ tự');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không cập nhật được thứ tự');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await categoryApi.delete(id);
      return extractData<{ id: string; deletedAt: string }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Đã xóa danh mục');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không xóa được danh mục');
    },
  });
}
