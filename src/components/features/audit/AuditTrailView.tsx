import React, { useState, useMemo } from 'react';
import { AuditLog } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';

// Mock hook for audit trail data
const useAuditTrail = () => {
    const [logs] = useState<AuditLog[]>([
        { id: '1', user: 'Alice (SRE)', action: 'Triggered Pipeline', timestamp: new Date(Date.now() - 3600000).toLocaleString(), details: { runId: 101 } },
        { id: '2', user: 'Bob (Developer)', action: 'Generated Config', timestamp: new Date(Date.now() - 7200000).toLocaleString(), details: { type: 'Dockerfile' } },
        { id: '3', user: 'Dana (Admin)', action: 'Revoked API Key', timestamp: new Date(Date.now() - 86400000).toLocaleString(), details: { keyName: 'Stale Key' } },
        { id: '4', user: 'Charlie (Auditor)', action: 'Ran Security Scan', timestamp: new Date(Date.now() - 172800000).toLocaleString(), details: { findings: 2 } },
        { id: '5', user: 'Alice (SRE)', action: 'Approved Pipeline Stage', timestamp: new Date(Date.now() - 345600000).toLocaleString(), details: { runId: 98, stage: 'Deploy to Production' } },
        { id: '6', user: 'Dana (Admin)', action: 'Voted on Proposal', timestamp: new Date(Date.now() - 604800000).toLocaleString(), details: { proposalId: 'BIP-42', vote: 'yes' } },
    ]);
    return { logs };
};


export const AuditTrailView: React.FC = () => {
    const { logs } = useAuditTrail();
    const { users } = useAuth();
    const [filterUser, setFilterUser] = useState('');

    const filteredLogs = useMemo(() => {
        if (!filterUser) return logs;
        return logs.filter(log => log.user === filterUser);
    }, [logs, filterUser]);
    
    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white">Audit Trail</h2>
                <p className="text-slate-400">Chronological log of all actions performed within the dashboard.</p>
            </div>
            
            <div className="mb-4">
                <label htmlFor="user-filter" className="text-sm text-slate-400 mr-2">Filter by User:</label>
                <select 
                    id="user-filter"
                    value={filterUser}
                    onChange={e => setFilterUser(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                    <option value="">All Users</option>
                    {users.map(user => <option key={user.id} value={user.name}>{user.name}</option>)}
                </select>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-800 text-left text-slate-400">
                        <tr>
                            <th className="p-4 font-semibold">Timestamp</th>
                            <th className="p-4 font-semibold">User</th>
                            <th className="p-4 font-semibold">Action</th>
                            <th className="p-4 font-semibold">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map(log => (
                            <tr key={log.id} className="border-b border-slate-700 last:border-b-0">
                                <td className="p-4 text-slate-400">{log.timestamp}</td>
                                <td className="p-4 font-semibold text-white">{log.user}</td>
                                <td className="p-4 text-sky-400">{log.action}</td>
                                <td className="p-4 font-mono text-slate-300 text-xs">
                                    {JSON.stringify(log.details)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
