import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import type { BotSource, Website } from "#/types/bot-source";
import type { FileId, OrganizationId } from "#/types/general";
import { queryKeyFactory } from "../query-keys";
import type { GoogleDriveDatabaseConnectionId } from "#/types/databases";

export type UpdateBotSourceRequest =
	| UpdateGoogleDriveBotSourceByIdRequest
	| UpdateSlackBotSourceByIdRequest
	| UpdateWebBotSourceByIdRequest
	| UpdateCSVBotSourceByIdRequest
	| UpdatePDFBotSourceByIdRequest;

export type UpdateBotSourceResponse = BotSource;

export type UpdateGoogleDriveBotSourceByIdRequest =
	UpdateBotSourceByIdRequestBase & {
		google_drive_connection_id: GoogleDriveDatabaseConnectionId;
		google_drive_folder_ids: Array<FileId>;
		direct_children_only: boolean;
	};

type UpdateBotSourceByIdRequestBase = {
	organizationId: OrganizationId;
	description?: string;
	archived?: boolean;
	sourceId: number;
	name?: string;
};

export type UpdateSlackBotSourceByIdRequest = UpdateBotSourceByIdRequestBase & {
	slack_channel_ids: number[];
	slack_connection_id: number;
};

export type UpdateWebBotSourceByIdRequest = UpdateBotSourceByIdRequestBase & {
	web_crawls?: { id: number }[];
	websites?: Website[];
};

export type UpdatePDFBotSourceByIdRequest = UpdateBotSourceByIdRequestBase & {};

export type UpdateCSVBotSourceByIdRequest = UpdateBotSourceByIdRequestBase & {};

const mutationKey = queryKeyFactory.post["update-bot-source"].queryKey;

export function useUpdateBotSource() {
	const organizationId = generalContextStore.use.organizationId();

	const createBotMutation = useMutation<
		UpdateBotSourceResponse,
		Error,
		UpdateBotSourceRequest
	>({
		mutationKey,

		mutationFn: async (args) => {
			const { organizationId, sourceId, ...rest } = args;

			const path = `/organizations/${organizationId}/sources/${sourceId}`;

			const res = await clientAPI_V1.put<UpdateBotSourceResponse>(path, rest);

			return res.data;
		},

		meta: {
			invalidateQuery: [
				queryKeyFactory.get["bots-page"](organizationId),
				queryKeyFactory.get["bot-sources-page"](organizationId),
			],
			cancelQuery: queryKeyFactory.get["bots-page"](organizationId),
			errorTitle: "Failed to updated Web Source!",
			successTitle: "Web Source updated!",
		},
	});

	return createBotMutation;
}
