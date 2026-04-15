import { Module } from '@nestjs/common';
import { FarmerController } from './farmer.controller';
import { FarmerService } from './farmer.service';

@Module({
  controllers: [FarmerController],
  providers: [FarmerService],
  exports: [FarmerService],
})
export class FarmerModule {}
