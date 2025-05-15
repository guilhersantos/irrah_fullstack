import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import Logo from '../components/Logo';
import '../styles/adminLogin.css';

const AdminRegister = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('support');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await authService.registerAdmin({
        name,
        password,
        role: role as 'admin' | 'support'
      });
      
      // Redirecionar para a página de login de administradores
      navigate('/admin/login');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro ao cadastrar administrador');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/admin/login');
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <Logo />
          <h1>Cadastro de Administrador</h1>
          <p>Crie uma conta de administrador para o BCB</p>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="name">Nome de Usuário</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua senha"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="role">Papel</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              <option value="admin">Administrador</option>
              <option value="support">Suporte</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
        
        <button 
          className="back-button"
          onClick={handleBackToLogin}
          disabled={loading}
        >
          Voltar para Login
        </button>
      </div>
    </div>
  );
};

export default AdminRegister;
