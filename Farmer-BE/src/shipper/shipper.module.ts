import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ShipperService } from './shipper.service';
import { ShipperController } from './shipper.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ShipperController],
  providers: [ShipperService],
  exports: [ShipperService],
})
export class ShipperModule {}
