import { createContext, useContext } from "react";

import type { DiffBatchTableContextData } from "./diff-store";

export const DiffStoreCtx = createContext<DiffBatchTableContextData | null>(
	null,
);

export function useDiffStore() {
	const store = useContext(DiffStoreCtx);

	if (!store) {
		throw new Error("useDiffStore must be used within a DiffStoreProvider");
	}

	return store;
}
