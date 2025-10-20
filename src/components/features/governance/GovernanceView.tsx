import React, { useState } from 'react';
import { useGovernance } from '../../../hooks/useGovernance';
import { useAuth } from '../../../hooks/useAuth';
import { Proposal, Vote } from '../../../types';
import { CheckCircleIcon, XCircleIcon, SparklesIcon, GavelIcon } from '../../ui/icons';

const getStatusStyles = (status: Proposal['status']) => {
    switch (status) {
        case 'active':
        case 'ACTIVE':
             return 'bg-sky-500/20 text-sky-400';
        case 'passed':
        case 'PASSED':
            return 'bg-green-500/20 text-green-400';
        case 'failed':
        case 'FAILED':
            return 'bg-red-500/20 text-red-400';
        case 'executed':
        case 'EXECUTED':
            return 'bg-purple-500/20 text-purple-400';
        default: return 'bg-slate-700/50 text-slate-400';
    }
};

const VoteProgressBar: React.FC<{ votes: Proposal['votes'] }> = ({ votes }) => {
    const total = votes.yes + votes.no + votes.abstain;
    if (total === 0) return <div className="h-2 w-full bg-slate-700 rounded-full"></div>;
    const yesPercent = (votes.yes / total) * 100;
    const noPercent = (votes.no / total) * 100;

    return (
        <div className="flex w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="bg-green-500" style={{ width: `${yesPercent}%` }}></div>
            <div className="bg-red-500" style={{ width: `${noPercent}%` }}></div>
        </div>
    );
};

const ProposalCard: React.FC<{
    proposal: Proposal;
    userVote?: Vote['option'];
    onVote: (proposalId: string, option: Vote['option']) => void;
    canVote: boolean;
}> = ({ proposal, userVote, onVote, canVote }) => {
    const totalVotes = proposal.votes.yes + proposal.votes.no + proposal.votes.abstain;

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-lg font-bold text-white">{proposal.id.substring(0, 10)}...: {proposal.title}</h3>
                    <p className="text-xs text-slate-500">Proposed by: <span className="font-mono truncate">{proposal.proposer}</span></p>
                </div>
                <div className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusStyles(proposal.status)}`}>
                    {String(proposal.status).toUpperCase()}
                </div>
            </div>
            <p className="text-sm text-slate-400 mb-4">{proposal.description}</p>
            
            <div className="mb-4">
                <VoteProgressBar votes={proposal.votes} />
                <div className="flex justify-between text-xs mt-1 text-slate-500">
                    <span className="text-green-400">Yes: {((proposal.votes.yes / totalVotes) * 100 || 0).toFixed(1)}%</span>
                    <span className="text-red-400">No: {((proposal.votes.no / totalVotes) * 100 || 0).toFixed(1)}%</span>
                    <span>Abstain: {((proposal.votes.abstain / totalVotes) * 100 || 0).toFixed(1)}%</span>
                </div>
            </div>

            {String(proposal.status).toUpperCase() === 'ACTIVE' && (
                <div>
                    {userVote ? (
                        <p className="text-center text-sm text-slate-400">You voted: <span className="font-bold">{userVote.toUpperCase()}</span></p>
                    ) : (
                        <div className="flex justify-center gap-4">
                            <button disabled={!canVote} onClick={() => onVote(proposal.id, 'yes')} className="bg-green-600/50 border border-green-500/50 text-green-300 font-semibold rounded-md px-4 py-2 hover:bg-green-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed">Vote Yes</button>
                            <button disabled={!canVote} onClick={() => onVote(proposal.id, 'no')} className="bg-red-600/50 border border-red-500/50 text-red-300 font-semibold rounded-md px-4 py-2 hover:bg-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed">Vote No</button>
                            <button disabled={!canVote} onClick={() => onVote(proposal.id, 'abstain')} className="bg-slate-600/50 border border-slate-500/50 text-slate-300 font-semibold rounded-md px-4 py-2 hover:bg-slate-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed">Abstain</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const NewProposalModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { title: string, description: string, endBlock: number }) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [endBlock, setEndBlock] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const endBlockNum = parseInt(endBlock, 10);
        if (title && description && !isNaN(endBlockNum)) {
            setIsSubmitting(true);
            await onSubmit({ title, description, endBlock: endBlockNum });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Create New Proposal</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full h-32 bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">End Block Height</label>
                                <input type="number" value={endBlock} onChange={e => setEndBlock(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm" required />
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-700 bg-slate-800/50 rounded-b-lg flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="bg-slate-600 text-white font-semibold rounded-md px-4 py-2 hover:bg-slate-500 transition" disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="bg-sky-600 text-white font-semibold rounded-md px-4 py-2 hover:bg-sky-500 transition disabled:opacity-50" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const GovernanceView: React.FC<{ logAction: (action: string, details: Record<string, any>) => void }> = ({ logAction }) => {
    const { proposals, userVotes, castVote, submitProposal, isLoading } = useGovernance();
    const { currentUser, hasPermission } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const canVote = hasPermission('action:vote');
    const canPropose = hasPermission('action:propose');

    const handlePropose = async (data: { title: string, description: string, endBlock: number }) => {
        const newProposal = await submitProposal({ ...data, proposer: currentUser.publicKey });
        if (newProposal) {
            logAction('governance.propose', {
                proposalId: newProposal.id,
                title: newProposal.title
            });
        }
        setIsModalOpen(false);
    };

    return (
        <div>
            <NewProposalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handlePropose} />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-2"><GavelIcon className="h-8 w-8"/> Governance</h2>
                    <p className="text-slate-400">Participate in the decentralized governance of the Bataranetwork.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    disabled={!canPropose} 
                    className="bg-sky-600 text-white font-semibold rounded-md px-6 py-3 hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2"
                >
                   <SparklesIcon /> Create New Proposal
                </button>
            </div>
            
            {isLoading && proposals.length === 0 ? <div className="text-center p-8 text-slate-400">Loading proposals from the blockchain...</div> :
                <div className="space-y-6">
                    {proposals.map(p => (
                        <ProposalCard key={p.id} proposal={p} userVote={userVotes[p.id]} onVote={castVote} canVote={canVote} />
                    ))}
                </div>
            }
        </div>
    );
};