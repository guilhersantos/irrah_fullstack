import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConversationDto {
  @ApiProperty({
    description: 'Título da conversa',
    required: false,
    example: 'Suporte ao cliente',
  })
  @IsString()
  @IsOptional()
  title?: string;
}
