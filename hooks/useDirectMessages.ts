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
    isTyping
  } = useMessaging();

  return {
    conversations,
    activeConversation: conversations.find(c => c.id === activeConvId),
    isPanelOpen,
    setIsPanelOpen,
    setActiveConvId,
    sendMessage,
    isTyping
  };
};
