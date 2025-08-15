import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SQS } from 'aws-sdk';
import { Request } from './entities/request.entity';
import { RequestItem } from './entities/request-item.entity';
import { User } from './entities/user.entity';
import { OutboxMessage } from './entities/outbox-message.entity';
import { EventType, RequestStatus, SQS_CONFIG, AWS_CONFIG } from '@chargeflow/shared';
import { StripeService } from './stripe.service';

@Injectable()
export class BillingService {
  private readonly sqs: SQS;

  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(RequestItem)
    private readonly requestItemRepository: Repository<RequestItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OutboxMessage)
    private readonly outboxRepository: Repository<OutboxMessage>,
    private readonly stripeService: StripeService,
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

  async processPayment(requestId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get request with items and user
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

      // Verify price matches sum of products
      const items = await this.requestItemRepository.find({
        where: { requestId: request.id },
      });

      const calculatedTotal = items.reduce((sum, item) => sum + Number(item.price), 0);
      
      if (Math.abs(calculatedTotal - Number(request.totalPrice)) > 0.01) {
        throw new Error('Price mismatch detected');
      }

      // Process payment with Stripe
      const charge = await this.stripeService.createCharge(
        Number(request.totalPrice),
        user.customerId,
        {
          requestId: request.id.toString(),
          userId: request.userId.toString(),
        }
      );

      // Update request with charge ID
      await queryRunner.manager.update(Request, requestId, {
        chargeId: charge.id,
        status: RequestStatus.BILLED,
      });

      // Create outbox message
      const outboxMessage = this.outboxRepository.create({
        requestId: request.id,
        eventType: EventType.PAYMENT_PROCESSED,
        eventData: {
          chargeId: charge.id,
          amount: request.totalPrice,
          customerId: user.customerId,
        },
      });
      await queryRunner.manager.save(outboxMessage);

      await queryRunner.commitTransaction();

      // Publish to message broker (outside transaction)
      try {
        await this.publishPaymentProcessed(requestId, charge.id, request.totalPrice, user.customerId);

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

  private async publishPaymentProcessed(
    requestId: number,
    chargeId: string,
    amount: number,
    customerId: string,
  ): Promise<void> {
    const params: SQS.SendMessageRequest = {
      QueueUrl: SQS_CONFIG.queueUrl,
      MessageBody: JSON.stringify({
        eventType: EventType.PAYMENT_PROCESSED,
        requestId,
        timestamp: new Date().toISOString(),
        data: {
          chargeId,
          amount,
          customerId,
        },
      }),
      MessageAttributes: {
        EventType: {
          DataType: 'String',
          StringValue: EventType.PAYMENT_PROCESSED,
        },
        RequestId: {
          DataType: 'Number',
          StringValue: requestId.toString(),
        },
      },
    };

    await this.sqs.sendMessage(params).promise();
    console.log(`Payment processed event published for request ${requestId}`);
  }
}
