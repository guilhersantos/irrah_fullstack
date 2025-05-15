import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageStatusDto } from './dto/update-message-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageConfig } from './config/message.config';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar uma nova mensagem' })
  @ApiResponse({ status: 201, description: 'Mensagem enviada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou saldo insuficiente' })
  async sendMessage(@Request() req, @Body() createMessageDto: CreateMessageDto) {
    const userId = req.user.id;
    const userType = req.user.type; // 'client' ou 'admin'
    const userRole = req.user.role; // 'admin' ou 'support' para usuários do tipo 'admin'
    
    return this.messagesService.sendMessage(userId, createMessageDto, userType, userRole);
  }
  
  @Post('admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar uma nova mensagem como administrador ou suporte' })
  @ApiResponse({ status: 201, description: 'Mensagem enviada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async sendMessageAsAdmin(@Request() req, @Body() createMessageDto: CreateMessageDto) {
    const userId = req.user.id;
    const userType = req.user.type; // Deve ser 'admin'
    const userRole = req.user.role; // Deve ser 'admin' ou 'support'
    
    if (userType !== 'admin') {
      throw new Error('Apenas administradores podem usar esta rota');
    }
    
    return this.messagesService.sendMessage(userId, createMessageDto, userType, userRole);
  }

  @Get('conversation/:conversationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter mensagens de uma conversa' })
  @ApiResponse({ status: 200, description: 'Mensagens obtidas com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página atual' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de itens por página' })
  async getMessagesByConversation(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = MessageConfig.pagination.defaultLimit,
  ) {
    const userId = req.user.id;
    const userType = req.user.type; // 'client' ou 'admin'
    const userRole = req.user.role; // 'admin' ou 'support' para usuários do tipo 'admin'
    
    return this.messagesService.getMessagesByConversation(
      userId,
      conversationId,
      +page,
      +limit,
      userType,
      userRole,
    );
  }

  @Patch(':messageId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar o status de uma mensagem' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Mensagem não encontrada' })
  async updateMessageStatus(
    @Param('messageId') messageId: string,
    @Body() updateStatusDto: UpdateMessageStatusDto,
  ) {
    return this.messagesService.updateMessageStatus(messageId, updateStatusDto);
  }
}
