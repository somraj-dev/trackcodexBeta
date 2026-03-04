import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import {
    X, Smile, Phone, Video, Info, Search,
    Image as ImageIcon, Heart, PlusCircle,
    ChevronLeft, MessageSquare, Check, CheckCheck
} from "lucide-react";
import { api } from "../../context/AuthContext";
import { io, Socket } from "socket.io-client";
import { API_URL } from "../../services/api";

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
        username: string;
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
    readBy?: string[];
    reactions?: { emoji: string; userId: string }[];
}

interface Conversation {
    id: string;
    lastMessageAt: string;
    type: "DIRECT" | "GROUP";
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
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [sidebarSearchTerm, setSidebarSearchTerm] = useState("");

    // New Chat / User Search State
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userSearchResults, setUserSearchResults] = useState<{ id: string; username: string; name: string | null; avatar: string | null }[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [isHackerMode, setIsHackerMode] = useState(false);
    const [isShareFileOpen, setIsShareFileOpen] = useState(false);
    const [isAILoading, setIsAILoading] = useState(false);
    const [workspaceFiles, setWorkspaceFiles] = useState<{ id: string, name: string, type: string }[]>([]);
    const [devStatus, setDevStatus] = useState<string>("Active now");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const scrollToBottom = useCallback((behavior: "smooth" | "auto" = "smooth") => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior });
        }, 100);
    }, []);

    const getOtherParticipant = useCallback((conv: Conversation) => {
        return conv.participants.find(p => p.user.id !== currentUser.id)?.user;
    }, [currentUser.id]);

    const fetchConversations = useCallback(async () => {
        try {
            const res = await api.get("/messages/conversations");
            setConversations(res.data);
            return res.data as Conversation[];
        } catch (err) {
            console.error("Failed to load conversations", err);
        }
    }, []);

    const loadMessages = useCallback(async (convId: string) => {
        setIsLoading(true);
        try {
            const msgRes = await api.get(`/messages/conversations/${convId}/messages`);
            setMessages(msgRes.data);
            scrollToBottom("auto");
        } catch (err) {
            console.error("Failed to load messages", err);
        } finally {
            setIsLoading(false);
        }
    }, [scrollToBottom]);

    const markAsRead = useCallback(async (convId: string) => {
        try {
            await api.put(`/messages/conversations/${convId}/read`);
            fetchConversations();
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    }, [fetchConversations]);

    // Initialize Socket
    useEffect(() => {
        if (!isOpen) return;

        const socketHost = API_URL || (window.location.hostname === "localhost" ? "http://localhost:4000" : window.location.origin);

        const newSocket = io(socketHost, {
            query: { userId: currentUser.id },
            withCredentials: true,
            transports: ["websocket"]
        });

        socketRef.current = newSocket;

        newSocket.on("new_message", (payload: Message & { conversationId: string }) => {
            if (payload.conversationId === activeConversationId) {
                setMessages(prev => [...prev, payload]);
                scrollToBottom();
            }
            fetchConversations();
        });

        newSocket.on("TYPING_START", (payload: { userId: string, conversationId: string }) => {
            if (payload.conversationId === activeConversationId && payload.userId !== currentUser.id) {
                setOtherUserTyping(true);
            }
        });

        newSocket.on("TYPING_STOP", (payload: { userId: string, conversationId: string }) => {
            if (payload.conversationId === activeConversationId && payload.userId !== currentUser.id) {
                setOtherUserTyping(false);
            }
        });
        newSocket.on("DEV_STATUS_UPDATE", (payload: { userId: string, status: string }) => {
            // Find the active conversation from the current state
            const currentActiveConversation = conversations.find(c => c.id === activeConversationId);
            if (currentActiveConversation) {
                const other = getOtherParticipant(currentActiveConversation);
                if (payload.userId === other?.id) {
                    setDevStatus(payload.status);
                }
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [isOpen, activeConversationId, currentUser.id, scrollToBottom, fetchConversations, conversations, getOtherParticipant]); // Added getOtherParticipant to dependencies

    useEffect(() => {
        if (isOpen && activeConversationId) {
            markAsRead(activeConversationId);
        }
    }, [isOpen, activeConversationId, messages.length, markAsRead]);

    const initializeDirectChat = useCallback(async () => {
        if (!targetUser.id) return;

        try {
            const res = await api.post("/messages/conversations", {
                targetUserId: targetUser.id,
            });
            const convId = res.data.id;
            setActiveConversationId(convId);
            socketRef.current?.emit("WORKSPACE_JOIN", { workspaceId: convId });
            loadMessages(convId);
            fetchConversations();
        } catch (err: any) { // Added type annotation for 'err'
            console.error("Failed to init chat", err);
        }
    }, [targetUser.id, fetchConversations, loadMessages]);

    useEffect(() => {
        if (isOpen) {
            fetchConversations().then((convs) => {
                if (targetUser.id) {
                    initializeDirectChat();
                } else if (convs && convs.length > 0 && !activeConversationId) {
                    setActiveConversationId(convs[0].id);
                    loadMessages(convs[0].id);
                }
            });
        }
    }, [isOpen, targetUser.id, activeConversationId, fetchConversations, initializeDirectChat, loadMessages]);

    const handleConversationClick = (convId: string) => {
        if (activeConversationId === convId) return;
        setActiveConversationId(convId);
        socketRef.current?.emit("WORKSPACE_JOIN", { workspaceId: convId });
        loadMessages(convId);
        setOtherUserTyping(false);
    };

    const handleTyping = () => {
        if (!activeConversationId || !socketRef.current) return;

        if (!isTyping) {
            setIsTyping(true);
            socketRef.current.emit("TYPING_START", { conversationId: activeConversationId });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socketRef.current?.emit("TYPING_STOP", { conversationId: activeConversationId });
        }, 2000);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !activeConversationId) return;

        const content = inputValue.trim();
        setInputValue("");

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            setIsTyping(false);
            socketRef.current?.emit("TYPING_STOP", { conversationId: activeConversationId });
        }

        try {
            const res = await api.post(`/messages/conversations/${activeConversationId}/messages`, {
                content,
            });
            setMessages(prev => [...prev, res.data]);
            scrollToBottom();
            fetchConversations();
        } catch (err: any) { // Added type annotation for 'err'
            console.error("Failed to send", err);
        }
    };

    const handleEmojiReaction = async (messageId: string, emoji: string) => {
        try {
            const res = await api.put(`/messages/${messageId}/react`, { emoji });
            setMessages(prev => prev.map(m => m.id === messageId ? res.data : m));
        } catch (err: any) { // Added type annotation for 'err'
            console.error("Failed to react", err);
        }
    };

    const handleUserSearch = async (query: string) => {
        setUserSearchQuery(query);
        if (query.length < 2) {
            setUserSearchResults([]);
            return;
        }

        setIsSearchingUsers(true);
        try {
            const res = await api.get(`/users/search?q=${query}`);
            setUserSearchResults(res.data);
        } catch (err: any) { // Added type annotation for 'err'
            console.error("User search failed", err);
        } finally {
            setIsSearchingUsers(false);
        }
    };

    const startNewChat = async (userId: string) => {
        try {
            const res = await api.post("/messages/conversations", {
                targetUserId: userId,
            });
            const convId = res.data.id;
            setActiveConversationId(convId);
            loadMessages(convId);
            fetchConversations();
            setIsNewChatOpen(false);
            setUserSearchQuery("");
            setUserSearchResults([]);
        } catch (err: any) { // Added type annotation for 'err'
            console.error("Failed to start new chat", err);
        }
    };

    const activeConversation = conversations.find(c => c.id === activeConversationId);
    const displayUser = activeConversation ? getOtherParticipant(activeConversation) : targetUser;

    const filteredConversations = useMemo(() => {
        if (!sidebarSearchTerm.trim()) return conversations;
        return conversations.filter(conv => {
            const other = conv.participants.find(p => p.user.id !== currentUser.id)?.user;
            return other?.username.toLowerCase().includes(sidebarSearchTerm.toLowerCase());
        });
    }, [conversations, sidebarSearchTerm, currentUser.id]);

    const [snippetOutput, setSnippetOutput] = useState<{ [key: string]: string }>({});

    const executeSnippet = (msgId: string, code: string) => {
        let output = "";
        const originalLog = console.log;
        console.log = (...args) => {
            output += args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" ") + "\n";
        };

        try {
            // Basic sandboxing/execution
            // eslint-disable-next-line no-eval
            eval(code);
            setSnippetOutput(prev => ({ ...prev, [msgId]: output || "Executed successfully (no output)" }));
        } catch (err: any) {
            setSnippetOutput(prev => ({ ...prev, [msgId]: `Error: ${err.message || 'Unknown error'}` }));
        } finally {
            console.log = originalLog;
        }
    };

    const renderMessageContent = (msg: Message) => {
        const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
        const matches = Array.from(msg.content.matchAll(codeBlockRegex));

        if (matches.length === 0) return <span>{msg.content}</span>;

        const parts: React.ReactNode[] = [];
        let lastIndex = 0;

        matches.forEach((match, i) => {
            const [fullMatch, lang, code] = match;
            const index = match.index!;

            // Text before code block
            if (index > lastIndex) {
                parts.push(<span key={`text-${i}`}>{msg.content.substring(lastIndex, index)}</span>);
            }

            // Code block
            parts.push(
                <div key={`code-${i}`} className="my-3 font-mono text-[13px] bg-black/50 rounded-lg overflow-hidden border border-white/10">
                    <div className="bg-white/5 px-3 py-1.5 flex items-center justify-between border-b border-white/10">
                        <span className="text-white/40 text-[10px] uppercase font-bold">{lang || 'code'}</span>
                        <button
                            onClick={() => executeSnippet(msg.id, code)}
                            className="text-[10px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-2 py-0.5 rounded transition-colors font-bold uppercase tracking-wider"
                        >
                            Run
                        </button>
                    </div>
                    <pre className="p-3 overflow-x-auto text-white/90">
                        <code>{code.trim()}</code>
                    </pre>
                    {snippetOutput[msg.id] && (
                        <div className="bg-black/80 p-3 border-t border-green-500/30 font-mono text-[11px] text-green-400">
                            <div className="flex items-center gap-2 mb-1 opacity-50">
                                <div className="size-1.5 bg-green-500 rounded-full"></div>
                                <span>OUTPUT</span>
                            </div>
                            <pre className="whitespace-pre-wrap">{snippetOutput[msg.id]}</pre>
                        </div>
                    )}
                </div>
            );

            lastIndex = index + fullMatch.length;
        });

        // Text after last code block
        if (lastIndex < msg.content.length) {
            parts.push(<span key="text-end">{msg.content.substring(lastIndex)}</span>);
        }

        return <div className="flex flex-col">{parts}</div>;
    };

    const fetchWorkspaceFiles = async () => {
        try {
            // Using a generic workspaceId if activeConversationId exists, or a default
            const res = await api.get(`/files?workspaceId=${activeConversationId || 'default'}`);
            setWorkspaceFiles(res.data);
            setIsShareFileOpen(true);
        } catch (err: any) { // Added type annotation for 'err'
            console.error("Failed to fetch files", err);
        }
    };

    const shareFile = async (fileName: string) => {
        const content = `Shared file: \`${fileName}\` (Click to open context)`;
        setInputValue(content);
        setIsShareFileOpen(false);
    };

    const askAI = async () => {
        if (!activeConversationId) return;
        setIsAILoading(true);
        try {
            const context = messages.slice(-5).map(m => `${m.sender.username}: ${m.content}`).join("\n");
            const res = await api.post("/forgeai/complete", {
                prompt: `You are ForgeAI, helping a developer in chat. Recent messages:\n${context}\n\nProvide a concise, helpful response or code explanation.`,
            });

            // Send AI response as a message
            const aiMsg = {
                content: `🤖 **ForgeAI:** ${res.data.response}`,
            };
            await api.post(`/messages/conversations/${activeConversationId}/messages`, aiMsg);
            fetchConversations();
        } catch (err: any) { // Added type annotation for 'err'
            console.error("AI query failed", err);
        } finally {
            setIsAILoading(false);
        }
    };

    if (!isOpen) return null;

    const renderDateSeparator = (date: string) => {
        const d = new Date(date);
        let label = format(d, "MMMM d, yyyy");
        if (isToday(d)) label = "Today";
        else if (isYesterday(d)) label = "Yesterday";

        return (
            <div key={`sep-${date}`} className="flex items-center justify-center my-6">
                <div className="h-px bg-white/10 flex-1" />
                <span className="px-4 text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">{label}</span>
                <div className="h-px bg-white/10 flex-1" />
            </div>
        );
    };

    const renderMessageStatus = (msg: Message, isMe: boolean) => {
        if (!isMe) return null;

        const otherParticipant = activeConversation?.participants.find(p => p.user.id !== currentUser.id);
        const isReadByOther = msg.readBy?.includes(otherParticipant?.user.id || "");

        if (isReadByOther) {
            return <CheckCheck size={14} className="text-blue-500" />;
        }
        return <Check size={14} className="text-white/30" />;
    };

    return (
        <div className={`fixed inset-0 z-[600] flex items-center justify-center bg-black/90 backdrop-blur-xl p-0 md:p-10 animate-in fade-in duration-300 font-sans ${isHackerMode ? 'hacker-mode' : ''}`}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .hacker-mode {
                    font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
                }
                .hacker-mode * {
                    border-color: rgba(34, 197, 94, 0.2) !important;
                }
                .hacker-mode .bg-[#121212], .hacker-mode .bg-black {
                    background-color: #050505 !important;
                }
                .hacker-mode .text-white {
                    color: #22c55e !important;
                }
                .hacker-mode .text-white\\/40, .hacker-mode .text-white\\/30, .hacker-mode .text-white\\/50 {
                    color: rgba(34, 197, 94, 0.4) !important;
                }
                .hacker-mode .bg-blue-600 {
                    background-color: #1a1a1a !important;
                    border: 1px solid #22c55e !important;
                    box-shadow: 0 0 10px rgba(34, 197, 94, 0.1);
                }
                .hacker-mode .bg-[#262626] {
                    background-color: #0d0d0d !important;
                    border: 1px solid rgba(34, 197, 94, 0.2) !important;
                }
                .hacker-mode .animate-pulse {
                    background-color: #22c55e !important;
                    box-shadow: 0 0 10px #22c55e;
                }
            ` }} />
            <div className="w-full h-full max-w-[1200px] max-h-[900px] bg-[#121212] rounded-none md:rounded-[1.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] flex border border-white/10 select-none">

                {/* --- SIDEBAR --- */}
                <div className="w-[350px] border-r border-white/10 flex flex-col bg-black">
                    <div className="h-[75px] px-6 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-white tracking-tight">Direct</h1>
                            <div className="size-2 bg-red-500 rounded-full animate-pulse mt-1"></div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsNewChatOpen(true)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                                aria-label="New Message"
                                title="New Message"
                            >
                                <PlusCircle size={24} strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>

                    <div className="px-6 mb-4 shrink-0">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search"
                                value={sidebarSearchTerm}
                                onChange={(e) => setSidebarSearchTerm(e.target.value)}
                                className="w-full bg-[#262626] border-none rounded-xl py-2.5 pl-11 pr-4 text-[15px] text-white focus:ring-0 placeholder:text-white/30 transition-all font-light"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="px-4 py-2 flex items-center justify-between text-[14px] font-semibold">
                            <span className="text-white">Messages</span>
                            <button className="text-white/50 hover:text-white transition-colors" aria-label="View Requests" title="View Requests">Requests</button>
                        </div>
                        {filteredConversations.map(conv => {
                            const other = getOtherParticipant(conv);
                            const isActive = conv.id === activeConversationId;
                            const lastMsg = conv.messages[0];
                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => handleConversationClick(conv.id)}
                                    className={`px-5 py-3.5 cursor-pointer flex items-center gap-3.5 transition-all group ${isActive ? 'bg-[#262626]' : 'hover:bg-[#1a1a1a]'}`}
                                >
                                    <div className="relative shrink-0">
                                        <div className={`absolute -inset-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity p-[1.5px] ${isActive ? 'opacity-100' : ''}`}>
                                            <div className="w-full h-full bg-black rounded-full" />
                                        </div>
                                        <img src={other?.avatar || "/default-avatar.png"} className="relative size-14 rounded-full object-cover border-2 border-black" alt={`${other?.username || 'User'}'s avatar`} />
                                        <div className="absolute bottom-0.5 right-0.5 size-3.5 bg-green-500 rounded-full border-[3px] border-black"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <span className="text-[15px] font-medium text-white truncate">
                                                {other?.username || "Unknown"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <p className={`text-[13px] truncate ${isActive ? 'text-white/70' : 'text-white/40'}`}>
                                                {lastMsg?.content || "Sent an attachment"}
                                            </p>
                                            <span className="shrink-0 text-[12px] text-white/30">
                                                · {new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    {!isActive && <div className="size-2.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- CHAT AREA --- */}
                <div className="flex-1 flex flex-col bg-black relative">
                    {activeConversationId ? (
                        <>
                            {/* Header */}
                            <div className="h-[75px] px-6 border-b border-white/10 flex items-center justify-between bg-black/80 backdrop-blur sticky top-0 z-20">
                                <div className="flex items-center gap-3">
                                    <div className="relative cursor-pointer group">
                                        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity p-[1px]">
                                            <div className="w-full h-full bg-black rounded-full" />
                                        </div>
                                        <img src={displayUser?.avatar || "/default-avatar.png"} className="relative size-10 rounded-full object-cover border border-white/10" alt={`${displayUser?.username || 'User'}'s avatar`} />
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-bold text-white leading-tight cursor-pointer hover:text-white/70 transition-colors">
                                            {displayUser?.username}
                                        </h3>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[11px] text-white/40 uppercase tracking-tighter">{devStatus}</span>
                                            <div className="size-1.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 text-white">
                                    <button
                                        onClick={() => setIsHackerMode(!isHackerMode)}
                                        className={`px-2 py-1 rounded border text-[10px] font-mono transition-all ${isHackerMode ? 'bg-green-500 border-green-400 text-black shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-transparent border-white/20 text-white/50 hover:text-white'}`}
                                        title="Toggle Hacker Mode"
                                    >
                                        {isHackerMode ? '>_ HACKER' : '>_ NORMAL'}
                                    </button>
                                    <button className="p-1 hover:text-white/60 transition-colors" aria-label="Call" title="Call"><Phone size={24} strokeWidth={1.5} /></button>
                                    <button className="p-1 hover:text-white/60 transition-colors" aria-label="Video Call" title="Video Call"><Video size={26} strokeWidth={1.5} /></button>
                                    <button className="p-1 hover:text-white/60 transition-colors" aria-label="Details" title="Details"><Info size={24} strokeWidth={1.5} /></button>
                                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full md:hidden transition-colors" aria-label="Back" title="Back"><ChevronLeft size={24} /></button>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 custom-scrollbar bg-[#000000]">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin size-8 border-2 border-white/20 border-t-white rounded-full"></div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-col items-center py-10 opacity-50">
                                            <img src={displayUser?.avatar || "/default-avatar.png"} className="size-20 rounded-full mb-3" alt={`${displayUser?.username || 'User'}'s avatar`} />
                                            <h4 className="text-xl font-bold text-white">{displayUser?.username}</h4>
                                            <p className="text-sm">Instagram · {displayUser?.username}</p>
                                            <button className="mt-4 px-4 py-1.5 bg-[#262626] hover:bg-[#363636] transition-colors rounded-lg text-sm font-semibold text-white">
                                                View Profile
                                            </button>
                                        </div>

                                        {messages.map((msg, idx) => {
                                            const isMe = msg.senderId === currentUser.id;
                                            const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
                                            const nextFromSame = messages[idx + 1]?.senderId === msg.senderId;
                                            const showDateSeparator = idx === 0 || !isSameDay(new Date(msg.createdAt), new Date(messages[idx - 1].createdAt));

                                            return (
                                                <React.Fragment key={msg.id}>
                                                    {showDateSeparator && renderDateSeparator(msg.createdAt)}
                                                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-0.5`}>
                                                        {!isMe && (
                                                            <div className="w-8 shrink-0 mr-2 flex items-end">
                                                                {showAvatar && (
                                                                    <img src={msg.sender.avatar || "/default-avatar.png"} className="size-7 rounded-full mb-1 border border-white/5" alt={`${msg.sender.username}'s avatar`} />
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className={`max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'} group/msg relative`}>
                                                            <div
                                                                className={`px-4 py-2.5 rounded-[1.2rem] text-[15px] leading-snug break-words group-hover/msg:opacity-90 transition-opacity ${isMe
                                                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                                                    : 'bg-[#262626] text-white rounded-bl-sm'
                                                                    } ${nextFromSame ? (isMe ? 'rounded-br-[1.2rem]' : 'rounded-bl-[1.2rem]') : ''}`}
                                                            >
                                                                {renderMessageContent(msg)}
                                                            </div>

                                                            {/* Reaction Display */}
                                                            {msg.reactions && msg.reactions.length > 0 && (
                                                                <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                                    {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => (
                                                                        <div key={emoji} className="bg-[#262626] border border-white/10 rounded-full px-1.5 py-0.5 text-[12px] flex items-center gap-1 shadow-sm">
                                                                            <span>{emoji}</span>
                                                                            <span className="text-white/40 text-[10px] font-bold">
                                                                                {msg.reactions?.filter(r => r.emoji === emoji).length}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Reaction Trigger */}
                                                            <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? '-left-12' : '-right-12'} opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1`}>
                                                                <button
                                                                    onClick={() => handleEmojiReaction(msg.id, "❤️")}
                                                                    className="p-1.5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
                                                                    title="Reaction ❤️"
                                                                >
                                                                    <Heart size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEmojiReaction(msg.id, "😂")}
                                                                    className="p-1.5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors text-[14px]"
                                                                    title="Reaction 😂"
                                                                >
                                                                    😂
                                                                </button>
                                                            </div>

                                                            {!nextFromSame && (
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                                                                        {format(new Date(msg.createdAt), "h:mm a")}
                                                                    </div>
                                                                    {renderMessageStatus(msg, isMe)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })}
                                        {otherUserTyping && (
                                            <div className="flex justify-start animate-in slide-in-from-left-2 fade-in duration-300">
                                                <div className="w-8 mr-2" />
                                                <div className="bg-[#262626] px-4 py-3 rounded-[1.2rem] flex gap-1 items-center">
                                                    <div className="size-1.5 bg-white/40 rounded-full animate-bounce"></div>
                                                    <div className="size-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                                    <div className="size-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} aria-hidden="true" />
                                    </>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="px-6 py-5 shrink-0">
                                <form
                                    onSubmit={handleSendMessage}
                                    className="flex items-center gap-3 bg-black border border-white/20 rounded-[2rem] px-4 py-2 focus-within:border-white/40 transition-all"
                                >
                                    <button type="button" className="p-1 hover:text-white/60 transition-colors text-white" aria-label="Emoji Picker" title="Emoji Picker">
                                        <Smile size={26} strokeWidth={1.5} />
                                    </button>

                                    <input
                                        type="text"
                                        placeholder="Message..."
                                        value={inputValue}
                                        onChange={(e) => {
                                            setInputValue(e.target.value);
                                            handleTyping();
                                        }}
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] text-white py-2 placeholder:text-white/40"
                                    />

                                    {inputValue.trim() || isAILoading ? (
                                        <button
                                            type="submit"
                                            disabled={isAILoading}
                                            className="text-white font-bold text-[15px] px-2 hover:text-white/80 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isAILoading ? 'Thinking...' : 'Send'}
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-3 text-white">
                                            <button
                                                type="button"
                                                onClick={askAI}
                                                className="p-1 hover:text-blue-400 transition-colors text-blue-500"
                                                title="Ask ForgeAI"
                                            >
                                                <div className="size-6 rounded-full border border-blue-500 flex items-center justify-center text-[10px] font-bold">AI</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={fetchWorkspaceFiles}
                                                className="p-1 hover:text-white/60 transition-colors"
                                                aria-label="Add Media"
                                                title="Share Workspace File"
                                            >
                                                <ImageIcon size={26} strokeWidth={1.5} />
                                            </button>
                                            <button type="button" className="p-1 hover:text-white/60 transition-colors text-white" aria-label="Like Message" title="Like Message"><Heart size={26} strokeWidth={1.5} /></button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center px-10">
                            <div className="size-24 border-2 border-white rounded-full flex items-center justify-center mb-6">
                                <MessageSquare size={48} strokeWidth={1} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Your Messages</h2>
                            <p className="text-white/50 text-[15px] max-w-xs mb-8">
                                Send private photos and messages to a friend or group.
                            </p>
                            <button
                                onClick={() => setIsNewChatOpen(true)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                            >
                                Send Message
                            </button>
                        </div>
                    )}
                </div>

                {/* New Chat Modal */}
                {isNewChatOpen && (
                    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md bg-[#262626] rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">New Message</h2>
                                <button onClick={() => setIsNewChatOpen(false)} className="text-white/50 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={userSearchQuery}
                                        onChange={(e) => handleUserSearch(e.target.value)}
                                        className="w-full bg-black border-none rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-1 focus:ring-blue-500 placeholder:text-white/30"
                                        autoFocus
                                    />
                                </div>

                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2">
                                    {isSearchingUsers ? (
                                        <div className="flex justify-center p-8">
                                            <div className="animate-spin size-6 border-2 border-white/20 border-t-white rounded-full"></div>
                                        </div>
                                    ) : userSearchResults.length > 0 ? (
                                        userSearchResults.map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => startNewChat(user.id)}
                                                className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors"
                                            >
                                                <img src={user.avatar || "/default-avatar.png"} className="size-10 rounded-full object-cover" alt="" />
                                                <div className="text-left">
                                                    <p className="text-white font-medium">{user.username}</p>
                                                    <p className="text-white/40 text-sm">{user.name || user.username}</p>
                                                </div>
                                            </button>
                                        ))
                                    ) : userSearchQuery.length >= 2 ? (
                                        <p className="text-center text-white/40 py-8">No users found</p>
                                    ) : (
                                        <p className="text-center text-white/40 py-8">Search for people to chat with</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Share File Modal */}
                {isShareFileOpen && (
                    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md bg-[#262626] rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Share Workspace File</h2>
                                <button onClick={() => setIsShareFileOpen(false)} className="text-white/50 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar space-y-1">
                                {workspaceFiles.length > 0 ? workspaceFiles.map(file => (
                                    <button
                                        key={file.id}
                                        onClick={() => shareFile(file.id)}
                                        className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors text-white/70 hover:text-white text-sm"
                                    >
                                        <div className="size-8 rounded bg-white/5 flex items-center justify-center">
                                            {file.type === 'folder' ? '📁' : '📄'}
                                        </div>
                                        <span>{file.name}</span>
                                    </button>
                                )) : (
                                    <p className="text-center text-white/40 py-8 text-sm">No files found in workspace</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Close Button overlay */}
            <button
                aria-label="Close Chat"
            >
                <X size={32} strokeWidth={1} />
            </button>
        </div>
    );
};
