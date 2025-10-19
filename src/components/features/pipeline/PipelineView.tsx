import React from 'react';
import { usePipeline } from '../../../hooks/usePipeline';
import { PipelineStage, PipelineStatus } from '../../../types';

const getStatusStyles = (status: PipelineStatus) => {
    switch (status) {
        case 'success':
            return { icon: '✅', color: 'text-green-400', bg: 'bg-green-500/10' };
        case 'running':
            return { icon: '⏳', color: 'text-yellow-400', bg: 'bg-yellow-500/10 animate-pulse' };
        case 'failed':
            return { icon: '❌', color: 'text-red-400', bg: 'bg-red-500/10' };
        case 'pending':
        default:
            return { icon: '⚪', color: 'text-slate-500', bg: 'bg-slate-800' };
    }
}

export const PipelineView: React.FC = () => {
    const { stages, overallStatus, lastRun, runPipeline } = usePipeline();
    const isRunning = overallStatus === 'running';

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white">CI/CD Pipeline</h2>
                    <p className="text-slate-400">Visualize the build, test, and deployment pipeline.</p>
                </div>
                <button
                    onClick={runPipeline}
                    disabled={isRunning}
                    className="bg-sky-600 text-white font-semibold rounded-md px-6 py-3 hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    {isRunning ? 'Running...' : 'Trigger Run'}
                </button>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="mb-4">
                    <p className="text-sm text-slate-400">Last Run: <span className="text-white">{lastRun}</span></p>
                    <p className="text-sm text-slate-400">Overall Status: <span className={`font-bold ${getStatusStyles(overallStatus).color}`}>{overallStatus.toUpperCase()}</span></p>
                </div>
                <div className="space-y-4">
                    {stages.map((stage) => {
                        const { icon, color, bg } = getStatusStyles(stage.status);
                        return (
                            <div key={stage.name} className={`flex items-center justify-between p-4 rounded-md ${bg}`}>
                                <div className="flex items-center">
                                    <span className="mr-4 text-xl">{icon}</span>
                                    <div>
                                        <p className={`font-semibold ${color}`}>{stage.name}</p>
                                        <p className={`text-sm ${color}`}>{stage.status}</p>
                                    </div>
                                </div>
                                {stage.duration && <p className="text-sm text-slate-400">{stage.duration}</p>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
