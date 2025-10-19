import { useState, useCallback } from 'react';
import { analyzeConfiguration } from '../services/geminiService';
import { SecurityFinding, ScanResult } from '../types';

export const useSecurityScanner = () => {
    const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
    const [history, setHistory] = useState<ScanResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scanContent = useCallback(async (content: string, fileName: string = 'pasted_content') => {
        if (!content.trim()) {
            setError("Cannot scan empty content.");
            setCurrentScan(null);
            return;
        }

        setIsLoading(true);
        setError(null);
        setCurrentScan(null);

        try {
            const results = await analyzeConfiguration(content);
            const newScan: ScanResult = {
                id: Date.now(),
                scannedAt: new Date().toLocaleString(),
                fileName,
                findings: results,
            };
            setCurrentScan(newScan);
            setHistory(prev => [newScan, ...prev.slice(0, 9)]); // Keep last 10 scans
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred during the scan.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const toggleMuteFinding = (findingId: string) => {
        if (!currentScan) return;

        const updatedFindings = currentScan.findings.map(f =>
            f.id === findingId ? { ...f, muted: !f.muted } : f
        );

        const updatedScan = { ...currentScan, findings: updatedFindings };
        setCurrentScan(updatedScan);

        // Also update history
        setHistory(prev => prev.map(h => h.id === currentScan.id ? updatedScan : h));
    };

    return { 
        scanContent, 
        currentScan, 
        setCurrentScan,
        history, 
        isLoading, 
        error, 
        toggleMuteFinding 
    };
};