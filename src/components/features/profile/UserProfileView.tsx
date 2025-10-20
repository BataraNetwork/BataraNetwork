import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { User, Permission } from '../../../types';
import { ShieldCheckIcon } from '../../ui/icons';

const PERMISSION_CATEGORIES: Record<string, Permission[]> = {
    'Viewing': ['view:monitoring', 'view:alerts', 'view:logs', 'view:generator', 'view:security', 'view:pipeline', 'view:governance', 'view:staking', 'view:contracts', 'view:team'],
    'Actions': ['action:generate', 'action:scan', 'action:acknowledge_alert', 'action:trigger_pipeline', 'action:approve_pipeline', 'action:rollback_pipeline', 'action:vote', 'action:propose', 'action:stake', 'action:call_contract'],
    'Admin': ['admin:manage_team'],
};

export const UserProfileView: React.FC = () => {
    const { currentUser } = useAuth();

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white">My Profile</h2>
                <p className="text-slate-400">Your current role and permissions within the dashboard.</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 max-w-2xl">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700">
                    <span className="text-6xl">{currentUser.avatar}</span>
                    <div>
                        <h3 className="text-2xl font-bold text-white">{currentUser.name}</h3>
                        <p className="text-sky-400 font-semibold text-lg">{currentUser.role}</p>
                    </div>
                </div>
                <div>
                    <h4 className="text-xl font-semibold text-slate-300 mb-4 flex items-center gap-2">
                        <ShieldCheckIcon className="h-6 w-6 text-green-400"/>
                        Your Permissions
                    </h4>
                    <div className="space-y-4">
                        {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                            <div key={category}>
                                <p className="text-md font-bold text-slate-400">{category}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {permissions.map(p => (
                                         <span key={p} className={`text-sm px-3 py-1 rounded-full border ${currentUser.permissions.has(p) ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                            {p.split(':')[1]}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
