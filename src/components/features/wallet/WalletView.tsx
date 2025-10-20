import React, { useState, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useWallet } from '../../../hooks/useWallet';
import { WalletTransaction } from '../../../types';
import { nodeService } from '../../../services/nodeService';
import { hash, sign } from '../../../utils/crypto';
import { ClipboardIcon, CheckIcon, ArrowRightIcon } from '../../ui/icons';

enum TransactionType {
  TRANSFER = 'TRANSFER',
}

const TransactionRow: React.FC<{ tx: WalletTransaction, currentAddress: string }> = ({ tx, currentAddress }) => {
    const isSent = tx.from === currentAddress;
    return (
        <div className="flex justify-between items-center py-3 border-b border-slate-700 last:border-b-0">
            <div>
                <p className={`font-semibold ${isSent ? 'text-red-400' : 'text-green-400'}`}>
                    {isSent ? 'Sent' : 'Received'} BTR
                </p>
                <p className="text-xs text-slate-500 font-mono">
                    {isSent ? `To: ${tx.to.substring(0,20)}...` : `From: ${tx.from.substring(0,20)}...`}
                </p>
                 <p className="text-xs text-slate-500">{tx.timestamp}</p>
            </div>
            <div className="text-right">
                <p className={`font-bold font-mono text-lg ${isSent ? 'text-red-400' : 'text-green-400'}`}>
                    {isSent ? '-' : '+'} {tx.amount.toLocaleString()}
                </p>
                <p className={`text-xs capitalize font-semibold ${tx.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`}>
                    {tx.status}
                </p>
            </div>
        </div>
    );
};


export const WalletView: React.FC<{ logAction: (action: string, details: Record<string, any>) => void }> = ({ logAction }) => {
    const { currentUser } = useAuth();
    const { balance, nonce, address, transactions, addSentTransactionToHistory } = useWallet(currentUser);
    const [toAddress, setToAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [copied, setCopied] = useState(false);
    
    const canSend = currentUser.permissions.has('action:send_btr');
    
    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSend = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSend) return;

        const sendAmount = parseInt(amount, 10);
        if (isNaN(sendAmount) || sendAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }

        setIsSending(true);
        setError(null);
        
        try {
            const fee = 1;
            if (balance < sendAmount + fee) {
                throw new Error('Insufficient funds for amount + fee.');
            }
            
            const txData = {
                from: address,
                to: toAddress,
                amount: sendAmount,
                fee: fee,
                nonce: nonce,
                type: TransactionType.TRANSFER,
            };

            const txId = hash(txData);
            const signature = sign(txId, currentUser.privateKey);
            
            const transaction = { ...txData, id: txId, signature };
            
            await nodeService.broadcastTransaction(transaction);
            
            logAction('wallet.send', { to: toAddress, amount: sendAmount });
            addSentTransactionToHistory(toAddress, sendAmount);

            setToAddress('');
            setAmount('');
        } catch (err: any) {
            setError(err.message || 'Failed to send transaction.');
        } finally {
            setIsSending(false);
        }

    }, [canSend, amount, toAddress, balance, address, nonce, currentUser.privateKey, logAction, addSentTransactionToHistory]);


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Balance & Send */}
            <div className="lg:col-span-1">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                    <p className="text-slate-400 text-sm">Your Wallet Address</p>
                    <div className="flex items-center gap-2 mt-1 mb-6">
                        <p className="text-xs font-mono text-white truncate">{address}</p>
                        <button onClick={handleCopy} className="text-slate-400 hover:text-white">
                            {copied ? <CheckIcon className="h-4 w-4"/> : <ClipboardIcon className="h-4 w-4"/>}
                        </button>
                    </div>

                    <p className="text-slate-400 text-sm">Total Balance</p>
                    <p className="text-4xl font-bold text-white">{balance.toLocaleString()} <span className="text-2xl text-sky-400">BTR</span></p>
                    <p className="text-xs text-slate-500 mt-1">Next Nonce: {nonce}</p>
                </div>
                
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mt-6">
                    <h3 className="text-xl font-bold text-white mb-4">Send BTR</h3>
                    <form onSubmit={handleSend}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="to-address" className="block text-sm font-medium text-slate-300 mb-1">Recipient Address</label>
                                <input type="text" id="to-address" value={toAddress} onChange={e => setToAddress(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                                    disabled={!canSend || isSending}
                                />
                            </div>
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-1">Amount</label>
                                <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                                    disabled={!canSend || isSending}
                                />
                            </div>
                            {error && <p className="text-xs text-red-400">{error}</p>}
                            <button type="submit" disabled={!canSend || isSending || !toAddress || !amount}
                                className="w-full bg-sky-600 text-white font-semibold rounded-md py-2.5 hover:bg-sky-500 transition-colors flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed"
                            >
                                {isSending ? 'Sending...' : 'Send Transaction'} <ArrowRightIcon/>
                            </button>
                            {!canSend && <p className="text-xs text-center text-yellow-400">Your role cannot send transactions.</p>}
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Column: History */}
            <div className="lg:col-span-2">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Transaction History</h3>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {transactions.length > 0 ? (
                            transactions.map(tx => <TransactionRow key={tx.id} tx={tx} currentAddress={address} />)
                        ) : (
                            <p className="text-center text-slate-500 py-8">No transactions found for this user.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
