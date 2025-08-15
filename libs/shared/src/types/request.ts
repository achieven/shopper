import { Product } from './product';

export interface CreateRequestDto {
  userId: number;
  products: Product[];
}

export interface Request {
  id: number;
  userId: number;
  totalPrice: number;
  chargeId?: string;
  trackingId?: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequestItem {
  id: number;
  requestId: number;
  productId: number;
  quantity: number;
  price: number;
  createdAt: Date;
}

export enum RequestStatus {
  PENDING = 'pending',
  INVOICED = 'invoiced',
  BILLED = 'billed',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface Invoice {
  id: number;
  requestId: number;
  pdfUrl: string;
  createdAt: Date;
}
