/**
 * Configurações centralizadas da aplicação BCB (Big Chat Brasil)
 * Este arquivo exporta todas as configurações importantes do sistema
 * que podem ser usadas em qualquer parte da aplicação
 */

// Função para exibir as configurações carregadas
const logConfig = (name: string, config: any) => {
  console.log(`\n[CONFIG] ${name} carregado:`);
  console.log(JSON.stringify(config, null, 2));
};

/**
 * Configurações da API
 */
export const API_CONFIG = {
  // Prefixo da API (ex: 'api')
  prefix: process.env.API_PREFIX || 'api',
  
  // URL completa da API (ex: 'http://localhost:3000/api')
  url: process.env.API_URL || 'http://localhost:3000/api',
  
  // Porta da aplicação
  port: parseInt(process.env.PORT || '3000'),
  
  // Host da aplicação
  host: process.env.HOST || 'localhost',
  
  // Ambiente (development, production, etc)
  nodeEnv: process.env.NODE_ENV || 'development',
};

/**
 * Configurações de segurança
 */
export const SECURITY_CONFIG = {
  // Chave secreta para JWT
  jwtSecret: process.env.JWT_SECRET || 'bcb_secret_key',
  
  // Tempo de expiração do JWT
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
};

/**
 * Configurações do banco de dados
 */

// Função para extrair configurações de uma URL de conexão
const parseDatabaseUrl = (url: string) => {
  try {
    // Formato: postgres://user:password@host:port/database
    const regex = /postgres:\/\/(.*?):(.*?)@(.*?):(\d+)\/(.*)/;
    const matches = url.match(regex);
    
    if (matches && matches.length >= 6) {
      return {
        username: matches[1],
        password: matches[2],
        host: matches[3],
        port: parseInt(matches[4]),
        database: matches[5],
      };
    }
    return null;
  } catch (error) {
    console.error('Erro ao analisar DATABASE_URL:', error);
    return null;
  }
};

// Verificar se DATABASE_URL está definido (usado no Docker)
let dbConfig: any = {};
if (process.env.DATABASE_URL) {
  console.log('\n[CONFIG] Usando DATABASE_URL para conexão com o banco de dados');
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL.replace(/(postgres:\/\/.*?:).*?(@)/, '$1********$2')}`);
  
  const parsedUrl = parseDatabaseUrl(process.env.DATABASE_URL);
  if (parsedUrl) {
    dbConfig = parsedUrl;
    console.log('\n[CONFIG] Configurações extraídas de DATABASE_URL:');
    console.log(`- Host: ${dbConfig.host}`);
    console.log(`- Port: ${dbConfig.port}`);
    console.log(`- Database: ${dbConfig.database}`);
    console.log(`- User: ${dbConfig.username}`);
  }
}

export const DATABASE_CONFIG = {
  type: 'postgres',
  host: dbConfig.host || process.env.DB_HOST || 'fullstack-db-1', // Usar 'db' como padrão para Docker
  port: dbConfig.port || parseInt(process.env.DB_PORT || '5432'),
  username: dbConfig.username || process.env.DB_USERNAME || 'user',
  password: dbConfig.password || process.env.DB_PASSWORD || 'password',
  database: dbConfig.database || process.env.DB_DATABASE || 'myapp',
  logging: process.env.TYPEORM_LOGGING === 'true',
  synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
};

// Exibir as configurações do banco de dados
logConfig('DATABASE_CONFIG', {
  ...DATABASE_CONFIG,
  // Substituir a senha por asteriscos para segurança
  password: DATABASE_CONFIG.password ? '********' : null,
});

/**
 * Configurações de mensagens
 */
export const MESSAGE_CONFIG = {
  prices: {
    normal: parseFloat(process.env.MESSAGE_PRICE_NORMAL || '0.25'),
    urgent: parseFloat(process.env.MESSAGE_PRICE_URGENT || '0.50'),
  },
  pagination: {
    defaultLimit: parseInt(process.env.MESSAGE_PAGINATION_DEFAULT || '20'),
    maxLimit: parseInt(process.env.MESSAGE_PAGINATION_MAX || '100'),
  },
};

/**
 * Configurações de clientes
 */
export const CLIENT_CONFIG = {
  prepaidInitialBalance: parseFloat(process.env.CLIENT_PREPAID_INITIAL_BALANCE || '10.00'),
  postpaidCreditLimit: parseFloat(process.env.CLIENT_POSTPAID_CREDIT_LIMIT || '100.00'),
};

/**
 * Configurações de logs
 */
export const LOG_CONFIG = {
  level: process.env.LOG_LEVEL || 'info',
};

/**
 * Exportação de todas as configurações em um único objeto
 */
const appConfig = {
  api: API_CONFIG,
  security: SECURITY_CONFIG,
  database: DATABASE_CONFIG,
  message: MESSAGE_CONFIG,
  client: CLIENT_CONFIG,
  log: LOG_CONFIG,
};

// Exibir um resumo de todas as configurações
console.log('\n[CONFIG] Resumo das configurações carregadas:');
console.log(`- API URL: ${API_CONFIG.url}`);
console.log(`- Database Host: ${DATABASE_CONFIG.host}`);
console.log(`- Database Port: ${DATABASE_CONFIG.port}`);
console.log(`- Database Name: ${DATABASE_CONFIG.database}`);
console.log(`- Database User: ${DATABASE_CONFIG.username}`);
console.log(`- Environment: ${API_CONFIG.nodeEnv}`);
console.log(`- Log Level: ${LOG_CONFIG.level}`);
console.log('\n');

export default appConfig;
