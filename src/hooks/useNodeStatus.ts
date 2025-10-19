import { useState, useEffect } from 'react';
import { NodeStatus, Alert } from '../types';

// Mock data for multiple nodes
const initialNodesData: Omit<NodeStatus, 'latestBlockHeight' | 'pendingTransactions' | 'uptime' | 'cpuUsage' | 'memoryUsage' | 'networkIo' | 'dbSize' | 'healthStatus'>[] = [
  { id: 'node-us-east-1', name: 'Primary Node', region: 'us-east-1', peers: 8 },
  { id: 'node-eu-west-1', name: 'Failover Node', region: 'eu-west-1', peers: 12 },
  { id: 'node-ap-south-1', name: 'Staging Node', region: 'ap-south-1', peers: 4 },
];

const generateInitialState = (): Record<string, NodeStatus> => {
    const map: Record<string, NodeStatus> = {};
    initialNodesData.forEach(node => {
        map[node.id] = {
            ...node,
            latestBlockHeight: Math.floor(Math.random() * 500) + 1000,
            pendingTransactions: Math.floor(Math.random() * 20),
            uptime: Math.floor(Math.random() * 3600 * 24 * 7),
            cpuUsage: Math.floor(Math.random() * 30) + 10,
            memoryUsage: Math.floor(Math.random() * 40) + 20,
            networkIo: { ingress: 0, egress: 0 },
            dbSize: Math.floor(Math.random() * 1000) + 200,
            healthStatus: 'ok',
        };
    });
    return map;
}

export const useNodeStatus = () => {
  const [nodes, setNodes] = useState<Record<string, NodeStatus>>(generateInitialState);
  const [activeNodeId, setActiveNodeId] = useState<string>(initialNodesData[0].id);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(prevNodes => {
        const activeNode = prevNodes[activeNodeId];
        if (!activeNode) return prevNodes;

        // Simulate metric fluctuations
        const cpuF = Math.random() > 0.5 ? 1 : -1;
        const memF = Math.random() > 0.5 ? 1 : -1;
        const newCpu = Math.min(100, Math.max(5, activeNode.cpuUsage + cpuF * (Math.random() * 5)));
        const newMem = Math.min(100, Math.max(10, activeNode.memoryUsage + memF * (Math.random() * 3)));
        
        // Check for new alerts
        setAlerts(prevAlerts => {
            let currentAlerts = [...prevAlerts];
            const hasCpuAlert = currentAlerts.some(a => a.id === `${activeNodeId}-cpu`);
            const hasMemAlert = currentAlerts.some(a => a.id === `${activeNodeId}-mem`);

            if (newCpu > 85 && !hasCpuAlert) {
                currentAlerts.push({ id: `${activeNodeId}-cpu`, nodeId: activeNodeId, severity: 'critical', message: `High CPU usage detected: ${newCpu.toFixed(1)}%`, timestamp: Date.now(), status: 'active' });
            } else if (newCpu <= 85 && hasCpuAlert) {
                currentAlerts = currentAlerts.filter(a => a.id !== `${activeNodeId}-cpu`);
            }
            
            if (newMem > 80 && !hasMemAlert) {
                currentAlerts.push({ id: `${activeNodeId}-mem`, nodeId: activeNodeId, severity: 'warning', message: `High Memory usage detected: ${newMem.toFixed(1)}%`, timestamp: Date.now(), status: 'active' });
            } else if (newMem <= 80 && hasMemAlert) {
                currentAlerts = currentAlerts.filter(a => a.id !== `${activeNodeId}-mem`);
            }
            return currentAlerts;
        });
        
        // Simulate health status change
        const rand = Math.random();
        let newHealthStatus: NodeStatus['healthStatus'] = activeNode.healthStatus;
        // If ok, small chance to degrade or fail
        if (activeNode.healthStatus === 'ok') {
            if (rand > 0.98) {
                newHealthStatus = 'unreachable';
            } else if (rand > 0.95) {
                newHealthStatus = 'degraded';
            }
        } else { // If not ok, higher chance to recover
            if (rand > 0.3) {
                newHealthStatus = 'ok';
            }
        }

        const updatedNode = {
            ...activeNode,
            latestBlockHeight: activeNode.latestBlockHeight + 1,
            pendingTransactions: Math.max(0, Math.floor(Math.random() * 10 - 4) + activeNode.pendingTransactions),
            uptime: activeNode.uptime + 2,
            cpuUsage: parseFloat(newCpu.toFixed(1)),
            memoryUsage: parseFloat(newMem.toFixed(1)),
            networkIo: {
                ingress: Math.floor(Math.random() * 500 + 100),
                egress: Math.floor(Math.random() * 200 + 50)
            },
            dbSize: parseFloat((activeNode.dbSize + 0.01).toFixed(2)),
            healthStatus: newHealthStatus,
        };

        setHistory(prev => [...prev.slice(-29), {
            time: new Date().toLocaleTimeString(),
            cpuUsage: updatedNode.cpuUsage,
            memoryUsage: updatedNode.memoryUsage,
            networkIo: updatedNode.networkIo,
        }]);

        return { ...prevNodes, [activeNodeId]: updatedNode };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [activeNodeId]);

  return { 
    status: nodes[activeNodeId], 
    nodes,
    alerts: alerts.filter(a => a.nodeId === activeNodeId).sort((a,b) => b.timestamp - a.timestamp),
    history,
    isLoading: !nodes[activeNodeId], 
    error: null,
    availableNodes: initialNodesData,
    activeNodeId,
    setActiveNodeId,
  };
};