import { API_URL } from '../config';
import {
  Conversation,
  Message,
  MessageStatus,
  CreateMessageDto,
  PaginatedMessagesResponse
} from '../types/messages';
import { authService } from './authService';

/**
 * Serviço para gerenciar mensagens e conversas
 */
class MessageService {
  /**
   * Calcula o custo da mensagem com base na prioridade
   */
  calculateMessageCost(priority: string): number {
    return priority === 'urgent' ? 0.50 : 0.25; // Custo fixo baseado na prioridade
  }
  
  /**
   * Busca as conversas do usuário
   */
  async getConversations(page: number = 1, limit: number = 10, isAdmin: boolean = false): Promise<{ conversations: Conversation[], total: number, page: number, limit: number }> {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    // Usar endpoint diferente para administradores e clientes
    const endpoint = isAdmin ? 'conversations/admin' : 'conversations';
    const response = await fetch(`${API_URL}/${endpoint}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar conversas');
    }
    
    const data = await response.json();
    
    // Adaptar a resposta do endpoint de administrador para o formato esperado pelo frontend
    if (isAdmin && Array.isArray(data)) {
      // Se a resposta for um array (endpoint de admin), converter para o formato esperado
      return {
        conversations: data,
        total: data.length,
        page: page,
        limit: limit
      };
    }
    
    // Se não for admin ou a resposta já estiver no formato esperado, retornar diretamente
    return data;
  }
  
  /**
   * Cria uma nova conversa
   */
  async createConversation(title: string): Promise<Conversation> {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar conversa');
    }
    
    return await response.json();
  }
  
  /**
   * Atualiza o título de uma conversa
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<Conversation> {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_URL}/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar título da conversa');
    }
    
    return await response.json();
  }
  
  /**
   * Busca mensagens de uma conversa
   */
  async getMessages(conversationId: string, page: number = 1, limit: number = 20): Promise<PaginatedMessagesResponse> {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    // Usar o endpoint correto conforme definido no backend
    const response = await fetch(`${API_URL}/messages/conversation/${conversationId}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar mensagens');
    }
    
    return await response.json();
  }
  
  /**
   * Busca mensagens desde um timestamp específico
   */
  async getMessagesSince(conversationId: string, since: Date): Promise<Message[]> {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const sinceTimestamp = since.toISOString();
    
    try {
      // Tentar usar o endpoint específico para mensagens desde um timestamp
      const response = await fetch(`${API_URL}/messages/conversation/${conversationId}?since=${sinceTimestamp}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.messages || [];
      }
      
      // Fallback: buscar todas as mensagens e filtrar pelo timestamp no cliente
      console.warn('Endpoint de mensagens desde timestamp não disponível, usando fallback');
      const allMessages = await this.getMessages(conversationId);
      
      return allMessages.messages.filter(message => {
        const messageDate = new Date(message.timestamp);
        return messageDate > since;
      });
    } catch (error) {
      console.error('Erro ao buscar mensagens desde timestamp:', error);
      return [];
    }
  }
  
  /**
   * Envia uma nova mensagem
   */
  async sendMessage(message: CreateMessageDto): Promise<Message> {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao enviar mensagem');
    }
    
    return await response.json();
  }
  
  /**
   * Atualiza o status de uma mensagem
   */
  async updateMessageStatus(messageId: string, status: MessageStatus): Promise<Message> {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_URL}/messages/${messageId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar status da mensagem');
    }
    
    return await response.json();
  }
  
  /**
   * Arquiva uma conversa
   */
  async archiveConversation(conversationId: string): Promise<void> {
    return await this.handleRequest(`${API_URL}/conversations/${conversationId}`, 'DELETE');
  }
  
  /**
   * Método auxiliar para reduzir duplicação de código em requisições
   */
  async handleRequest(url: string, method: string, body?: any): Promise<any> {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Erro na requisição ${method} para ${url}`);
    }
    
    if (method === 'DELETE') {
      return;
    }
    
    return await response.json();
  }
}

// Exportar uma instância única do serviço
export const messageService = new MessageService();
