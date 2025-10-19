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
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuditEvent, Permission } from './types';

const ALL_TABS: { name: string; permission: Permission }[] = [
  { name: 'Monitoring', permission: 'view:monitoring' },
  { name: 'Alerts', permission: 'view:alerts' },
  { name: 'Logs', permission: 'view:logs' },
  { name: 'Config Generator', permission: 'view:generator' },
  { name: 'Security Scanner', permission: 'view:security' },
  { name: 'CI/CD Pipeline', permission: 'view:pipeline' },
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

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Monitoring':
        return <MonitoringDashboard {...nodeStatusHook} {...metricAnalysisHook} />;
      case 'Alerts':
        return <AlertManager alerts={nodeStatusHook.alerts} logAction={logAction} />;
      case 'Logs':
        return <LogViewer />;
      case 'Config Generator':
        return <ConfigGenerator logAction={logAction} />;
      case 'Security Scanner':
        return <SecurityScanner logAction={logAction} />;
      case 'CI/CD Pipeline':
        return <PipelineView logAction={logAction} />;
      case 'Staking':
        return <StakingView logAction={logAction} />;
      case 'Governance':
        return <GovernanceView logAction={logAction} />;
      case 'Smart Contracts':
        return <ContractView logAction={logAction} />;
      case 'Team Management':
        return <TeamManagementView />;
      case 'API Keys':
        return <ApiKeyManagerView logAction={logAction} />;
       case 'Audit Trail':
        return <AuditTrailView events={auditLog} />;
      default:
        return <MonitoringDashboard {...nodeStatusHook} {...metricAnalysisHook} />;
    }
  };

  return (
    <div className="bg-slate-900 text-slate-300 min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 md:px-8 py-6">
        <div className="mb-6">
          <Tabs tabs={visibleTabs.map(t => t.name)} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        {renderActiveTab()}
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