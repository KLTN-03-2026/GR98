/** Payload `user` từ POST /auth/login và /auth/register */
export interface AuthUserResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: 'ADMIN' | 'SUPERVISOR' | 'INVENTORY' | 'CLIENT';
  profileId: string | null;
  adminId: string | null;
}

/** GET /auth/me — đầy đủ profile + địa chỉ (khớp AuthService.getMe) */
export interface MeResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  role: 'ADMIN' | 'SUPERVISOR' | 'INVENTORY' | 'CLIENT';
  createdAt: string;
  adminProfile: {
    id: string;
    businessName: string;
    province: string;
    taxCode: string | null;
    bankAccount: string | null;
  } | null;
  supervisorProfile: {
    id: string;
    employeeCode: string;
    adminId: string;
    zoneId: string | null;
  } | null;
  clientProfile: {
    id: string;
    province: string | null;
    createdAt: string;
    shippingAddresses: Array<{
      id: string;
      fullName: string;
      phone: string;
      addressLine: string;
      district: string | null;
      province: string;
      isDefault: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
  } | null;
  inventoryProfile: {
    id: string;
    employeeCode: string;
    adminId: string;
  } | null;
}

export type ShippingAddressApi = NonNullable<MeResponse['clientProfile']>['shippingAddresses'][number];

export type CreateShippingAddressPayload = {
  fullName: string;
  phone: string;
  addressLine: string;
  district?: string;
  province: string;
  isDefault?: boolean;
};
