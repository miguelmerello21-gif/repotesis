/**
 * Hook personalizado para manejar llamadas a la API
 * 
 * Proporciona:
 * - Estado de carga (loading)
 * - Estado de error
 * - Función para ejecutar llamadas
 * - Reseteo de estado
 */

import { useState, useCallback } from 'react';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  loadingInitial?: boolean;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: any | null;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: options.loadingInitial || false,
    error: null,
  });

  const execute = useCallback(
    async (apiFunction: () => Promise<any>) => {
      setState({ data: null, loading: true, error: null });

      try {
        const result = await apiFunction();

        if (result.success) {
          setState({ data: result.data, loading: false, error: null });
          options.onSuccess?.(result.data);
          return { success: true, data: result.data };
        } else {
          setState({ data: null, loading: false, error: result.error });
          options.onError?.(result.error);
          return { success: false, error: result.error };
        }
      } catch (error) {
        setState({ data: null, loading: false, error });
        options.onError?.(error);
        return { success: false, error };
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
