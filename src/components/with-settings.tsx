"use client";

import { useJustFetchSettings } from "#/hooks/fetch/use-fetch-settings";

export function WithSettings({ children }: React.PropsWithChildren) {
	useJustFetchSettings();

	return children;
}
