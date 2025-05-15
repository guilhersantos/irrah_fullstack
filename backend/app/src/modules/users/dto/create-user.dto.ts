import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome do usuário' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString({ message: 'O nome deve ser uma string' })
  name: string;

  @ApiProperty({ description: 'Senha do usuário' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @IsString({ message: 'A senha deve ser uma string' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  password: string;

  @ApiProperty({ 
    description: 'Papel do usuário no sistema', 
    enum: UserRole,
    default: UserRole.SUPPORT
  })
  @IsEnum(UserRole, { message: 'Papel inválido' })
  role: UserRole;
}
