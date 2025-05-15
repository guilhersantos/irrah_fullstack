import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule } from './modules/clients/clients.module';
import { AuthModule } from './modules/auth/auth.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { UsersModule } from './modules/users/users.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { SeedModule } from './database/seeds/seed.module';
import { DATABASE_CONFIG } from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      // Remover o tipo daqui, pois já está no DATABASE_CONFIG
      host: DATABASE_CONFIG.host,
      port: DATABASE_CONFIG.port,
      username: DATABASE_CONFIG.username,
      password: DATABASE_CONFIG.password,
      database: DATABASE_CONFIG.database,
      type: 'postgres', // Definir o tipo explicitamente aqui
      synchronize: DATABASE_CONFIG.synchronize,
      logging: DATABASE_CONFIG.logging,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      autoLoadEntities: true,
      // Adicionar mais opções para depuração
      retryAttempts: 10,
      retryDelay: 3000,
    }),
    ClientsModule,
    AuthModule,
    ConversationsModule,
    MessagesModule,
    UsersModule,
    WebsocketModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
