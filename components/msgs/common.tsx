export const TIMEOUT_TO_CHANGE_COPY_ICON = 2_000;

export function closeDetails(detailsElement: HTMLDetailsElement) {
	requestAnimationFrame(() => {
		detailsElement.removeAttribute("open");
	});
}
