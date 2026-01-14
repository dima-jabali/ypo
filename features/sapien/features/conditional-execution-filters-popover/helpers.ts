import { FilterOperator } from "#/components/Tables/TableMaker/filters/utilityTypes";
import {
	ColumnOptionsValueOperator,
	type ChildFilter,
	type Filter,
	type FilterGroup,
	type SerializedFilterGroup,
} from "./generalFilterTypes";

type HasChanged = boolean;

export const modifyChildFilter = <
	KeyToModify extends keyof ChildFilter,
	NewValue extends ChildFilter[KeyToModify],
>({
	filterToBeModified,
	parentFilter,
	keyToModify,
	newValue,
}: {
	filterToBeModified: ChildFilter;
	parentFilter: FilterGroup;
	keyToModify: KeyToModify;
	newValue: NewValue;
}): HasChanged => {
	let hasChanged = false;

	for (const filter of parentFilter.children) {
		if (hasChanged) break;

		const isFilterToBeModified = filter === filterToBeModified;

		if (isFilterToBeModified) {
			filter[keyToModify] = newValue;
			hasChanged = true;

			break;
		}

		if (isAParent(filter)) {
			hasChanged = modifyChildFilter({
				parentFilter: filter,
				filterToBeModified,
				keyToModify,
				newValue,
			});
		}
	}

	return hasChanged;
};

export const withFilter = ({
	parentFilter,
	filterToAdd,
	filterAbove,
}: {
	filterAbove: Filter | undefined;
	parentFilter: FilterGroup;
	filterToAdd: Filter;
}): HasChanged => {
	if (!filterToAdd.parent) {
		console.error("filterToAdd.parent is undefined");

		return false;
	}

	const shouldAddAtOutermostParent = filterToAdd.parent === parentFilter;

	if (shouldAddAtOutermostParent) {
		if (filterAbove) {
			const innerIndex = parentFilter.children.indexOf(filterAbove);

			if (innerIndex !== -1) {
				parentFilter.children.splice(innerIndex + 1, 0, filterToAdd);
			}
		} else {
			parentFilter.children.push(filterToAdd);
		}

		return true;
	}

	let hasAdded = false;

	for (const filter of parentFilter.children) {
		if (hasAdded) break;

		if (isAParent(filter)) {
			const isTheParentOfTheNewFilter = filter === filterToAdd.parent;

			if (isTheParentOfTheNewFilter) {
				const innerIndex = filter.children.findIndex((f) => f === filterAbove);

				if (innerIndex === -1) {
					filter.children.push(filterToAdd);
					hasAdded = true;
				} else {
					filter.children.splice(innerIndex + 1, 0, filterToAdd);
					hasAdded = true;
				}
			} else {
				hasAdded = withFilter({
					parentFilter: filter,
					filterToAdd,
					filterAbove,
				});
			}
		}
	}

	return hasAdded;
};

export const withoutFilter = ({
	filterToRemove,
	parentFilter,
}: {
	parentFilter: FilterGroup;
	filterToRemove: Filter;
}): HasChanged => {
	let hasRemoved = false;
	let index = 0;

	const isOutermostFilter = filterToRemove === parentFilter;

	if (isOutermostFilter) {
		// @ts-expect-error => We want to delete it.
		parentFilter = undefined;

		return true;
	}

	if (filterToRemove.parent === parentFilter) {
		const index = parentFilter.children.findIndex((f) => f === filterToRemove);

		if (index !== -1) {
			parentFilter.children.splice(index, 1);
		}

		return true;
	}

	for (const filter of parentFilter.children) {
		if (hasRemoved) break;

		if (isAParent(filter)) {
			const isParentOfFilterToDelete = filter === filterToRemove.parent;

			if (isParentOfFilterToDelete) {
				filter.children.splice(index, 1);

				hasRemoved = true;
			}

			hasRemoved = withoutFilter({ parentFilter: filter, filterToRemove });
		} else {
			const isFilterToDelete = filter === filterToRemove;

			if (isFilterToDelete) {
				parentFilter.children.splice(index, 1);
				hasRemoved = true;
			}
		}

		++index;
	}

	return hasRemoved;
};

/** Change if it's with AND or OR */
export const withFilterOperator = ({
	filterToBeModified,
	newFilterOperator,
	parentFilter,
}: {
	newFilterOperator: FilterOperator;
	filterToBeModified: Filter;
	parentFilter: FilterGroup;
}): HasChanged => {
	if (!filterToBeModified.parent) {
		console.error("filterToAdd.parent is undefined");

		return false;
	}

	if (filterToBeModified.parent === parentFilter) {
		parentFilter.filter_operator = newFilterOperator;

		return true;
	}

	let hasChanged = false;

	for (const filter of parentFilter.children) {
		if (hasChanged) break;

		if (isAParent(filter)) {
			const isParentFilterToBeModified = filter === filterToBeModified.parent;

			if (isParentFilterToBeModified) {
				filter.filter_operator = newFilterOperator;
				hasChanged = true;

				break;
			}

			hasChanged = withFilterOperator({
				parentFilter: filter,
				filterToBeModified,
				newFilterOperator,
			});
		}
	}

	return hasChanged;
};

export const isAParent = (filter: Filter): filter is FilterGroup => {
	// @ts-expect-error => if `filter.children` is undefined (does not exist), it will return false.
	return Array.isArray(filter.children);
};

export const makeDefaultGroupOfFilters = (): FilterGroup => {
	const defaultParentFilter: FilterGroup = {
		filter_operator: FilterOperator.AND,
		children: [] as Array<Filter>,
		parent: undefined,
	};

	const defaultChildFilter: ChildFilter = {
		value_operator: ColumnOptionsValueOperator.EQUALS,
		parent: defaultParentFilter,
		column_id: undefined,
		caseSensitive: false,
		value: undefined,
	};

	defaultParentFilter.children.push(defaultChildFilter);

	return defaultParentFilter;
};

export const hasFilter = (rootFilter: FilterGroup): boolean => {
	if (!rootFilter) return false;
	if (rootFilter.children.length === 0) return false;

	const firstChild = rootFilter.children[0];

	if (
		firstChild &&
		"children" in firstChild &&
		firstChild.children.length === 0
	) {
		return false;
	}

	return true;
};

export const hasColumnAndConstrainsSpecified = (filter: Filter): boolean => {
	if (isAParent(filter)) {
		const lastChild = filter.children.at(-1);

		if (lastChild && !isAParent(lastChild) && !lastChild.value_operator) {
			return false;
		} else if (lastChild && isAParent(lastChild)) {
			return hasColumnAndConstrainsSpecified(lastChild);
		}
	}

	return true;
};

export const FILL_FILTERS_FIRST = "Fill filters first";

const FILTERS_WITHOUT_VALUE_INPUT = [
	ColumnOptionsValueOperator.IS_NOT_EMPTY,
	ColumnOptionsValueOperator.IS_EMPTY,
	undefined,
	null,
];

export const shouldHaveValueInput = (childFilter: ChildFilter): boolean => {
	return !FILTERS_WITHOUT_VALUE_INPUT.includes(childFilter.value_operator);
};

export const isSerializedFilterGroup = (
	obj: Record<string, unknown>,
): obj is SerializedFilterGroup =>
	Boolean(
		(obj as SerializedFilterGroup).filter_operator &&
			(obj as SerializedFilterGroup).children,
	);

export const isUndefined = (value: unknown): value is undefined =>
	value === undefined;
