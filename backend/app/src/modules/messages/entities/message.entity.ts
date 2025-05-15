import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Conversation } from '../../conversations/entities/conversation.entity';

export enum MessagePriority {
  NORMAL = 'normal',
  URGENT = 'urgent',
}

export enum MessageStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ name: 'conversation_id' })
  conversationId: string;

  @Column('text')
  content: string;

  @Column('jsonb')
  sentBy: {
    id: string;
    type: 'client' | 'admin';
  };

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({
    type: 'enum',
    enum: MessagePriority,
    default: MessagePriority.NORMAL,
  })
  priority: MessagePriority;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.QUEUED,
  })
  status: MessageStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cost: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
