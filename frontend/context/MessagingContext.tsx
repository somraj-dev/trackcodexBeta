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
    type?: 'text' | 'call' | 'meeting' | 'ai-catchup' | 'file';
    metadata?: any;
}

export interface Conversation {
    id: string;
    participants: { id: string; name: string; avatar: string; isOnline?: boolean }[];
    lastMessage?: string;
    lastTimestamp?: string;
    unreadCount: number;
    messages: Message[];
    type: 'DIRECT' | 'GROUP';
    name?: string;
    isFavorite: boolean;
}

interface MessagingContextType {
    conversations: Conversation[];
    activeConvId: string | null;
    isPanelOpen: boolean;
    isTyping: boolean;
    totalUnreadCount: number;
    devMode: boolean;
    setIsPanelOpen: (open: boolean) => void;
    setActiveConvId: (id: string | null) => void;
    setDevMode: (active: boolean) => void;
    sendMessage: (text: string) => Promise<void>;
    handleTyping: () => void;
    refreshConversations: () => Promise<void>;
    checkConversation: (userId: string) => Promise<Conversation | undefined>;
    toggleFavorite: (conversationId: string, isFavorite: boolean) => Promise<void>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [devMode, setDevMode] = useState(() => localStorage.getItem('tc_dev_mode') === 'true');
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { user } = useAuth();
    const { subscribe, send } = useRealtime();
    
    // Ref to track latest conversations for the event listener without triggering extra re-runs
    const conversationsRef = useRef<Conversation[]>([]);
    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    const refreshConversations = useCallback(async () => {
        try {
            const data: any[] = await api.get('/messages/conversations') as any;
            // Map backend data to local structure
            const mapped = data.map((c: any) => ({
                id: c.id,
                participants: c.participants.map((p: any) => ({
                    id: p.user.id,
                    name: p.user.name || p.user.username,
                    avatar: p.user.avatar,
                    isOnline: p.user.status === 'ONLINE' || Math.random() > 0.7 // Mocking some online for better look
                })),
                lastMessage: c.messages[0]?.content,
                lastTimestamp: new Date(c.messages[0]?.createdAt).toLocaleTimeString(),
                unreadCount: c.participants.find((p: any) => p.userId === user?.id)?.unreadCount || 0,
                messages: [], // Fetch on demand
                type: c.type || 'DIRECT',
                name: c.name,
                isFavorite: c.isFavorite || false
            }));

            const isDummyUser = 
                user?.username?.toLowerCase().includes('dummy') || 
                user?.name?.toLowerCase().includes('dummy') || 
                user?.id === 'dev-user-001';

            if (devMode || isDummyUser) {
                const devConv: Conversation = {
                    id: 'dev-showcase',
                    name: 'Dev Mode Showcase 🛠️',
                    type: 'GROUP',
                    participants: [
                        { id: '1', name: 'Jack Doe', avatar: '' },
                        { id: '2', name: 'David Bower', avatar: '' },
                        { id: '3', name: 'Ramie', avatar: '' },
                        { id: user?.id || 'me', name: user?.name || 'Me', avatar: '' }
                    ],
                    unreadCount: 3,
                    isFavorite: true,
                    lastMessage: 'Check out the new rich interface!',
                    lastTimestamp: 'Just now',
                    messages: [
                        {
                            id: 'msg-1',
                            senderId: '1',
                            content: 'Hey team, just a reminder to prepare any updates for today and efficient!',
                            timestamp: 'Yesterday at 07:13 PM',
                            status: 'seen'
                        },
                        {
                            id: 'msg-2',
                            senderId: 'system',
                            content: 'Weekly team catchup',
                            timestamp: 'May 23 · 12:00 PM - 01:00 PM',
                            status: 'seen',
                            type: 'meeting'
                        },
                        {
                            id: 'msg-3',
                            senderId: 'system',
                            content: 'Call started',
                            timestamp: 'Today at 07:45 AM',
                            status: 'seen',
                            type: 'call',
                            metadata: { participants: ['Ramie', 'David Bower', 'Lucas'] }
                        },
                        {
                            id: 'msg-4',
                            senderId: 'system',
                            content: 'divider',
                            timestamp: 'Today',
                            status: 'seen',
                            type: 'ai-catchup'
                        },
                        {
                            id: 'msg-5',
                            senderId: '2',
                            content: 'Here are the latest animations for review. Please let me know what needs to be updated.',
                            timestamp: '07:13 PM',
                            status: 'seen'
                        },
                        {
                            id: 'msg-6',
                            senderId: '2',
                            content: 'animation-1.json',
                            timestamp: '07:13 PM',
                            status: 'seen',
                            type: 'file',
                            metadata: { size: '1.2 MB', extension: 'JSON', status: 'Uploaded' }
                        },
                        {
                            id: 'msg-7',
                            senderId: '2',
                            content: 'animation-1.json',
                            timestamp: '07:13 PM',
                            status: 'seen',
                            type: 'file',
                            metadata: { size: '1.2 MB', extension: 'JSON', status: 'Uploaded' }
                        },
                        {
                            id: 'msg-8',
                            senderId: '3',
                            content: 'Can you make sure that the code snippet below works in the latest widget version?',
                            timestamp: '07:16 PM',
                            status: 'seen'
                        },
                        {
                            id: 'msg-9',
                            senderId: '3',
                            content: '```html\n<script defer="true" src="https://widget.net/sdk.js"></script>\n<script>\n  function run() {\n    SmartChatBotApp.init({\n      project: "marketing",\n      mode: "live"\n    });\n  }\n</script>```',
                            timestamp: '07:16 PM',
                            status: 'seen',
                            type: 'text' 
                        }
                    ]
                };
                setConversations([devConv, ...mapped]);
            } else {
                setConversations(mapped);
            }
        } catch (err) {
            console.error('Failed to fetch conversations', err);
        }
    }, [api, user?.id, devMode]);

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

