import React from 'react';
import { Alert, NodeStatus } from '../../../types';
import { BellIcon, CheckCircleIcon, AlertTriangleIcon, XCircleIcon, SparklesIcon } from '../../ui/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

interface MonitoringDashboardProps {
  status: NodeStatus | undefined;
  alerts: Alert[];
  history: any[];
  isLoading: boolean;
  error: string | null;
  availableNodes: { id: string, name: string, region: string }[];
  activeNodeId: string;
  setActiveNodeId: (id: string) => void;
  analysis: string | null;
  isAnalyzing: boolean;
}

const formatUptime = (seconds: number): string => {
  if (seconds < 60) return `${Math.floor(seconds)}s`;

  const days = Math.floor(seconds / (24 * 3600));
  seconds %= (24 * 3600);
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

  return parts.join(' ');
};


const HealthStatusIndicator: React.FC<{ status: NodeStatus['healthStatus']; uptime: number; }> = ({ status, uptime }) => {
  // FIX: Replaced `JSX.Element` with `React.ReactNode` to resolve "Cannot find namespace 'JSX'" error.
  const styles: Record<NodeStatus['healthStatus'], { text: string; icon: React.ReactNode; label: string }> = {
    ok: { text: 'text-green-400', icon: <CheckCircleIcon className="h-5 w-5" />, label: 'Healthy' },
    degraded: { text: 'text-yellow-400', icon: <AlertTriangleIcon className="h-5 w-5" />, label: 'Degraded' },
    unreachable: { text: 'text-red-400', icon: <XCircleIcon className="h-5 w-5" />, label: 'Unreachable' },
  };

  const currentStyle = styles[status];

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${currentStyle.text} bg-slate-800/60 border border-slate-700`}>
      {currentStyle.icon}
      <span>{currentStyle.label}</span>
      <span className="text-slate-500 font-normal">|</span>
      <span className="font-normal text-slate-400">{formatUptime(uptime)} uptime</span>
    </div>
  );
};

const AnomalyInsightCard: React.FC<{ analysis: string | null, isAnalyzing: boolean }> = ({ analysis, isAnalyzing }) => {
    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="text-sky-400" />
                <h3 className="text-xl font-bold text-white">AI Anomaly Insights</h3>
            </div>
            {isAnalyzing && !analysis && (
                <div className="text-center text-slate-500 py-4 animate-pulse">
                    AI is analyzing metric patterns...
                </div>
            )}
            {analysis && (
                 <div className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{analysis}</div>
            )}
             {!isAnalyzing && !analysis && (
                <div className="text-center text-slate-500 py-4">
                    No unusual metric patterns detected. System operating within normal parameters.
                </div>
             )}
        </div>
    );
};


const StatCard: React.FC<{ title: string; value: string | number; unit?: string }> = ({ title, value, unit }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 sm:p-6 transition-transform duration-200 hover:scale-105 hover:bg-slate-700/50">
    <p className="text-sm text-slate-400">{title}</p>
    <p className="text-3xl font-bold text-white mt-1">
      {value} <span className="text-lg text-slate-400">{unit}</span>
    </p>
  </div>
);

const AlertCard: React.FC<{ alert: Alert }> = ({ alert }) => (
    <div className={`p-3 rounded-lg border ${alert.severity === 'critical' ? 'bg-red-500/10 border-red-500/50' : 'bg-yellow-500/10 border-yellow-500/50'}`}>
        <p className={`font-bold text-sm ${alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}>{alert.severity.toUpperCase()}</p>
        <p className="text-slate-300 text-sm">{alert.message}</p>
        <p className="text-xs text-slate-500 mt-1">{new Date(alert.timestamp).toLocaleTimeString()}</p>
    </div>
);

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ status, alerts, history, isLoading, error, availableNodes, activeNodeId, setActiveNodeId, analysis, isAnalyzing }) => {
  if (isLoading && !status) {
    return <div className="text-center p-8 text-slate-400">Connecting to Bataranetwork node...</div>;
  }

  if (error || !status) {
    return <div className="text-center p-8 text-red-400 bg-red-500/10 rounded-lg">{error || "Could not load node status."}</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
                <h2 className="text-3xl font-bold text-white">Node Monitoring</h2>
                <p className="text-slate-400">Real-time enterprise metrics and alerts for the Bataranetwork.</p>
            </div>
            <HealthStatusIndicator status={status.healthStatus} uptime={status.uptime} />
        </div>
        <div className="flex-shrink-0 w-full sm:w-auto">
            <label htmlFor="node-selector" className="sr-only">Select a node</label>
            <select
                id="node-selector"
                value={activeNodeId}
                onChange={(e) => setActiveNodeId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition disabled:opacity-70 disabled:cursor-not-allowed"
                disabled // Disabled as we are now connected to a single live node
            >
                {availableNodes.map(node => (
                    <option key={node.id} value={node.id}>
                        {node.name} ({node.region}) - Live
                    </option>
                ))}
            </select>
        </div>
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metrics & Alerts */}
        <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-6">
                <StatCard title="Block Height" value={`#${status.latestBlockHeight}`} />
                <StatCard title="Pending TXs" value={status.pendingTransactions} />
                <StatCard title="CPU Usage" value={status.cpuUsage} unit="%" />
                <StatCard title="Memory Usage" value={status.memoryUsage} unit="%" />
                <StatCard title="DB Size" value={status.dbSize} unit="MB" />
                <StatCard title="Peers" value={status.peers} />
            </div>
            {/* AI Anomaly Insights */}
            <AnomalyInsightCard analysis={analysis} isAnalyzing={isAnalyzing} />
            {/* Active Alerts */}
             <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <BellIcon className="text-yellow-400" />
                    <h3 className="text-xl font-bold text-white">Active Alerts</h3>
                </div>
                {alerts.filter(a => a.status === 'active').length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {alerts.filter(a => a.status === 'active').map(alert => <AlertCard key={alert.id} alert={alert} />)}
                    </div>
                ) : (
                    <p className="text-center text-slate-500 py-4">No active alerts.</p>
                )}
            </div>
        </div>

        {/* Right Column: Charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
             <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 h-80">
                 <h3 className="text-xl font-bold text-white mb-4">CPU & Memory Usage (%)</h3>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                        <Legend wrapperStyle={{fontSize: "14px"}}/>
                        <Area type="monotone" dataKey="cpuUsage" stackId="1" stroke="#38bdf8" fill="#0ea5e9" fillOpacity={0.3} name="CPU" />
                        <Area type="monotone" dataKey="memoryUsage" stackId="1" stroke="#eab308" fill="#facc15" fillOpacity={0.3} name="Memory" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
             <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 h-80">
                 <h3 className="text-xl font-bold text-white mb-4">Network I/O (kbps)</h3>
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                        <Legend wrapperStyle={{fontSize: "14px"}}/>
                        <Line type="monotone" dataKey="networkIo.ingress" stroke="#22c55e" name="Ingress" />
                        <Line type="monotone" dataKey="networkIo.egress" stroke="#ef4444" name="Egress" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};