import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../services/infra/api";
import { useAuth } from "../../context/AuthContext";
import { useMessaging } from "../../context/MessagingContext";
import { formatDistanceToNow } from "../../utils/dateUtils";

const MessagesView = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const initialUserId = searchParams.get("user");
    const { conversations, checkConversation, sendMessage } = useMessaging();

    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize conversation if came from a ?user= link
    useEffect(() => {
        if (initialUserId) {
            checkConversation(initialUserId).then((conv) => {
                if (conv) setActiveConvId(conv.id);
            }).catch(err => console.error("Error checking conversation", err));
        }
    }, [initialUserId, checkConversation]);

    // Load messages for active conversation
    useEffect(() => {
        if (activeConvId) {
            api.get(`/messages/conversations/${activeConvId}/messages`)
                .then((res: any) => {
                    setMessages(Array.isArray(res) ? res : []);
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                })
                .catch(err => console.error("Error loading messages", err));
        } else {
            setMessages([]);
        }
    }, [activeConvId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !activeConvId) return;

        try {
            await api.post(`/messages/conversations/${activeConvId}/messages`, { content: inputValue });
            // Refresh messages
            api.get(`/messages/conversations/${activeConvId}/messages`).then(res => setMessages(res as any));
            setInputValue("");
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    return (
        <div className="flex h-full bg-gh-bg text-gh-text overflow-hidden font-sans border-t border-gh-border">
            {/* Sidebar - Conversation List */}
            <div className="w-[320px] border-r border-gh-border flex flex-col bg-gh-bg shrink-0">
                <div className="p-4 border-b border-gh-border flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gh-text">Messages</h2>
                    <button className="text-gh-text-secondary hover:text-gh-text transition-colors">
                        <span className="material-symbols-outlined !text-[20px]">edit_square</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center text-gh-text-secondary">
                            <span className="material-symbols-outlined !text-[48px] mb-4 opacity-50">chat_bubble_outline</span>
                            <p className="text-sm">No conversations yet.</p>
                            <p className="text-xs mt-2">Start a chat from someone's profile!</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {conversations.map((conv) => {
                                const otherParticipant = conv.participants?.find((p: any) => p.id !== user?.id) || { id: "", name: "Unknown", avatar: "" };
                                const isActive = activeConvId === conv.id;

                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => setActiveConvId(conv.id)}
                                        className={`flex items-start gap-3 p-3 text-left transition-colors border-b border-gh-border/50 ${isActive ? "bg-gh-bg-secondary border-l-2 border-l-primary" : "hover:bg-gh-bg-secondary"}`}
                                    >
                                        <div className="relative">
                                            {otherParticipant.avatar ? (
                                                <img src={otherParticipant.avatar} alt="" className="w-10 h-10 rounded-full bg-gh-bg-tertiary object-cover border border-gh-border" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gh-bg-tertiary border border-gh-border flex flex-col items-center justify-center text-gh-text text-sm font-bold">
                                                    {otherParticipant.name?.charAt(0) || "?"}
                                                </div>
                                            )}
                                            {/* Note: In a real app we would check online status */}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <span className="font-semibold text-[14px] text-gh-text truncate">
                                                    {otherParticipant.name}
                                                </span>
                                            </div>
                                            <p className="text-[13px] text-gh-text-secondary truncate">
                                                {conv.lastMessage || "No messages yet"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative bg-gh-bg">
                {activeConvId ? (
                    <>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {messages.map((msg, i) => {
                                const isMine = msg.senderId === user?.id;

                                return (
                                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-[14px] ${isMine ? "bg-primary text-white rounded-br-sm" : "bg-gh-bg-tertiary text-gh-text rounded-bl-sm"
                                            }`}>
                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                            <div className={`text-[11px] mt-1 opacity-70 flex items-center gap-1 ${isMine ? "justify-end" : "justify-start"}`}>
                                                {formatDistanceToNow(msg.createdAt, { addSuffix: true })}
                                                {isMine && <span className="material-symbols-outlined !text-[14px] ml-1">done_all</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t border-gh-border bg-gh-bg shrink-0">
                            <form onSubmit={handleSend} className="relative flex items-end">
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                    placeholder="Message..."
                                    className="w-full bg-gh-bg border border-gh-border hover:border-gh-text-secondary focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-4 pr-12 py-3 text-[14px] text-gh-text placeholder:text-gh-text-secondary resize-none overflow-hidden transition-all duration-200 min-h-[48px] max-h-[120px]"
                                    rows={Math.min(5, Math.max(1, inputValue.split("\n").length))}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim()}
                                    className="absolute right-2 bottom-2 p-1.5 text-white bg-primary hover:opacity-90 disabled:bg-gh-bg-tertiary disabled:text-gh-text-secondary rounded-lg transition-colors flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined !text-[18px]">send</span>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gh-text-secondary bg-gh-bg">
                        <span className="material-symbols-outlined !text-[64px] mb-4 opacity-50">forum</span>
                        <h3 className="text-xl font-semibold text-gh-text mb-2">Your Messages</h3>
                        <p className="text-[14px] max-w-sm text-center">
                            Select a conversation from the sidebar or start a new one to connect with other developers.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesView;


