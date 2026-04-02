import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useMessaging, Conversation, Message } from "../../context/MessagingContext";
import { stringToColor } from "../../utils/colorUtils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type LeftNavItem = {
  label: string;
  badge?: string;
  active?: boolean;
  onClick?: () => void;
};

type PersonItem = {
  label: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (e: React.MouseEvent) => void;
  isOnline?: boolean;
};

function CircleAvatar({
  text,
  bg,
  size = 30,
  fontSize = 11,
}: {
  text: string;
  bg: string;
  size?: number;
  fontSize?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 600,
        fontSize,
        flexShrink: 0,
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
}


function DotRow({ item }: { item: PersonItem }) {
  return (
    <div
      onClick={item.onClick}
      style={{
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 8px",
        borderRadius: 8,
        background: item.active ? "#F2F0FF" : "transparent",
        color: item.active ? "#5C48D6" : "#3A3A46",
        fontSize: 14,
        fontWeight: item.active ? 600 : 500,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, position: "relative" }}>
        <div style={{ position: "relative" }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: item.color,
                display: "block",
                flexShrink: 0,
              }}
            />
            {item.isOnline && (
                <div style={{ 
                    position: "absolute", 
                    bottom: -2, 
                    right: -2, 
                    width: 6, 
                    height: 6, 
                    borderRadius: 999, 
                    background: "#22C55E", 
                    border: "1.5px solid var(--gh-bg-secondary)" 
                }} />
            )}
        </div>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
            {item.label}
        </span>
      </div>

      <div 
        onClick={item.onFavoriteToggle}
        style={{ color: item.isFavorite ? "#D1A15E" : "#D1D5DB", fontSize: 16, visibility: item.active || item.isFavorite ? "visible" : "hidden" }}
      >
        ★
      </div>
    </div>
  );
}

function TopTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        height: 40,
        display: "flex",
        alignItems: "center",
        color: active ? "#252733" : "#8C90A3",
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        padding: "0 2px",
      }}
    >
      {label}
      {active ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -1,
            height: 2,
            background: "#1E1F24",
            borderRadius: 999,
          }}
        />
      ) : null}
    </div>
  );
}


function FileCard({ filename, size, extension, status }: { filename: string; size: string; extension?: string; status?: string }) {
  return (
    <div
      className="rich-block-bg"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderRadius: 16,
        padding: "12px 14px",
        width: 320,
        marginBottom: 8,
        cursor: "pointer"
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          background: "var(--gh-bg-tertiary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        📄
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--gh-text)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {filename}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--gh-text-secondary)",
            display: "flex",
            gap: 6,
            alignItems: "center",
            marginTop: 2,
          }}
        >
          <span>{size}</span>
          {extension && <span style={{ opacity: 0.6 }}>{extension}</span>}
          {status && <span style={{ color: "#10B981", fontWeight: 600 }}>{status}</span>}
        </div>
      </div>
    </div>
  );
}

function MeetingBlock({ title, time }: { title: string; time: string }) {
  return (
    <div
      className="rich-block-bg"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderRadius: 16,
        padding: "12px 14px",
        width: 320,
        marginTop: 10,
        marginBottom: 10,
        cursor: "pointer"
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          background: "#F2F0FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#5C48D6",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        📅
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gh-text)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--gh-text-secondary)", marginTop: 2 }}>{time}</div>
      </div>
    </div>
  );
}

function CallBlock({ timestamp, participants }: { timestamp: string; participants: string[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, marginBottom: 14 }}>
      <div style={{ 
        width: 24, 
        height: 24, 
        borderRadius: 999, 
        background: "#FEE2E2", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        color: "#EF4444",
        fontSize: 12
      }}>
        📞
      </div>
      <div style={{ fontSize: 13, color: "var(--gh-text-secondary)" }}>
        <span style={{ fontWeight: 600, color: "var(--gh-text)" }}>Call started</span>
        <span style={{ margin: "0 6px", opacity: 0.5 }}>·</span>
        <span>{timestamp}</span>
        <span style={{ marginLeft: 8 }}>{participants.join(", ")} joined the call</span>
      </div>
    </div>
  );
}

