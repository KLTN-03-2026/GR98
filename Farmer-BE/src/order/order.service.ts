import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderQueryDto,
  CancelOrderDto,
} from './dto/create-order.dto';
import { PaymentStatus, FulfillStatus, Role } from '@prisma/client';
import { PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  // ─── helpers ────────────────────────────────────────────────────────────────

  private async resolveAdminId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    if (user.role === Role.ADMIN) {
      const profile = await this.prisma.adminProfile.findUnique({
        where: { userId },
      });
      return profile?.id ?? null;
    }
    if (user.role === Role.SUPERVISOR) {
      const profile = await this.prisma.supervisorProfile.findUnique({
        where: { userId },
      });
      return profile?.adminId ?? null;
    }
    if (user.role === Role.CLIENT) {
      const profile = await this.prisma.clientProfile.findUnique({
        where: { userId },
      });
      return profile?.adminId ?? null;
    }
    return null;
  }

  private async getClientProfileId(userId: string): Promise<string | null> {
    const profile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    return profile?.id ?? null;
  }

  private generateOrderCode(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 999)
      .toString()
      .padStart(3, '0');
    return `ĐH-${dateStr}-${random}`;
  }

  private generateOrderNo(adminId: string): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    return `EC-${dateStr}-${adminId.slice(-4).toUpperCase()}`;
  }

  // ─── create ────────────────────────────────────────────────────────────────

  async create(dto: CreateOrderDto, userId: string) {
    // Resolve client profile
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!clientProfile) {
      throw new NotFoundException('Không tìm thấy hồ sơ khách hàng');
    }

    if (!clientProfile.adminId) {
      throw new BadRequestException('Không xác định được đơn vị cung cấp');
    }

    if (dto.items.length === 0) {
      throw new BadRequestException('Đơn hàng phải có ít nhất 1 sản phẩm');
    }

    // Resolve shipping address — dùng savedAddress nếu có, không thì dùng dto.shippingAddr
    let shippingAddr = dto.shippingAddr;
    if (dto.savedAddressId) {
      const savedAddr = await this.prisma.clientShippingAddress.findUnique({
        where: { id: dto.savedAddressId, clientProfileId: clientProfile.id },
      });
      if (savedAddr) {
        shippingAddr = {
          fullName: savedAddr.fullName,
          phone: savedAddr.phone,
          addressLine: savedAddr.addressLine,
          district: savedAddr.district ?? undefined,
          province: savedAddr.province,
        };
      }
    }

    // Tính tổng từ items
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, pricePerKg: true, name: true, imageUrls: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const orderItems: Array<{
      productId: string;
      nameSnapshot: string;
      priceSnapshot: number;
      quantityKg: number;
      subtotal: number;
    }> = [];

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Sản phẩm "${item.productId}" không tồn tại`,
        );
      }
      if (item.quantityKg < 0.25) {
        throw new BadRequestException(
          `Số lượng tối thiểu là 0.25kg cho "${product.name}"`,
        );
      }
      const itemSubtotal = product.pricePerKg * item.quantityKg;
      subtotal += itemSubtotal;
      orderItems.push({
        productId: item.productId,
        nameSnapshot: product.name,
        priceSnapshot: product.pricePerKg,
        quantityKg: item.quantityKg,
        subtotal: itemSubtotal,
      });
    }

    // Tính phí ship: miễn phí nếu subtotal >= 500k
    const shippingFee = subtotal >= 500000 ? 0 : 25000;
    const total = subtotal + shippingFee;

    const adminIdForOrder = clientProfile.adminId;
    const orderNo = this.generateOrderNo(adminIdForOrder);
    const orderCode = this.generateOrderCode();

    // Tạo order trong transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          clientId: clientProfile.id,
          adminId: adminIdForOrder,
          orderNo,
          orderCode,
          subtotal,
          shippingFee,
          discount: 0,
          total,
          paymentMethod: dto.paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          fulfillStatus: FulfillStatus.PENDING,
          shippingAddr: shippingAddr as any,
          note: dto.note ?? null,
        },
      });

      await tx.orderItem.createMany({
        data: orderItems.map((item) => ({
          orderId: created.id,
          ...item,
        })),
      });

      return created;
    });

    return this.formatOrder(order.id, userId);
  }

  // ─── findAll (admin) ─────────────────────────────────────────────────────

  async findAll(query: OrderQueryDto, currentUserId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!currentUser) throw new NotFoundException('Người dùng không tồn tại');

    const adminId = await this.resolveAdminId(currentUserId);

    const where: any = {};
    if (currentUser.role === Role.CLIENT) {
      // CLIENT: chỉ thấy đơn của mình
      const clientProfile = await this.prisma.clientProfile.findUnique({
        where: { userId: currentUserId },
      });
      if (!clientProfile)
        throw new ForbiddenException('Không có quyền xem đơn hàng');
      where.clientId = clientProfile.id;
    } else {
      // ADMIN/SUPERVISOR: theo tenant
      if (adminId) {
        where.adminId = adminId;
      } else {
        throw new ForbiddenException('Không có quyền xem đơn hàng');
      }
    }

    if (query.search) {
      where.OR = [
        { orderNo: { contains: query.search, mode: 'insensitive' } },
        { orderCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }
    if (query.fulfillStatus) {
      where.fulfillStatus = query.fulfillStatus;
    }
    if (query.paymentMethod) {
      where.paymentMethod = query.paymentMethod;
    }
    if (query.fromDate) {
      where.orderedAt = { ...where.orderedAt, gte: new Date(query.fromDate) };
    }
    if (query.toDate) {
      const toEnd = new Date(query.toDate);
      toEnd.setHours(23, 59, 59, 999);
      where.orderedAt = { ...where.orderedAt, lte: toEnd };
    }

    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderedAt: 'desc' },
        include: {
          orderItems: {
            include: {
              product: {
                select: { id: true, imageUrls: true },
              },
            },
          },
          client: {
            select: {
              id: true,
              user: { select: { fullName: true, email: true, phone: true } },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return new PaginatedResponse(data, total, page, limit);
  }

  // ─── findOne ──────────────────────────────────────────────────────────────

  async findOne(id: string, currentUserId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!currentUser) throw new NotFoundException('Người dùng không tồn tại');

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, imageUrls: true, thumbnailUrl: true },
            },
          },
        },
        client: {
          select: {
            id: true,
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
        admin: {
          select: { id: true, businessName: true },
        },
      },
    });

    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

    // CLIENT: chỉ xem đơn của mình
    if (currentUser.role === Role.CLIENT) {
      const clientProfile = await this.prisma.clientProfile.findUnique({
        where: { userId: currentUserId },
      });
      if (!clientProfile || order.clientId !== clientProfile.id) {
        throw new ForbiddenException('Bạn không có quyền xem đơn hàng này');
      }
    }

    return order;
  }

  // ─── update (admin) ────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateOrderDto, currentUserId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!currentUser) throw new NotFoundException('Người dùng không tồn tại');

    if (currentUser.role === Role.CLIENT) {
      throw new ForbiddenException(
        'Khách hàng không có quyền cập nhật đơn hàng',
      );
    }

    const adminId = await this.resolveAdminId(currentUserId);

    const existing = await this.prisma.order.findFirst({
      where: { id, adminId: adminId as string },
    });
    if (!existing)
      throw new NotFoundException(
        'Đơn hàng không tồn tại hoặc bạn không có quyền sửa',
      );

    const updated = await this.prisma.order.update({
      where: { id },
      data: dto,
    });

    return this.formatOrder(updated.id, currentUserId);
  }

  // ─── cancel (client) ───────────────────────────────────────────────────────

  async cancel(id: string, dto: CancelOrderDto, currentUserId: string) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId: currentUserId },
    });
    if (!clientProfile) throw new ForbiddenException('Không có quyền hủy đơn');

    const order = await this.prisma.order.findFirst({
      where: { id, clientId: clientProfile.id },
    });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

    // Chỉ hủy được nếu: chưa thanh toán và chưa giao
    if (order.fulfillStatus !== FulfillStatus.PENDING) {
      throw new BadRequestException(
        `Không thể hủy đơn hàng ở trạng thái "${order.fulfillStatus}". Vui lòng liên hệ hỗ trợ.`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        fulfillStatus: FulfillStatus.CANCELLED,
        note: dto.reason
          ? `${order.note ? order.note + '\n' : ''}[HỦY] ${dto.reason}`
          : order.note,
      },
    });

    return this.formatOrder(updated.id, currentUserId);
  }

  // ─── format ───────────────────────────────────────────────────────────────

  private async formatOrder(orderId: string, currentUserId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, imageUrls: true, thumbnailUrl: true },
            },
          },
        },
        client: {
          select: {
            id: true,
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
      },
    });
  }
}
