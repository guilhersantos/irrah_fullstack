import { useState, useEffect } from 'react';
import { Conversation, MessagePriority, CreateMessageDto } from '../types/messages';
import { messageService } from '../services/messageService';
import { socketService } from '../services/socketService';
import '../styles/messages.css';

interface MessageInputProps {
  conversation: Conversation;
  onMessageSent: () => void;
}

const AdminMessageInput = ({ conversation, onMessageSent }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Definindo prioridade como normal por padrão, sem opção de alteração para o admin
  
  // Conectar ao WebSocket quando o componente for montado
  useEffect(() => {
    // Inicializar a conexão WebSocket
    try {
      socketService.connect();
      
      // Entrar na sala da conversa
      if (conversation.id) {
        socketService.joinConversation(conversation.id);
      }
    } catch (error) {
      console.error('Erro ao conectar ao WebSocket:', error);
      // Não fazer nada, pois usaremos a API REST como fallback
    }
    
    // Cleanup: sair da sala quando o componente for desmontado
    return () => {
      try {
        if (conversation.id) {
          socketService.leaveConversation(conversation.id);
        }
      } catch (error) {
        console.error('Erro ao sair da sala de conversa:', error);
      }
    };
  }, [conversation.id]);
  
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      setSending(true);
      setError(null);
      
      // Usando prioridade normal por padrão para mensagens de admin
      const messageData: CreateMessageDto = {
        conversationId: conversation.id,
        content: message,
        priority: 'normal' as MessagePriority
      };
      
      console.log('Enviando mensagem como administrador');
      
      // Enviar a mensagem via API REST para garantir que seja salva no banco de dados
      console.log('Enviando mensagem via API REST');
      const sentMessage = await messageService.sendMessage(messageData);
      console.log('Mensagem enviada com sucesso via API REST:', sentMessage);
      
      // Tentar enviar a mensagem via WebSocket para notificação em tempo real
      try {
        // Definir um timeout para a operação WebSocket
        const socketPromise = socketService.sendMessage(
          conversation.id,
          message,
          'normal'
        );
        
        // Usar Promise.race para limitar o tempo de espera
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(false), 1000); // 1 segundo de timeout
        });
        
        const socketSent = await Promise.race([socketPromise, timeoutPromise]);
        
        if (socketSent) {
          console.log('Notificação em tempo real enviada com sucesso via WebSocket');
        } else {
          console.log('Não foi possível enviar notificação em tempo real, mas a mensagem foi salva');
        }
      } catch (error) {
        console.error('Erro ao enviar notificação em tempo real:', error);
        // Não fazer nada, pois a mensagem já foi salva via API REST
      }
      
      // Limpar o campo de mensagem após o envio bem-sucedido
      setMessage('');
      
      // Chamar a função de callback para atualizar a lista de mensagens
      onMessageSent();
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro ao enviar mensagem');
      }
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div className="message-input-container admin-message-input">
      {error && <div className="message-error">{error}</div>}
      
      <div className="message-input-wrapper">
        <textarea
          className="message-input"
          placeholder="Digite sua mensagem..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={sending}
        />
        <button 
          className="send-button"
          onClick={handleSendMessage}
          disabled={sending || !message.trim()}
          aria-label="Enviar mensagem"
        >
          {sending ? 'Enviando...' : <span className="send-text">Enviar</span>}
        </button>
      </div>
    </div>
  );
};

export default AdminMessageInput;
