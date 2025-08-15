import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceService } from './invoice.service';
import { SqsConsumerService } from './sqs-consumer.service';
import { Request } from './entities/request.entity';
import { RequestItem } from './entities/request-item.entity';
import { Product } from './entities/product.entity';
import { Invoice } from './entities/invoice.entity';
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
      entities: [Request, RequestItem, Product, Invoice, OutboxMessage],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([Request, RequestItem, Product, Invoice, OutboxMessage]),
  ],
  providers: [InvoiceService, SqsConsumerService],
})
export class AppModule {}
