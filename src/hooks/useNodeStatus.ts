import { useState, useEffect } from 'react';
import { NodeStatus } from '../types';

// Mock data for demonstration purposes
const initialStatus: NodeStatus = {
  latestBlockHeight: 1024,
  pendingTransactions: 5,
  peers: 8,
  version: 'v0.2.1',
  uptime: 3600 * 24 * 2, // 2 days in seconds
};

export const useNodeStatus = () => {
  const [status, setStatus] = useState<NodeStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate initial fetch
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 500);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setStatus(prevStatus => ({
        ...prevStatus,
        latestBlockHeight: prevStatus.latestBlockHeight + 1,
        pendingTransactions: Math.max(0, Math.floor(Math.random() * 10 - 2) + prevStatus.pendingTransactions),
        uptime: prevStatus.uptime + 5
      }));
    }, 5000); // Update every 5 seconds

    return () => {
        clearTimeout(timer);
        clearInterval(interval);
    };
  }, []);

  return { status, isLoading, error };
};
