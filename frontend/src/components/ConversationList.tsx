import React, { useState } from 'react';
import { Conversation } from '../types/messages';
import NewConversationModal from './NewConversationModal';
import '../styles/conversations.css';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onRefreshConversations?: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ 
  conversations = [], 
  selectedConversationId, 
  onSelectConversation,
  onRefreshConversations
}) => {
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);

  // Formata a data da última mensagem
  const formatMessageTime = (timestamp?: Date) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // Se for hoje, mostra apenas a hora
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Se for esta semana, mostra o dia da semana
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Caso contrário, mostra a data completa
    return date.toLocaleDateString();
  };

  // Função para atualizar a lista de conversas após criar uma nova
  const handleConversationCreated = () => {
    // Chamar a função do componente pai para atualizar a lista de conversas
    if (onRefreshConversations) {
      onRefreshConversations();
    }
  };

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <h2>Conversas</h2>
        <button 
          className="new-conversation-button" 
          onClick={() => setIsNewConversationModalOpen(true)}
          title="Iniciar nova conversa"
        >
          <span>+</span>
        </button>
      </div>

      {!conversations || conversations.length === 0 ? (
        <div className="empty-list">
          <p>Nenhuma conversa encontrada</p>
          <p>Inicie uma nova conversa para começar</p>
          <button 
            className="start-conversation-button"
            onClick={() => setIsNewConversationModalOpen(true)}
          >
            Nova Conversa
          </button>
        </div>
      ) : (
        <ul>
          {conversations.map(conversation => (
            <li 
              key={conversation.id || `conv-${Math.random()}`} 
              className={`conversation-item ${selectedConversationId === conversation.id ? 'selected' : ''}`}
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="conversation-avatar">
                {conversation.title && conversation.title.charAt(0).toUpperCase() || '?'}
              </div>
              
              <div className="conversation-info">
                <div className="conversation-header">
                  <h3 className="conversation-title">{conversation.title || 'Sem título'}</h3>
                  <span className="conversation-time">
                    {conversation.lastMessage && conversation.lastMessage.timestamp ? 
                      formatMessageTime(conversation.lastMessage.timestamp) : ''}
                  </span>
                </div>
                <p className="conversation-preview">
                  {conversation.lastMessage && conversation.lastMessage.content ? 
                    conversation.lastMessage.content : 'Nova conversa'}
                </p>
                {conversation.unreadCount && conversation.unreadCount.client > 0 && (
                  <span className="unread-badge">{conversation.unreadCount.client}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal para criar nova conversa */}
      <NewConversationModal 
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
};

export default ConversationList;
