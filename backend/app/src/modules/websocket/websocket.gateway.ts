import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Client } from '../clients/entities/client.entity';
import { Conversation } from '../conversations/entities/conversation.entity';

@WebSocketGateway({
  cors: {
    origin: true, // Permitir todas as origens para facilitar o desenvolvimento
    credentials: true,
  },
  transports: ['websocket', 'polling'], // Suportar WebSocket e HTTP polling como fallback
  allowEIO3: true, // Compatibilidade com clientes mais antigos
  path: '/socket.io/', // Caminho padrão para Socket.IO
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebsocketGateway.name);
  private connectedClients: Map<string, Socket> = new Map();
  private connectedAdmins: Map<string, Socket> = new Map();

  @WebSocketServer() server: Server;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Obter token do cabeçalho de autenticação
      const token = client.handshake.auth.token?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.error('Cliente tentou se conectar sem token');
        client.emit('connection_error', { message: 'Token de autenticação não fornecido' });
        client.disconnect();
        return;
      }

      try {
        // Verificar e decodificar o token
        const decoded = this.jwtService.verify(token);
        const userId = decoded.id;
        const userType = decoded.type; // 'client' ou 'admin'

        this.logger.log(`Cliente conectado: ${userId} (${userType})`);

        // Armazenar o cliente conectado com base no tipo
        if (userType === 'client') {
          this.connectedClients.set(userId, client);
          
          // Inscrever o cliente em seu próprio canal
          client.join(`client-${userId}`);
        } else if (userType === 'admin') {
          this.connectedAdmins.set(userId, client);
          
          // Inscrever o admin em todos os canais de clientes
          client.join('admin-channel');
        }

        // Adicionar o cliente ao canal de todos os usuários
        client.join('all-users');

        // Emitir evento de conexão bem-sucedida
        client.emit('connection_success', {
          message: 'Conectado com sucesso ao servidor de WebSocket',
          userId,
          userType,
        });
      } catch (tokenError) {
        this.logger.error(`Erro na verificação do token: ${tokenError.message}`);
        client.emit('connection_error', { message: 'Token inválido ou expirado' });
        client.disconnect();
      }
    } catch (error) {
      this.logger.error(`Erro na conexão WebSocket: ${error.message}`);
      client.emit('connection_error', { message: 'Erro interno do servidor' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Remover cliente da lista de conectados
    this.connectedClients.forEach((socket, userId) => {
      if (socket.id === client.id) {
        this.connectedClients.delete(userId);
        this.logger.log(`Cliente desconectado: ${userId}`);
      }
    });

    // Remover admin da lista de conectados
    this.connectedAdmins.forEach((socket, userId) => {
      if (socket.id === client.id) {
        this.connectedAdmins.delete(userId);
        this.logger.log(`Admin desconectado: ${userId}`);
      }
    });
  }

  @SubscribeMessage('send_message')
  async handleMessage(client: Socket, payload: any) {
    try {
      const { conversationId, content, priority, messageId } = payload;
      
      // Verificar token para obter o ID do usuário
      let userId, userType, userRole;
      
      try {
        const token = client.handshake.auth.token?.replace('Bearer ', '');
        if (!token) {
          throw new Error('Token não encontrado');
        }
        
        const decoded = this.jwtService.verify(token);
        userId = decoded.id;
        userType = decoded.type;
        userRole = decoded.role;
      } catch (tokenError) {
        // Em vez de desconectar, apenas enviar um evento de erro
        client.emit('error', { message: 'Erro de autenticação: ' + tokenError.message });
        this.logger.error(`Erro de autenticação: ${tokenError.message}`);
        return { success: false, error: 'Erro de autenticação' };
      }
      
      this.logger.log(`Mensagem recebida de ${userId} (${userType}) para conversa ${conversationId}`);
      
      // Criar o objeto de mensagem
      const messageData = {
        id: messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        content,
        priority,
        sentBy: {
          id: userId,
          type: userType,
        },
        timestamp: new Date(),
      };
      
      // Emitir a mensagem para TODOS os clientes conectados na sala da conversa
      // Usar broadcast para garantir que todos recebam, exceto o remetente
      client.broadcast.to(`conversation-${conversationId}`).emit('new_message', messageData);
      
      // Também emitir para o próprio cliente para confirmação
      client.emit('message_sent', { 
        success: true, 
        messageId: messageData.id,
        timestamp: messageData.timestamp 
      });
      
      // Emitir para todos os clientes na sala (incluindo o remetente)
      this.server.to(`conversation-${conversationId}`).emit('message_received', {
        messageId: messageData.id,
        status: 'delivered'
      });
      
      // Se for uma mensagem de cliente, notificar todos os admins
      if (userType === 'client') {
        this.server.to('admin-channel').emit('client_message', {
          ...messageData,
          clientId: userId,
        });
        
        // Log para depuração
        this.logger.log(`Notificando admins sobre mensagem do cliente ${userId}`);
      } 
      // Se for uma mensagem de admin, notificar o cliente específico
      else if (userType === 'admin') {
        const conversation = await this.conversationRepository.findOne({
          where: { id: conversationId }
        });
        
        if (conversation && conversation.clientId) {
          this.server.to(`client-${conversation.clientId}`).emit('admin_message', {
            ...messageData,
            adminId: userId,
          });
          
          // Log para depuração
          this.logger.log(`Notificando cliente ${conversation.clientId} sobre mensagem do admin ${userId}`);
        }
      }
      
      // Retornar sucesso
      return { success: true, messageId: messageData.id };
    } catch (error) {
      this.logger.error(`Erro ao processar mensagem: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(client: Socket, payload: any) {
    try {
      const { conversationId } = payload;
      
      // Verificar token para obter o ID do usuário
      let userId, userType;
      
      try {
        const token = client.handshake.auth.token?.replace('Bearer ', '');
        if (!token) {
          throw new Error('Token não encontrado');
        }
        
        const decoded = this.jwtService.verify(token);
        userId = decoded.id;
        userType = decoded.type;
      } catch (tokenError) {
        client.emit('error', { message: 'Erro de autenticação ao entrar na conversa: ' + tokenError.message });
        this.logger.error(`Erro de autenticação ao entrar na conversa: ${tokenError.message}`);
        return { success: false, error: 'Erro de autenticação' };
      }
      
      // Adicionar o cliente ao canal da conversa
      client.join(`conversation-${conversationId}`);
      
      // Notificar outros participantes da conversa
      client.to(`conversation-${conversationId}`).emit('user_joined', {
        conversationId,
        userId,
        userType,
        timestamp: new Date()
      });
      
      this.logger.log(`Usuário ${userId} (${userType}) entrou na conversa: ${conversationId}`);
      
      // Buscar mensagens recentes da conversa para enviar ao cliente
      try {
        const conversation = await this.conversationRepository.findOne({
          where: { id: conversationId }
        });
        
        if (conversation) {
          // Emitir evento de entrada bem-sucedida
          client.emit('joined_conversation', {
            success: true,
            conversationId,
            title: conversation.title,
            timestamp: new Date()
          });
        }
      } catch (dbError) {
        this.logger.error(`Erro ao buscar conversa: ${dbError.message}`);
      }
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Erro ao entrar na conversa: ${error.message}`);
      client.emit('error', { message: `Erro ao entrar na conversa: ${error.message}` });
      return { success: false, error: error.message };
    }
  }
  
  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(client: Socket, payload: any) {
    try {
      const { conversationId } = payload;
      
      // Remover o cliente do canal da conversa
      client.leave(`conversation-${conversationId}`);
      
      this.logger.log(`Cliente saiu da conversa: ${conversationId}`);
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Erro ao sair da conversa: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  // Método para enviar uma mensagem para um cliente específico
  sendMessageToClient(clientId: string, event: string, data: any) {
    const clientSocket = this.connectedClients.get(clientId);
    if (clientSocket) {
      clientSocket.emit(event, data);
      return true;
    }
    return false;
  }
  
  // Método para enviar uma mensagem para todos os administradores
  sendMessageToAllAdmins(event: string, data: any) {
    this.server.to('admin-channel').emit(event, data);
    return true;
  }
  
  // Método para enviar uma mensagem para todos os usuários de uma conversa
  sendMessageToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation-${conversationId}`).emit(event, data);
    return true;
  }
}
