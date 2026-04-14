import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlotController } from './plot.controller';
import { PlotService } from './plot.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlotController],
  providers: [PlotService],
  exports: [PlotService],
})
export class PlotModule {}
