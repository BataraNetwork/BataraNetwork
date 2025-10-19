import React from 'react';
import { Link } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <aside className="w-64 flex-shrink-0 bg-gray-800 p-4">
        <h1 className="text-2xl font-bold mb-8">Batara Explorer</h1>
        <nav>
          <ul>
            <li><Link to="/" className="block py-2 px-4 rounded hover:bg-gray-700">Dashboard</Link></li>
            <li><Link to="/blocks" className="block py-2 px-4 rounded hover:bg-gray-700">Blocks</Link></li>
            <li><Link to="/transactions" className="block py-2 px-4 rounded hover:bg-gray-700">Transactions</Link></li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
