import React from 'react';
import { LogoIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 py-5 flex items-center gap-4">
        <LogoIcon />
        <h1 className="text-2xl font-bold text-white">
          Bataranetwork <span className="text-sky-400">DevOps Dashboard</span>
        </h1>
      </div>
    </header>
  );
};