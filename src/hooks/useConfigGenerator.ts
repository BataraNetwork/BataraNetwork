import { useState, useCallback } from 'react';
import { generateDevOpsConfig, GenerateOptions } from '../services/geminiService';
import { GeneratedFile } from '../types';
import {
  DOCKERFILE_CONTENT,
  DOCKER_COMPOSE_CONTENT,
  GITHUB_ACTIONS_CONTENT,
  KUBERNETES_CONTENT,
  HELM_CHART_CONTENT,
} from '../constants';

const MOCK_FILES: Record<string, GeneratedFile[]> = {
  'Dockerfile': [{ name: 'Dockerfile', content: DOCKERFILE_CONTENT }],
  'Docker Compose': [{ name: 'docker-compose.yml', content: DOCKER_COMPOSE_CONTENT }],
  'GitHub Actions': [{ name: '.github/workflows/ci.yml', content: GITHUB_ACTIONS_CONTENT }],
  'Kubernetes': [{ name: 'kubernetes.yaml', content: KUBERNETES_CONTENT }],
  'Helm Chart': HELM_CHART_CONTENT.split('---').map(part => {
      const match = part.match(/# FILENAME: (.*?)\n/);
      const name = match ? match[1].trim() : 'unknown.yaml';
      const content = part.replace(/# FILENAME: .*?\n/, '').trim();
      return { name, content };
    }).filter(f => f.name && f.content),
  'Prometheus': [{ name: 'prometheus.yml', content: 'scrape_configs:\n  - job_name: "bataranetwork"\n    static_configs:\n      - targets: ["localhost:9100"]' }],
};

export const useConfigGenerator = () => {
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (options: GenerateOptions) => {
    setIsLoading(true);
    setError(null);
    setGeneratedFiles([]);
    try {
      // Set a timeout for the API call
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI generation timed out. Please try again.")), 15000)
      );

      const files = await Promise.race([
        generateDevOpsConfig(options),
        timeoutPromise
      ]) as GeneratedFile[];

      setGeneratedFiles(files);
    } catch (e: any) {
      console.error("AI generation failed, falling back to mock data.", e);
      setError(`Live AI generation failed: ${e.message}. Displaying a default template instead.`);
      // Fallback to mock data on error
      setGeneratedFiles(MOCK_FILES[options.configType] || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generatedFiles, isLoading, error, generate };
};
