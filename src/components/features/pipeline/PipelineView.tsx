import React from 'react';
import { usePipeline } from '../../../hooks/usePipeline';
import { useAuth } from '../../../hooks/useAuth';
import { CheckCircleIcon, XCircleIcon, SparklesIcon } from '../../ui/icons';
import { PipelineRun, PipelineStage } from '../../../types';

const getStatusStyles = (status: PipelineStage['status']) => {
    switch (status) {
        case 'success': return 'bg-green-500/20 text-green-400 border-green-500/50';
        case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/50';
        case 'running': return 'bg-sky-500/20 text-sky-400 border-sky-500/50 animate-pulse';
        case 'approval': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
        default: return 'bg-slate-700/50 text-slate-400 border-slate-600';
    }
};

const PipelineStageCard: React.FC<{ stage: PipelineStage }> = ({ stage }) => {
    return (
        <div className={`p-4 rounded-lg border-l-4 ${getStatusStyles(stage.status)}`}>
            <div className="flex justify-between items-center">
                <span className="font-semibold">{stage.name}</span>
                <span className="text-xs font-mono">{stage.duration ? `${stage.duration}s` : '...'}</span>
            </div>
        </div>
    );
};

const CurrentRun: React.FC<{ run: PipelineRun | null, onApprove: () => void, onReject: () => void }> = ({ run, onApprove, onReject }) => {
    const { currentUser } = useAuth();
    const canApprove = currentUser.permissions.has('action:approve_pipeline');

    if (!run) {
        return (
            <div className="text-center p-8 bg-slate-800/50 border border-slate-700 rounded-lg">
                <p className="text-slate-400">No pipeline is currently running.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white">Current Run #{run.id}</h3>
                    <p className="text-sm text-slate-400">Triggered by {run.triggeredBy} at {run.startTime}</p>
                </div>
                <div className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusStyles(run.status)}`}>
                    {run.status.toUpperCase()}
                </div>
            </div>
            <div className="space-y-3">
                {run.stages.map((stage, index) => <PipelineStageCard key={index} stage={stage} />)}
            </div>
            {run.status === 'approval' && (
                <div className="mt-6 p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg text-center">
                    <h4 className="font-bold text-yellow-300">Manual Approval Required</h4>
                    <p className="text-sm text-yellow-400 mb-4">The "Deploy to Production" stage requires manual approval to proceed.</p>
                    {canApprove ? (
                        <div className="flex justify-center gap-4">
                            <button onClick={onApprove} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                                <CheckCircleIcon /> Approve
                            </button>
                            <button onClick={onReject} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                                <XCircleIcon /> Reject
                            </button>
                        </div>
                    ) : (
                         <p className="text-sm text-yellow-500">Your role does not have permission to approve/reject stages.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export const PipelineView: React.FC = () => {
    const { currentRun, history, isRunning, runPipeline, approveStage, rejectStage } = usePipeline();
    const { currentUser } = useAuth();
    const canTrigger = currentUser.permissions.has('action:trigger_pipeline');

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">CI/CD Pipeline</h2>
                    <p className="text-slate-400">Automated build, test, and deployment pipeline for the Bataranetwork node.</p>
                </div>
                <button onClick={runPipeline} disabled={isRunning || !canTrigger} className="bg-sky-600 text-white font-semibold rounded-md px-6 py-3 hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2">
                    <SparklesIcon /> {isRunning ? 'Pipeline in Progress...' : 'Trigger New Run'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <CurrentRun run={currentRun} onApprove={approveStage} onReject={rejectStage} />
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Run History</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {history.length > 0 ? history.map(run => (
                                <div key={run.id} className={`p-3 rounded-lg border ${getStatusStyles(run.status)}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-sm">Run #{run.id}</span>
                                        <span className="text-xs font-mono">{run.status.toUpperCase()}</span>
                                    </div>
                                    <p className="text-xs text-slate-500">{run.startTime}</p>
                                </div>
                            )) : <p className="text-center text-slate-500 py-4">No previous runs.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
