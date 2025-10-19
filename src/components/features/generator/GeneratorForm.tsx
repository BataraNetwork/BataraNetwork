import React, { useState } from 'react';

const CONFIG_TYPES = [
  'Dockerfile',
  'Docker Compose',
  'GitHub Actions',
  'Kubernetes',
  'Helm Chart',
  'Prometheus'
] as const;

type ConfigType = typeof CONFIG_TYPES[number];

interface GeneratorFormProps {
  onGenerate: (options: { prompt: string; configType: ConfigType; includeHpa?: boolean }) => void;
  isLoading: boolean;
  isActionAllowed: boolean;
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({ onGenerate, isLoading, isActionAllowed }) => {
  const [prompt, setPrompt] = useState('');
  const [configType, setConfigType] = useState<ConfigType>(CONFIG_TYPES[0]);
  const [includeHpa, setIncludeHpa] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isActionAllowed) {
        onGenerate({ prompt, configType, includeHpa });
    }
  };

  const placeholderMap: Record<ConfigType, string> = {
    'Dockerfile': 'e.g., use a multi-stage build for a Node.js app...',
    'Docker Compose': 'e.g., add a redis service and a volume for data...',
    'GitHub Actions': 'e.g., add a step to deploy to GHCR on main branch push...',
    'Kubernetes': 'e.g., set replicas to 3 and add resource limits...',
    'Helm Chart': 'e.g., make the image tag a configurable value...',
    'Prometheus': 'e.g., add a scrape config for a new service at port 9091...',
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">Select Configuration Type:</label>
          <div className="flex flex-wrap gap-2">
            {CONFIG_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setConfigType(type)}
                className={`text-sm px-4 py-2 rounded-md border transition font-semibold ${
                  configType === type
                    ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                    : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                }`}
                disabled={isLoading || !isActionAllowed}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholderMap[configType] || "Add specific instructions..."}
            className="flex-grow bg-slate-800 border border-slate-600 text-white rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition disabled:opacity-50"
            disabled={isLoading || !isActionAllowed}
            />
            <button
            type="submit"
            className="bg-sky-600 text-white font-semibold rounded-md px-6 py-3 hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            disabled={isLoading || !isActionAllowed}
            title={!isActionAllowed ? 'Permission Denied' : 'Generate Configuration'}
            >
            {isLoading ? 'Generating...' : 'Generate with AI'}
            </button>
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
                disabled={isLoading || !isActionAllowed}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-600 focus:ring-sky-500 disabled:opacity-50"
            />
            <label htmlFor="includeHpa" className="ml-2 text-sm text-slate-400">
                Include Horizontal Pod Autoscaler (HPA) <span className="text-xs text-slate-500">(for Kubernetes/Helm)</span>
            </label>
        </div>
      </div>
    </div>
  );
};
