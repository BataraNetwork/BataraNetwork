import React from 'react';
import { useConfigGenerator } from '../../../hooks/useConfigGenerator';
import { useAuth } from '../../../hooks/useAuth';
import { GeneratorForm } from './GeneratorForm';
import { CodeBlock } from '../../ui/CodeBlock';
import { ApiKeyPrompt } from '../../ui/ApiKeyPrompt';
import { useApiKey } from '../../../hooks/useApiKey';

export const ConfigGenerator: React.FC = () => {
  const {
    generatedFiles,
    isLoading,
    error,
    generate,
  } = useConfigGenerator();
  
  const { currentUser } = useAuth();
  const { isApiKeyConfigured } = useApiKey();
  const isActionAllowed = currentUser.permissions.has('action:generate');

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white">AI DevOps Config Generator</h2>
        <p className="text-slate-400">Generate production-ready configuration files for your Bataranetwork node.</p>
      </div>

      {!isApiKeyConfigured && <ApiKeyPrompt />}

      <GeneratorForm onGenerate={generate} isLoading={isLoading} isActionAllowed={isApiKeyConfigured && isActionAllowed} />
      
      {!isActionAllowed && isApiKeyConfigured && (
        <div className="p-4 mb-6 bg-yellow-500/10 text-yellow-400 border border-yellow-500/50 rounded-lg shadow-md" role="alert">
          <p className="text-sm">
            Your current role ('{currentUser.role}') does not have permission to generate configurations. Please contact an administrator.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="text-center p-8 text-slate-400 animate-pulse">
          Generating configuration, this may take a moment...
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/50 rounded-lg shadow-md">
          <p className="font-bold">Generation Failed</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {generatedFiles.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-white mb-4">Generated Output</h3>
          <CodeBlock files={generatedFiles} />
        </div>
      )}
    </div>
  );
};
