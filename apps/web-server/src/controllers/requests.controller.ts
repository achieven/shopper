import { Controller, Post, Body } from '@nestjs/common';
import { RequestsService } from '../services/requests.service';
import { CreateRequestDto } from '@chargeflow/shared';

@Controller('api/requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  async create(@Body() createRequestDto: CreateRequestDto) {
    return this.requestsService.create(createRequestDto);
  }
}
