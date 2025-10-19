import React, { useState, useContext, createContext, useMemo } from 'react';
import { User, Permission } from '../types';

const SRE_PERMISSIONS: Permission[] = [
    'view:monitoring', 'view:alerts', 'view:logs', 'view:generator', 'view:security', 'view:pipeline', 'view:governance', 'view:staking', 'view:contracts', 'view:team',
    'action:generate', 'action:scan', 'action:acknowledge_alert', 'action:trigger_pipeline', 'action:approve_pipeline', 'action:rollback_pipeline',
];

const DEV_PERMISSIONS: Permission[] = [
    'view:monitoring', 'view:alerts', 'view:logs', 'view:generator', 'view:pipeline', 'view:contracts',
    'action:generate', 'action:trigger_pipeline', 'action:call_contract'
];

const AUDITOR_PERMISSIONS: Permission[] = [
    'view:monitoring', 'view:alerts', 'view:logs', 'view:security', 'view:pipeline', 'view:governance', 'view:staking', 'view:contracts', 'view:team',
    'action:scan'
];

const ADMIN_PERMISSIONS: Permission[] = [
    'view:monitoring', 'view:alerts', 'view:logs', 'view:generator', 'view:security', 'view:pipeline', 'view:governance', 'view:staking', 'view:contracts', 'view:team',
    'action:generate', 'action:scan', 'action:acknowledge_alert', 'action:trigger_pipeline', 'action:approve_pipeline', 'action:rollback_pipeline', 'action:vote', 'action:propose', 'action:stake', 'action:call_contract',
    'admin:manage_team'
];

const USERS: User[] = [
    { id: '1', name: 'Alice (SRE)', role: 'SRE', avatar: '👩‍💻', permissions: new Set(SRE_PERMISSIONS) },
    { id: '2', name: 'Bob (Developer)', role: 'Developer', avatar: '👨‍💻', permissions: new Set(DEV_PERMISSIONS) },
    { id: '3', name: 'Charlie (Auditor)', role: 'Auditor', avatar: '🕵️‍♀️', permissions: new Set(AUDITOR_PERMISSIONS) },
    { id: '4', name: 'Dana (Admin)', role: 'Admin', avatar: '👑', permissions: new Set(ADMIN_PERMISSIONS) },
];

interface AuthContextType {
    users: User[];
    currentUser: User;
    setUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUserId, setCurrentUserId] = useState(USERS[0].id);

    const currentUser = useMemo(() => USERS.find(u => u.id === currentUserId) || USERS[0], [currentUserId]);

    const value = {
        users: USERS,
        currentUser,
        setUser: setCurrentUserId,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
