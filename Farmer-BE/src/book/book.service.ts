import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { Role } from '@prisma/client';

// TODO: implement Product management for ADMIN role
// Product model is defined in schema.prisma under DOMAIN 3 — E-COMMERCE
@Injectable()
export class BookService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, adminId?: string) {
    const where: any = adminId ? { adminId } : {};
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return new PaginatedResponse(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }
}
