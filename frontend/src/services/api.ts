/**
 * Serviço de API para o sistema BCB (Big Chat Brasil)
 */
import { API_URL } from '../config';
import { 
  Conversation, 
  CreateConversationDto, 
  UpdateConversationDto, 
  Message, 
  CreateMessageDto, 
  PaginatedMessagesResponse 
} from '../types';

// Token de autenticação (será preenchido após o login)
let authToken = '';

/**
 * Define o token de autenticação para as requisições
 */
export const setAuthToken = (token: string) => {
  authToken = token;
};

/**
 * Opções padrão para as requisições
 */
const getDefaultOptions = (method = 'GET', body?: any) => {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
  };

  if (authToken) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${authToken}`,
    };
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
};

/**
 * Realiza uma requisição para a API
 */
const fetchApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  try {
    const response = await fetch(`${API_URL}/${endpoint}`, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error(`Erro ao acessar ${endpoint}:`, error);
    throw error;
  }
};

/**
 * API de Conversas
 */
export const ConversationsApi = {
  /**
   * Obtém todas as conversas do cliente
   */
  getAll: async (): Promise<Conversation[]> => {
    return fetchApi<Conversation[]>('conversations', getDefaultOptions());
  },
  
  /**
   * Obtém uma conversa específica
   */
  getById: async (conversationId: string): Promise<Conversation> => {
    return fetchApi<Conversation>(`conversations/${conversationId}`, getDefaultOptions());
  },
  
  /**
   * Cria uma nova conversa
   */
  create: async (data: CreateConversationDto): Promise<Conversation> => {
    return fetchApi<Conversation>('conversations', getDefaultOptions('POST', data));
  },
  
  /**
   * Atualiza o título de uma conversa
   */
  update: async (conversationId: string, data: UpdateConversationDto): Promise<Conversation> => {
    return fetchApi<Conversation>(`conversations/${conversationId}`, getDefaultOptions('PATCH', data));
  },
  
  /**
   * Arquiva uma conversa
   */
  archive: async (conversationId: string): Promise<void> => {
    return fetchApi<void>(`conversations/${conversationId}`, getDefaultOptions('DELETE'));
  },
};

/**
 * API de Mensagens
 */
export const MessagesApi = {
  /**
   * Envia uma nova mensagem
   */
  send: async (data: CreateMessageDto): Promise<Message> => {
    return fetchApi<Message>('messages', getDefaultOptions('POST', data));
  },
  
  /**
   * Obtém mensagens de uma conversa
   */
  getByConversation: async (conversationId: string, page = 1, limit = 20): Promise<PaginatedMessagesResponse> => {
    return fetchApi<PaginatedMessagesResponse>(
      `messages/conversation/${conversationId}?page=${page}&limit=${limit}`, 
      getDefaultOptions()
    );
  },
  
  /**
   * Atualiza o status de uma mensagem
   */
  updateStatus: async (messageId: string, status: string): Promise<Message> => {
    return fetchApi<Message>(`messages/${messageId}/status`, getDefaultOptions('PATCH', { status }));
  },
};
