import { useState, useCallback } from 'react';
import { ApiKey } from '../types';
import { randomBytes, randomUUID } from 'crypto';

const generateApiKeyString = (prefix: string) => {
    const randomPart = randomBytes(16).toString('hex');
    return `${prefix}_${randomPart}`;
};

const MOCK_API_KEYS: ApiKey[] = [
    { 
        id: 'mock-key-1', 
        name: 'Monitoring Bot', 
        prefix: 'btrmon',
        lastUsed: new Date(Date.now() - 1000 * 60 * 5).toLocaleString(), // 5 minutes ago
        created: new Date('2023-10-01').toLocaleString(),
        scopes: ['read:monitoring', 'read:logs']
    },
    { 
        id: 'mock-key-2', 
        name: 'CI/CD Runner', 
        prefix: 'btrci',
        lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 2).toLocaleString(), // 2 hours ago
        created: new Date('2023-09-15').toLocaleString(),
        scopes: ['action:trigger_pipeline', 'read:pipeline_status']
    },
];

export const useApiKeys = () => {
    const [keys, setKeys] = useState<ApiKey[]>(MOCK_API_KEYS);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

    const createKey = useCallback((name: string, scopes: string[]): ApiKey => {
        const prefix = `btr_${name.toLowerCase().replace(/\s/g, '').slice(0, 4)}`;
        const fullKey = generateApiKeyString(prefix);
        const newKey: ApiKey = {
            id: randomUUID(),
            name,
            prefix,
            lastUsed: null,
            created: new Date().toLocaleString(),
            scopes,
        };
        setKeys(prev => [newKey, ...prev]);
        setNewlyCreatedKey(fullKey); // Show the full key only once upon creation
        return newKey;
    }, []);

    const revokeKey = useCallback((id: string) => {
        setKeys(prev => prev.filter(key => key.id !== id));
    }, []);
    
    const clearNewlyCreatedKey = useCallback(() => {
        setNewlyCreatedKey(null);
    }, []);

    return { keys, newlyCreatedKey, createKey, revokeKey, clearNewlyCreatedKey };
};