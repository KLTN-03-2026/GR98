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

  return {
    createFromLot: createFromLotMutation
  };
};
