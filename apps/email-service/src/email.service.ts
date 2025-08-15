import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { Request } from './entities/request.entity';
import { RequestItem } from './entities/request-item.entity';
import { User } from './entities/user.entity';
import { Product } from './entities/product.entity';
import { Invoice } from './entities/invoice.entity';
import { EventType } from '@chargeflow/shared';
import { EMAIL_CONFIG } from '@chargeflow/shared';
import { EmailTemplateService, EmailData } from './email-template.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(RequestItem)
    private readonly requestItemRepository: Repository<RequestItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly emailTemplateService: EmailTemplateService,
  ) {
    this.setupTransporter();
  }

  private setupTransporter() {
    this.transporter = nodemailer.createTransporter({
      host: EMAIL_CONFIG.smtp.host,
      port: EMAIL_CONFIG.smtp.port,
      secure: EMAIL_CONFIG.smtp.secure,
      auth: EMAIL_CONFIG.smtp.auth,
    });
  }

  async sendOrderConfirmationEmail(requestId: number): Promise<void> {
    const emailData = await this.getEmailData(requestId);
    const content = this.emailTemplateService.generateEmailContent('orderConfirmation', emailData);
    const subject = this.emailTemplateService.getEmailSubject('orderConfirmation', requestId);

    await this.sendEmail(emailData.customerName, content, subject);
  }

  async sendInvoiceGeneratedEmail(requestId: number): Promise<void> {
    const emailData = await this.getEmailData(requestId);
    
    // Get invoice URL
    const invoice = await this.invoiceRepository.findOne({
      where: { requestId },
    });
    if (invoice) {
      emailData.invoiceUrl = invoice.pdfUrl;
    }

    const content = this.emailTemplateService.generateEmailContent('invoiceGenerated', emailData);
    const subject = this.emailTemplateService.getEmailSubject('invoiceGenerated', requestId);

    await this.sendEmail(emailData.customerName, content, subject);
  }

  async sendPaymentProcessedEmail(requestId: number, chargeId: string): Promise<void> {
    const emailData = await this.getEmailData(requestId);
    emailData.chargeId = chargeId;

    const content = this.emailTemplateService.generateEmailContent('paymentProcessed', emailData);
    const subject = this.emailTemplateService.getEmailSubject('paymentProcessed', requestId);

    await this.sendEmail(emailData.customerName, content, subject);
  }

  async sendShippingCreatedEmail(requestId: number, trackingId: string): Promise<void> {
    const emailData = await this.getEmailData(requestId);
    emailData.trackingId = trackingId;

    const content = this.emailTemplateService.generateEmailContent('shippingCreated', emailData);
    const subject = this.emailTemplateService.getEmailSubject('shippingCreated', requestId);

    await this.sendEmail(emailData.customerName, content, subject);
  }

  async sendOrderCompletedEmail(requestId: number): Promise<void> {
    const emailData = await this.getEmailData(requestId);

    const content = this.emailTemplateService.generateEmailContent('orderCompleted', emailData);
    const subject = this.emailTemplateService.getEmailSubject('orderCompleted', requestId);

    await this.sendEmail(emailData.customerName, content, subject);
  }

  private async getEmailData(requestId: number): Promise<EmailData> {
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

    const productIds = request.items.map(item => item.productId);
    const products = await this.productRepository.findByIds(productIds);

    return {
      requestId: request.id,
      totalPrice: Number(request.totalPrice),
      products: request.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          name: product?.name || 'Unknown Product',
          quantity: item.quantity,
          price: Number(item.price),
        };
      }),
      customerName: user.email.split('@')[0], // Use email prefix as name
      address: user.address,
    };
  }

  private async sendEmail(to: string, html: string, subject: string): Promise<void> {
    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to,
      subject,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to} with subject: ${subject}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }
}
