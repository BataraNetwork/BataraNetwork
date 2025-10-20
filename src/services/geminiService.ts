
import { GeneratedFile, SecurityFinding, Alert, LogEntry, NodeStatus } from '../types';

export interface GenerateOptions {
  prompt: string;
  configType: string;
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

/**
 * Calls the backend API to analyze and refactor a configuration file.
 * @param content - The string content of the configuration file to refactor.
 * @returns A promise that resolves to an object with an explanation and the refactored code.
 */
export const refactorConfiguration = async (content: string): Promise<{ explanation: string; refactoredCode: string }> => {
  const response = await fetch('/api/refactor', {
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


/**
 * Calls the backend API to generate an AI-powered remediation plan for an alert.
 * @param alert - The alert object to generate a plan for.
 * @returns A promise that resolves to the markdown string of the remediation plan.
 */
export const generateRemediationPlan = async (alert: Alert): Promise<string> => {
  const response = await fetch('/api/remediate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ alert }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.plan;
};


/**
 * Calls the backend API to analyze a set of log entries and return an AI-powered summary.
 * @param logs - An array of log entries to be analyzed.
 * @returns A promise that resolves to a markdown string containing the analysis.
 */
export const analyzeLogs = async (logs: LogEntry[]): Promise<string> => {
    const response = await fetch('/api/analyze-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logs }),
    });
  
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
  
    const data = await response.json();
    return data.analysis;
};

/**
 * Calls the backend API to analyze a time-series of metric data for anomalies.
 * @param history - An array of historical metric data points.
 * @returns A promise that resolves to a markdown string containing the anomaly analysis.
 */
export const analyzeMetrics = async (history: Omit<NodeStatus, 'id' | 'name' | 'region'>[]): Promise<string> => {
  const response = await fetch('/api/analyze-metrics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ history }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.analysis;
};
