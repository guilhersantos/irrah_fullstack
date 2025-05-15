/**
 * Tipos e interfaces para o sistema BCB (Big Chat Brasil)
 */

// Prioridade da mensagem
export enum MessagePriority {
  NORMAL = 'normal',
  URGENT = 'urgent',
}

// Status da mensagem
export enum MessageStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

// Interface para mensagem
export interface Message {
  id: string;
  conversationId: string;
  content: string;
  sentBy: {
    id: string;
    type: 'client' | 'admin';
  };
  timestamp: Date;
  priority: MessagePriority;
  status: MessageStatus;
  cost: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para conversa
export interface Conversation {
  id: string;
  title: string;
  clientId: string;
  lastMessage?: {
    content: string;
    timestamp: Date;
    sentByClient: boolean;
  };
  unreadCount: {
    client: number;
    admin: number;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para criação de mensagem
export interface CreateMessageDto {
  conversationId: string;
  content: string;
  priority?: MessagePriority;
}

// Interface para criação de conversa
export interface CreateConversationDto {
  title: string;
}

// Interface para atualização de conversa
export interface UpdateConversationDto {
  title: string;
}

// Interface para resposta paginada de mensagens
export interface PaginatedMessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}
