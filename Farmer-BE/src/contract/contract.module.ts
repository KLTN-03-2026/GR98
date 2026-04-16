import { Module } from '@nestjs/common';
import { ContractController } from './contract.controller.js';
import { ContractService } from './contract.service.js';
import { PlotModule } from '../plot/plot.module';

@Module({
  imports: [PlotModule],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}
