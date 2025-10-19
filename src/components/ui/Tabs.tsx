import React from 'react';

interface TabsProps {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="border-b border-slate-700">
      <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${
              activeTab === tab
                ? 'bg-slate-800 text-sky-400'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
            } whitespace-nowrap py-3 px-4 font-medium text-sm rounded-t-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500`}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
};