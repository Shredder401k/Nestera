import { Module } from '@nestjs/common';
import { SavingsModule } from './modules/savings/savings.module';
import { GovernanceModule } from './modules/governance/governance.module';

@Module({
  imports: [SavingsModule, GovernanceModule],
})
export class AppModule {}
