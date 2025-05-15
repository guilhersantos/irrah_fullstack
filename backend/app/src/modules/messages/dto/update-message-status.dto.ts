import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageStatus } from '../entities/message.entity';

export class UpdateMessageStatusDto {
  @ApiProperty({
    description: 'Status da mensagem',
    required: true,
    enum: MessageStatus,
    example: 'delivered',
  })
  @IsEnum(MessageStatus)
  status: MessageStatus;
}
