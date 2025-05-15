/**
 * Tipos para o sistema de mensagens BCB (Big Chat Brasil)
 */

// Prioridade da mensagem como string literal para compatibilidade
export type MessagePriority = 'normal' | 'urgent';

// Constantes para uso nos componentes
export const MESSAGE_PRIORITY = {
  NORMAL: 'normal' as MessagePriority,
  URGENT: 'urgent' as MessagePriority
};

// Status da mensagem
export enum MessageStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

// Tipo de usuário
export type UserType = 'client' | 'admin';

// Conversa
export interface Conversation {
  id: string;
  title: string;
  clientId: string;
  client?: any; // Referência ao cliente associado à conversa
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

// Requisição para criar uma conversa
export interface CreateConversationDto {
  title: string;
}

// Requisição para atualizar uma conversa
export interface UpdateConversationDto {
  title: string;
}

// Requisição para enviar mensagem
export interface CreateMessageDto {
  conversationId: string;     // ID da conversa existente
  content: string;
  priority?: MessagePriority;
}

// Alias para SendMessageRequest (usado no frontend)
export interface SendMessageRequest {
  conversationId: string;
  content: string;
  priority: MessagePriority | string;
}

// Requisição para atualizar status da mensagem
export interface UpdateMessageStatusDto {
  status: MessageStatus;
}

// Mensagem
export interface Message {
  id: string;
  conversationId: string;
  content: string;
  sentBy: {
    id: string;
    type: 'client' | 'admin';
  } | string; // Pode ser um objeto ou uma string para compatibilidade com código existente
  timestamp: Date;
  priority: MessagePriority;
  status: MessageStatus;
  cost: number;
  createdAt: Date;
  updatedAt: Date;
}

// Resposta paginada de mensagens
export interface PaginatedMessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}
