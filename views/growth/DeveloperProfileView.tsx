import React, { useState } from "react";
import { ChatInterface } from "../../components/chat/ChatInterface";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const DeveloperProfileView = () => {
  const { id } = useParams();
  const [showChat, setShowChat] = useState(false);
  const { user: currentUser } = useAuth();

  return (
    <div className="p-8 text-gh-text max-w-4xl mx-auto">
      {/* ... existing header ... */}
      <div className="flex items-center gap-6 mb-8">
        <div className="size-24 rounded-full bg-gh-bg-secondary border-2 border-primary border-dashed flex items-center justify-center text-4xl font-bold">
          {id?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">Developer Profile</h1>
          <p className="text-xl text-gh-text-secondary">Viewing profile for user ID: <span className="text-primary font-mono">{id}</span></p>
        </div>
        <div>
          <button
            onClick={() => setShowChat(true)}
            className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <span className="material-symbols-outlined !text-[20px]">chat</span>
            Message
          </button>
        </div>
      </div>

      <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-8 text-center text-gh-text-secondary">
        <span className="material-symbols-outlined !text-6xl mb-4 opacity-50">construction</span>
        <h2 className="text-xl font-bold mb-2">Profile Under Construction</h2>
        <p>This user's full profile page is coming soon.</p>
      </div>

      <ChatInterface
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        targetUser={{
          id: id || "unknown",
          username: id || "Developer",
          avatar: `https://i.pravatar.cc/150?u=${id}`
        }}
        currentUser={{
          id: currentUser?.id || "guest",
          avatar: currentUser?.avatar || "/default-avatar.png"
        }}
      />
    </div>
  );
};

export default DeveloperProfileView;
