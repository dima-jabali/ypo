import { createZustandProvider } from "#/contexts/create-zustand-provider";
import type { BatchTableColumn } from "#/types/batch-table";
import type { FilterGroup } from "./generalFilterTypes";
import { makeDefaultGroupOfFilters } from "./helpers";

type FiltersContextData = {
	columns: Array<BatchTableColumn>;
	isFiltersPopoverOpen: boolean;
	groupOfFilters: FilterGroup;
	forceRefresh: boolean;
};

export const {
	Provider: ConditionalExecutionFiltersContextProvider,
	useStore: useFiltersStore,
} = createZustandProvider<FiltersContextData>(
	() => ({
		groupOfFilters: makeDefaultGroupOfFilters(),
		isFiltersPopoverOpen: false,
		forceRefresh: true,
		columns: [],
	}),
	{ name: "ConditionalExecutionFiltersContextProvider" },
);
