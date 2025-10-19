import { useState, useCallback } from 'react';
import { ApiKey } from '../types';
import crypto from 'crypto';

const generateApiKey = (prefix: string) => {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `${prefix}_${randomBytes}`;
};

const MOCK_API_KEYS: ApiKey[] = [
    { 
        id: '1', 
        name: 'Monitoring Bot', 
        prefix: 'btrmon',
        lastUsed: new Date(Date.now() - 1000 * 60 * 5).toLocaleString(), // 5 minutes ago
        created: new Date('2023-10-01').toLocaleString(),
        scopes: ['read:monitoring', 'read:logs']
    },
    { 
        id: '2', 
        name: 'CI/CD Runner', 
        prefix: 'btrci',
        lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 2).toLocaleString(), // 2 hours ago
        created: new Date('2023-09-15').toLocaleString(),
        scopes: ['action:trigger_pipeline', 'read:pipeline_status']
    },
    {
        id: '3',
        name: 'Stale Key',
        prefix: 'btrstale',
        lastUsed: null,
        created: new Date('2023-01-20').toLocaleString(),
        scopes: ['read:all']
    }
];

export const useApiKeys = () => {
    const [keys, setKeys] = useState<ApiKey[]>(MOCK_API_KEYS);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

    const createKey = useCallback((name: string, scopes: string[]) => {
        const prefix = `btr_${name.toLowerCase().replace(/\s/g, '').slice(0, 4)}`;
        const fullKey = generateApiKey(prefix);
        const newKey: ApiKey = {
            id: crypto.randomUUID(),
            name,
            prefix,
            lastUsed: null,
            created: new Date().toLocaleString(),
            scopes,
        };
        setKeys(prev => [newKey, ...prev]);
        setNewlyCreatedKey(fullKey); // Show the full key only once upon creation
    }, []);

    const revokeKey = useCallback((id: string) => {
        setKeys(prev => prev.filter(key => key.id !== id));
    }, []);
    
    const clearNewlyCreatedKey = useCallback(() => {
        setNewlyCreatedKey(null);
    }, []);

    return { keys, newlyCreatedKey, createKey, revokeKey, clearNewlyCreatedKey };
};
