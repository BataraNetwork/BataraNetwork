// FIX: Created missing ContractView.tsx file.
import React, { useState, useEffect, useCallback } from 'react';
import { useSmartContracts } from '../../../hooks/useSmartContracts';
import { useAuth } from '../../../hooks/useAuth';
import { DeployedContract } from '../../../types';
import { FilePlusIcon, CodeBracketIcon, PlayCircleIcon, CubeIcon } from '../../ui/icons';

const DeployContractForm: React.FC<{
    onDeploy: (code: string, initialState?: Record<string, any>) => Promise<{ success: boolean, message: string }>;
    canDeploy: boolean;
}> = ({ onDeploy, canDeploy }) => {
    const [code, setCode] = useState('');
    const [initialState, setInitialState] = useState('');
    const [error, setError] = useState('');
    const [isDeploying, setIsDeploying] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        let parsedState;
        try {
            parsedState = initialState ? JSON.parse(initialState) : undefined;
        } catch {
            setError('Invalid JSON for initial state.');
            return;
        }
        setIsDeploying(true);
        const result = await onDeploy(code, parsedState);
        if (!result.success) {
            setError(result.message);
        } else {
            setCode('');
            setInitialState('');
        }
        setIsDeploying(false);
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FilePlusIcon /> Deploy New Contract
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">WASM Code (Base64)</label>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Paste base64-encoded WASM contract code..."
                        className="w-full h-24 bg-slate-800 border border-slate-600 rounded-md p-2 font-mono text-xs"
                        disabled={!canDeploy || isDeploying}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Initial State (JSON, optional)</label>
                    <textarea
                        value={initialState}
                        onChange={(e) => setInitialState(e.target.value)}
                        placeholder='{ "owner": "your_address", "counter": 0 }'
                        className="w-full h-20 bg-slate-800 border border-slate-600 rounded-md p-2 font-mono text-xs"
                        disabled={!canDeploy || isDeploying}
                    />
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                    type="submit"
                    disabled={!canDeploy || isDeploying || !code}
                    className="bg-sky-600 text-white font-semibold rounded-md px-6 py-2 hover:bg-sky-500 transition disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    {isDeploying ? 'Deploying...' : 'Deploy Contract'}
                </button>
            </form>
        </div>
    );
};

const ContractCard: React.FC<{
    contract: DeployedContract;
    state: Record<string, any>;
    onFetchState: (id: string) => void;
    onCall: (id: string, func: string, args: any[]) => Promise<{ success: boolean, message: string }>;
    canCall: boolean;
}> = ({ contract, state, onFetchState, onCall, canCall }) => {
    const [func, setFunc] = useState('');
    const [args, setArgs] = useState('');
    const [callError, setCallError] = useState('');
    const [isCalling, setIsCalling] = useState(false);

    const memoizedFetchState = useCallback(() => {
        onFetchState(contract.id);
    }, [onFetchState, contract.id]);

    useEffect(() => {
        memoizedFetchState();
    }, [memoizedFetchState]);

    const handleCall = async (e: React.FormEvent) => {
        e.preventDefault();
        setCallError('');
        let parsedArgs;
        try {
            parsedArgs = args ? JSON.parse(args) : [];
            if (!Array.isArray(parsedArgs)) throw new Error();
        } catch {
            setCallError('Arguments must be a valid JSON array.');
            return;
        }
        setIsCalling(true);
        const result = await onCall(contract.id, func, parsedArgs);
        if (!result.success) {
            setCallError(result.message);
        } else {
            setFunc('');
            setArgs('');
        }
        setIsCalling(false);
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white font-mono truncate">{contract.id}</h4>
            <p className="text-xs text-slate-500 mb-4">Deployed by: <span className="font-mono">{contract.from}</span></p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h5 className="font-semibold text-slate-300 mb-2 flex items-center gap-2"><CubeIcon className="h-5 w-5"/> Current State</h5>
                    <pre className="bg-slate-900 rounded p-2 text-xs h-32 overflow-auto">{JSON.stringify(state, null, 2)}</pre>
                    <button onClick={() => onFetchState(contract.id)} className="text-xs text-sky-400 mt-2 hover:underline">Refresh State</button>
                </div>
                <div>
                    <h5 className="font-semibold text-slate-300 mb-2 flex items-center gap-2"><PlayCircleIcon className="h-5 w-5"/> Call Function</h5>
                    <form onSubmit={handleCall} className="space-y-2">
                         <input type="text" value={func} onChange={e => setFunc(e.target.value)} placeholder="Function Name" className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm" disabled={!canCall || isCalling} required />
                         <input type="text" value={args} onChange={e => setArgs(e.target.value)} placeholder='Arguments (JSON Array), e.g., ["key", 42]' className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm" disabled={!canCall || isCalling} />
                         {callError && <p className="text-xs text-red-400">{callError}</p>}
                         <button type="submit" className="w-full bg-indigo-600 text-white text-sm font-semibold rounded py-1.5 hover:bg-indigo-500 transition disabled:bg-slate-600" disabled={!canCall || isCalling || !func}>
                            {isCalling ? 'Calling...' : 'Execute'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export const ContractView: React.FC<{ logAction: (action: string, details: Record<string, any>) => void }> = ({ logAction }) => {
    const { contracts, contractStates, isLoading, fetchContractState, deployContract, callContract } = useSmartContracts();
    const { hasPermission } = useAuth();
    const canDeploy = hasPermission('action:deploy_contract');
    const canCall = hasPermission('action:call_contract');

    const handleDeploy = async (code: string, initialState?: Record<string, any>) => {
        const result = await deployContract(code, initialState);
        if (result.success) {
            logAction('contract.deploy', { codeLength: code.length, hasInitialState: !!initialState });
        }
        return result;
    };
    
    const handleCall = async (id: string, func: string, args: any[]) => {
        const result = await callContract(id, func, args);
        if (result.success) {
            logAction('contract.call', { contractId: id, function: func, args });
        }
        return result;
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center gap-2"><CodeBracketIcon className="h-8 w-8"/> Smart Contracts</h2>
                <p className="text-slate-400">Deploy and interact with WASM smart contracts on the Bataranetwork.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <DeployContractForm onDeploy={handleDeploy} canDeploy={canDeploy} />
                </div>
                <div className="lg:col-span-2">
                    <h3 className="text-xl font-bold text-white mb-4">Deployed Contracts</h3>
                    {isLoading && <p className="text-slate-400">Loading contracts...</p>}
                    <div className="space-y-6">
                         {contracts.map(contract => (
                            <ContractCard 
                                key={contract.id} 
                                contract={contract} 
                                state={contractStates[contract.id] || {}}
                                onFetchState={fetchContractState}
                                onCall={handleCall}
                                canCall={canCall}
                            />
                        ))}
                        {!isLoading && contracts.length === 0 && <p className="text-slate-500 text-center p-8">No smart contracts have been deployed.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
