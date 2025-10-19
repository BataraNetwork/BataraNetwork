import React, { useState, useEffect, useMemo } from 'react';
import { useSecurityScanner } from '../../../hooks/useSecurityScanner';
import { useApiKey } from '../../../hooks/useApiKey';
import { ApiKeyPrompt } from '../../ui/ApiKeyPrompt';
import { SecurityFinding, SecurityFindingSeverity } from '../../../types';
import { ShieldCheckIcon, UploadCloudIcon, CircleSlashIcon, HistoryIcon } from '../../ui/icons';

const SEVERITIES: SecurityFindingSeverity[] = ['Critical', 'High', 'Medium', 'Low', 'Informational'];

const getSeverityStyles = (severity: SecurityFinding['severity']) => {
  switch (severity) {
    case 'Critical':
      return { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-400' };
    case 'High':
      return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', text: 'text-yellow-400' };
    case 'Medium':
      return { bg: 'bg-sky-500/10', border: 'border-sky-500/50', text: 'text-sky-400' };
    case 'Low':
    case 'Informational':
    default:
      return { bg: 'bg-slate-700/20', border: 'border-slate-700', text: 'text-slate-400' };
  }
};

const FindingCard: React.FC<{ finding: SecurityFinding; onMute: (id: string) => void; }> = ({ finding, onMute }) => {
  const styles = getSeverityStyles(finding.severity);
  return (
    <div className={`border rounded-lg p-4 transition-opacity ${styles.border} ${finding.muted ? 'opacity-50' : 'opacity-100'} ${styles.bg}`}>
      <div className="flex justify-between items-start">
        <h4 className={`font-bold ${styles.text}`}>{finding.severity}</h4>
        <button onClick={() => onMute(finding.id)} className="text-slate-500 hover:text-white" title={finding.muted ? 'Unmute Finding' : 'Mute Finding'}>
            <CircleSlashIcon />
        </button>
      </div>
      <p className={`text-slate-300 mt-2 text-sm ${finding.muted ? 'line-through' : ''}`}>{finding.description}</p>
      <div className="mt-3 pt-3 border-t border-slate-700/50">
          <p className="text-xs font-semibold text-slate-400 mb-1">Recommendation:</p>
          <p className="text-slate-400 text-xs font-mono">{finding.recommendation}</p>
      </div>
    </div>
  );
};

interface SecurityScannerProps {
    initialContent?: string | null;
    onScanComplete?: () => void;
}

export const SecurityScanner: React.FC<SecurityScannerProps> = ({ initialContent, onScanComplete }) => {
    const { isApiKeyConfigured } = useApiKey();
    // FIX: Destructure `setCurrentScan` from the hook to allow setting the current scan from history.
    const { scanContent, currentScan, setCurrentScan, history, isLoading, error, toggleMuteFinding } = useSecurityScanner();
    const [contentToScan, setContentToScan] = useState('');
    const [fileName, setFileName] = useState('pasted_content.txt');
    const [isDragging, setIsDragging] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Set<SecurityFindingSeverity>>(new Set(SEVERITIES));

    const filteredFindings = useMemo(() => {
        if (!currentScan) return [];
        return currentScan.findings.filter(f => activeFilters.has(f.severity));
    }, [currentScan, activeFilters]);

    useEffect(() => {
        if (initialContent) {
            setContentToScan(initialContent);
            setFileName('generated_config.txt');
            scanContent(initialContent, 'generated_config.txt');
            if(onScanComplete) onScanComplete();
        }
    }, [initialContent, scanContent, onScanComplete]);

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setContentToScan(text);
            setFileName(file.name);
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };
    
    const toggleFilter = (severity: SecurityFindingSeverity) => {
        setActiveFilters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(severity)) {
                newSet.delete(severity);
            } else {
                newSet.add(severity);
            }
            return newSet;
        });
    };

    return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Input & History */}
        <div className="lg:col-span-1 flex flex-col gap-8">
             <div>
                <h2 className="text-3xl font-bold text-white">AI Security Scanner</h2>
                <p className="text-slate-400 mt-2">Analyze any configuration file for vulnerabilities with an enterprise-grade scanner.</p>
            </div>
             {!isApiKeyConfigured ? <ApiKeyPrompt /> : (
                <div 
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleDrop}
                    className={`relative bg-slate-800/50 border rounded-lg p-4 ${isDragging ? 'border-sky-500' : 'border-slate-700'}`}
                >
                     <div className={`absolute inset-0 bg-sky-500/10 rounded-lg transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0'}`}></div>
                     <div className="flex flex-col gap-4">
                        <div className="text-center p-4 border-2 border-dashed border-slate-600 rounded-lg">
                            <UploadCloudIcon className="mx-auto h-8 w-8 text-slate-500" />
                            <p className="mt-2 text-sm text-slate-400">Drag & drop a file or <label htmlFor="file-upload" className="text-sky-400 cursor-pointer hover:underline">browse</label>.</p>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
                        </div>
                        <textarea value={contentToScan} onChange={(e) => setContentToScan(e.target.value)} placeholder="Or paste your configuration content here..."
                            className="w-full h-48 bg-slate-800 border border-slate-600 text-slate-300 rounded-md p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <button onClick={() => scanContent(contentToScan, fileName)} disabled={isLoading || !contentToScan.trim()}
                            className="bg-sky-600 text-white font-semibold rounded-md px-6 py-3 self-start hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2">
                            <ShieldCheckIcon /> {isLoading ? 'Scanning...' : 'Analyze Content'}
                        </button>
                    </div>
                </div>
            )}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <HistoryIcon className="text-slate-400" />
                    <h3 className="text-xl font-bold text-white">Scan History</h3>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3 max-h-72 overflow-y-auto">
                    {history.map(scan => (
                        <div key={scan.id} className="bg-slate-800 p-3 rounded cursor-pointer hover:bg-slate-700" onClick={() => setCurrentScan(scan)}>
                            <p className="font-semibold truncate">{scan.fileName}</p>
                            <p className="text-xs text-slate-400">{scan.scannedAt}</p>
                            <p className="text-sm">{scan.findings.length} findings</p>
                        </div>
                    ))}
                    {history.length === 0 && <p className="text-slate-500 text-center py-4">No past scans.</p>}
                </div>
            </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-2">
            {isLoading && <div className="text-center p-8 text-sky-400">Analyzing content for vulnerabilities...</div>}
            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg"><p className="font-bold">Analysis Failed</p><p className="text-sm">{error}</p></div>}
            
            {currentScan && !isLoading && (
                <div>
                    <h3 className="text-2xl font-bold text-white mb-4">Analysis Results for <span className="text-sky-400">{currentScan.fileName}</span></h3>
                    <div className="flex flex-wrap gap-2 mb-4 items-center">
                        <p className="text-sm text-slate-400 mr-2">Filter by severity:</p>
                        {SEVERITIES.map(sev => (
                            <button key={sev} onClick={() => toggleFilter(sev)} className={`text-xs px-3 py-1 rounded-full border transition ${activeFilters.has(sev) ? getSeverityStyles(sev).bg + ' ' + getSeverityStyles(sev).border + ' ' + getSeverityStyles(sev).text : 'bg-slate-700/50 border-slate-700 text-slate-400'}`}>
                                {sev}
                            </button>
                        ))}
                    </div>
                    {filteredFindings.length === 0 ? (
                        <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-lg text-center">
                            <p>No security issues found matching your filters.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredFindings.map((finding) => <FindingCard key={finding.id} finding={finding} onMute={toggleMuteFinding} />)}
                        </div>
                    )}
                </div>
            )}
             {!currentScan && !isLoading && !error && (
                 <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center h-full flex flex-col justify-center">
                    <p className="text-slate-400">Scan results will appear here.</p>
                    <p className="text-sm text-slate-500">Upload or paste a file and click "Analyze Content" to begin.</p>
                </div>
             )}
        </div>
    </div>
    );
};
