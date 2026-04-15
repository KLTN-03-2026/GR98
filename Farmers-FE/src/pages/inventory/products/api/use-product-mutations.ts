import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { inventoryProductApi, type CreateProductPayload } from './product-api';

export function useProductMutations() {
  const queryClient = useQueryClient();

  const createProduct = useMutation({
    mutationFn: (data: CreateProductPayload) => inventoryProductApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Đã tạo sản phẩm thành công');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể tạo sản phẩm');
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProductPayload> }) =>
      inventoryProductApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Đã cập nhật sản phẩm thành công');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể cập nhật sản phẩm');
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => inventoryProductApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Đã xóa sản phẩm thành công');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể xóa sản phẩm');
    },
  });

  return {
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
