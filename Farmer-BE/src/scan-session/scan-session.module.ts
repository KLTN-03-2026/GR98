import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ScanSessionService } from './scan-session.service';
import { ScanSessionController } from './scan-session.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ScanSessionController],
  providers: [ScanSessionService],
  exports: [ScanSessionService],
})
export class ScanSessionModule {}
