import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { API_CONFIG, MESSAGE_CONFIG } from './config/app.config';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
    console.log('AppController inicializado');
  }

  @Get()
  @ApiOperation({ summary: 'Página inicial' })
  @ApiResponse({ status: 200, description: 'Bem-vindo à API BCB' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Verificar saúde da API' })
  @ApiResponse({ status: 200, description: 'API funcionando corretamente' })
  healthCheck(): { status: string; timestamp: Date } {
    return {
      status: 'ok',
      timestamp: new Date(),
    };
  }

  @Get('config')
  @ApiOperation({ summary: 'Obter configurações públicas da API' })
  @ApiResponse({ status: 200, description: 'Configurações públicas da API' })
  getConfig(): { apiUrl: string; messagePrices: any } {
    console.log('[CONFIG] Endpoint /api/config acessado');
    
    const config = {
      apiUrl: API_CONFIG.url,
      messagePrices: {
        normal: MESSAGE_CONFIG.prices.normal,
        urgent: MESSAGE_CONFIG.prices.urgent,
      },
    };
    
    console.log('[CONFIG] Retornando configurações:', config);
    return config;
  }
  
  @Get('api/config')
  @ApiOperation({ summary: 'Obter configurações públicas da API (com prefixo /api)' })
  @ApiResponse({ status: 200, description: 'Configurações públicas da API' })
  getConfigWithApiPrefix(): { apiUrl: string; messagePrices: any } {
    console.log('[CONFIG] Endpoint /api/config acessado');
    return this.getConfig();
  }
  
  @Get('test-api')
  @ApiOperation({ summary: 'Testar conexão com a API' })
  @ApiResponse({ status: 200, description: 'API acessível' })
  testApi(): { status: string; message: string; timestamp: Date } {
    console.log('[TEST] Endpoint /test-api acessado');
    return {
      status: 'success',
      message: 'API BCB está acessível e funcionando corretamente',
      timestamp: new Date(),
    };
  }
}
