import { useState, useEffect } from 'react';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import AdminDashboard from '../pages/AdminDashboard';
import { authService } from '../services/authService';
import '../styles/authContainer.css';

// Define o tipo como uma união de strings literais
type AuthView = 'LOGIN' | 'REGISTER' | 'DASHBOARD' | 'ADMIN_DASHBOARD';

// Constantes para usar no código
const AUTH_VIEW = {
  LOGIN: 'LOGIN' as AuthView,
  REGISTER: 'REGISTER' as AuthView,
  DASHBOARD: 'DASHBOARD' as AuthView,
  ADMIN_DASHBOARD: 'ADMIN_DASHBOARD' as AuthView
}

interface AuthContainerProps {
  onAuthChange?: (status: boolean) => void;
}

const AuthContainer = ({ onAuthChange }: AuthContainerProps) => {
  const [currentView, setCurrentView] = useState<AuthView>(AUTH_VIEW.LOGIN);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Função para limpar todos os dados armazenados no localStorage
  const clearAllStoredData = () => {
    try {
      console.log('Limpando todos os dados armazenados devido a erro de inicialização...');
      // Limpar token de autenticação
      localStorage.removeItem('bcb_token');
      // Limpar dados do cliente
      localStorage.removeItem('bcb_client');
      // Limpar marcação de administrador
      localStorage.removeItem('isAdmin');
      // Limpar dados do administrador
      localStorage.removeItem('bcb_admin_data');
      // Limpar quaisquer outros dados que possam estar causando problemas
      // localStorage.clear(); // Essa opção limpa TUDO, use com cuidado
      
      return true;
    } catch (e) {
      console.error('Erro ao limpar dados:', e);
      return false;
    }
  };

  useEffect(() => {
    // Função para verificar a autenticação com tratamento de erros
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Verificar se o usuário já está autenticado
        const isAuth = authService.isAuthenticated();
        const isAdmin = authService.isAdminAuthenticated();
        
        console.log('Estado de autenticação:', { isAuth, isAdmin });
        
        if (isAuth) {
          if (isAdmin) {
            console.log('Usuário autenticado como administrador');
            setCurrentView(AUTH_VIEW.ADMIN_DASHBOARD);
          } else {
            console.log('Usuário autenticado como cliente');
            setCurrentView(AUTH_VIEW.DASHBOARD);
          }
        } else {
          console.log('Usuário não autenticado');
          setCurrentView(AUTH_VIEW.LOGIN);
        }
        
        // Notificar o componente pai sobre o estado de autenticação
        if (onAuthChange) {
          onAuthChange(isAuth);
        }
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        
        // Limpar todos os dados armazenados quando ocorrer um erro
        // Usar o método do serviço de autenticação para garantir consistência
        authService.clearAllStoredData();
        
        setError('Erro ao carregar a aplicação. Os dados foram limpos automaticamente. Por favor, faça login novamente.');
        setCurrentView(AUTH_VIEW.LOGIN);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [onAuthChange]);
  
  const handleLoginSuccess = () => {
    setCurrentView(AUTH_VIEW.DASHBOARD);
    if (onAuthChange) {
      onAuthChange(true);
    }
  };
  
  const handleRegisterSuccess = () => {
    // Após o registro bem-sucedido, redirecionar para o login
    setCurrentView(AUTH_VIEW.LOGIN);
  };
  
  const handleLogout = () => {
    setCurrentView(AUTH_VIEW.LOGIN);
    if (onAuthChange) {
      onAuthChange(false);
    }
  };
  
  // Manipula o redirecionamento para a página de login de administrador
  const handleAdminLogin = () => {
    // Redirecionar para a página de login de administradores
    window.location.href = '/admin/login';
  };
  
  const renderCurrentView = () => {
    switch (currentView) {
      case AUTH_VIEW.LOGIN:
        return (
          <Login 
            onLoginSuccess={handleLoginSuccess} 
            onRegisterClick={() => setCurrentView(AUTH_VIEW.REGISTER)}
            onAdminLoginClick={handleAdminLogin}
          />
        );
      case AUTH_VIEW.REGISTER:
        return (
          <Register 
            onRegisterSuccess={handleRegisterSuccess} 
            onLoginClick={() => setCurrentView(AUTH_VIEW.LOGIN)} 
          />
        );
      case AUTH_VIEW.DASHBOARD:
        return <Dashboard onLogout={handleLogout} />;
      case AUTH_VIEW.ADMIN_DASHBOARD:
        return <AdminDashboard onLogout={handleLogout} />;
      default:
        return <Login 
          onLoginSuccess={handleLoginSuccess} 
          onRegisterClick={() => setCurrentView(AUTH_VIEW.REGISTER)}
          onAdminLoginClick={handleAdminLogin}
        />;
    }
  };
  
  return (
    <div className="auth-container">
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <div className="error-buttons">
            <button onClick={() => window.location.reload()} className="primary-button">
              Tentar novamente
            </button>
            <button 
              onClick={() => {
                clearAllStoredData();
                window.location.reload();
              }} 
              className="secondary-button"
            >
              Limpar dados e recarregar
            </button>
          </div>
        </div>
      ) : (
        renderCurrentView()
      )}
    </div>
  );
};

export default AuthContainer;
