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

  const { prompt, includeHpa } = request.body;

  if (!prompt) {
    return response.status(400).json({ error: 'Prompt is required' });
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

    const geminiResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `
        Analyze the following request and generate the appropriate DevOps configuration files.
        The user wants to set up infrastructure for a "Bataranetwork" blockchain node.
        The available file types are: Dockerfile, docker-compose.yml, .github/workflows/ci.yml, kubernetes.yaml, and a multi-file Helm Chart.
        For Helm Charts, return multiple files prefixed with 'FILENAME: ' (e.g., 'FILENAME: Chart.yaml', 'FILENAME: values.yaml').
        Return the response as a single string.
        Only generate files that are relevant to the user's request.
        For example, if the user asks for a Docker setup, provide Dockerfile and docker-compose.yml.
        If they ask for Kubernetes, provide kubernetes.yaml.
        ${hpaInstruction}

        User Request: "${prompt}"
      `,
       config: {
        temperature: 0.1,
      }
    });

    const rawContent = geminiResponse.text.trim();
    
    let files;
    if (rawContent.includes('FILENAME:')) {
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
      if (prompt.toLowerCase().includes('dockerfile')) fileName = 'Dockerfile';
      else if (prompt.toLowerCase().includes('kubernetes')) fileName = 'kubernetes.yaml';
      else if (prompt.toLowerCase().includes('docker-compose')) fileName = 'docker-compose.yml';
      else if (prompt.toLowerCase().includes('github')) fileName = '.github/workflows/ci.yml';
      files = [{ name: fileName, content: rawContent }];
    }

    return response.status(200).json(files);

  } catch (error: any) {
    console.error("Error in /api/generate:", error);
    return response.status(500).json({ error: "Failed to generate configuration files from the AI service." });
  }
}
