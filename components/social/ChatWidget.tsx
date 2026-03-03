import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../services/api';

const ChatWidget = ({ userId = 'user-1' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const socketRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Connect to WebSocket
    useEffect(() => {
        if (!isOpen) return;

        const baseUrl = API_URL || (window.location.hostname === "localhost" ? "http://localhost:4000" : window.location.origin);
        const wsProto = baseUrl.startsWith('https') ? 'wss' : 'ws';
        const wsUrl = `${baseUrl.replace(/^https?/, wsProto)}/api/v1/chat?userId=${userId}`;

        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log('Connected to Chat');
        };

        ws.onmessage = (event) => {
            const payload = JSON.parse(event.data);

            if (payload.type === 'dm') {
                setMessages(prev => [...prev, payload.message]);
            }
            if (payload.type === 'notification') {
                // Dispatch event so App.tsx can show toast/update list
                const event = new CustomEvent('trackcodex-realtime-notification', { detail: payload.data });
                window.dispatchEvent(event);
            }
        };

        return () => {
            ws.close();
        };
    }, [isOpen, userId]);

    const handleSend = () => {
        if (!input.trim() || !socketRef.current) return;

        const msg = {
            type: 'dm',
            receiverId: 'user-2', // Hardcoded receiver for demo
            content: input
        };

        socketRef.current.send(JSON.stringify(msg));

        // Optimistic UI
        setMessages(prev => [...prev, { senderId: userId, content: input, createdAt: new Date() }]);
        setInput('');
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-80 h-96 bg-[#11141A] border border-[#1E232E] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                    <div className="p-3 bg-[#0A0D14] border-b border-[#1E232E] flex justify-between items-center">
                        <h3 className="font-bold text-sm text-white">Messages</h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                            <span className="material-symbols-outlined !text-lg">close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#0A0D14]">
                        {messages.length === 0 && (
                            <div className="text-center text-xs text-slate-500 mt-10">
                                No messages yet.<br />Say hello! 👋
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${msg.senderId === userId ? 'bg-[#0A0A0A]lue-600 text-white' : 'bg-[#11141A] text-slate-300'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 bg-[#11141A] border-t border-[#1E232E] flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 bg-[#0A0D14] border border-[#1E232E] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                        <button onClick={handleSend} className="bg-[#0A0A0A]lue-600 hover:bg-[#0A0A0A]lue-500 text-white rounded px-3 py-1 flex items-center justify-center">
                            <span className="material-symbols-outlined !text-sm">send</span>
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 bg-[#0A0A0A]lue-600 hover:bg-[#0A0A0A]lue-500 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
            >
                <span className="material-symbols-outlined">{isOpen ? 'chat_bubble' : 'chat'}</span>
            </button>
        </div>
    );
};

export default ChatWidget;
