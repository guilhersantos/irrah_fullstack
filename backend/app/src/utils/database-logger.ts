/**
 * Logger personalizado para o banco de dados
 * Este arquivo contém funções para ajudar na depuração da conexão com o banco de dados
 */

import { DATABASE_CONFIG } from '../config/app.config';

/**
 * Imprime informações detalhadas sobre a configuração do banco de dados
 */
export const logDatabaseConfig = () => {
  console.log('\n=======================================================');
  console.log('CONFIGURAÇÃO DO BANCO DE DADOS');
  console.log('=======================================================');
  console.log(`Host: ${DATABASE_CONFIG.host}`);
  console.log(`Porta: ${DATABASE_CONFIG.port}`);
  console.log(`Banco de dados: ${DATABASE_CONFIG.database}`);
  console.log(`Usuário: ${DATABASE_CONFIG.username}`);
  console.log(`Sincronização automática: ${DATABASE_CONFIG.synchronize ? 'Ativada' : 'Desativada'}`);
  console.log(`Logging: ${DATABASE_CONFIG.logging ? 'Ativado' : 'Desativado'}`);
  console.log('=======================================================\n');
  
  // Verificar se estamos usando o host correto para o Docker
  if (DATABASE_CONFIG.host === 'localhost' || DATABASE_CONFIG.host === '127.0.0.1') {
    console.warn('\n⚠️ AVISO: Você está tentando conectar ao banco de dados usando localhost ou 127.0.0.1');
    console.warn('Quando estiver rodando em containers Docker, você deve usar o nome do serviço como host.');
    console.warn('Para o Docker Compose, o host correto seria "db" em vez de "localhost".');
    console.warn('Verifique seu arquivo .env ou a variável DATABASE_URL no docker-compose.yml\n');
  }
  
  // Sugerir comando para testar a conexão
  console.log('\nPara testar a conexão com o banco de dados, você pode executar:');
  console.log(`pg_isready -h ${DATABASE_CONFIG.host} -p ${DATABASE_CONFIG.port} -U ${DATABASE_CONFIG.username}\n`);
};

/**
 * Registra um erro de conexão com o banco de dados
 */
export const logDatabaseError = (error: any) => {
  console.error('\n=======================================================');
  console.error('ERRO DE CONEXÃO COM O BANCO DE DADOS');
  console.error('=======================================================');
  console.error(`Mensagem: ${error.message}`);
  
  if (error.code) {
    console.error(`Código: ${error.code}`);
    
    // Fornecer dicas com base no código de erro
    switch (error.code) {
      case 'ECONNREFUSED':
        console.error('\nDica: O servidor de banco de dados não está acessível.');
        console.error('- Verifique se o servidor PostgreSQL está em execução');
        console.error('- Verifique se o host e a porta estão corretos');
        console.error('- Se estiver usando Docker, verifique se o nome do serviço está correto (deve ser "db")');
        break;
      case 'ETIMEDOUT':
        console.error('\nDica: A conexão com o banco de dados atingiu o tempo limite.');
        console.error('- Verifique se o servidor PostgreSQL está acessível na rede');
        console.error('- Verifique se as regras de firewall permitem a conexão');
        break;
      case '28P01':
        console.error('\nDica: Autenticação falhou - senha incorreta.');
        console.error('- Verifique se a senha está correta no arquivo .env ou DATABASE_URL');
        break;
      case '3D000':
        console.error('\nDica: Banco de dados não existe.');
        console.error('- Verifique se o nome do banco de dados está correto');
        console.error('- Verifique se o banco de dados foi criado');
        break;
      default:
        console.error('\nDica: Verifique as configurações de conexão no arquivo .env ou DATABASE_URL');
    }
  }
  
  console.error('=======================================================\n');
};
