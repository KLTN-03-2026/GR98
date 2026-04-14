import { Module } from '@nestjs/common';
import { InventoryStaffController } from './inventory-staff.controller';
import { InventoryStaffService } from './inventory-staff.service';

@Module({
  controllers: [InventoryStaffController],
  providers: [InventoryStaffService],
  exports: [InventoryStaffService],
})
export class InventoryStaffModule {}
