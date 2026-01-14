/// <reference types="vite/client" />

import { BrowserClerk } from "@clerk/clerk-react";

declare global {
	type TODO = unknown;

	interface Window {
		SHOULD_LOG: boolean;
		Clerk: BrowserClerk;
	}
}
