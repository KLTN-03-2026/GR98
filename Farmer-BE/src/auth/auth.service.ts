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
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
    } else {
      const profile = await this.prisma.clientProfile.findUnique({
        where: { userId: user.id },
      });
      adminId = profile?.adminId ?? null;
    }

    return { ...user, adminId };
  }
}
