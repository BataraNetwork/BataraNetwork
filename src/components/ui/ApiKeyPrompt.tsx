import React from 'react';

export const ApiKeyPrompt: React.FC = () => (
  <div className="p-4 mb-6 bg-yellow-500/10 text-yellow-400 border border-yellow-500/50 rounded-lg shadow-md" role="alert">
    <h3 className="font-bold text-lg text-yellow-300">API Key Not Configured</h3>
    <p className="text-sm mt-1">
      To enable AI generation features, please set your Gemini API key as an environment variable named <code>API_KEY</code> in your deployment environment. 
      This is a security measure to protect your credentials. AI features are currently disabled.
    </p>
  </div>
);