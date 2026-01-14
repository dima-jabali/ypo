import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type {
	ClickUpFolder,
	ClickUpList,
	ClickUpSpace,
	ClickUpWorkspace,
	DatabaseConnectionType,
} from "#/types/databases";
import type { ISODateString } from "#/types/general";
import type { BetterbrainUser } from "#/types/notebook";
import { queryKeyFactory } from "../query-keys";
import type { Organization } from "./use-fetch-all-organizations";

export type GetConnectionDataResponse = {
	type: DatabaseConnectionType.ClickUp;
	created_by: BetterbrainUser | null;
	suggested_queries: Array<string>;
	allowed_actions: Array<string>;
	collaborators: Array<string>;
	workspace?: ClickUpWorkspace;
	organization: Organization;
	created_at: ISODateString;
	updated_at: ISODateString;
	folder?: ClickUpFolder;
	space?: ClickUpSpace;
	is_enabled: boolean;
	list?: ClickUpList;
	is_public: boolean;
	name: string;
	id: number;
};

export type GetConnectionDataRequest = {
	connection_type: DatabaseConnectionType.ClickUp;
	organization_id: number;
	connection_id: number;

	include_folder_lists?: boolean;
	include_chat_views?: boolean;
	include_folders?: boolean;
	include_spaces?: boolean;
	include_lists?: boolean;
	workspace_id?: number;
	folder_id?: number;
	space_id?: number;
	list_id?: number;
};

export const useFetchConnectionData = (
	enabled: boolean,
	queryParams: GetConnectionDataRequest,
) => {
	const queryOptions = useMemo(
		() => queryKeyFactory.get["connection-data"](queryParams),
		[queryParams],
	);

	return useQuery({
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		staleTime: Infinity, // never stale
		gcTime: Infinity, // never gc
		enabled,
		...queryOptions,
	});
};
