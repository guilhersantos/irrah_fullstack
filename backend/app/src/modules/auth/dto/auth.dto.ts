import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '../../clients/entities/client.entity';

export class AuthRequestDto {
  @ApiProperty({ description: 'CPF ou CNPJ do cliente', example: '12345678901' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(\d{11}|\d{14})$/, { message: 'documentId deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos)' })
  documentId: string;

  @ApiProperty({ description: 'Tipo de documento', enum: DocumentType, example: 'CPF' })
  @IsNotEmpty()
  @IsEnum(DocumentType)
  documentType: DocumentType;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Token de identificação simples' })
  token: string;

  @ApiProperty({ description: 'Dados do cliente' })
  client: {
    id: string;
    name: string;
    documentId: string;
    documentType: DocumentType;
    balance?: number;
    limit?: number;
    planType: 'prepaid' | 'postpaid';
    active: boolean;
  };
}
