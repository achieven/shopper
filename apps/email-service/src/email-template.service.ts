import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { EMAIL_CONFIG } from '@shopflow/shared';

export interface EmailData {
  requestId: number;
  totalPrice: number;
  products: Array<{ name: string; quantity: number; price: number }>;
  invoiceUrl?: string;
  chargeId?: string;
  trackingId?: string;
  customerName?: string;
  address?: string;
}

@Injectable()
export class EmailTemplateService {
  private readonly templates = {
    orderConfirmation: Handlebars.compile(`
      <h2>Order Confirmation</h2>
      <p>Dear {{customerName}},</p>
      <p>Thank you for your order! Your order has been confirmed and is being processed.</p>
      
      <h3>Order Details:</h3>
      <p><strong>Order ID:</strong> {{requestId}}</p>
      <p><strong>Total Amount:</strong> ${{totalPrice}}</p>
      
      <h3>Items:</h3>
      <ul>
        {{#each products}}
          <li>{{name}} - Qty: {{quantity}} - Price: ${{price}}</li>
        {{/each}}
      </ul>
      
      <p>We'll send you updates as your order progresses.</p>
    `),

    invoiceGenerated: Handlebars.compile(`
      <h2>Invoice Generated</h2>
      <p>Dear {{customerName}},</p>
      <p>Your invoice has been generated for order #{{requestId}}.</p>
      
      <h3>Invoice Details:</h3>
      <p><strong>Order ID:</strong> {{requestId}}</p>
      <p><strong>Total Amount:</strong> ${{totalPrice}}</p>
      {{#if invoiceUrl}}
        <p><a href="{{invoiceUrl}}">Download Invoice</a></p>
      {{/if}}
      
      <p>Payment will be processed shortly.</p>
    `),

    paymentProcessed: Handlebars.compile(`
      <h2>Payment Processed</h2>
      <p>Dear {{customerName}},</p>
      <p>Your payment has been successfully processed for order #{{requestId}}.</p>
      
      <h3>Payment Details:</h3>
      <p><strong>Order ID:</strong> {{requestId}}</p>
      <p><strong>Amount Charged:</strong> ${{totalPrice}}</p>
      <p><strong>Transaction ID:</strong> {{chargeId}}</p>
      
      <p>Your order is now being prepared for shipping.</p>
    `),

    shippingCreated: Handlebars.compile(`
      <h2>Order Shipped</h2>
      <p>Dear {{customerName}},</p>
      <p>Your order #{{requestId}} has been shipped!</p>
      
      <h3>Shipping Details:</h3>
      <p><strong>Order ID:</strong> {{requestId}}</p>
      <p><strong>Tracking Number:</strong> {{trackingId}}</p>
      <p><strong>Shipping Address:</strong> {{address}}</p>
      
      <p>You can track your package using the tracking number above.</p>
    `),

    orderCompleted: Handlebars.compile(`
      <h2>Order Completed</h2>
      <p>Dear {{customerName}},</p>
      <p>Your order #{{requestId}} has been completed successfully!</p>
      
      <h3>Order Summary:</h3>
      <p><strong>Order ID:</strong> {{requestId}}</p>
      <p><strong>Total Amount:</strong> ${{totalPrice}}</p>
      <p><strong>Tracking Number:</strong> {{trackingId}}</p>
      
      <p>Thank you for choosing our service!</p>
    `),
  };

  generateEmailContent(eventType: string, data: EmailData): string {
    const template = this.templates[eventType];
    if (!template) {
      throw new Error(`Email template not found for event type: ${eventType}`);
    }

    return template(data);
  }

  getEmailSubject(eventType: string, requestId: number): string {
    const subjects = {
      orderConfirmation: `Order Confirmation - #${requestId}`,
      invoiceGenerated: `Invoice Generated - Order #${requestId}`,
      paymentProcessed: `Payment Processed - Order #${requestId}`,
      shippingCreated: `Order Shipped - #${requestId}`,
      orderCompleted: `Order Completed - #${requestId}`,
    };

    return subjects[eventType] || `Order Update - #${requestId}`;
  }
}
