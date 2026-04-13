import { Module } from '@nestjs/common';
import { WarehouseTransactionController } from './warehouse-transaction.controller';
import { WarehouseTransactionService } from './warehouse-transaction.service';

@Module({
  controllers: [WarehouseTransactionController],
  providers: [WarehouseTransactionService],
  exports: [WarehouseTransactionService],
})
export class WarehouseTransactionModule {}
