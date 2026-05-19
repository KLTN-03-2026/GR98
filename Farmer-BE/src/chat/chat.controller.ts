import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ChatService } from './chat.service';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.SUPERVISOR, Role.ADMIN)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('ask')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hỏi trợ lý canh tác — RAG theo tài liệu BVTV đã index',
  })
  ask(@Body() body: { question: string }) {
    return this.chatService.ask(body?.question ?? '');
  }
}
