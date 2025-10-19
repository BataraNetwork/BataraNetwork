import { useState, useEffect } from 'react';
import { LogEntry } from '../types';

const logLevels: LogEntry['level'][] = ['info', 'warn', 'error', 'debug'];
const logMessages = [
    'Initializing node...',
    'Connecting to peer 1.2.3.4:6001',
    'Mempool size: 15 transactions',
    'Attempting to create a new block...',
    'Successfully created and added block #',
    'Received new transaction from peer',
    'DB connection opened',
    'Invalid signature for transaction',
    'Failed to connect to peer 5.6.7.8:6001',
    'Health check passed',
];

let blockHeight = 1024;

export const useLogStream = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const level = logLevels[Math.floor(Math.random() * logLevels.length)];
            let message = logMessages[Math.floor(Math.random() * logMessages.length)];
            if (message.includes('#')) {
                message += blockHeight++;
            }
            
            const newLog: LogEntry = {
                timestamp: new Date().toISOString(),
                level,
                message,
            };

            setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 199)]); // Keep last 200 logs
        }, 1500); // New log every 1.5 seconds

        return () => clearInterval(interval);
    }, []);

    return { logs };
};
