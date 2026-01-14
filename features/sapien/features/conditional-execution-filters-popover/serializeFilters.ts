import { isRecord } from "#/helpers/utils";
import type {
	ChildFilter,
	EntriesOfFilter,
	Filter,
	FilterGroup,
	SerializedChildFilter,
	SerializedFilter,
} from "./generalFilterTypes";
import {
	isSerializedFilterGroup,
	isUndefined,
	shouldHaveValueInput,
} from "./helpers";

export const serializeFiltersToJson = ({
	visited = new Set<Filter>(),
	filter,
}: {
	visited?: Set<Filter>;
	filter: Filter;
}): SerializedFilter | undefined => {
	// This is a function made by an AI to filter out objects with undefined values and handle circular references.

	if (visited.has(filter)) return;

	visited.add(filter);

	const serializedObj: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(filter) as EntriesOfFilter) {
		if (key === "parent" || value === undefined) continue;

		if (key === "children") {
			const serializedArray: unknown[] = [];

			for (const child of value as Array<Filter>) {
				const serializedValues = serializeFiltersToJson({
					filter: child,
					visited,
				});

				if (serializedValues) {
					serializedArray.push(serializedValues);
				}
			}

			if (serializedArray.length > 0) {
				serializedObj[key] = serializedArray;
			}
		} else if (key === "value_operator") {
			if (value === undefined) continue;

			if (shouldHaveValueInput(filter as ChildFilter)) {
				if ((filter as ChildFilter).value !== undefined) {
					serializedObj[key] = value;
				}
			} else {
				serializedObj[key] = value;
			}
		} else {
			serializedObj[key] = value;
		}
	}

	return isValidSerializedFilter(serializedObj, shouldHaveValueInput)
		? serializedObj
		: undefined;
};

const isValidSerializedFilter = (
	obj: Record<string, unknown>,
	shouldHaveValueInput: (filterOperator: ChildFilter) => boolean,
): obj is SerializedFilter => {
	if (!isRecord(obj)) return false;

	if (Object.keys(obj).length < 2) return false;

	if (isSerializedFilterGroup(obj)) {
		const { filter_operator, children } = obj;

		if (isUndefined(filter_operator) || isUndefined(children)) {
			return false;
		}

		return true;
	} else {
		const { value, value_operator, caseSensitive } =
			obj as SerializedChildFilter;

		if (isUndefined(value_operator) || isUndefined(caseSensitive)) {
			return false;
		}

		if (shouldHaveValueInput(obj as ChildFilter)) {
			if (isUndefined(value)) return false;
		}

		return true;
	}
};

export const deserializeJsonToFilters = (
	json: SerializedFilter | undefined,
	objs: Array<Filter> = [],
): Filter | undefined => {
	if (!json) return;

	if (isSerializedFilterGroup(json)) {
		const filterGroup: FilterGroup = {
			filter_operator: json.filter_operator,
			parent: undefined,
			children: [],
		};

		objs.push(filterGroup);

		filterGroup.children = json.children
			.map((childJson) => deserializeJsonToFilters(childJson, objs))
			.filter(Boolean) as Array<Filter>;

		return filterGroup;
	} else {
		// It's a ChildFilter
		const childFilter: ChildFilter = {
			parent: objs.at(-1) as FilterGroup,
			value_operator: json.value_operator,
			caseSensitive: json.caseSensitive,
			column_id: json.column_id,
			value: json.value,
		};

		return childFilter;
	}
};
