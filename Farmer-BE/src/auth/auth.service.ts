import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';
import { Role, UserStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

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
            createdAt: true,
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

  async updateMe(userId: string, data: { fullName?: string; phone?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    if (data.phone !== undefined) {
      const phoneTrimmed = data.phone.trim();
      if (phoneTrimmed) {
        const existingPhone = await this.prisma.user.findFirst({
          where: { phone: phoneTrimmed, id: { not: userId } },
        });
        if (existingPhone) {
          throw new ConflictException('Số điện thoại đã được sử dụng');
        }
      }
    }

    const updateData: any = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.phone !== undefined) updateData.phone = data.phone.trim() || null;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    return this.getMe(userId);
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const phoneTrimmed = registerDto.phone?.trim();
    if (phoneTrimmed) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: phoneTrimmed },
      });
      if (existingPhone) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: registerDto.email,
          passwordHash: hashedPassword,
          fullName: registerDto.fullName,
          phone: phoneTrimmed || null,
          role: Role.CLIENT,
        },
      });

      await tx.clientProfile.create({
        data: {
          userId: createdUser.id,
          adminId: null,
          province: null,
        },
      });

      return createdUser;
    });

    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId: user.id },
    });
    const adminId = clientProfile?.adminId ?? null;
    const profileId = clientProfile?.id ?? null;

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      adminId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        profileId,
        adminId,
      },
    };
  }

  async login(loginDto: LoginDto) {
    // 1. Find user by email OR phone
    const user = await this.prisma.user.findFirst({
      where: loginDto.email
        ? { email: loginDto.email }
        : loginDto.phone
          ? { phone: loginDto.phone }
          : {},
    });

    if (!user) {
      throw new UnauthorizedException(
        'Tài khoản hoặc mật khẩu không chính xác',
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Tài khoản đã bị ngưng hoạt động hoặc tạm ngưng',
      );
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Tài khoản hoặc mật khẩu không chính xác',
      );
    }

    // 3. Get adminId from profile
    let adminId: string | null = null;
    if (user.role === Role.ADMIN) {
      const profile = await this.prisma.adminProfile.findUnique({
        where: { userId: user.id },
      });
      adminId = profile?.id ?? null;
    } else if (user.role === Role.SUPERVISOR) {
      const profile = await this.prisma.supervisorProfile.findUnique({
        where: { userId: user.id },
      });
      adminId = profile?.adminId ?? null;
    } else if (user.role === Role.INVENTORY) {
      const profile = await this.prisma.inventoryProfile.findUnique({
        where: { userId: user.id },
      });
      adminId = profile?.adminId ?? null;
    } else {
      const profile = await this.prisma.clientProfile.findUnique({
        where: { userId: user.id },
      });
      adminId = profile?.adminId ?? null;
    }

    // 4. Generate JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      adminId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // 5. Resolve profileId
    let profileId: string | null = null;
    if (user.role === Role.ADMIN) {
      const profile = await this.prisma.adminProfile.findUnique({
        where: { userId: user.id },
      });
      profileId = profile?.id ?? null;
    } else if (user.role === Role.SUPERVISOR) {
      const profile = await this.prisma.supervisorProfile.findUnique({
        where: { userId: user.id },
      });
      profileId = profile?.id ?? null;
    } else if (user.role === Role.INVENTORY) {
      const profile = await this.prisma.inventoryProfile.findUnique({
        where: { userId: user.id },
      });
      profileId = profile?.id ?? null;
    } else {
      const profile = await this.prisma.clientProfile.findUnique({
        where: { userId: user.id },
      });
      profileId = profile?.id ?? null;
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        profileId,
        adminId,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Tài khoản đã bị ngưng hoạt động hoặc tạm ngưng',
      );
    }

    // Resolve adminId from profile (never trust JWT payload for tenant isolation)
    let adminId: string | null = null;
    if (user.role === Role.ADMIN) {
      const profile = await this.prisma.adminProfile.findUnique({
        where: { userId: user.id },
      });
      adminId = profile?.id ?? null;
    } else if (user.role === Role.SUPERVISOR) {
      const profile = await this.prisma.supervisorProfile.findUnique({
        where: { userId: user.id },
      });
      adminId = profile?.adminId ?? null;
    } else if (user.role === Role.INVENTORY) {
      const profile = await this.prisma.inventoryProfile.findUnique({
        where: { userId: user.id },
      });
      adminId = profile?.adminId ?? null;
    } else {
      const profile = await this.prisma.clientProfile.findUnique({
        where: { userId: user.id },
      });
      adminId = profile?.adminId ?? null;
    }

    return { ...user, adminId };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Luôn return success để không leak email tồn tại
    if (!user) {
      return { message: 'Link đặt lại mật khẩu đã được gửi đến email' };
    }

    // Tạo token bảo mật
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ

    // Xóa các token cũ của user
    await this.prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    // Tạo record PasswordReset mới
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Build reset link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

    // Gửi email
    try {
      await this.mailService.sendPasswordResetEmail(user.email, resetLink, user.fullName);
    } catch (error) {
      console.error('Failed to send reset email:', error);
      // Vẫn return thành công để không leak thông tin
    }

    return { message: 'Link đặt lại mật khẩu đã được gửi đến email' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const passwordReset = await this.prisma.passwordReset.findUnique({
      where: { token: dto.token },
    });

    if (!passwordReset) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    // Check if token is expired
    if (new Date() > passwordReset.expiresAt) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    // Check if token was already used
    if (passwordReset.usedAt) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Update password and mark token as used in transaction
    await this.prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: passwordReset.userId },
        data: { passwordHash: hashedPassword },
      });

      // Mark token as used
      await tx.passwordReset.update({
        where: { id: passwordReset.id },
        data: { usedAt: new Date() },
      });

      // Invalidate all refresh tokens of this user
      await tx.refreshToken.deleteMany({
        where: { userId: passwordReset.userId },
      });
    });

    return { message: 'Mật khẩu đã được cập nhật' };
  }
}
