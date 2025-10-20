import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBlock } from '../api/explorerApi';

const DetailRow: React.FC<{ label: string; value: React.ReactNode; isMono?: boolean }> = ({ label, value, isMono = true }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 py-4 border-b border-slate-700 last:border-b-0">
    <p className="font-semibold text-slate-400">{label}</p>
    <div className={`md:col-span-3 break-words ${isMono ? 'font-mono' : ''}`}>{value}</div>
  </div>
);

const BlockDetail: React.FC = () => {
  const { height } = useParams<{ height: string }>();
  const [block, setBlock] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlock = async () => {
      if (!height) return;
      try {
        setIsLoading(true);
        const blockHeight = parseInt(height, 10);
        if (isNaN(blockHeight)) {
            throw new Error("Invalid block height");
        }
        const blockData = await getBlock(blockHeight);
        setBlock(blockData);
        setError(null);
      } catch (err) {
        setError(`Failed to fetch block #${height}.`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlock();
  }, [height]);

  if (isLoading) return <div className="text-center p-8 animate-pulse">Loading block details...</div>;
  if (error) return <div className="text-center text-red-400 p-8 bg-red-900/50 border border-red-500/50 rounded-lg">{error}</div>;
  if (!block) return <div className="text-center p-8">Block not found.</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-white">Block #{block.height}</h2>
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 shadow-lg p-6">
        <DetailRow label="Height" value={block.height} isMono={false} />
        <DetailRow label="Timestamp" value={new Date(block.timestamp).toLocaleString()} isMono={false} />
        <DetailRow label="Hash" value={block.hash} />
        <DetailRow label="Previous Hash" value={
            block.height > 0 ? (
                <Link to={`/block/${block.height - 1}`} className="text-sky-400 hover:underline">
                    {block.previousHash}
                </Link>
            ) : (
                block.previousHash
            )
        } />
        <DetailRow label="Validator" value={<Link to={`/address/${encodeURIComponent(block.validator)}`} className="text-sky-400 hover:underline">{block.validator}</Link>} />
        <DetailRow label="Signature" value={block.signature} />
        <DetailRow label="Transactions" value={`${block.transactions.length} transactions`} isMono={false} />
        <DetailRow label="Fees" value={`${block.totalFees} BTR`} isMono={false} />
      </div>

      {block.transactions.length > 0 && (
        <div className="mt-8">
            <h3 className="text-2xl font-bold mb-4 text-white">Transactions in this Block</h3>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-4 space-y-3">
            {block.transactions.map((tx: any) => (
              <div key={tx.id} className="p-4 border border-slate-700 rounded-md hover:bg-slate-800 transition-colors">
                <p className="text-cyan-400 font-mono text-sm truncate">
                    <Link to={`/tx/${tx.id}`} className="hover:underline">{tx.id}</Link>
                </p>
                <div className="text-xs text-slate-400 mt-1">
                  <p>From: <Link to={`/address/${encodeURIComponent(tx.from)}`} className="text-sky-400 hover:underline font-mono truncate">{tx.from}</Link></p>
                  {tx.to && <p>To: <Link to={`/address/${encodeURIComponent(tx.to)}`} className="text-sky-400 hover:underline font-mono truncate">{tx.to}</Link></p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockDetail;
