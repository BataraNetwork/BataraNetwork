import { useState, useEffect } from 'react';

export const useApiKey = () => {
  const [isApiKeyConfigured, setIsApiKeyConfigured] = useState(false);

  useEffect(() => {
    const key = process.env.API_KEY;
    if (key && key.trim() !== '') {
      setIsApiKeyConfigured(true);
    }
  }, []);

  return { isApiKeyConfigured };
};
