import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthGuard } from '../common/guards/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, UserStatus } from '@prisma/client';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo người dùng mới',
    description:
      '**Avatar**: Gửi chuỗi Base64 data URL (ví dụ: `data:image/png;base64,iVBORw0KG...`) — **tối đa 5MB**. Nếu file lớn hơn 5MB sẽ bị từ chối.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'fullName', 'role'],
      properties: {
        email: {
          type: 'string',
          example: 'nguyenvana@email.com',
          description: 'Email duy nhất',
        },
        password: {
          type: 'string',
          example: 'Matkhau@123',
          description: 'Ít nhất 6 ký tự, in hoa đầu, 1 ký tự đặc biệt',
        },
        fullName: { type: 'string', example: 'Nguyễn Văn A' },
        phone: { type: 'string', example: '0123456789' },
        role: {
          type: 'string',
          enum: ['ADMIN', 'SUPERVISOR', 'CLIENT'],
          example: 'ADMIN',
        },
        avatar: {
          type: 'string',
          nullable: true,
          example: 'data:image/png;base64,iVBORw0KG...',
          description: 'Base64 data URL — **tối đa 5MB**',
        },
        province: {
          type: 'string',
          example: 'Hà Nội',
          description: 'Chỉ dùng cho ADMIN hoặc CLIENT',
        },
        businessName: {
          type: 'string',
          example: 'Công ty TNHH Nông Sản Xanh',
          description: 'Chỉ dùng cho ADMIN',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({
    status: 400,
    description:
      'Validation error — avatar vượt 5MB hoặc định dạng không hợp lệ',
  })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    return this.userService.create(createUserDto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Lấy danh sách người dùng (phân trang)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 16 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm theo tên, email, số điện thoại',
  })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('search') search: string,
    @Query('role') role: Role,
    @Query('status') status: UserStatus,
    @Request() req: any,
  ) {
    return this.userService.findAll(pagination, req.user.id, {
      search,
      role,
      status,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Lấy chi tiết người dùng' })
  @ApiResponse({ status: 200, description: 'Thông tin người dùng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.userService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cập nhật người dùng',
    description:
      '**Avatar**: Gửi chuỗi Base64 data URL — **tối đa 5MB**. Hoặc gửi `clearAvatar: true` để xóa avatar hiện tại.',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({
    status: 400,
    description: 'Validation error — avatar vượt 5MB',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ) {
    return this.userService.update(id, updateUserDto, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa người dùng' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.userService.remove(id, req.user.id);
  }
}
