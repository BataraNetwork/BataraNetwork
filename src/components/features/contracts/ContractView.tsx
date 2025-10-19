import React, { useState } from 'react';
import { useSmartContracts, Contract, ContractInteraction } from '../../../hooks/useSmartContracts';
import { useAuth } from '../../../hooks/useAuth';
import { CodeBlock } from '../../ui/CodeBlock';

const ContractCard: React.FC<{
  contract: Contract;
  onCallMethod: (contractId: string, method: string, params: any[]) => void;
}> = ({ contract, onCallMethod }) => {
  const [selectedMethod, setSelectedMethod] = useState(contract.methods[0]);
  const { currentUser } = useAuth();
  const canCall = currentUser.permissions.has('action:call_contract');

  const handleCall = () => {
    // This is a simplified interaction model; a real one would parse params
    onCallMethod(contract.id, selectedMethod, []);
  };
  
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-bold text-white">{contract.name}</h3>
      <p className="text-xs text-slate-500 font-mono mb-4">{contract.address}</p>
      <div className="flex items-center gap-4 mb-4">
        <div className="text-sm">
          <p className="text-slate-400">Balance</p>
          <p className="font-bold text-white">{contract.balance.toLocaleString()} BTR</p>
        </div>
      </div>
      <div className="flex items-stretch gap-2">
        <select
          value={selectedMethod}
          onChange={e => setSelectedMethod(e.target.value)}
          className="flex-grow bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          {contract.methods.map(method => <option key={method} value={method}>{method}</option>)}
        </select>
        <button
          onClick={handleCall}
          disabled={!canCall}
          className="bg-sky-600 text-white font-semibold rounded-md px-4 py-2 hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          Call
        </button>
      </div>
    </div>
  );
};


export const ContractView: React.FC = () => {
    const { contracts, interactions, callMethod } = useSmartContracts();
    
    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white">Smart Contract Interaction</h2>
                <p className="text-slate-400">View deployed contracts and interact with their functions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {contracts.map(contract => (
                    <ContractCard key={contract.id} contract={contract} onCallMethod={callMethod} />
                ))}
            </div>

            <div>
                <h3 className="text-2xl font-bold text-white mb-4">Recent Interactions</h3>
                {interactions.length > 0 ? (
                    <div className="space-y-4">
                        {interactions.map(interaction => (
                           <div key={interaction.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-bold text-sky-400 text-sm">
                                        {contracts.find(c => c.id === interaction.contractId)?.name} -&gt; {interaction.method}
                                    </p>
                                    <p className="text-xs text-slate-500">{interaction.timestamp}</p>
                                </div>
                                <CodeBlock title="Result" content={JSON.stringify(interaction.result, null, 2)} />
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
