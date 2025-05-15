import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Client } from '../clients/entities/client.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  /**
   * Obtém todas as conversas (para administradores)
   */
  async getAllConversations(): Promise<Conversation[]> {
    // Buscar todas as conversas ativas, ordenadas pela data da última mensagem
    return this.conversationRepository.find({
      where: { active: true },
      relations: ['client'],
      order: { updatedAt: 'DESC' }
    });
  }

  /**
   * Obtém todas as conversas de um cliente
   */
  async getClientConversations(clientId: string): Promise<Conversation[]> {
    // Verificar se o cliente existe
    const client = await this.clientRepository.findOne({ where: { id: clientId } });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }
    
    // Buscar todas as conversas do cliente, ordenadas pela data da última mensagem
    return this.conversationRepository.find({
      where: { clientId, active: true },
      order: { 
        createdAt: 'DESC'
      }
    });
  }

  /**
   * Obtém uma conversa específica
   */
  async getConversation(clientId: string, conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({ where: { id: conversationId } });
    
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }
    
    // Verificar se o cliente é o dono da conversa
    if (conversation.clientId !== clientId) {
      throw new BadRequestException('Cliente não autorizado para esta conversa');
    }
    
    return conversation;
  }

  /**
   * Cria uma nova conversa
   */
  async createConversation(clientId: string, createConversationDto: CreateConversationDto): Promise<Conversation> {
    // Verificar se o cliente existe
    const client = await this.clientRepository.findOne({ where: { id: clientId } });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }
    
    // Criar a conversa
    const conversation = this.conversationRepository.create({
      clientId,
      title: createConversationDto.title || `Conversa de ${client.name}`,
      unreadCount: {
        client: 0,
        admin: 0,
      },
      active: true,
    });
    
    return this.conversationRepository.save(conversation);
  }

  /**
   * Atualiza o título de uma conversa
   */
  async updateConversation(
    clientId: string,
    conversationId: string,
    updateConversationDto: UpdateConversationDto,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({ where: { id: conversationId } });
    
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }
    
    // Verificar se o cliente é o dono da conversa
    if (conversation.clientId !== clientId) {
      throw new BadRequestException('Cliente não autorizado para esta conversa');
    }
    
    // Atualizar apenas os campos fornecidos
    if (updateConversationDto.title) {
      conversation.title = updateConversationDto.title;
    }
    
    return this.conversationRepository.save(conversation);
  }

  /**
   * Arquiva uma conversa (desativa)
   */
  async archiveConversation(clientId: string, conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({ where: { id: conversationId } });
    
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }
    
    // Verificar se o cliente é o dono da conversa
    if (conversation.clientId !== clientId) {
      throw new BadRequestException('Cliente não autorizado para esta conversa');
    }
    
    conversation.active = false;
    return this.conversationRepository.save(conversation);
  }
  
  /**
   * Atualiza o contador de mensagens não lidas
   */
  async updateUnreadCount(conversationId: string, isClientMessage: boolean): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({ where: { id: conversationId } });
    
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }
    
    // Incrementar o contador apropriado
    if (isClientMessage) {
      conversation.unreadCount.admin += 1;
    } else {
      conversation.unreadCount.client += 1;
    }
    
    return this.conversationRepository.save(conversation);
  }
  
  /**
   * Reseta o contador de mensagens não lidas
   */
  async resetUnreadCount(conversationId: string, isClient: boolean): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({ where: { id: conversationId } });
    
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }
    
    // Resetar o contador apropriado
    if (isClient) {
      conversation.unreadCount.client = 0;
    } else {
      conversation.unreadCount.admin = 0;
    }
    
    return this.conversationRepository.save(conversation);
  }
  
  /**
   * Atualiza a última mensagem de uma conversa
   */
  async updateLastMessage(
    conversationId: string, 
    content: string, 
    timestamp: Date, 
    sentByClient: boolean
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({ where: { id: conversationId } });
    
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }
    
    conversation.lastMessage = {
      content,
      timestamp,
      sentByClient,
    };
    
    return this.conversationRepository.save(conversation);
  }
}
