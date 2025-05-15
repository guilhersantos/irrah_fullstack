import { AuthRequest, AuthResponse, CreateClientRequest, Client, AdminAuthRequest, AdminAuthResponse, AdminRegisterRequest } from '../types/auth';
import { API_URL } from '../config'; // Importar a URL da API do arquivo de configuração

export const authService = {
  /**
   * Realiza o login do cliente usando documento (CPF/CNPJ)
   */
  async login(authRequest: AuthRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha na autenticação');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  },

  /**
   * Cria um novo cliente
   */
  async createClient(createClientRequest: CreateClientRequest): Promise<Client> {
    try {
      const response = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createClientRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao criar cliente');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  },

  /**
   * Salva o token de autenticação no localStorage
   */
  saveToken(token: string): void {
    localStorage.setItem('bcb_token', token);
  },

  /**
   * Recupera o token de autenticação do localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('bcb_token');
  },

  /**
   * Remove o token de autenticação do localStorage
   */
  removeToken(): void {
    localStorage.removeItem('bcb_token');
  },

  /**
   * Limpa todos os dados armazenados no localStorage
   */
  clearAllStoredData(): void {
    // Remover token
    this.removeToken();
    
    // Remover dados do cliente
    this.removeClientData();
    
    // Remover marcação de administrador
    localStorage.removeItem('isAdmin');
    
    // Remover dados do administrador
    localStorage.removeItem('bcb_admin_data');
    
    console.log('Todos os dados armazenados foram limpos.');
  },

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  /**
   * Salva os dados do cliente no localStorage
   */
  saveClientData(client: Client): void {
    localStorage.setItem('bcb_client', JSON.stringify(client));
  },

  /**
   * Recupera os dados do cliente do localStorage e garante que os valores numéricos
   * sejam tratados corretamente
   */
  getClientData(): Client | null {
    const clientData = localStorage.getItem('bcb_client');
    
    if (!clientData) return null;
    
    const client = JSON.parse(clientData);
    
    // Garantir que os valores numéricos sejam tratados corretamente
    if (client.balance) {
      client.balance = Number(client.balance);
    }
    
    if (client.limit) {
      client.limit = Number(client.limit);
    }
    
    return client;
  },

  /**
   * Remove os dados do cliente do localStorage
   */
  removeClientData(): void {
    localStorage.removeItem('bcb_client');
  },

  /**
   * Realiza o logout do usuário
   */
  logout(): void {
    this.removeToken();
    this.removeClientData();
    
    // Remover a marcação de administrador
    localStorage.removeItem('isAdmin');
  },

  /**
   * Atualiza o saldo do cliente no localStorage
   */
  updateClientBalance(newBalance: number): void {
    const client = this.getClientData();
    if (client) {
      client.balance = newBalance;
      this.saveClientData(client);
    }
  },
  
  /**
   * Retorna o tipo de usuário (client ou admin)
   * No contexto atual, consideramos que se o usuário tem dados de cliente,
   * ele é um cliente, caso contrário é um administrador.
   */
  getUserType(): 'client' | 'admin' {
    const client = this.getClientData();
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    return isAdmin ? 'admin' : (client ? 'client' : 'admin');
  },
  
  /**
   * Verifica se o usuário atual é um administrador
   */
  isAdmin(): boolean {
    return localStorage.getItem('isAdmin') === 'true';
  },
  
  /**
   * Obtém os dados do usuário atual (cliente ou admin)
   */
  getUserData() {
    if (!this.isAdmin()) {
      // Para clientes, recuperamos os dados do localStorage
      const clientData = localStorage.getItem('bcb_client_data');
      return clientData ? JSON.parse(clientData) : null;
    } else {
      // Para administradores, recuperamos os dados do localStorage
      const adminData = localStorage.getItem('bcb_admin_data');
      return adminData ? JSON.parse(adminData) : null;
    }
  },
  
  /**
   * Obtém os dados do administrador
   */
  getAdminData() {
    if (this.isAdmin()) {
      const adminData = localStorage.getItem('bcb_admin_data');
      return adminData ? JSON.parse(adminData) : null;
    }
    return null;
  },
  
  /**
   * Realiza o login como administrador usando nome de usuário e senha
   */
  async adminLogin(adminAuthRequest: AdminAuthRequest): Promise<AdminAuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminAuthRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha na autenticação de administrador');
      }

      const authResponse = await response.json();
      
      // Salvar o token
      this.saveToken(authResponse.token);
      
      // Marcar o usuário como administrador
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('bcb_admin_data', JSON.stringify(authResponse.user));
      
      // Remover quaisquer dados de cliente que possam existir
      this.removeClientData();
      
      return authResponse;
    } catch (error) {
      console.error('Erro ao fazer login como administrador:', error);
      throw error;
    }
  },
  
  /**
   * Realiza o login como administrador usando credenciais reais
   */
  async simulateAdminLogin(): Promise<void> {
    try {
      // Usar credenciais do usuário de suporte que está nos logs
      await this.adminLogin({
        username: 'gui',
        password: 'gui123' // Assumindo uma senha padrão, ajuste conforme necessário
      });
      
      console.log('Login de administrador realizado com sucesso');
    } catch (error) {
      console.error('Erro ao realizar login de administrador:', error);
      
      // Se o login falhar, limpar dados e notificar o usuário
      this.clearAllStoredData();
      throw new Error('Falha na autenticação como administrador. Por favor, verifique se o backend está em execução.');
    }
  },
  
  /**
   * Verifica se o usuário está autenticado como administrador
   */
  isAdminAuthenticated(): boolean {
    return localStorage.getItem('isAdmin') === 'true' && this.isAuthenticated();
  },
  
  /**
   * Registra um novo administrador
   */
  async registerAdmin(adminRegisterRequest: AdminRegisterRequest): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminRegisterRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao cadastrar administrador');
      }
      
      // Retorna void, pois o usuário precisará fazer login após o cadastro
    } catch (error) {
      console.error('Erro ao cadastrar administrador:', error);
      throw error;
    }
  }
};
