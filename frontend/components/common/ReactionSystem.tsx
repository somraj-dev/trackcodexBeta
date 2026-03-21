import React, { useState } from "react";

export const REACTION_EMOJIS = ["👍", "👎", "😄", "🎉", "❤️", "🚀", "👀"];

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-gh-text-secondary hover:text-primary p-1 rounded transition-colors"
        title="Add reaction"
      >
        <span className="material-symbols-outlined !text-[20px]">add_reaction</span>
      </button>
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 bg-gh-bg-secondary border border-gh-border rounded-lg shadow-xl p-2 flex gap-1 z-30 animate-in fade-in slide-in-from-bottom-2">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji);
                setIsOpen(false);
              }}
              className="p-2 hover:bg-gh-bg-tertiary rounded transition-colors text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface ReactionListProps {
  reactions: Reaction[];
  onToggle: (emoji: string) => void;
}

export const ReactionList: React.FC<ReactionListProps> = ({
  reactions,
  onToggle,
}) => {
  if (!reactions || reactions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => onToggle(r.emoji)}
          className={`px-2 py-0.5 rounded-full border text-xs flex items-center gap-1.5 transition-all ${
            r.count > 0
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-gh-bg border-gh-border text-gh-text-secondary"
          } hover:border-primary/50`}
        >
          <span>{r.emoji}</span>
          <span className="font-bold">{r.count}</span>
        </button>
      ))}
    </div>
  );
};
