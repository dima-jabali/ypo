import { useAddFilter } from "#/components/Tables/TableMaker/DefaultTableHeader/helperFilterHooks";
import { makeDefaultGroupOfFilters } from "#/components/Tables/TableMaker/filters/filters";
import type {
	ChildFilter,
	Filter,
	FilterGroup,
} from "#/components/Tables/TableMaker/filters/utilityTypes";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { Layers, PlusIcon } from "lucide-react";
import { useGroupOfFilters } from "../tableDataContextUtils";
import {
	FILL_FILTERS_FIRST,
	hasColumnAndConstrainsSpecified,
	hasFilter,
} from "./utils";

type Props = {
	parentFilter?: FilterGroup | undefined;
	filterAbove?: Filter | undefined;
	flexStart?: boolean | undefined;
};

export const AddFilterButtons: React.FC<Props> = ({
	parentFilter,
	filterAbove,
	flexStart,
}) => {
	const groupOfFilters = useGroupOfFilters();

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
			parent: parentFilter || groupOfFilters,
			column: { name: "", type: undefined },
			valueOperator: undefined,
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
				className="flex justify-center items-center w-full gap-2 rounded border border-border-smooth py-1 px-2 button-hover text-sm data-[flex-start=true]:justify-start disabled:opacity-50"
				aria-disabled={!canAddFilter}
				data-flex-start={flexStart}
				onClick={addFilterRule}
				type="button"
			>
				<PlusIcon className="size-4 text-primary" />
				Add filter rule
			</button>

			<button
				className="flex justify-center items-center w-full gap-2 rounded border border-border-smooth py-1 px-2 button-hover text-sm data-[flex-start=true]:justify-start disabled:opacity-50"
				aria-disabled={!canAddFilter}
				data-flex-start={flexStart}
				onClick={addFilterGroup}
				type="button"
			>
				<Layers className="size-4 text-primary" />
				Add filter group
			</button>
		</>
	);
};
