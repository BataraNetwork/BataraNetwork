// FIX: Implemented the Gemini service to proxy requests to the backend API endpoints.
// This resolves the "not a module" errors in hooks that import from this file.

import { GeneratedFile, SecurityFinding } from '../types';

interface GenerateOptions {
  prompt: string;
  includeHpa?: boolean;
}

/**
 * Calls the backend API to generate DevOps configuration files using AI.
 * @param options - The generation options including the prompt and other flags.
 * @returns A promise that resolves to an array of generated files.
 */
export const generateDevOpsConfig = async (options: GenerateOptions): Promise<GeneratedFile[]> => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
};

/**
 * Calls the backend API to analyze a configuration file for security vulnerabilities.
 * @param content - The string content of the configuration file.
 * @returns A promise that resolves to an array of security findings.
 */
export const analyzeConfiguration = async (content: string): Promise<SecurityFinding[]> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
};
