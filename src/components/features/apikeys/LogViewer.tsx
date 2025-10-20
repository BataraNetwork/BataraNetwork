import React, { useRef, useEffect, useState } from 'react';
import { useLogStream } from '../../../hooks/useLogStream';
import { LogEntry } from '../../../types';
import { PlayCircleIcon, PauseCircleIcon, FilterIcon, SparklesIcon } from '../../ui/icons';
import { analyzeLogs } from '../../../services/geminiService';

const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
        case 'error': return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/50' };
        case 'warn': return { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50' };
        case 'info': return { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/50' };
        case 'debug': return { text: 'text-slate-500', bg: 'bg-slate-700/20', border: 'border-slate-700' };
        default: return { text: 'text-slate-400', bg: 'bg-slate-700/20', border: 'border-slate-700' };
    }
}

const LOG_LEVELS: LogEntry['level'][] = ['error', 'warn', 'info', 'debug'];

export const LogViewer: React.FC = () => {
    const { logs, isRunning, setIsRunning, filterText, setFilterText, filterLevels, toggleLevel } = useLogStream();
    const logContainerRef = useRef<HTMLDivElement>(null);
    const shouldAutoScroll = useRef(true);

    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (shouldAutoScroll.current && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleScroll = () => {
        if (logContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
            shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 5;
        }
    };

    const handleAnalyze = async () => {
        if (logs.length === 0) return;
        setIsAnalysisModalOpen(true);
        setIsAnalyzing(true);
        setAnalysisResult('');
        try {
            const result = await analyzeLogs(logs);
            setAnalysisResult(result);
        } catch (error: any) {
            setAnalysisResult(`Failed to analyze logs: ${error.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) {
            return text;
        }
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} className="bg-yellow-500/30 font-bold">{part}</span>
                    ) : (
                        part
                    )
                )}
            </>
        );
    };
    
    const AnalysisModal = () => {
        if (!isAnalysisModalOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsAnalysisModalOpen(false)}>
                <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-4 border-b border-slate-700">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <SparklesIcon className="text-sky-400" />
                            AI Log Analysis
                        </h3>
                        <button onClick={() => setIsAnalysisModalOpen(false)} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {isAnalyzing ? (
                            <div className="text-center">
                                <p className="animate-pulse text-sky-400">AI is analyzing logs...</p>
                                <p className="text-sm text-slate-500 mt-2">This may take a moment for a large number of entries.</p>
                            </div>
                        ) : (
                            <pre className="whitespace-pre-wrap font-sans text-slate-300">{analysisResult}</pre>
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-700 text-right">
                        <button onClick={() => setIsAnalysisModalOpen(false)} className="bg-slate-700 text-white font-semibold rounded-md px-4 py-2 hover:bg-slate-600 transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            {isAnalysisModalOpen && <AnalysisModal />}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <div>
                    <h2 className="text-3xl font-bold text-white">Live Log Stream</h2>
                    <p className="text-slate-400">Enterprise-grade log viewer with real-time filtering and search.</p>
                </div>
                 <button onClick={() => setIsRunning(!isRunning)} className="flex items-center gap-2 text-lg font-semibold text-slate-300 hover:text-white transition">
                    {isRunning ? <PauseCircleIcon className="h-8 w-8 text-yellow-400" /> : <PlayCircleIcon className="h-8 w-8 text-green-400" />}
                    <span>{isRunning ? 'Pause Stream' : 'Resume Stream'}</span>
                 </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4 flex flex-col sm:flex-row gap-4 items-center">
                <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Search logs..."
                    className="flex-grow w-full sm:w-auto bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <div className="flex items-center gap-2 flex-wrap">
                    <FilterIcon className="text-slate-400" />
                    {LOG_LEVELS.map(level => (
                        <button
                            key={level}
                            onClick={() => toggleLevel(level)}
                            className={`text-xs px-3 py-1 rounded-full border transition ${filterLevels.has(level) ? `${getLogLevelColor(level).bg} ${getLogLevelColor(level).border} ${getLogLevelColor(level).text}` : 'bg-slate-700/50 border-slate-700 text-slate-400'}`}
                        >
                            {level.toUpperCase()}
                        </button>
                    ))}
                </div>
                <div className="w-full sm:w-auto sm:ml-auto">
                     <button onClick={handleAnalyze} disabled={logs.length === 0 || isAnalyzing}
                        className="w-full bg-sky-600/50 border border-sky-500/50 text-sky-300 font-semibold rounded-md px-4 py-2 hover:bg-sky-500/30 hover:border-sky-500/80 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                        <SparklesIcon />
                        Analyze Logs
                    </button>
                </div>
            </div>

            <div
                ref={logContainerRef}
                onScroll={handleScroll}
                className="bg-slate-900 font-mono text-sm border border-slate-700 rounded-lg h-[60vh] overflow-y-auto p-4"
            >
                {logs.length > 0 ? logs.slice().reverse().map((log, index) => (
                    <div key={index} className="flex hover:bg-slate-800/50">
                        <span className="text-slate-600 mr-4 flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className={`${getLogLevelColor(log.level).text} mr-4 uppercase w-12 flex-shrink-0`}>{`[${log.level}]`}</span>
                        <span className="text-slate-300 whitespace-pre-wrap">{highlightText(log.message, filterText)}</span>
                    </div>
                )) : (
                    <div className="text-center text-slate-500 h-full flex items-center justify-center">
                        <p>No log entries match your current filters. {isRunning ? '' : 'Press play to resume stream.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};