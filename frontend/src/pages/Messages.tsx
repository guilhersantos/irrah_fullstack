import { useState, useEffect } from 'react';
import { Conversation, Message, MessageStatus } from '../types/messages';
import { conversationService } from '../services/conversationService';
import { messageService } from '../services/messageService';
import { authService } from '../services/authService';
import ConversationList from '../components/ConversationList';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import '../styles/messages.css';
// import { useNavigate } from 'react-router-dom';

const Messages = () => {
  // const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientBalance, setClientBalance] = useState<number | null>(null);
  const [mobileConversationsVisible, setMobileConversationsVisible] = useState(false);
  
  // Estado para as mensagens
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [messagePage, setMessagePage] = useState(1);

  // Carregar o saldo do cliente ao montar o componente
  useEffect(() => {
    const client = authService.getClientData();
    if (client && client.balance !== undefined) {
      setClientBalance(Number(client.balance));
    }
  }, []);

  // Função para atualizar o saldo do cliente
  const updateClientBalance = () => {
    const client = authService.getClientData();
    if (client && client.balance !== undefined) {
      setClientBalance(Number(client.balance));
    }
  };
  
  // Função para marcar mensagens como visualizadas
  const markMessagesAsRead = async (messages: Message[]) => {
    try {
      // Filtrar apenas mensagens enviadas pelo cliente e que não foram lidas
      const unreadClientMessages = messages.filter(message => {
        // Verificar se a mensagem foi enviada pelo cliente
        if (message.sentBy !== 'client') return false;
        
        // Verificar se o status não é 'read'
        // Convertemos para string para garantir a compatibilidade
        const status = String(message.status).toLowerCase();
        return status !== 'read';
      });
      
      console.log('Mensagens não lidas:', unreadClientMessages.length);
      
      // Se não houver mensagens não lidas, não faz nada
      if (unreadClientMessages.length === 0) return;
      
      // Atualizar o status de cada mensagem não lida
      for (const message of unreadClientMessages) {
        console.log('Marcando mensagem como lida:', message.id);
        try {
          // Atualizar o status no backend
          await messageService.updateMessageStatus(message.id, MessageStatus.READ);
        } catch (err) {
          console.error('Erro ao atualizar status da mensagem:', message.id, err);
        }
      }
      
      // Atualizar as mensagens localmente
      setMessages(prevMessages => {
        const updatedMessages = prevMessages.map(msg => {
          if (unreadClientMessages.some(unreadMsg => unreadMsg.id === msg.id)) {
            console.log('Atualizando status localmente:', msg.id);
            return { ...msg, status: MessageStatus.READ };
          }
          return msg;
        });
        
        console.log('Mensagens atualizadas:', updatedMessages.length);
        return updatedMessages;
      });
      
      // Atualizar a conversa selecionada para refletir as mensagens lidas
      if (selectedConversation) {
        setSelectedConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            unreadCount: {
              ...prev.unreadCount,
              admin: 0 // Zerar o contador de mensagens não lidas pelo admin
            }
          };
        });
      }
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  // Carregar as conversas ao montar o componente e quando o refreshTrigger mudar
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedConversations = await conversationService.getConversations();
        setConversations(fetchedConversations);
        
        // Se uma conversa estava selecionada, atualize-a com os novos dados
        if (selectedConversation) {
          const updatedConversation = fetchedConversations.find(
            conv => conv.id === selectedConversation.id
          );
          if (updatedConversation) {
            setSelectedConversation(updatedConversation);
          }
        }
        
        // Atualizar o saldo do cliente
        updateClientBalance();
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Erro ao carregar conversas');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [refreshTrigger]);

  // Efeito para carregar mensagens quando uma conversa é selecionada ou o refreshTrigger muda
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    
    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const response = await messageService.getMessages(selectedConversation.id, 1, 20);
        
        // Processar as mensagens recebidas
        const messagesData = response.messages || [];
        
        // Garantir que todas as mensagens tenham um status definido e normalizar o campo sentBy
        const processedMessages = messagesData.map(msg => {
          let processedMsg = { ...msg };
          
          // Se o status não estiver definido, definir como 'sent' por padrão
          if (!processedMsg.status) {
            processedMsg.status = MessageStatus.SENT;
          }
          
          // Normalizar o campo sentBy para garantir compatibilidade
          if (processedMsg.sentBy && typeof processedMsg.sentBy === 'object') {
            // Se for um objeto, extrair o tipo
            const sentByObj = processedMsg.sentBy as Record<string, any>;
            console.log('sentBy como objeto:', sentByObj);
            
            // Registrar o objeto original no console para depuração
            console.log('Objeto original sentBy:', sentByObj);
            
            // Substituir sentBy pelo tipo (string)
            processedMsg.sentBy = sentByObj.type || 'unknown';
          }
          
          return processedMsg;
        });
        
        console.log('Mensagens processadas:', processedMessages);
        
        setMessages(processedMessages);
        setHasMoreMessages(response.total > (response.page * response.limit));
        setMessagePage(1);
        
        // Marcar mensagens do cliente como visualizadas
        // Verificamos se o usuário atual é um administrador
        const userType = authService.getUserType();
        if (userType === 'admin') {
          // Se for admin, marcar mensagens do cliente como lidas
          markMessagesAsRead(processedMessages);
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error('Erro ao carregar mensagens:', err.message);
        } else {
          console.error('Erro ao carregar mensagens');
        }
      } finally {
        setLoadingMessages(false);
      }
    };
    
    fetchMessages();
  }, [selectedConversation, refreshTrigger]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };
  
  const handleLoadMoreMessages = async () => {
    if (!selectedConversation || loadingMessages) return;
    
    try {
      setLoadingMessages(true);
      const nextPage = messagePage + 1;
      const response = await messageService.getMessages(selectedConversation.id, nextPage, 20);
      
      setMessages(prev => [...prev, ...(response.messages || [])]);
      setHasMoreMessages(response.total > (response.page * response.limit));
      setMessagePage(nextPage);
    } catch (err) {
      if (err instanceof Error) {
        console.error('Erro ao carregar mais mensagens:', err.message);
      } else {
        console.error('Erro ao carregar mais mensagens');
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleMessageSent = () => {
    // Atualizar o saldo do cliente
    updateClientBalance();
    
    // Atualizar a lista de conversas e mensagens
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleRefreshConversations = () => {
    // Incrementa o refreshTrigger para forçar a busca de novas conversas
    setRefreshTrigger(prev => prev + 1);
  };

  // Verificar se o cliente é pré-pago para exibir o saldo
  const client = authService.getClientData();
  const isPrepaid = client?.planType === 'prepaid';

  return (
    <div className="messages-page">
      {error && <div className="error-message">{error}</div>}
      
      {/* Exibir o saldo do cliente se for pré-pago */}
      {isPrepaid && clientBalance !== null && (
        <div className="client-balance-container">
          <span className="balance-label">Saldo atual:</span>
          <span className="client-balance">R$ {clientBalance.toFixed(2)}</span>
        </div>
      )}
      
      <div className="messages-layout">
        <div className={`conversations-panel ${mobileConversationsVisible ? 'mobile-visible' : ''}`}>
          {loading && <div className="loading-indicator">Carregando conversas...</div>}
          
          <ConversationList 
            conversations={conversations}
            onSelectConversation={(conversation) => {
              handleSelectConversation(conversation);
              setMobileConversationsVisible(false); // Esconder o painel após selecionar uma conversa em dispositivos móveis
            }}
            selectedConversationId={selectedConversation?.id}
            onRefreshConversations={handleRefreshConversations}
          />
        </div>
        
        {/* Botão flutuante para mostrar/esconder conversas em dispositivos móveis */}
        <button 
          className="mobile-toggle-conversations"
          onClick={() => setMobileConversationsVisible(!mobileConversationsVisible)}
          aria-label="Mostrar/esconder conversas"
        >
          {mobileConversationsVisible ? 'X' : '+'}
        </button>
        
        <div className="messages-panel">
          {selectedConversation ? (
            <>
              <div className="messages-header">
                <div className="conversation-avatar large">
                  {selectedConversation.title.charAt(0)}
                </div>
                <h2>{selectedConversation.title}</h2>
              </div>
              
              <div className="messages-content">
                <MessageList 
                  key={`${selectedConversation.id}-${refreshTrigger}`}
                  conversationId={selectedConversation.id}
                  messages={messages}
                  loading={loadingMessages}
                  hasMore={hasMoreMessages}
                  onLoadMore={handleLoadMoreMessages}
                />
              </div>
              
              <div className="messages-input">
                <MessageInput 
                  conversation={selectedConversation}
                  onMessageSent={handleMessageSent}
                />
              </div>
            </>
          ) : (
            <div className="no-conversation-selected">
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h3>Selecione uma conversa</h3>
                <p>Escolha uma conversa existente ou inicie uma nova para começar a enviar mensagens.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
