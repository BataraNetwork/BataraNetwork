export interface GeneratedFile {
  name: string;
  content: string;
}

export interface NodeStatus {
  latestBlockHeight: number;
  pendingTransactions: number;
  peers: number;
  version: string;
  uptime: number; // in seconds
}

export type PipelineStatus = 'pending' | 'running' | 'success' | 'failed';

export interface PipelineStage {
  name: string;
  status: PipelineStatus;
  duration?: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface SecurityIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  file: string;
  line: number;
}
