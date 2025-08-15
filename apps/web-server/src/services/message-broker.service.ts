import { Injectable } from '@nestjs/common';
import { InjectAwsService } from '@nestjs/aws-sdk';
import { SQS } from 'aws-sdk';
import { Event, EventType } from '@chargeflow/shared';
import { SQS_CONFIG } from '@chargeflow/shared';

@Injectable()
export class MessageBrokerService {
  constructor(
    @InjectAwsService(SQS)
    private readonly sqs: SQS,
  ) {}

  async publishEvent(event: Event): Promise<void> {
    const params: SQS.SendMessageRequest = {
      QueueUrl: SQS_CONFIG.queueUrl,
      MessageBody: JSON.stringify({
        ...event,
        timestamp: event.timestamp.toISOString(),
      }),
      MessageAttributes: {
        EventType: {
          DataType: 'String',
          StringValue: event.eventType,
        },
        RequestId: {
          DataType: 'Number',
          StringValue: event.requestId.toString(),
        },
      },
    };

    try {
      await this.sqs.sendMessage(params).promise();
      console.log(`Event published: ${event.eventType} for request ${event.requestId}`);
    } catch (error) {
      console.error('Failed to publish event to SQS:', error);
      throw error;
    }
  }

  async publishInvoiceGenerated(requestId: number, invoiceId: number, pdfUrl: string, totalPrice: number): Promise<void> {
    await this.publishEvent({
      eventType: EventType.INVOICE_GENERATED,
      requestId,
      timestamp: new Date(),
      data: {
        invoiceId,
        pdfUrl,
        totalPrice,
      },
    });
  }

  async publishPaymentProcessed(requestId: number, chargeId: string, amount: number, customerId: string): Promise<void> {
    await this.publishEvent({
      eventType: EventType.PAYMENT_PROCESSED,
      requestId,
      timestamp: new Date(),
      data: {
        chargeId,
        amount,
        customerId,
      },
    });
  }

  async publishShippingCreated(requestId: number, trackingId: string, address: string): Promise<void> {
    await this.publishEvent({
      eventType: EventType.SHIPPING_CREATED,
      requestId,
      timestamp: new Date(),
      data: {
        trackingId,
        address,
      },
    });
  }

  async publishOrderCompleted(requestId: number, status: string): Promise<void> {
    await this.publishEvent({
      eventType: EventType.ORDER_COMPLETED,
      requestId,
      timestamp: new Date(),
      data: {
        requestId,
        status,
      },
    });
  }
}
