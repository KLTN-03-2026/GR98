import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FulfillStatus, ReviewStatus } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { page?: string; limit?: string; status?: ReviewStatus; search?: string }) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '50', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { comment: { contains: query.search, mode: 'insensitive' } },
        { product: { name: { contains: query.search, mode: 'insensitive' } } },
        { client: { user: { fullName: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, thumbnailUrl: true } },
          client: {
            include: {
              user: { select: { fullName: true, avatar: true, phone: true } },
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStatus(id: string, status: ReviewStatus) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    return this.prisma.review.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    return this.prisma.review.delete({ where: { id } });
  }

  // ─── Public: list APPROVED reviews for a product ────────────────────────────
  async listByProduct(
    productId: string,
    query: { page?: string; limit?: string },
  ) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '10', 10), 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId, status: ReviewStatus.APPROVED },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            include: {
              user: { select: { fullName: true, avatar: true } },
            },
          },
        },
      }),
      this.prisma.review.count({
        where: { productId, status: ReviewStatus.APPROVED },
      }),
    ]);

    return {
      items: items.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        imageUrls: r.imageUrls,
        verifiedPurchase: r.verifiedPurchase,
        clientName: r.client?.user?.fullName ?? 'Khách hàng',
        clientAvatar: (r.client?.user as any)?.avatar ?? null,
        createdAt: r.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Client: create a review (once per product per client) ─────────────────
  async create(currentUserId: string, productId: string, dto: CreateReviewDto) {
    // 1. Resolve ClientProfile
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId: currentUserId },
      select: { id: true },
    });
    if (!clientProfile) {
      throw new ForbiddenException('Chỉ tài khoản khách hàng mới có thể đánh giá');
    }

    // 2. Product must exist and be published
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true },
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // 3. One review per product per client
    const existing = await this.prisma.review.findFirst({
      where: { clientId: clientProfile.id, productId },
    });
    if (existing) {
      throw new ConflictException('Bạn đã đánh giá sản phẩm này rồi');
    }

    // 4. verifiedPurchase = true nếu client có đơn DELIVERED chứa sản phẩm này
    const verifiedOrder = await this.prisma.order.findFirst({
      where: {
        clientId: clientProfile.id,
        fulfillStatus: FulfillStatus.DELIVERED,
        orderItems: { some: { productId } },
      },
      select: { id: true },
    });

    if (!verifiedOrder) {
      throw new BadRequestException(
        'Bạn chỉ có thể đánh giá sản phẩm sau khi đơn hàng được giao thành công',
      );
    }

    return this.prisma.review.create({
      data: {
        clientId: clientProfile.id,
        productId,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
        imageUrls: dto.imageUrls ?? [],
        verifiedPurchase: true,
        status: ReviewStatus.APPROVED,
      },
    });
  }
}
