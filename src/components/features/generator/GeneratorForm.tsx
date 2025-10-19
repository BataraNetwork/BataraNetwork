import React, { useState } from 'react';
import { useConfigGenerator } from '../../../hooks/useConfigGenerator';

interface GeneratorFormProps {
  onGenerate: (options: { prompt: string; includeHpa?: boolean }) => void;
  isLoading: boolean;
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({ onGenerate, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [includeHpa, setIncludeHpa] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate({ prompt, includeHpa });
    }
  };

  const quickPrompts = [
    "Generate a basic Dockerfile for the node service.",
    "Create a full CI/CD pipeline for GitHub Actions.",
    "Set up a Kubernetes deployment and service.",
    "I need a full Helm Chart for deployment.",
  ];

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the DevOps setup you need..."
            className="flex-grow bg-slate-800 border border-slate-600 text-white rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            disabled={isLoading}
            />
            <button
            type="submit"
            className="bg-sky-600 text-white font-semibold rounded-md px-6 py-3 hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            disabled={isLoading || !prompt.trim()}
            >
            {isLoading ? 'Generating...' : 'Generate with AI'}
            </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 items-center">
            {quickPrompts.map((p) => (
                <button
                    key={p}
                    type="button"
                    onClick={() => setPrompt(p)}
                    className="text-xs bg-slate-700/50 text-slate-400 px-3 py-1 rounded-full hover:bg-slate-700 hover:text-slate-300 transition"
                    disabled={isLoading}
                >
                    {p}
                </button>
            ))}
        </div>
      </form>

      {/* Advanced Options */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <h4 className="text-md font-semibold text-white mb-2">Advanced Options</h4>
        <div className="flex items-center">
            <input
                type="checkbox"
                id="includeHpa"
                checked={includeHpa}
                onChange={(e) => setIncludeHpa(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="includeHpa" className="ml-2 text-sm text-slate-400">
                Include Horizontal Pod Autoscaler (HPA) <span className="text-xs text-slate-500">(for Kubernetes/Helm)</span>
            </label>
        </div>
      </div>
    </div>
  );
};
