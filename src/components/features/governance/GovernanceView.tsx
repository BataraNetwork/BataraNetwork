import React, { useState, useMemo } from 'react';
import { useGovernance, Proposal, ProposalStatus } from '../../../hooks/useGovernance';
import { LightBulbIcon, PlusIcon, XIcon, FilterIcon } from '../../ui/icons';

// FIX: Used ProposalStatus enum members instead of string literals to ensure type safety.
const PROPOSAL_STATUS_FILTERS: (ProposalStatus | 'all')[] = ['all', ProposalStatus.ACTIVE, ProposalStatus.PASSED, ProposalStatus.FAILED, ProposalStatus.EXECUTED];

interface GovernanceViewProps {
  latestBlockHeight: number;
}

const getStatusStyles = (status: ProposalStatus) => {
    switch (status) {
        case ProposalStatus.ACTIVE:
            return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/50' };
        case ProposalStatus.PASSED:
            return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/50' };
        case ProposalStatus.FAILED:
            return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/50' };
        case ProposalStatus.EXECUTED:
            return { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/50' };
        default:
            return { bg: 'bg-slate-700/20', text: 'text-slate-400', border: 'border-slate-700' };
    }
};

const NewProposalModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, description: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && description.trim()) {
            onSubmit(title, description);
            setTitle('');
            setDescription('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h3 className="text-lg font-bold text-white">Submit New Proposal</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                            <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required rows={5}
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-700 text-right">
                        <button type="submit" className="bg-sky-600 text-white font-semibold rounded-md px-4 py-2 hover:bg-sky-500 transition-colors">
                            Submit Proposal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ProposalCard: React.FC<{
    proposal: Proposal;
    onVote: (proposalId: number, vote: 'yes' | 'no' | 'abstain') => void;
    hasVoted: boolean;
    latestBlockHeight: number;
}> = ({ proposal, onVote, hasVoted, latestBlockHeight }) => {
    const styles = getStatusStyles(proposal.status);
    const totalVotes = proposal.votes.yes + proposal.votes.no + proposal.votes.abstain;
    const yesPercent = totalVotes > 0 ? (proposal.votes.yes / totalVotes) * 100 : 0;
    const noPercent = totalVotes > 0 ? (proposal.votes.no / totalVotes) * 100 : 0;

    return (
        <div className={`border rounded-lg ${styles.border} ${styles.bg}`}>
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-white">{`#${proposal.id} - ${proposal.title}`}</h3>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${styles.bg} ${styles.text}`}>{proposal.status}</span>
                </div>
                <p className="text-sm text-slate-400 mt-2">{proposal.description}</p>
                <div className="mt-4 text-xs text-slate-500">
                    <p>Proposer: <span className="font-mono">{proposal.proposer}</span></p>
                    <p>Voting ends at block: {proposal.endBlock}</p>
                </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-700/50">
                <h4 className="text-sm font-semibold mb-2">Voting Results</h4>
                <div className="space-y-2">
                    {/* Yes Bar */}
                    <div className="w-full bg-slate-700/50 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${yesPercent}%` }}></div>
                    </div>
                    {/* No Bar */}
                     <div className="w-full bg-slate-700/50 rounded-full h-2.5">
                        <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${noPercent}%` }}></div>
                    </div>
                </div>
                <div className="flex justify-between text-xs mt-2 text-slate-400">
                    <span>Yes: {proposal.votes.yes.toLocaleString()} ({yesPercent.toFixed(1)}%)</span>
                    <span>No: {proposal.votes.no.toLocaleString()} ({noPercent.toFixed(1)}%)</span>
                    <span>Abstain: {proposal.votes.abstain.toLocaleString()}</span>
                </div>
            </div>

            {proposal.status === 'active' && (
                <div className="p-4 border-t border-slate-700/50">
                    {hasVoted ? (
                        <p className="text-sm text-center text-green-400">You have voted on this proposal.</p>
                    ) : (
                        <div className="flex justify-center gap-4">
                            <button onClick={() => onVote(proposal.id, 'yes')} className="bg-green-500/20 text-green-400 font-bold px-6 py-2 rounded-md hover:bg-green-500/30">Vote Yes</button>
                            <button onClick={() => onVote(proposal.id, 'no')} className="bg-red-500/20 text-red-400 font-bold px-6 py-2 rounded-md hover:bg-red-500/30">Vote No</button>
                            <button onClick={() => onVote(proposal.id, 'abstain')} className="bg-slate-600 text-slate-300 font-bold px-6 py-2 rounded-md hover:bg-slate-500">Abstain</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const GovernanceView: React.FC<GovernanceViewProps> = ({ latestBlockHeight }) => {
    const { proposals, submitProposal, castVote, hasVoted } = useGovernance(latestBlockHeight);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');

    const filteredProposals = useMemo(() => {
        if (statusFilter === 'all') return proposals;
        return proposals.filter(p => p.status === statusFilter);
    }, [proposals, statusFilter]);

    const handleProposalSubmit = (title: string, description: string) => {
        submitProposal(title, description);
        setIsModalOpen(false);
    };

    return (
        <div>
            <NewProposalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleProposalSubmit} />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <div>
                    <h2 className="text-3xl font-bold text-white">On-Chain Governance</h2>
                    <p className="text-slate-400">Participate in the decentralized decision-making process of the Bataranetwork.</p>
                </div>
                 <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-sky-600 text-white font-semibold rounded-md px-6 py-3 hover:bg-sky-500 transition-colors">
                    <PlusIcon /> Submit New Proposal
                 </button>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4 flex gap-4 items-center">
                <div className="flex items-center gap-2 flex-wrap">
                    <FilterIcon className="text-slate-400" />
                     <span className="text-sm font-semibold mr-2">Filter by status:</span>
                    {PROPOSAL_STATUS_FILTERS.map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)}
                            className={`text-xs px-3 py-1 rounded-full border transition capitalize ${statusFilter === status ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'bg-slate-700/50 border-slate-700 text-slate-400'}`}>
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {filteredProposals.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredProposals.map(p => (
                        <ProposalCard 
                            key={p.id} 
                            proposal={p} 
                            onVote={castVote} 
                            hasVoted={hasVoted.has(p.id)}
                            latestBlockHeight={latestBlockHeight} 
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <LightBulbIcon className="mx-auto h-12 w-12 text-slate-600" />
                    <p className="mt-4 text-slate-400">No proposals match the current filter.</p>
                    <p className="text-sm text-slate-500">Try selecting a different status or submitting a new proposal.</p>
                </div>
            )}
        </div>
    );
};
