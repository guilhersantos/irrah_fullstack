import { API_URL } from '../config';
import {
  Conversation,
  CreateConversationDto,
  UpdateConversationDto
} from '../types/messages';
import { authService } from './authService';

/**
 * Serviço para gerenciar conversas no sistema BCB
 */
export const conversationService = {
  /**
   * Obtém a lista de conversas do cliente
   */
  async getConversations(): Promise<Conversation[]> {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      const response = await fetch(`${API_URL}/conversations`, {
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
      
      // A API retorna diretamente um array de conversas
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Erro ao buscar conversas');
    }
  },
  
  /**
   * Obtém uma conversa específica
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      const response = await fetch(`${API_URL}/conversations/${conversationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao buscar conversa');
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Erro ao buscar conversa');
    }
  },
  
  /**
   * Cria uma nova conversa
   */
  async createConversation(data: CreateConversationDto): Promise<Conversation> {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      const response = await fetch(`${API_URL}/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar conversa');
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Erro ao criar conversa');
    }
  },
  
  /**
   * Atualiza o título de uma conversa
   */
  async updateConversation(conversationId: string, data: UpdateConversationDto): Promise<Conversation> {
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
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar conversa');
    }
    
    return await response.json();
  },
  
  /**
   * Arquiva uma conversa
   */
  async archiveConversation(conversationId: string): Promise<void> {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_URL}/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao arquivar conversa');
    }
  }
};
