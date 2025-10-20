import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTransaction } from '../api/explorerApi';

const DetailRow: React.FC<{ label: string; value: React.ReactNode; isMono?: boolean }> = ({ label, value, isMono = true }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 py-4 border-b border-slate-700 last:border-b-0">
    <p className="font-semibold text-slate-400">{label}</p>
    <div className={`md:col-span-3 break-words ${isMono ? 'font-mono' : ''}`}>{value}</div>
  </div>
);

const TransactionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const txData = await getTransaction(id);
        setTransaction(txData);
        setError(null);
      } catch (err) {
        setError(`Failed to fetch transaction ${id}. It might already be included in a block.`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  if (isLoading) return <div className="text-center p-8 animate-pulse">Loading transaction details...</div>;
  if (error) return <div className="text-center text-red-400 p-8 bg-red-900/50 border border-red-500/50 rounded-lg">{error}</div>;
  if (!transaction) return <div className="text-center p-8">Transaction not found in mempool.</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2 text-white">Transaction Details</h2>
      <p className="font-mono text-sm text-slate-500 mb-6 break-all">{transaction.id}</p>
      
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 shadow-lg p-6">
        <DetailRow label="Transaction ID" value={transaction.id} />
        <DetailRow label="Type" value={
            <span className="text-xs font-semibold bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full border border-cyan-500/50">
                {transaction.type}
            </span>
        } isMono={false} />
        <DetailRow label="From" value={<Link to={`/address/${encodeURIComponent(transaction.from)}`} className="text-sky-400 hover:underline">{transaction.from}</Link>} />
        {transaction.to && <DetailRow label="To" value={<Link to={`/address/${encodeURIComponent(transaction.to)}`} className="text-sky-400 hover:underline">{transaction.to}</Link>} />}
        {typeof transaction.amount === 'number' && <DetailRow label="Amount" value={`${transaction.amount.toLocaleString()} BTR`} isMono={false} />}
        <DetailRow label="Fee" value={`${transaction.fee} BTR`} isMono={false} />
        <DetailRow label="Nonce" value={transaction.nonce} isMono={false} />
        <DetailRow label="Signature" value={transaction.signature} />
      </div>
    </div>
  );
};

export default TransactionDetail;
