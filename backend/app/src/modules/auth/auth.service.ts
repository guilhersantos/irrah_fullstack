import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientsService } from '../clients/clients.service';
import { UsersService } from '../users/users.service';
import { AuthRequestDto, AuthResponseDto } from './dto/auth.dto';
import { AdminAuthRequestDto, AdminAuthResponseDto } from './dto/admin-auth.dto';
import { DocumentType, PlanType } from '../clients/entities/client.entity';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Autentica um cliente pelo documento (CPF/CNPJ)
   */
  async authenticate(authRequestDto: AuthRequestDto): Promise<AuthResponseDto> {
    try {
      // Validar se os campos obrigatórios foram fornecidos
      if (!authRequestDto.documentId || !authRequestDto.documentType) {
        throw new UnauthorizedException('Documento e tipo de documento são obrigatórios');
      }

      // Buscar cliente pelo documento
      const client = await this.clientsService.findByDocument(
        authRequestDto.documentId,
        authRequestDto.documentType,
      );

      // Verificar se o cliente está ativo
      if (!client.active) {
        throw new UnauthorizedException('Cliente inativo');
      }

      // Gerar token JWT
      const payload = {
        id: client.id,
        type: 'client',
        documentId: client.documentId,
        documentType: client.documentType,
      };

      // Montar resposta
      const response: AuthResponseDto = {
        token: this.jwtService.sign(payload),
        client: {
          id: client.id,
          name: client.name,
          documentId: client.documentId,
          documentType: client.documentType,
          planType: client.planType,
          active: client.active,
        },
      };

      // Adicionar saldo ou limite conforme o tipo de plano
      if (client.planType === PlanType.PREPAID) {
        response.client.balance = client.balance;
      } else {
        response.client.limit = client.limit;
      }

      return response;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Credenciais inválidas');
    }
  }

  /**
   * Autentica um administrador pelo nome de usuário e senha
   */
  async authenticateAdmin(adminAuthRequestDto: AdminAuthRequestDto): Promise<AdminAuthResponseDto> {
    try {
      // Validar se os campos obrigatórios foram fornecidos
      if (!adminAuthRequestDto.username || !adminAuthRequestDto.password) {
        throw new UnauthorizedException('Nome de usuário e senha são obrigatórios');
      }

      // Validar credenciais do administrador
      const user = await this.usersService.validateUser(
        adminAuthRequestDto.username,
        adminAuthRequestDto.password
      );

      if (!user) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      // Verificar se o usuário tem papel de administrador ou suporte
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPPORT) {
        throw new UnauthorizedException('Usuário não tem permissão de administrador');
      }

      // Gerar token JWT
      const payload = {
        id: user.id,
        type: 'admin',
        name: user.name,
        role: user.role
      };

      // Montar resposta
      const response: AdminAuthResponseDto = {
        token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          name: user.name,
          role: user.role
        }
      };

      return response;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Credenciais inválidas');
    }
  }
}
