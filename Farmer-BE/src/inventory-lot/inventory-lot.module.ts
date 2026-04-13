import { Module } from '@nestjs/common';
import { InventoryLotController } from './inventory-lot.controller';
import { InventoryLotService } from './inventory-lot.service';

@Module({
  controllers: [InventoryLotController],
  providers: [InventoryLotService],
  exports: [InventoryLotService],
})
export class InventoryLotModule {}
