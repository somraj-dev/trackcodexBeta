import { useMessaging, Conversation, Message } from '../context/MessagingContext';

export type { Conversation, Message };

export const useDirectMessages = () => {
  const {
    conversations,
    activeConvId,
    setActiveConvId,
    isPanelOpen,
    setIsPanelOpen,
    sendMessage,
    handleTyping,
    isTyping
  } = useMessaging();

  const activeConversation = conversations.find(c => c.id === activeConvId);

  return {
    conversations,
    activeConversation,
    isPanelOpen,
    setIsPanelOpen,
    setActiveConvId,
    sendMessage,
    handleTyping,
    isTyping
  };
};

