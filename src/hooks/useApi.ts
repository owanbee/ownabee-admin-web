import * as React from "react";
import type { ApiError } from "@/types";

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
}

interface UseApiOptions {
  enabled?: boolean | undefined;
}

export function useApi<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseApiOptions = {}
): UseApiState<T> & { refetch: () => Promise<void> } {
  const { enabled = true } = options;
  const [state, setState] = React.useState<UseApiState<T>>({
    data: null,
    isLoading: enabled,
    error: null,
  });

  const fetchData = React.useCallback(async () => {
    if (!enabled) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await fetchFn();
      setState({ data, isLoading: false, error: null });
    } catch (err) {
      const errStatus = (err as { status?: number }).status;
      const error: ApiError = {
        message: err instanceof Error ? err.message : "An error occurred",
        ...(errStatus !== undefined ? { status: errStatus } : {}),
      };
      setState({ data: null, isLoading: false, error });
    }
  }, [fetchFn, enabled]);

  React.useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  return {
    ...state,
    refetch: fetchData,
  };
}

interface UseMutationState<TData> {
  data: TData | null;
  isLoading: boolean;
  error: ApiError | null;
}

interface UseMutationOptions<TData> {
  onSuccess?: ((data: TData) => void) | undefined;
  onError?: ((error: ApiError) => void) | undefined;
}

export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData> = {}
) {
  const [state, setState] = React.useState<UseMutationState<TData>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const mutate = React.useCallback(
    async (variables: TVariables) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await mutationFn(variables);
        setState({ data, isLoading: false, error: null });
        options.onSuccess?.(data);
        return data;
      } catch (err) {
        const errStatus = (err as { status?: number }).status;
        const error: ApiError = {
          message: err instanceof Error ? err.message : "An error occurred",
          ...(errStatus !== undefined ? { status: errStatus } : {}),
        };
        setState({ data: null, isLoading: false, error });
        options.onError?.(error);
        throw error;
      }
    },
    [mutationFn, options]
  );

  const reset = React.useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}
