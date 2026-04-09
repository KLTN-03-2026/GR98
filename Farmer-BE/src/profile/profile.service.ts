import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  // ─── Lấy thông tin hồ sơ hiện tại ─────────────────────────────────────────

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        adminProfile: {
          select: {
            id: true,
            businessName: true,
            province: true,
            taxCode: true,
            bankAccount: true,
          },
        },
        supervisorProfile: {
          select: {
            id: true,
            employeeCode: true,
            adminId: true,
            zoneId: true,
          },
        },
        clientProfile: {
          select: {
            id: true,
            province: true,
            shippingAddresses: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                addressLine: true,
                district: true,
                province: true,
                isDefault: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return user;
  }

  // ─── Cập nhật hồ sơ cá nhân ────────────────────────────────────────────────

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    // Check phone unique nếu thay đổi
    if (dto.phone !== undefined) {
      const phoneTrimmed = dto.phone.trim();
      if (phoneTrimmed !== (user.phone || '').trim()) {
        const existingPhone = await this.prisma.user.findFirst({
          where: { phone: phoneTrimmed, id: { not: userId } },
        });
        if (existingPhone) {
          throw new ConflictException('Số điện thoại đã được sử dụng');
        }
      }
    }

    // Build user-level update data
    const userUpdate: any = {};
    if (dto.fullName !== undefined) userUpdate.fullName = dto.fullName;
    if (dto.phone !== undefined) userUpdate.phone = dto.phone.trim();
    if (dto.clearAvatar) {
      userUpdate.avatar = null;
    } else if (dto.avatar !== undefined) {
      userUpdate.avatar = dto.avatar;
    }

    await this.prisma.$transaction(async (tx) => {
      // Update User
      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdate,
        });
      }

      // Update profile tương ứng
      if (user.role === Role.ADMIN && dto.province !== undefined) {
        await tx.adminProfile.update({
          where: { userId },
          data: { province: dto.province },
        });
      } else if (user.role === Role.CLIENT && dto.province !== undefined) {
        await tx.clientProfile.update({
          where: { userId },
          data: { province: dto.province },
        });
      }
    });

    return this.getMe(userId);
  }

  // ─── Đổi mật khẩu ─────────────────────────────────────────────────────────

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const isCurrentValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isCurrentValid) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return { message: 'Mật khẩu đã được đổi thành công' };
  }

  // ─── Xóa tài khoản ─────────────────────────────────────────────────────────

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    // Cascade sẽ tự xóa: adminProfile, supervisorProfile, clientProfile,
    // refreshToken, passwordResets, orders, reviews, shippingAddresses...
    await this.prisma.user.delete({ where: { id: userId } });

    return { message: 'Tài khoản đã được xóa thành công' };
  }

  // ─── Địa chỉ giao hàng ────────────────────────────────────────────────────

  async createShippingAddress(userId: string, dto: CreateShippingAddressDto) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!clientProfile) {
      throw new NotFoundException('Hồ sơ khách hàng không tồn tại');
    }

    return this.prisma.$transaction(async (tx) => {
      // Nếu đặt làm địa chỉ mặc định, bỏ default của các address khác
      if (dto.isDefault) {
        await tx.clientShippingAddress.updateMany({
          where: { clientProfileId: clientProfile.id },
          data: { isDefault: false },
        });
      }

      return tx.clientShippingAddress.create({
        data: {
          clientProfileId: clientProfile.id,
          fullName: dto.fullName,
          phone: dto.phone,
          addressLine: dto.addressLine,
          district: dto.district ?? null,
          province: dto.province,
          isDefault: dto.isDefault ?? false,
        },
      });
    });
  }

  async getShippingAddresses(userId: string) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!clientProfile) {
      throw new NotFoundException('Hồ sơ khách hàng không tồn tại');
    }

    return this.prisma.clientShippingAddress.findMany({
      where: { clientProfileId: clientProfile.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async updateShippingAddress(
    userId: string,
    addressId: string,
    dto: UpdateShippingAddressDto,
  ) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!clientProfile) {
      throw new NotFoundException('Hồ sơ khách hàng không tồn tại');
    }

    const address = await this.prisma.clientShippingAddress.findFirst({
      where: { id: addressId, clientProfileId: clientProfile.id },
    });
    if (!address) {
      throw new NotFoundException('Địa chỉ không tồn tại hoặc bạn không có quyền');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.clientShippingAddress.updateMany({
          where: { clientProfileId: clientProfile.id },
          data: { isDefault: false },
        });
      }

      return tx.clientShippingAddress.update({
        where: { id: addressId },
        data: {
          fullName: dto.fullName ?? undefined,
          phone: dto.phone ?? undefined,
          addressLine: dto.addressLine ?? undefined,
          district: dto.district ?? undefined,
          province: dto.province ?? undefined,
          isDefault: dto.isDefault ?? undefined,
        },
      });
    });
  }

  async deleteShippingAddress(userId: string, addressId: string) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!clientProfile) {
      throw new NotFoundException('Hồ sơ khách hàng không tồn tại');
    }

    const address = await this.prisma.clientShippingAddress.findFirst({
      where: { id: addressId, clientProfileId: clientProfile.id },
    });
    if (!address) {
      throw new NotFoundException('Địa chỉ không tồn tại hoặc bạn không có quyền');
    }

    await this.prisma.clientShippingAddress.delete({ where: { id: addressId } });
    return { id: addressId, deletedAt: new Date() };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!clientProfile) {
      throw new NotFoundException('Hồ sơ khách hàng không tồn tại');
    }

    const address = await this.prisma.clientShippingAddress.findFirst({
      where: { id: addressId, clientProfileId: clientProfile.id },
    });
    if (!address) {
      throw new NotFoundException('Địa chỉ không tồn tại hoặc bạn không có quyền');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.clientShippingAddress.updateMany({
        where: { clientProfileId: clientProfile.id },
        data: { isDefault: false },
      });
      await tx.clientShippingAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });

    return { id: addressId, isDefault: true };
  }
}
