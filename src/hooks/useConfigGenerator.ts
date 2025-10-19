import { useState } from 'react';
import { GeneratedFile } from '../types';
import { generateDevOpsConfig } from '../services/geminiService';

export const useConfigGenerator = () => {
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    setGeneratedFiles([]); // Clear previous results

    try {
      const files = await generateDevOpsConfig(prompt);
      setGeneratedFiles(files);
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return { generate, generatedFiles, isLoading, error };
};
