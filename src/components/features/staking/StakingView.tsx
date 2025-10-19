import React, { useState } from 'react';
import { useStaking, Validator } from '../../../hooks/useStaking';
import { useAuth } from '../../../hooks/useAuth';
import { CheckCircleIcon, XCircleIcon, PlusCircleIcon, ArrowRightIcon } from '../../ui/icons';

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
);

const ValidatorRow: React.FC<{ validator: Validator, onStake: (address: string, amount: number) => void }> = ({ validator, onStake }) => {
    const [amount, setAmount] = useState('');
    const { currentUser } = useAuth();
    const canStake = currentUser.permissions.has('action:stake');

    const handleStake = (e: React.FormEvent) => {
        e.preventDefault();
        const stakeAmount = parseInt(amount, 10);
        if (!isNaN(stakeAmount) && stakeAmount > 0) {
            onStake(validator.address, stakeAmount);
            setAmount('');
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
                <form onSubmit={handleStake} className="flex items-center gap-2">
                    <input 
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="Amount"
                        className="w-24 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
                        disabled={!canStake}
                    />
                    <button type="submit" className="bg-sky-600 rounded p-1.5 text-white hover:bg-sky-500 transition disabled:bg-slate-600 disabled:cursor-not-allowed" disabled={!canStake || !amount}>
                        <ArrowRightIcon className="h-4 w-4" />
                    </button>
                </form>
            </td>
        </tr>
    );
};

export const StakingView: React.FC = () => {
    const { validators, totalStaked, stakedAmount, stakeTokens } = useStaking();
    
    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white">Staking & Validators</h2>
                <p className="text-slate-400">Secure the network by staking your tokens with validators.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Staked" value={totalStaked.toLocaleString()} />
                <StatCard title="Your Stake" value={stakedAmount.toLocaleString()} />
                <StatCard title="Active Validators" value={validators.filter(v => v.status === 'active').length} />
            </div>

             <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-800 text-left text-slate-400">
                        <tr>
                            <th className="p-4 font-semibold">Validator</th>
                            <th className="p-4 font-semibold text-right">Total Stake</th>
                            <th className="p-4 font-semibold text-right">Commission</th>
                            <th className="p-4 font-semibold text-right">Uptime</th>
                            <th className="p-4 font-semibold text-center">Status</th>
                            <th className="p-4 font-semibold">Stake with Validator</th>
                        </tr>
                    </thead>
                    <tbody>
                        {validators.map(v => <ValidatorRow key={v.address} validator={v} onStake={stakeTokens} />)}
                    </tbody>
                </table>
             </div>

        </div>
    );
};
