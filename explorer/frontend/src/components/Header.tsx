import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { search } from '../api/explorerApi';

const Logo: React.FC = () => (
    <svg className="h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
    </svg>
);

export const Header: React.FC = () => {
    const [query, setQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!query.trim()) return;

        try {
            const result = await search(query.trim());
            if (result.type === 'block') {
                navigate(`/block/${result.value}`);
            } else if (result.type === 'transaction') {
                navigate(`/tx/${result.value}`);
            } else if (result.type === 'address') {
                navigate(`/address/${encodeURIComponent(result.value)}`);
            }
             setQuery('');
        } catch (err) {
            setError('No results found for that query.');
        }
    };

    return (
        <header className="bg-slate-900/70 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between gap-8">
                    <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                        <Logo />
                        <span className="text-xl font-bold text-white">Batara <span className="text-cyan-400">Explorer</span></span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link to="/" className="text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors">Dashboard</Link>
                        <Link to="/blocks" className="text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors">Blocks</Link>
                        <Link to="/transactions" className="text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors">Transactions</Link>
                    </nav>
                </div>
                <form onSubmit={handleSearch} className="mt-4">
                    <div className="relative">
                         <input 
                            type="text" 
                            value={query}
                            onChange={e => {
                                setQuery(e.target.value);
                                setError(null);
                            }}
                            placeholder="Search by Block Height, Tx Hash, or Address..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-md py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
                </form>
            </div>
        </header>
    );
};
