import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminAuthRequestDto {
  @ApiProperty({ description: 'Nome de usuário do administrador', example: 'admin' })
  @IsNotEmpty({ message: 'O nome de usuário é obrigatório' })
  @IsString({ message: 'O nome de usuário deve ser uma string' })
  username: string;

  @ApiProperty({ description: 'Senha do administrador' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @IsString({ message: 'A senha deve ser uma string' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  password: string;
}

export class AdminAuthResponseDto {
  @ApiProperty({ description: 'Token de identificação para administradores' })
  token: string;

  @ApiProperty({ description: 'Dados do administrador' })
  user: {
    id: string;
    name: string;
    role: string;
  };
}