function AICatchUpDivider({ label }: { label: string }) {
  const { setDevMode } = useMessaging();
  
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, marginBottom: 20 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gh-text-secondary)", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "var(--gh-border)", opacity: 0.5 }} />
      <button
        className="ai-pulse"
        onClick={() => alert("AI is analyzing the conversation...")}
        style={{
          height: 28,
          padding: "0 14px",
          borderRadius: 999,
          background: "linear-gradient(135deg, #FFD6A5, #BDB2FF)",
          border: "none",
          color: "#5C48D6",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(92, 72, 214, 0.2)",
          display: "flex",
          alignItems: "center",
          gap: 6
        }}
      >
        <span>Ask AI to Catch Up</span>
      </button>
    </div>
  );
}

function StatusTicks({ status }: { status: "sent" | "seen" | "delivered" }) {
    const isSeen = status === "seen";
    const isDelivered = status === "delivered" || isSeen;
    
    return (
        <span className="msg-tick-container">
            <span className={`msg-tick ${isSeen ? "msg-tick-seen" : ""}`} />
            {isDelivered && <span className={`msg-tick msg-tick-double ${isSeen ? "msg-tick-seen" : ""}`} />}
        </span>
    );
}

function ReplyIndicator({ count, unread, participants }: { count: number; unread?: number; participants: any[] }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
                {participants.slice(0, 3).map((p, i) => (
                    <div 
                        key={i} 
                        style={{ 
                            marginLeft: i === 0 ? 0 : -6, 
                            border: "2px solid var(--gh-bg)", 
                            borderRadius: 999 
                        }}
                    >
                        <CircleAvatar text={p.charAt(0)} bg={stringToColor(p)} size={20} fontSize={9} />
                    </div>
                ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#5C48D6", display: "flex", gap: 6 }}>
                <span>{count} replies</span>
                {unread && <span style={{ color: "var(--gh-text-secondary)", fontWeight: 400 }}>{unread} unread replies</span>}
            </div>
        </div>
    );
}

function TypingIndicator({ users }: { users: string[] }) {
    if (users.length === 0) return null;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", background: "rgba(255,255,255,0.02)" }}>
            <div className="typing-dots">
                <span />
                <span />
                <span />
            </div>
            <span style={{ fontSize: 12, color: "var(--gh-text-secondary)", fontStyle: "italic" }}>
                {users.length === 1 ? `${users[0]} is typing...` : `${users.join(", ")} are typing...`}
            </span>
        </div>
    );
}

function MessageBlock({ msg, sender }: { msg: Message; sender: any }) {
    const { user } = useAuth();
    const isMe = msg.senderId === user?.id;

    if (msg.type === 'meeting') {
        return <MeetingBlock title={msg.content} time={msg.timestamp} />;
    }
    
    if (msg.type === 'call') {
        return <CallBlock timestamp={msg.timestamp} participants={msg.metadata?.participants || []} />;
    }
    
    if (msg.type === 'ai-catchup') {
        return <AICatchUpDivider label={msg.timestamp} />;
    }

    if (msg.type === 'file') {
        return (
            <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 12 }}>
                <FileCard 
                    filename={msg.content} 
                    size={msg.metadata?.size || "0 KB"} 
                    extension={msg.metadata?.extension}
                    status={msg.metadata?.status}
                />
            </div>
        );
    }

    const isCode = msg.content.includes("```") || msg.content.includes("<script");
    
    if (isCode) {
        return <CodeBlockMessage msg={msg} isMe={isMe} />;
    }

    // Mock replies for specific messages in dev showcase (only for them)
    const hasReplies = !isMe && (msg.id === 'msg-8' || msg.id === 'msg-5');

    return (
    <div style={{ 
        display: "flex", 
        flexDirection: "column",
        alignItems: isMe ? "flex-end" : "flex-start",
        gap: 4, 
        marginTop: 12,
        marginBottom: 12,
        paddingLeft: isMe ? 60 : 0,
        paddingRight: isMe ? 0 : 60
    }}>
      {!isMe && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gh-text-secondary)" }}>{sender.name}</span>
        </div>
      )}
      
      <div 
        className={`msg-bubble ${isMe ? "msg-bubble-me" : "msg-bubble-them"}`}
        style={{
            position: "relative",
            minWidth: 80
        }}
      >
        <div style={{ wordBreak: "break-word" }}>
            {msg.content}
        </div>
        
        <div 
            style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "flex-end", 
                gap: 4, 
                marginTop: 2,
                opacity: 0.7,
                fontSize: 10
            }}
        >
            <span>{msg.timestamp}</span>
            {isMe && <StatusTicks status={msg.status} />}
        </div>
      </div>

      {hasReplies && (
          <div style={{ marginLeft: 12 }}>
            <ReplyIndicator 
                count={14} 
                unread={3} 
                participants={['Ramie', 'David', 'Lucas']} 
            />
          </div>
      )}
    </div>
  );
}

