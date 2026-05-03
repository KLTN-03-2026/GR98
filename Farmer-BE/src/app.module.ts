import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
// import { BranchModule } from './branch/branch.module';
import { UserModule } from './user/user.module';
import { ProfileModule } from './profile/profile.module';
import { MailModule } from './mail/mail.module';
import { PriceBoardModule } from './price-board/price-board.module';
import { OrderModule } from './order/order.module';
import { CategoriesModule } from './categories/categories.module';
import { PlotModule } from './plot/plot.module';
import { SupervisorModule } from './supervisor/supervisor.module';
import { InventoryStaffModule } from './inventory-staff/inventory-staff.module';
import { InventoryModule } from './inventory/inventory.module';
import { FarmerModule } from './farmer/farmer.module';
import { ProductsModule } from './products/products.module';
import { ContractModule } from './contract/contract.module';
import { DailyReportModule } from './daily-report/daily-report.module';
import { PlantScanModule } from './plant-scan/plant-scan.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReviewsModule } from './reviews/reviews.module';
// import { BorrowModule } from './borrow/borrow.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    ProfileModule,
    MailModule,
    PriceBoardModule,
    OrderModule,
    CategoriesModule,
    PlotModule,
    SupervisorModule,
    InventoryStaffModule,
    InventoryModule,
    FarmerModule,
    ProductsModule,
    ContractModule,
    DailyReportModule,
    PlantScanModule,
    DashboardModule,
    ReviewsModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
