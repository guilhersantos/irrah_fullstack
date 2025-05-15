import { useEffect, useRef, useState } from 'react';
import { Message } from '../types/messages';
import { socketService } from '../services/socketService';
import { messageService } from '../services/messageService';
import { authService } from '../services/authService';
import '../styles/messages.css';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  conversationId: string;
}

const MessageList = ({ messages: initialMessages = [], loading: initialLoading, hasMore: initialHasMore, conversationId }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(initialLoading);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20; // Número de mensagens por página
  const isAdmin = authService.isAdmin();

  // Atualizar as mensagens locais quando as mensagens iniciais mudarem
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Carregar mensagens do servidor
  const fetchMessages = async () => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      const response = await messageService.getMessages(conversationId, page, limit);
      
      if (response && response.messages) {
        // Mesclar as mensagens existentes com as novas, removendo duplicatas
        setMessages(prevMessages => {
          // Criar um mapa de IDs de mensagens existentes
          const existingIds = new Set(prevMessages.map(msg => msg.id));
          
          // Filtrar as novas mensagens que não existem no estado atual
          const newMessages = response.messages.filter(msg => !existingIds.has(msg.id));
          
          // Mesclar e ordenar por timestamp
          const mergedMessages = [...prevMessages, ...newMessages].sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeA - timeB;
          });
          
          return mergedMessages;
        });
        
        setHasMore(response.messages.length === limit);
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError('Erro ao carregar mensagens. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Carregar mais mensagens (página anterior)
  const handleLoadMore = async () => {
    if (loading || !hasMore) return;
    
    try {
      setLoading(true);
      const nextPage = page + 1;
      const response = await messageService.getMessages(conversationId, nextPage, limit);
      
      if (response && response.messages) {
        // Adicionar as mensagens mais antigas no início da lista
        setMessages(prevMessages => {
          // Criar um mapa de IDs de mensagens existentes
          const existingIds = new Set(prevMessages.map(msg => msg.id));
          
          // Filtrar as novas mensagens que não existem no estado atual
          const newMessages = response.messages.filter(msg => !existingIds.has(msg.id));
          
          // Mesclar e ordenar por timestamp
          const mergedMessages = [...prevMessages, ...newMessages].sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeA - timeB;
          });
          
          return mergedMessages;
        });
        
        setHasMore(response.messages.length === limit);
        setPage(nextPage); // Atualizar a página atual
      }
    } catch (err) {
      console.error('Erro ao carregar mais mensagens:', err);
      setError('Erro ao carregar mais mensagens. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Conectar ao WebSocket e configurar os listeners
  useEffect(() => {
    // Carregar mensagens iniciais
    fetchMessages();
    
    // Conectar ao WebSocket com tratamento de erro
    try {
      socketService.connect();
      
      // Entrar na sala da conversa
      if (conversationId) {
        socketService.joinConversation(conversationId);
      }
    } catch (error) {
      console.error('Erro ao conectar ao WebSocket:', error);
      setConnected(false);
    }
    
    // Adicionar listener de status de conexão
    const handleConnectionStatus = (isConnected: boolean) => {
      console.log('Status da conexão WebSocket:', isConnected ? 'conectado' : 'desconectado');
      setConnected(isConnected);
      
      // Se reconectou, recarregar mensagens para garantir que estão atualizadas
      if (isConnected) {
        fetchMessages();
      }
    };
    
    // Adicionar listeners para diferentes tipos de eventos de mensagens
    const handleNewMessage = (newMessage: any) => {
      console.log('Nova mensagem recebida:', newMessage);
      processNewMessage(newMessage);
    };
    
    const handleMessageSent = (message: any) => {
      console.log('Mensagem enviada confirmada:', message);
      processNewMessage(message);
    };
    
    const handleMessageReceived = (data: any) => {
      console.log('Confirmação de recebimento:', data);
      // Atualizar o status da mensagem para 'delivered'
      if (data.messageId) {
        setMessages(prevMessages => {
          return prevMessages.map(msg => {
            if (msg.id === data.messageId) {
              return { ...msg, status: data.status || 'delivered' };
            }
            return msg;
          });
        });
      }
    };
    
    // Função para processar novas mensagens (tanto recebidas quanto enviadas)
    const processNewMessage = (newMessage: any) => {
      // Verificar se a mensagem pertence a esta conversa
      if (newMessage.conversationId === conversationId) {
        setMessages(prevMessages => {
          // Verificar se a mensagem já existe na lista
          const messageExists = prevMessages.some(msg => {
            // Verificar pelo ID (forma mais confiável)
            if (msg.id && newMessage.id && msg.id === newMessage.id) {
              return true;
            }
            
            // Verificar pelo conteúdo e outros atributos
            if (msg.content === newMessage.content && 
                (msg.timestamp === newMessage.timestamp || 
                 new Date(msg.timestamp).getTime() === new Date(newMessage.timestamp).getTime())) {
              // Verificar sentBy que pode ser string ou objeto
              const msgSenderId = typeof msg.sentBy === 'string' ? msg.sentBy : (msg.sentBy?.id || '');
              const newMsgSenderId = typeof newMessage.sentBy === 'string' ? newMessage.sentBy : (newMessage.sentBy?.id || '');
              
              return msgSenderId === newMsgSenderId;
            }
            
            return false;
          });
          
          if (!messageExists) {
            console.log('Adicionando nova mensagem à lista:', newMessage);
            // Adicionar a nova mensagem e ordenar por timestamp
            const updatedMessages = [...prevMessages, newMessage].sort((a, b) => {
              const timeA = new Date(a.timestamp).getTime();
              const timeB = new Date(b.timestamp).getTime();
              return timeA - timeB;
            });
            return updatedMessages;
          }
          return prevMessages;
        });
      }
    };
    
    // Não precisamos mais do intervalo de atualização manual, pois o polling já faz isso
    // O polling é mais eficiente pois busca apenas mensagens novas desde o último timestamp
    
    // Registrar listeners
    socketService.addConnectionListener(handleConnectionStatus);
    socketService.addMessageListener('message', handleNewMessage);
    socketService.addMessageListener('new_message', handleNewMessage);
    socketService.addMessageListener('message_sent', handleMessageSent);
    socketService.addMessageListener('message_received', handleMessageReceived);
    
    // Registrar listeners para mensagens de cliente e admin
    socketService.addMessageListener('client_message', handleNewMessage);
    socketService.addMessageListener('admin_message', handleNewMessage);
    
    // Verificar status inicial
    setConnected(socketService.isConnected());
    
    // Implementar polling interno como fallback para o WebSocket
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    let isPolling = false; // Flag para evitar múltiplas chamadas simultâneas
    let enhancedConnectionHandler: ((isConnected: boolean) => void) | null = null;
    
    if (conversationId) {
      console.log('Iniciando polling interno para conversa:', conversationId);
      
      // Função para buscar novas mensagens via polling
      const pollForNewMessages = async () => {
        // Evitar múltiplas chamadas simultâneas
        if (isPolling) return;
        
        isPolling = true;
        try {
          // Verificar se o WebSocket está desconectado ou se estamos em modo de backup
          if (!connected || messages.length === 0) {
            console.log('Polling: buscando novas mensagens...');
            
            // Usar a última mensagem como referência para buscar apenas mensagens mais recentes
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            
            // Buscar apenas as mensagens mais recentes (última página)
            const response = await messageService.getMessages(conversationId, 1, 20);
            
            if (response && response.messages) {
              // Filtrar para obter apenas mensagens mais recentes que a última mensagem
              const newMessages = lastMessage 
                ? response.messages.filter(msg => {
                    const msgTime = new Date(msg.timestamp).getTime();
                    const lastTime = new Date(lastMessage.timestamp).getTime();
                    return msgTime > lastTime;
                  })
                : response.messages;
              
              if (newMessages.length > 0) {
                console.log(`Polling: ${newMessages.length} novas mensagens encontradas`);
                // Processar apenas mensagens que não existem na lista atual
                newMessages.forEach((message: Message) => processNewMessage(message));
              }
            }
          }
        } catch (error) {
          console.error('Erro no polling de mensagens:', error);
        } finally {
          isPolling = false;
        }
      };
      
      // Definir intervalos de polling diferentes com base no estado da conexão
      const startPolling = () => {
        // Limpar qualquer intervalo existente
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        
        // Definir intervalo com base no estado da conexão
        const interval = connected ? 10000 : 3000; // 10s se conectado, 3s se desconectado
        pollingInterval = setInterval(pollForNewMessages, interval);
        console.log(`Polling configurado para ${interval}ms`);
      };
      
      // Iniciar o polling
      startPolling();
      
      // Modificar o listener de conexão para também atualizar o polling
      socketService.removeConnectionListener(handleConnectionStatus);
      
      // Criar um novo handler que combina a funcionalidade original com o polling
      enhancedConnectionHandler = (isConnected: boolean) => {
        console.log('Status da conexão WebSocket:', isConnected ? 'conectado' : 'desconectado');
        setConnected(isConnected);
        
        // Se reconectou, recarregar mensagens para garantir que estão atualizadas
        if (isConnected) {
          fetchMessages();
        }
        
        // Reconfigurar o intervalo de polling com base no status da conexão
        startPolling();
      };
      
      // Registrar o novo handler
      socketService.addConnectionListener(enhancedConnectionHandler);
      
      // Executar uma vez imediatamente
      pollForNewMessages();
    }
    
    // Limpar listeners e intervalos ao desmontar
    return () => {
      try {
        // Parar o polling interno
        if (pollingInterval) {
          console.log('Parando polling interno para conversa:', conversationId);
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
        
        // Remover o handler aprimorado
        if (enhancedConnectionHandler) {
          socketService.removeConnectionListener(enhancedConnectionHandler);
        }
        
        if (conversationId) {
          socketService.leaveConversation(conversationId);
        }
        
        // Remover listeners do WebSocket
        socketService.removeConnectionListener(handleConnectionStatus);
        socketService.removeMessageListener('message', handleNewMessage);
        socketService.removeMessageListener('new_message', handleNewMessage);
        socketService.removeMessageListener('message_sent', handleMessageSent);
        socketService.removeMessageListener('message_received', handleMessageReceived);
        socketService.removeMessageListener('client_message', handleNewMessage);
        socketService.removeMessageListener('admin_message', handleNewMessage);
      } catch (error) {
        console.error('Erro ao limpar listeners:', error);
      }
    };
  }, [conversationId]);
  
  // Rolar para o final da lista quando novas mensagens são carregadas
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 100);
      }
    }
  }, [messages]);

  // Formata a hora da mensagem
  const formatMessageTime = (timestamp: Date | string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Verifica se a mensagem foi enviada pelo cliente
  const isSentByClient = (message: Message): boolean => {
    return typeof message.sentBy === 'string'
      ? message.sentBy === 'client'
      : message.sentBy?.type === 'client';
  };

  // Função separada para renderizar o status da mensagem
  const renderMessageStatus = (message: Message) => {
    // Garante que o status seja tratado como string
    const status = String(message.status || 'sent').toLowerCase();
    
    // Verifica se a mensagem foi enviada pelo cliente
    if (!isSentByClient(message)) {
      console.log('Não renderizando status: mensagem não enviada pelo cliente', message.sentBy);
      return null;
    }

    // Determina qual ícone mostrar baseado no status
    let statusIcon = null;
    switch (status) {
      case 'read':
        statusIcon = <span title="Visualizada">✓✓</span>;
        break;
      case 'delivered':
        statusIcon = <span title="Entregue">✓</span>;
        break;
      case 'sent':
      case 'queued':
      case 'processing':
      default:
        statusIcon = <span title="Enviada">⏱</span>;
        break;
    }

    return (
      <span className={`message-status ${status}`} data-status={status}>
        {statusIcon}
      </span>
    );
  };

  // Formata a data para o cabeçalho de grupo de mensagens
  const formatMessageDate = (dateStr: string) => {
    try {
      // Verifica se a string de data está vazia ou é inválida
      if (!dateStr || dateStr === 'Invalid Date') {
        return 'Data desconhecida';
      }
      
      // Tenta converter a string para uma data
      let date: Date;
      
      // Se a string já estiver no formato dd/mm/yyyy (pt-BR)
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        date = new Date(Number(year), Number(month) - 1, Number(day));
      } else {
        // Tenta converter diretamente
        date = new Date(dateStr);
      }
      
      const now = new Date();
      
      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        console.error('Data inválida:', dateStr);
        return 'Data desconhecida';
      }

      // Se for hoje
      if (date.toDateString() === now.toDateString()) {
        return 'Hoje';
      }
      
      // Se for ontem
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem';
      }
      
      // Caso contrário, mostra a data completa
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data desconhecida';
    }
  };

  // Agrupa mensagens por data (mais antigas primeiro)
  const groupMessagesByDate = () => {
    if (!messages || messages.length === 0) return [];
    
    // Função auxiliar para obter a data sem o horário
    const getDateString = (timestamp: Date | string): string => {
      try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          console.error('Timestamp inválido:', timestamp);
          return 'Data desconhecida';
        }
        return date.toLocaleDateString('pt-BR'); // Formato dd/mm/yyyy
      } catch (error) {
        console.error('Erro ao processar timestamp:', error);
        return 'Data desconhecida';
      }
    };
    
    // Primeiro, ordenamos as mensagens por timestamp (mais antigas primeiro)
    const sortedMessages = [...messages].sort((a, b) => {
      try {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        
        // Se alguma das datas for inválida, coloca no final
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        
        return dateA - dateB; // Ordem crescente (mais antigas primeiro)
      } catch (error) {
        console.error('Erro ao ordenar mensagens:', error);
        return 0;
      }
    });
    
    const groups: Record<string, Message[]> = {};
    
    // Agrupa as mensagens por data
    sortedMessages.forEach(message => {
      // Obter a data como string no formato dd/mm/yyyy
      const dateStr = getDateString(message.timestamp);
      
      // Inicializar o grupo se não existir
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      
      // Adicionar a mensagem ao grupo
      groups[dateStr].push(message);
    });
    
    // Retorna os grupos em ordem de data crescente (datas mais antigas primeiro)
    return Object.entries(groups)
      .sort((a, b) => {
        // Se alguma das chaves for 'Data desconhecida', coloca no final
        if (a[0] === 'Data desconhecida') return 1;
        if (b[0] === 'Data desconhecida') return -1;
        
        // Converte as datas para objetos Date para comparação
        try {
          // Formato dd/mm/yyyy para yyyy-mm-dd
          const [dayA, monthA, yearA] = a[0].split('/');
          const [dayB, monthB, yearB] = b[0].split('/');
          
          const dateA = new Date(Number(yearA), Number(monthA) - 1, Number(dayA));
          const dateB = new Date(Number(yearB), Number(monthB) - 1, Number(dayB));
          
          return dateA.getTime() - dateB.getTime(); // Ordem crescente
        } catch (error) {
          console.error('Erro ao ordenar grupos de data:', error);
          return 0;
        }
      })
      .map(([date, messages]) => ({
        date,
        messages
      }));
  };

  return (
    <div className="message-list-container">
      {/* Indicador de status de conexão */}
      <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        <span className="status-text">
          {connected ? 'Conectado' : 'Desconectado'}
          {connected && isAdmin && ' (Admin)'}
        </span>
      </div>
      
      {loading && <div className="loading-messages">Carregando mensagens...</div>}
      
      {!loading && messages.length === 0 && (
        <div className="empty-messages">
          <p>Nenhuma mensagem encontrada.</p>
          <p>Envie uma mensagem para iniciar a conversa.</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="dismiss-error-btn">
            Fechar
          </button>
        </div>
      )}
      
      {hasMore && (
        <div className="load-more">
          <button 
            onClick={handleLoadMore} 
            disabled={loading}
            className="load-more-btn"
          >
            {loading ? 'Carregando...' : 'Carregar mais mensagens'}
          </button>
        </div>
      )}
      
      <div className="messages-wrapper">
        {groupMessagesByDate().map(group => (
          <div key={group.date} className="message-group">
            <div className="message-date-header">
              <span>{formatMessageDate(group.date)}</span>
            </div>
            
            {group.messages.map(message => (
              <div 
                key={message.id || `msg-${Math.random()}`} 
                className={`message ${isSentByClient(message) ? 'sent' : 'received'}`}
              >
                <div 
                  className={`message-bubble ${message.priority === 'urgent' ? 'urgent' : ''}`}
                >
                  <div className="message-content">
                    <p>{message.content || ''}</p>
                  </div>
                  <div className="message-meta">
                    <span className="message-time">
                      {message.timestamp ? formatMessageTime(message.timestamp) : ''}
                    </span>
                    <div className="message-status-container" data-message-id={message.id}>
                      {/* Mostrar indicador de prioridade */}
                      {message.priority === 'urgent' && (
                        <span className="message-priority">Urgente</span>
                      )}
                      
                      {/* Renderizar o status da mensagem usando a função dedicada */}
                      {renderMessageStatus(message)}
                      
                      {/* DEBUG: Adicionar um indicador visual para depuração */}
                      {/* <span className="debug-status" style={{ fontSize: '10px', color: '#999', marginLeft: '5px' }}>
                        {message.sentBy === 'client' ? `[Status: ${String(message.status || 'sent')}]` : ''}
                      </span> */}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