function CodeBlockMessage({ msg, isMe }: { msg: Message; isMe: boolean }) {
    // Extract code and language from backticks if present
    const codeMatch = msg.content.match(/```(\w+)?\s*([\s\S]+?)\s*```/);
    const language = codeMatch && codeMatch[1] ? codeMatch[1].toLowerCase() : "plaintext";
    const codeContent = codeMatch ? codeMatch[2] : msg.content;

  return (
    <div style={{ 
        display: "flex", 
        flexDirection: "column",
        alignItems: isMe ? "flex-end" : "flex-start",
        gap: 0, 
        marginTop: 12,
        marginBottom: 12,
        paddingLeft: isMe ? 60 : 0,
        paddingRight: isMe ? 0 : 60,
        width: "100%",
        maxWidth: "100%",
        position: "relative"
    }}>
      <div className="chatgpt-code-block" style={{ marginTop: 0 }}>
        {/* Exact ChatGPT Header */}
        <div className="chatgpt-code-header" style={{ background: "#212121", height: 36, padding: "0 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="material-symbols-outlined !text-[14px]" style={{ color: "#9ca3af" }}>code</span>
                <span style={{ fontSize: 11, color: "#d1d5db", fontWeight: 400, fontFamily: "Inter, sans-serif" }}>
                    {language}
                </span>
            </div>
            
            <div className="chatgpt-code-actions" style={{ gap: 16 }}>
                <div className="chatgpt-action-btn" title="Copy code" style={{ cursor: "pointer", color: "#9ca3af" }}>
                    <span className="material-symbols-outlined !text-[16px]">content_copy</span>
                </div>
                <div className="chatgpt-action-btn" style={{ cursor: "pointer", color: "#9ca3af" }} title="Preview">
                    <span className="material-symbols-outlined !text-[18px]">visibility</span>
                </div>
                <div className="chatgpt-action-btn" style={{ cursor: "pointer", color: "#9ca3af" }} title="Edit">
                    <span className="material-symbols-outlined !text-[18px]">edit</span>
                </div>
                <div className="chatgpt-run-container" style={{ background: "#404040", borderRadius: 16, padding: "2px 4px" }}>
                    <div className="chatgpt-run-btn" style={{ width: 24, height: 24 }} title="Terminal">
                        <span className="material-symbols-outlined !text-[14px]">terminal</span>
                    </div>
                    <div className="chatgpt-run-btn" style={{ width: 24, height: 24 }} title="Run">
                        <span className="material-symbols-outlined !text-[16px]">play_arrow</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Code Content with Syntax Highlighting */}
        <div style={{ background: "#000000" }}>
            <SyntaxHighlighter
                language={language === "plaintext" ? "text" : language}
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                    padding: "16px 20px",
                    background: "#000000",
                    fontSize: "13px",
                    border: "none",
                    lineHeight: "1.6"
                }}
                codeTagProps={{
                    style: {
                        fontFamily: "'Fira Code', 'JetBrains Mono', monospace"
                    }
                }}
            >
                {codeContent}
            </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}

