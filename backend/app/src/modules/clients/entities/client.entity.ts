import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum DocumentType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
}

export enum PlanType {
  PREPAID = 'prepaid',
  POSTPAID = 'postpaid',
}

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  documentId: string; // CPF ou CNPJ

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType;

  @Column({
    type: 'enum',
    enum: PlanType,
  })
  planType: PlanType;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  balance: number; // Saldo para plano pré-pago

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  limit: number; // Limite para plano pós-pago

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
