import React, { useState } from 'react';
import { Header } from './components/ui/Header';
import { Tabs } from './components/ui/Tabs';
import { ConfigGenerator } from './components/features/generator/ConfigGenerator';
import { MonitoringDashboard } from './components/features/monitoring/MonitoringDashboard';
import { PipelineView } from './components/features/pipeline/PipelineView';
import { SecurityScanner } from './components/features/security/SecurityScanner';
import { LogViewer } from './components/features/logs/LogViewer';

const TABS = ['Generator', 'Monitoring', 'CI/CD Pipeline', 'Security', 'Logs'];

function App() {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Monitoring':
        return <MonitoringDashboard />;
      case 'CI/CD Pipeline':
        return <PipelineView />;
      case 'Security':
        return <SecurityScanner />;
      case 'Logs':
          return <LogViewer />;
      case 'Generator':
      default:
        return <ConfigGenerator />;
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
