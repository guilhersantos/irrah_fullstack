import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessagePriority } from '../entities/message.entity';

export class CreateMessageDto {
  @ApiProperty({
    description: 'ID da conversa',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  conversationId: string;

  @ApiProperty({
    description: 'Conteúdo da mensagem',
    required: true,
    example: 'Olá, preciso de ajuda com meu pedido.',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Prioridade da mensagem',
    required: false,
    enum: MessagePriority,
    default: MessagePriority.NORMAL,
    example: 'normal',
  })
  @IsEnum(MessagePriority)
  @IsOptional()
  priority?: MessagePriority;
}
