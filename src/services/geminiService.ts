import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedFile } from "../types";

// Ensure API_KEY is available from environment variables
if (!process.env.API_KEY) {
  // In a real app, you might want to handle this more gracefully,
  // but for this context, we'll log a warning.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Generates DevOps configuration files based on a user prompt.
 */
export const generateDevOpsConfig = async (prompt: string): Promise<GeneratedFile[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro", // Use a powerful model for code generation
      contents: `
        Analyze the following request and generate the appropriate DevOps configuration files.
        The user wants to set up infrastructure for a "Bataranetwork" blockchain node.
        The available file types are: Dockerfile, docker-compose.yml, .github/workflows/ci.yml, kubernetes.yaml, and helm-chart.zip.
        Return the response as a JSON array of objects, where each object has a "name" (the filename) and "content" (the file content as a string).
        Only generate files that are relevant to the user's request.
        For example, if the user asks for a Docker setup, provide Dockerfile and docker-compose.yml.
        If they ask for Kubernetes, provide kubernetes.yaml.

        User Request: "${prompt}"
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "The name of the configuration file (e.g., 'Dockerfile', 'kubernetes.yaml')."
              },
              content: {
                type: Type.STRING,
                description: "The full content of the configuration file."
              }
            },
            required: ["name", "content"]
          }
        }
      }
    });

    const jsonString = response.text.trim();
    const generatedFiles = JSON.parse(jsonString) as GeneratedFile[];
    
    // Basic validation
    if (!Array.isArray(generatedFiles) || generatedFiles.some(f => !f.name || !f.content)) {
        throw new Error("Invalid response format from Gemini API.");
    }

    return generatedFiles;

  } catch (error) {
    console.error("Error generating DevOps config:", error);
    // Provide a user-friendly error message
    throw new Error("Failed to generate configuration files. Please check your prompt and API key.");
  }
};


/**
 * Scans source code for security vulnerabilities.
 */
export const scanCodeForSecurityIssues = async (code: string, fileName: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro", // Good for code analysis
            contents: `
                Act as an expert security auditor. Analyze the following source code from the file "${fileName}" for security vulnerabilities.
                Focus on common issues like injection flaws, improper error handling, secrets exposure, and insecure dependencies.
                Provide a concise summary of your findings. If no issues are found, state that clearly.
                Do not suggest fixes, just identify the potential vulnerabilities.
                
                Source Code:
                \`\`\`
                ${code}
                \`\`\`
            `,
             config: {
                // Keep temperature low for factual analysis
                temperature: 0.2,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error scanning code for security issues:", error);
        throw new Error("Failed to scan code. The AI service may be unavailable.");
    }
};
