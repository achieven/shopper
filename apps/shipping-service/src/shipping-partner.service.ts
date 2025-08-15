import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SHIPPING_CONFIG } from '@chargeflow/shared';

export interface ShippingOrder {
  trackingId: string;
  status: string;
  estimatedDelivery: string;
}

@Injectable()
export class ShippingPartnerService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = SHIPPING_CONFIG.apiKey;
    this.baseUrl = SHIPPING_CONFIG.baseUrl;
  }

  async createShippingOrder(
    address: string,
    items: Array<{ name: string; quantity: number }>,
  ): Promise<ShippingOrder> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/orders`,
        {
          destination: address,
          items,
          service: 'standard',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        trackingId: response.data.tracking_id,
        status: response.data.status,
        estimatedDelivery: response.data.estimated_delivery,
      };
    } catch (error) {
      // For demo purposes, return a mock response
      console.log('Shipping partner API call failed, using mock response');
      return {
        trackingId: `TRK${Date.now()}`,
        status: 'created',
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      };
    }
  }

  async getShippingStatus(trackingId: string): Promise<ShippingOrder> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/orders/${trackingId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return {
        trackingId: response.data.tracking_id,
        status: response.data.status,
        estimatedDelivery: response.data.estimated_delivery,
      };
    } catch (error) {
      // For demo purposes, return a mock response
      console.log('Shipping partner API call failed, using mock response');
      return {
        trackingId,
        status: 'in_transit',
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      };
    }
  }
}
