import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'bcb_secret_key',
    });
  }

  async validate(payload: any) {
    console.log('[JwtStrategy] Validando payload:', payload);
    
    // Verificar o tipo de usuário (cliente ou admin)
    if (payload.type === 'client') {
      console.log('[JwtStrategy] Tipo de usuário: cliente');
      const client = await this.clientRepository.findOne({ where: { id: payload.id } });
      console.log('[JwtStrategy] Cliente encontrado:', client);
      
      if (!client || !client.active) {
        console.log('[JwtStrategy] Cliente não encontrado ou inativo');
        throw new UnauthorizedException('Cliente não encontrado ou inativo');
      }
      
      // Retornar os dados do cliente
      const result = { ...client, type: 'client' };
      console.log('[JwtStrategy] Retornando dados do cliente:', result);
      return result;
    } else if (payload.type === 'admin') {
      console.log('[JwtStrategy] Tipo de usuário: admin');
      const user = await this.userRepository.findOne({ where: { id: payload.id } });
      console.log('[JwtStrategy] Administrador encontrado:', user);
      
      if (!user || !user.active) {
        console.log('[JwtStrategy] Administrador não encontrado ou inativo');
        throw new UnauthorizedException('Administrador não encontrado ou inativo');
      }
      
      // Criar um objeto com os dados do administrador, excluindo a senha
      const { password, ...userData } = user;
      const result = { ...userData, type: 'admin' };
      console.log('[JwtStrategy] Retornando dados do administrador:', result);
      return result;
    }

    throw new UnauthorizedException('Tipo de usuário inválido');
  }
}
