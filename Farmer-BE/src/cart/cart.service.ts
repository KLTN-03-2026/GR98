import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateCart(userId: string) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!clientProfile) {
      throw new ForbiddenException('Chỉ khách hàng mới có giỏ hàng');
    }

    let cart = await this.prisma.cart.findUnique({
      where: { clientId: clientProfile.id },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { clientId: clientProfile.id },
      });
    }
    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const fullCart = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          orderBy: { addedAt: 'desc' },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                pricePerKg: true,
                stockKg: true,
                reservedKg: true,
                minOrderKg: true,
                imageUrls: true,
                thumbnailUrl: true,
                status: true,
                cropType: true,
                grade: true,
              },
            },
          },
        },
      },
    });

    if (!fullCart) {
      return { id: cart.id, items: [], subtotal: 0, itemCount: 0 };
    }

    const subtotal = fullCart.items.reduce(
      (sum, item) => sum + item.product.pricePerKg * item.quantityKg,
      0,
    );
    const itemCount = fullCart.items.reduce((n, i) => n + i.quantityKg, 0);

    return {
      id: fullCart.id,
      items: fullCart.items,
      subtotal,
      itemCount,
      updatedAt: fullCart.updatedAt,
    };
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const cart = await this.getOrCreateCart(userId);

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: {
        id: true,
        name: true,
        stockKg: true,
        reservedKg: true,
        minOrderKg: true,
        status: true,
      },
    });
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');
    if (product.status !== 'PUBLISHED') {
      throw new BadRequestException('Sản phẩm không được bán');
    }
    if (dto.quantityKg < product.minOrderKg) {
      throw new BadRequestException(
        `Số lượng tối thiểu là ${product.minOrderKg}kg`,
      );
    }

    // Check tồn kho available vs cart hiện tại
    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: { cartId: cart.id, productId: dto.productId },
      },
    });

    const targetQty = (existing?.quantityKg ?? 0) + dto.quantityKg;
    const available = product.stockKg - product.reservedKg;
    if (targetQty > available) {
      throw new BadRequestException(
        `"${product.name}" chỉ còn ${available}kg`,
      );
    }

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantityKg: targetQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantityKg: dto.quantityKg,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: true },
    });
    if (!item) throw new NotFoundException('Item không tồn tại');

    const available = item.product.stockKg - item.product.reservedKg;
    if (dto.quantityKg > available) {
      throw new BadRequestException(
        `"${item.product.name}" chỉ còn ${available}kg`,
      );
    }
    if (dto.quantityKg < item.product.minOrderKg) {
      throw new BadRequestException(
        `Số lượng tối thiểu là ${item.product.minOrderKg}kg`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantityKg: dto.quantityKg },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundException('Item không tồn tại');

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getCart(userId);
  }
}
