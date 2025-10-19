import { useState } from 'react';
import { GeneratedFile } from '../types';
import { generateDevOpsConfig } from '../services/geminiService';

export const useConfigGenerator = () => {
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generate = async (options: { prompt: string; includeHpa?: boolean }) => {
    setIsLoading(true);
    setError(null);
    setGeneratedFiles([]); // Clear previous results
    setHasGenerated(false);

    try {
      const files = await generateDevOpsConfig(options);
      setGeneratedFiles(files);
      if (files.length > 0) {
        setHasGenerated(true);
      }
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return { generate, generatedFiles, isLoading, error, hasGenerated };
};
