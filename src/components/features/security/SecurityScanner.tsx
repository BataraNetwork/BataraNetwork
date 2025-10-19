import React from 'react';
import { useSecurityScanner } from '../../../hooks/useSecurityScanner';
import { useApiKey } from '../../../hooks/useApiKey';
import { ApiKeyPrompt } from '../../ui/ApiKeyPrompt';

export const SecurityScanner: React.FC = () => {
    const { isApiKeyConfigured } = useApiKey();
    const { runScan, scanResults, isLoading, error, filesToScan } = useSecurityScanner();

    const hasResults = Object.keys(scanResults).length > 0;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-3xl font-bold text-white">Security Scanner</h2>
                    <p className="text-slate-400">Scan configuration and source code for potential vulnerabilities using AI.</p>
                </div>
                 <button
                    onClick={runScan}
                    disabled={isLoading || !isApiKeyConfigured}
                    className="bg-sky-600 text-white font-semibold rounded-md px-6 py-3 hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Scanning...' : 'Start Scan'}
                </button>
            </div>

             {!isApiKeyConfigured ? (
                <ApiKeyPrompt />
            ) : (
                <>
                {isLoading && (
                    <div className="text-center p-8 text-sky-400">
                        Scanning files for vulnerabilities...
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg">
                        <p className="font-bold">Scan Failed</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                
                {hasResults && !isLoading && (
                    <div className="space-y-6">
                        {filesToScan.map(file => (
                            <div key={file.name}>
                                <h3 className="text-xl font-semibold mb-2 text-white">{file.name}</h3>
                                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                                    <h4 className="font-bold text-sky-400 mb-2">AI Analysis:</h4>
                                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{scanResults[file.name] || 'No analysis available.'}</pre>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!hasResults && !isLoading && (
                    <div className="text-center p-8 border-2 border-dashed border-slate-700 rounded-lg">
                        <p className="text-slate-400">Click "Start Scan" to begin the security analysis.</p>
                    </div>
                )}
                </>
            )}

        </div>
    );
};
