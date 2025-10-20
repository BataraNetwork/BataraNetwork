// FIX: Created the missing types/index.ts file and added all necessary type definitions.

// --- Generic & UI Types ---
export interface GeneratedFile {
  name: string;
  content: string;
}

// --- DevOps & Security Types ---
export interface SecurityFinding {
  id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  description: string;
  recommendation: string;
  muted: boolean;
}

// --- Monitoring & Logging ---
export interface Alert {
  id: string;
  severity: 'critical' | 'warning';
  message: string;
  nodeId: string;
  timestamp: number;
  status: 'active' | 'resolved';
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface NodeStatus {
  id: string;
  name: string;
  region: string;
  latestBlockHeight: number;
  pendingTransactions: number;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  networkIo: {
    ingress: number;
    egress: number;
  };
  dbSize: number;
  healthStatus: 'ok' | 'degraded' | 'unreachable';
  peers: number;
}


// --- CI/CD Pipeline Types ---
export interface PipelineStage {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'approval';
  duration?: number;
}

export interface PipelineRun {
  id: number;
  status: 'running' | 'success' | 'failed' | 'approval';
  triggeredBy: string;
  startTime: string;
  stages: PipelineStage[];
}

// --- User & Auth Types ---
export type Permission =
  | 'view:monitoring' | 'view:alerts' | 'view:logs' | 'view:generator' | 'view:security'
  | 'view:pipeline' | 'view:governance' | 'view:staking' | 'view:contracts' | 'view:team'
  | 'view:api_keys' | 'view:audit_trail' | 'view:wallet'
  | 'action:generate' | 'action:scan' | 'action:acknowledge_alert' | 'action:trigger_pipeline'
  | 'action:approve_pipeline' | 'action:rollback_pipeline' | 'action:vote' | 'action:propose'
  | 'action:stake' | 'action:send_btr' | 'action:call_contract' | 'action:deploy_contract'
  | 'action:manage_api_keys'
  | 'admin:manage_team';


export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
  permissions: Set<Permission>;
  publicKey: string;
  privateKey: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsed: string | null;
  created: string;
  scopes: string[];
}

export interface AuditEvent {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  details: Record<string, any>;
}

// --- Blockchain Specific Types ---

export interface Validator {
    address: string;
    name: string;
    stake: number;
    commission: number;
    uptime: number;
    status: 'active' | 'inactive';
}

export interface WalletTransaction {
    id: string;
    type: 'send' | 'receive';
    from: string;
    to: string;
    amount: number;
    status: 'completed' | 'pending';
    timestamp: string;
}

export interface Proposal {
    id: string;
    proposer: string;
    title: string;
    description: string;
    startBlock: number;
    endBlock: number;
    status: string; // PENDING, ACTIVE, PASSED, FAILED, EXECUTED
    votes: {
        yes: number;
        no: number;
        abstain: number;
    };
}

export interface Vote {
    proposalId: string;
    voter: string;
    option: 'yes' | 'no' | 'abstain';
}

export interface DeployedContract {
  id: string;
  from: string;
  code: string;
}

export type ContractState = Record<string, any>;
