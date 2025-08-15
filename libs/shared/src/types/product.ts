import { IsNumber, IsPositive, IsInt } from 'class-validator';

export class Product {
  @IsInt()
  @IsPositive()
  id: number;

  @IsInt()
  @IsPositive()
  quantity: number;
}

export class ProductInfo {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface ProductPrice {
  id: number;
  price: number;
}
