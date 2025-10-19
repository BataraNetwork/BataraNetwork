import React, { useState } from 'react';
import { useSecurityScanner } from '../../../hooks/useSecurityScanner';
import { useAuth } from '../../../hooks/useAuth';
import { SecurityFinding } from '../../../types';
import { BellIcon, SparklesIcon } from '../../ui/icons';
import { ApiKeyPrompt } from '../../ui/ApiKeyPrompt';
import { useApiKey } from '../../../hooks/useApiKey';

const getSeverityStyles = (severity: SecurityFinding['severity']) => {
    switch (severity) {
        case 'Critical': return 'bg-red-500/10 text-red-400 border-red-500/50';
        case 'High': return 'bg-orange-500/10 text-orange-400 border-orange-500/50';
        case 'Medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50';
        case 'Low': return 'bg-sky-500/10 text-sky-400 border-sky-500/50';
        default: return 'bg-slate-700/50 text-slate-400 border-slate-600';
    }
};

const FindingCard: React.FC<{ finding: SecurityFinding, onMute: (id: string) => void }> = ({ finding, onMute }) => {
    return (
        <div className={`p-4 rounded-lg border-l-4 transition-opacity ${getSeverityStyles(finding.severity)} ${finding.muted ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className={`font-bold`}>{finding.severity}</p>
                    <p className="text-slate-300 text-sm mt-1">{finding.description}</p>
                </div>
                <button onClick={() => onMute(finding.id)} className="text-xs text-slate-400 hover:text-white ml-4 flex-shrink-0">
                    {finding.muted ? 'Unmute' : 'Mute'}
                </button>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50">
                <p className="text-xs font-semibold text-slate-400 mb-1">Recommendation</p>
                <p className="text-xs text-slate-300 font-mono bg-slate-800/50 p-2 rounded">{finding.recommendation}</p>
            </div>
        </div>
    );
};


export const SecurityScanner: React.FC = () => {
    const [content, setContent] = useState('');
    const { findings, isLoading, error, scan, toggleMute } = useSecurityScanner();
    const { currentUser } = useAuth();
    const { isApiKeyConfigured } = useApiKey();
    const isActionAllowed = currentUser.permissions.has('action:scan');

    const handleScan = () => {
        if (isActionAllowed) {
            scan(content);
        }
    };
    
    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white">DevSecOps Security Scanner</h2>
                <p className="text-slate-400">Paste any configuration file (Dockerfile, Kubernetes YAML, etc.) to analyze it for vulnerabilities.</p>
            </div>
            
            {!isApiKeyConfigured && <ApiKeyPrompt />}

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-8">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your configuration content here..."
                    className="w-full h-48 bg-slate-800 border border-slate-600 rounded-md p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 transition disabled:opacity-50"
                    disabled={isLoading || !isActionAllowed}
                />
                <div className="flex justify-end mt-4">
                    <button onClick={handleScan} disabled={isLoading || !content.trim() || !isActionAllowed}
                        className="bg-sky-600 text-white font-semibold rounded-md px-6 py-3 hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2">
                        <SparklesIcon /> {isLoading ? 'Scanning...' : 'Scan with AI'}
                    </button>
                </div>
            </div>
            
            {!isActionAllowed && isApiKeyConfigured && (
                 <div className="p-4 mb-6 bg-yellow-500/10 text-yellow-400 border border-yellow-500/50 rounded-lg shadow-md" role="alert">
                    <p className="text-sm">
                        Your current role ('{currentUser.role}') does not have permission to run security scans.
                    </p>
                </div>
            )}

            {error && <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/50 rounded-lg shadow-md mb-6">{error}</div>}
            
            <div>
                 <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <BellIcon className="text-yellow-400"/>
                    Findings ({findings.filter(f => !f.muted).length})
                </h3>
                {findings.length > 0 ? (
                    <div className="space-y-4">
                        {findings.map(f => <FindingCard key={f.id} finding={f} onMute={toggleMute} />)}
                    </div>
                ) : (
                    <div className="text-center p-8 bg-slate-800/50 border border-slate-700 rounded-lg">
                        <p className="text-slate-400">{isLoading ? 'Analyzing...' : 'No findings detected. Run a scan to check for vulnerabilities.'}</p>
                    </div>
                )}
            </div>

        </div>
    );
};
