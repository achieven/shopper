import { Injectable } from '@nestjs/common';
import { SQS } from 'aws-sdk';
import { Event, EventType, SQS_CONFIG, AWS_CONFIG, RequestStatus } from '@shopflow/shared';

@Injectable()
export class MessageBrokerService {
  private readonly sqs: SQS;

  constructor() {
    this.sqs = new SQS({
      region: AWS_CONFIG.region,
      endpoint: AWS_CONFIG.endpoint,
      credentials: {
        accessKeyId: AWS_CONFIG.accessKeyId || 'test',
        secretAccessKey: AWS_CONFIG.secretAccessKey || 'test',
      },
    });
  }

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

  async publishOrderCompleted(requestId: number, status: RequestStatus): Promise<void> {
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
