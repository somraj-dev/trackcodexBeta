import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { directMessageBus, DMEvent } from '../services/directMessageBus';

export interface Message {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
    status: 'sent' | 'delivered' | 'seen';
}

export interface Conversation {
    id: string;
    participants: { id: string; name: string; avatar: string }[];
    lastMessage?: string;
    lastTimestamp?: string;
    unreadCount: number;
    messages: Message[];
}

interface MessagingContextType {
    conversations: Conversation[];
    activeConvId: string | null;
    isPanelOpen: boolean;
    isTyping: boolean;
    totalUnreadCount: number;
    setIsPanelOpen: (open: boolean) => void;
    setActiveConvId: (id: string | null) => void;
    sendMessage: (text: string) => Promise<void>;
    refreshConversations: () => Promise<void>;
    checkConversation: (userId: string) => Promise<Conversation | undefined>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isTyping] = useState(false);

    const refreshConversations = useCallback(async () => {
        try {
            const data: any[] = await api.get('/messages/conversations') as any;
            // Map backend data to local structure
            const mapped = data.map((c: any) => ({
                id: c.id,
                participants: c.participants.map((p: any) => ({
                    id: p.user.id,
                    name: p.user.name || p.user.username,
                    avatar: p.user.avatar
                })),
                lastMessage: c.messages[0]?.content,
                lastTimestamp: c.messages[0]?.createdAt,
                unreadCount: 0, // Calculate or get from backend
                messages: [] // Fetch on demand or if already loaded
            }));
            setConversations(mapped);
        } catch (err) {
            console.error('Failed to fetch conversations', err);
        }
    }, []);

    const checkConversation = useCallback(async (userId: string) => {
        try {
            // First check local state
            const existing = conversations.find(c => c.participants.some(p => p.id === userId));
            if (existing) return existing;

            // Attempt to create or fetch on backend
            // For now, if no backend creation endpoint via standard REST, we just optimistically return a mock or call POST.
            const response = await api.post<any>('/messages/conversations', { targetUserId: userId });
            await refreshConversations();
            return { id: response.id } as Conversation;
        } catch (err) {
            console.error('Failed to check/create conversation', err);
            return undefined;
        }
    }, [conversations, refreshConversations]);

    const sendMessage = useCallback(async (text: string) => {
        if (!activeConvId || !text.trim()) return;

        try {
            const msg = await api.post(`/messages/conversations/${activeConvId}/messages`, { content: text });

            // Update local state optimistically or via refresh
            setConversations(prev => prev.map(c => {
                if (c.id === activeConvId) {
                    return {
                        ...c,
                        lastMessage: text,
                        lastTimestamp: 'Now',
                        messages: [...(c.messages || []), {
                            id: (msg as any).id,
                            senderId: 'current',
                            content: text,
                            timestamp: new Date().toLocaleTimeString(),
                            status: 'sent'
                        }]
                    };
                }
                return c;
            }));
        } catch (err) {
            console.error('Failed to send message', err);
        }
    }, [activeConvId]);

    const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

    useEffect(() => {
        const init = async () => {
            await refreshConversations();
        };
        init();

        const unsubscribe = directMessageBus.subscribe((event: DMEvent) => {
            if (event.type === 'DM_OPEN') {
                setIsPanelOpen(true);
                setConversations(prev => {
                    const existing = prev.find(c => c.participants.some(p => p.id === event.data.userId));
                    if (existing) {
                        setActiveConvId(existing.id);
                        return prev;
                    } else {
                        const newId = `conv-${Date.now()}`;
                        const newConv: Conversation = {
                            id: newId,
                            participants: [{ id: event.data.userId, name: event.data.name, avatar: event.data.avatar }],
                            unreadCount: 0,
                            messages: event.data.context ? [{ id: 'ctx', senderId: 'system', content: `Discussing: ${event.data.context}`, timestamp: 'Now', status: 'seen' }] : []
                        };
                        setActiveConvId(newId);
                        return [newConv, ...prev];
                    }
                });
            }
        });

        return unsubscribe;
    }, [refreshConversations]);

    return (
        <MessagingContext.Provider value={{
            conversations,
            activeConvId,
            isPanelOpen,
            isTyping,
            totalUnreadCount,
            setIsPanelOpen,
            setActiveConvId,
            sendMessage,
            refreshConversations,
            checkConversation
        }}>
            {children}
        </MessagingContext.Provider>
    );
};

export const useMessaging = () => {
    const context = useContext(MessagingContext);
    if (context === undefined) {
        throw new Error('useMessaging must be used within a MessagingProvider');
    }
    return context;
};
