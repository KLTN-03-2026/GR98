import z from 'zod';

export const userCreateFormSchema = z
  .object({
    fullName: z
      .string()
      .min(1, { message: 'Họ tên là bắt buộc' })
      .min(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
      .max(100, { message: 'Họ tên không được vượt quá 100 ký tự' }),

    email: z
      .string()
      .min(1, { message: 'Email là bắt buộc' })
      .email({ message: 'Email không hợp lệ' }),

    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[0-9]{8,15}$/.test(val.replace(/\s/g, '')),
        { message: 'Số điện thoại không hợp lệ (8–15 chữ số)' },
      ),

    password: z
      .string()
      .optional()
      .refine(
        (val) => !val || (val.length >= 6),
        { message: 'Mật khẩu phải có ít nhất 6 ký tự' },
      )
      .refine(
        (val) => !val || /^[A-Z]/.test(val),
        { message: 'Ký tự đầu tiên phải là chữ cái in hoa' },
      )
      .refine(
        (val) => !val || /[^A-Za-z0-9]/.test(val),
        { message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt' },
      ),

    role: z.enum(['ADMIN', 'SUPERVISOR', 'CLIENT'], {
      message: 'Vai trò là bắt buộc',
    }),

    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),

    // ADMIN-only
    province: z.string().optional(),
    businessName: z.string().optional(),

    // SUPERVISOR-only
    adminId: z.string().optional(),

    // CLIENT-only
    defaultAddress: z.string().optional(),

    avatar: z
      .instanceof(File)
      .refine(
        (file) => !file || file.type?.startsWith('image/'),
        { message: 'Avatar phải là file hình ảnh (PNG, JPG, JPEG, GIF, WEBP)' },
      )
      .refine(
        (file) => !file || file.size <= 5 * 1024 * 1024,
        { message: 'Kích thước avatar không được vượt quá 5MB' },
      )
      .optional(),
  });

export type UserCreateFormInput = z.input<typeof userCreateFormSchema>;
export type UserCreateFormOutput = z.output<typeof userCreateFormSchema>;
