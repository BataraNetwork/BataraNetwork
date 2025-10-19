import React, { useState } from 'react';
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
import { AuthProvider } from './hooks/useAuth';

const TABS = [
  'Monitoring',
  'Alerts',
  'Logs',
  'Config Generator',
  'Security Scanner',
  'CI/CD Pipeline',
  'Staking',
  'Governance',
  'Smart Contracts',
  'Team Management',
  'API Keys',
  'Audit Trail',
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const nodeStatusHook = useNodeStatus();
  const metricAnalysisHook = useMetricAnalysis(nodeStatusHook.history);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Monitoring':
        return <MonitoringDashboard {...nodeStatusHook} {...metricAnalysisHook} />;
      case 'Alerts':
        return <AlertManager alerts={nodeStatusHook.alerts} />;
      case 'Logs':
        return <LogViewer />;
      case 'Config Generator':
        return <ConfigGenerator />;
      case 'Security Scanner':
        return <SecurityScanner />;
      case 'CI/CD Pipeline':
        return <PipelineView />;
      case 'Staking':
        return <StakingView />;
      case 'Governance':
        return <GovernanceView />;
      case 'Smart Contracts':
        return <ContractView />;
      case 'Team Management':
        return <TeamManagementView />;
      case 'API Keys':
        return <ApiKeyManagerView />;
       case 'Audit Trail':
        return <AuditTrailView />;
      default:
        return <MonitoringDashboard {...nodeStatusHook} {...metricAnalysisHook} />;
    }
  };

  return (
    <AuthProvider>
      <div className="bg-slate-900 text-slate-300 min-h-screen font-sans">
        <Header />
        <main className="container mx-auto px-4 md:px-8 py-6">
          <div className="mb-6">
            <Tabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          {renderActiveTab()}
        </main>
      </div>
    </AuthProvider>
  );
};

export default App;
