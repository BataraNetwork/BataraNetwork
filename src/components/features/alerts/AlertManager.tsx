import React, { useState, useMemo } from 'react';
import { Alert } from '../../../types';
import { CheckCircleIcon, FilterIcon, SparklesIcon } from '../../ui/icons';
import { generateRemediationPlan } from '../../../services/geminiService';

type AlertStatusFilter = 'all' | 'active' | 'acknowledged';
type AlertSeverityFilter = 'all' | 'critical' | 'warning';

interface AlertManagerProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
  nodes: { id: string; name: string }[];
}

const getSeverityStyles = (severity: Alert['severity']) => {
  switch (severity) {
    case 'critical':
      return { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-400' };
    case 'warning':
    default:
      return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', text: 'text-yellow-400' };
  }
};

const getStatusStyles = (status: Alert['status']) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-yellow-500/10', text: 'text-yellow-400' };
      case 'acknowledged':
      default:
        return { bg: 'bg-green-500/10', text: 'text-green-400' };
    }
  };

export const AlertManager: React.FC<AlertManagerProps> = ({ alerts, onAcknowledge, nodes }) => {
    const [statusFilter, setStatusFilter] = useState<AlertStatusFilter>('all');
    const [severityFilter, setSeverityFilter] = useState<AlertSeverityFilter>('all');
    const [selectedAlertForPlan, setSelectedAlertForPlan] = useState<Alert | null>(null);
    const [remediationPlan, setRemediationPlan] = useState<string>('');
    const [isLoadingPlan, setIsLoadingPlan] = useState(false);
    
    const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n.name])), [nodes]);

    const filteredAlerts = useMemo(() => {
        return alerts.filter(alert => {
            const statusMatch = statusFilter === 'all' || alert.status === statusFilter;
            const severityMatch = severityFilter === 'all' || alert.severity === severityFilter;
            return statusMatch && severityMatch;
        });
    }, [alerts, statusFilter, severityFilter]);

    const handleGeneratePlan = async (alert: Alert) => {
        setSelectedAlertForPlan(alert);
        setIsLoadingPlan(true);
        setRemediationPlan('');
        try {
            const plan = await generateRemediationPlan(alert);
            setRemediationPlan(plan);
        } catch (error: any) {
            setRemediationPlan(`Failed to generate remediation plan: ${error.message}`);
        } finally {
            setIsLoadingPlan(false);
        }
    };

    const closeModal = () => {
        setSelectedAlertForPlan(null);
        setRemediationPlan('');
    };

    const RemediationModal = () => {
      if (!selectedAlertForPlan) return null;
  
      return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
              <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center p-4 border-b border-slate-700">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <SparklesIcon className="text-sky-400" />
                          AI-Generated Remediation Plan
                      </h3>
                      <button onClick={closeModal} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                      {isLoadingPlan ? (
                          <div className="text-center">
                              <p className="animate-pulse text-sky-400">Generating plan...</p>
                              <p className="text-sm text-slate-500 mt-2">The AI is analyzing the alert and crafting a response.</p>
                          </div>
                      ) : (
                          <pre className="whitespace-pre-wrap font-sans text-slate-300">{remediationPlan}</pre>
                      )}
                  </div>
                  <div className="p-4 border-t border-slate-700 text-right">
                      <button onClick={closeModal} className="bg-slate-700 text-white font-semibold rounded-md px-4 py-2 hover:bg-slate-600 transition-colors">
                          Close
                      </button>
                  </div>
              </div>
          </div>
      );
  };


  return (
    <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h2 className="text-3xl font-bold text-white">Alert Management</h2>
                <p className="text-slate-400">View and acknowledge system-wide alerts.</p>
            </div>
        </div>
        
        <div className="p-3 mb-4 bg-sky-500/10 text-sky-400 border border-sky-500/50 rounded-lg text-sm" role="status">
            <p>
                <span className="font-semibold">Auto-Acknowledge Active:</span> Alerts are automatically acknowledged when the associated node becomes healthy or after 1 hour of inactivity.
            </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4 flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 flex-wrap">
                <FilterIcon className="text-slate-400" />
                <span className="text-sm font-semibold mr-2">Status:</span>
                {(['all', 'active', 'acknowledged'] as AlertStatusFilter[]).map(status => (
                    <button key={status} onClick={() => setStatusFilter(status)}
                        className={`text-xs px-3 py-1 rounded-full border transition capitalize ${statusFilter === status ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'bg-slate-700/50 border-slate-700 text-slate-400'}`}>
                        {status}
                    </button>
                ))}
            </div>
             <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold mr-2">Severity:</span>
                {(['all', 'critical', 'warning'] as AlertSeverityFilter[]).map(sev => (
                    <button key={sev} onClick={() => setSeverityFilter(sev)}
                        className={`text-xs px-3 py-1 rounded-full border transition capitalize ${severityFilter === sev ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'bg-slate-700/50 border-slate-700 text-slate-400'}`}>
                        {sev}
                    </button>
                ))}
            </div>
        </div>

        {/* Alerts Table */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-x-auto">
            <table className="min-w-full">
                <thead className="bg-slate-800">
                    <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-slate-300">Severity</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-slate-300">Status</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-slate-300">Node</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-slate-300">Message</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-slate-300">Timestamp</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {filteredAlerts.map(alert => (
                        <tr key={alert.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 px-4">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${getSeverityStyles(alert.severity).bg} ${getSeverityStyles(alert.severity).text}`}>
                                    {alert.severity}
                                </span>
                            </td>
                             <td className="py-3 px-4">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusStyles(alert.status).bg} ${getStatusStyles(alert.status).text}`}>
                                    {alert.status}
                                </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-300">{nodeMap.get(alert.nodeId) || alert.nodeId}</td>
                            <td className="py-3 px-4 text-sm text-slate-300">{alert.message}</td>
                            <td className="py-3 px-4 text-sm text-slate-400">{new Date(alert.timestamp).toLocaleString()}</td>
                            <td className="py-3 px-4">
                               <div className="flex items-center gap-4">
                                {alert.status === 'active' && (
                                    <button onClick={() => onAcknowledge(alert.id)} className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300 transition" title="Acknowledge">
                                        <CheckCircleIcon />
                                        Ack
                                    </button>
                                )}
                                {alert.status === 'active' && (
                                    <button onClick={() => handleGeneratePlan(alert)} className="flex items-center gap-1 text-sm text-sky-400 hover:text-sky-300 transition" title="Generate AI Remediation Plan">
                                        <SparklesIcon />
                                        AI Plan
                                    </button>
                                )}
                               </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {filteredAlerts.length === 0 && (
                <div className="text-center p-8 text-slate-500">
                    <p>No alerts match the current filters.</p>
                </div>
            )}
        </div>
        {selectedAlertForPlan && <RemediationModal />}
    </div>
  );
};