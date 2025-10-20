import React, { useState, useEffect } from 'react';
import { getStatus, getBlocks, getTransactions } from '../api/explorerApi';
import { Link } from 'react-router-dom';

const StatCard: React.FC<{ title: string; value: string | number; subValue?: string }> = ({ title, value, subValue }) => (
  <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
    <p className="text-sm text-slate-400">{title}</p>
    <p className="text-3xl font-bold text-white mt-1">{value}</p>
    {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
  </div>
);

const LatestBlockCard: React.FC<{ block: any }> = ({ block }) => (
    <div className="flex justify-between items-center p-4 border-b border-slate-700 last:border-b-0 hover:bg-slate-800/50">
        <div>
            <Link to={`/block/${block.height}`} className="font-semibold text-sky-400 hover:underline">Block #{block.height}</Link>
            <p className="text-xs text-slate-500">{new Date(block.timestamp).toLocaleTimeString()}</p>
        </div>
        <div className="text-right">
             <p className="text-sm"><span className="text-slate-400">Txs:</span> {block.transactions.length}</p>
             <p className="text-xs text-slate-500 font-mono truncate max-w-[120px] md:max-w-xs" title={block.hash}>{block.hash}</p>
        </div>
    </div>
);

const LatestTransactionCard: React.FC<{ tx: any }> = ({ tx }) => (
     <div className="flex justify-between items-center p-4 border-b border-slate-700 last:border-b-0 hover:bg-slate-800/50">
        <div>
            <Link to={`/tx/${tx.id}`} className="font-mono text-sm text-cyan-400 hover:underline truncate block max-w-[120px] md:max-w-xs" title={tx.id}>{tx.id}</Link>
            <p className="text-xs text-slate-500">{tx.type}</p>
        </div>
        <div className="text-right">
             <p className="text-sm font-mono truncate max-w-[120px] md:max-w-xs" title={tx.from}><span className="text-slate-400">from:</span> {tx.from}</p>
             {tx.to && <p className="text-sm font-mono truncate max-w-[120px] md:max-w-xs" title={tx.to}><span className="text-slate-400">to:</span> {tx.to}</p>}
        </div>
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
          getBlocks(5),
          getTransactions(5),
        ]);
        setStatus(statusData);
        setLatestBlocks(blocksData);
        setLatestTransactions(txsData);
        setError(null);
      } catch (err) {
        setError('Failed to connect to the Batara node. Please ensure it is running.');
        console.error(err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  if (error && !status) {
    return <div className="text-center text-red-400 p-8 bg-red-900/50 border border-red-500/50 rounded-lg">{error}</div>;
  }

  if (!status) {
    return <div className="text-center p-8 animate-pulse">Loading blockchain data...</div>;
  }

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white">The Bataranetwork Blockchain Explorer</h1>
        <p className="text-slate-400 mt-2">Explore blocks, transactions, and addresses on the live Batara network.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard title="Latest Block" value={`#${status.latestBlockHeight}`} />
        <StatCard title="Pending Txs" value={status.pendingTransactions} subValue="In Mempool" />
        <StatCard title="Active Validators" value={status.validatorCount} />
        <StatCard title="Total Staked" value={`${(status.totalStaked / 1_000_000).toFixed(2)}M BTR`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-2xl font-bold mb-4 text-white">Latest Blocks</h3>
          <div className="bg-slate-800/50 rounded-lg border border-slate-700">
             {latestBlocks.map(block => <LatestBlockCard key={block.hash} block={block} />)}
             <Link to="/blocks" className="text-cyan-400 hover:underline text-sm p-4 block text-center font-semibold">View all blocks →</Link>
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-4 text-white">Latest Transactions</h3>
          <div className="bg-slate-800/50 rounded-lg border border-slate-700">
            {latestTransactions.map(tx => <LatestTransactionCard key={tx.id} tx={tx} />)}
            {latestTransactions.length === 0 && <p className="text-slate-500 text-center p-8">No pending transactions in the mempool.</p>}
             <Link to="/transactions" className="text-cyan-400 hover:underline text-sm p-4 block text-center font-semibold">View all transactions →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
