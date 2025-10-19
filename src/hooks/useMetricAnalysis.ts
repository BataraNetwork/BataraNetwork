import { useState, useEffect } from 'react';
import { analyzeMetrics } from '../services/geminiService';
import { NodeStatus } from '../types';

// Debounce function to prevent API calls on every single render
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
};


export const useMetricAnalysis = (history: Omit<NodeStatus, 'id' | 'name' | 'region'>[]) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // We only want to run analysis if there's enough data and we are not already fetching.
    if (history.length < 10) {
      return;
    }
    
    const performAnalysis = async () => {
        setIsAnalyzing(true);
        setError(null);
        try {
          const result = await analyzeMetrics(history);
          // The AI might return an empty string or a "no issues found" message.
          // We can standardize this to `null` to make UI logic simpler.
          if (!result || result.toLowerCase().includes("no anomalies") || result.toLowerCase().includes("normal")) {
            setAnalysis(null);
          } else {
            setAnalysis(result);
          }
        } catch (e: any) {
          console.error("Metric analysis failed:", e);
          setError(e.message);
          setAnalysis("AI analysis failed to run.");
        } finally {
          setIsAnalyzing(false);
        }
    };
    
    // Use a timeout to trigger analysis periodically, not on every history change.
    const handler = setTimeout(performAnalysis, 30000); // Analyze every 30 seconds

    return () => {
        clearTimeout(handler);
    };

  }, [history]); // Dependency on history to get the latest data

  return { analysis, isAnalyzing, error };
};