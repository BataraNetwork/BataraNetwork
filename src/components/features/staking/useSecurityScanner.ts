import { useState, useCallback } from 'react';
import { analyzeConfiguration } from '../services/geminiService';
import { SecurityFinding } from '../types';

const MOCK_FINDINGS: SecurityFinding[] = [
  {
    id: 'mock-1',
    severity: 'High',
    description: 'The Docker image is running as the root user.',
    recommendation: 'Create a dedicated user and group in the Dockerfile. Use the USER instruction to switch to this non-root user before running the application.',
    muted: false,
  },
  {
    id: 'mock-2',
    severity: 'Medium',
    description: 'No health check is defined for the container.',
    recommendation: 'Add a HEALTHCHECK instruction to the Dockerfile to ensure the container is functioning correctly before it receives traffic.',
    muted: false,
  }
];


export const useSecurityScanner = () => {
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async (content: string) => {
    if (!content.trim()) {
        setFindings([]);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const results = await analyzeConfiguration(content);
      setFindings(results);
    } catch (e: any) {
      console.error("AI security scan failed, falling back to mock data.", e);
      setError(`Live AI analysis failed: ${e.message}. Displaying mock findings instead.`);
      setFindings(MOCK_FINDINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const toggleMute = useCallback((id: string) => {
    setFindings(prev => 
      prev.map(f => f.id === id ? { ...f, muted: !f.muted } : f)
    );
  }, []);

  return { findings, isLoading, error, scan, toggleMute };
};
