import React, { useState, useEffect } from 'react';
import { getBlocks } from '../api/explorerApi';
import { Link } from 'react-router-dom';

const Blocks: React.FC = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        setIsLoading(true);
        const blocksData = await getBlocks(20); // Fetch latest 20 blocks
        setBlocks(blocksData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch blocks.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlocks();
  }, []);

  if (isLoading) return <div className="text-center p-8">Loading blocks...</div>;
  if (error) return <div className="text-center text-red-500 p-8 bg-red-500/10 rounded-lg">{error}</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Blocks</h2>
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Height</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Hash</th>
              <th className="py-3 px-4 text-center text-sm font-semibold text-gray-300">Transactions</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {blocks.map(block => (
              <tr key={block.height} className="hover:bg-gray-700/50 transition-colors">
                <td className="py-3 px-4">
                  <Link to={`/block/${block.height}`} className="text-blue-400 hover:underline">
                    {block.height}
                  </Link>
                </td>
                <td className="py-3 px-4 font-mono text-sm truncate" style={{ maxWidth: '200px' }}>
                  <Link to={`/block/${block.height}`} className="text-gray-300 hover:underline">
                    {block.hash}
                  </Link>
                </td>
                <td className="py-3 px-4 text-center">{block.transactions.length}</td>
                <td className="py-3 px-4 text-sm text-gray-400">{new Date(block.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Blocks;
