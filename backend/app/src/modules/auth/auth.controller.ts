import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthRequestDto, AuthResponseDto } from './dto/auth.dto';
import { AdminAuthRequestDto, AdminAuthResponseDto } from './dto/admin-auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Autenticar cliente pelo documento (CPF/CNPJ)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cliente autenticado com sucesso', 
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Credenciais inválidas ou cliente inativo' 
  })
  async login(@Body() authRequestDto: AuthRequestDto): Promise<AuthResponseDto> {
    return this.authService.authenticate(authRequestDto);
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Autenticar administrador pelo nome de usuário e senha' })
  @ApiResponse({ 
    status: 200, 
    description: 'Administrador autenticado com sucesso', 
    type: AdminAuthResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Credenciais inválidas ou usuário sem permissão de administrador' 
  })
  async adminLogin(@Body() adminAuthRequestDto: AdminAuthRequestDto): Promise<AdminAuthResponseDto> {
    return this.authService.authenticateAdmin(adminAuthRequestDto);
  }
}
