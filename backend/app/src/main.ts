import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { logDatabaseConfig, logDatabaseError } from './utils/database-logger';

async function bootstrap() {
  try {
    // Exibir informações detalhadas sobre a configuração do banco de dados
    logDatabaseConfig();
    
    // Criar a aplicação NestJS
    const app = await NestFactory.create(AppModule);
    
    // Obter serviço de configuração
    const configService = app.get(ConfigService);
    
    // Configurar o nível de log com base na variável de ambiente
    const logLevel = configService.get('LOG_LEVEL') || 'info';
  
    // Configurar prefixo global para todas as rotas
    const apiPrefix = configService.get<string>('API_PREFIX') || 'api';
    app.setGlobalPrefix(apiPrefix, {
      exclude: ['/health', '/'], // Excluir algumas rotas do prefixo global
    });
    
    console.log(`Prefixo global configurado: ${apiPrefix}`);
    console.log(`Rotas com prefixo: /${apiPrefix}/*`);
    console.log(`Rotas sem prefixo: /, /health`);
    
    // Habilitar CORS com configurações personalizadas
    app.enableCors({
      origin: true, // Permitir conexões de qualquer origem
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: 'Content-Type,Authorization,Accept',
      exposedHeaders: 'Content-Disposition',
      maxAge: 3600,
    });
    
    // Log para depuração
    console.log('\n[CORS] Configuração CORS habilitada para todas as origens');
    
    // Configurar validação global
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    
    // Configurar Swagger
    const config = new DocumentBuilder()
      .setTitle('BCB API')
      .setDescription('API para o sistema Big Chat Brasil')
      .setVersion('1.0')
      .addTag('app', 'Endpoints gerais da aplicação')
      .addTag('auth', 'Autenticação e autorização')
      .addTag('clients', 'Gerenciamento de clientes')
      .addTag('conversations', 'Gerenciamento de conversas')
      .addTag('messages', 'Gerenciamento de mensagens')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(apiPrefix, app, document);
    
    // Usar a porta da configuração
    const port = configService.get<number>('PORT') || 3000;
    const host = configService.get<string>('HOST') || 'localhost';
    
    // Gerar a API_URL dinamicamente se não estiver definida no .env
    let apiUrl = configService.get<string>('API_URL');
    if (!apiUrl) {
      apiUrl = `http://${host}:${port}/${apiPrefix}`;
      // Definir a variável de ambiente API_URL em tempo de execução
      process.env.API_URL = apiUrl;
    }
    
    // Iniciar o servidor na porta especificada
    // Usar '0.0.0.0' como host para garantir que o servidor seja acessível de fora do contêiner
    await app.listen(port, '0.0.0.0');
    
    console.log(`Servidor escutando em: 0.0.0.0:${port}`);
    console.log(`Prefixo global da API: ${apiPrefix}`);
    console.log(`URL completa da API: http://localhost:${port}/${apiPrefix}`);
    
    // Exibir informações sobre o servidor
    const nodeEnv = configService.get('NODE_ENV') || 'development';
    console.log(`=======================================================`);
    console.log(`Aplicação BCB (Big Chat Brasil) iniciada com sucesso!`);
    console.log(`=======================================================`);
    console.log(`Ambiente: ${nodeEnv}`);
    console.log(`API URL: ${apiUrl}`);
    console.log(`Swagger: http://${host}:${port}/${apiPrefix}`);
    console.log(`=======================================================`);
  } catch (error) {
    // Registrar o erro de conexão com o banco de dados
    console.error('Erro ao iniciar a aplicação:');
    logDatabaseError(error);
    process.exit(1); // Encerrar o processo com código de erro
  }
}
bootstrap();
