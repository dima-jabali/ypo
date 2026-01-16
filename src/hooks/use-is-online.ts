import { useCallback, useSyncExternalStore } from "react";

const getClientSnapshot = () => navigator.onLine;
const getServerSnapshot = () => true;

export function useIsOnline() {
  const subscribe = useCallback((callback: () => void) => {
    const abortController = new AbortController();
    const options: AddEventListenerOptions = {
      signal: abortController.signal,
    };

    window.addEventListener("offline", callback, options);
    window.addEventListener("online", callback, options);

    return () => {
      abortController.abort();
    };
  }, []);

  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
