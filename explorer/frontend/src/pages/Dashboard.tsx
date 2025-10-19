import React, { useState, useEffect } from 'react';
import { getStatus, getBlocks, getTransactions } from '../api/explorerApi';
import { Link } from 'react-router-dom';

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
    <p className="text-sm text-gray-400">{title}</p>
    <p className="text-3xl font-bold text-white">{value}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [latestBlocks, setLatestBlocks] = useState<any[]>([]);
  const [latestTransactions, setLatestTransactions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusData, blocksData, txsData] = await Promise.all([
          getStatus(),
          getBlocks(),
          getTransactions(),
        ]);
        setStatus(statusData);
        setLatestBlocks(blocksData.slice(0, 5));
        setLatestTransactions(txsData.slice(0, 5));
        setError(null);
      } catch (err) {
        setError('Failed to connect to the Batara node.');
        console.error(err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <div className="text-center text-red-500 p-8 bg-red-500/10 rounded-lg">{error}</div>;
  }

  if (!status) {
    return <div className="text-center">Loading blockchain data...</div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Network Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Latest Block" value={`#${status.latestBlockHeight}`} />
        <StatCard title="Pending Transactions" value={status.pendingTransactions} />
        <StatCard title="Block Time" value="~5s" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-2xl font-bold mb-4">Latest Blocks</h3>
          <div className="bg-gray-800 rounded-lg p-4">
             {latestBlocks.map(block => (
               <div key={block.hash} className="p-2 border-b border-gray-700 last:border-b-0">
                  <p className="text-blue-400">Block #{block.height}</p>
                  <p className="text-xs text-gray-400 font-mono truncate">{block.hash}</p>
               </div>
             ))}
             <Link to="/blocks" className="text-blue-400 hover:underline mt-2 block text-center">View all blocks</Link>
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-4">Latest Transactions</h3>
          <div className="bg-gray-800 rounded-lg p-4">
            {latestTransactions.map(tx => (
              <div key={tx.id} className="p-2 border-b border-gray-700 last:border-b-0">
                <p className="text-green-400 font-mono text-sm truncate">{tx.id}</p>
                <p className="text-xs text-gray-400">From: <span className="font-mono truncate">{tx.from}</span></p>
              </div>
            ))}
            {latestTransactions.length === 0 && <p className="text-gray-500 text-center p-4">No pending transactions</p>}
             <Link to="/transactions" className="text-blue-400 hover:underline mt-2 block text-center">View all transactions</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;