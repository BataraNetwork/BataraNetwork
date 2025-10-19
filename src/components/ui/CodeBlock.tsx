import React, { useState } from 'react';
import { ClipboardIcon, CheckIcon } from './icons';
import { GeneratedFile } from '../../types';

interface CodeBlockProps {
  content?: string;
  title?: string;
  files?: GeneratedFile[];
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ content, title, files }) => {
  const [copied, setCopied] = useState(false);
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  // Multi-file mode
  if (files && files.length > 0) {
    const activeFile = files[activeFileIndex];

    const handleCopy = () => {
      if (activeFile) {
        navigator.clipboard.writeText(activeFile.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    const handleTabClick = (index: number) => {
      setActiveFileIndex(index);
      setCopied(false); // Reset copied state when changing files
    };

    return (
      <div className="bg-slate-800/50 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
        <div className="flex justify-between items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {files.map((file, index) => (
              <button
                key={file.name}
                onClick={() => handleTabClick(index)}
                className={`px-3 py-1 text-sm font-mono whitespace-nowrap rounded-md transition-colors ${
                  index === activeFileIndex
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'text-slate-400 hover:bg-slate-700'
                }`}
              >
                {file.name}
              </button>
            ))}
          </div>
          <button
            onClick={handleCopy}
            className="p-2 ml-4 bg-slate-700 rounded-md text-slate-400 hover:bg-slate-600 hover:text-white transition-colors flex-shrink-0"
            aria-label="Copy code from active file"
          >
            {copied ? <CheckIcon /> : <ClipboardIcon />}
          </button>
        </div>
        {activeFile && (
          <pre className="p-4 text-sm text-slate-300 overflow-x-auto font-mono">
            <code>{activeFile.content}</code>
          </pre>
        )}
      </div>
    );
  }

  // Single-file mode (original behavior)
  const handleCopy = () => {
    if(content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-sm font-semibold text-slate-400 font-mono">{title || 'Configuration File'}</span>
         <button
          onClick={handleCopy}
          className="p-2 bg-slate-700 rounded-md text-slate-400 hover:bg-slate-600 hover:text-white transition-colors"
          aria-label="Copy code"
        >
          {copied ? <CheckIcon /> : <ClipboardIcon />}
        </button>
      </div>
      <pre className="p-4 text-sm text-slate-300 overflow-x-auto font-mono">
        <code>{content}</code>
      </pre>
    </div>
  );
};