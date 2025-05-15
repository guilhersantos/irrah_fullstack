# BCB - Big Chat Brasil

Sistema de comunicação em tempo real para empresas se comunicarem com seus clientes. O BCB permite que empresas (PF/PJ) mantenham conversas com clientes finais através de uma interface moderna e eficiente.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação e Execução](#instalação-e-execução)
- [API Documentation](#api-documentation)
- [Comunicação em Tempo Real](#comunicação-em-tempo-real)
- [Autenticação e Autorização](#autenticação-e-autorização)
- [Contribuição](#contribuição)

## 🔍 Visão Geral

O BCB (Big Chat Brasil) é uma plataforma de comunicação em tempo real que permite empresas se comunicarem com seus clientes através de um sistema de chat moderno e eficiente. A plataforma suporta diferentes tipos de usuários (clientes e administradores), gerenciamento de conversas, envio de mensagens com prioridades diferentes e notificações em tempo real.

## 🛠️ Tecnologias Utilizadas

### Backend
- **NestJS**: Framework para construção de aplicações server-side eficientes e escaláveis
- **TypeScript**: Linguagem de programação tipada
- **PostgreSQL**: Banco de dados relacional
- **TypeORM**: ORM para TypeScript e JavaScript
- **Socket.IO**: Biblioteca para comunicação em tempo real
- **JWT**: JSON Web Tokens para autenticação
- **Swagger**: Documentação da API

### Frontend
- **React**: Biblioteca JavaScript para construção de interfaces
- **TypeScript**: Linguagem de programação tipada
- **Socket.IO-Client**: Cliente para comunicação em tempo real
- **CSS Modules**: Estilização modular de componentes

## 🏗️ Arquitetura

O projeto segue uma arquitetura modular, com separação clara entre backend e frontend:

### Backend (NestJS)
- **Arquitetura em Camadas**: Controllers, Services, Repositories
- **Módulos**: Cada funcionalidade é encapsulada em módulos independentes
- **Injeção de Dependências**: Gerenciamento automático de dependências
- **WebSockets**: Gateway para comunicação em tempo real

### Frontend (React)
- **Componentes**: Arquitetura baseada em componentes reutilizáveis
- **Serviços**: Camada de serviços para comunicação com a API
- **Context API**: Gerenciamento de estado global
- **Hooks**: Lógica reutilizável com React Hooks

## ✨ Funcionalidades

### Funcionalidades do Backend

1. **Autenticação e Autorização**
   - Login e registro de usuários
   - Autenticação via JWT
   - Controle de acesso baseado em roles (admin, cliente)

2. **Gerenciamento de Clientes**
   - Cadastro e atualização de clientes
   - Diferentes tipos de planos (pré-pago, pós-pago)
   - Gestão de saldo para clientes pré-pagos

3. **Sistema de Mensagens**
   - Envio de mensagens com diferentes prioridades
   - Cálculo automático de custo (R$0,25 para mensagens normais, R$0,50 para urgentes)
   - Dedução automática do saldo para clientes pré-pagos
   - Status de mensagens (enviada, entregue, lida)

4. **Gerenciamento de Conversas**
   - Criação e listagem de conversas
   - Contagem de mensagens não lidas
   - Arquivamento de conversas

5. **Comunicação em Tempo Real**
   - WebSocket para notificações instantâneas
   - Canais específicos para conversas
   - Indicador de status de conexão

### Funcionalidades do Frontend

1. **Interface de Usuário**
   - Design responsivo e moderno
   - Diferentes interfaces para clientes e administradores
   - Indicadores visuais de status de mensagens

2. **Gestão de Conversas**
   - Lista de conversas com preview da última mensagem
   - Indicador de mensagens não lidas
   - Filtros e pesquisa de conversas

3. **Sistema de Chat**
   - Envio e recebimento de mensagens em tempo real
   - Suporte para diferentes tipos de mensagens (normal, urgente)
   - Indicador de status de conexão
   - Rolagem automática para novas mensagens

4. **Painel Administrativo**
   - Visão geral de clientes e conversas
   - Métricas e estatísticas de uso
   - Gerenciamento de usuários e permissões

5. **Gerenciamento de Conta**
   - Visualização e recarga de saldo (para clientes pré-pagos)
   - Histórico de transações
   - Configurações de perfil e notificações

## 📁 Estrutura do Projeto

```
fullstack/
├── backend/
│   ├── app/
│   │   ├── src/
│   │   │   ├── app.module.ts
│   │   │   ├── main.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── clients/
│   │   │   │   ├── conversations/
│   │   │   │   ├── messages/
│   │   │   │   ├── users/
│   │   │   │   └── websocket/
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
└── README.md
```

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js (v22 ou superior)
- PostgreSQL (v15 ou superior)
- Docker e Docker Compose

### Configuração do Backend

1. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` baseado no `.env.example`
   - Configure a URL da API e outras variáveis necessárias



### Usando Docker

Para executar todo o projeto usando Docker:

1. Na raiz do projeto, execute:
   ```bash
   docker-compose up -d
   ```

2. O backend estará disponível em `http://localhost:3000`
3. O frontend estará disponível em `http://localhost:5173`

## 📚 API Documentation

A documentação da API está disponível através do Swagger UI:

- Acesse `http://localhost:3000/api` após iniciar o servidor backend
- A documentação inclui todos os endpoints, parâmetros e exemplos de resposta

## 🔄 Comunicação em Tempo Real

O sistema utiliza Socket.IO para comunicação em tempo real entre clientes e administradores:

### Backend (WebSocket Gateway)

- **Conexão**: Autenticação via JWT para estabelecer conexão
- **Canais**: Canais específicos para conversas e tipos de usuários
- **Eventos**:
  - `new_message`: Nova mensagem enviada
  - `message_sent`: Confirmação de envio de mensagem
  - `message_received`: Confirmação de recebimento de mensagem
  - `user_joined`: Usuário entrou na conversa
  - `connection_status`: Status de conexão

### Frontend (Socket Service)

- **Conexão**: Estabelece conexão com o servidor WebSocket
- **Reconexão Automática**: Tenta reconectar automaticamente em caso de falha
- **Fallback**: Utiliza API REST como fallback quando o WebSocket falha
- **Listeners**: Registra listeners para diferentes eventos

## 🔐 Autenticação e Autorização

O sistema utiliza JWT (JSON Web Tokens) para autenticação:

- **Login**: Gera um token JWT válido por 24 horas
- **Middleware de Autenticação**: Verifica a validade do token em cada requisição
- **Guards**: Controle de acesso baseado em roles (admin, cliente)
- **WebSocket**: Autenticação via token no handshake inicial



---

Desenvolvido por Guilherme com Windsurf
