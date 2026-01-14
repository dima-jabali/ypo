/**
 * Removes the fragment identifier (hash text) from a given URL string.
 * This function handles URLs with or without a hash and returns a clean URL.
 */
export function removeUrlHash(maybeUrl: string): string {
	const parsedUrl = URL.parse(maybeUrl);

	if (parsedUrl === null) {
		return maybeUrl;
	}

	parsedUrl.hash = "";

	return parsedUrl.href;
}
