import { useCallback } from "react";
import { useFiltersStore } from "./FiltersContextProvider";
import type {
	ChildFilter,
	ColumnOptionsValueOperator,
	Filter,
} from "./generalFilterTypes";
import {
	modifyChildFilter,
	withFilter,
	withFilterOperator,
	withoutFilter,
} from "./helpers";
import type { FilterOperator } from "#/components/Tables/TableMaker/filters/utilityTypes";
import type { BatchTableColumnId } from "#/types/batch-table";

export const useAddFilter = () => {
	const filtersStore = useFiltersStore();

	return useCallback(
		(filterToAdd: Filter, filterAbove?: Filter) => {
			filtersStore.setState((prev) => {
				withFilter({
					parentFilter: prev.groupOfFilters,
					filterToAdd,
					filterAbove,
				});

				return {
					groupOfFilters: prev.groupOfFilters,
					forceRefresh: !prev.forceRefresh,
				};
			});
		},
		[filtersStore],
	);
};

export const useSetAnd_or_Or = () => {
	const filtersStore = useFiltersStore();

	return useCallback(
		(filterToBeModified: Filter, newFilterOperator: FilterOperator) => {
			filtersStore.setState((prev) => {
				withFilterOperator({
					parentFilter: prev.groupOfFilters,
					filterToBeModified,
					newFilterOperator,
				});

				return {
					groupOfFilters: prev.groupOfFilters,
					forceRefresh: !prev.forceRefresh,
				};
			});
		},
		[filtersStore],
	);
};

export const useSetValueOperator = () => {
	const filtersStore = useFiltersStore();

	return useCallback(
		(
			filterToBeModified: ChildFilter,
			newValueOperator: ColumnOptionsValueOperator,
		) =>
			filtersStore.setState((prev) => {
				modifyChildFilter({
					parentFilter: prev.groupOfFilters,
					keyToModify: "value_operator",
					newValue: newValueOperator,
					filterToBeModified,
				});

				return {
					groupOfFilters: prev.groupOfFilters,
					forceRefresh: !prev.forceRefresh,
				};
			}),
		[filtersStore],
	);
};

export const useSetColumnId = () => {
	const filtersStore = useFiltersStore();

	return useCallback(
		(filterToBeModified: ChildFilter, newColumnId: BatchTableColumnId) =>
			filtersStore.setState((prev) => {
				modifyChildFilter({
					parentFilter: prev.groupOfFilters,
					keyToModify: "column_id",
					newValue: newColumnId,
					filterToBeModified,
				});

				return {
					groupOfFilters: prev.groupOfFilters,
					forceRefresh: !prev.forceRefresh,
				};
			}),
		[filtersStore],
	);
};

export const useSetCaseSensitive = () => {
	const filtersStore = useFiltersStore();

	return useCallback(
		(newValue: boolean, filterToBeModified: ChildFilter) => {
			filtersStore.setState((prev) => {
				modifyChildFilter({
					parentFilter: prev.groupOfFilters,
					keyToModify: "caseSensitive",
					filterToBeModified,
					newValue,
				});

				return {
					groupOfFilters: prev.groupOfFilters,
					forceRefresh: !prev.forceRefresh,
				};
			});
		},
		[filtersStore],
	);
};

export const useSetFilterValue = () => {
	const filtersStore = useFiltersStore();

	return useCallback(
		(newValue: ChildFilter["value"], filterToBeModified: ChildFilter) => {
			filtersStore.setState((prev) => {
				modifyChildFilter({
					parentFilter: prev.groupOfFilters,
					keyToModify: "value",
					filterToBeModified,
					newValue,
				});

				return {
					groupOfFilters: prev.groupOfFilters,
					forceRefresh: !prev.forceRefresh,
				};
			});
		},
		[filtersStore],
	);
};

export const useDeleteFilter = () => {
	const filtersStore = useFiltersStore();

	return useCallback(
		(filterToRemove: Filter) => {
			filtersStore.setState((prev) => {
				withoutFilter({
					parentFilter: prev.groupOfFilters,
					filterToRemove,
				});

				return {
					groupOfFilters: prev.groupOfFilters,
					forceRefresh: !prev.forceRefresh,
				};
			});
		},
		[filtersStore],
	);
};
