import { generateBasicAuth } from './utils';

// ... existing code ...

export function useCredentials() {
  // ... existing code ...

  const nextsmsAuth = useMemo(() => {
    if (process.env.NEXTSMS_USERNAME && process.env.NEXTSMS_PASSWORD) {
      return generateBasicAuth(process.env.NEXTSMS_USERNAME, process.env.NEXTSMS_PASSWORD);
    }
    return '';
  }, []);

  // ... rest of the code ...
}