import { useState } from 'react';
import type { DocumentType, PlanType } from '../types/auth';
import { authService } from '../services/authService';
import Logo from '../components/Logo';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onLoginClick: () => void;
}

const Register = ({ onRegisterSuccess, onLoginClick }: RegisterProps) => {
  const [name, setName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('CPF');
  const [planType, setPlanType] = useState<PlanType>('prepaid');
  const [balance, setBalance] = useState<string>('');
  const [limit, setLimit] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }
    
    if (documentType === 'CPF' && documentId.length !== 11) {
      setError('CPF deve conter 11 dígitos');
      return false;
    }
    
    if (documentType === 'CNPJ' && documentId.length !== 14) {
      setError('CNPJ deve conter 14 dígitos');
      return false;
    }
    
    if (!/^\d+$/.test(documentId)) {
      setError('Documento deve conter apenas números');
      return false;
    }
    
    if (planType === 'prepaid' && (isNaN(parseFloat(balance)) || parseFloat(balance) < 0)) {
      setError('Saldo inicial deve ser um valor válido');
      return false;
    }
    
    if (planType === 'postpaid' && (isNaN(parseFloat(limit)) || parseFloat(limit) < 0)) {
      setError('Limite mensal deve ser um valor válido');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const clientData = {
        name,
        documentId,
        documentType,
        planType,
        active: true,
      };
      
      // Adicionar saldo ou limite conforme o tipo de plano
      if (planType === 'prepaid' && balance) {
        Object.assign(clientData, { balance: parseFloat(balance) });
      } else if (planType === 'postpaid' && limit) {
        Object.assign(clientData, { limit: parseFloat(limit) });
      }
      
      await authService.createClient(clientData);
      
      // Notificar sucesso de registro
      onRegisterSuccess();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro durante o cadastro');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container card-shadow">
      <Logo size="medium" />
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nome</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Digite seu nome completo"
            disabled={loading}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="documentType">Tipo de Documento</label>
          <select
            id="documentType"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            disabled={loading}
          >
            <option value="CPF">CPF</option>
            <option value="CNPJ">CNPJ</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="documentId">Número do Documento</label>
          <input
            type="text"
            id="documentId"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value.replace(/\D/g, ''))}
            placeholder={documentType === 'CPF' ? "Digite seu CPF (apenas números)" : "Digite seu CNPJ (apenas números)"}
            maxLength={documentType === 'CPF' ? 11 : 14}
            disabled={loading}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="planType">Tipo de Plano</label>
          <select
            id="planType"
            value={planType}
            onChange={(e) => setPlanType(e.target.value as PlanType)}
            disabled={loading}
          >
            <option value="prepaid">Pré-pago</option>
            <option value="postpaid">Pós-pago</option>
          </select>
        </div>
        
        {planType === 'prepaid' ? (
          <div className="form-group">
            <label htmlFor="balance">Saldo Inicial (R$)</label>
            <input
              type="number"
              id="balance"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="Digite o saldo inicial"
              min="0"
              step="0.01"
              disabled={loading}
            />
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="limit">Limite Mensal (R$)</label>
            <input
              type="number"
              id="limit"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="Digite o limite mensal"
              min="0"
              step="0.01"
              disabled={loading}
            />
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>
      
      <div className="login-link">
        <p>Já tem uma conta?</p>
        <button onClick={onLoginClick} disabled={loading}>
          Faça login
        </button>
      </div>
    </div>
  );
};

export default Register;
