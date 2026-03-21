import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';

export interface CodePreviewerProps {
  fileContent: string;
  language: string;
  fileName: string;
  repoId?: string;
}

export const CodePreviewer: React.FC<CodePreviewerProps> = ({
  fileContent,
  language,
  fileName,
  repoId,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '.' && repoId) {
        // Check if the user is currently focused on an input or textarea
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement)?.isContentEditable;

        if (!isInputFocused) {
          navigate(`/edit/${repoId}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, repoId]);

  return (
    <div className="w-full">
      <Editor
        height="calc(100vh - 50px)"
        theme="vs-dark"
        path={fileName}
        defaultLanguage={language}
        value={fileContent}
        options={{
          readOnly: true,
          domReadOnly: true,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontSize: 14,
        }}
        loading={
          <div className="flex h-[calc(100vh-50px)] w-full items-center justify-center bg-[#1e1e1e] text-white">
            <div className="flex flex-col items-center gap-4 animate-pulse">
              <span className="text-2xl font-bold tracking-wider text-blue-400">TrackCodex</span>
              <div className="h-1 w-24 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        }
      />
    </div>
  );
};
