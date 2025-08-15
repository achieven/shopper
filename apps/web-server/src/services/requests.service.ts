import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Request } from '../entities/request.entity';
import { RequestItem } from '../entities/request-item.entity';
import { OutboxMessage } from '../entities/outbox-message.entity';
import { Product } from '../entities/product.entity';
import { CreateRequestDto, EventType, RequestStatus } from '@shopflow/shared';
import { MessageBrokerService } from './message-broker.service';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(RequestItem)
    private readonly requestItemRepository: Repository<RequestItem>,
    @InjectRepository(OutboxMessage)
    private readonly outboxRepository: Repository<OutboxMessage>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly messageBrokerService: MessageBrokerService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createRequestDto: CreateRequestDto): Promise<Request> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get products with prices
      const productIds = createRequestDto.products.map(p => p.id);
      const products = await this.productRepository.findByIds(productIds);
      
      // Calculate total price
      const totalPrice = createRequestDto.products.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        return sum + (product?.price || 0) * item.quantity;
      }, 0);

      // Create request
      const request = this.requestRepository.create({
        userId: createRequestDto.userId,
        totalPrice,
        status: RequestStatus.PENDING,
      });
      const savedRequest = await queryRunner.manager.save(request);

      // Create request items
      const requestItems = createRequestDto.products.map(item => {
        const product = products.find(p => p.id === item.id);
        return this.requestItemRepository.create({
          requestId: savedRequest.id,
          productId: item.id,
          quantity: item.quantity,
          price: product?.price || 0,
        });
      });
      await queryRunner.manager.save(requestItems);

      // Create outbox message
      const outboxMessage = this.outboxRepository.create({
        requestId: savedRequest.id,
        eventType: EventType.REQUEST_CREATED,
        eventData: {
          userId: createRequestDto.userId,
          totalPrice,
          products: createRequestDto.products.map(item => {
            const product = products.find(p => p.id === item.id);
            return {
              id: item.id,
              quantity: item.quantity,
              price: product?.price || 0,
            };
          }),
        },
      });
      await queryRunner.manager.save(outboxMessage);

      await queryRunner.commitTransaction();

      // Publish to message broker (outside transaction)
      try {
        await this.messageBrokerService.publishEvent({
          eventType: EventType.REQUEST_CREATED,
          requestId: savedRequest.id,
          timestamp: new Date(),
          data: outboxMessage.eventData,
        });

        // Mark as published
        await this.outboxRepository.update(
          { id: outboxMessage.id },
          { published: true, publishedAt: new Date() }
        );
      } catch (error) {
        console.error('Failed to publish to message broker:', error);
        // Message will be retried by outbox processor
      }

      return savedRequest;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
