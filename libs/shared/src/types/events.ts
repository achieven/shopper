import { RequestStatus } from './request';

export enum EventType {
  REQUEST_CREATED = 'request.created',
  INVOICE_GENERATED = 'invoice.generated',
  PAYMENT_PROCESSED = 'payment.processed',
  SHIPPING_CREATED = 'shipping.created',
  ORDER_COMPLETED = 'order.completed'
}

export interface BaseEvent {
  eventType: EventType;
  requestId: number;
  timestamp: Date;
  data: any;
}

export interface RequestCreatedEvent extends BaseEvent {
  eventType: EventType.REQUEST_CREATED;
  data: {
    userId: number;
    totalPrice: number;
    products: Array<{
      id: number;
      quantity: number;
      price: number;
    }>;
  };
}

export interface InvoiceGeneratedEvent extends BaseEvent {
  eventType: EventType.INVOICE_GENERATED;
  data: {
    invoiceId: number;
    pdfUrl: string;
    totalPrice: number;
  };
}

export interface PaymentProcessedEvent extends BaseEvent {
  eventType: EventType.PAYMENT_PROCESSED;
  data: {
    chargeId: string;
    amount: number;
    customerId: string;
  };
}

export interface ShippingCreatedEvent extends BaseEvent {
  eventType: EventType.SHIPPING_CREATED;
  data: {
    trackingId: string;
    address: string;
  };
}

export interface OrderCompletedEvent extends BaseEvent {
  eventType: EventType.ORDER_COMPLETED;
  data: {
    requestId: number;
    status: RequestStatus;
  };
}

export type Event = 
  | RequestCreatedEvent 
  | InvoiceGeneratedEvent 
  | PaymentProcessedEvent 
  | ShippingCreatedEvent 
  | OrderCompletedEvent;
