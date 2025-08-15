import { Injectable, OnModuleInit } from '@nestjs/common';
import { SQS } from 'aws-sdk';
import { EventType, SQS_CONFIG, AWS_CONFIG } from '@shopflow/shared';
import { ShippingService } from './shipping.service';

@Injectable()
export class SqsConsumerService implements OnModuleInit {
  private readonly sqs: SQS;

  constructor(
    private readonly shippingService: ShippingService,
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

  async onModuleInit() {
    await this.startPolling();
  }

  private async startPolling() {
    console.log('Starting SQS polling for Shipping Service...');
    
    setInterval(async () => {
      try {
        await this.pollMessages();
      } catch (error) {
        console.error('Error polling SQS messages:', error);
      }
    }, 5000); // Poll every 5 seconds
  }

  private async pollMessages() {
    const params: SQS.ReceiveMessageRequest = {
      QueueUrl: SQS_CONFIG.queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
      MessageAttributeNames: ['All'],
    };

    try {
      const result = await this.sqs.receiveMessage(params).promise();
      
      if (result.Messages) {
        for (const message of result.Messages) {
          await this.processMessage(message);
        }
      }
    } catch (error) {
      console.error('Error receiving messages from SQS:', error);
    }
  }

  private async processMessage(message: SQS.Message) {
    try {
      const body = JSON.parse(message.Body || '{}');
      const eventType = body.eventType;
      const requestId = body.requestId;

      console.log(`Processing message: ${eventType} for request ${requestId}`);

      if (eventType === EventType.PAYMENT_PROCESSED) {
        await this.shippingService.processShipping(requestId);
      }

      // Delete the message after successful processing
      await this.deleteMessage(message.ReceiptHandle);
    } catch (error) {
      console.error('Error processing message:', error);
      // In a real application, you might want to move the message to a DLQ
    }
  }

  private async deleteMessage(receiptHandle: string) {
    const params: SQS.DeleteMessageRequest = {
      QueueUrl: SQS_CONFIG.queueUrl,
      ReceiptHandle: receiptHandle,
    };

    try {
      await this.sqs.deleteMessage(params).promise();
      console.log('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }
}
