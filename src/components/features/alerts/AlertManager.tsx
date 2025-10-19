import React, { useState, useCallback } from 'react';
import { Alert } from '../../../types';
import { BellIcon, SparklesIcon, ChevronDownIcon, CheckCircleIcon } from '../../ui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { generateRemediationPlan } from '../../../services/geminiService';
import { useApiKey } from '../../../hooks/useApiKey';
import { ApiKeyPrompt } from '../../ui/ApiKeyPrompt';

const AlertCard: React.FC<{
  alert: Alert;
  onResolve: (id: string) => void;
  onGeneratePlan: (alert: Alert) => void;
  isPlanLoading: boolean;
  canAcknowledge: boolean;
}> = ({ alert, onResolve, onGeneratePlan, isPlanLoading, canAcknowledge }) => {
  const styles = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/50',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50',
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${styles[alert.severity]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold">{alert.severity.toUpperCase()}</p>
          <p className="text-slate-300 text-sm mt-1">{alert.message}</p>
          <p className="text-xs text-slate-500 mt-1">
            Node: {alert.nodeId} | Triggered at: {new Date(alert.timestamp).toLocaleString()}
          </p>
        </div>
        {alert.status === 'active' && (
          <button
            onClick={() => onResolve(alert.id)}
            disabled={!canAcknowledge}
            className="text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-md px-3 py-1 ml-4 flex-shrink-0 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Acknowledge
          </button>
        )}
      </div>
      {alert.status === 'active' && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <button
            onClick={() => onGeneratePlan(alert)}
            disabled={isPlanLoading}
            className="text-sm font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 disabled:opacity-50"
          >
            <SparklesIcon className="h-4 w-4" />
            {isPlanLoading ? 'Generating...' : 'Generate AI Remediation Plan'}
          </button>
        </div>
      )}
    </div>
  );
};

const RemediationPlanModal: React.FC<{ plan: string; onClose: () => void, isLoading: boolean }> = ({ plan, onClose, isLoading }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center p-4 border-b border-slate-700">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <SparklesIcon className="text-sky-400" />
          AI-Generated Remediation Plan
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
      </div>
      <div className="p-6 overflow-y-auto">
        {isLoading ? (
            <div className="text-center animate-pulse text-sky-400">Generating plan from alert data...</div>
        ) : (
            <pre className="whitespace-pre-wrap font-sans text-slate-300">{plan}</pre>
        )}
      </div>
    </div>
  </div>
);

export const AlertManager: React.FC<{ alerts: Alert[] }> = ({ alerts: allAlerts }) => {
  const [alerts, setAlerts] = useState(allAlerts);
  const [isPlanModalOpen, setPlanModalOpen] = useState(false);
  const [remediationPlan, setRemediationPlan] = useState('');
  const [isPlanLoading, setPlanLoading] = useState(false);
  const { currentUser } = useAuth();
  const { isApiKeyConfigured } = useApiKey();
  const canAcknowledge = currentUser.permissions.has('action:acknowledge_alert');

  useState(() => {
    setAlerts(allAlerts);
  });

  const handleResolve = (id: string) => {
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, status: 'resolved' } : a)));
  };

  const handleGeneratePlan = useCallback(async (alert: Alert) => {
    if (!isApiKeyConfigured) return;
    setRemediationPlan('');
    setPlanModalOpen(true);
    setPlanLoading(true);
    try {
      const plan = await generateRemediationPlan(alert);
      setRemediationPlan(plan);
    } catch (error: any) {
      setRemediationPlan(`Failed to generate plan: ${error.message}`);
    } finally {
      setPlanLoading(false);
    }
  }, [isApiKeyConfigured]);

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

  return (
    <div>
      {isPlanModalOpen && <RemediationPlanModal plan={remediationPlan} onClose={() => setPlanModalOpen(false)} isLoading={isPlanLoading} />}

      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3"><BellIcon /> Alert Manager</h2>
        <p className="text-slate-400">View and manage active and resolved alerts from all nodes.</p>
      </div>
      
      {!isApiKeyConfigured && <ApiKeyPrompt />}

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Active Alerts ({activeAlerts.length})</h3>
          {activeAlerts.length > 0 ? (
            <div className="space-y-4">
              {activeAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onResolve={handleResolve}
                  onGeneratePlan={handleGeneratePlan}
                  isPlanLoading={isPlanLoading}
                  canAcknowledge={canAcknowledge && isApiKeyConfigured}
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-slate-800/50 border border-slate-700 rounded-lg">
              <p className="text-slate-400">No active alerts. All systems are nominal.</p>
            </div>
          )}
        </div>
        
        <div>
           <details className="bg-slate-800/50 border border-slate-700 rounded-lg">
                <summary className="p-4 cursor-pointer flex justify-between items-center text-xl font-bold text-white">
                    Resolved Alerts ({resolvedAlerts.length})
                    <ChevronDownIcon className="transition-transform duration-200" />
                </summary>
                <div className="p-4 border-t border-slate-700">
                    {resolvedAlerts.length > 0 ? (
                         <div className="space-y-4 max-h-96 overflow-y-auto">
                            {resolvedAlerts.map(alert => (
                                <div key={alert.id} className="p-3 bg-slate-800 rounded-lg flex items-center gap-3">
                                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-slate-400">{alert.message}</p>
                                        <p className="text-xs text-slate-500">Resolved at {new Date(alert.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center py-4">No recently resolved alerts.</p>
                    )}
                </div>
           </details>
        </div>

      </div>
    </div>
  );
};
