import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'request_id' })
  requestId: number;

  @Column({ name: 'pdf_url', type: 'text' })
  pdfUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
