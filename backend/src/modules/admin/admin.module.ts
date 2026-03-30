import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { SavingsModule } from '../savings/savings.module';
import { MailModule } from '../mail/mail.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { CircuitBreakerModule } from '../../common/circuit-breaker/circuit-breaker.module';
import { AdminController } from './admin.controller';
import { AdminSavingsController } from './admin-savings.controller';
import { AdminWaitlistController } from './admin-waitlist.controller';
import { AdminUsersController } from './admin-users.controller';
import { CircuitBreakerController } from './circuit-breaker.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminSavingsService } from './admin-savings.service';
import { User } from '../user/entities/user.entity';
import { UserSubscription } from '../savings/entities/user-subscription.entity';
import { SavingsProduct } from '../savings/entities/savings-product.entity';
import { LedgerTransaction } from '../blockchain/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserSubscription,
      SavingsProduct,
      LedgerTransaction,
    ]),
    UserModule,
    SavingsModule,
    MailModule,
    BlockchainModule,
    CircuitBreakerModule,
  ],
  controllers: [
    AdminController,
    AdminSavingsController,
    AdminWaitlistController,
    AdminUsersController,
    CircuitBreakerController,
  ],
  providers: [AdminUsersService, AdminSavingsService],
})
export class AdminModule {}
