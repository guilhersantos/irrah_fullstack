import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { messageService } from '../services/messageService';
import { Conversation, Message, MessageStatus } from '../types/messages';
import MessageList from '../components/MessageList';
import AdminMessageInput from '../components/AdminMessageInput';
import '../styles/messages.css';
import '../styles/adminMessages.css';

const AdminMessages = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Verificar se o usuário está autenticado como administrador
    if (!authService.isAdminAuthenticated()) {
      // Se não estiver autenticado, redirecionar para a página de login
      console.log('Usuário não autenticado como administrador. Redirecionando para login...');
      navigate('/admin/login');
      return;
    }
    
    // Extrair o ID da conversa da URL
    const params = new URLSearchParams(location.search);
    const conversationId = params.get('conversation');
    
    if (!conversationId) {
      setError('ID da conversa não especificado');
      return;
    }
    
    // Carregar a conversa e as mensagens
    loadConversation(conversationId);
  }, [location.search, navigate]);
  
  const loadConversation = async (conversationId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Carregar todas as conversas para encontrar a conversa específica usando o endpoint de admin
      const conversationsData = await messageService.getConversations(1, 10, true);
      const selectedConversation = conversationsData.conversations.find(conv => conv.id === conversationId);
      
      if (!selectedConversation) {
        setError('Conversa não encontrada');
        setLoading(false);
        return;
      }
      
      setConversation(selectedConversation);
      
      // Carregar as mensagens da conversa
      await fetchMessages(selectedConversation);
      
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro ao carregar a conversa');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMessages = async (selectedConversation: Conversation) => {
    try {
      setLoadingMessages(true);
      const response = await messageService.getMessages(selectedConversation.id, 1, 50);
      
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
      
      // Marcar mensagens como visualizadas pelo administrador
      markMessagesAsRead(processedMessages);
      
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro ao carregar mensagens');
      }
    } finally {
      setLoadingMessages(false);
    }
  };
  
  const markMessagesAsRead = async (messages: Message[]) => {
    try {
      // Filtrar mensagens enviadas pelo cliente e que não foram lidas
      const unreadClientMessages = messages.filter(
        msg => msg.sentBy === 'client' && msg.status !== MessageStatus.READ
      );
      
      // Marcar cada mensagem como lida
      for (const message of unreadClientMessages) {
        await messageService.updateMessageStatus(message.id, MessageStatus.READ);
      }
      
      // Atualizar o estado local se houver mensagens atualizadas
      if (unreadClientMessages.length > 0) {
        setMessages(prevMessages => 
          prevMessages.map(msg => {
            if (unreadClientMessages.some(unreadMsg => unreadMsg.id === msg.id)) {
              return { ...msg, status: MessageStatus.READ };
            }
            return msg;
          })
        );
      }
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };
  
  // Função removida: handleSendMessage não é mais necessária
  // Agora estamos usando o evento onMessageSent do componente MessageInput
  // para recarregar as mensagens após o envio
  
  const handleBackToAdmin = () => {
    navigate('/');
  };
  
  if (loading) {
    return <div className="loading-container">Carregando...</div>;
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Erro</h2>
        <p>{error}</p>
        <button onClick={handleBackToAdmin}>Voltar para o Dashboard</button>
      </div>
    );
  }
  
  if (!conversation) {
    return (
      <div className="error-container">
        <h2>Conversa não encontrada</h2>
        <button onClick={handleBackToAdmin}>Voltar para o Dashboard</button>
      </div>
    );
  }
  
  return (
    <div className="messages-page admin-messages">
      <header className="messages-header">
        <button className="back-button" onClick={handleBackToAdmin}>
          &larr; Voltar para o Dashboard
        </button>
        <div className="conversation-info">
          <h2>{conversation.title}</h2>
          <p>
            Cliente: {conversation.client?.name || 'Desconhecido'} 
            ({conversation.client?.documentType || 'Doc'}: {conversation.client?.documentId || 'N/A'})
          </p>
        </div>
      </header>
      
      <div className="messages-container">
        {loadingMessages ? (
          <div className="loading-messages">Carregando mensagens...</div>
        ) : (
          <MessageList 
            messages={messages} 
            loading={false}
            hasMore={false}
            onLoadMore={() => {}} // Implementar paginação se necessário
            conversationId={conversation.id}
          />
        )}
      </div>
      
      <div className="message-input-container">
        <AdminMessageInput 
          conversation={conversation}
          onMessageSent={() => fetchMessages(conversation)}
        />
      </div>
    </div>
  );
};

export default AdminMessages;
