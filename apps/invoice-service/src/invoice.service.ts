import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SQS } from 'aws-sdk';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { Request } from './entities/request.entity';
import { RequestItem } from './entities/request-item.entity';
import { Product } from './entities/product.entity';
import { Invoice } from './entities/invoice.entity';
import { OutboxMessage } from './entities/outbox-message.entity';
import { EventType, RequestStatus, SQS_CONFIG, AWS_CONFIG } from '@chargeflow/shared';

@Injectable()
export class InvoiceService {
  private readonly sqs: SQS;

  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(RequestItem)
    private readonly requestItemRepository: Repository<RequestItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(OutboxMessage)
    private readonly outboxRepository: Repository<OutboxMessage>,
    private readonly dataSource: DataSource,
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

  async processInvoiceGeneration(requestId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get request with items and products
      const request = await this.requestRepository.findOne({
        where: { id: requestId },
        relations: ['items'],
      });

      if (!request) {
        throw new Error(`Request ${requestId} not found`);
      }

      const productIds = request.items.map(item => item.productId);
      const products = await this.productRepository.findByIds(productIds);

      // Generate PDF invoice
      const pdfUrl = await this.generateInvoicePDF(request, request.items, products);

      // Create invoice record
      const invoice = this.invoiceRepository.create({
        requestId: request.id,
        pdfUrl,
      });
      const savedInvoice = await queryRunner.manager.save(invoice);

      // Update request status
      await queryRunner.manager.update(Request, requestId, {
        status: RequestStatus.INVOICED,
      });

      // Create outbox message
      const outboxMessage = this.outboxRepository.create({
        requestId: request.id,
        eventType: EventType.INVOICE_GENERATED,
        eventData: {
          invoiceId: savedInvoice.id,
          pdfUrl: savedInvoice.pdfUrl,
          totalPrice: request.totalPrice,
        },
      });
      await queryRunner.manager.save(outboxMessage);

      await queryRunner.commitTransaction();

      // Publish to message broker (outside transaction)
      try {
        await this.publishInvoiceGenerated(requestId, savedInvoice.id, pdfUrl, request.totalPrice);

        // Mark as published
        await this.outboxRepository.update(
          { id: outboxMessage.id },
          { published: true, publishedAt: new Date() }
        );
      } catch (error) {
        console.error('Failed to publish to message broker:', error);
        // Message will be retried by outbox processor
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async generateInvoicePDF(
    request: Request,
    items: RequestItem[],
    products: Product[],
  ): Promise<string> {
    const doc = new PDFDocument();
    const filename = `invoice-${request.id}-${Date.now()}.pdf`;
    const filepath = path.join(process.cwd(), 'invoices', filename);

    // Ensure invoices directory exists
    const invoicesDir = path.dirname(filepath);
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Generate PDF content
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice #: ${request.id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Total Amount: $${request.totalPrice.toFixed(2)}`);
    doc.moveDown();

    // Add items table
    doc.fontSize(14).text('Items:', { underline: true });
    doc.moveDown();

    items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      doc.fontSize(10).text(
        `${product?.name || 'Unknown Product'} - Qty: ${item.quantity} - Price: $${item.price.toFixed(2)}`
      );
    });

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve(`/invoices/${filename}`);
      });
      stream.on('error', reject);
    });
  }

  private async publishInvoiceGenerated(
    requestId: number,
    invoiceId: number,
    pdfUrl: string,
    totalPrice: number,
  ): Promise<void> {
    const params: SQS.SendMessageRequest = {
      QueueUrl: SQS_CONFIG.queueUrl,
      MessageBody: JSON.stringify({
        eventType: EventType.INVOICE_GENERATED,
        requestId,
        timestamp: new Date().toISOString(),
        data: {
          invoiceId,
          pdfUrl,
          totalPrice,
        },
      }),
      MessageAttributes: {
        EventType: {
          DataType: 'String',
          StringValue: EventType.INVOICE_GENERATED,
        },
        RequestId: {
          DataType: 'Number',
          StringValue: requestId.toString(),
        },
      },
    };

    await this.sqs.sendMessage(params).promise();
    console.log(`Invoice generated event published for request ${requestId}`);
  }
}
