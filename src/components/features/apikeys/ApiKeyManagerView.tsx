import React, { useState } from 'react';
import { useApiKeys } from '../../../hooks/useApiKeys';
import { useAuth } from '../../../hooks/useAuth';
import { ApiKey, Permission } from '../../../types';
import { PlusCircleIcon, TrashIcon, ClipboardIcon, CheckIcon, KeyIcon } from '../../ui/icons';

const ApiKeyRow: React.FC<{ 
    apiKey: ApiKey; 
    onRevoke: (id: string) => void;
    canRevoke: boolean;
}> = ({ apiKey, onRevoke, canRevoke }) => {
    return (
        <tr className="border-b border-slate-700 last:border-b-0">
            <td className="p-4 align-top">
                <div className="font-semibold text-white">{apiKey.name}</div>
                <div className="text-xs text-slate-500 font-mono">{apiKey.prefix}...</div>
            </td>
            <td className="p-4 align-top">
                <div className="flex flex-wrap gap-1 max-w-md">
                    {apiKey.scopes.map(scope => (
                        <span key={scope} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full whitespace-nowrap">{scope}</span>
                    ))}
                </div>
            </td>
            <td className="p-4 align-top text-slate-400 text-sm">{apiKey.created}</td>
            <td className="p-4 align-top text-slate-400 text-sm">{apiKey.lastUsed || 'Never'}</td>
            <td className="p-4 align-top">
                <button 
                  onClick={() => onRevoke(apiKey.id)} 
                  disabled={!canRevoke}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                    <TrashIcon /> Revoke
                </button>
            </td>
        </tr>
    );
};

const NewKeyModal: React.FC<{ apiKey: string, onClose: () => void }> = ({ apiKey, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-lg">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-white">API Key Created Successfully</h3>
                    <p className="text-sm text-slate-400 mt-2 mb-4">Please copy this key and store it securely. You will not be able to see it again.</p>
                    <div className="bg-slate-900 border border-slate-600 rounded-md p-3 flex items-center justify-between gap-4">
                        <code className="text-green-400 font-mono break-all">{apiKey}</code>
                        <button onClick={handleCopy} className="p-2 bg-slate-700 rounded-md text-slate-400 hover:bg-slate-600 transition">
                           {copied ? <CheckIcon /> : <ClipboardIcon />}
                        </button>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-700 text-right bg-slate-800/50 rounded-b-lg">
                    <button onClick={onClose} className="bg-sky-600 text-white font-semibold rounded-md px-4 py-2 hover:bg-sky-500 transition">
                        I have copied my key
                    </button>
                </div>
            </div>
        </div>
    );
};


