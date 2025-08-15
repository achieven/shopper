import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { STRIPE_CONFIG } from '@shopflow/shared';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(STRIPE_CONFIG.secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(amount: number, customerId: string, metadata: any): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  async createCharge(amount: number, customerId: string, metadata: any): Promise<Stripe.Charge> {
    return this.stripe.charges.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      metadata,
      source: 'tok_visa', // For testing purposes
    });
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    return this.stripe.customers.retrieve(customerId) as Promise<Stripe.Customer>;
  }
}
