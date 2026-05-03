import { useQuery } from "@tanstack/react-query";
import { extractData } from "@/client/lib/api-client";
import { clientApi } from "./api";

export interface Client {
  id: string;
  userId: string;
  adminId: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    status: string;
    createdAt: string;
  };
  _count: {
    orders: number;
  };
}

export const useGetInventoryClients = () => {
  return useQuery<Client[]>({
    queryKey: ["inventory-clients"],
    queryFn: async () => {
      const response = await clientApi.getClients();
      return extractData<Client[]>(response);
    },
  });
};
