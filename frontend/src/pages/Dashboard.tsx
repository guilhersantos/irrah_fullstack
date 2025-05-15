import { useEffect, useState } from 'react';
import type { Client } from '../types/auth';
import { authService } from '../services/authService';
import Logo from '../components/Logo';
import Messages from './Messages';
import '../styles/dashboard.css';

interface DashboardProps {
  onLogout: () => void;
}

// Tipos de seções disponíveis no dashboard
type DashboardSection = 'home' | 'messages' | 'profile' | 'settings';

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [client, setClient] = useState<Client | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<DashboardSection>('home');
  
  // Função para atualizar os dados do cliente
  const updateClientData = () => {
    const clientData = authService.getClientData();
    if (clientData) {
      setClient(clientData);
    }
  };
  
  useEffect(() => {
    // Carregar dados do cliente do localStorage
    updateClientData();
    
    // Atualizar os dados do cliente a cada vez que o dashboard é exibido
    const handleFocus = () => {
      updateClientData();
    };
    
    // Adicionar listener para quando a janela receber foco
    window.addEventListener('focus', handleFocus);
    
    // Limpar o listener quando o componente for desmontado
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const navigateTo = (section: DashboardSection) => {
    // Atualizar dados do cliente ao navegar, especialmente quando voltar para a home
    if (section === 'home') {
      updateClientData();
    }
    
    setActiveSection(section);
    setMenuOpen(false); // Fecha o menu ao navegar em dispositivos móveis
  };
  
  if (!client) {
    return <div className="loading-container">Carregando...</div>;
  }
  
  // Renderiza o conteúdo com base na seção ativa
  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <>
            <div className="content-section account-info">
              <h2>Informações da Conta</h2>
              <div className="info-cards">
                <div className="info-card">
                  <div className="card-icon document-icon"></div>
                  <div className="card-content">
                    <h3>Documento</h3>
                    <p>{client.documentType === 'CPF' 
                      ? `CPF: ${client.documentId.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}` 
                      : `CNPJ: ${client.documentId.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}`}
                    </p>
                  </div>
                </div>
                
                <div className="info-card">
                  <div className="card-icon plan-icon"></div>
                  <div className="card-content">
                    <h3>Plano</h3>
                    <p>{client.planType === 'prepaid' ? 'Pré-pago' : 'Pós-pago'}</p>
                  </div>
                </div>
                
                <div className="info-card">
                  <div className="card-icon finance-icon"></div>
                  <div className="card-content">
                    <h3>{client.planType === 'prepaid' ? 'Saldo Atual' : 'Limite Mensal'}</h3>
                    <p className={client.planType === 'prepaid' ? 'balance' : 'limit'}>
                      R$ {client.planType === 'prepaid' 
                        ? (client.balance ? Number(client.balance).toFixed(2) : '0.00')
                        : (client.limit ? Number(client.limit).toFixed(2) : '0.00')}
                    </p>
                    {client.planType === 'postpaid' && (
                      <p className="limit-info">Consumo mensal não disponível</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="content-section quick-actions">
              <h2>Ações Rápidas</h2>
              <div className="action-buttons">
                <button className="action-button" onClick={() => navigateTo('messages')}>Enviar Mensagem</button>
                <button className="action-button">Atualizar Dados</button>
                <button className="action-button">Suporte</button>
              </div>
            </div>
          </>
        );
      case 'messages':
        return <Messages />;
      /* case 'profile':
        return (
          <div className="content-section">
            <h2>Meu Perfil</h2>
            <p>Funcionalidade em desenvolvimento.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="content-section">
            <h2>Configurações</h2>
            <p>Funcionalidade em desenvolvimento.</p>
          </div>
        ); */
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-wrapper">
      {/* Menu toggle button for mobile */}
      <button className="menu-toggle" onClick={toggleMenu}>
        <span className="menu-icon"></span>
      </button>

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Logo size="small" />
          <button className="close-menu" onClick={toggleMenu}>&times;</button>
        </div>
        
        <div className="sidebar-user">
          <div className="user-avatar">{client.name.charAt(0)}</div>
          <div className="user-info">
            <h3>{client.name}</h3>
            <span className={client.active ? 'active-status' : 'inactive-status'}>
              {client.active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li className={activeSection === 'home' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }}>Dashboard</a>
            </li>
            <li className={activeSection === 'messages' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('messages'); }}>Mensagens</a>
            </li>
            {/* <li className={activeSection === 'profile' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('profile'); }}>Meu Perfil</a>
            </li>
            <li className={activeSection === 'settings' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('settings'); }}>Configurações</a>
            </li> */}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">Sair</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        {activeSection !== 'messages' && (
          <header className="main-header">
            <div className="header-left">
              <button className="menu-toggle" onClick={toggleMenu}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <h1>
                {activeSection === 'home' && 'Dashboard'}
                {/* {activeSection === 'profile' && 'Meu Perfil'}
                {activeSection === 'settings' && 'Configurações'} */}
              </h1>
            </div>
            <div className="header-actions">
              <span className="welcome-text">Bem-vindo, {client.name}</span>
              <button onClick={handleLogout} className="logout-button-desktop">Sair</button>
            </div>
          </header>
        )}
        
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
