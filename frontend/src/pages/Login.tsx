import { useState } from 'react';
import type { DocumentType } from '../types/auth';
import { authService } from '../services/authService';
import Logo from '../components/Logo';

interface LoginProps {
  onLoginSuccess: () => void;
  onRegisterClick: () => void;
  onAdminLoginClick: () => void;
}

const Login = ({ onLoginSuccess, onRegisterClick, onAdminLoginClick }: LoginProps) => {
  const [documentId, setDocumentId] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('CPF');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateDocument = (doc: string, type: DocumentType): boolean => {
    if (type === 'CPF' && doc.length !== 11) {
      setError('CPF deve conter 11 dígitos');
      return false;
    }
    
    if (type === 'CNPJ' && doc.length !== 14) {
      setError('CNPJ deve conter 14 dígitos');
      return false;
    }
    
    if (!/^\d+$/.test(doc)) {
      setError('Documento deve conter apenas números');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateDocument(documentId, documentType)) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await authService.login({
        documentId,
        documentType
      });
      
      // Salvar token e dados do cliente
      authService.saveToken(response.token);
      authService.saveClientData(response.client);
      
      // Notificar sucesso de login
      onLoginSuccess();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro durante o login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container card-shadow">
      <Logo size="medium" />
      <form onSubmit={handleSubmit}>
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
        
        {error && <div className="error-message">{error}</div>}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      
      <div className="register-link">
        <p>Não tem uma conta?</p>
        <button onClick={onRegisterClick} disabled={loading}>
          Cadastre-se
        </button>
      </div>
      
      <div className="admin-login-link">
        <button 
          onClick={onAdminLoginClick} 
          disabled={loading}
          className="admin-login-button"
        >
          Entrar como Admin
        </button>
      </div>
    </div>
  );
};

export default Login;
