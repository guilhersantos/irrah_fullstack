export type DocumentType = 'CPF' | 'CNPJ';

export type PlanType = 'prepaid' | 'postpaid';

export interface AuthRequest {
  documentId: string;         // CPF ou CNPJ
  documentType: DocumentType;
}

export interface Client {
  id: string;              // Identificador do cliente
  name: string;            // Nome do cliente
  documentId: string;      // CPF ou CNPJ do cliente
  documentType: DocumentType;
  balance?: number;        // Saldo para pré-pago
  limit?: number;          // Limite para pós-pago
  planType: PlanType;
  active: boolean;
}

export interface AuthResponse {
  token: string;           // Token de identificação simples
  client: Client;
}

export interface AdminAuthRequest {
  username: string;
  password: string;
}

export interface AdminAuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export interface AdminRegisterRequest {
  name: string;
  password: string;
  role: 'admin' | 'support';
}

export interface CreateClientRequest {
  name: string;
  documentId: string;
  documentType: DocumentType;
  planType: PlanType;
  balance?: number;
  limit?: number;
}
