import React from "react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  imageSrc?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  imageSrc = "/notifications-empty.png"
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-center p-8 animate-in fade-in zoom-in-95 duration-700">
      <div className="w-full max-w-[700px] mb-10 overflow-hidden flex items-center justify-center relative group">
        <div className="absolute inset-0 bg-gradient-to-t from-gh-bg/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <img
          src={imageSrc}
          alt={title || "Empty state"}
          className="w-full h-auto object-contain mix-blend-multiply dark:mix-blend-lighten contrast-[1.05] brightness-[1.02] dark:brightness-[0.9] opacity-95 group-hover:scale-[1.05] transition-all duration-1000 ease-out"
        />
      </div>
      <div className="max-w-xl animate-in slide-in-from-bottom-4 delay-300 duration-700 fill-mode-both">
        {title && (
          <h2 className="text-[28px] font-black text-gh-text mb-3 tracking-tighter uppercase italic">
            {title}
          </h2>
        )}
        {message && (
          <p className="text-gh-text-secondary text-base leading-relaxed font-bold opacity-80">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
