import React from 'react';
import { useConfigGenerator } from '../../../hooks/useConfigGenerator';
import { GeneratorForm } from './GeneratorForm';
import { CodeBlock } from '../../ui/CodeBlock';
import { useApiKey } from '../../../hooks/useApiKey';
import { ApiKeyPrompt } from '../../ui/ApiKeyPrompt';
import { GeneratedFile } from '../../../types';
import { ShieldCheckIcon } from '../../ui/icons';

interface ConfigGeneratorProps {
  onScanRequest: (files: GeneratedFile[]) => void;
}

export const ConfigGenerator: React.FC<ConfigGeneratorProps> = ({ onScanRequest }) => {
  const { isApiKeyConfigured } = useApiKey();
  const { generate, generatedFiles, isLoading, error, hasGenerated } = useConfigGenerator();

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">AI-Powered DevOps Generator</h2>
      <p className="text-slate-400 mb-6">
        Describe your infrastructure needs, and our AI assistant will generate the necessary configuration files for your Bataranetwork node.
      </p>

      {!isApiKeyConfigured ? (
        <ApiKeyPrompt />
      ) : (
        <>
            <GeneratorForm onGenerate={generate} isLoading={isLoading} />
            
            {hasGenerated && !isLoading && generatedFiles.length > 0 && (
              <div className="my-6 flex justify-end">
                <button
                  onClick={() => onScanRequest(generatedFiles)}
                  className="bg-green-600/20 border border-green-500/50 text-green-400 font-semibold rounded-md px-6 py-3 hover:bg-green-500/30 hover:border-green-500/80 transition-colors flex items-center gap-2 shadow-md"
                >
                  <ShieldCheckIcon />
                  Scan Generated Files with AI
                </button>
              </div>
            )}
            
            {isLoading && (
            <div className="text-center p-8 bg-slate-800/50 border border-slate-700 rounded-lg">
                <div className="animate-pulse text-lg text-sky-400">Generating files, please wait...</div>
                <p className="text-slate-500 mt-2">The AI is crafting your configuration. This can sometimes take a few moments.</p>
            </div>
            )}
            
            {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg">
                <p className="font-bold">Generation Failed</p>
                <p className="text-sm">{error}</p>
            </div>
            )}
            
            {generatedFiles.length > 0 && !isLoading && (
            <div>
                <h3 className="text-xl font-semibold mb-4 text-white">Generated Files</h3>
                <CodeBlock files={generatedFiles} />
            </div>
            )}
        </>
      )}

    </div>
  );
};
