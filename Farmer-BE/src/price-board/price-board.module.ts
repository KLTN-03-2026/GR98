import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PriceBoardService } from './price-board.service';
import { PriceBoardController } from './price-board.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PriceBoardController],
  providers: [PriceBoardService],
  exports: [PriceBoardService],
})
export class PriceBoardModule {}
