import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './controllers/products.controller';
import { RequestsController } from './controllers/requests.controller';
import { ProductsService } from './services/products.service';
import { RequestsService } from './services/requests.service';
import { MessageBrokerService } from './services/message-broker.service';
import { Product } from './entities/product.entity';
import { Request } from './entities/request.entity';
import { RequestItem } from './entities/request-item.entity';
import { OutboxMessage } from './entities/outbox-message.entity';
import { DATABASE_CONFIG } from '@shopflow/shared';

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
  ],
  controllers: [ProductsController, RequestsController],
  providers: [ProductsService, RequestsService, MessageBrokerService],
})
export class AppModule {}
