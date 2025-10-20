import { renderHook, act, waitFor } from '@testing-library/react';
import { useNodeStatus } from './useNodeStatus';
import { nodeService } from '../services/nodeService';
import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';

// Mock the nodeService
jest.mock('../services/nodeService', () => ({
  nodeService: {
    getStatus: jest.fn(),
  },
}));

const mockNodeService = nodeService as jest.Mocked<typeof nodeService>;

describe('useNodeStatus', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockNodeService.getStatus.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be in a loading state initially and then fetch status', async () => {
    mockNodeService.getStatus.mockResolvedValue({
      latestBlockHeight: 100,
      pendingTransactions: 5,
      validatorCount: 1,
      totalStaked: 1000000,
      activeProposals: 0,
      uptime: 120,
      memoryUsage: 30.5,
      cpuUsage: 15.2,
    });
    
    const { result } = renderHook(() => useNodeStatus());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.status).toBeUndefined();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.status).toBeDefined();
    expect(result.current.status?.latestBlockHeight).toBe(100);
    expect(result.current.status?.cpuUsage).toBe(15.2);
  });

  it('should poll for new status updates at intervals', async () => {
    mockNodeService.getStatus
      .mockResolvedValueOnce({ latestBlockHeight: 100, pendingTransactions: 5, validatorCount:1, totalStaked:0, activeProposals:0, uptime:1, cpuUsage:10, memoryUsage:20 })
      .mockResolvedValueOnce({ latestBlockHeight: 101, pendingTransactions: 8, validatorCount:1, totalStaked:0, activeProposals:0, uptime:4, cpuUsage:12, memoryUsage:22 });

    const { result } = renderHook(() => useNodeStatus());
    
    await waitFor(() => expect(result.current.status?.latestBlockHeight).toBe(100));
    
    // Advance timers to trigger the next poll
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => expect(result.current.status?.latestBlockHeight).toBe(101));
    expect(result.current.status?.pendingTransactions).toBe(8);
    expect(mockNodeService.getStatus).toHaveBeenCalledTimes(2);
  });
  
  it('should set an error state if the API call fails', async () => {
    mockNodeService.getStatus.mockRejectedValue(new Error('Network Error'));
    
    const { result } = renderHook(() => useNodeStatus());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toContain('Failed to connect');
    expect(result.current.status).toBeUndefined();
  });
  
  it('should update the history with new data points', async () => {
     mockNodeService.getStatus.mockResolvedValue({ latestBlockHeight: 100, pendingTransactions: 5, validatorCount:1, totalStaked:0, activeProposals:0, uptime:1, cpuUsage:10, memoryUsage:20 });

    const { result } = renderHook(() => useNodeStatus());

    await waitFor(() => expect(result.current.history.length).toBe(1));
    expect(result.current.history[0].cpuUsage).toBe(10);

    // Update the mock for the next call
    mockNodeService.getStatus.mockResolvedValue({ latestBlockHeight: 101, pendingTransactions: 8, validatorCount:1, totalStaked:0, activeProposals:0, uptime:4, cpuUsage:12, memoryUsage:22 });

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => expect(result.current.history.length).toBe(2));
    expect(result.current.history[1].cpuUsage).toBe(12);
  });
});