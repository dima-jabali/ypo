import {
	CheckIcon,
	FunnelIcon,
	MinusIcon,
	PlusIcon,
	SquareStackIcon,
} from "lucide-react";
import { memo, useLayoutEffect } from "react";

import { useFiltersStore } from "./FiltersContextProvider";
import { FiltersToBeApplied } from "./FiltersToBeApplied";
import {
	ColumnOptionsValueOperator,
	type ChildFilter,
	type Filter,
	type FilterGroup,
} from "./generalFilterTypes";
import {
	FILL_FILTERS_FIRST,
	hasColumnAndConstrainsSpecified,
	hasFilter,
	isSerializedFilterGroup,
	makeDefaultGroupOfFilters,
} from "./helpers";
import { useAddFilter } from "./hooks";
import {
	deserializeJsonToFilters,
	serializeFiltersToJson,
} from "./serializeFilters";
import type {
	BatchTableColumn,
	BatchTableConditionalExecutionFilterGroup,
} from "#/types/batch-table";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { dbg, isObjectEmpty } from "#/helpers/utils";
import { toast } from "#/components/Toast/useToast";
import { ToastVariant } from "#/components/Toast/ToastVariant";

export const ConditionalExecutionFilterPopover: React.FC<{
	changesRef: React.RefObject<Partial<BatchTableColumn>>;
	batchTableColumn: BatchTableColumn | undefined;
	columns: Array<BatchTableColumn>;
}> = memo(function FiltersPopover({ batchTableColumn, columns, changesRef }) {
	const isOpen = useFiltersStore().use.isFiltersPopoverOpen();
	const filtersStore = useFiltersStore();

	useFiltersStore().use.forceRefresh();

	useLayoutEffect(() => {
		let alreadyExistingExecutionCondition =
			batchTableColumn?.execution_condition
				? (deserializeJsonToFilters(
						batchTableColumn.execution_condition,
					) as FilterGroup)
				: null;

		// Validate that the top filter is a group filter, otherwise make a default one.
		if (
			alreadyExistingExecutionCondition &&
			!isSerializedFilterGroup(alreadyExistingExecutionCondition)
		) {
			alreadyExistingExecutionCondition = null;
		}

		console.log({
			"batchTableColumn?.execution_condition":
				batchTableColumn?.execution_condition,
			alreadyExistingExecutionCondition,
		});

		filtersStore.setState({
			groupOfFilters: alreadyExistingExecutionCondition
				? alreadyExistingExecutionCondition
				: makeDefaultGroupOfFilters(),
		});
	}, [batchTableColumn?.execution_condition, filtersStore]);

	useLayoutEffect(() => {
		filtersStore.setState({ columns });
	}, [columns, filtersStore]);

	useLayoutEffect(() => {
		const unsub = filtersStore.subscribe(
			(state) => state.isFiltersPopoverOpen,
			(isOpen, prevIsOpen) => {
				const isClosing = !isOpen && prevIsOpen;

				if (isClosing) {
					const { groupOfFilters } = filtersStore.getState();

					let serializedFiltersOrUndefined = serializeFiltersToJson({
						filter: groupOfFilters,
					});

					if (isObjectEmpty(serializedFiltersOrUndefined ?? {})) {
						serializedFiltersOrUndefined = undefined;
					}

					dbg({
						serializedFiltersOrUndefined,
						groupOfFilters,
					});

					try {
						changesRef.current.execution_condition =
							(serializedFiltersOrUndefined as
								| BatchTableConditionalExecutionFilterGroup
								| undefined) ?? null; // `?? null` is needed to change the backend, if it is undefined, it will not be sent to the backend.
					} catch (error) {
						console.error("Error on OnChangeGroupOfFilters filters:", {
							error,
						});
					}
				}
			},
		);

		return () => {
			unsub();
		};
	}, [changesRef, filtersStore, isOpen]);

	const handleOnOpenChange = (newIsOpen: boolean) => {
		filtersStore.setState({ isFiltersPopoverOpen: newIsOpen });
	};

	return (
		<Popover onOpenChange={handleOnOpenChange} open={isOpen}>
			<PopoverTrigger className="w-full items-center justify-end bg-transparent rounded-md button-hover text-primary text-xs p-2 gap-2 h-9 flex data-[state=open]:bg-button-active border border-border-smooth">
				<i>Filters</i>

				<FunnelIcon className="size-4 flex-none" />
			</PopoverTrigger>

			<PopoverContent className="min-w-[25rem] max-w-[80vw] flex flex-col gap-1 rounded-lg items-start justify-start max-h-[80vh] p-1">
				{isOpen ? <Content /> : null}
			</PopoverContent>
		</Popover>
	);
});

