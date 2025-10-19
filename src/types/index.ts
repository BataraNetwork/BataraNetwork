export interface GeneratedFile {
  name: string;
  content: string;
}

export interface NodeStatus {
  id: string;
  name: string;
  region: string;
  latestBlockHeight: number;
  pendingTransactions: number;
  peers: number;
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  networkIo: {
    ingress: number; // kbps
    egress: number; // kbps
  };
  dbSize: number; // MB
  uptime: number; // in seconds
}

export type PipelineStatus = 'pending' | 'running' | 'success' | 'failed' | 'approval';

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


export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
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

export interface Alert {
    id: string;
    nodeId: string;
    severity: 'critical' | 'warning';
    message: string;
    timestamp: number;
}
