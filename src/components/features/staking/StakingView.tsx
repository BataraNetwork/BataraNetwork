import React, { useState } from 'react';
import { useStaking } from '../../../hooks/useStaking';
import { Validator } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { CheckCircleIcon, XCircleIcon } from '../../ui/icons';

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
);

const ValidatorRow: React.FC<{ 
    validator: Validator, 
    onStake: (address: string, amount: number) => { success: boolean, message: string },
    onUnstake: (address: string, amount: number) => { success: boolean, message: string },
}> = ({ validator, onStake, onUnstake }) => {
    const [stakeAmount, setStakeAmount] = useState('');
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [stakeError, setStakeError] = useState<string | null>(null);
    const [unstakeError, setUnstakeError] = useState<string | null>(null);
    const { currentUser } = useAuth();
    const canStake = currentUser.permissions.has('action:stake');

    const handleStake = (e: React.FormEvent) => {
        e.preventDefault();
        setStakeError(null);
        const amount = parseInt(stakeAmount, 10);
        if (!isNaN(amount) && amount > 0) {
            const result = onStake(validator.address, amount);
            if (result.success) {
                setStakeAmount('');
            } else {
                setStakeError(result.message);
            }
        }
    };
    
    const handleUnstake = (e: React.FormEvent) => {
        e.preventDefault();
        setUnstakeError(null);
        const amount = parseInt(unstakeAmount, 10);
        if (!isNaN(amount) && amount > 0) {
            const result = onUnstake(validator.address, amount);
            if (!result.success) {
                setUnstakeError(result.message);
            } else {
                setUnstakeAmount('');
            }
        }
    };
    
    return (
        <tr className="border-b border-slate-700 last:border-b-0 hover:bg-slate-800/30">
            <td className="p-4">
                <div className="font-bold text-white">{validator.name}</div>
                <div className="text-xs text-slate-500 font-mono">{validator.address}</div>
            </td>
            <td className="p-4 text-right font-mono text-white">{validator.stake.toLocaleString()}</td>
            <td className="p-4 text-right text-slate-300">{validator.commission}%</td>
            <td className="p-4 text-right">
                <span className={validator.uptime > 99 ? 'text-green-400' : 'text-yellow-400'}>
                    {validator.uptime}%
                </span>
            </td>
            <td className="p-4 text-center">
                {validator.status === 'active' 
                    ? <CheckCircleIcon className="h-6 w-6 text-green-500 mx-auto" /> 
                    : <XCircleIcon className="h-6 w-6 text-red-500 mx-auto" />}
            </td>
            <td className="p-4">
                <div className="flex items-start gap-4">
                    <form onSubmit={handleStake} className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                            <input 
                                type="number"
                                value={stakeAmount}
                                onChange={e => {
                                    setStakeAmount(e.target.value);
                                    setStakeError(null);
                                }}
                                placeholder="Amount"
                                className="w-24 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
                                disabled={!canStake || validator.status === 'inactive'}
                                title={validator.status === 'inactive' ? 'Cannot stake on an inactive validator' : ''}
                            />
                            <button 
                                type="submit" 
                                className="bg-sky-600 rounded px-3 py-1.5 text-white text-xs font-semibold hover:bg-sky-500 transition disabled:bg-slate-600 disabled:cursor-not-allowed" 
                                disabled={!canStake || !stakeAmount || validator.status === 'inactive'}>
                                Stake
                            </button>
                        </div>
                        {stakeError && <p className="text-xs text-red-400 mt-1">{stakeError}</p>}
                    </form>
                    <div className="h-10 w-px bg-slate-600"></div>
                    <form onSubmit={handleUnstake} className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                            <input 
                                type="number"
                                value={unstakeAmount}
                                onChange={e => {
                                    setUnstakeAmount(e.target.value);
                                    setUnstakeError(null);
                                }}
                                placeholder="Amount"
                                className="w-24 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
                                disabled={!canStake || validator.status === 'inactive'}
                                title={validator.status === 'inactive' ? 'Cannot unstake from an inactive validator' : ''}
                            />
                            <button 
                                type="submit" 
                                className="bg-red-600 rounded px-3 py-1.5 text-white text-xs font-semibold hover:bg-red-500 transition disabled:bg-slate-600 disabled:cursor-not-allowed" 
                                disabled={!canStake || !unstakeAmount || validator.status === 'inactive'}>
                                Unstake
                            </button>
                        </div>
                        {unstakeError && <p className="text-xs text-red-400 mt-1">{unstakeError}</p>}
                    </form>
                </div>
            </td>
        </tr>
    );
};

export const StakingView: React.FC<{ logAction: (action: string, details: Record<string, any>) => void }> = ({ logAction }) => {
    const { validators, totalStaked, stakedAmount, stakeTokens, unstakeTokens } = useStaking();
    
    const handleStakeTokens = (address: string, amount: number) => {
        const validator = validators.find(v => v.address === address);
        const result = stakeTokens(address, amount);
        if (result.success) {
            logAction('staking.stake', { 
                validator: validator?.name || address,
                amount: amount 
            });
        }
        return result;
    };

    const handleUnstakeTokens = (address: string, amount: number) => {
        const validator = validators.find(v => v.address === address);
        const result = unstakeTokens(address, amount);
        if (result.success) {
            logAction('staking.unstake', { 
                validator: validator?.name || address,
                amount: amount 
            });
        }
        return result;
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white">Staking & Validators</h2>
                <p className="text-slate-400">Secure the network by staking your BTR tokens with validators.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Staked (BTR)" value={totalStaked.toLocaleString()} />
                <StatCard title="Your Stake (BTR)" value={stakedAmount.toLocaleString()} />
                <StatCard title="Active Validators" value={validators.filter(v => v.status === 'active').length} />
            </div>

             <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-800 text-left text-slate-400">
                        <tr>
                            <th className="p-4 font-semibold">Validator</th>
                            <th className="p-4 font-semibold text-right">Total Stake (BTR)</th>
                            <th className="p-4 font-semibold text-right">Commission</th>
                            <th className="p-4 font-semibold text-right">Uptime</th>
                            <th className="p-4 font-semibold text-center">Status</th>
                            <th className="p-4 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {validators.map(v => <ValidatorRow key={v.address} validator={v} onStake={handleStakeTokens} onUnstake={handleUnstakeTokens} />)}
                    </tbody>
                </table>
             </div>

        </div>
    );
};