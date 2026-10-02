import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for declarative API fetching, caching, polling, and lifecycle management.
 *
 * @param {Function} queryFn - Async function returning data
 * @param {Object} options - Configuration options
 * @param {boolean} [options.enabled=true] - Whether query should execute automatically
 * @param {number|null} [options.refetchInterval=null] - Auto-polling interval in ms
 * @param {any} [options.initialData=null] - Initial data before query resolves
 * @param {Array} [options.deps=[]] - Dependency array to trigger refetch on change
 * @param {Function} [options.onSuccess] - Callback fired on successful fetch
 * @param {Function} [options.onError] - Callback fired on error
 * @returns {Object} Query state and control handlers
 */
export function useApiQuery(queryFn, options = {}) {
  const {
    enabled = true,
    refetchInterval = null,
    initialData = null,
    deps = [],
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const queryFnRef = useRef(queryFn);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    queryFnRef.current = queryFn;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  const execute = useCallback(
    async (isBackground = false) => {
      if (!queryFnRef.current) return;

      if (isBackground) {
        setIsRefetching(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const result = await queryFnRef.current();
        setData(result);
        setLastUpdated(new Date());
        if (onSuccessRef.current) {
          onSuccessRef.current(result);
        }
        return result;
      } catch (err) {
        const errMsg = err?.message || "Terjadi kesalahan saat memuat data";
        setError(errMsg);
        if (onErrorRef.current) {
          onErrorRef.current(err);
        }
      } finally {
        setLoading(false);
        setIsRefetching(false);
      }
    },
    [] // Stable reference
  );

  // Initial trigger & dependency watcher
  useEffect(() => {
    if (enabled) {
      execute(false);
    }
  }, [enabled, execute, ...deps]);

  // Polling interval
  useEffect(() => {
    if (!enabled || !refetchInterval || refetchInterval <= 0) return;

    const intervalId = setInterval(() => {
      execute(true);
    }, refetchInterval);

    return () => clearInterval(intervalId);
  }, [enabled, refetchInterval, execute]);

  const refetch = useCallback(() => execute(false), [execute]);

  return {
    data,
    setData,
    loading,
    isRefetching,
    error,
    lastUpdated,
    refetch,
  };
}
