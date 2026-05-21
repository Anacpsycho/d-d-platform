import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export const useApi = <T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options?: UseApiOptions<T>
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await apiFunction(...args);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err: any) {
        const errorMessage =
          (err as AxiosError<{ message: string }>)?.response?.data?.message ||
          err.message ||
          'An error occurred';
        setError(errorMessage);
        options?.onError?.(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunction, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
  };
};

// Made with Bob
