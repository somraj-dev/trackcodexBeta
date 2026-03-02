import React from "react";

interface EmptyStateProps {
  title?: string;
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="h-[220px] overflow-hidden mb-6 flex items-start justify-center">
        <img
          src="/notifications-empty.png"
          alt="All caught up"
          className="max-w-[400px] w-full rounded-xl shadow-lg border border-white/5 opacity-90 group-hover:opacity-100 transition-opacity"
        />
      </div>
      {title && (
        <h2 className="text-[20px] font-semibold text-[#c9d1d9] mb-2">
          {title}
        </h2>
      )}
      {message && <p className="text-[#8b949e] max-w-md">{message}</p>}
    </div>
  );
};

export default EmptyState;
