import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { WebsocketGateway } from './websocket.gateway';
import { User } from '../users/entities/user.entity';
import { Client } from '../clients/entities/client.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { SECURITY_CONFIG } from '../../config/app.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Client, Conversation]),
    JwtModule.register({
      secret: SECURITY_CONFIG.jwtSecret,
      signOptions: { expiresIn: SECURITY_CONFIG.jwtExpiration },
    }),
  ],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
