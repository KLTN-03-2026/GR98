import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiAdvisorService } from './ai-advisor.service';
import { AiAdvisorController } from './ai-advisor.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AiAdvisorController],
  providers: [AiAdvisorService],
  exports: [AiAdvisorService],
})
export class AiAdvisorModule {}
