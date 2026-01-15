import {
	useMutation,
	type InvalidateQueryFilters,
	type QueryFilters,
} from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { isValidNumber } from "#/helpers/utils";
import type {
	InheritanceType,
	SettingsEntity,
	SettingsKey,
	SettingsReturnType,
} from "../fetch/use-fetch-settings";
import { queryKeyFactory } from "../query-keys";

export type SetSettingsRequest = {
	project_id?: number | undefined;
	updates: Array<{
		value:
			| string
			| number
			| boolean
			| Array<unknown>
			| Record<string, unknown>
			| undefined;
		inheritance_type: InheritanceType;
		entity: SettingsEntity;
		key: SettingsKey;
	}>;
};

const mutationKey = queryKeyFactory.put["settings"].queryKey;

const INITIAL_PART_OF_SETTINGS_QUERY_KEY =
	queryKeyFactory.get["settings"]._def.join("");
const cancelOrInvalidateQueriesParams: QueryFilters | InvalidateQueryFilters = {
	predicate(query) {
		return (
			query.queryKey.slice(0, 2).join("") === INITIAL_PART_OF_SETTINGS_QUERY_KEY
		);
	},
};

export const useSetSettings = () => {
	const organizationId = generalContextStore.use.organizationId();

	return useMutation<SettingsReturnType | null, Error, SetSettingsRequest>({
		mutationKey,

		mutationFn: async (body) => {
			if (!isValidNumber(organizationId)) {
				toast({
					description: "Please select an organization to edit settings.",
					title: "You don't have an active organization",
					variant: ToastVariant.Destructive,
				});

				return null;
			}

			const path = `/organizations/${organizationId}/settings`;

			const res = await clientAPI_V1.put<SettingsReturnType>(path, body);

			return res.data;
		},

		meta: {
			invalidateQuery: cancelOrInvalidateQueriesParams,
			cancelQuery: cancelOrInvalidateQueriesParams,
		},
	});
};
