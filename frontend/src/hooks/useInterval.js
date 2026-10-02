import { useEffect, useRef } from "react";

/**
 * Declarative setInterval hook that handles cleanup and dynamic delay updates safely.
 *
 * @param {Function} callback - Function to execute on interval
 * @param {number|null} delay - Delay in ms, or null to pause
 */
export function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null || delay === undefined || delay <= 0) {
      return;
    }

    const id = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => clearInterval(id);
  }, [delay]);
}
