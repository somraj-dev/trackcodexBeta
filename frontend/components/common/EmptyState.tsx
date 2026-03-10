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
    <div className="flex flex-col items-center justify-center h-full w-full text-center p-8">
      <div className="w-full max-w-[360px] mb-6 flex items-center justify-center">
        <img
          src={imageSrc}
          alt={title || "Empty state"}
          className="w-full h-auto object-contain"
        />
      </div>
      <div className="max-w-md flex flex-col items-center">
        {title && (
          <h2 className="text-[20px] font-semibold text-[#c9d1d9] mb-2">
            {title}
          </h2>
        )}
        {displayDescription && (
          <p className="text-[#8b949e] text-[14px] leading-relaxed">
            {displayDescription}
          </p>
        )}

        {action && (
          <button
            onClick={action.onClick}
            className="mt-8 px-6 py-2.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded-md font-medium text-[14px] flex items-center gap-2 transition-colors border border-[#2ea043]"
          >
            {action.icon && (
              <span className="material-symbols-outlined !text-[18px]">
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


