import { useQuery } from "@tanstack/react-query";
import { extractData } from "@/client/lib/api-client";
import { clientApi } from "./api";

export interface ShippingAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine: string;
  district: string | null;
  province: string;
  isDefault: boolean;
}

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
  shippingAddresses: ShippingAddress[];
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
