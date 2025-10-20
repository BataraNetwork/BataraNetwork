import { useState, useEffect } from 'react';
import { NodeStatus, Alert } from '../types';
import { nodeService } from '../services/nodeService';

// This is now just a static definition for the UI, real data comes from backend.
const MOCK_NODE_META = { id: 'node-live-1', name: 'Primary Node', region: 'local', peers: 0 };

/**
 * A React hook for fetching and managing the real-time status of the Bataranetwork node.
 * It polls the backend node's `/status` endpoint at a regular interval to provide live updates.
 *
 * @returns An object containing:
 * - `status`: The latest `NodeStatus` object with live metrics.
 * - `alerts`: An array of active and resolved alerts (currently simulated).
 * - `history`: A time-series array of recent metrics for charting.
 * - `isLoading`: A boolean indicating if the initial fetch is in progress.
 * - `error`: A string containing any error message from failing to connect to the node.
 */
export const useNodeStatus = () => {
  const [status, setStatus] = useState<NodeStatus | undefined>(undefined);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const liveStatus = await nodeService.getStatus();
        
        // The backend now provides all necessary metrics directly.
        // We only add UI-specific metadata here.
        const newStatus: NodeStatus = {
            ...MOCK_NODE_META,
            latestBlockHeight: liveStatus.latestBlockHeight,
            pendingTransactions: liveStatus.pendingTransactions,
            uptime: liveStatus.uptime,
            cpuUsage: liveStatus.cpuUsage,
            memoryUsage: liveStatus.memoryUsage,
            // These metrics are not yet on the backend, so we simulate them lightly.
            networkIo: {
                ingress: Math.floor(Math.random() * 500 + 100),
                egress: Math.floor(Math.random() * 200 + 50)
            },
            dbSize: parseFloat(((status?.dbSize || 500) + 0.01).toFixed(2)),
            healthStatus: 'ok', // Assume 'ok' if we get a response
        };

        setStatus(newStatus);
        
        setHistory(prev => [...prev.slice(-29), {
            time: new Date().toLocaleTimeString(),
            cpuUsage: newStatus.cpuUsage,
            memoryUsage: newStatus.memoryUsage,
            networkIo: newStatus.networkIo,
        }]);

        setError(null);

      } catch (e: any) {
        setError("Failed to connect to the Bataranetwork node. Is it running?");
        console.error(e);
      } finally {
          setIsLoading(false);
      }
    };

    fetchStatus(); // Initial fetch
    const interval = setInterval(fetchStatus, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [status?.dbSize]); // Depend on dbSize to update it based on previous state

  return { 
    status,
    alerts: alerts.sort((a,b) => b.timestamp - a.timestamp),
    history,
    isLoading,
    error,
    // The node switcher is now disabled as we connect to one live node.
    availableNodes: [MOCK_NODE_META],
    activeNodeId: MOCK_NODE_META.id,
    setActiveNodeId: () => {},
  };
};
