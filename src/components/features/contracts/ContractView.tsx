import React, { useState } from 'react';
import { useSmartContracts, Contract } from '../../../hooks/useSmartContracts';
import { CubeIcon, BeakerIcon } from '../../ui/icons';

const ContractCard: React.FC<{ contract: Contract; onInteract: (contract: Contract) => void; }> = ({ contract, onInteract }) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 flex flex-col justify-between">
        <div>
            <div className="flex items-center gap-3">
                <CubeIcon className="text-sky-400 h-8 w-8"/>
                <h3 className="text-xl font-bold text-white">{contract.name}</h3>
            </div>
            <p className="text-sm font-mono text-slate-400 mt-2 break-all">{contract.address}</p>
            <p className="text-lg font-semibold text-white mt-4">{contract.balance.toLocaleString()} BTR</p>
        </div>
        <button onClick={() => onInteract(contract)} className="mt-6 w-full bg-sky-600/50 border border-sky-500/50 text-sky-300 font-semibold rounded-md px-4 py-2 hover:bg-sky-500/30 transition-colors flex items-center justify-center gap-2">
            <BeakerIcon />
            Interact
        </button>
    </div>
);

const InteractionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    contract: Contract | null;
    onCall: (method: string, params: any[]) => void;
}> = ({ isOpen, onClose, contract, onCall }) => {
    const [selectedMethod, setSelectedMethod] = useState('');
    const [params, setParams] = useState('');

    if (!isOpen || !contract) return null;

    const handleCall = () => {
        let parsedParams: any[] = [];
        try {
            if(params.trim()){
                // FIX: Wrap parameters in an array before parsing to handle single values and comma-separated lists correctly.
                parsedParams = JSON.parse(`[${params}]`);
            }
        } catch (e) {
            alert('Invalid parameters. Please use comma-separated JSON values (e.g., "0x123", 100)');
            return;
        }
        onCall(selectedMethod, parsedParams);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                 <div className="p-6">
                    <h3 className="text-lg font-bold text-white">Interact with {contract.name}</h3>
                </div>
                <div className="p-6 border-y border-slate-700 space-y-4">
                    <div>
                        <label htmlFor="method" className="block text-sm font-medium text-slate-300 mb-2">Select Method</label>
                        <select id="method" value={selectedMethod} onChange={e => setSelectedMethod(e.target.value)}
                         className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                             <option value="" disabled>-- Select a method --</option>
                             {contract.methods.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="params" className="block text-sm font-medium text-slate-300 mb-2">Parameters (comma-separated)</label>
                         <input type="text" id="params" value={params} onChange={e => setParams(e.target.value)} placeholder='"0xabc...", 123'
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                </div>
                <div className="p-4 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="bg-slate-700 text-white font-semibold rounded-md px-4 py-2 hover:bg-slate-600">Cancel</button>
                    <button onClick={handleCall} disabled={!selectedMethod} className="bg-sky-600 text-white font-semibold rounded-md px-4 py-2 hover:bg-sky-500 disabled:bg-slate-600">Call Method</button>
                </div>
            </div>
        </div>
    );
};

export const ContractView: React.FC = () => {
    const { contracts, interactions, callMethod } = useSmartContracts();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

    const handleInteract = (contract: Contract) => {
        setSelectedContract(contract);
        setIsModalOpen(true);
    };
    
    const handleCallMethod = (method: string, params: any[]) => {
        if(selectedContract) {
            callMethod(selectedContract.id, method, params);
        }
    };
    
    return (
        <div>
            <InteractionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} contract={selectedContract} onCall={handleCallMethod} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Contracts List */}
                <div className="lg:col-span-2">
                    <h2 className="text-3xl font-bold text-white mb-6">Deployed Smart Contracts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {contracts.map(c => <ContractCard key={c.id} contract={c} onInteract={handleInteract}/>)}
                    </div>
                </div>

                {/* Right Column: Interaction History */}
                <div className="lg:col-span-1">
                    <h3 className="text-xl font-bold text-white mb-4">Recent Interactions</h3>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                        {interactions.map(i => (
                            <div key={i.id} className="bg-slate-800 p-3 rounded text-xs">
                                <p className="font-semibold text-sky-400">{i.method}</p>
                                <p className="text-slate-400 font-mono break-all">Params: {JSON.stringify(i.params)}</p>
                                <p className="text-slate-400 font-mono break-all">Result: {JSON.stringify(i.result)}</p>
                                <p className="text-slate-500 mt-1 text-right">{i.timestamp}</p>
                            </div>
                        ))}
                         {interactions.length === 0 && <p className="text-slate-500 text-center py-4">No interactions yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
