import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBlock } from '../api/explorerApi';

const DetailRow: React.FC<{ label: string; value: React.ReactNode; isMono?: boolean }> = ({ label, value, isMono = true }) => (
  <div className="flex flex-col md:flex-row py-3 border-b border-gray-700 last:border-b-0">
    <p className="w-full md:w-1/4 font-semibold text-gray-400">{label}</p>
    <div className={`w-full md:w-3/4 break-words ${isMono ? 'font-mono' : ''}`}>{value}</div>
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

  if (isLoading) return <div className="text-center p-8">Loading block details...</div>;
  if (error) return <div className="text-center text-red-500 p-8 bg-red-500/10 rounded-lg">{error}</div>;
  if (!block) return <div className="text-center p-8">Block not found.</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Block #{block.height}</h2>
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <DetailRow label="Height" value={block.height} isMono={false} />
        <DetailRow label="Timestamp" value={new Date(block.timestamp).toLocaleString()} isMono={false} />
        <DetailRow label="Hash" value={block.hash} />
        <DetailRow label="Previous Hash" value={
            block.height > 0 ? (
                <Link to={`/block/${block.height - 1}`} className="text-blue-400 hover:underline">
                    {block.previousHash}
                </Link>
            ) : (
                block.previousHash
            )
        } />
        <DetailRow label="Validator" value={block.validator} />
        <DetailRow label="Signature" value={block.signature} />
        <DetailRow label="Transactions" value={`${block.transactions.length} transactions`} isMono={false} />
      </div>

      {block.transactions.length > 0 && (
        <div className="mt-8">
            <h3 className="text-2xl font-bold mb-4">Transactions in this Block</h3>
            <div className="bg-gray-800 rounded-lg shadow-lg p-4 space-y-2">
            {block.transactions.map((tx: any) => (
              <div key={tx.id} className="p-3 border border-gray-700 rounded-md">
                <p className="text-green-400 font-mono text-sm truncate">
                    <Link to={`/tx/${tx.id}`} className="hover:underline">{tx.id}</Link>
                </p>
                <p className="text-xs text-gray-400">From: <span className="font-mono truncate">{tx.from}</span></p>
                <p className="text-xs text-gray-400">To: <span className="font-mono truncate">{tx.to}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockDetail;
