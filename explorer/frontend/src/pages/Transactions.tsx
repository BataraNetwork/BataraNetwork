import React, { useState, useEffect } from 'react';
import { getTransactions } from '../api/explorerApi';
import { Link } from 'react-router-dom';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const txsData = await getTransactions(50); // Fetch latest 50 pending txs
        setTransactions(txsData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch transactions.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (isLoading) return <div className="text-center p-8">Loading transactions...</div>;
  if (error) return <div className="text-center text-red-500 p-8 bg-red-500/10 rounded-lg">{error}</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Pending Transactions</h2>
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-slate-400">Transaction ID</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-slate-400">From</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-slate-400">To</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-slate-400">Amount (BTR)</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-slate-400">Fee (BTR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="py-3 px-4 font-mono text-sm truncate" style={{ maxWidth: '200px' }}>
                  <Link to={`/tx/${tx.id}`} className="text-sky-400 hover:underline">
                    {tx.id}
                  </Link>
                </td>
                <td className="py-3 px-4 font-mono text-sm truncate" style={{ maxWidth: '200px' }}>{tx.from}</td>
                <td className="py-3 px-4 font-mono text-sm truncate" style={{ maxWidth: '200px' }}>{tx.to || 'N/A'}</td>
                <td className="py-3 px-4 text-right font-mono text-sm">{tx.amount ? tx.amount.toLocaleString() : 'N/A'}</td>
                <td className="py-3 px-4 text-right font-mono text-sm">{tx.fee}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
            <div className="text-center p-8 text-slate-500">
                <p>No pending transactions found in the mempool.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
