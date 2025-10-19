import React, { useState } from 'react';
import { Header } from './components/ui/Header';
import { Tabs } from './components/ui/Tabs';
import { ConfigGenerator } from './components/features/generator/ConfigGenerator';
import { MonitoringDashboard } from './components/features/monitoring/MonitoringDashboard';
import { PipelineView } from './components/features/pipeline/PipelineView';
import { SecurityScanner } from './components/features/security/SecurityScanner';
import { LogViewer } from './components/features/logs/LogViewer';
import { GeneratedFile } from './types';

const TABS = ['Generator', 'Monitoring', 'CI/CD Pipeline', 'Security Scanner', 'Logs'];

function App() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  // State to manage the content passed from Generator to Scanner
  const [scanRequestContent, setScanRequestContent] = useState<string | null>(null);


  const handleScanRequest = (files: GeneratedFile[]) => {
    // Combine all generated files into a single string for the scanner
    const combinedContent = files
        .map(file => `--- # FILENAME: ${file.name}\n\n${file.content}`)
        .join('\n\n');
    
    setScanRequestContent(combinedContent);
    setActiveTab('Security Scanner');
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'Monitoring':
        return <MonitoringDashboard />;
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
