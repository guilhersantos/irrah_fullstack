import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter todas as conversas do cliente' })
  @ApiResponse({ status: 200, description: 'Conversas obtidas com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getClientConversations(@Request() req) {
    const clientId = req.user.id;
    return this.conversationsService.getClientConversations(clientId);
  }

  @Get(':conversationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter uma conversa específica' })
  @ApiResponse({ status: 200, description: 'Conversa obtida com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  async getConversation(@Request() req, @Param('conversationId') conversationId: string) {
    const clientId = req.user.id;
    return this.conversationsService.getConversation(clientId, conversationId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar uma nova conversa' })
  @ApiResponse({ status: 201, description: 'Conversa criada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async createConversation(@Request() req, @Body() createConversationDto: CreateConversationDto) {
    const clientId = req.user.id;
    return this.conversationsService.createConversation(clientId, createConversationDto);
  }

  @Patch(':conversationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar o título de uma conversa' })
  @ApiResponse({ status: 200, description: 'Conversa atualizada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  async updateConversation(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    const clientId = req.user.id;
    return this.conversationsService.updateConversation(clientId, conversationId, updateConversationDto);
  }

  @Delete(':conversationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Arquivar uma conversa' })
  @ApiResponse({ status: 200, description: 'Conversa arquivada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  async archiveConversation(@Request() req, @Param('conversationId') conversationId: string) {
    const clientId = req.user.id;
    return this.conversationsService.archiveConversation(clientId, conversationId);
  }
}
