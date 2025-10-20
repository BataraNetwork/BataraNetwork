import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAccount } from '../api/explorerApi';

const DetailRow: React.FC<{ label: string; value: React.ReactNode; isMono?: boolean }> = ({ label, value, isMono = true }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 py-4 border-b border-slate-700 last:border-b-0">
    <p className="font-semibold text-slate-400">{label}</p>
    <div className={`md:col-span-3 break-words ${isMono ? 'font-mono' : ''}`}>{value}</div>
  </div>
);

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
  <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
    <p className="text-sm text-slate-400">{title}</p>
    <p className="text-3xl font-bold text-white mt-1">{value}</p>
  </div>
);


const AddressDetail: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const [account, setAccount] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAccount = async () => {
      if (!address) return;
      try {
        setIsLoading(true);
        const decodedAddress = decodeURIComponent(address);
        const accountData = await getAccount(decodedAddress);
        setAccount(accountData);
        setError(null);
      } catch (err) {
        setError(`Failed to fetch account details for the provided address.`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccount();
  }, [address]);

  if (isLoading) return <div className="text-center p-8 animate-pulse">Loading account details...</div>;
  if (error) return <div className="text-center text-red-400 p-8 bg-red-900/50 border border-red-500/50 rounded-lg">{error}</div>;
  if (!account) return <div className="text-center p-8">Account not found.</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2 text-white">Account Details</h2>
       <p className="font-mono text-sm text-slate-500 mb-6 break-all">{account.address}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard title="Balance" value={`${account.balance.toLocaleString()} BTR`} />
        <StatCard title="Nonce" value={account.nonce} />
      </div>

       <div>
        <h3 className="text-2xl font-bold mb-4 text-white">Transaction History</h3>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 text-center p-12">
            <p className="text-slate-500">Transaction history is not yet indexed by the node.</p>
            <p className="text-xs text-slate-600 mt-1">This feature is on the roadmap!</p>
        </div>
       </div>
    </div>
  );
};

export default AddressDetail;
