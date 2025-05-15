import { io, Socket } from 'socket.io-client';
import { authService } from './authService';

// URL do servidor WebSocket (mesma URL do backend)
const SOCKET_URL = 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private messageListeners: Map<string, ((message: any) => void)[]> = new Map();
  private connectionListeners: ((connected: boolean) => void)[] = [];

  /**
   * Inicializa a conexão com o servidor WebSocket
   */
  connect() {
    if (this.socket) {
      // Se já existe um socket, verificar se está conectado
      if (this.socket.connected) {
        console.log('Já conectado ao servidor WebSocket');
        return;
      } else {
        // Se existe mas não está conectado, tentar reconectar
        console.log('Tentando reconectar ao servidor WebSocket...');
        this.socket.connect();
        return;
      }
    }

    const token = authService.getToken();
    if (!token) {
      console.error('Não é possível conectar ao WebSocket: usuário não autenticado');
      this.notifyConnectionListeners(false);
      return;
    }

    // Inicializar o socket com autenticação
    this.socket = io(SOCKET_URL, {
      auth: {
        token: `Bearer ${token}`
      },
      transports: ['polling', 'websocket'], // Usar polling primeiro e depois tentar websocket
      reconnection: true,                   // Habilitar reconexão automática
      reconnectionAttempts: 5,             // Número máximo de tentativas
      reconnectionDelay: 1000,             // Tempo entre tentativas (ms)
      timeout: 20000,                      // Timeout da conexão (ms)
      forceNew: true,                      // Forçar nova conexão
      path: '/socket.io/',                 // Caminho padrão para Socket.IO
      upgrade: true,                       // Permitir upgrade para WebSocket
      rememberUpgrade: true,               // Lembrar upgrade entre conexões
      autoConnect: true                    // Conectar automaticamente
    });

    // Configurar listeners para eventos de conexão
    this.socket.on('connect', () => {
      console.log('Conectado ao servidor WebSocket');
      this.notifyConnectionListeners(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`Desconectado do servidor WebSocket: ${reason}`);
      this.notifyConnectionListeners(false);
      
      // Se a desconexão não foi iniciada pelo cliente, tentar reconectar
      if (reason === 'io server disconnect') {
        // O servidor forçou a desconexão, reconectar manualmente
        this.socket?.connect();
      }
      // Para outros motivos, a reconexão automática será tentada
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro ao conectar ao WebSocket:', error);
      this.notifyConnectionListeners(false);
    });
    
    // Adicionar listener para erros de autenticação
    this.socket.on('connection_error', (error) => {
      console.error('Erro de conexão WebSocket:', error);
      this.notifyConnectionListeners(false);
    });
    
    // Adicionar listener para erros gerais
    this.socket.on('error', (error) => {
      console.error('Erro no WebSocket:', error);
      this.notifyConnectionListeners(false);
    });

    // Configurar listeners para eventos de mensagens
    this.socket.on('new_message', (message) => {
      console.log('Nova mensagem recebida via WebSocket:', message);
      this.notifyMessageListeners('message', message);
    });

    this.socket.on('client_message', (message) => {
      console.log('Nova mensagem de cliente recebida via WebSocket:', message);
      this.notifyMessageListeners('client_message', message);
    });

    this.socket.on('admin_message', (message) => {
      console.log('Nova mensagem de admin recebida via WebSocket:', message);
      this.notifyMessageListeners('admin_message', message);
    });
  }

  /**
   * Desconecta do servidor WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Entra em uma sala de conversa específica
   */
  joinConversation(conversationId: string) {
    if (!this.socket) {
      console.error('Não é possível entrar na conversa: socket não inicializado');
      return;
    }

    this.socket.emit('join_conversation', { conversationId });
    console.log(`Entrando na conversa: ${conversationId}`);
  }

  /**
   * Sai de uma sala de conversa específica
   */
  leaveConversation(conversationId: string) {
    if (!this.socket) {
      console.error('Não é possível sair da conversa: socket não inicializado');
      return;
    }

    this.socket.emit('leave_conversation', { conversationId });
    console.log(`Saindo da conversa: ${conversationId}`);
  }

  /**
   * Envia uma mensagem através do WebSocket
   * @param conversationId ID da conversa
   * @param content Conteúdo da mensagem
   * @param priority Prioridade da mensagem ('normal' ou 'urgent')
   * @returns Promise que resolve para true se a mensagem foi enviada com sucesso, ou false caso contrário
   */
  sendMessage(conversationId: string, content: string, priority: string = 'normal'): Promise<boolean> {
    return new Promise((resolve) => {
      // Verificar se o socket existe
      if (!this.socket) {
        console.error('Não é possível enviar mensagem: socket não inicializado');
        this.connect(); // Tentar conectar
        resolve(false);
        return;
      }
      
      // Verificar se o socket está conectado
      if (!this.socket.connected) {
        console.warn('Socket não está conectado. Tentando reconectar...');
        
        // Tentar reconectar e enviar a mensagem quando conectado
        this.socket.connect();
        
        // Esperar pela conexão por um tempo limitado
        let attempts = 0;
        const maxAttempts = 3;
        const checkInterval = setInterval(() => {
          attempts++;
          
          if (this.socket?.connected) {
            clearInterval(checkInterval);
            this._emitMessage(conversationId, content, priority);
            resolve(true);
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('Não foi possível reconectar ao servidor WebSocket após várias tentativas');
            resolve(false);
          }
        }, 500);
        
        return;
      }
      
      // Socket está conectado, enviar a mensagem
      this._emitMessage(conversationId, content, priority);
      resolve(true);
    });
  }
  
  /**
   * Método interno para emitir a mensagem para o servidor
   */
  private _emitMessage(conversationId: string, content: string, priority: string) {
    // Gerar um ID único para a mensagem
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Enviar a mensagem com o ID
    this.socket?.emit('send_message', {
      conversationId,
      content,
      priority,
      messageId
    });
    
    // Configurar um timeout para a confirmação
    const ackTimeout = setTimeout(() => {
      console.warn('Não recebeu confirmação de envio da mensagem');
      this.socket?.off('message_sent', messageSentListener);
    }, 5000); // Aumentar o timeout para 5 segundos
    
    // Listener para confirmação de envio
    const messageSentListener = (response: any) => {
      if (response && response.messageId === messageId) {
        console.log('Mensagem enviada com sucesso:', response);
        clearTimeout(ackTimeout);
        this.socket?.off('message_sent', messageSentListener);
        
        // Notificar os listeners de mensagem
        this.notifyMessageListeners('message_sent', {
          id: messageId,
          conversationId,
          content,
          priority,
          timestamp: response.timestamp || new Date(),
          status: 'sent'
        });
      }
    };
    
    // Registrar o listener para confirmação
    this.socket?.on('message_sent', messageSentListener);
  }

  /**
   * Adiciona um listener para eventos de mensagens
   */
  addMessageListener(event: string, callback: (message: any) => void) {
    if (!this.messageListeners.has(event)) {
      this.messageListeners.set(event, []);
    }
    this.messageListeners.get(event)?.push(callback);
  }

  /**
   * Remove um listener de eventos de mensagens
   */
  removeMessageListener(event: string, callback: (message: any) => void) {
    const listeners = this.messageListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Adiciona um listener para eventos de conexão
   */
  addConnectionListener(callback: (connected: boolean) => void) {
    this.connectionListeners.push(callback);
  }

  /**
   * Remove um listener de eventos de conexão
   */
  removeConnectionListener(callback: (connected: boolean) => void) {
    const index = this.connectionListeners.indexOf(callback);
    if (index !== -1) {
      this.connectionListeners.splice(index, 1);
    }
  }

  /**
   * Notifica todos os listeners de mensagens
   */
  private notifyMessageListeners(event: string, message: any) {
    const listeners = this.messageListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(message));
    }

    // Também notificar os listeners genéricos de 'message'
    if (event !== 'message') {
      this.notifyMessageListeners('message', message);
    }
  }

  /**
   * Notifica todos os listeners de conexão
   */
  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach(callback => callback(connected));
  }

  /**
   * Verifica se o socket está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Exportar uma instância única do serviço
export const socketService = new SocketService();
