import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../services/infra/api';
import { useAuth } from './AuthContext';
import { directMessageBus, DMEvent } from '../services/social/directMessageBus';
import { useRealtime } from '../contexts/RealtimeContext';

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
    handleTyping: () => void;
    refreshConversations: () => Promise<void>;
    checkConversation: (userId: string) => Promise<Conversation | undefined>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { user } = useAuth();
    const { subscribe, send } = useRealtime();

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
                lastTimestamp: new Date(c.messages[0]?.createdAt).toLocaleTimeString(),
                unreadCount: c.participants.find((p: any) => p.userId === user?.id)?.unreadCount || 0,
                messages: [] // Fetch on demand
            }));
            setConversations(mapped);
        } catch (err) {
            console.error('Failed to fetch conversations', err);
        }
    }, [api, user?.id]);

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
        if (!activeConvId || !text.trim() || !user?.id) return;

        // Stop typing indicator on send
        send({ type: 'TYPING_STOP', conversationId: activeConvId });

        const tempId = `temp-${Date.now()}`;

        // 1. Instantly show the message in the UI (optimistic)
        setConversations(prev => prev.map(c => {
            if (c.id === activeConvId) {
                return {
                    ...c,
                    lastMessage: text,
                    lastTimestamp: 'Now',
                    messages: [...(c.messages || []), {
                        id: tempId,
                        senderId: user.id,
                        content: text,
                        timestamp: new Date().toLocaleTimeString(),
                        status: 'sent' as const
                    }]
                };
            }
            return c;
        }));

        // 2. Send to backend
        try {
            const msg: any = await api.post(`/messages/conversations/${activeConvId}/messages`, { content: text });

            // 3. Swap temp ID with real ID from server
            setConversations(prev => prev.map(c => {
                if (c.id === activeConvId) {
                    return {
                        ...c,
                        messages: c.messages.map(m =>
                            m.id === tempId ? { ...m, id: msg.id } : m
                        )
                    };
                }
                return c;
            }));
        } catch (err) {
            console.error('Failed to send message', err);
            // Remove the optimistic message on failure
            setConversations(prev => prev.map(c => {
                if (c.id === activeConvId) {
                    return {
                        ...c,
                        messages: c.messages.filter(m => m.id !== tempId)
                    };
                }
                return c;
            }));
        }
    }, [activeConvId, send, user?.id]);

    const handleTyping = useCallback(() => {
        if (!activeConvId) return;
        send({ type: 'TYPING_START', conversationId: activeConvId });
    }, [activeConvId, send]);

    const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

    useEffect(() => {
        const init = async () => {
            await refreshConversations();
        };
        init();

        const unsubscribe = directMessageBus.subscribe(async (event: DMEvent) => {
            if (event.type === 'DM_OPEN') {
                setIsPanelOpen(true);

                // Check if we already have a conversation with this user loaded
                const existingLocal = conversations.find(c => c.participants.some(p => p.id === event.data.userId));
                if (existingLocal) {
                    setActiveConvId(existingLocal.id);
                    return;
                }

                // Always call backend to create/get the REAL conversation
                try {
                    const conv: any = await api.post('/messages/conversations', { targetUserId: event.data.userId });
                    const realId = conv.id;

                    // Now add it to local state with the real backend ID
                    setConversations(prev => {
                        const alreadyExists = prev.find(c => c.id === realId);
                        if (alreadyExists) {
                            setActiveConvId(realId);
                            return prev;
                        }
                        const newConv: Conversation = {
                            id: realId,
                            participants: conv.participants.map((p: any) => ({
                                id: p.user.id,
                                name: p.user.name || p.user.username,
                                avatar: p.user.avatar
                            })),
                            unreadCount: 0,
                            messages: event.data.context
                                ? [{ id: 'ctx', senderId: 'system', content: `Discussing: ${event.data.context}`, timestamp: 'Now', status: 'seen' as const }]
                                : []
                        };
                        setActiveConvId(realId);
                        return [newConv, ...prev];
                    });
                } catch (err) {
                    console.error('Failed to create conversation via backend', err);
                }
            }
        });

        return unsubscribe;
    }, [refreshConversations, conversations]);

    // Real-time socket integration
    useEffect(() => {
        if (!activeConvId) return;

        // 1. Join the conversation room on the backend
        send({ type: 'CONVERSATION_JOIN', conversationId: activeConvId });

        // 1.5 Fetch message history
        const fetchHistory = async () => {
            try {
                const data: any[] = await api.get(`/messages/conversations/${activeConvId}/messages`) as any;
                setConversations(prev => prev.map(c => {
                    if (c.id === activeConvId) {
                        return {
                            ...c,
                            messages: data.map((m: any) => ({
                                id: m.id,
                                senderId: m.senderId,
                                content: m.content,
                                timestamp: new Date(m.createdAt).toLocaleTimeString(),
                                status: m.isReadByAll ? 'seen' : 'sent'
                            }))
                        };
                    }
                    return c;
                }));
            } catch (err) {
                console.error('Failed to fetch message history', err);
            }
        };
        fetchHistory();

        // 2. Subscribe to incoming messages and typing events
        const unsubscribe = subscribe((event) => {
            if (event.type === 'new_message' && event.conversationId === activeConvId) {
                // Skip our own messages — we already show them optimistically
                if (event.senderId === user?.id) return;

                // Mark as read since we're viewing this conversation
                api.put(`/messages/conversations/${activeConvId}/read`).catch(console.error);

                setConversations(prev => prev.map(c => {
                    if (c.id === activeConvId) {
                        const messageExists = c.messages.some(m => m.id === event.id);
                        if (messageExists) return c;

                        return {
                            ...c,
                            lastMessage: event.content,
                            lastTimestamp: event.createdAt,
                            messages: [...(c.messages || []), {
                                id: event.id,
                                senderId: event.senderId,
                                content: event.content,
                                timestamp: new Date(event.createdAt).toLocaleTimeString(),
                                status: 'seen' as const
                            }]
                        };
                    }
                    return c;
                }));
            } else if (event.type === 'REACTION_UPDATE' && event.conversationId === activeConvId) {
                // Handle reactions in real-time if needed
            } else if (event.type === 'TYPING_START' && event.conversationId === activeConvId) {
                setIsTyping(true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
            } else if (event.type === 'TYPING_STOP' && event.conversationId === activeConvId) {
                setIsTyping(false);
            }
        });

        return () => {
            unsubscribe();
            send({ type: 'CONVERSATION_LEAVE', conversationId: activeConvId });
        };
    }, [activeConvId, subscribe, send, user?.id]);

    const value = React.useMemo(() => ({
        conversations,
        activeConvId,
        isPanelOpen,
        isTyping,
        totalUnreadCount,
        setIsPanelOpen,
        setActiveConvId,
        sendMessage,
        handleTyping,
        refreshConversations,
        checkConversation
    }), [conversations, activeConvId, isPanelOpen, isTyping, totalUnreadCount, sendMessage, handleTyping, refreshConversations, checkConversation]);

    return (
        <MessagingContext.Provider value={value}>
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

