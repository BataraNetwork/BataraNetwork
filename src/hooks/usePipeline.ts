import { useState, useEffect } from 'react';
import { PipelineStage, PipelineStatus } from '../types';

const initialStages: PipelineStage[] = [
    { name: 'Checkout', status: 'pending' },
    { name: 'Install Dependencies', status: 'pending' },
    { name: 'Lint', status: 'pending' },
    { name: 'Build', status: 'pending' },
    { name: 'Test', status: 'pending' },
    { name: 'Push to Registry', status: 'pending' },
];

export const usePipeline = () => {
  const [stages, setStages] = useState<PipelineStage[]>(initialStages);
  const [overallStatus, setOverallStatus] = useState<PipelineStatus>('pending');
  const [lastRun, setLastRun] = useState<string>('Never');

  const runPipeline = () => {
    setStages(initialStages);
    setOverallStatus('running');
    setLastRun(new Date().toLocaleString());

    let currentStage = 0;
    const interval = setInterval(() => {
        if (currentStage >= initialStages.length) {
            setOverallStatus('success');
            clearInterval(interval);
            return;
        }

        // Simulate random failure
        const shouldFail = Math.random() < 0.1 && currentStage > 1;

        if (shouldFail) {
            setStages(prev => prev.map((stage, index) =>
                index === currentStage ? { ...stage, status: 'failed', duration: '15s' } : stage
            ));
            setOverallStatus('failed');
            clearInterval(interval);
            return;
        }

        setStages(prev => prev.map((stage, index) =>
            index === currentStage ? { ...stage, status: 'success', duration: `${Math.floor(Math.random() * 30 + 5)}s` } : stage
        ));
        
        currentStage++;

        if (currentStage < initialStages.length) {
             setStages(prev => prev.map((stage, index) =>
                index === currentStage ? { ...stage, status: 'running' } : stage
            ));
        }

    }, 2000); // 2 seconds per stage
  };

  return { stages, overallStatus, lastRun, runPipeline };
};
