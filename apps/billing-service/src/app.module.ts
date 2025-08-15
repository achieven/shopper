import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { SqsConsumerService } from './sqs-consumer.service';
import { StripeService } from './stripe.service';
import { Request } from './entities/request.entity';
import { RequestItem } from './entities/request-item.entity';
import { User } from './entities/user.entity';
import { OutboxMessage } from './entities/outbox-message.entity';
import { DATABASE_CONFIG } from '@chargeflow/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...DATABASE_CONFIG,
      entities: [Request, RequestItem, User, OutboxMessage],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([Request, RequestItem, User, OutboxMessage]),
  ],
  providers: [BillingService, SqsConsumerService, StripeService],
})
export class AppModule {}
