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
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
  ReorderCategoryDto,
} from './dto/create-category.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ─── PUBLIC: Danh sách danh mục cho client ────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'Danh sách danh mục (client — không cần đăng nhập)',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách danh mục kèm productCount',
  })
  findAll(@Query() query: CategoryQueryDto) {
    return this.categoriesService.findAll(query);
  }

  // ─── PUBLIC: Chi tiết theo slug ───────────────────────────────────────────

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Chi tiết danh mục theo slug' })
  @ApiResponse({ status: 200, description: 'Thông tin danh mục' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  // ─── ADMIN: Chi tiết theo id ─────────────────────────────────────────────

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chi tiết danh mục theo id (Admin)' })
  @ApiResponse({ status: 200, description: 'Thông tin danh mục' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  // ─── ADMIN: Tạo mới ─────────────────────────────────────────────────────

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INVENTORY)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo danh mục mới (Admin)' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  // ─── ADMIN: Sắp xếp lại (đặt TRƯỚC @Patch(':id') — nếu không, "reorder" bị coi là id) ─

  @Patch('reorder')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INVENTORY)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sắp xếp thứ tự danh mục (Admin)' })
  @ApiResponse({ status: 200, description: 'Đã cập nhật sortOrder' })
  reorder(@Body() dto: ReorderCategoryDto) {
    return this.categoriesService.reorder(dto);
  }

  // ─── ADMIN: Cập nhật ────────────────────────────────────────────────────

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INVENTORY)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật danh mục (Admin)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  // ─── ADMIN: Xóa ──────────────────────────────────────────────────────────

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INVENTORY)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa danh mục (Admin)' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
