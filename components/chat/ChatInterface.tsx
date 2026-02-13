import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Smile, Phone, Video, Info, Search, Paperclip, Send } from "lucide-react";
import { api } from "../../context/AuthContext";
import { io, Socket } from "socket.io-client";

interface ChatInterfaceProps {
    isOpen: boolean;
    onClose: () => void;
    targetUser: {
        id: string;
        username: string;
        avatar?: string;
    };
    currentUser: {
        id: string;
        avatar?: string;
    };
}

interface Message {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        username: string;
        avatar?: string;
    };
}

interface Conversation {
    id: string;
    lastMessageAt: string;
    participants: {
        user: {
            id: string;
            username: string;
            name: string | null;
            avatar: string | null;
        };
    }[];
    messages: Message[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    isOpen,
    onClose,
    targetUser,
    currentUser,
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    // Filter out current user to get the "other" participant
    const getOtherParticipant = (conv: Conversation) => {
        return conv.participants.find(p => p.user.id !== currentUser.id)?.user;
    };

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }, []);

    // Initialize Socket
    useEffect(() => {
        if (!isOpen) return;

        // Connect to Socket.IO
        const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:4000", {
            query: { userId: currentUser.id },
            withCredentials: true,
            transports: ["websocket"]
        });

        socketRef.current = newSocket;

        newSocket.on("connect", () => {
            // Connection established
        });

        newSocket.on("new_message", (payload: any) => {
            if (payload.conversationId === conversationId || payload.conversationId === activeConversationId) {
                setMessages(prev => [...prev, payload]);
                scrollToBottom();
            }
            // Refresh conversation list to update last message preview
            fetchConversations();
        });

        return () => {
            newSocket.disconnect();
        };
    }, [isOpen, conversationId, activeConversationId, currentUser.id, scrollToBottom]);

    // Load Conversations List
    const fetchConversations = useCallback(async () => {
        try {
            const res = await api.get("/messages/conversations");
            setConversations(res.data);
        } catch (err) {
            console.error("Failed to load conversations", err);
        }
    }, []);

    const initializeDirectChat = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.post("/messages/conversations", {
                targetUserId: targetUser.id,
            });
            setConversationId(res.data.id);
            setActiveConversationId(res.data.id);

            // Join socket room
            socketRef.current?.emit("WORKSPACE_JOIN", { workspaceId: res.data.id });

            // Load messages
            const msgRes = await api.get(`/messages/conversations/${res.data.id}/messages`);
            setMessages(msgRes.data);
            scrollToBottom();
        } catch (err) {
            console.error("Failed to init chat", err);
        } finally {
            setIsLoading(false);
        }
    }, [targetUser.id, scrollToBottom]);

    useEffect(() => {
        if (isOpen) {
            fetchConversations();
            // If we have a targetUser, try to find or create conversation with them
            if (targetUser.id) {
                initializeDirectChat();
            }
        }
    }, [isOpen, targetUser.id, fetchConversations, initializeDirectChat]);

    // Switch conversation from sidebar
    const handleConversationClick = async (convId: string) => {
        if (activeConversationId === convId) return;

        setActiveConversationId(convId);
        setConversationId(convId);
        setIsLoading(true);

        try {
            // Join new room
            socketRef.current?.emit("WORKSPACE_JOIN", { workspaceId: convId });

            const msgRes = await api.get(`/messages/conversations/${convId}/messages`);
            setMessages(msgRes.data);
            scrollToBottom();
        } catch (err) {
            console.error("Failed to swap chat", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !conversationId) return;

        try {
            const res = await api.post(`/messages/conversations/${conversationId}/messages`, {
                content: inputValue,
            });
            // Optimistic update
            setMessages([...messages, res.data]);
            setInputValue("");
            scrollToBottom();
            fetchConversations();
        } catch (err) {
            console.error("Failed to send", err);
        }
    };

    if (!isOpen) return null;

    const activeConversation = conversations.find(c => c.id === activeConversationId);
    // Determine the display user (either from active conversation or the initial targetUser)
    const displayUser = activeConversation ? getOtherParticipant(activeConversation) : targetUser;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-[90vw] h-[90vh] bg-[#0c0d14] rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex border border-white/5 animate-in zoom-in-95 duration-500 font-sans">

                {/* COLUMN 1: Sidebar List */}
                <div className="w-80 bg-[#12141d] border-r border-white/5 flex flex-col hidden md:flex">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <span className="material-symbols-outlined text-white">chat</span>
                            </div>
                            <button onClick={onClose} aria-label="Close Chat" className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="relative group">
                            <Search className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-white transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                className="w-full bg-[#1c1e29] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-white/10 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 custom-scrollbar">
                        <h3 className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Recent</h3>
                        {conversations.map(conv => {
                            const other = getOtherParticipant(conv);
                            const isActive = conv.id === activeConversationId;
                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => handleConversationClick(conv.id)}
                                    className={`p-3 rounded-2xl cursor-pointer flex items-center gap-3 transition-all ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                >
                                    <div className="relative shrink-0">
                                        <img src={other?.avatar || "/default-avatar.png"} className="size-12 rounded-full object-cover bg-gray-800" alt="" />
                                        <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-[#12141d]"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <span className={`font-semibold truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                                                {other?.username || "Unknown"}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">
                                            {conv.messages[0]?.content || "No messages yet"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* COLUMN 2: Chat Area */}
                <div className="flex-1 flex flex-col bg-[#0c0d14] relative border-r border-white/5">
                    {/* Header */}
                    <div className="h-20 px-6 border-b border-white/5 flex items-center justify-between bg-[#0c0d14]/90 backdrop-blur sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <img src={displayUser?.avatar || "/default-avatar.png"} className="size-10 rounded-full object-cover" alt="" />
                            <div>
                                <h3 className="font-bold text-white text-lg leading-tight">{displayUser?.username}</h3>
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <div className="size-1.5 bg-green-500 rounded-full"></div>
                                    <span className="text-xs text-white">Active now</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-gray-400">
                            <button aria-label="Audio Call" className="p-2 hover:bg-white/5 rounded-full transition-colors"><Phone size={20} /></button>
                            <button aria-label="Video Call" className="p-2 hover:bg-white/5 rounded-full transition-colors"><Video size={20} /></button>
                            <button aria-label="Chat Info" className="p-2 hover:bg-white/5 rounded-full transition-colors"><Info size={20} /></button>
                        </div>
                    </div>

                    {/* Messages List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0c0d14] to-[#0c0d14]">
                        {isLoading && (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        )}

                        {!isLoading && messages.map((msg, idx) => {
                            const isMe = msg.senderId === currentUser.id;
                            const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                    {!isMe && (
                                        <div className="w-8 shrink-0 mr-2 flex items-end">
                                            {showAvatar ? (
                                                <img src={msg.sender.avatar || "/default-avatar.png"} className="size-8 rounded-full mb-1" alt="" />
                                            ) : <div className="w-8" />}
                                        </div>
                                    )}

                                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                        <div
                                            className={`px-5 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm relative group-hover:shadow-md transition-shadow ${isMe
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-[#1c1e29] text-gray-100 rounded-bl-none border border-white/5'
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                        <span className="text-[10px] text-gray-600 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-[#0c0d14] border-t border-white/5">
                        <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-[#1c1e29] p-2 rounded-[24px] border border-white/5 focus-within:border-blue-500/50 transition-colors">
                            <button type="button" aria-label="Attach File" className="p-3 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
                                <Paperclip size={20} />
                            </button>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 py-3 max-h-32"
                            />
                            <button type="button" aria-label="Add Emoji" className="p-3 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
                                <Smile size={20} />
                            </button>
                            <button
                                type="submit"
                                aria-label="Send Message"
                                disabled={!inputValue.trim()}
                                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 transition-all transform active:scale-95"
                            >
                                <Send size={18} className={inputValue.trim() ? "ml-0.5" : ""} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* COLUMN 3: Right Panel (Profile Info) */}
                <div className="w-80 bg-[#12141d] border-l border-white/5 hidden xl:flex flex-col">
                    <div className="p-8 flex flex-col items-center border-b border-white/5">
                        <img src={displayUser?.avatar || "/default-avatar.png"} className="size-24 rounded-full object-cover mb-4 ring-4 ring-white/5 shadow-2xl" alt="" />
                        <h2 className="text-xl font-bold text-white mb-1">{displayUser?.username}</h2>
                        <p className="text-sm text-gray-500">Start Coders</p>

                        <div className="flex gap-4 mt-6 w-full">
                            <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white transition-colors">
                                Profile
                            </button>
                            <button className="flex-1 py-2 bg-transparent border border-white/10 hover:border-white/20 rounded-xl text-sm font-medium text-white transition-colors">
                                Mute
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Shared Media</h4>
                                <button className="text-xs text-blue-400 hover:text-blue-300">View All</button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="aspect-square bg-white/5 rounded-lg border border-white/5"></div>
                                <div className="aspect-square bg-white/5 rounded-lg border border-white/5"></div>
                                <div className="aspect-square bg-white/5 rounded-lg border border-white/5"></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Privacy</h4>
                            </div>
                            <div className="space-y-1">
                                <button className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors group">
                                    <span className="text-sm text-gray-300">Read Receipts</span>
                                    <div className="w-8 h-4 bg-green-500/20 rounded-full relative">
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 size-4 bg-green-500 rounded-full shadow-lg"></div>
                                    </div>
                                </button>
                                <button className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors text-red-400 hover:text-red-300 cursor-pointer">
                                    <span className="text-sm font-medium">Block User</span>
                                    <span className="material-symbols-outlined text-sm">block</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
