import { useEffect, useRef } from "react";

/**
 * Executes the setup function only once on mount,
 * bypassing React 18's Strict Mode double-effect in development.
 * The cleanup function still fires on the final unmount.
 * * @param setup A function containing the setup logic (like useEffect).
 * @param cleanup A function containing the cleanup logic (runs on unmount).
 */
export function useOnMount(
	setup: React.RefObject<() => void>,
	cleanup: React.RefObject<() => void>,
) {
	// 1. Use a ref to track if the effect has already run once successfully.
	const mounted = useRef(false);

	useEffect(() => {
		// 2. Check if this is the first real mount (after potential simulation).
		if (!mounted.current) {
			mounted.current = true;
			// Run the single-time setup logic
			setup.current();

			return;
		}

		// AND on the final, real unmount.
		return () => {
			// eslint-disable-next-line react-hooks/exhaustive-deps
			cleanup.current();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
}
