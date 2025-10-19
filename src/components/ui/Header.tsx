import React, { useState, useRef, useEffect } from 'react';
import { LogoIcon, SwitchHorizontalIcon } from './icons';
import { useAuth } from '../../hooks/useAuth'; // Assuming useAuth provides the user list and setter

export const Header: React.FC = () => {
  const { users, currentUser, setUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <LogoIcon />
          <h1 className="text-2xl font-bold text-white">
            Bataranetwork <span className="text-sky-400">DevOps Dashboard</span>
          </h1>
        </div>
        
        {/* User Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 bg-slate-700/50 border border-slate-600 rounded-md px-4 py-2 hover:bg-slate-700 transition-colors"
          >
            <span className="text-2xl">{currentUser.avatar}</span>
            <div>
              <p className="text-sm font-semibold text-white text-left">{currentUser.name.split(' ')[0]}</p>
              <p className="text-xs text-slate-400 text-left">{currentUser.role}</p>
            </div>
            <SwitchHorizontalIcon className="text-slate-400" />
          </button>
          
          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-20">
              <div className="p-2">
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => { setUser(user.id); setIsOpen(false); }}
                    className={`w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-slate-700 ${currentUser.id === user.id ? 'bg-sky-500/10' : ''}`}
                  >
                    <span className="text-xl">{user.avatar}</span>
                    <span className="text-sm text-slate-300">{user.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
