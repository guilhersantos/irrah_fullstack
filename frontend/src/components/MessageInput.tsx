import { useState, useEffect } from 'react';
import { Conversation, MessagePriority, CreateMessageDto } from '../types/messages';
import { messageService } from '../services/messageService';
import { socketService } from '../services/socketService';
import { authService } from '../services/authService';
import '../styles/messages.css';

interface MessageInputProps {
  conversation: Conversation;
  onMessageSent: () => void;
}

const MessageInput = ({ conversation, onMessageSent }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<string>('normal');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const client = authService.getClientData();
  const admin = authService.getAdminData();
  const isPrepaid = client?.planType === 'prepaid';
  const messageCost = priority === 'urgent' ? 0.50 : 0.25; // Custo fixo baseado na prioridade
  
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
    
    // Verifica se o cliente tem saldo suficiente (apenas para pré-pago)
    // Apenas verificar saldo se for um cliente e não um administrador
    if (!admin && isPrepaid && client?.balance !== undefined && client.balance < messageCost) {
      setError('Saldo insuficiente para enviar esta mensagem. Por favor, adicione créditos.');
      return;
    }
    
    try {
      setSending(true);
      setError(null);
      
      // Convertendo a string priority para o tipo MessagePriority
      const messageData: CreateMessageDto = {
        conversationId: conversation.id,
        content: message,
        priority: priority as MessagePriority
      };
      
      console.log('Enviando mensagem como:', admin ? 'administrador' : 'cliente');
      
      // Enviar a mensagem via API REST para garantir que seja salva no banco de dados
      console.log('Enviando mensagem via API REST');
      const sentMessage = await messageService.sendMessage(messageData);
      console.log('Mensagem enviada com sucesso via API REST:', sentMessage);
      
      // Tentar enviar a mensagem via WebSocket para notificação em tempo real
      // Isso é apenas para notificar outros usuários em tempo real, a mensagem já foi salva
      try {
        // Definir um timeout para a operação WebSocket
        const socketPromise = socketService.sendMessage(
          conversation.id,
          message,
          priority
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
      
      // Atualiza o saldo do cliente após o envio da mensagem (para clientes pré-pagos)
      if (isPrepaid && client && client.balance !== undefined) {
        const newBalance = Number(client.balance) - messageCost;
        
        // Atualiza o saldo no localStorage
        authService.updateClientBalance(newBalance);
        
        // Atualiza o estado da interface para refletir o novo saldo
        document.querySelectorAll('.client-balance').forEach(el => {
          el.textContent = `R$ ${newBalance.toFixed(2)}`;
        });
      }
      
      setMessage('');
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
    <div className="message-input-container">
      {error && <div className="message-error">{error}</div>}
      
      <div className="message-cost-info">
        <span>Custo: R$ {messageCost.toFixed(2)}</span>
        {isPrepaid && client?.balance !== undefined && (
          <span>Saldo atual: R$ {Number(client.balance).toFixed(2)}</span>
        )}
      </div>
      
      <div className="message-priority-selector">
        <label>
          <input 
            type="radio" 
            name="priority" 
            value="normal" 
            checked={priority === 'normal'} 
            onChange={() => setPriority('normal')} 
          />
          Normal (R$ 0,25)
        </label>
        <label>
          <input 
            type="radio" 
            name="priority" 
            value="urgent" 
            checked={priority === 'urgent'} 
            onChange={() => setPriority('urgent')} 
          />
          Urgente (R$ 0,50)
        </label>
      </div>
      
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
          className="send-message-btn"
          onClick={handleSendMessage}
          disabled={sending || !message.trim()}
        >
          {sending ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
