import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/ui/Header';
import { Tabs } from './components/ui/Tabs';
import { ConfigGenerator } from './components/features/generator/ConfigGenerator';
import { MonitoringDashboard } from './components/features/monitoring/MonitoringDashboard';
import { PipelineView } from './components/features/pipeline/PipelineView';
import { SecurityScanner } from './components/features/security/SecurityScanner';
import { LogViewer } from './components/features/logs/LogViewer';
import { AlertManager } from './components/features/alerts/AlertManager';
import { GeneratedFile, Alert } from './types';
import { useNodeStatus } from './hooks/useNodeStatus';

const TABS = ['Generator', 'Monitoring', 'Alerts', 'CI/CD Pipeline', 'Security Scanner', 'Logs'];

function App() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [scanRequestContent, setScanRequestContent] = useState<string | null>(null);
  
  // Lift node status state to the root to share across components
  const nodeStatus = useNodeStatus();
  
  // FIX: Switched from Map to a plain object (Record) for storing alerts.
  // This resolves a subtle type inference issue with the spread operator on Map values inside useState setters.
  // State for all historical alerts, stored in an object to prevent duplicates
  const [allAlerts, setAllAlerts] = useState<Record<string, Alert>>({});

  // Effect to capture new alerts from the monitoring simulation and add them to the historical list
  useEffect(() => {
    if (nodeStatus.alerts.length > 0) {
      setAllAlerts(prevAlerts => {
        let newAlerts: Record<string, Alert> | null = null;
        nodeStatus.alerts.forEach((alert: Alert) => {
          if (!prevAlerts[alert.id]) {
            if (newAlerts === null) {
              newAlerts = { ...prevAlerts };
            }
            newAlerts[alert.id] = { ...alert, status: 'active' };
          }
        });
        return newAlerts || prevAlerts;
      });
    }
  }, [nodeStatus.alerts]);

  // Effect for auto-acknowledging alerts based on time or node health
  useEffect(() => {
    const autoAckInterval = setInterval(() => {
      setAllAlerts(currentAlerts => {
        const now = Date.now();
        const ONE_HOUR = 3600 * 1000;
        
        let updatedAlerts: Record<string, Alert> | null = null;

        for (const alertId in currentAlerts) {
          const alert = currentAlerts[alertId];
          if (alert.status === 'active') {
            // Condition 1: Alert is older than 1 hour
            const isStale = (now - alert.timestamp) > ONE_HOUR;

            // Condition 2: The node that triggered the alert is now healthy
            const node = nodeStatus.nodes ? nodeStatus.nodes[alert.nodeId] : null;
            const nodeIsHealthy = node && node.healthStatus === 'ok';

            if (isStale || nodeIsHealthy) {
              if (updatedAlerts === null) {
                updatedAlerts = { ...currentAlerts };
              }
              updatedAlerts[alertId] = { ...alert, status: 'acknowledged' };
            }
          }
        }
        return updatedAlerts || currentAlerts;
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(autoAckInterval);
  }, [nodeStatus.nodes]);
  
  const acknowledgeAlert = (alertId: string) => {
    setAllAlerts(prevAlerts => {
      const alertToUpdate = prevAlerts[alertId];
      if (alertToUpdate && alertToUpdate.status !== 'acknowledged') {
        return {
          ...prevAlerts,
          [alertId]: { ...alertToUpdate, status: 'acknowledged' },
        };
      }
      return prevAlerts;
    });
  };

  // FIX: Explicitly type the sort callback parameters `a` and `b` as `Alert`.
  // This resolves a TypeScript error where the compiler inferred them as `unknown`.
  const alertsArray = useMemo(() => Object.values(allAlerts).sort((a: Alert, b: Alert) => b.timestamp - a.timestamp), [allAlerts]);

  const handleScanRequest = (files: GeneratedFile[]) => {
    const combinedContent = files
      .map(file => `--- # FILENAME: ${file.name}\n\n${file.content}`)
      .join('\n\n');
    setScanRequestContent(combinedContent);
    setActiveTab('Security Scanner');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Monitoring':
        return <MonitoringDashboard {...nodeStatus} />;
      case 'Alerts':
        return <AlertManager alerts={alertsArray} onAcknowledge={acknowledgeAlert} nodes={nodeStatus.availableNodes} />;
      case 'CI/CD Pipeline':
        return <PipelineView />;
      case 'Security Scanner':
        return <SecurityScanner 
          initialContent={scanRequestContent} 
          onScanComplete={() => setScanRequestContent(null)} 
        />;
      case 'Logs':
        return <LogViewer />;
      case 'Generator':
      default:
        return <ConfigGenerator onScanRequest={handleScanRequest} />;
    }
  };

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 md:px-8 py-8">
        <Tabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="mt-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;