const Content: React.FC = () => {
	const filtersStore = useFiltersStore();

	const handleDeleteAllFilters = () => {
		filtersStore.setState({ groupOfFilters: makeDefaultGroupOfFilters() });
	};

	const handleCloseFilters = async () => {
		filtersStore.setState({ isFiltersPopoverOpen: false });
	};

	return (
		<>
			<p className="text-xs text-primary ml-2 my-1">
				Execute the cell in this column if the corresponding cell in:
			</p>

			<FiltersToBeApplied />

			<div className="flex gap-1 justify-start items-center w-full">
				<AddFilterButtons />
			</div>

			<div className="flex gap-1 justify-start items-center w-full">
				<button
					className="flex items-center justify-center w-full gap-2 border border-border-smooth rounded-sm py-1 px-2 text-sm button-hover"
					onClick={handleDeleteAllFilters}
				>
					<MinusIcon className="size-4 flex-none text-primary" />

					<span>Delete all filters</span>
				</button>

				<button
					className="flex items-center justify-center w-full gap-2 border border-border-smooth rounded-sm py-1 px-2 text-sm button-hover"
					onClick={handleCloseFilters}
				>
					<CheckIcon className="size-4 flex-none text-primary" />

					<span>Close</span>
				</button>
			</div>
		</>
	);
};

type AddFilterButtonProps = {
	parentFilter?: FilterGroup | undefined;
	filterAbove?: Filter;
	flexStart?: boolean;
};

export const AddFilterButtons = ({
	parentFilter,
	filterAbove,
	flexStart,
}: AddFilterButtonProps) => {
	const groupOfFilters = useFiltersStore().use.groupOfFilters();
	const addFilter = useAddFilter();

	const canAddFilter = (() => {
		if (!hasFilter(groupOfFilters)) {
			return true;
		}

		const filter = parentFilter || groupOfFilters;
		if (filter && !hasColumnAndConstrainsSpecified(filter)) {
			return false;
		}

		if (filterAbove) {
			if (!hasColumnAndConstrainsSpecified(filterAbove)) {
				return false;
			}
		}

		return true;
	})();

	const addFilterRule = (): void => {
		if (!canAddFilter) {
			toast({
				variant: ToastVariant.Destructive,
				title: FILL_FILTERS_FIRST,
			});

			return;
		}

		const newFilter: ChildFilter = {
			parent: parentFilter || (groupOfFilters as FilterGroup),
			value_operator: ColumnOptionsValueOperator.EQUALS,
			column_id: undefined,
			caseSensitive: false,
			value: undefined,
		};

		addFilter(newFilter, filterAbove);
	};

	const addFilterGroup = (): void => {
		if (!canAddFilter) {
			toast({
				variant: ToastVariant.Destructive,
				title: FILL_FILTERS_FIRST,
			});

			return;
		}

		const defaultFilterGroup = makeDefaultGroupOfFilters();

		defaultFilterGroup.parent = parentFilter || groupOfFilters;

		addFilter(defaultFilterGroup, filterAbove);
	};

	return (
		<>
			<button
				className="flex items-center justify-center w-full gap-2 border border-border-smooth rounded py-1 px-2 text-sm button-hover disabled:opacity-50 data-[flex-start=true]:justify-start"
				data-flex-start={flexStart}
				disabled={!canAddFilter}
				onClick={addFilterRule}
			>
				<PlusIcon className="size-4 flex-none" />

				<span>Add filter rule</span>
			</button>

			<button
				className="flex items-center justify-center w-full gap-2 border border-border-smooth rounded py-1 px-2 text-sm button-hover disabled:opacity-50 data-[flex-start=true]:justify-start"
				data-flex-start={flexStart}
				onClick={addFilterGroup}
				disabled={!canAddFilter}
			>
				<SquareStackIcon className="size-4 flex-none" />

				<span>Add filter group</span>
			</button>
		</>
	);
};
