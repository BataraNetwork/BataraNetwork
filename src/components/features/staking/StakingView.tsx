import React, { useState } from 'react';
import { useStaking, Validator } from '../../../hooks/useStaking';
import { UserGroupIcon, DatabaseIcon, ArrowRightIcon, SparklesIcon } from '../../ui/icons';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 flex items-center gap-4">
        <div className="bg-slate-700 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const StakeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    validator: Validator | null;
    onStake: (amount: number) => void;
}> = ({ isOpen, onClose, validator, onStake }) => {
    const [amount, setAmount] = useState('');
    if (!isOpen || !validator) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const stakeAmount = parseFloat(amount);
        if (stakeAmount > 0) {
            onStake(stakeAmount);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-lg font-bold text-white">Stake with {validator.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">Staking to a validator helps secure the network and earns you rewards.</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-y border-slate-700">
                        <label htmlFor="stake-amount" className="block text-sm font-medium text-slate-300 mb-2">Amount to Stake (BTR)</label>
                        <input type="number" id="stake-amount" value={amount} onChange={e => setAmount(e.target.value)}
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-sky-500" 
                            placeholder="0.0"
                            min="0"
                            step="any"
                            required
                        />
                         <p className="text-xs text-slate-500 mt-2">Commission: {validator.commission}% | Est. APR: 12.5%</p>
                    </div>
                    <div className="p-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-slate-700 text-white font-semibold rounded-md px-4 py-2 hover:bg-slate-600 transition-colors">Cancel</button>
                        <button type="submit" className="bg-sky-600 text-white font-semibold rounded-md px-4 py-2 hover:bg-sky-500 transition-colors">Confirm Stake</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const StakingView: React.FC = () => {
    const { validators, totalStaked, stakedAmount, stakeTokens } = useStaking();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);

    const handleStakeClick = (validator: Validator) => {
        setSelectedValidator(validator);
        setIsModalOpen(true);
    };
    
    const handleStakeConfirm = (amount: number) => {
        if (selectedValidator) {
            stakeTokens(selectedValidator.address, amount);
        }
        setIsModalOpen(false);
        setSelectedValidator(null);
    };

    return (
        <div>
             <StakeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} validator={selectedValidator} onStake={handleStakeConfirm} />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <div>
                    <h2 className="text-3xl font-bold text-white">Network Staking</h2>
                    <p className="text-slate-400">Delegate your BTR tokens to validators to earn rewards and secure the network.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total BTR Staked" value={totalStaked.toLocaleString()} icon={<DatabaseIcon className="text-sky-400" />} />
                <StatCard title="Active Validators" value={`${validators.filter(v => v.status === 'active').length}`} icon={<UserGroupIcon className="text-green-400" />} />
                <StatCard title="Your Staked BTR" value={stakedAmount.toLocaleString()} icon={<SparklesIcon className="text-yellow-400" />} />
                <StatCard title="Estimated APR" value="~12.5%" icon={<ArrowRightIcon className="text-purple-400" />} />
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-slate-800">
                        <tr>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-slate-300">Validator</th>
                            <th className="py-3 px-4 text-right text-sm font-semibold text-slate-300">Total Stake</th>
                            <th className="py-3 px-4 text-right text-sm font-semibold text-slate-300">Commission</th>
                            <th className="py-3 px-4 text-right text-sm font-semibold text-slate-300">Uptime</th>
                            <th className="py-3 px-4 text-center text-sm font-semibold text-slate-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {validators.filter(v => v.status === 'active').map(validator => (
                            <tr key={validator.address} className="hover:bg-slate-800/50 transition-colors">
                                <td className="py-3 px-4 text-sm font-semibold text-white">{validator.name}</td>
                                <td className="py-3 px-4 text-right text-sm font-mono text-slate-300">{validator.stake.toLocaleString()} BTR</td>
                                <td className="py-3 px-4 text-right text-sm text-slate-300">{validator.commission}%</td>
                                <td className="py-3 px-4 text-right text-sm">
                                    <span className={validator.uptime > 99 ? 'text-green-400' : 'text-yellow-400'}>{validator.uptime}%</span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <button onClick={() => handleStakeClick(validator)} className="bg-sky-600 text-white text-xs font-semibold rounded px-4 py-1.5 hover:bg-sky-500 transition-colors">
                                        Stake
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
};
