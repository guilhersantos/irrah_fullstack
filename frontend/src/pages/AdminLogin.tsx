import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { AdminAuthRequest } from '../types/auth';
import Logo from '../components/Logo';
import '../styles/login.css';
import '../styles/adminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const adminAuthRequest: AdminAuthRequest = {
        username,
        password
      };
      
      await authService.adminLogin(adminAuthRequest);
      
      // Redirecionar para o dashboard administrativo
      navigate('/admin');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro ao fazer login como administrador');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/');
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <Logo />
          <h1>Login de Administrador</h1>
          <p>Acesse o painel administrativo do BCB</p>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Nome de Usuário</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu nome de usuário"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="admin-login-actions">
          <button 
            className="back-button"
            onClick={handleBackToLogin}
            disabled={loading}
          >
            Voltar para Login de Cliente
          </button>
          
          <button 
            className="register-button"
            onClick={() => navigate('/admin/register')}
            disabled={loading}
            type="button"
          >
            Cadastrar como Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
