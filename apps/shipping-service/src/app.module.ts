import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AwsSdkModule } from '@nestjs/aws-sdk';
import { SQS } from 'aws-sdk';
import { ShippingService } from './shipping.service';
import { SqsConsumerService } from './sqs-consumer.service';
import { ShippingPartnerService } from './shipping-partner.service';
import { Request } from './entities/request.entity';
import { RequestItem } from './entities/request-item.entity';
import { User } from './entities/user.entity';
import { OutboxMessage } from './entities/outbox-message.entity';
import { DATABASE_CONFIG, AWS_CONFIG } from '@chargeflow/shared';

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
    AwsSdkModule.forRoot({
      services: [
        {
          name: 'SQS',
          service: SQS,
          options: {
            region: AWS_CONFIG.region,
            endpoint: AWS_CONFIG.endpoint,
            credentials: {
              accessKeyId: AWS_CONFIG.accessKeyId || 'test',
              secretAccessKey: AWS_CONFIG.secretAccessKey || 'test',
            },
          },
        },
      ],
    }),
  ],
  providers: [ShippingService, SqsConsumerService, ShippingPartnerService],
})
export class AppModule {}
