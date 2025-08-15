import { EventType } from './events';

export interface OutboxMessage {
  id: number;
  requestId: number;
  eventType: EventType;
  eventData: any;
  published: boolean;
  createdAt: Date;
  publishedAt?: Date;
}

export interface CreateOutboxMessageDto {
  requestId: number;
  eventType: EventType;
  eventData: any;
}
