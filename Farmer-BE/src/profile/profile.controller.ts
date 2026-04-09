import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // ─── Hồ sơ cá nhân ────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin hồ sơ hiện tại' })
  @ApiResponse({ status: 200, description: 'Thông tin user kèm profile' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  getMe(@Request() req: any) {
    return this.profileService.getMe(req.user.id);
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cập nhật hồ sơ cá nhân',
    description:
      'Cập nhật fullName, phone, avatar (Base64, tối đa 5MB), province. Gửi `clearAvatar: true` để xóa avatar.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string', example: 'Nguyễn Văn A' },
        phone: { type: 'string', example: '0123456789' },
        avatar: {
          type: 'string',
          nullable: true,
          example: 'data:image/png;base64,iVBORw0KG...',
          description: 'Base64 data URL — **tối đa 5MB**',
        },
        province: { type: 'string', example: 'TP.HCM' },
        clearAvatar: {
          type: 'boolean',
          example: false,
          description: 'Gửi `true` để xóa avatar hiện tại',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 409, description: 'Số điện thoại đã được sử dụng' })
  updateProfile(@Body() dto: UpdateProfileDto, @Request() req: any) {
    return this.profileService.updateProfile(req.user.id, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: {
          type: 'string',
          example: 'Matkhau@123',
          description: 'Mật khẩu hiện tại',
        },
        newPassword: {
          type: 'string',
          example: 'Matkhaumoi@456',
          description:
            'Mật khẩu mới — ít nhất 6 ký tự, ký tự đầu in hoa, 1 ký tự đặc biệt',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Mật khẩu hiện tại không đúng' })
  changePassword(@Body() dto: ChangePasswordDto, @Request() req: any) {
    return this.profileService.changePassword(req.user.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa tài khoản người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Xóa tài khoản thành công' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  deleteAccount(@Request() req: any) {
    return this.profileService.deleteAccount(req.user.id);
  }

  // ─── Địa chỉ giao hàng ────────────────────────────────────────────────────

  @Get('addresses')
  @ApiOperation({ summary: 'Lấy danh sách địa chỉ giao hàng' })
  @ApiResponse({ status: 200, description: 'Danh sách địa chỉ' })
  getAddresses(@Request() req: any) {
    return this.profileService.getShippingAddresses(req.user.id);
  }

  @Post('addresses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Thêm địa chỉ giao hàng mới' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['fullName', 'phone', 'addressLine', 'province'],
      properties: {
        fullName: { type: 'string', example: 'Nguyễn Văn A' },
        phone: { type: 'string', example: '0123456789' },
        addressLine: {
          type: 'string',
          example: '123 Đường ABC, Phường 5',
        },
        district: { type: 'string', example: 'Quận 1' },
        province: { type: 'string', example: 'TP.HCM' },
        isDefault: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  createAddress(@Body() dto: CreateShippingAddressDto, @Request() req: any) {
    return this.profileService.createShippingAddress(req.user.id, dto);
  }

  @Patch('addresses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật địa chỉ giao hàng' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Địa chỉ không tồn tại' })
  updateAddress(
    @Param('id') id: string,
    @Body() dto: UpdateShippingAddressDto,
    @Request() req: any,
  ) {
    return this.profileService.updateShippingAddress(req.user.id, id, dto);
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa địa chỉ giao hàng' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Địa chỉ không tồn tại' })
  deleteAddress(@Param('id') id: string, @Request() req: any) {
    return this.profileService.deleteShippingAddress(req.user.id, id);
  }

  @Patch('addresses/:id/set-default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt địa chỉ giao hàng mặc định' })
  @ApiResponse({ status: 200, description: 'Đặt mặc định thành công' })
  @ApiResponse({ status: 404, description: 'Địa chỉ không tồn tại' })
  setDefaultAddress(@Param('id') id: string, @Request() req: any) {
    return this.profileService.setDefaultAddress(req.user.id, id);
  }
}
