import React, { useState, useMemo, useCallback } from 'react';
import { Header } from './components/ui/Header';
import { Tabs } from './components/ui/Tabs';
import { MonitoringDashboard } from './components/features/monitoring/MonitoringDashboard';
import { ConfigGenerator } from './components/features/generator/ConfigGenerator';
import { SecurityScanner } from './components/features/security/SecurityScanner';
import { PipelineView } from './components/features/pipeline/PipelineView';
import { LogViewer } from './components/features/logs/LogViewer';
import { useNodeStatus } from './hooks/useNodeStatus';
import { useMetricAnalysis } from './hooks/useMetricAnalysis';
import { AlertManager } from './components/features/alerts/AlertManager';
import { GovernanceView } from './components/features/governance/GovernanceView';
import { StakingView } from './components/features/staking/StakingView';
import { ContractView } from './components/features/contracts/ContractView';
import { TeamManagementView } from './components/features/team/TeamManagementView';
import { ApiKeyManagerView } from './components/features/apikeys/ApiKeyManagerView';
import { AuditTrailView } from './components/features/audit/AuditTrailView';
import { WalletView } from './components/features/wallet/WalletView';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuditEvent, Permission } from './types';

const ALL_TABS: { name: string; permission: Permission }[] = [
  { name: 'Monitoring', permission: 'view:monitoring' },
  { name: 'Alerts', permission: 'view:alerts' },
  { name: 'Logs', permission: 'view:logs' },
  { name: 'Config Generator', permission: 'view:generator' },
  { name: 'Security Scanner', permission: 'view:security' },
  { name: 'CI/CD Pipeline', permission: 'view:pipeline' },
  { name: 'Wallet', permission: 'view:wallet' },
  { name: 'Staking', permission: 'view:staking' },
  { name: 'Governance', permission: 'view:governance' },
  { name: 'Smart Contracts', permission: 'view:contracts' },
  { name: 'Team Management', permission: 'view:team' },
  { name: 'API Keys', permission: 'view:api_keys' },
  { name: 'Audit Trail', permission: 'view:audit_trail' },
];

const AppContent: React.FC = () => {
  const { hasPermission, currentUser } = useAuth();
  
  const visibleTabs = useMemo(() => ALL_TABS.filter(tab => hasPermission(tab.permission)), [hasPermission]);
  
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.name || 'Monitoring');
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);

  const nodeStatusHook = useNodeStatus();
  const metricAnalysisHook = useMetricAnalysis(nodeStatusHook.history);
  
  const logAction = useCallback((action: string, details: Record<string, any>) => {
    const newEvent: AuditEvent = {
      id: crypto.randomUUID(),
      user: currentUser.name,
      action,
      timestamp: new Date().toLocaleString(),
      details,
    };
    setAuditLog(prev => [newEvent, ...prev]);
  }, [currentUser.name]);

  const renderActiveTabContent = () => {
    const componentMap: Record<string, React.ReactNode> = {
      'Monitoring': <MonitoringDashboard {...nodeStatusHook} {...metricAnalysisHook} />,
      'Alerts': <AlertManager alerts={nodeStatusHook.alerts} />,
      'Logs': <LogViewer />,
      'Config Generator': <ConfigGenerator />,
      'Security Scanner': <SecurityScanner />,
      'CI/CD Pipeline': <PipelineView />,
      'Wallet': <WalletView logAction={logAction} />,
      'Staking': <StakingView logAction={logAction} />,
      'Governance': <GovernanceView logAction={logAction} />,
      'Smart Contracts': <ContractView logAction={logAction} />,
      'Team Management': <TeamManagementView />,
      'API Keys': <ApiKeyManagerView logAction={logAction} />,
      'Audit Trail': <AuditTrailView events={auditLog} />,
    };

    return componentMap[activeTab] || componentMap['Monitoring'];
  };

  return (
    <div className="bg-slate-900 text-slate-300 min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 md:px-8 py-6">
        <div className="mb-6">
          <Tabs tabs={visibleTabs.map(t => t.name)} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        {renderActiveTabContent()}
      </main>
    </div>
  );
}


const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;