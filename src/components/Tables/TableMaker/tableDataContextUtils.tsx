import { createContext, useContext } from "react";
import type { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

import type { TableDataContextType, TableDataStore } from "./tableDataContext";

export const TableDataContext = createContext<TableDataContextType | null>(
	null,
);

export const useTableData = <T,>(
	selector: Parameters<typeof useStore<TableDataStore, T>>[1],
) => {
	const context = useContext(TableDataContext);

	if (!context) {
		throw new Error("`useTableData` must be used within a TableDataProvider");
	}

	return useStoreWithEqualityFn(context.store, selector, shallow);
};

/** Get table data from context without re-render */
export const useImmediateTableData = () => {
	const context = useContext(TableDataContext);

	if (!context) {
		throw new Error("`useTableData` must be used within a TableDataProvider");
	}

	return context.store;
};

export const useSetTableData = () => {
	const context = useContext(TableDataContext);

	if (!context) {
		throw new Error(
			"`useSetTableData` must be used within a TableDataProvider",
		);
	}

	return context.setTableData;
};

export const useBlockAndFilters = () =>
	useTableData((state) => state.blockFilterAndSort);
export const useHandleResizeStop = () =>
	useTableData((state) => state.handleResizeStop);
export const useGroupOfFilters = () =>
	useTableData((state) => state.groupOfFilters);
export const useTableForceRender = () =>
	useTableData((state) => state.forceRender);
export const useForceRender = () => useTableData((state) => state.forceRender);
export const useBlock = () => useTableData((state) => state.block);
export const useTable = () => useTableData((state) => state.table);
