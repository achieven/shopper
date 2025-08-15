import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { SqsConsumerService } from './sqs-consumer.service';
import { EmailTemplateService } from './email-template.service';
import { Request } from './entities/request.entity';
import { RequestItem } from './entities/request-item.entity';
import { User } from './entities/user.entity';
import { Product } from './entities/product.entity';
import { Invoice } from './entities/invoice.entity';
import { DATABASE_CONFIG } from '@chargeflow/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...DATABASE_CONFIG,
      entities: [Request, RequestItem, User, Product, Invoice],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([Request, RequestItem, User, Product, Invoice]),
  ],
  providers: [EmailService, SqsConsumerService, EmailTemplateService],
})
export class AppModule {}
