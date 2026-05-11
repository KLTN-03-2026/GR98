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
  AssignShipperDto,
  ConfirmOrderDto,
  MarkDeliveredDto,
} from './dto/create-order.dto';
import {
  PaymentStatus,
  FulfillStatus,
  Role,
  TransactionType,
  TransactionAction,
  ShipperStatus,
} from '@prisma/client';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {}

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
    if (user.role === Role.INVENTORY) {
      const profile = await this.prisma.inventoryProfile.findUnique({
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
    const random = Math.floor(Math.random() * 99999)
      .toString()
      .padStart(5, '0');
    return `EC-${dateStr}-${adminId.slice(-4).toUpperCase()}-${random}`;
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

    // Tính tổng từ items + check stock
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        pricePerKg: true,
        name: true,
        imageUrls: true,
        stockKg: true,
        reservedKg: true,
        minOrderKg: true,
        status: true,
      },
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
      if (product.status !== 'PUBLISHED') {
        throw new BadRequestException(
          `Sản phẩm "${product.name}" hiện không được bán`,
        );
      }
      if (item.quantityKg < product.minOrderKg) {
        throw new BadRequestException(
          `Số lượng tối thiểu là ${product.minOrderKg}kg cho "${product.name}"`,
        );
      }
      const available = product.stockKg - product.reservedKg;
      if (available < item.quantityKg) {
        throw new BadRequestException(
          `"${product.name}" chỉ còn ${available}kg (yêu cầu ${item.quantityKg}kg)`,
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

    // Tạo order + reserve stock trong transaction
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

      // Reserve stock: tăng reservedKg
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { reservedKg: { increment: item.quantityKg } },
        });
      }

      return created;
    });

    return this.formatOrder(order.id, userId);
  }

  // ─── findAll (admin) ─────────────────────────────────────────────────────

  async findAll(query: OrderQueryDto, currentUserId: string) {
    // Tự động huỷ các đơn VNPAY hết hạn (>15 phút) trước khi list
    await this.paymentService.sweepExpiredVnpayOrders().catch(() => 0);

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
        shipper: {
          select: {
            id: true,
            employeeCode: true,
            vehicleType: true,
            licensePlate: true,
            status: true,
            lat: true,
            lng: true,
            lastSeenAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                avatar: true,
              },
            },
          },
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
      include: { orderItems: true },
    });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

    // Chỉ hủy được khi PENDING hoặc PACKING
    if (
      order.fulfillStatus !== FulfillStatus.PENDING &&
      order.fulfillStatus !== FulfillStatus.PACKING
    ) {
      throw new BadRequestException(
        `Không thể hủy đơn ở trạng thái "${order.fulfillStatus}". Vui lòng liên hệ hỗ trợ.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          fulfillStatus: FulfillStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: dto.reason ?? null,
        },
      });

      // Hoàn lại reservedKg
      for (const item of order.orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { reservedKg: { decrement: item.quantityKg } },
        });
      }
    });

    return this.formatOrder(id, currentUserId);
  }

  // ─── state machine (admin) ────────────────────────────────────────────────

  /**
   * PENDING → PACKING
   * Admin xác nhận đơn, bắt đầu đóng gói.
   */
  async confirmPacking(
    id: string,
    dto: ConfirmOrderDto,
    currentUserId: string,
  ) {
    const order = await this.ensureAdminAccess(id, currentUserId);
    if (order.fulfillStatus !== FulfillStatus.PENDING) {
      throw new BadRequestException(
        `Chỉ xác nhận được đơn ở trạng thái PENDING (hiện: ${order.fulfillStatus})`,
      );
    }

    await this.prisma.order.update({
      where: { id },
      data: {
        fulfillStatus: FulfillStatus.PACKING,
        packedAt: new Date(),
        note: dto.note
          ? `${order.note ? order.note + '\n' : ''}[PACKING] ${dto.note}`
          : order.note,
      },
    });

    return this.formatOrder(id, currentUserId);
  }

  /**
   * PACKING → SHIPPED (gán shipper)
   */
  async assignShipper(
    id: string,
    dto: AssignShipperDto,
    currentUserId: string,
  ) {
    const order = await this.ensureAdminAccess(id, currentUserId);
    if (order.fulfillStatus !== FulfillStatus.PACKING) {
      throw new BadRequestException(
        `Chỉ giao shipper khi đơn đang PACKING (hiện: ${order.fulfillStatus})`,
      );
    }

    const shipper = await this.prisma.shipperProfile.findUnique({
      where: { id: dto.shipperId },
    });
    if (!shipper) throw new NotFoundException('Shipper không tồn tại');
    if (shipper.adminId !== order.adminId) {
      throw new ForbiddenException('Shipper không thuộc đơn vị của bạn');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          fulfillStatus: FulfillStatus.SHIPPED,
          shippedAt: new Date(),
          shipperId: dto.shipperId,
        },
      });
      await tx.shipperProfile.update({
        where: { id: dto.shipperId },
        data: { status: ShipperStatus.BUSY },
      });
    });

    return this.formatOrder(id, currentUserId);
  }

  /**
   * SHIPPED → DELIVERED
   * Trừ kho thật (stockKg), tạo WarehouseTransaction SALE, set PAID nếu COD.
   */
  async markDelivered(
    id: string,
    dto: MarkDeliveredDto,
    currentUserId: string,
    asShipper = false,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

    // Permission check
    if (asShipper) {
      const shipper = await this.prisma.shipperProfile.findUnique({
        where: { userId: currentUserId },
      });
      if (!shipper || order.shipperId !== shipper.id) {
        throw new ForbiddenException('Đơn này không thuộc về bạn');
      }
    } else {
      await this.ensureAdminAccess(id, currentUserId);
    }

    if (order.fulfillStatus !== FulfillStatus.SHIPPED) {
      throw new BadRequestException(
        `Chỉ đánh dấu giao khi đơn đang SHIPPED (hiện: ${order.fulfillStatus})`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Tìm 1 warehouse mặc định của admin để ghi giao dịch SALE
      const warehouse = await tx.warehouse.findFirst({
        where: { adminId: order.adminId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      for (const item of order.orderItems) {
        // Giảm stock thật + giảm reserved
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockKg: { decrement: item.quantityKg },
            reservedKg: { decrement: item.quantityKg },
          },
        });

        // Ghi WarehouseTransaction OUTBOUND/SALE nếu có warehouse
        if (warehouse) {
          // Tìm 1 inventory lot còn hàng của product này
          const lot = await tx.inventoryLot.findFirst({
            where: {
              warehouseId: warehouse.id,
              productId: item.productId,
              quantityKg: { gt: 0 },
            },
            orderBy: { createdAt: 'asc' },
          });

          if (lot) {
            await tx.inventoryLot.update({
              where: { id: lot.id },
              data: { quantityKg: { decrement: item.quantityKg } },
            });
            await tx.warehouseTransaction.create({
              data: {
                warehouseId: warehouse.id,
                productId: item.productId,
                inventoryLotId: lot.id,
                quantityKg: -item.quantityKg,
                type: TransactionType.OUTBOUND,
                action: TransactionAction.SALE,
                note: `Bán online - Đơn ${order.orderNo}`,
                createdBy: currentUserId,
              },
            });
          }
        }
      }

      // Update order
      const updateData: any = {
        fulfillStatus: FulfillStatus.DELIVERED,
        deliveredAt: new Date(),
      };
      if (dto.deliveryProofUrl) {
        updateData.deliveryProofUrl = dto.deliveryProofUrl;
      }
      if (dto.note) {
        updateData.note = `${order.note ? order.note + '\n' : ''}[GIAO] ${dto.note}`;
      }
      // Nếu COD: tự set PAID
      if (
        order.paymentMethod === 'COD' &&
        order.paymentStatus === PaymentStatus.PENDING
      ) {
        updateData.paymentStatus = PaymentStatus.PAID;
        updateData.paidAt = new Date();
      }

      await tx.order.update({ where: { id }, data: updateData });

      // Giải phóng shipper nếu có
      if (order.shipperId) {
        await tx.shipperProfile.update({
          where: { id: order.shipperId },
          data: { status: ShipperStatus.AVAILABLE },
        });
      }
    });

    return this.formatOrder(id, currentUserId);
  }

  /**
   * Admin huỷ đơn (bất kỳ trạng thái nào trừ DELIVERED).
   */
  async adminCancel(
    id: string,
    dto: CancelOrderDto,
    currentUserId: string,
  ) {
    const order = await this.ensureAdminAccess(id, currentUserId);
    if (order.fulfillStatus === FulfillStatus.DELIVERED) {
      throw new BadRequestException('Không thể huỷ đơn đã giao');
    }
    if (order.fulfillStatus === FulfillStatus.CANCELLED) {
      throw new BadRequestException('Đơn đã huỷ rồi');
    }

    const items = await this.prisma.orderItem.findMany({
      where: { orderId: id },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          fulfillStatus: FulfillStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: dto.reason ?? 'Huỷ bởi quản trị',
        },
      });
      // Hoàn reserved
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { reservedKg: { decrement: item.quantityKg } },
        });
      }
      // Giải phóng shipper nếu đơn đang được giao
      if (order.shipperId) {
        await tx.shipperProfile.update({
          where: { id: order.shipperId },
          data: { status: ShipperStatus.AVAILABLE },
        });
      }
    });

    return this.formatOrder(id, currentUserId);
  }

  private async ensureAdminAccess(orderId: string, currentUserId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!currentUser) throw new NotFoundException('Người dùng không tồn tại');
    if (currentUser.role === Role.CLIENT) {
      throw new ForbiddenException('Không có quyền');
    }
    const adminId = await this.resolveAdminId(currentUserId);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, adminId: adminId as string },
    });
    if (!order) {
      throw new NotFoundException(
        'Đơn hàng không tồn tại hoặc không thuộc đơn vị của bạn',
      );
    }
    return order;
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
        shipper: {
          select: {
            id: true,
            employeeCode: true,
            vehicleType: true,
            licensePlate: true,
            status: true,
            lat: true,
            lng: true,
            lastSeenAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }
}
