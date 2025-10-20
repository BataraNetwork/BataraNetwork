import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useWallet } from '../../../hooks/useWallet';
import { WalletTransaction } from '../../../types';
import { ClipboardIcon, CheckIcon, ArrowRightIcon, DatabaseIcon, AlertTriangleIcon } from '../../ui/icons';

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
);

const AddressCard: React.FC<{ address: string }> = ({ address }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-sm text-slate-400">Your Address</p>
            <div className="flex items-center justify-between gap-4 mt-2">
                <code className="text-sm text-slate-300 font-mono truncate">{address}</code>
                <button onClick={handleCopy} className="p-2 bg-slate-700 rounded-md text-slate-400 hover:bg-slate-600 transition flex-shrink-0">
                    {copied ? <CheckIcon /> : <ClipboardIcon />}
                </button>
            </div>
        </div>
    );
};

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    details: { to: string; amount: number } | null;
}> = ({ isOpen, onClose, onConfirm, details }) => {
    if (!isOpen || !details) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <AlertTriangleIcon className="h-8 w-8 text-yellow-400" />
                        <h3 className="text-xl font-bold text-white">Confirm Transaction</h3>
                    </div>
                    <p className="text-sm text-slate-400 mt-2 mb-4">Please review the transaction details before confirming.</p>
                    <div className="space-y-2 text-sm bg-slate-900/50 p-4 rounded-md border border-slate-700">
                        <div className="flex justify-between"><span className="text-slate-400">To:</span> <code className="font-mono text-slate-300 truncate">{details.to}</code></div>
                        <div className="flex justify-between"><span className="text-slate-400">Amount:</span> <span className="font-bold text-white">{details.amount.toLocaleString()} BTR</span></div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-700 bg-slate-800/50 rounded-b-lg flex justify-end gap-4">
                    <button onClick={onClose} className="bg-slate-600 text-white font-semibold rounded-md px-4 py-2 hover:bg-slate-500 transition">Cancel</button>
                    <button onClick={onConfirm} className="bg-sky-600 text-white font-semibold rounded-md px-4 py-2 hover:bg-sky-500 transition">Confirm Send</button>
                </div>
            </div>
        </div>
    );
};


export const WalletView: React.FC<{ logAction: (action: string, details: Record<string, any>) => void }> = ({ logAction }) => {
    const { currentUser, hasPermission } = useAuth();
    const { balance, address, transactions, sendBtr } = useWallet(currentUser);
    const [toAddress, setToAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [txDetails, setTxDetails] = useState<{ to: string; amount: number } | null>(null);

    const canSend = hasPermission('action:send_btr');
    
    const isValidAddress = (addr: string): boolean => {
      // This regex matches the simulated address format like "0xDev...a1b2c3"
      return /^0x[a-zA-Z0-9]+\.\.\.[a-zA-Z0-9]{6}$/.test(addr);
    };

    const handleInitiateSend = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const sendAmount = parseFloat(amount);
        
        if (isNaN(sendAmount) || sendAmount <= 0) {
            setError('Amount must be a positive number.');
            return;
        }
        if (!toAddress.trim()) {
            setError('Recipient address is required.');
            return;
        }
        if (!isValidAddress(toAddress.trim())) {
            setError('Invalid recipient address format.');
            return;
        }
         if (balance < sendAmount) {
            setError('Insufficient balance.');
            return;
        }

        setTxDetails({ to: toAddress.trim(), amount: sendAmount });
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSend = () => {
        if (!txDetails) return;

        const result = sendBtr(txDetails.to, txDetails.amount);
        if (result.success) {
            logAction('wallet.send_btr', { to: txDetails.to, amount: txDetails.amount });
            setToAddress('');
            setAmount('');
        } else {
            setError(result.message);
        }
        
        setIsConfirmModalOpen(false);
        setTxDetails(null);
    };

    return (
        <div>
            <ConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmSend}
                details={txDetails}
            />
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3"><DatabaseIcon /> Your Wallet</h2>
                <p className="text-slate-400">Manage your BTR token balance and view your transaction history.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Send BTR Form */}
                <div className="lg:col-span-1 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Send BTR</h3>
                    <form onSubmit={handleInitiateSend} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-400 block mb-1">Recipient Address</label>
                            <input 
                                type="text"
                                value={toAddress}
                                onChange={e => setToAddress(e.target.value)}
                                placeholder="0x..."
                                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                                disabled={!canSend}
                            />
                        </div>
                         <div>
                            <label className="text-sm font-medium text-slate-400 block mb-1">Amount</label>
                            <input 
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.0"
                                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                                disabled={!canSend}
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={!canSend || !toAddress || !amount}
                            className="w-full bg-sky-600 text-white font-semibold rounded-md py-2.5 hover:bg-sky-500 transition-colors flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed"
                        >
                            Send Transaction <ArrowRightIcon />
                        </button>
                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    </form>
                </div>

                {/* Balance and Address */}
                <div className="lg:col-span-2 space-y-6">
                    <StatCard title="Your Balance (BTR)" value={balance.toLocaleString()} />
                    <AddressCard address={address} />
                </div>
            </div>

            {/* Transaction History */}
            <div>
                 <h3 className="text-2xl font-bold text-white mb-4">Transaction History</h3>
                 <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-800 text-left text-slate-400">
                            <tr>
                                <th className="p-4 font-semibold">Tx ID</th>
                                <th className="p-4 font-semibold">To</th>
                                <th className="p-4 font-semibold text-right">Amount (BTR)</th>
                                <th className="p-4 font-semibold">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(tx => (
                                <tr key={tx.id} className="border-b border-slate-700 last:border-b-0">
                                    <td className="p-4 font-mono text-slate-400 truncate" style={{ maxWidth: '200px' }}>{tx.id}</td>
                                    <td className="p-4 font-mono text-slate-300 truncate" style={{ maxWidth: '200px' }}>{tx.to}</td>
                                    <td className="p-4 text-right font-semibold text-white">-{tx.amount.toLocaleString()}</td>
                                    <td className="p-4 text-slate-400">{tx.timestamp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {transactions.length === 0 && <p className="text-center p-8 text-slate-500">You have no outgoing transactions.</p>}
                 </div>
            </div>
        </div>
    );
};