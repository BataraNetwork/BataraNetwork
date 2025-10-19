export interface GeneratedFile {
  name: string;
  content: string;
}

export type SecurityFindingSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';

export interface SecurityFinding {
  id: string;
  severity: SecurityFindingSeverity;
  description: string;
  recommendation: string;
  muted: boolean;
}

export interface ScanResult {
  id: number;
  scannedAt: string;
  fileName: string;
  findings: SecurityFinding[];
}

export interface NodeStatus {
  id: string;
  name: string;
  region: string;
  healthStatus: 'ok' | 'degraded' | 'unreachable';
  latestBlockHeight: number;
  pendingTransactions: number;
  uptime: number; // in seconds
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  dbSize: number; // in MB
  peers: number;
  networkIo: {
    ingress: number; // kbps
    egress: number; // kbps
  };
}

export interface Alert {
  id: string;
  nodeId: string;
  severity: 'critical' | 'warning';
  message: string;
  timestamp: number;
  status: 'active' | 'acknowledged';
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export type PipelineStatus = 'success' | 'running' | 'failed' | 'pending' | 'approval';

export interface PipelineStage {
  name: string;
  status: PipelineStatus;
  duration?: string;
}

export interface PipelineRun {
  id: number;
  triggeredAt: string;
  status: PipelineStatus;
  stages: PipelineStage[];
}
