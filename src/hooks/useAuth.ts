import React, { useState, useContext, createContext, useMemo } from 'react';
import { User, Permission } from '../types';

const DEVOPS_PERMISSIONS: Permission[] = [
    'view:monitoring', 'view:alerts', 'view:logs', 'view:generator', 'view:security', 'view:pipeline', 'view:governance', 'view:staking', 'view:contracts', 'view:team', 'view:audit_trail', 'view:wallet',
    'action:generate', 'action:scan', 'action:acknowledge_alert', 'action:trigger_pipeline', 'action:approve_pipeline', 'action:rollback_pipeline', 'action:stake', 'action:call_contract', 'action:deploy_contract', 'action:send_btr',
];

const DEV_PERMISSIONS: Permission[] = [
    'view:monitoring', 'view:alerts', 'view:logs', 'view:generator', 'view:pipeline', 'view:contracts', 'view:wallet',
    'action:generate', 'action:trigger_pipeline', 'action:call_contract', 'action:send_btr',
];

const AUDITOR_PERMISSIONS: Permission[] = [
    'view:monitoring', 'view:alerts', 'view:logs', 'view:security', 'view:pipeline', 'view:governance', 'view:staking', 'view:contracts', 'view:team', 'view:audit_trail', 'view:wallet',
    'action:scan'
];

const ADMIN_PERMISSIONS: Permission[] = [
    'view:monitoring', 'view:alerts', 'view:logs', 'view:generator', 'view:security', 'view:pipeline', 'view:governance', 'view:staking', 'view:contracts', 'view:team', 'view:api_keys', 'view:audit_trail', 'view:wallet',
    'action:generate', 'action:scan', 'action:acknowledge_alert', 'action:trigger_pipeline', 'action:approve_pipeline', 'action:rollback_pipeline', 'action:vote', 'action:propose', 'action:stake', 'action:call_contract', 'action:deploy_contract', 'action:manage_api_keys', 'action:send_btr',
    'admin:manage_team'
];

const USERS: User[] = [
    { id: '1', name: 'Alice (DevOps)', role: 'DevOps Engineer', avatar: '👩‍💻', permissions: new Set(DEVOPS_PERMISSIONS) },
    { id: '2', name: 'Bob (Developer)', role: 'Developer', avatar: '👨‍💻', permissions: new Set(DEV_PERMISSIONS) },
    { id: '3', name: 'Charlie (Auditor)', role: 'Auditor', avatar: '🕵️‍♀️', permissions: new Set(AUDITOR_PERMISSIONS) },
    { id: '4', name: 'Dana (Admin)', role: 'Administrator', avatar: '👑', permissions: new Set(ADMIN_PERMISSIONS) },
];

interface AuthContextType {
    users: User[];
    currentUser: User;
    setUser: (userId: string) => void;
    hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUserId, setCurrentUserId] = useState(USERS[0].id);

    const currentUser = useMemo(() => USERS.find(u => u.id === currentUserId) || USERS[0], [currentUserId]);

    const hasPermission = (permission: Permission) => {
        return currentUser.permissions.has(permission);
    };

    const value = {
        users: USERS,
        currentUser,
        setUser: setCurrentUserId,
        hasPermission,
    };

    // FIX: Replaced JSX with React.createElement to be compatible with a .ts file extension.
    // This resolves the TS parsing error when encountering the '<' character in JSX.
    return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};