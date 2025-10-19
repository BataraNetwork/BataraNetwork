import { renderHook, act } from '@testing-library/react';
import { useNodeStatus } from './useNodeStatus';
// FIX: Import Jest globals to resolve type errors.
import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';

describe('useNodeStatus', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks(); // Restore all mocks after each test
  });

  it('should initialize with a default active node', () => {
    const { result } = renderHook(() => useNodeStatus());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.status).toBeDefined();
    expect(result.current.activeNodeId).toBe('node-us-east-1');
    expect(result.current.availableNodes.length).toBe(3);
  });

  it('should update node status after an interval', () => {
    const { result } = renderHook(() => useNodeStatus());
    const initialBlockHeight = result.current.status.latestBlockHeight;

    act(() => {
      jest.advanceTimersByTime(2000); // Advance time by one interval
    });

    expect(result.current.status.latestBlockHeight).toBe(initialBlockHeight + 1);
    expect(result.current.history.length).toBe(1);
  });

  it('should generate and clear alerts based on metric thresholds', () => {
    const { result } = renderHook(() => useNodeStatus());

    // --- Part 1: Generate Alert ---
    let randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.9); // Force metric to increase

    act(() => {
        // Run enough intervals to push CPU over the 85% threshold
        for (let i = 0; i < 20; i++) {
            jest.advanceTimersByTime(2000);
        }
    });

    let cpuAlert = result.current.alerts.find(a => a.id.includes('-cpu') && a.status === 'active');
    expect(cpuAlert).toBeDefined();
    expect(cpuAlert?.severity).toBe('critical');
    expect(result.current.status.cpuUsage).toBeGreaterThan(85);

    // --- Part 2: Clear Alert ---
    randomSpy.mockReturnValue(0.1); // Force metric to decrease

    act(() => {
        // Run enough intervals to push CPU below the threshold
        for (let i = 0; i < 20; i++) {
            jest.advanceTimersByTime(2000);
        }
    });
    
    // The alert is now gone from the incoming alerts
    cpuAlert = result.current.alerts.find(a => a.id.includes('-cpu') && a.status === 'active');
    expect(cpuAlert).toBeUndefined(); 
    expect(result.current.status.cpuUsage).toBeLessThanOrEqual(85);
  });
  
  it('should change the active node and update its status', () => {
    const { result } = renderHook(() => useNodeStatus());
    const initialNodeStatus = result.current.nodes['node-eu-west-1'];

    act(() => {
      result.current.setActiveNodeId('node-eu-west-1');
    });

    expect(result.current.activeNodeId).toBe('node-eu-west-1');
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Verify the new active node's status has updated
    expect(result.current.status.latestBlockHeight).toBe(initialNodeStatus.latestBlockHeight + 1);
  });

  it('should maintain a history of the last 30 data points', () => {
    const { result } = renderHook(() => useNodeStatus());

    act(() => {
      for (let i = 0; i < 40; i++) {
        jest.advanceTimersByTime(2000);
      }
    });
    // The history is capped at 29 slices + 1 new entry = 30
    expect(result.current.history.length).toBe(30);
  });
});
