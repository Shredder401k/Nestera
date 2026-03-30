import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { TypeOrmHealthIndicator } from './indicators/typeorm.health';
import { IndexerHealthIndicator } from './indicators/indexer.health';
import { RpcHealthIndicator } from './indicators/rpc.health';
import { ConnectionPoolHealthIndicator } from './indicators/connection-pool.health';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ConnectionPoolModule } from '../../common/database/connection-pool.module';
import { DeadLetterEvent } from '../blockchain/entities/dead-letter-event.entity';

@Module({
  imports: [
    TerminusModule,
    TypeOrmModule.forFeature([DeadLetterEvent]),
    BlockchainModule,
    ConnectionPoolModule,
  ],
  controllers: [HealthController],
  providers: [
    TypeOrmHealthIndicator,
    IndexerHealthIndicator,
    RpcHealthIndicator,
    ConnectionPoolHealthIndicator,
  ],
})
export class HealthModule {}
