import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { User, Permission } from '../../../types';
import { UsersIcon, ShieldCheckIcon } from '../../ui/icons';

const PERMISSION_CATEGORIES: Record<string, Permission[]> = {
    'Viewing': ['view:monitoring', 'view:alerts', 'view:logs', 'view:generator', 'view:security', 'view:pipeline', 'view:governance', 'view:staking', 'view:contracts', 'view:team'],
    'Actions': ['action:generate', 'action:scan', 'action:acknowledge_alert', 'action:trigger_pipeline', 'action:approve_pipeline', 'action:rollback_pipeline', 'action:vote', 'action:propose', 'action:stake', 'action:call_contract'],
    'Admin': ['admin:manage_team'],
};


const UserCard: React.FC<{ user: User }> = ({ user }) => {
    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{user.avatar}</span>
                <div>
                    <h3 className="text-xl font-bold text-white">{user.name.split(' ')[0]}</h3>
                    <p className="text-sky-400 font-semibold">{user.role}</p>
                </div>
            </div>
            <div>
                <h4 className="text-md font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <ShieldCheckIcon className="h-5 w-5 text-green-400"/>
                    Permissions
                </h4>
                <div className="space-y-3">
                    {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                        <div key={category}>
                            <p className="text-sm font-bold text-slate-400">{category}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {permissions.map(p => (
                                     <span key={p} className={`text-xs px-2 py-0.5 rounded-full border ${user.permissions.has(p) ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                        {p.split(':')[1]}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export const TeamManagementView: React.FC = () => {
    const { users, currentUser } = useAuth();

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <UsersIcon />
                        Team Management
                    </h2>
                    <p className="text-slate-400">View team members and their assigned roles and permissions.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(user => (
                    <UserCard key={user.id} user={user} />
                ))}
            </div>
        </div>
    );
};
