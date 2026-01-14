import { useEffect } from "react";

export default function useOnOutsideClick(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ref: React.RefObject<any>,
	handler: (e: Event) => void,
) {
	useEffect(() => {
		const listener = (event: Event) => {
			if ("shiftKey" in event && event.shiftKey) return;

			if (!ref.current || ref.current.contains(event.target)) {
				return;
			}

			handler(event);
		};

		document.addEventListener("touchstart", listener);
		document.addEventListener("mousedown", listener);

		return () => {
			document.removeEventListener("touchstart", listener);
			document.removeEventListener("mousedown", listener);
		};
	}, [ref, handler]);
}
