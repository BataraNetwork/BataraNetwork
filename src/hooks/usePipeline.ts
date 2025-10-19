import { useState, useEffect, useCallback } from 'react';
import { PipelineStage, PipelineStatus, PipelineRun } from '../types';

const PIPELINE_TEMPLATE: PipelineStage[] = [
    { name: 'Checkout', status: 'pending' },
    { name: 'Install Dependencies', status: 'pending' },
    { name: 'Lint & Test', status: 'pending' },
    { name: 'Build Image', status: 'pending' },
    { name: 'Push to Registry', status: 'pending' },
    { name: 'Manual Approval (Staging)', status: 'pending' },
    { name: 'Deploy to Production', status: 'pending' },
];

let runCounter = 1;

export const usePipeline = () => {
  const [currentRun, setCurrentRun] = useState<PipelineRun | null>(null);
  const [history, setHistory] = useState<PipelineRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const updateRunStatus = useCallback((runId: number, status: PipelineStatus, stages?: PipelineStage[]) => {
      const update = (run: PipelineRun) => ({
          ...run,
          status,
          stages: stages || run.stages,
      });

      if (currentRun && currentRun.id === runId) {
          setCurrentRun(prev => prev ? update(prev) : null);
      }
      setHistory(prev => prev.map(r => r.id === runId ? update(r) : r));
  }, [currentRun]);


  const runStage = useCallback((runId: number, stageIndex: number) => {
    if (!currentRun || currentRun.id !== runId || stageIndex >= currentRun.stages.length) {
      if(currentRun) updateRunStatus(runId, 'success');
      setIsRunning(false);
      return;
    }

    const currentStage = currentRun.stages[stageIndex];
    if (currentStage.status === 'approval') {
        updateRunStatus(runId, 'approval');
        return; // Pause execution
    }

    const updatedStages = currentRun.stages.map((s, i) => i === stageIndex ? { ...s, status: 'running' } : s);
    setCurrentRun(prev => prev ? { ...prev, stages: updatedStages } : null);

    setTimeout(() => {
        // Simulate potential failure
        const didFail = Math.random() < 0.1 && stageIndex > 0;
        const newStatus = didFail ? 'failed' : 'success';

        const finalStages = currentRun.stages.map((s, i) => 
            i === stageIndex ? { ...s, status: newStatus, duration: `${Math.floor(Math.random() * 20 + 5)}s` } : s
        );
        setCurrentRun(prev => prev ? { ...prev, stages: finalStages } : null);

        if (didFail) {
            updateRunStatus(runId, 'failed', finalStages);
            setIsRunning(false);
        } else {
            runStage(runId, stageIndex + 1);
        }
    }, 1500);
  }, [currentRun, updateRunStatus]);

  const runPipeline = () => {
    setIsRunning(true);
    const newRun: PipelineRun = {
        id: runCounter++,
        triggeredAt: new Date().toLocaleString(),
        status: 'running',
        stages: PIPELINE_TEMPLATE.map(s => ({...s})),
    };
    setCurrentRun(newRun);
    setHistory(prev => [newRun, ...prev.slice(0, 4)]); // Keep last 5 runs
    runStage(newRun.id, 0);
  };

  const approveStage = () => {
    if (!currentRun || currentRun.status !== 'approval') return;
    const approvalStageIndex = currentRun.stages.findIndex(s => s.status === 'approval');
    if (approvalStageIndex === -1) return;
    
    const updatedStages = currentRun.stages.map((s, i) => i === approvalStageIndex ? { ...s, status: 'success', duration: '2s' } : s);
    setCurrentRun(prev => prev ? { ...prev, stages: updatedStages, status: 'running' } : null);
    
    runStage(currentRun.id, approvalStageIndex + 1);
  };

  const rejectStage = () => {
    if (!currentRun || currentRun.status !== 'approval') return;
    const approvalStageIndex = currentRun.stages.findIndex(s => s.status === 'approval');
    if (approvalStageIndex === -1) return;

    const updatedStages = currentRun.stages.map((s, i) => i === approvalStageIndex ? { ...s, status: 'failed', duration: '1s' } : s);
    updateRunStatus(currentRun.id, 'failed', updatedStages);
    setIsRunning(false);
  };

  const rollback = (runId: number) => {
      // This is a simulation
      alert(`Simulating rollback for deployment from Run #${runId}.`);
  };

  return { currentRun, history, isRunning, runPipeline, approveStage, rejectStage, rollback };
};