import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message } from './entities/message.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Client } from '../clients/entities/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Conversation, Client]),
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
