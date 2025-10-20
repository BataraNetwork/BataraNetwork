import React from 'react';
import { Header } from './Header';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="py-4 text-center text-xs text-slate-600 border-t border-slate-800">
        Bataranetwork Explorer | A decentralized world is a better world.
      </footer>
    </div>
  );
};

export default Layout;
