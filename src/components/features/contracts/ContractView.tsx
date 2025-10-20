import React, { useState, useEffect, useMemo } from 'react';
import { useSmartContracts } from '../../../hooks/useSmartContracts';
import { Contract } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { CodeBlock } from '../../ui/CodeBlock';
import { CodeBracketIcon, FilePlusIcon } from '../../ui/icons';

const ContractCard: React.FC<{
  contract: Contract;
  onCallMethod: (contractId: string, method: string, params: any[]) => void;
}> = ({ contract, onCallMethod }) => {
  const [selectedMethod, setSelectedMethod] = useState(contract.methods[0]);
  const [paramValues, setParamValues] = useState<string[]>([]);
  const { currentUser } = useAuth();
  const canCall = currentUser.permissions.has('action:call_contract');
  const [isCalling, setIsCalling] = useState(false);


  const parsedParams = useMemo(() => {
    const match = selectedMethod.match(/\(([^)]*)\)/);
    if (match && match[1]) {
      return match[1].split(',').map(p => p.trim()).filter(p => p);
    }
    return [];
  }, [selectedMethod]);

  useEffect(() => {
    setParamValues(new Array(parsedParams.length).fill(''));
  }, [parsedParams, selectedMethod]);

  const handleParamChange = (index: number, value: string) => {
    const newValues = [...paramValues];
    newValues[index] = value;
    setParamValues(newValues);
  };

  const handleCall = async () => {
    setIsCalling(true);
    await onCallMethod(contract.id, selectedMethod, paramValues);
    setIsCalling(false);
  };
  
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 flex flex-col">
      <h3 className="text-lg font-bold text-white">{contract.name}</h3>
      <p className="text-xs text-slate-500 font-mono mb-4">{contract.address}</p>
      <div className="flex items-center gap-4 mb-4">
        <div className="text-sm">
          <p className="text-slate-400">Balance</p>
          <p className="font-bold text-white">{contract.balance.toLocaleString()} BTR (Simulated)</p>
        </div>
      </div>
      
      <div className="space-y-3 mt-auto">
        {/* Parameter Inputs */}
        <div className="space-y-2">
            {parsedParams.map((paramType, index) => (
                <div key={index}>
                     <label className="text-xs font-mono text-slate-400 block mb-1">{paramType}</label>
                     <input
                        type="text"
                        value={paramValues[index] || ''}
                        onChange={(e) => handleParamChange(index, e.target.value)}
                        placeholder={`Enter ${paramType}`}
                        className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                        disabled={!canCall || isCalling}
                    />
                </div>
            ))}
        </div>

        {/* Method Selector and Call Button */}
        <div className="flex items-stretch gap-2">
            <select
            value={selectedMethod}
            onChange={e => setSelectedMethod(e.target.value)}
            className="flex-grow bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
            >
            {contract.methods.map(method => <option key={method} value={method}>{method}</option>)}
            </select>
            <button
            onClick={handleCall}
            disabled={!canCall || isCalling}
            className="bg-sky-600 text-white font-semibold rounded-md px-4 py-2 hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
            {isCalling ? '...' : 'Call'}
            </button>
        </div>
      </div>

    </div>
  );
};

const DeployContractCard: React.FC<{
    onDeploy: (name: string, bytecode: string, initialState: string) => void;
}> = ({ onDeploy }) => {
    const [name, setName] = useState('');
    const [bytecode, setBytecode] = useState('');
    const [initialState, setInitialState] = useState('');
    const { hasPermission } = useAuth();
    const canDeploy = hasPermission('action:deploy_contract');
    const [isDeploying, setIsDeploying] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (canDeploy && name && bytecode) {
            setIsDeploying(true);
            await onDeploy(name, bytecode, initialState);
            setIsDeploying(false);
            setName('');
            setBytecode('');
            setInitialState('');
        }
    };

    return (
        <div className="bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-lg p-6 flex flex-col">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <FilePlusIcon />
                Deploy New Contract
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 flex flex-col flex-grow">
                 <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Contract Name (e.g., MyNFT)"
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    disabled={!canDeploy || isDeploying}
                />
                <textarea
                    value={bytecode}
                    onChange={e => setBytecode(e.target.value)}
                    placeholder="Paste WASM bytecode (simulated)..."
                    className="w-full flex-grow bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                    disabled={!canDeploy || isDeploying}
                />
                 <textarea
                    value={initialState}
                    onChange={e => setInitialState(e.target.value)}
                    placeholder='Initial State (JSON format), e.g., {"owner": "0x..."}'
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 h-20"
                    disabled={!canDeploy || isDeploying}
                />
                <button
                    type="submit"
                    disabled={!canDeploy || !name || !bytecode || isDeploying}
                    className="w-full bg-sky-600 text-white font-semibold rounded-md py-2.5 hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed mt-auto"
                >
                    {isDeploying ? 'Deploying...' : 'Deploy'}
                </button>
                 {!canDeploy && <p className="text-xs text-center text-yellow-400">Your role cannot deploy contracts.</p>}
            </form>
        </div>
    );
};

export const ContractView: React.FC<{ logAction: (action: string, details: Record<string, any>) => void }> = ({ logAction }) => {
    const { contracts, interactions, callMethod, deployContract, isLoading } = useSmartContracts();

    const handleCallMethod = async (contractId: string, method: string, params: any[]) => {
        const interaction = await callMethod(contractId, method, params);
        if (interaction) {
            const contract = contracts.find(c => c.id === contractId);
            logAction('contract.call', {
                contractName: contract?.name || 'Unknown',
                method: method,
                params: params,
                result: interaction.result,
            });
        }
    };
    
    const handleDeployContract = async (name: string, bytecode: string, initialState: string) => {
        const transaction = await deployContract(name, bytecode, initialState);
        if (transaction) {
            logAction('contract.deploy', {
                contractName: name,
                transactionId: transaction.id,
            });
        }
    };
    
    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center gap-2"><CodeBracketIcon className="h-8 w-8" /> Smart Contract Interaction</h2>
                <p className="text-slate-400">View deployed contracts and interact with their functions.</p>
            </div>
            
            {isLoading && <div className="text-center p-8">Loading contracts from the blockchain...</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <DeployContractCard onDeploy={handleDeployContract} />
                {contracts.map(contract => (
                    <ContractCard key={contract.id} contract={contract} onCallMethod={handleCallMethod} />
                ))}
            </div>

            <div>
                <h3 className="text-2xl font-bold text-white mb-4">Recent Interactions</h3>
                {interactions.length > 0 ? (
                    <div className="space-y-4">
                        {interactions.map(interaction => (
                           <div key={interaction.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-bold text-sky-400 text-sm font-mono">
                                        {contracts.find(c => c.id === interaction.contractId)?.name} -> {interaction.method}
                                    </p>
                                    <p className="text-xs text-slate-500">{interaction.timestamp}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CodeBlock title="Parameters" content={JSON.stringify(interaction.params, null, 2)} />
                                    <CodeBlock title="Result (Broadcast Confirmation)" content={JSON.stringify(interaction.result, null, 2)} />
                                </div>
                           </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-8 bg-slate-800/50 border border-slate-700 rounded-lg">
                        <p className="text-slate-400">No contract interactions yet. Call a method on a contract above.</p>
                    </div>
                )}
            </div>
        </div>
    );
};