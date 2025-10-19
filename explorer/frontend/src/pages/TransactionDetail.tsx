import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTransaction } from '../api/explorerApi';

const DetailRow: React.FC<{ label: string; value: React.ReactNode; isMono?: boolean }> = ({ label, value, isMono = true }) => (
  <div className="flex flex-col md:flex-row py-3 border-b border-gray-700 last:border-b-0">
    <p className="w-full md:w-1/4 font-semibold text-gray-400">{label}</p>
    <div className={`w-full md:w-3/4 break-words ${isMono ? 'font-mono' : ''}`}>{value}</div>
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

  if (isLoading) return <div className="text-center p-8">Loading transaction details...</div>;
  if (error) return <div className="text-center text-red-500 p-8 bg-red-500/10 rounded-lg">{error}</div>;
  if (!transaction) return <div className="text-center p-8">Transaction not found in mempool.</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Transaction Details</h2>
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <DetailRow label="Transaction ID" value={transaction.id} />
        <DetailRow label="Type" value={transaction.type} isMono={false} />
        <DetailRow label="From" value={transaction.from} />
        {transaction.to && <DetailRow label="To" value={transaction.to} />}
        {typeof transaction.amount === 'number' && <DetailRow label="Amount" value={transaction.amount.toLocaleString()} isMono={false} />}
        <DetailRow label="Fee" value={transaction.fee} isMono={false} />
        <DetailRow label="Nonce" value={transaction.nonce} isMono={false} />
        <DetailRow label="Signature" value={transaction.signature} />
      </div>
    </div>
  );
};

export default TransactionDetail;
