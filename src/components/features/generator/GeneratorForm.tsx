import React, { useState } from 'react';

interface GeneratorFormProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({ onGenerate, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  const quickPrompts = [
    "Generate a basic Dockerfile for the node service.",
    "Create a full CI/CD pipeline for GitHub Actions.",
    "Set up a Kubernetes deployment and service.",
    "I need a docker-compose file to run the node and Prometheus.",
  ];

  return (
    <div className="mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the DevOps setup you need..."
          className="flex-grow bg-slate-800 border border-slate-700 text-white rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-sky-600 text-white font-semibold rounded-md px-6 py-3 hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {quickPrompts.map((p) => (
            <button
                key={p}
                onClick={() => setPrompt(p)}
                className="text-xs bg-slate-700/50 text-slate-400 px-3 py-1 rounded-full hover:bg-slate-700 hover:text-slate-300 transition"
                disabled={isLoading}
            >
                {p}
            </button>
        ))}
      </div>
    </div>
  );
};
