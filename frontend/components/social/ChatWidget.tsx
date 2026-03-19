import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../services/infra/api';

const ChatWidget = ({ userId = 'user-1' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const socketRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Connect to WebSocket
    useEffect(() => {
        if (!isOpen) return;

        const baseUrl = API_URL;
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
                <div className="mb-4 w-80 h-96 bg-gh-bg border border-gh-border rounded-lg shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                    <div className="p-3 bg-gh-bg-secondary border-b border-gh-border flex justify-between items-center">
                        <h3 className="font-bold text-sm text-gh-text">Messages</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gh-text-secondary hover:text-gh-text">
                            <span className="material-symbols-outlined !text-lg">close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gh-bg-secondary">
                        {messages.length === 0 && (
                            <div className="text-center text-xs text-gh-text-secondary mt-10">
                                No messages yet.<br />Say hello! 👋
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${msg.senderId === userId ? 'bg-blue-600 text-white' : 'bg-gh-bg text-gh-text'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 bg-gh-bg border-t border-gh-border flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 bg-gh-bg-secondary border border-gh-border rounded px-3 py-1.5 text-xs text-gh-text focus:outline-none focus:border-blue-500"
                        />
                        <button onClick={handleSend} className="bg-blue-600 hover:bg-blue-500 text-white rounded px-3 py-1 flex items-center justify-center">
                            <span className="material-symbols-outlined !text-sm">send</span>
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
            >
                <span className="material-symbols-outlined">{isOpen ? 'chat_bubble' : 'chat'}</span>
            </button>
        </div>
    );
};

export default ChatWidget;


