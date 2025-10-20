import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogoIcon, SwitchHorizontalIcon } from './icons';

export const Header: React.FC = () => {
  const { users, currentUser, switchUser } = useAuth();
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const handleUserSwitch = (userId: string) => {
    switchUser(userId);
    setDropdownOpen(false);
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <LogoIcon />
            <div className="ml-4">
              <h1 className="text-xl font-bold text-white">Bataranetwork</h1>
              <p className="text-xs text-sky-400">Enterprise Operations Dashboard</p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg px-4 py-2 transition-colors"
            >
              <span className="text-2xl">{currentUser.avatar}</span>
              <div>
                <p className="text-sm font-semibold text-white text-left">{currentUser.name}</p>
                <p className="text-xs text-slate-400 text-left">{currentUser.role}</p>
              </div>
              <SwitchHorizontalIcon className="h-5 w-5 text-slate-400" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                <div className="p-2">
                  <p className="text-xs text-slate-500 px-2 pt-1 pb-2">Switch User Persona</p>
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSwitch(user.id)}
                      className={`w-full text-left flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                        user.id === currentUser.id
                          ? 'bg-sky-500/20 text-sky-300'
                          : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-xl">{user.avatar}</span>
                       <div>
                         <p className="text-sm font-medium">{user.name}</p>
                         <p className="text-xs text-slate-400">{user.role}</p>
                       </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
