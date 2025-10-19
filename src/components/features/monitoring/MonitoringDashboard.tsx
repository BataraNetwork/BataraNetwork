import React from 'react';
import { useNodeStatus } from '../../../hooks/useNodeStatus';

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
    <p className="text-sm text-slate-400">{title}</p>
    <p className="text-3xl font-bold text-white mt-1">{value}</p>
  </div>
);

const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}d ${h}h ${m}m`;
}

export const MonitoringDashboard: React.FC = () => {
  const { status, isLoading, error } = useNodeStatus();

  if (isLoading) {
    return <div className="text-center p-8 text-slate-400">Loading node status...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-400 bg-red-500/10 rounded-lg">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Node Monitoring</h2>
      <p className="text-slate-400 mb-6">Real-time status and health of the Bataranetwork node.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Latest Block Height" value={`#${status.latestBlockHeight}`} />
        <StatCard title="Pending Transactions" value={status.pendingTransactions} />
        <StatCard title="Connected Peers" value={status.peers} />
        <StatCard title="Uptime" value={formatUptime(status.uptime)} />
      </div>
    </div>
  );
};
