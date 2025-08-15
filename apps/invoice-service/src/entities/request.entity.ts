import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RequestItem } from './request-item.entity';
import { RequestStatus } from '@shopflow/shared';

@Entity('requests')
export class Request {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ name: 'charge_id', nullable: true })
  chargeId: string;

  @Column({ name: 'tracking_id', nullable: true })
  trackingId: string;

  @Column({ type: 'varchar', length: 50, default: RequestStatus.PENDING })
  status: RequestStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => RequestItem, item => item.request)
  items: RequestItem[];
}
