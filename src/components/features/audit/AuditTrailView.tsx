import React, { useState, useMemo } from 'react';
// FIX: The correct type is AuditEvent, not AuditLog.
import { AuditEvent } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';


// FIX: Removed internal mock data hook and updated component to use props.
// This makes the component reusable and allows it to display real audit events passed from App.tsx.
export const AuditTrailView: React.FC<{ events: AuditEvent[] }> = ({ events }) => {
    const { users } = useAuth();
    const [filterUser, setFilterUser] = useState('');

    const filteredLogs = useMemo(() => {
        if (!filterUser) return events;
        return events.filter(log => log.user === filterUser);
    }, [events, filterUser]);
    
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