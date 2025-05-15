import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessagePriority, MessageStatus } from './entities/message.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Client } from '../clients/entities/client.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageStatusDto } from './dto/update-message-status.dto';
import { MessageConfig } from './config/message.config';

@Injectable()
export class MessagesService {
  // Preços das mensagens obtidos da configuração
  private readonly MESSAGE_PRICES = MessageConfig.prices;

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  /**
   * Envia uma nova mensagem
   * @param userId ID do usuário que está enviando a mensagem
   * @param createMessageDto Dados da mensagem
   * @param userType Tipo do usuário ('client' ou 'admin')
   * @param userRole Papel do usuário ('admin' ou 'support' para usuários do tipo 'admin')
   */
  async sendMessage(
    userId: string, 
    createMessageDto: CreateMessageDto, 
    userType?: string, 
    userRole?: string
  ): Promise<Message> {
    const { conversationId, content, priority = MessagePriority.NORMAL } = createMessageDto;
    let cost = 0;
    
    // Verificar se a conversa existe
    const conversation = await this.conversationRepository.findOne({ where: { id: conversationId } });
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }
    
    // Verificar permissões com base no tipo de usuário
    const isAdmin = userType === 'admin' && (userRole === 'admin' || userRole === 'support');
    
    if (!isAdmin && conversation.clientId !== userId) {
      throw new BadRequestException('Usuário não autorizado para esta conversa');
    }
    
    // Se for cliente, verificar saldo e deduzir custo
    if (!isAdmin) {
      // Verificar se o cliente existe
      const client = await this.clientRepository.findOne({ where: { id: userId } });
      if (!client) {
        throw new NotFoundException('Cliente não encontrado');
      }
      
      // Calcular o custo da mensagem
      cost = this.calculateMessageCost(priority);
      
      // Verificar saldo para clientes pré-pagos
      if (client.planType === 'prepaid') {
        const currentBalance = Number(client.balance || 0);
        if (currentBalance < cost) {
          throw new BadRequestException('Saldo insuficiente para enviar a mensagem');
        }
        
        // Deduzir o valor do saldo
        client.balance = currentBalance - cost;
        await this.clientRepository.save(client);
      }
    }
    
    // Criar a mensagem com base no tipo de usuário
    const message = this.messageRepository.create({
      conversationId,
      content,
      sentBy: {
        id: userId,
        type: isAdmin ? 'admin' : 'client',
      },
      priority,
      status: MessageStatus.SENT, // Mensagem enviada imediatamente
      cost,
    });
    
    const savedMessage = await this.messageRepository.save(message);
    
    // Atualizar a última mensagem da conversa
    conversation.lastMessage = {
      content,
      timestamp: savedMessage.timestamp,
      sentByClient: true,
    };
    
    // Incrementar contador de mensagens não lidas para o admin
    conversation.unreadCount.admin += 1;
    
    await this.conversationRepository.save(conversation);
    
    // Log para depuração
    console.log(`Mensagem enviada: ${savedMessage.id}, Custo: R$ ${cost.toFixed(2)}`);
    
    return savedMessage;
  }
  
  /**
   * Calcula o custo de uma mensagem com base na prioridade
   */
  private calculateMessageCost(priority: MessagePriority): number {
    return this.MESSAGE_PRICES[priority];
  }
  
  /**
   * Obtém mensagens de uma conversa
   */
  async getMessagesByConversation(
    userId: string,
    conversationId: string,
    page = 1,
    limit = MessageConfig.pagination.defaultLimit,
    userType?: string,
    userRole?: string,
  ): Promise<{ messages: Message[]; total: number; page: number; limit: number }> {
    // Verificar se a conversa existe
    const conversation = await this.conversationRepository.findOne({ where: { id: conversationId } });
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }
    
    // Se o usuário for um administrador ou suporte, permitir acesso
    const isAdmin = userType === 'admin' && (userRole === 'admin' || userRole === 'support');
    
    // Se não for admin/suporte, verificar se o cliente é o dono da conversa
    if (!isAdmin && conversation.clientId !== userId) {
      throw new BadRequestException('Usuário não autorizado para esta conversa');
    }
    
    // Calcular o skip para paginação
    const skip = (page - 1) * limit;
    
    // Obter o total de mensagens
    const total = await this.messageRepository.count({ where: { conversationId } });
    
    // Obter as mensagens com paginação, ordenadas por timestamp decrescente
    const messages = await this.messageRepository.find({
      where: { conversationId },
      order: { timestamp: 'DESC' },
      skip,
      take: limit,
    });
    
    // Marcar mensagens como lidas com base no tipo de usuário
    if (userType === 'admin') {
      // Se for admin/suporte, marcar mensagens do cliente como lidas
      const adminMessagesToUpdate = messages.filter(
        (msg) => msg.sentBy.type === 'client' && msg.status !== MessageStatus.READ
      );
      
      if (adminMessagesToUpdate.length > 0) {
        for (const msg of adminMessagesToUpdate) {
          msg.status = MessageStatus.READ;
          await this.messageRepository.save(msg);
        }
        
        // Resetar contador de mensagens não lidas para o admin
        conversation.unreadCount.admin = 0;
        await this.conversationRepository.save(conversation);
      }
    } else {
      // Se for cliente, marcar mensagens do admin como lidas
      const clientMessagesToUpdate = messages.filter(
        (msg) => msg.sentBy.type === 'admin' && msg.status !== MessageStatus.READ
      );
      
      if (clientMessagesToUpdate.length > 0) {
        for (const msg of clientMessagesToUpdate) {
          msg.status = MessageStatus.READ;
          await this.messageRepository.save(msg);
        }
        
        // Resetar contador de mensagens não lidas para o cliente
        conversation.unreadCount.client = 0;
        await this.conversationRepository.save(conversation);
      }
    }
    
    return {
      messages,
      total,
      page,
      limit,
    };
  }
  
  /**
   * Atualiza o status de uma mensagem
   */
  async updateMessageStatus(
    messageId: string,
    updateStatusDto: UpdateMessageStatusDto,
  ): Promise<Message> {
    const message = await this.messageRepository.findOne({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }
    
    message.status = updateStatusDto.status;
    return this.messageRepository.save(message);
  }
}