export default function MessagePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get("user");
  const { 
    conversations, 
    activeConvId, 
    setActiveConvId, 
    sendMessage, 
    checkConversation, 
    toggleFavorite,
    devMode,
    setDevMode
  } = useMessaging();

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialUserId) {
        checkConversation(initialUserId).then(conv => {
            if (conv) setActiveConvId(conv.id);
        });
    }
  }, [initialUserId, checkConversation, setActiveConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeConvId]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !activeConvId) return;
    sendMessage(inputValue);
    setInputValue("");
  };

  const favoriteConvs = conversations.filter(c => c.isFavorite);
  const dmConvs = conversations.filter(c => c.type === 'DIRECT' && !c.isFavorite);
  const channelConvs = conversations.filter(c => c.type === 'GROUP');

  const getOtherParticipant = (conv: Conversation) => {
    const p = conv.participants.find(p => p.id !== user?.id);
    return p || { 
      id: "unknown", 
      name: "Unknown", 
      avatar: "", 
      isOnline: false 
    };
  };

  return (
    <div
      style={{
        height: "calc(100vh - 48px)",
        background: "var(--gh-bg)",
        padding: 0,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: "var(--gh-text)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          width: "100%",
          background: "var(--gh-bg-secondary)",
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          overflow: "hidden",
        }}
      >
        <aside
          style={{
            borderRight: "1px solid var(--gh-border)",
            background: "var(--gh-bg-secondary)",
            padding: "14px 12px 12px 14px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 24,
                lineHeight: "32px",
                fontWeight: 600,
                color: "var(--gh-text)",
              }}
            >
              Chat
            </div>

            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: "1px solid var(--gh-border)",
                background: "var(--gh-bg-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gh-text-secondary)",
                fontSize: 13,
                cursor: "pointer",
              }}
              title="New Message"
            >
              ✎
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 12,
            }}
          >
            {["Unread", "DMs", "Channels"].map((tab, i) => (
              <div
                key={tab}
                style={{
                  height: 28,
                  padding: "0 10px",
                  borderRadius: 999,
                  border: "1px solid var(--gh-border)",
                  background: i === 0 ? "var(--gh-bg-tertiary)" : "transparent",
                  color: "var(--gh-text)",
                  fontSize: 12,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Favorites Section */}
          {favoriteConvs.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, color: "var(--gh-text-secondary)", fontWeight: 600, marginBottom: 8, paddingLeft: 8 }}>
                Favorites
              </div>
              <div style={{ display: "grid", gap: 2 }}>
                {favoriteConvs.map((conv) => {
                    const otherUser = getOtherParticipant(conv);
                    return (
                        <DotRow 
                          key={conv.id} 
                          item={{ 
                            label: conv.type === 'GROUP' ? (conv.name || "Group") : otherUser.name, 
                            color: stringToColor(conv.id), 
                            active: activeConvId === conv.id,
                            isFavorite: true,
                            isOnline: !!(otherUser as any).isOnline,
                            onFavoriteToggle: (e) => { e.stopPropagation(); toggleFavorite(conv.id, false); },
                            onClick: () => setActiveConvId(conv.id)
                          }} 
                        />
                    );
                })}
              </div>
            </div>
          )}

          {/* Direct Messages Section */}
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
                paddingLeft: 8,
                paddingRight: 8,
              }}
            >
              <span style={{ fontSize: 13, color: "var(--gh-text-secondary)", fontWeight: 600 }}>Direct Messages</span>
              <span style={{ fontSize: 13, color: "var(--gh-text-secondary)", cursor: "pointer" }}>⌕</span>
            </div>

            <div style={{ display: "grid", gap: 2 }}>
              {dmConvs.map((conv) => {
                  const otherUser = getOtherParticipant(conv);
                  return (
                    <DotRow 
                      key={conv.id} 
                      item={{ 
                        label: otherUser.name, 
                        color: stringToColor(otherUser.id), 
                        active: activeConvId === conv.id,
                        isFavorite: false,
                        isOnline: !!(otherUser as any).isOnline,
                        onFavoriteToggle: (e) => { e.stopPropagation(); toggleFavorite(conv.id, true); },
                        onClick: () => setActiveConvId(conv.id)
                      }} 
                    />
                  );
              })}
              {dmConvs.length === 0 && <div style={{ fontSize: 12, color: "var(--gh-text-secondary)", paddingLeft: 10 }}>No recent chats</div>}
            </div>

            <div
              style={{
                height: 30,
                display: "flex",
                alignItems: "center",
                padding: "0 8px",
                color: "var(--gh-text-secondary)",
                fontSize: 13,
                fontWeight: 500,
                marginTop: 4,
                cursor: "pointer",
              }}
            >
              + New message
            </div>
          </div>

          {/* Channels Section */}
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
                paddingLeft: 8,
                paddingRight: 8,
              }}
            >
              <span style={{ fontSize: 13, color: "var(--gh-text-secondary)", fontWeight: 600 }}>Channels</span>
              <span style={{ fontSize: 13, color: "var(--gh-text-secondary)", cursor: "pointer" }}>⌕</span>
            </div>

            <div style={{ display: "grid", gap: 2 }}>
              {channelConvs.map((conv) => (
                    <DotRow 
                        key={conv.id} 
                        item={{ 
                            label: conv.name || "Unnamed Channel", 
                            color: "#7C6CF2", 
                            active: activeConvId === conv.id,
                            isFavorite: conv.isFavorite,
                            onFavoriteToggle: (e) => { e.stopPropagation(); toggleFavorite(conv.id, !conv.isFavorite); },
                            onClick: () => setActiveConvId(conv.id)
                        }} 
                    />
              ))}
              {channelConvs.length === 0 && <div style={{ fontSize: 12, color: "var(--gh-text-secondary)", paddingLeft: 10 }}>No channels joined</div>}
            </div>
             <div
              style={{
                height: 30,
                display: "flex",
                alignItems: "center",
                padding: "0 8px",
                color: "var(--gh-text-secondary)",
                fontSize: 13,
                fontWeight: 500,
                marginTop: 4,
                cursor: "pointer",
              }}
            >
              + Create channel
            </div>
          </div>

          <div style={{ marginTop: "auto", paddingTop: 20 }}>
            <div 
                onClick={() => setDevMode(!devMode)}
                style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: devMode ? "rgba(92, 72, 214, 0.1)" : "var(--gh-bg-tertiary)",
                    border: devMode ? "1px solid #5C48D6" : "1px solid var(--gh-border)",
                    color: devMode ? "#5C48D6" : "var(--gh-text-secondary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 10
                }}
            >
                <span>{devMode ? "Dev Mode: ON" : "Enable Dev Mode"}</span>
                <span>🛠️</span>
            </div>
            
            <div style={{ fontSize: 11, color: "var(--gh-text-secondary)", textAlign: "center", opacity: 0.5 }}>
                TrackCodex v1.2.0-beta
            </div>
          </div>
        </aside>

        <main
          style={{
            background: "var(--gh-bg)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {activeConv ? (
            <>
              <div
                style={{
                  padding: "16px 20px 0 20px",
                  borderBottom: "1px solid var(--gh-border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "var(--gh-text-secondary)",
                    marginBottom: 10,
                  }}
                >
                  <span>Chat</span>
                  <span>/</span>
                  <span style={{ color: "var(--gh-primary)", fontWeight: 600 }}>
                    {activeConv.type === 'GROUP' ? "Channel" : "Direct Message"}
                  </span>
                  <span>/</span>
                  <span style={{ color: "var(--gh-text-secondary)" }}>
                     {activeConv.type === 'GROUP' ? activeConv.name : getOtherParticipant(activeConv).name}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 22,
                    alignItems: "flex-end",
                    height: 42,
                  }}
                >
                  <TopTab label="Conversation" active />
                  <TopTab label="Team" />
                  <TopTab label="Docs" />
                  <TopTab label="Meetings" />
                  <TopTab label="Projects" />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 24px 20px" }} className="custom-scrollbar">
                <div
                  style={{
                    fontSize: 24,
                    lineHeight: "32px",
                    fontWeight: 600,
                    color: "var(--gh-text)",
                    marginBottom: 16,
                  }}
                >
                   {activeConv.type === 'GROUP' ? activeConv.name : getOtherParticipant(activeConv).name}
                </div>

                {activeConv.messages.map((m, i) => {
                    const sender = activeConv.participants.find(p => p.id === m.senderId) || { name: "Unknown", id: m.senderId };
                    return <MessageBlock key={m.id} msg={m} sender={sender} />;
                })}
                <div ref={messagesEndRef} />
              </div>
              
              <TypingIndicator users={[]} /> { /* Mocking no one typing for now */ }

              <div style={{ padding: "0 20px 20px 20px" }}>
                <form 
                  onSubmit={handleSend}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "var(--gh-bg-secondary)",
                    border: "1px solid var(--gh-border)",
                    borderRadius: 12,
                    padding: "8px 12px",
                  }}
                >
                  <div style={{ color: "var(--gh-text-secondary)", fontSize: 20, cursor: "pointer" }}>+</div>
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Message..." 
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      fontSize: 14,
                      padding: "8px 0",
                      color: "var(--gh-text)"
                    }}
                  />
                   <div style={{ display: "flex", gap: 12, color: "var(--gh-text-secondary)" }}>
                        <span style={{ cursor: "pointer" }}>☺</span>
                        <span style={{ cursor: "pointer" }}>@</span>
                        <button 
                          type="submit" 
                          style={{ 
                            background: "none", 
                            border: "none", 
                            cursor: inputValue.trim() ? "pointer" : "default", 
                            color: inputValue.trim() ? "var(--gh-primary)" : "var(--gh-text-secondary)",
                            fontWeight: 600
                          }}
                        >
                            Send
                        </button>
                   </div>
                </form>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--gh-text-secondary)" }}>
                 <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
                 <div style={{ fontSize: 18, fontWeight: 600, color: "var(--gh-text)" }}>No conversation selected</div>
                 <div style={{ fontSize: 14, marginTop: 8 }}>Choose a chat from the sidebar to start messaging.</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
