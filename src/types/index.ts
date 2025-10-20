// --- DevOps & Security ---

export interface GeneratedFile {
  name: string;
  content: string;
}

export interface SecurityFinding {
  id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  description: string;
  recommendation: string;
  muted: boolean;
}

// --- Monitoring & Alerts ---

export interface NodeStatus {
  id: string;
  name: string;
  region: string;
  peers: number;
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
}

// Extended status from the actual node backend
export interface LiveNodeStatus {
    latestBlockHeight: number;
    pendingTransactions: number;
    validatorCount: number;
    totalStaked: number;
    activeProposals: number;
    // FIX: Add missing properties to match the backend response and resolve errors in useNodeStatus.ts.
    uptime: number;
    cpuUsage: number;
    memoryUsage: number;
}


export interface Alert {
  id: string;
  nodeId: string;
  severity: 'critical' | 'warning';
  message: string;
  timestamp: number;
  status: 'active' | 'resolved';
}

// --- Logging ---

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

// --- CI/CD Pipeline ---

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

// --- Governance, Staking & Contracts ---

export interface Proposal {
  id: string;
  title: string;
  proposer: string;
  status: 'active' | 'passed' | 'failed' | 'executed' | 'PENDING' | 'ACTIVE' | 'PASSED' | 'FAILED' | 'EXECUTED';
  description: string;
  votes: {
    yes: number;
    no: number;
    abstain: number;
  };
  endBlock: number;
  startBlock?: number;
}

export interface Vote {
  proposalId: string;
  voter: string;
  option: 'yes' | 'no' | 'abstain';
}

export interface Validator {
    address: string;
    name: string;
    stake: number;
    commission: number;
    uptime: number;
    status: 'active' | 'inactive';
}

export interface Contract {
    id: string;
    name: string;
    address: string;
    balance: number;
    methods: string[];
}

export interface ContractInteraction {
    id: number;
    contractId: string;
    method: string;
    params: any[];
    result: any;
    timestamp: string;
}


// --- Team & Auth ---

export type Permission = 
  // View permissions
  | 'view:monitoring' | 'view:alerts' | 'view:logs' | 'view:generator' | 'view:security' | 'view:pipeline' | 'view:governance' | 'view:staking' | 'view:contracts' | 'view:team' | 'view:api_keys' | 'view:audit_trail' | 'view:wallet'
  // Action permissions
  | 'action:generate' | 'action:scan' | 'action:acknowledge_alert' | 'action:trigger_pipeline' | 'action:approve_pipeline' | 'action:rollback_pipeline' | 'action:vote' | 'action:propose' | 'action:stake' | 'action:call_contract' | 'action:deploy_contract' | 'action:manage_api_keys' | 'action:send_btr'
  // Admin permissions
  | 'admin:manage_team';


export interface User {
  id: string;
  name: string;
  role: 'DevOps Engineer' | 'Developer' | 'Auditor' | 'Administrator';
  avatar: string;
  permissions: Set<Permission>;
  publicKey: string;
  privateKey: string;
}

// --- Wallet ---

export interface WalletTransaction {
  id: string;
  type: 'send' | 'receive';
  to: string;
  from: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
}

// --- API Keys ---

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsed: string | null;
  created: string;
  scopes: string[];
}

// --- Audit ---

export interface AuditEvent {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  details: Record<string, any>;
}