import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryProductApi } from "./product-api";
import { extractData } from "@/client/lib/api-client";
import { toast } from "sonner";

export const useProductMutations = () => {
  const queryClient = useQueryClient();

  const createFromLotMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await inventoryProductApi.createFromLot(data);
      return extractData<any>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Niêm yết sản phẩm thành công!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi niêm yết");
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await inventoryProductApi.update(id, data);
      return extractData<any>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Cập nhật sản phẩm thành công!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật");
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await inventoryProductApi.delete(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Đã xóa sản phẩm (chuyển vào lưu trữ)");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xóa");
    }
  });

  return {
    createFromLot: createFromLotMutation,
    updateProduct: updateProductMutation,
    deleteProduct: deleteProductMutation
  };
};
