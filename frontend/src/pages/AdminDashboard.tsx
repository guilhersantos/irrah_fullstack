import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { messageService } from '../services/messageService';
import { Conversation } from '../types/messages';
import { Client } from '../types/auth';
import Logo from '../components/Logo';
import '../styles/adminDashboard.css';

interface AdminDashboardProps {
  onLogout: () => void;
}

// Tipos de seções disponíveis no dashboard administrativo
type AdminSection = 'conversations' | 'clients' | 'settings';

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  
  useEffect(() => {
    // Carregar dados iniciais
    fetchData();
  }, []);
  
  const [error, setError] = useState<string | null>(null);

  // Dados simulados para desenvolvimento
  const simulatedData = {
    // Lista de conversas simuladas
    conversations: [
      {
        id: '1',
        title: 'Suporte Técnico',
        clientId: '101',
        client: {
          id: '101',
          name: 'João Silva',
          documentType: 'CPF',
          documentId: '123.456.789-00',
          planType: 'prepaid',
          balance: 50.0
        },
        lastMessage: {
          content: 'Como posso ajudar?',
          timestamp: new Date(),
          sentByClient: false
        },
        unreadCount: {
          client: 1,
          admin: 0
        },
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        title: 'Informações sobre Planos',
        clientId: '102',
        client: {
          id: '102',
          name: 'Maria Oliveira',
          documentType: 'CNPJ',
          documentId: '12.345.678/0001-90',
          planType: 'postpaid',
          balance: 0.0,
          limit: 200.0
        },
        lastMessage: {
          content: 'Quais são os planos disponíveis?',
          timestamp: new Date(),
          sentByClient: true
        },
        unreadCount: {
          client: 0,
          admin: 2
        },
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se o usuário está autenticado como administrador
      if (!authService.isAdminAuthenticated()) {
        // Se não estiver autenticado, redirecionar para a página de login
        console.log('Usuário não autenticado como administrador. Redirecionando para login...');
        navigate('/admin/login');
        return; // Interromper a execução
      }
      
      try {
        // Tentar carregar conversas da API usando o endpoint de admin
        const conversationsData = await messageService.getConversations(1, 10, true);
        // Extrair apenas o array de conversas do objeto retornado
        setConversations(conversationsData.conversations);
        
        // Extrair clientes das conversas
        const uniqueClients: Record<string, Client> = {};
        conversationsData.conversations.forEach((conv: Conversation) => {
          if (conv.client && !uniqueClients[conv.clientId]) {
            uniqueClients[conv.clientId] = conv.client;
          }
        });
        setClients(Object.values(uniqueClients));
        
        // Limpar qualquer erro anterior
        setError(null);
      } catch (apiError) {
        console.warn('Erro ao carregar dados da API:', apiError);
        
        // Verificar se é um erro de autenticação
        const errorMessage = apiError instanceof Error ? apiError.message : 'Erro desconhecido';
        const isAuthError = errorMessage.includes('expirada') || 
                          errorMessage.includes('Unauthorized') || 
                          errorMessage.includes('401') || 
                          errorMessage.includes('autenticação');
        
        if (isAuthError) {
          console.error('Erro de autenticação detectado no dashboard admin');
          setError(`Erro de autenticação: ${errorMessage}. Por favor, faça login novamente.`);
          
          // Limpar dados e redirecionar para login após um breve atraso
          setTimeout(() => {
            authService.clearAllStoredData();
            if (onLogout) onLogout();
          }, 3000);
        } else {
          // Para outros erros, usar dados simulados
          console.log('Usando dados simulados devido ao erro');
          setConversations(simulatedData.conversations);
          
          // Extrair clientes das conversas simuladas
          const uniqueClients: Record<string, Client> = {};
          simulatedData.conversations.forEach((conv: Conversation) => {
            if (conv.client && !uniqueClients[conv.clientId]) {
              uniqueClients[conv.clientId] = conv.client;
            }
          });
          setClients(Object.values(uniqueClients));
          
          setError(`Erro ao carregar dados: ${errorMessage}. Exibindo dados simulados.`);
        }
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro desconhecido ao carregar dados');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const navigateTo = (section: AdminSection) => {
    setActiveSection(section);
    setMenuOpen(false); // Fecha o menu ao navegar em dispositivos móveis
    
    // Resetar seleções ao mudar de seção
    setSelectedClient(null);
    setSelectedConversation(null);
    setEditingClient(null);
  };
  
  const navigate = useNavigate();
  
  const handleViewConversation = (conversationId: string) => {
    // Navegar para a página de mensagens do administrador com o ID da conversa
    // Usando o parâmetro 'conversation' para corresponder ao que a página AdminMessages.tsx espera
    navigate(`/admin/messages?conversation=${conversationId}`);
  };
  
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setEditingClient(null);
  };
  
  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };
  
  const handleEditClient = (client: Client) => {
    setEditingClient({...client});
  };
  
  const handleSaveClientChanges = async () => {
    if (!editingClient) return;
    
    try {
      // Em um sistema real, isso enviaria os dados para a API
      // Aqui estamos apenas atualizando o estado local
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === editingClient.id ? editingClient : c
        )
      );
      
      // Atualizar o cliente nas conversas também
      setConversations(prevConversations => 
        prevConversations.map(conv => {
          if (conv.clientId === editingClient.id && conv.client) {
            return {...conv, client: editingClient};
          }
          return conv;
        })
      );
      
      setEditingClient(null);
      setSelectedClient(editingClient);
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
    }
  };
  
  const handleAddCredit = async () => {
    if (!selectedClient || creditAmount <= 0) return;
    
    try {
      // Em um sistema real, isso enviaria os dados para a API
      // Aqui estamos apenas atualizando o estado local
      const updatedClient = {
        ...selectedClient,
        balance: (Number(selectedClient.balance) || 0) + creditAmount
      };
      
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === selectedClient.id ? updatedClient : c
        )
      );
      
      // Atualizar o cliente nas conversas também
      setConversations(prevConversations => 
        prevConversations.map(conv => {
          if (conv.clientId === selectedClient.id && conv.client) {
            return {...conv, client: updatedClient};
          }
          return conv;
        })
      );
      
      setSelectedClient(updatedClient);
      setCreditAmount(0);
    } catch (error) {
      console.error('Erro ao adicionar crédito:', error);
    }
  };
  
  const handleChangePlanType = async (planType: 'prepaid' | 'postpaid') => {
    if (!selectedClient) return;
    
    try {
      // Em um sistema real, isso enviaria os dados para a API
      // Aqui estamos apenas atualizando o estado local
      const updatedClient = {
        ...selectedClient,
        planType
      };
      
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === selectedClient.id ? updatedClient : c
        )
      );
      
      // Atualizar o cliente nas conversas também
      setConversations(prevConversations => 
        prevConversations.map(conv => {
          if (conv.clientId === selectedClient.id && conv.client) {
            return {...conv, client: updatedClient};
          }
          return conv;
        })
      );
      
      setSelectedClient(updatedClient);
    } catch (error) {
      console.error('Erro ao alterar tipo de plano:', error);
    }
  };
  
  // Renderiza o conteúdo com base na seção ativa
  const renderContent = () => {
    if (loading) {
      return <div className="loading-container">Carregando...</div>;
    }
    
    switch (activeSection) {
      case 'conversations':
        return (
          <div className="admin-conversations">
            <div className="section-header">
              <h2>Conversas</h2>
              <button className="refresh-button" onClick={fetchData} disabled={loading}>
                {loading ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
            
            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={() => setError(null)}>Fechar</button>
              </div>
            )}
            
            <div className="conversations-container">
              <div className="conversations-list">
                {conversations.length === 0 ? (
                  <p className="no-data">Nenhuma conversa encontrada.</p>
                ) : (
                  conversations.map(conversation => (
                    <div 
                      key={conversation.id}
                      className={`conversation-item ${selectedConversation?.id === conversation.id ? 'selected' : ''}`}
                      onClick={() => handleConversationSelect(conversation)}
                    >
                      <div className="conversation-title">{conversation.title}</div>
                      <div className="conversation-client">{conversation.client?.name || 'Cliente desconhecido'}</div>
                    </div>
                  ))
                )}
              </div>
              
              {selectedConversation && (
                <div className="conversation-details">
                  <h3>Detalhes da Conversa</h3>
                  <p><strong>Título:</strong> {selectedConversation.title}</p>
                  <p><strong>Cliente:</strong> {selectedConversation.client?.name || 'Desconhecido'}</p>
                  <p><strong>Documento:</strong> {selectedConversation.client?.documentType}: {selectedConversation.client?.documentId}</p>
                  
                  <button 
                    className="view-messages-btn"
                    onClick={() => handleViewConversation(selectedConversation.id)}
                  >
                    Ver Mensagens
                  </button>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'clients':
        return (
          <div className="admin-clients">
            <div className="section-header">
              <h2>Clientes</h2>
              <button className="refresh-button" onClick={fetchData} disabled={loading}>
                {loading ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
            
            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={() => setError(null)}>Fechar</button>
              </div>
            )}
            
            <div className="clients-container">
              <div className="clients-list">
                {clients.length === 0 ? (
                  <p className="no-data">Nenhum cliente encontrado.</p>
                ) : (
                  clients.map(client => (
                    <div 
                      key={client.id}
                      className={`client-item ${selectedClient?.id === client.id ? 'selected' : ''}`}
                      onClick={() => handleClientSelect(client)}
                    >
                      <div className="client-name">{client.name}</div>
                      <div className="client-document">{client.documentType}: {client.documentId}</div>
                    </div>
                  ))
                )}
              </div>
              
              {selectedClient && !editingClient && (
                <div className="client-details">
                  <h3>Detalhes do Cliente</h3>
                  <p><strong>Nome:</strong> {selectedClient.name}</p>
                  <p><strong>Documento:</strong> {selectedClient.documentType}: {selectedClient.documentId}</p>
                  <p><strong>Tipo de Plano:</strong> {selectedClient.planType === 'prepaid' ? 'Pré-pago' : 'Pós-pago'}</p>
                  {selectedClient.planType === 'prepaid' && (
                    <p><strong>Saldo:</strong> R$ {Number(selectedClient.balance).toFixed(2)}</p>
                  )}
                  
                  <div className="client-actions">
                    <button onClick={() => handleEditClient(selectedClient)}>Editar Cliente</button>
                    
                    <div className="plan-type-actions">
                      <h4>Alterar Tipo de Plano</h4>
                      <div className="plan-buttons">
                        <button 
                          className={selectedClient.planType === 'prepaid' ? 'active' : ''}
                          onClick={() => handleChangePlanType('prepaid')}
                        >
                          Pré-pago
                        </button>
                        <button 
                          className={selectedClient.planType === 'postpaid' ? 'active' : ''}
                          onClick={() => handleChangePlanType('postpaid')}
                        >
                          Pós-pago
                        </button>
                      </div>
                    </div>
                    
                    {selectedClient.planType === 'prepaid' && (
                      <div className="add-credit-section">
                        <h4>Adicionar Crédito</h4>
                        <div className="credit-input">
                          <input 
                            type="number" 
                            min="0" 
                            step="0.01"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(Number(e.target.value))}
                            placeholder="Valor em R$"
                          />
                          <button onClick={handleAddCredit}>Adicionar</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {editingClient && (
                <div className="client-edit-form">
                  <h3>Editar Cliente</h3>
                  <div className="form-group">
                    <label>Nome</label>
                    <input 
                      type="text" 
                      value={editingClient.name} 
                      onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Tipo de Plano</label>
                    <select 
                      value={editingClient.planType} 
                      onChange={(e) => setEditingClient({
                        ...editingClient, 
                        planType: e.target.value as 'prepaid' | 'postpaid'
                      })}
                    >
                      <option value="prepaid">Pré-pago</option>
                      <option value="postpaid">Pós-pago</option>
                    </select>
                  </div>
                  
                  {editingClient.planType === 'prepaid' && (
                    <div className="form-group">
                      <label>Saldo</label>
                      <input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        value={editingClient.balance} 
                        onChange={(e) => setEditingClient({
                          ...editingClient, 
                          balance: Number(e.target.value)
                        })}
                      />
                    </div>
                  )}
                  
                  <div className="form-actions">
                    <button className="save-btn" onClick={handleSaveClientChanges}>Salvar</button>
                    <button className="cancel-btn" onClick={() => setEditingClient(null)}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'settings':
        return (
          <div className="admin-settings">
            <h2>Configurações</h2>
            <div className="settings-section">
              <h3>Configurações do Sistema</h3>
              <p>Esta seção está em desenvolvimento.</p>
            </div>
          </div>
        );
        
      default:
        return <div>Selecione uma seção</div>;
    }
  };
  
  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <button className="menu-toggle" onClick={toggleMenu}>
            <span className="menu-icon"></span>
          </button>
          <Logo size="small" />
          <h1>Painel Administrativo</h1>
        </div>
        <div className="header-right">
          <button className="logout-button" onClick={handleLogout}>Sair</button>
        </div>
      </header>
      
      <div className="dashboard-container">
        <aside className={`dashboard-sidebar ${menuOpen ? 'open' : ''}`}>
          <nav className="dashboard-nav">
            <ul>
              <li 
                className={activeSection === 'conversations' ? 'active' : ''}
                onClick={() => navigateTo('conversations')}
              >
                <span className="nav-icon conversations-icon"></span>
                <span className="nav-text">Conversas</span>
              </li>
              <li 
                className={activeSection === 'clients' ? 'active' : ''}
                onClick={() => navigateTo('clients')}
              >
                <span className="nav-icon clients-icon"></span>
                <span className="nav-text">Clientes</span>
              </li>
              <li 
                className={activeSection === 'settings' ? 'active' : ''}
                onClick={() => navigateTo('settings')}
              >
                <span className="nav-icon settings-icon"></span>
                <span className="nav-text">Configurações</span>
              </li>
            </ul>
          </nav>
        </aside>
        
        <main className="dashboard-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