export const ApiKeyManagerView: React.FC<{ logAction: (action: string, details: Record<string, any>) => void }> = ({ logAction }) => {
    const { keys, newlyCreatedKey, createKey, revokeKey, clearNewlyCreatedKey } = useApiKeys();
    const { hasPermission } = useAuth();
    const [keyName, setKeyName] = useState('');
    const [selectedScopes, setSelectedScopes] = useState<Set<Permission>>(new Set());
    const canManage = hasPermission('action:manage_api_keys');

    const PERMISSION_CATEGORIES: { name: string; permissions: Permission[] }[] = [
      {
        name: 'General View',
        permissions: ['view:monitoring', 'view:alerts', 'view:logs', 'view:pipeline', 'view:audit_trail'],
      },
      {
        name: 'Config & Security',
        permissions: ['view:generator', 'view:security', 'action:generate', 'action:scan'],
      },
      {
        name: 'Blockchain Interaction',
        permissions: ['view:wallet', 'view:staking', 'view:governance', 'view:contracts', 'action:send_btr', 'action:stake', 'action:propose', 'action:vote', 'action:call_contract', 'action:deploy_contract'],
      },
      {
        name: 'Administration',
        permissions: ['view:team', 'view:api_keys', 'action:acknowledge_alert', 'action:manage_api_keys', 'admin:manage_team'],
      },
    ];

    const handleScopeChange = (permission: Permission) => {
        setSelectedScopes(prev => {
            const newScopes = new Set(prev);
            if (newScopes.has(permission)) {
                newScopes.delete(permission);
            } else {
                newScopes.add(permission);
            }
            return newScopes;
        });
    };
    
    const handleCreateKey = (e: React.FormEvent) => {
        e.preventDefault();
        if (keyName.trim() && selectedScopes.size > 0 && canManage) {
            const newKey = createKey(keyName, Array.from(selectedScopes));
            logAction('apikey.generated', { keyId: newKey.id, keyName: newKey.name, scopes: newKey.scopes });
            setKeyName('');
            setSelectedScopes(new Set());
        }
    };

    const handleRevokeKey = (id: string) => {
        const keyToRevoke = keys.find(k => k.id === id);
        if (keyToRevoke && canManage) {
            revokeKey(id);
            logAction('apikey.revoked', { keyId: keyToRevoke.id, keyName: keyToRevoke.name });
        }
    };
    
    return (
        <div>
            {newlyCreatedKey && <NewKeyModal apiKey={newlyCreatedKey} onClose={clearNewlyCreatedKey} />}
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3"><KeyIcon /> API Key Management</h2>
                <p className="text-slate-400">Manage API keys for programmatic access to the Bataranetwork.</p>
            </div>
            
            {/* Create Key Form */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
                <h3 className="text-xl font-bold text-white mb-4">Create New API Key</h3>
                <form onSubmit={handleCreateKey}>
                    <div className="mb-4">
                        <label htmlFor="keyName" className="text-sm font-medium text-slate-300 block mb-1">Key Name</label>
                        <input
                            id="keyName"
                            type="text"
                            value={keyName}
                            onChange={(e) => setKeyName(e.target.value)}
                            placeholder="e.g., My Analytics Service"
                            className="w-full sm:w-1/2 bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                            disabled={!canManage}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="text-sm font-medium text-slate-300 block mb-2">Scopes</label>
                        <div className="space-y-4">
                            {PERMISSION_CATEGORIES.map(category => (
                                <div key={category.name}>
                                    <p className="font-semibold text-slate-400 text-sm mb-2">{category.name}</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {category.permissions.map(permission => (
                                            <label key={permission} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedScopes.has(permission)}
                                                    onChange={() => handleScopeChange(permission)}
                                                    disabled={!canManage}
                                                    className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-sky-500 focus:ring-sky-600"
                                                />
                                                <span className="text-sm text-slate-300">{permission}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mt-6 border-t border-slate-700 pt-4">
                        <button 
                            type="submit" 
                            disabled={!keyName.trim() || selectedScopes.size === 0 || !canManage} 
                            className="bg-sky-600 text-white font-semibold rounded-md px-6 py-2.5 hover:bg-sky-500 transition-colors flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed"
                            title={!canManage ? "You don't have permission to create keys." : ''}
                        >
                            <PlusCircleIcon />
                            Create New Key
                        </button>
                    </div>
                </form>
            </div>

            {/* Existing Keys Table */}
            <h3 className="text-xl font-bold text-white mb-4">Existing Keys</h3>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-800 text-left text-slate-400">
                        <tr>
                            <th className="p-4 font-semibold">Name</th>
                            <th className="p-4 font-semibold">Scopes</th>
                            <th className="p-4 font-semibold">Created</th>
                            <th className="p-4 font-semibold">Last Used</th>
                            <th className="p-4 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {keys.map(key => <ApiKeyRow key={key.id} apiKey={key} onRevoke={handleRevokeKey} canRevoke={canManage} />)}
                    </tbody>
                </table>
                 {keys.length === 0 && <p className="text-center p-8 text-slate-500">No API keys have been created.</p>}
            </div>
        </div>
    );
};
