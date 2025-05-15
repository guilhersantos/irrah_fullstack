# BCB (Big Chat Brasil) - Backend API

API para o sistema BCB (Big Chat Brasil), uma plataforma de chat para comunicação entre empresas (PF/PJ) e clientes finais.

## Tecnologias Utilizadas

- NestJS (TypeScript)
- MongoDB (Mongoose)
- JWT para autenticação
- Swagger para documentação

## Estrutura do Projeto

```
src/
├── config/           # Configurações do sistema
├── controllers/      # Controladores da API
├── dto/              # Data Transfer Objects
├── guards/           # Guards de autenticação
├── models/           # Modelos de dados (MongoDB)
├── modules/          # Módulos NestJS
├── services/         # Serviços de negócio
├── strategies/       # Estratégias de autenticação
├── app.module.ts     # Módulo principal
└── main.ts           # Ponto de entrada
```

## Endpoints da API

### Autenticação

- `POST /auth/login/client` - Login de cliente
- `POST /auth/login/admin` - Login de administrador
- `POST /auth/register/client` - Registro de novo cliente
- `GET /auth/validate` - Validar token JWT

### Mensagens

- `POST /messages` - Enviar uma nova mensagem
- `GET /messages/conversation/:conversationId` - Obter mensagens de uma conversa
- `PATCH /messages/:messageId/status` - Atualizar o status de uma mensagem

### Conversas

- `GET /conversations` - Obter todas as conversas do cliente
- `GET /conversations/:conversationId` - Obter uma conversa específica
- `POST /conversations` - Criar uma nova conversa
- `PATCH /conversations/:conversationId` - Atualizar o título de uma conversa
- `DELETE /conversations/:conversationId` - Arquivar uma conversa

## Preços das Mensagens

- Mensagem Normal: R$ 0,25
- Mensagem Urgente: R$ 0,50

## Executando o Projeto

### Requisitos

- Node.js (v14 ou superior)
- MongoDB
- Yarn

### Instalação

```bash
# Instalar dependências
yarn install
```

### Configuração

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
MONGODB_URI=mongodb://localhost:27017/bcb
JWT_SECRET=seu-segredo-jwt
```

### Executando em Desenvolvimento

```bash
# Windows
.\start-dev.bat

# Linux/Mac
./start-dev.sh
```

### Acessando a Documentação

Após iniciar o servidor, acesse a documentação Swagger em:

```
http://localhost:3000/api
```

## Modelos de Dados

### Cliente (Client)

```typescript
{
  name: string;
  email: string;
  password: string;
  documentType: 'CPF' | 'CNPJ';
  documentId: string;
  planType: 'prepaid' | 'postpaid';
  balance?: number;
  limit?: number;
  active: boolean;
}
```

### Mensagem (Message)

```typescript
{
  conversationId: ObjectId;
  content: string;
  sentBy: {
    id: ObjectId;
    type: 'client' | 'admin';
  };
  timestamp: Date;
  priority: 'normal' | 'urgent';
  status: 'queued' | 'processing' | 'sent' | 'delivered' | 'read' | 'failed';
  cost: number;
}
```

### Conversa (Conversation)

```typescript
{
  clientId: ObjectId;
  adminId?: ObjectId;
  title: string;
  lastMessage?: {
    content: string;
    timestamp: Date;
    sentByClient: boolean;
  };
  unreadCount: {
    client: number;
    admin: number;
  };
  active: boolean;
}
```

## Autores

- Equipe BCB
