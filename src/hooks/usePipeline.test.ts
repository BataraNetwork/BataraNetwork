import { renderHook, act } from '@testing-library/react';
import { usePipeline } from './usePipeline';
// FIX: Import Jest globals to resolve type errors.
import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';

describe('usePipeline', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    // FIX: Replaced `global.Math` with `Math` to resolve "Cannot find name 'global'" error.
    jest.spyOn(Math, 'random').mockRestore(); // Clean up mock
  });

  it('should initialize with no current run and an empty history', () => {
    const { result } = renderHook(() => usePipeline());
    expect(result.current.currentRun).toBeNull();
    expect(result.current.history).toEqual([]);
    expect(result.current.isRunning).toBe(false);
  });

  it('should start a new pipeline run when runPipeline is called', () => {
    const { result } = renderHook(() => usePipeline());

    act(() => {
      result.current.runPipeline();
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.currentRun).not.toBeNull();
    expect(result.current.currentRun?.status).toBe('running');
    expect(result.current.history.length).toBe(1);
    expect(result.current.history[0].id).toBe(result.current.currentRun?.id);
  });

  it('should progress through stages successfully', () => {
    const { result } = renderHook(() => usePipeline());

    act(() => {
      result.current.runPipeline();
    });

    // Advance through the first 5 stages before approval
    for(let i=0; i < 5; i++) {
        expect(result.current.currentRun?.stages[i].status).toBe('running');
        act(() => { jest.advanceTimersByTime(1500); });
        expect(result.current.currentRun?.stages[i].status).toBe('success');
    }

    // Now at approval stage
    expect(result.current.currentRun?.stages[5].status).toBe('approval');
    expect(result.current.isRunning).toBe(true); // Still running, but paused
    expect(result.current.currentRun?.status).toBe('approval');
  });
  
  it('should pause at the approval stage and continue after approval', () => {
    const { result } = renderHook(() => usePipeline());
    
    act(() => { result.current.runPipeline(); });

    // Advance to approval stage
    act(() => { jest.advanceTimersByTime(1500 * 5); });
    expect(result.current.currentRun?.status).toBe('approval');

    // Approve
    act(() => { result.current.approveStage(); });
    expect(result.current.currentRun?.status).toBe('running');
    expect(result.current.currentRun?.stages[5].status).toBe('success');
    
    // Final stage runs
    act(() => { jest.advanceTimersByTime(1500); });
    expect(result.current.currentRun?.stages[6].status).toBe('success');

    // Pipeline finishes
    act(() => { jest.advanceTimersByTime(1500); });
    expect(result.current.isRunning).toBe(false);
    expect(result.current.currentRun?.status).toBe('success');
  });

  it('should fail the pipeline if a stage is rejected', () => {
    const { result } = renderHook(() => usePipeline());
    act(() => { result.current.runPipeline(); });

    // Advance to approval stage
    act(() => { jest.advanceTimersByTime(1500 * 5); });
    expect(result.current.currentRun?.status).toBe('approval');

    // Reject
    act(() => { result.current.rejectStage(); });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.currentRun?.status).toBe('failed');
    expect(result.current.currentRun?.stages[5].status).toBe('failed');
    
    // Check history
    expect(result.current.history[0].status).toBe('failed');
  });

  it('should fail the pipeline if a stage randomly fails', () => {
    // Force a failure on the second stage
    // FIX: Replaced `global.Math` with `Math` to resolve "Cannot find name 'global'" error.
    jest.spyOn(Math, 'random').mockReturnValueOnce(1).mockReturnValueOnce(0.05);

    const { result } = renderHook(() => usePipeline());
    act(() => { result.current.runPipeline(); });
    
    // First stage succeeds
    act(() => { jest.advanceTimersByTime(1500); });
    expect(result.current.currentRun?.stages[0].status).toBe('success');

    // Second stage fails
    act(() => { jest.advanceTimersByTime(1500); });
    expect(result.current.isRunning).toBe(false);
    expect(result.current.currentRun?.status).toBe('failed');
    expect(result.current.currentRun?.stages[1].status).toBe('failed');
  });
});
