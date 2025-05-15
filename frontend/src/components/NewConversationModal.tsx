import React, { useState, useEffect } from 'react';
import { MessagePriority, MESSAGE_PRIORITY } from '../types/messages';
import { conversationService } from '../services/conversationService';
import { messageService } from '../services/messageService';
import { authService } from '../services/authService';
import '../styles/newConversation.css';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: () => void;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  onConversationCreated
}) => {
  const [title, setTitle] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [priority, setPriority] = useState<MessagePriority>(MESSAGE_PRIORITY.NORMAL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Limpar os campos quando o modal for fechado
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setInitialMessage('');
      setPriority(MESSAGE_PRIORITY.NORMAL);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Por favor, informe um título para a conversa');
      return;
    }
    
    if (!initialMessage.trim()) {
      setError('Por favor, digite uma mensagem inicial');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Criar a conversa
      const conversation = await conversationService.createConversation({ title });
      
      // Enviar a mensagem inicial
      await messageService.sendMessage({
        conversationId: conversation.id,
        content: initialMessage,
        priority
      });
      
      // Atualizar o cliente no localStorage (para atualizar o saldo)
      const updatedClient = authService.getClientData();
      if (updatedClient) {
        // Atualizar o saldo do cliente após o envio da mensagem
        const messageCost = messageService.calculateMessageCost(priority);
        if (updatedClient.planType === 'prepaid' && updatedClient.balance !== undefined) {
          updatedClient.balance = Number(updatedClient.balance) - messageCost;
          authService.saveClientData(updatedClient);
        }
      }
      
      // Notificar que a conversa foi criada com sucesso e passar a conversa criada
      onConversationCreated();
      
      // Limpar o formulário e fechar o modal
      setTitle('');
      setInitialMessage('');
      setPriority(MESSAGE_PRIORITY.NORMAL);
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro ao criar conversa. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Nova Conversa</h2>
          <button className="close-button" onClick={onClose} disabled={isLoading}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="title">Título da Conversa</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Suporte ao Cliente"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="message">Mensagem Inicial</label>
            <textarea
              id="message"
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Digite sua mensagem inicial..."
              rows={4}
              disabled={isLoading}
            ></textarea>
          </div>
          
          <div className="form-group">
            <label>Prioridade da Mensagem</label>
            <div className="priority-options">
              <div 
                className={`priority-option ${priority === MESSAGE_PRIORITY.NORMAL ? 'selected' : ''}`}
                onClick={() => !isLoading && setPriority(MESSAGE_PRIORITY.NORMAL)}
              >
                <input
                  type="radio"
                  name="priority"
                  value={MESSAGE_PRIORITY.NORMAL}
                  checked={priority === MESSAGE_PRIORITY.NORMAL}
                  onChange={() => setPriority(MESSAGE_PRIORITY.NORMAL)}
                  disabled={isLoading}
                />
                <span className="priority-label normal">Normal</span>
                <span className="priority-description">Mensagem padrão (R$ 0,25)</span>
              </div>
              
              <div 
                className={`priority-option ${priority === MESSAGE_PRIORITY.URGENT ? 'selected' : ''}`}
                onClick={() => !isLoading && setPriority(MESSAGE_PRIORITY.URGENT)}
              >
                <input
                  type="radio"
                  name="priority"
                  value={MESSAGE_PRIORITY.URGENT}
                  checked={priority === MESSAGE_PRIORITY.URGENT}
                  onChange={() => setPriority(MESSAGE_PRIORITY.URGENT)}
                  disabled={isLoading}
                />
                <span className="priority-label urgent">Urgente</span>
                <span className="priority-description">Prioridade alta (R$ 0,50)</span>
              </div>
            </div>
          </div>
          
          
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose} disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Conversa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConversationModal;
