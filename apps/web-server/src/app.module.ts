import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs/redis';
import { AwsSdkModule } from '@nestjs/aws-sdk';
import { SQS } from 'aws-sdk';
import { ProductsController } from './controllers/products.controller';
import { RequestsController } from './controllers/requests.controller';
import { ProductsService } from './services/products.service';
import { RequestsService } from './services/requests.service';
import { MessageBrokerService } from './services/message-broker.service';
import { Product } from './entities/product.entity';
import { Request } from './entities/request.entity';
import { RequestItem } from './entities/request-item.entity';
import { OutboxMessage } from './entities/outbox-message.entity';
import { DATABASE_CONFIG, REDIS_CONFIG, AWS_CONFIG } from '@chargeflow/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...DATABASE_CONFIG,
      entities: [Product, Request, RequestItem, OutboxMessage],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([Product, Request, RequestItem, OutboxMessage]),
    RedisModule.forRoot({
      config: REDIS_CONFIG,
    }),
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
  controllers: [ProductsController, RequestsController],
  providers: [ProductsService, RequestsService, MessageBrokerService],
})
export class AppModule {}
