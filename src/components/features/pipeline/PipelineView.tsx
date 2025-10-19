import React from 'react';
import { usePipeline } from '../../../hooks/usePipeline';
import { PipelineRun, PipelineStage, PipelineStatus } from '../../../types';
import { 
    HistoryIcon, 
    GitBranchIcon, 
    PackageIcon, 
    BeakerIcon, 
    LayersIcon, 
    UploadCloudIcon, 
    UserCheckIcon, 
    RocketIcon 
} from '../../ui/icons';

const getStatusStyles = (status: PipelineStatus) => {
    switch (status) {
        case 'success':
            return { icon: '✓', color: 'text-green-400', bg: 'bg-green-500' };
        case 'running':
            return { icon: '...', color: 'text-yellow-400', bg: 'bg-yellow-500 animate-pulse' };
        case 'failed':
            return { icon: '✗', color: 'text-red-400', bg: 'bg-red-500' };
        case 'approval':
             return { icon: '?', color: 'text-sky-400', bg: 'bg-sky-500' };
        case 'pending':
        default:
            return { icon: '', color: 'text-slate-500', bg: 'bg-slate-600' };
    }
}

const STAGE_ICONS: Record<string, React.FC<{className?: string}>> = {
    'Checkout': GitBranchIcon,
    'Install Dependencies': PackageIcon,
    'Lint & Test': BeakerIcon,
    'Build Image': LayersIcon,
    'Push to Registry': UploadCloudIcon,
    'Manual Approval (Staging)': UserCheckIcon,
    'Deploy to Production': RocketIcon,
};


const StageCard: React.FC<{ stage: PipelineStage; onApprove?: () => void; onReject?: () => void; }> = ({ stage, onApprove, onReject }) => {
    const { color } = getStatusStyles(stage.status);
    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 w-full">
            <div className="flex justify-between items-center">
                <p className={`font-semibold ${color}`}>{stage.name}</p>
                {stage.duration && <p className="text-sm text-slate-400">{stage.duration}</p>}
            </div>
            <p className={`text-sm capitalize ${color}`}>{stage.status}</p>
            {stage.status === 'approval' && (
                 <div className="mt-3 pt-3 border-t border-slate-700 flex gap-2">
                    <button onClick={onApprove} className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded hover:bg-green-500/30">Approve</button>
                    <button onClick={onReject} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded hover:bg-red-500/30">Reject</button>
                </div>
            )}
        </div>
    );
};

export const PipelineView: React.FC = () => {
    const { currentRun, history, isRunning, runPipeline, approveStage, rejectStage, rollback } = usePipeline();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Controls & History */}
            <div className="lg:col-span-1">
                 <h2 className="text-3xl font-bold text-white">CI/CD Pipeline</h2>
                 <p className="text-slate-400 mb-6">Enterprise-grade deployment pipeline with approvals and history.</p>
                <button
                    onClick={runPipeline}
                    disabled={isRunning}
                    className="w-full bg-sky-600 text-white font-semibold rounded-md px-6 py-3 hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    {isRunning ? 'Pipeline Running...' : 'Trigger New Deployment'}
                </button>
                
                <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4">
                        <HistoryIcon className="text-slate-400" />
                        <h3 className="text-xl font-bold text-white">Deployment History</h3>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                        {history.map(run => (
                            <div key={run.id} className="bg-slate-800 p-3 rounded">
                                <p className="font-semibold">Run #{run.id}</p>
                                <p className="text-xs text-slate-400">{run.triggeredAt}</p>
                                <p className={`text-sm capitalize font-bold ${getStatusStyles(run.status).color}`}>{run.status}</p>
                            </div>
                        ))}
                         {history.length === 0 && <p className="text-slate-500 text-center py-4">No past deployments.</p>}
                    </div>
                </div>
            </div>

            {/* Right Column: Current Pipeline View */}
            <div className="lg:col-span-2">
                {!currentRun ? (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center h-full flex flex-col justify-center">
                        <p className="text-slate-400">No pipeline is currently running.</p>
                        <p className="text-sm text-slate-500">Trigger a new deployment to see the stages here.</p>
                    </div>
                ) : (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 sm:p-8">
                        <div className="mb-6">
                            <p className="text-sm text-slate-400">Current Run: <span className="text-white font-semibold">#{currentRun.id}</span> ({currentRun.triggeredAt})</p>
                            <p className="text-sm text-slate-400">Overall Status: <span className={`font-bold capitalize ${getStatusStyles(currentRun.status).color}`}>{currentRun.status}</span></p>
                             {currentRun.status === 'success' && (
                                <button onClick={() => rollback(currentRun.id)} className="mt-2 text-sm bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded hover:bg-yellow-500/30">
                                    Rollback to Previous Version
                                </button>
                            )}
                        </div>
                        
                        {/* Vertical Timeline */}
                        <div className="flex flex-col">
                            {currentRun.stages.map((stage, index) => {
                                const { bg, color } = getStatusStyles(stage.status);
                                const isLastStage = index === currentRun.stages.length - 1;
                                const IconComponent = STAGE_ICONS[stage.name] || LayersIcon;

                                return (
                                    <div key={stage.name} className="flex items-start">
                                        <div className="flex flex-col items-center mr-4 sm:mr-6">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white z-10 ${bg}`}>
                                                <IconComponent className={`h-6 w-6 ${stage.status === 'pending' ? 'text-slate-400' : 'text-white'}`} />
                                            </div>
                                            {!isLastStage && <div className="w-px h-24 bg-slate-600"></div>}
                                        </div>
                                        <div className={`pt-2 w-full ${!isLastStage ? 'pb-12' : ''}`}>
                                            <StageCard stage={stage} onApprove={approveStage} onReject={rejectStage} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};