import { useState, useEffect, useMemo, useCallback } from 'react';
import { LogEntry } from '../types';

const logLevels: LogEntry['level'][] = ['info', 'warn', 'error', 'debug'];
// FIX: Add 'as const' to prevent TypeScript from widening the 'level' property to a generic 'string' type.
// This ensures that 'template.level' is correctly inferred as one of the specific log level literals.
const logTemplates = [
    { level: 'info', message: 'Initializing node...' },
    { level: 'info', message: 'Connecting to peer 1.2.3.4:6001' },
    { level: 'info', message: 'Mempool size: 15 transactions' },
    { level: 'info', message: 'Attempting to create a new block...' },
    { level: 'info', message: 'Successfully created and added block #' },
    { level: 'info', message: 'Received new transaction from peer' },
    { level: 'debug', message: 'DB connection opened successfully' },
    { level: 'error', message: 'Invalid signature for transaction 0x123abc...' },
    { level: 'warn', message: 'Failed to connect to peer 5.6.7.8:6001, retrying...' },
    { level: 'info', message: 'Health check passed' },
] as const;

let blockHeight = 1024;

export const useLogStream = () => {
    const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [filterLevels, setFilterLevels] = useState<Set<LogEntry['level']>>(new Set(logLevels));

    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            const template = logTemplates[Math.floor(Math.random() * logTemplates.length)];
            let message = template.message;
            if (message.includes('#')) {
                message += blockHeight++;
            }
            
            const newLog: LogEntry = {
                timestamp: new Date().toISOString(),
                level: template.level,
                message,
            };

            setAllLogs(prevLogs => [newLog, ...prevLogs.slice(0, 499)]); // Keep last 500 logs
        }, 800);

        return () => clearInterval(interval);
    }, [isRunning]);

    const filteredLogs = useMemo(() => {
        return allLogs.filter(log => {
            const levelMatch = filterLevels.has(log.level);
            const textMatch = filterText ? log.message.toLowerCase().includes(filterText.toLowerCase()) : true;
            return levelMatch && textMatch;
        });
    }, [allLogs, filterText, filterLevels]);

    const toggleLevel = useCallback((level: LogEntry['level']) => {
        setFilterLevels(prev => {
            const newSet = new Set(prev);
            if (newSet.has(level)) {
                newSet.delete(level);
            } else {
                newSet.add(level);
            }
            return newSet;
        });
    }, []);

    return { 
        logs: filteredLogs, 
        isRunning, 
        setIsRunning, 
        filterText, 
        setFilterText, 
        filterLevels, 
        toggleLevel 
    };
};
