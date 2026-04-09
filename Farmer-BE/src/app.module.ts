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
// import { BorrowModule } from './borrow/borrow.module';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, ProfileModule, MailModule, PriceBoardModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