    // Initial load
    useEffect(() => {
        refreshConversations();
    }, [refreshConversations]);

    // DM Bus Subscription
    useEffect(() => {
        const unsubscribe = directMessageBus.subscribe(async (event: DMEvent) => {
            if (event.type === 'DM_OPEN') {
                console.log('[MessagingContext] DM_OPEN received for user:', event.data.userId);
                // Navigate to full messages page
                window.location.href = `/messages?user=${event.data.userId}`;

                // Use ref to check existing to avoid stale closures
                // Fix: Ensure we are matching the correct person (not ourselves) or just any participant with that ID
                const existingLocal = conversationsRef.current.find(c => 
                    c.participants.some(p => p.id === event.data.userId)
                );

                if (existingLocal) {
                    console.log('[MessagingContext] Found existing conversation:', existingLocal.id);
                    setActiveConvId(existingLocal.id);
                    return;
                }

                console.log('[MessagingContext] Creating new conversation for user:', event.data.userId);
                try {
                    const conv: any = await api.post('/messages/conversations', { targetUserId: event.data.userId });
                    const realId = conv.id;

                    setConversations(prev => {
                        const alreadyExists = prev.find(c => c.id === realId);
                        if (alreadyExists) return prev;
                        
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
                                : [],
                            type: 'DIRECT',
                            isFavorite: false
                        };
                        return [newConv, ...prev];
                    });
                    
                    setActiveConvId(realId);
                } catch (err) {
                    console.warn('[MessagingContext] Failed to create conversation via backend, backend might be down:', err);
                    // Fallback: If backend is down, we can't really do much but we'll try to refresh again just in case
                    refreshConversations();
                }
            }
        });

        return unsubscribe;
    }, [refreshConversations]); // Added refreshConversations to dependencies

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
        devMode,
        setIsPanelOpen,
        setActiveConvId,
        setDevMode: (active: boolean) => {
            setDevMode(active);
            localStorage.setItem('tc_dev_mode', active ? 'true' : 'false');
            refreshConversations();
        },
        sendMessage,
        handleTyping,
        refreshConversations,
        checkConversation,
        toggleFavorite: async (conversationId: string, isFavorite: boolean) => {
            if (conversationId === 'dev-showcase') {
                setConversations(prev => prev.map(c => 
                    c.id === conversationId ? { ...c, isFavorite } : c
                ));
                return;
            }
            try {
                await api.put(`/messages/conversations/${conversationId}/favorite`, { isFavorite });
                setConversations(prev => prev.map(c => 
                    c.id === conversationId ? { ...c, isFavorite } : c
                ));
            } catch (err) {
                console.error('Failed to toggle favorite', err);
            }
        }
    }), [conversations, activeConvId, isPanelOpen, isTyping, totalUnreadCount, devMode, sendMessage, handleTyping, refreshConversations, checkConversation]);

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

