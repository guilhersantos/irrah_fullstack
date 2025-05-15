import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { Client } from './entities/client.entity';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os clientes' })
  @ApiResponse({ status: 200, description: 'Lista de clientes retornada com sucesso', type: [Client] })
  findAll(): Promise<Client[]> {
    return this.clientsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter um cliente pelo ID' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado com sucesso', type: Client })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  findOne(@Param('id') id: string): Promise<Client> {
    return this.clientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar um novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso', type: Client })
  create(@Body() createClientDto: Partial<Client>): Promise<Client> {
    return this.clientsService.create(createClientDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um cliente existente' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso', type: Client })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateClientDto: Partial<Client>,
  ): Promise<Client> {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um cliente' })
  @ApiResponse({ status: 200, description: 'Cliente removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.clientsService.remove(id);
  }
}
