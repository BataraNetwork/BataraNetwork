import { useState, useEffect, useRef, useCallback } from 'react';
import { PipelineRun, PipelineStage } from '../types';

const STAGES: PipelineStage['name'][] = [
    'Checkout',
    'Build',
    'Lint & Static Analysis',
    'Unit & Integration Tests',
    'Security Scan',
    'Deploy to Production',
    'Smoke Tests'
];

let runIdCounter = 1;

export const usePipeline = () => {
    const [currentRun, setCurrentRun] = useState<PipelineRun | null>(null);
    const [history, setHistory] = useState<PipelineRun[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const updateStage = (stageIndex: number, newStatus: PipelineStage['status'], duration?: number) => {
        setCurrentRun(prev => {
            if (!prev) return null;
            const newStages = [...prev.stages];
            newStages[stageIndex] = { ...newStages[stageIndex], status: newStatus, duration };
            return { ...prev, stages: newStages };
        });
    };
    
    const setRunStatus = (status: PipelineRun['status']) => {
        setCurrentRun(prev => prev ? { ...prev, status } : null);
    }
    
    const stopRun = (finalStatus: 'success' | 'failed') => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunStatus(finalStatus);
        
        setCurrentRun(prev => {
            if (prev) {
                 setHistory(h => [{...prev, status: finalStatus}, ...h]);
            }
            return prev;
        });
    };

    const runStage = useCallback((stageIndex: number) => {
        if (stageIndex >= STAGES.length) {
            stopRun('success');
            return;
        }

        const stageName = STAGES[stageIndex];
        if (stageName === 'Deploy to Production') {
            updateStage(stageIndex, 'approval');
            setRunStatus('approval');
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        updateStage(stageIndex, 'running');
        const startTime = Date.now();

        intervalRef.current = setTimeout(() => {
            const duration = (Date.now() - startTime) / 1000;
            // Simulate random failure
            if (Math.random() < 0.1 && stageIndex > 0) { // Never fail on checkout
                updateStage(stageIndex, 'failed', duration);
                stopRun('failed');
            } else {
                updateStage(stageIndex, 'success', duration);
                runStage(stageIndex + 1);
            }
        }, 1500);
    }, []);


    const runPipeline = useCallback(() => {
        if (currentRun?.status === 'running' || currentRun?.status === 'approval') return;

        const newRun: PipelineRun = {
            id: runIdCounter++,
            status: 'running',
            triggeredBy: 'Alice (SRE)',
            startTime: new Date().toLocaleString(),
            stages: STAGES.map(name => ({ name, status: 'pending' }))
        };

        setCurrentRun(newRun);
        setHistory(prev => [newRun, ...prev]);

        runStage(0);

    }, [currentRun, runStage]);

    const approveStage = () => {
        const approvalStageIndex = currentRun?.stages.findIndex(s => s.status === 'approval');
        if (currentRun?.status !== 'approval' || approvalStageIndex === undefined || approvalStageIndex === -1) return;
        
        updateStage(approvalStageIndex, 'success', 0.5);
        setRunStatus('running');
        runStage(approvalStageIndex + 1);
    };

    const rejectStage = () => {
        const approvalStageIndex = currentRun?.stages.findIndex(s => s.status === 'approval');
        if (currentRun?.status !== 'approval' || approvalStageIndex === undefined || approvalStageIndex === -1) return;

        updateStage(approvalStageIndex, 'failed', 0.5);
        stopRun('failed');
    };
    
    useEffect(() => {
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, []);


    return {
        currentRun,
        history,
        isRunning: currentRun?.status === 'running' || currentRun?.status === 'approval',
        runPipeline,
        approveStage,
        rejectStage,
    };
};
