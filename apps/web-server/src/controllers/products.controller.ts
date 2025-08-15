import { Controller, Get } from '@nestjs/common';
import { ProductsService } from '../services/products.service';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll() {
    return this.productsService.findAll();
  }
}
