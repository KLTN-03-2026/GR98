import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, ReviewStatus } from '@prisma/client';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';

@ApiTags('reviews')
@Controller('reviews')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('internal')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Danh sách đánh giá nội bộ' })
  findAllInternal(
    @Query() query: { page?: string; limit?: string; status?: ReviewStatus; search?: string },
  ) {
    return this.reviewsService.findAll(query);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Cập nhật trạng thái đánh giá' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReviewStatusDto,
  ) {
    return this.reviewsService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa đánh giá' })
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
