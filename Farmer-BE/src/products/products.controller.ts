import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  CreateProductFromLotDto,
  CreateProductFromContractDto,
} from './dto/create-product.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ─── PUBLIC ────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Danh sách sản phẩm công khai' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm' })
  findAllPublic(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Chi tiết sản phẩm theo slug' })
  @ApiResponse({ status: 200, description: 'Thông tin sản phẩm' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get('slug/:slug/trace')
  @ApiOperation({ summary: 'Truy xuất nguồn gốc sản phẩm theo slug' })
  @ApiResponse({ status: 200, description: 'Dữ liệu truy xuất nguồn gốc' })
  findTraceability(@Param('slug') slug: string) {
    return this.productsService.findTraceability(slug);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Danh sách sản phẩm nổi bật' })
  findFeatured(@Query('limit') limit?: string) {
    return this.productsService.findFeatured(parseInt(limit || '8', 10));
  }

  @Get('category/:slug')
  @ApiOperation({ summary: 'Danh sách sản phẩm theo danh mục' })
  findByCategory(
    @Param('slug') slug: string,
    @Query() query: { page?: string; limit?: string },
  ) {
    return this.productsService.findByCategory(slug, query);
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Danh sách sản phẩm liên quan' })
  findRelated(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.productsService.findRelated(id, parseInt(limit || '4', 10));
  }

  // ─── INTERNAL MANAGEMENT ───────────────────────────────────────────────────

  @Get('internal')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách sản phẩm nội bộ (Quản lý)' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm' })
  findAllInternal(@Query() query: ProductQueryDto, @Request() req: any) {
    return this.productsService.findAll(query, req.user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chi tiết sản phẩm nội bộ theo ID' })
  @ApiResponse({ status: 200, description: 'Thông tin sản phẩm' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.productsService.findOne(id, req.user.id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INVENTORY)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo sản phẩm mới' })
  @ApiResponse({ status: 201, description: 'Sản phẩm đã được tạo' })
  create(@Body() createProductDto: CreateProductDto, @Request() req: any) {
    return this.productsService.create(createProductDto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INVENTORY)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật sản phẩm' })
  @ApiResponse({ status: 200, description: 'Sản phẩm đã được cập nhật' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: any,
  ) {
    return this.productsService.update(id, updateProductDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INVENTORY)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa sản phẩm' })
  @ApiResponse({ status: 200, description: 'Sản phẩm đã được xóa' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.productsService.remove(id, req.user.id);
  }

  @Post('from-lot')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INVENTORY)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Niêm yết sản phẩm từ một lô hàng' })
  @ApiResponse({ status: 201, description: 'Sản phẩm đã được tạo từ lô hàng' })
  createFromLot(
    @Body() dto: CreateProductFromLotDto,
    @Request() req: any,
  ) {
    return this.productsService.createFromLot(dto, req.user.id);
  }

  @Post('from-contract')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INVENTORY)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Niêm yết sản phẩm từ hợp đồng đang hiệu lực' })
  @ApiResponse({ status: 201, description: 'Sản phẩm đã được tạo từ hợp đồng' })
  createFromContract(
    @Body() dto: CreateProductFromContractDto,
    @Request() req: any,
  ) {
    return this.productsService.createFromContract(dto, req.user.id);
  }
}
