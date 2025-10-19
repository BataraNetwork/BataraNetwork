import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// This function will be deployed to /api/analyze
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { content } = request.body;

  if (!content) {
    return response.status(400).json({ error: 'Content is required for analysis' });
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
            Act as a senior DevSecOps engineer and security auditor.
            Analyze the following configuration content for security vulnerabilities, misconfigurations, and deviations from best practices.
            Provide your findings as a JSON array of objects. Each object should have three properties: "severity", "description", and "recommendation".
            Severity can be one of: "Critical", "High", "Medium", "Low", "Informational".
            If no issues are found, return an empty array.

            Configuration Content to Analyze:
            \`\`\`
            ${content}
            \`\`\`
        `,
         config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  severity: { type: Type.STRING },
                  description: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                },
                required: ["severity", "description", "recommendation"]
              }
            },
            temperature: 0.2,
        }
    });

    const jsonString = geminiResponse.text.trim();
    const findings = JSON.parse(jsonString);
    
    const findingsWithIds = findings.map((finding: any) => ({
        ...finding,
        id: crypto.randomUUID(),
        muted: false,
    }));
    
    return response.status(200).json(findingsWithIds);

  } catch (error: any) {
    console.error("Error in /api/analyze:", error);
    return response.status(500).json({ error: "Failed to analyze configuration from the AI service." });
  }
}
