import React from "react";

interface EmptyStateProps {
  title?: string;
  message?: string; // Legacy support
  description?: string;
  imageSrc?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: string;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  description,
  imageSrc = "/notifications-empty.png",
  action
}) => {
  const displayDescription = description || message;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-center p-12 animate-in fade-in zoom-in-95 duration-700">
      <div className="w-full max-w-[850px] mb-12 overflow-hidden flex items-center justify-center relative group bg-gradient-to-b from-gh-bg-secondary/20 to-transparent rounded-[40px] border border-gh-border/10 p-16 shadow-2xl">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-[40px] blur-3xl" />
        <img
          src={imageSrc}
          alt={title || "Empty state"}
          className="w-full h-auto object-contain mix-blend-multiply dark:mix-blend-lighten contrast-[1.02] brightness-[1.05] dark:brightness-[0.95] opacity-95 group-hover:scale-[1.08] transition-all duration-1000 ease-out"
        />
      </div>
      <div className="max-w-xl animate-in slide-in-from-bottom-6 delay-300 duration-1000 fill-mode-both flex flex-col items-center">
        {title && (
          <h2 className="text-[32px] font-black text-transparent mb-4 tracking-tighter uppercase italic bg-gradient-to-r from-gh-text to-gh-text-secondary bg-clip-text">
            {title}
          </h2>
        )}
        {displayDescription && (
          <p className="text-gh-text-secondary text-lg leading-relaxed font-bold opacity-70 tracking-tight">
            {displayDescription}
          </p>
        )}

        {action && (
          <button
            onClick={action.onClick}
            className="mt-12 px-10 py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all shadow-2xl shadow-primary/30 active:scale-95 group/action border border-primary/20"
          >
            {action.icon && (
              <span className="material-symbols-outlined !text-[20px] group-hover/action:rotate-90 transition-transform">
                {action.icon}
              </span>
            )}
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
