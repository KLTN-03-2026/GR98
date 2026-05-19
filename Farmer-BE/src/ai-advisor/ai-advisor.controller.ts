import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AiAdvisorService } from './ai-advisor.service';

@ApiTags('ai-advisor')
@ApiBearerAuth()
@Controller()
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERVISOR)
export class AiAdvisorController {
  constructor(private readonly service: AiAdvisorService) {}

  @Post('scan-sessions/:id/recommend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sinh khuyến nghị xử lý cho phiên quét đã đóng (qua Claude + RAG)',
  })
  recommend(@Param('id') id: string, @Request() req: any) {
    return this.service.recommend(id, req.user.id);
  }

  @Post('recommendations/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Duyệt khuyến nghị (chuyển DRAFT → APPROVED)' })
  approve(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @Request() req: any,
  ) {
    return this.service.approve(id, body?.note, req.user.id);
  }

  @Post('recommendations/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Từ chối khuyến nghị (chuyển DRAFT → REJECTED)' })
  reject(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @Request() req: any,
  ) {
    return this.service.reject(id, body?.note, req.user.id);
  }
}
