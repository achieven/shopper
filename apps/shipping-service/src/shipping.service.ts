import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SQS } from 'aws-sdk';
import { Request } from './entities/request.entity';
import { RequestItem } from './entities/request-item.entity';
import { User } from './entities/user.entity';
import { Product } from './entities/product.entity';
import { OutboxMessage } from './entities/outbox-message.entity';
import { EventType, RequestStatus, SQS_CONFIG, AWS_CONFIG } from '@shopflow/shared';
import { ShippingPartnerService } from './shipping-partner.service';

@Injectable()
export class ShippingService {
  private readonly sqs: SQS;

  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(RequestItem)
    private readonly requestItemRepository: Repository<RequestItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(OutboxMessage)
    private readonly outboxRepository: Repository<OutboxMessage>,
    private readonly shippingPartnerService: ShippingPartnerService,
    private readonly dataSource: DataSource,
  ) {
    this.sqs = new SQS({
      region: AWS_CONFIG.region,
      endpoint: AWS_CONFIG.endpoint,
      credentials: {
        accessKeyId: AWS_CONFIG.accessKeyId || 'test',
        secretAccessKey: AWS_CONFIG.secretAccessKey || 'test',
      },
    });
  }

  async processShipping(requestId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get request with items, user, and products
      const request = await this.requestRepository.findOne({
        where: { id: requestId },
        relations: ['items'],
      });

      if (!request) {
        throw new Error(`Request ${requestId} not found`);
      }

      const user = await this.userRepository.findOne({
        where: { id: request.userId },
      });

      if (!user) {
        throw new Error(`User ${request.userId} not found`);
      }

      const productIds = request.items.map(item => item.productId);
      const products = await this.productRepository.findByIds(productIds);

      // Create shipping order with partner
      const shippingOrder = await this.shippingPartnerService.createShippingOrder(
        user.address,
        request.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            name: product?.name || 'Unknown Product',
            quantity: item.quantity,
          };
        })
      );

      // Update request with tracking ID
      await queryRunner.manager.update(Request, requestId, {
        trackingId: shippingOrder.trackingId,
        status: RequestStatus.SHIPPED,
      });

      // Create outbox message
      const outboxMessage = this.outboxRepository.create({
        requestId: request.id,
        eventType: EventType.SHIPPING_CREATED,
        eventData: {
          trackingId: shippingOrder.trackingId,
          address: user.address,
        },
      });
      await queryRunner.manager.save(outboxMessage);

      await queryRunner.commitTransaction();

      // Publish to message broker (outside transaction)
      try {
        await this.publishShippingCreated(requestId, shippingOrder.trackingId, user.address);

        // Mark as published
        await this.outboxRepository.update(
          { id: outboxMessage.id },
          { published: true, publishedAt: new Date() }
        );
      } catch (error) {
        console.error('Failed to publish to message broker:', error);
        // Message will be retried by outbox processor
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async publishShippingCreated(
    requestId: number,
    trackingId: string,
    address: string,
  ): Promise<void> {
    const params: SQS.SendMessageRequest = {
      QueueUrl: SQS_CONFIG.queueUrl,
      MessageBody: JSON.stringify({
        eventType: EventType.SHIPPING_CREATED,
        requestId,
        timestamp: new Date().toISOString(),
        data: {
          trackingId,
          address,
        },
      }),
      MessageAttributes: {
        EventType: {
          DataType: 'String',
          StringValue: EventType.SHIPPING_CREATED,
        },
        RequestId: {
          DataType: 'Number',
          StringValue: requestId.toString(),
        },
      },
    };

    await this.sqs.sendMessage(params).promise();
    console.log(`Shipping created event published for request ${requestId}`);
  }
}
