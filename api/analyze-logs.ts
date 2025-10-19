import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// This function will be deployed to /api/analyze-logs
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { logs } = request.body;

  if (!logs || !Array.isArray(logs)) {
    return response.status(400).json({ error: 'Log data is required and must be an array.' });
  }
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: 'API_KEY is not configured on the server.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Convert logs to a more compact string format for the prompt
    const logString = logs.map((log: any) => `${log.timestamp} [${log.level.toUpperCase()}] ${log.message}`).join('\n');

    const geminiResponse = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: `
            You are a senior Site Reliability Engineer (SRE) tasked with analyzing a stream of logs from a "Bataranetwork" blockchain node.
            Your goal is to quickly identify patterns, highlight critical issues, and suggest potential root causes.

            Please analyze the following log entries and provide a summary in Markdown format.
            Your analysis should include:
            1.  **Overall Health Summary:** A brief, one-sentence assessment of the system's state (e.g., "System appears healthy with minor warnings," "System is experiencing critical errors requiring immediate attention.").
            2.  **Key Patterns & Anomalies:** Identify any recurring warnings, errors, or unusual activity patterns.
            3.  **Critical Errors:** List the most severe errors and how many times they occurred.
            4.  **Potential Root Cause:** Based on the logs, suggest the most likely root cause for any significant issues.

            Log Entries to Analyze:
            \`\`\`
            ${logString}
            \`\`\`
        `,
        config: {
            temperature: 0.2,
        }
    });
    
    const analysisText = geminiResponse.text.trim();

    return response.status(200).json({ analysis: analysisText });

  } catch (error: any) {
    console.error("Error in /api/analyze-logs:", error);
    return response.status(500).json({ error: "Failed to generate log analysis from the AI service." });
  }
}