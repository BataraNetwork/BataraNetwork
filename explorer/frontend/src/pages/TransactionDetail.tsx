import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTransaction } from '../api/explorerApi';

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex flex-col md:flex-row py-3 border-b border-gray-700 last:border-b-0">
    <p className="w-full md:w-1/4 font-semibold text-gray-400">{label}</p>
    <div className="w-full md:w-3/4 break-words font-mono">{value}</div>
  </div>
);

const TransactionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tx, setTx] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTx = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        // This assumes the explorer backend has an endpoint to fetch a single transaction by its ID.
        const txData = await getTransaction(id);
        setTx(txData);
        setError(null);
      } catch (err) {
        setError(`Failed to fetch transaction ${id}. The API may not support this, or the transaction was not found.`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTx();
  }, [id]);

  if (isLoading) return <div className="text-center p-8">Loading transaction details...</div>;
  if (error) return <div className="text-center text-red-500 p-8 bg-red-500/10 rounded-lg">{error}</div>;
  if (!tx) return <div className="text-center p-8">Transaction not found.</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Transaction Details</h2>
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <DetailRow label="ID" value={tx.id} />
        <DetailRow label="From" value={tx.from} />
        <DetailRow label="To" value={tx.to} />
        <DetailRow label="Amount" value={tx.amount} />
        <DetailRow label="Fee" value={tx.fee} />
        <DetailRow label="Signature" value={tx.signature} />
        <DetailRow label="Status" value={<span className="text-yellow-400">Pending</span>} />
      </div>
    </div>
  );
};

export default TransactionDetail;