import { useState } from 'react';
import { scanCodeForSecurityIssues } from '../services/geminiService';
import { GITHUB_ACTIONS_CONTENT, DOCKERFILE_CONTENT } from '../constants'; // Using some existing code to scan

interface FileToScan {
  name: string;
  content: string;
}

const filesToScan: FileToScan[] = [
    { name: 'Dockerfile', content: DOCKERFILE_CONTENT },
    { name: 'ci.yml', content: GITHUB_ACTIONS_CONTENT },
    { name: 'core/node/src/rpc/httpServer.ts', content: `
    // A mock server file for scanning
    import express from 'express';
    
    export class HttpServer {
        constructor(port: number) {
            const app = express();
            app.get('/exec', (req, res) => {
                // Potential command injection vulnerability
                const cmd = req.query.command;
                require('child_process').exec(cmd);
                res.send('Executed');
            });
            app.listen(port);
        }
    }
    `},
];

export const useSecurityScanner = () => {
    const [scanResults, setScanResults] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runScan = async () => {
        setIsLoading(true);
        setError(null);
        setScanResults({});

        try {
            const results: Record<string, string> = {};
            for (const file of filesToScan) {
                const result = await scanCodeForSecurityIssues(file.content, file.name);
                results[file.name] = result;
                setScanResults(prev => ({...prev, ...results}));
            }
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred during the scan.');
        } finally {
            setIsLoading(false);
        }
    };

    return { runScan, scanResults, isLoading, error, filesToScan };
};
