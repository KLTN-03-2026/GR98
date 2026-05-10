import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('cart')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.CLIENT)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Xem giỏ hàng của tôi' })
  getCart(@Request() req: { user: { id: string } }) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ' })
  addItem(
    @Body() dto: AddCartItemDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.cartService.addItem(req.user.id, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Cập nhật số lượng' })
  updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.cartService.updateItem(req.user.id, id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi giỏ' })
  removeItem(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.cartService.removeItem(req.user.id, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa toàn bộ giỏ' })
  clearCart(@Request() req: { user: { id: string } }) {
    return this.cartService.clearCart(req.user.id);
  }
}
