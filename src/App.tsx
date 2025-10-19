import React, { useState, useCallback } from 'react';
import { Header } from './components/ui/Header';
import { Tabs } from './components/ui/Tabs';
import { ConfigGenerator } from './components/features/generator/ConfigGenerator';
import { SecurityScanner } from './components/features/security/SecurityScanner';
import { MonitoringDashboard } from './components/features/monitoring/MonitoringDashboard';
import { PipelineView } from './components/features/pipeline/PipelineView';
import { AlertManager } from './components/features/alerts/AlertManager';
import { LogViewer } from './components/features/logs/LogViewer';
import { GovernanceView } from './components/features/governance/GovernanceView';
import { StakingView } from './components/features/staking/StakingView';
import { ContractView } from './components/features/contracts/ContractView';
import { useNodeStatus } from './hooks/useNodeStatus';
import { useMetricAnalysis } from './hooks/useMetricAnalysis';
import { GeneratedFile } from './types';

const TABS = [
  'Monitoring',
  'Alerts',
  'Logs',
  'Generator',
  'Security Scanner',
  'CI/CD Pipeline',
  'Governance',
  'Staking',
  'Smart Contracts',
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [initialScanContent, setInitialScanContent] = useState<string | null>(null);

  const { status, alerts, history, isLoading, error, availableNodes, activeNodeId, setActiveNodeId } = useNodeStatus();
  const { analysis, isAnalyzing } = useMetricAnalysis(history);

  const handleScanRequest = useCallback((files: GeneratedFile[]) => {
    // For simplicity, we'll scan the first file. A real app might handle multiple.
    if (files.length > 0) {
      setInitialScanContent(files[0].content);
      setActiveTab('Security Scanner');
    }
  }, []);
  
  const handleScanComplete = useCallback(() => {
    setInitialScanContent(null);
  }, []);

  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  
  const handleAcknowledge = (alertId: string) => {
      setAcknowledgedAlerts(prev => new Set(prev).add(alertId));
  };
  
  const activeAlerts = alerts.map(a => ({
      ...a,
      status: acknowledgedAlerts.has(a.id) ? 'acknowledged' : a.status
  }));

  const renderContent = () => {
    switch (activeTab) {
      case 'Monitoring':
        return <MonitoringDashboard 
                    status={status} 
                    alerts={activeAlerts.filter(a => a.nodeId === activeNodeId && a.status === 'active')}
                    history={history}
                    isLoading={isLoading}
                    error={error}
                    availableNodes={availableNodes}
                    activeNodeId={activeNodeId}
                    setActiveNodeId={setActiveNodeId}
                    analysis={analysis}
                    isAnalyzing={isAnalyzing}
                />;
      case 'Alerts':
        return <AlertManager alerts={activeAlerts} onAcknowledge={handleAcknowledge} nodes={availableNodes} />;
      case 'Logs':
        return <LogViewer />;
      case 'Generator':
        return <ConfigGenerator onScanRequest={handleScanRequest} />;
      case 'Security Scanner':
        return <SecurityScanner initialContent={initialScanContent} onScanComplete={handleScanComplete} />;
      case 'CI/CD Pipeline':
        return <PipelineView />;
      case 'Governance':
        return <GovernanceView latestBlockHeight={status?.latestBlockHeight || 0} />;
      case 'Staking':
        return <StakingView />;
      case 'Smart Contracts':
        return <ContractView />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen text-slate-300">
      <Header />
      <main className="container mx-auto px-4 md:px-8 py-8">
        <Tabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="mt-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
