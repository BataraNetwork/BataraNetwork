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

  it('should generate a critical CPU alert when usage exceeds 85%', () => {
    const { result } = renderHook(() => useNodeStatus());

    // Force CPU to go high
    act(() => {
      // This is a bit of a hack since the internal state is not exposed.
      // We advance time many times to increase the chance of random high CPU.
      // A better way would be to refactor the hook to be more testable.
      // For this test, we'll spy on Math.random.
      // FIX: Replaced `global.Math` with `Math` to resolve "Cannot find name 'global'" error.
      jest.spyOn(Math, 'random').mockReturnValue(0.9); // Will cause CPU to increase
    });
    
    act(() => {
        // Run enough intervals to push CPU over the threshold
        for (let i = 0; i < 20; i++) {
            jest.advanceTimersByTime(2000);
        }
    });

    const cpuAlert = result.current.alerts.find(a => a.id.includes('-cpu'));
    expect(cpuAlert).toBeDefined();
    expect(cpuAlert?.severity).toBe('critical');
    expect(result.current.status.cpuUsage).toBeGreaterThan(85);
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