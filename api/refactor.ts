
import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// This function will be deployed to /api/refactor
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { content } = request.body;

  if (!content) {
    return response.status(400).json({ error: 'Content is required for refactoring' });
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
            Act as a principal DevOps architect and Staff SRE.
            Your task is to analyze the following configuration file and provide a refactored, improved version.
            Focus on best practices for security, performance, cost-optimization, and readability.
            
            You must return your response as a single JSON object with two keys: "explanation" and "refactoredCode".
            - "explanation": A string containing a brief, bulleted list in Markdown format explaining the key improvements you made.
            - "refactoredCode": A string containing only the raw, complete, refactored configuration file content. Do not wrap it in markdown fences.

            Configuration Content to Analyze and Refactor:
            \`\`\`
            ${content}
            \`\`\`
        `,
         config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                explanation: { type: Type.STRING },
                refactoredCode: { type: Type.STRING },
              },
              required: ["explanation", "refactoredCode"]
            },
            temperature: 0.1,
        }
    });

    const jsonString = geminiResponse.text.trim();
    const result = JSON.parse(jsonString);
    
    return response.status(200).json(result);

  } catch (error: any) {
    console.error("Error in /api/refactor:", error);
    return response.status(500).json({ error: "Failed to refactor configuration from the AI service." });
  }
}
