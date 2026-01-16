"use client";

import { useJustFetchSettings } from "#/hooks/fetch/use-fetch-settings";

export function WithSettings({ children }: React.PropsWithChildren) {
			if (typeof window === "undefined") {
		return null;
	}
	
	useJustFetchSettings();

	return children;
}
