import { Module } from '@nestjs/common';
import { PlantScanController } from './plant-scan.controller';
import { PlantScanService } from './plant-scan.service';

@Module({
  controllers: [PlantScanController],
  providers: [PlantScanService],
  exports: [PlantScanService],
})
export class PlantScanModule {}
