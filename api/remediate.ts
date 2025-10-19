import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// This function will be deployed to /api/remediate
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { alert } = request.body;

  if (!alert) {
    return response.status(400).json({ error: 'Alert data is required' });
  }
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: 'API_KEY is not configured on the server.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const geminiResponse = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: `
            You are a senior Site Reliability Engineer (SRE) specializing in blockchain infrastructure.
            An alert has been triggered on a "Bataranetwork" node. Your task is to provide a clear, concise, step-by-step remediation plan in Markdown format.
            The plan should be actionable for a DevOps engineer.

            Alert Details:
            - Node ID: ${alert.nodeId}
            - Severity: ${alert.severity.toUpperCase()}
            - Message: "${alert.message}"
            - Timestamp: ${new Date(alert.timestamp).toISOString()}

            Based on this alert, generate a potential remediation plan. Start with a brief summary of the likely problem, then provide numbered steps. Include example commands where appropriate.
        `,
        config: {
            temperature: 0.3,
        }
    });
    
    const planText = geminiResponse.text.trim();

    return response.status(200).json({ plan: planText });

  } catch (error: any) {
    console.error("Error in /api/remediate:", error);
    return response.status(500).json({ error: "Failed to generate remediation plan from the AI service." });
  }
}