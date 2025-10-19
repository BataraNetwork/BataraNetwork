import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// This function will be deployed to /api/analyze-metrics
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { history } = request.body;

  if (!history || !Array.isArray(history) || history.length === 0) {
    return response.status(400).json({ error: 'Metric history data is required and must be a non-empty array.' });
  }
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: 'API_KEY is not configured on the server.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Convert history to a more compact string format for the prompt
    const historyString = history.map((h: any) => 
        `Time: ${h.time}, CPU: ${h.cpuUsage}%, Mem: ${h.memoryUsage}%, NetIn: ${h.networkIo.ingress}kbps, NetOut: ${h.networkIo.egress}kbps`
    ).join('\n');

    const geminiResponse = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: `
            You are an expert Site Reliability Engineer (SRE) specializing in AIOps for blockchain infrastructure.
            Your task is to analyze a time-series dataset of performance metrics from a "Bataranetwork" node and identify any anomalies or noteworthy patterns.

            Analyze the following recent metric history. Look for:
            - **Spikes or Dips:** Sudden, significant changes in any metric.
            - **Anomalous Correlations:** e.g., CPU usage spiking while network I/O drops unexpectedly.
            - **Concerning Trends:** e.g., Memory usage consistently trending upwards (potential memory leak).
            
            Provide a very brief, one or two-sentence summary of your findings in Markdown format.
            - If you find a clear anomaly, state it directly. Example: "Unusual spike in Network Egress detected around [time]. It is 3 standard deviations above the recent average."
            - If multiple metrics seem correlated, mention it. Example: "CPU and Memory usage are both trending upwards, suggesting a potential resource leak."
            - **If no significant anomalies are found, respond with a simple, reassuring message like "No anomalies detected. System operating within normal parameters."**

            Metric History (last 30 data points):
            \`\`\`
            ${historyString}
            \`\`\`
        `,
        config: {
            temperature: 0.1,
            maxOutputTokens: 150,
        }
    });
    
    const analysisText = geminiResponse.text.trim();

    return response.status(200).json({ analysis: analysisText });

  } catch (error: any) {
    console.error("Error in /api/analyze-metrics:", error);
    return response.status(500).json({ error: "Failed to generate metric analysis from the AI service." });
  }
}