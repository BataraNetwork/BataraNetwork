import React, { useState, createContext, useContext, useMemo } from 'react';
import { User, Permission } from '../types';
import { generateKeys } from '../utils/crypto';

// --- MOCK DATA ---

const sreLeadKeys = generateKeys();
const devopsKeys = generateKeys();
const developerKeys = generateKeys();
const securityKeys = generateKeys();


const SRE_LEAD_PERMISSIONS: Permission[] = [
    'view:monitoring', 'view:alerts', 'view:logs', 'view:generator', 'view:security', 'view:pipeline', 'view:governance', 'view:staking', 'view:contracts', 'view:team', 'view:api_keys', 'view:audit_trail', 'view:wallet',
    'action:generate', 'action:scan', 'action:acknowledge_alert', 'action:trigger_pipeline', 'action:approve_pipeline', 'action:rollback_pipeline', 'action:vote', 'action:propose', 'action:stake', 'action:send_btr', 'action:call_contract', 'action:deploy_contract', 'action:manage_api_keys',
    'admin:manage_team'
];

const DEVOPS_ENGINEER_PERMISSIONS: Permission[] = [
    'view:monitoring', 'view:alerts', 'view:logs', 'view:generator', 'view:security', 'view:pipeline', 'view:contracts', 'view:wallet',
    'action:generate', 'action:scan', 'action:acknowledge_alert', 'action:trigger_pipeline', 'action:call_contract', 'action:deploy_contract'
];

const DEVELOPER_PERMISSIONS: Permission[] = [
    'view:logs', 'view:pipeline', 'view:contracts', 'view:wallet',
    'action:trigger_pipeline', 'action:call_contract'
];

const SECURITY_ANALYST_PERMISSIONS: Permission[] = [
    'view:monitoring', 'view:alerts', 'view:logs', 'view:security', 'view:audit_trail',
    'action:scan', 'action:acknowledge_alert'
];


const MOCK_USERS: User[] = [
    { id: '1', name: 'Alice (SRE Lead)', role: 'SRE Lead', avatar: '👩‍🚀', permissions: new Set(SRE_LEAD_PERMISSIONS), publicKey: sreLeadKeys.publicKey, privateKey: sreLeadKeys.privateKey },
    { id: '2', name: 'Bob (DevOps)', role: 'DevOps Engineer', avatar: '👷‍♂️', permissions: new Set(DEVOPS_ENGINEER_PERMISSIONS), publicKey: devopsKeys.publicKey, privateKey: devopsKeys.privateKey },
    { id: '3', name: 'Charlie (Developer)', role: 'Developer', avatar: '👨‍💻', permissions: new Set(DEVELOPER_PERMISSIONS), publicKey: developerKeys.publicKey, privateKey: developerKeys.privateKey },
    { id: '4', name: 'Diana (Security)', role: 'Security Analyst', avatar: '🕵️‍♀️', permissions: new Set(SECURITY_ANALYST_PERMISSIONS), publicKey: securityKeys.publicKey, privateKey: securityKeys.privateKey },
];

// --- AUTH CONTEXT ---

interface AuthContextType {
  users: User[];
  currentUser: User;
  switchUser: (userId: string) => void;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUserId, setCurrentUserId] = useState(MOCK_USERS[0].id);

    const currentUser = useMemo(() => MOCK_USERS.find(u => u.id === currentUserId)!, [currentUserId]);

    const switchUser = (userId: string) => {
        if (MOCK_USERS.some(u => u.id === userId)) {
            setCurrentUserId(userId);
        }
    };

    const hasPermission = (permission: Permission) => {
        return currentUser.permissions.has(permission);
    };

    const value = {
        users: MOCK_USERS,
        currentUser,
        switchUser,
        hasPermission
    };

    // FIX: Replaced JSX with React.createElement to be compatible with a .ts file extension. The file was being parsed as TypeScript instead of TSX, causing syntax errors.
    return React.createElement(AuthContext.Provider, { value }, children);
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};