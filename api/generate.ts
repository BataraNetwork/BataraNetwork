import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// This function will be deployed to /api/generate
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, configType, includeHpa } = request.body;

  if (!configType) {
    return response.status(400).json({ error: 'configType is required' });
  }
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: 'API_KEY is not configured on the server.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const hpaInstruction = includeHpa
      ? "If generating a Kubernetes or Helm configuration, also include a HorizontalPodAutoscaler (HPA) manifest targeting 80% CPU utilization."
      : "";

    const systemPrompt = `
      You are an expert DevOps engineer. Your task is to generate a professional, production-ready configuration file based on the user's request.
      The context is a blockchain node called "Bataranetwork".
      The user has requested a "${configType}" file.
      Adhere to the user's specific instructions. If no instructions are provided, generate a sensible default for the Bataranetwork node.
      For Helm Charts, return multiple files separated by '---' and prefixed with '# FILENAME: ' (e.g., '# FILENAME: Chart.yaml').
      For all other types, return only the raw file content without any extra explanation or markdown code fences.
      ${hpaInstruction}
    `;
    
    const userPrompt = `User instructions: "${prompt || 'Generate a default configuration.'}"`;

    const geminiResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `${systemPrompt}\n\n${userPrompt}`,
       config: {
        temperature: 0.1,
      }
    });

    const rawContent = geminiResponse.text.trim();
    
    let files;
    if (configType === 'Helm Chart') {
        files = rawContent.split('---').map(part => {
            const match = part.match(/# FILENAME: (.*?)\n/);
            if (match) {
                const name = match[1].trim();
                const content = part.replace(/# FILENAME: .*?\n/, '').trim();
                return { name, content };
            }
            return null;
        }).filter((file): file is { name: string; content: string } => file !== null && file.name.length > 0 && file.content.length > 0);
    } else {
      let fileName = 'config.txt';
      switch (configType) {
        case 'Dockerfile':
          fileName = 'Dockerfile';
          break;
        case 'Docker Compose':
          fileName = 'docker-compose.yml';
          break;
        case 'GitHub Actions':
          fileName = '.github/workflows/ci.yml';
          break;
        case 'Kubernetes':
          fileName = 'kubernetes.yaml';
          break;
        case 'Prometheus':
          fileName = 'prometheus.yml';
          break;
      }
      files = [{ name: fileName, content: rawContent }];
    }

    return response.status(200).json(files);

  } catch (error: any) {
    console.error("Error in /api/generate:", error);
    return response.status(500).json({ error: "Failed to generate configuration files from the AI service." });
  }
}