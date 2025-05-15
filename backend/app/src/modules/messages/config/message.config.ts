/**
 * Configurações centralizadas para o módulo de mensagens
 * Este arquivo usa as variáveis de ambiente definidas no arquivo .env
 */

import { MessagePriority } from '../entities/message.entity';
import { ConfigService } from '@nestjs/config';

// Obter instância do ConfigService
const configService = new ConfigService();

/**
 * Configurações do módulo de mensagens
 */
export const MessageConfig = {
  /**
   * URL da API para integração com o frontend
   * Esta URL é usada pelo frontend para se comunicar com o backend
   */
  apiUrl: configService.get('API_URL') || 'http://localhost:3000/api',
  
  /**
   * Preços das mensagens
   * Os preços são definidos no arquivo .env e podem ser alterados sem precisar modificar o código
   */
  prices: {
    // Preço das mensagens normais (R$ 0,25 por padrão)
    [MessagePriority.NORMAL]: parseFloat(configService.get('MESSAGE_PRICE_NORMAL') || '0.25'),
    
    // Preço das mensagens urgentes (R$ 0,50 por padrão)
    [MessagePriority.URGENT]: parseFloat(configService.get('MESSAGE_PRICE_URGENT') || '0.50'),
  },
  
  /**
   * Configurações de paginação para listagem de mensagens
   */
  pagination: {
    // Limite padrão de mensagens por página (20 por padrão)
    defaultLimit: parseInt(configService.get('MESSAGE_PAGINATION_DEFAULT') || '20'),
    
    // Limite máximo de mensagens por página (100 por padrão)
    maxLimit: parseInt(configService.get('MESSAGE_PAGINATION_MAX') || '100'),
  },
  
  /**
   * Configurações de clientes
   * Estas configurações são usadas para definir valores padrão para os clientes
   */
  clients: {
    // Saldo inicial para clientes pré-pagos (R$ 10,00 por padrão)
    prepaidInitialBalance: parseFloat(configService.get('CLIENT_PREPAID_INITIAL_BALANCE') || '10.00'),
    
    // Limite de crédito para clientes pós-pagos (R$ 100,00 por padrão)
    postpaidCreditLimit: parseFloat(configService.get('CLIENT_POSTPAID_CREDIT_LIMIT') || '100.00'),
  },
};
