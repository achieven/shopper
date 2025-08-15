export interface User {
  id: number;
  email: string;
  customerId: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAddress {
  id: number;
  address: string;
}
