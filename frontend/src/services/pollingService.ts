import { messageService } from './messageService';
import { Message } from '../types/messages';

class PollingService {
  private pollingIntervals: Map<string, number> = new Map();
  private messageListeners: Map<string, ((messages: Message[]) => void)[]> = new Map();
  private lastMessageTimestamp: Map<string, Date> = new Map();

  /**
   * Inicia o polling para uma conversa específica
   * @param conversationId ID da conversa
   * @param interval Intervalo em milissegundos (padrão: 1000ms = 1s)
   */
  startPolling(conversationId: string, interval: number = 1000) {
    // Parar polling anterior se existir
    this.stopPolling(conversationId);

    // Inicializar o timestamp da última mensagem
    if (!this.lastMessageTimestamp.has(conversationId)) {
      this.lastMessageTimestamp.set(conversationId, new Date());
    }

    // Criar um novo intervalo de polling
    const pollingInterval = setInterval(async () => {
      try {
        // Obter o timestamp da última mensagem
        const lastTimestamp = this.lastMessageTimestamp.get(conversationId);
        
        if (lastTimestamp) {
          // Buscar novas mensagens desde o último timestamp
          const messages = await messageService.getMessagesSince(conversationId, lastTimestamp);
          
          if (messages && messages.length > 0) {
            console.log(`Polling: ${messages.length} novas mensagens encontradas`);
            
            // Atualizar o timestamp da última mensagem
            const latestMessage = messages.reduce((latest: Date, msg: Message) => {
              const msgTime = new Date(msg.timestamp);
              return msgTime > latest ? msgTime : latest;
            }, lastTimestamp);
            
            this.lastMessageTimestamp.set(conversationId, latestMessage);
            
            // Notificar os listeners
            this.notifyMessageListeners(conversationId, messages);
          }
        }
      } catch (error) {
        console.error('Erro durante polling de mensagens:', error);
      }
    }, interval);

    // Armazenar a referência do intervalo
    this.pollingIntervals.set(conversationId, pollingInterval);
    
    console.log(`Polling iniciado para conversa ${conversationId} a cada ${interval}ms`);
  }

  /**
   * Para o polling para uma conversa específica
   * @param conversationId ID da conversa
   */
  stopPolling(conversationId: string) {
    const interval = this.pollingIntervals.get(conversationId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(conversationId);
      console.log(`Polling parado para conversa ${conversationId}`);
    }
  }

  /**
   * Adiciona um listener para novas mensagens
   * @param conversationId ID da conversa
   * @param callback Função de callback para novas mensagens
   */
  addMessageListener(conversationId: string, callback: (messages: any[]) => void) {
    if (!this.messageListeners.has(conversationId)) {
      this.messageListeners.set(conversationId, []);
    }
    this.messageListeners.get(conversationId)?.push(callback);
  }

  /**
   * Remove um listener de mensagens
   * @param conversationId ID da conversa
   * @param callback Função de callback a ser removida
   */
  removeMessageListener(conversationId: string, callback: (messages: any[]) => void) {
    const listeners = this.messageListeners.get(conversationId);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Notifica todos os listeners de uma conversa sobre novas mensagens
   * @param conversationId ID da conversa
   * @param messages Lista de novas mensagens
   */
  private notifyMessageListeners(conversationId: string, messages: any[]) {
    const listeners = this.messageListeners.get(conversationId);
    if (listeners) {
      listeners.forEach(callback => callback(messages));
    }
  }

  /**
   * Reseta o timestamp da última mensagem para uma conversa
   * @param conversationId ID da conversa
   */
  resetLastMessageTimestamp(conversationId: string) {
    this.lastMessageTimestamp.set(conversationId, new Date());
  }
}

// Exportar uma instância única do serviço
export const pollingService = new PollingService();
