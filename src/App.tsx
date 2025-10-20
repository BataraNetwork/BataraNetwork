

import React, { useState, useCallback } from 'react';
import { Header } from './components/ui/Header';
import { Tabs } from './components/ui/Tabs';
import { MonitoringDashboard } from './components/features/monitoring/MonitoringDashboard';
import { LogViewer } from './components/features/logs/LogViewer';
import { ConfigGenerator } from './components/features/generator/ConfigGenerator';
import { SecurityScanner } from './components/features/security/SecurityScanner';
import { PipelineView } from './components/features/pipeline/PipelineView';
import { AlertManager } from './components/features/alerts/AlertManager';
import { ApiKeyManagerView } from './components/features/apikeys/ApiKeyManagerView';
import { TeamManagementView } from './components/features/team/TeamManagementView';
import { AuditTrailView } from './components/features/audit/AuditTrailView';
// FIX: Corrected the import path for AuditEvent and made it a named import.
import { AuditEvent } from './types';
import { useNodeStatus } from './hooks/useNodeStatus';
import { useMetricAnalysis } from './hooks/useMetricAnalysis';
import { useAuth } from './hooks/useAuth';
import { WalletView } from './components/features/wallet/WalletView';
import { StakingView } from './components/features/staking/StakingView';
import { GovernanceView } from './components/features/governance/GovernanceView';
// FIX: Corrected the import path for ContractView.
import { ContractView } from './components/features/contracts/ContractView';

const TABS = [
  'Monitoring',
  'Alerts',
  'Logs',
  'Wallet',
  'Staking',
  'Governance',
  'Contracts',
  'CI/CD Pipeline',
  'Config Generator',
  'Config Auditor',
  'API Keys',
  'Team Management',
  'Audit Trail',
];

type TabName = typeof TABS[number];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>(TABS[0]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const { status, alerts, history, isLoading, error, availableNodes, activeNodeId, setActiveNodeId } = useNodeStatus();
  const { analysis, isAnalyzing } = useMetricAnalysis(history);
  const { currentUser } = useAuth();

  const logAction = useCallback((action: string, details: Record<string, any>) => {
    const newEvent: AuditEvent = {
      id: auditEvents.length + 1,
      timestamp: new Date().toLocaleString(),
      user: currentUser.name,
      action,
      details,
    };
    setAuditEvents(prev => [newEvent, ...prev]);
  }, [auditEvents.length, currentUser.name]);
  
  const componentMap: Record<TabName, React.ReactNode> = {
    'Monitoring': <MonitoringDashboard status={status} alerts={alerts} history={history} isLoading={isLoading} error={error} availableNodes={availableNodes} activeNodeId={activeNodeId} setActiveNodeId={setActiveNodeId} analysis={analysis} isAnalyzing={isAnalyzing}/>,
    'Alerts': <AlertManager alerts={alerts} />,
    'Logs': <LogViewer />,
    'Wallet': <WalletView logAction={logAction} />,
    'Staking': <StakingView logAction={logAction} />,
    'Governance': <GovernanceView logAction={logAction} />,
    'Contracts': <ContractView logAction={logAction} />,
    'CI/CD Pipeline': <PipelineView />,
    'Config Generator': <ConfigGenerator />,
    'Config Auditor': <SecurityScanner />,
    'API Keys': <ApiKeyManagerView logAction={logAction} />,
    'Team Management': <TeamManagementView />,
    'Audit Trail': <AuditTrailView events={auditEvents} />,
  };
  
  const renderTabContent = () => {
    return componentMap[activeTab] || null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="mt-8">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default App;