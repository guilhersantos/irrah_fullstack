import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, DocumentType } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
  ) {}

  async findAll(): Promise<Client[]> {
    return this.clientsRepository.find();
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientsRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado`);
    }
    return client;
  }

  async findByDocument(documentId: string, documentType: DocumentType): Promise<Client> {
    const client = await this.clientsRepository.findOne({
      where: { documentId, documentType },
    });
    
    if (!client) {
      throw new NotFoundException(`Cliente com documento ${documentId} não encontrado`);
    }
    
    return client;
  }

  // O método findByEmail foi removido porque o campo email foi removido da entidade Client

  async create(createClientDto: Partial<Client>): Promise<Client> {
    const client = this.clientsRepository.create(createClientDto);
    return this.clientsRepository.save(client);
  }

  async update(id: string, updateClientDto: Partial<Client>): Promise<Client> {
    const client = await this.findOne(id);
    Object.assign(client, updateClientDto);
    return this.clientsRepository.save(client);
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await this.clientsRepository.remove(client);
  }
}
