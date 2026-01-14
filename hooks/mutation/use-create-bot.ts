import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import type { Bot, BotCommunicationType, BotType } from "#/types/bot-source";
import { queryKeyFactory } from "../query-keys";

export type CreateBotRequest = {
	communication_type?: BotCommunicationType;
	description?: string;
	type?: BotType;
	name?: string;
};

export type CreateBotResponse = Bot;

const mutationKey = queryKeyFactory.post["create-bot"].queryKey;

export const useCreateBot = () => {
	const organizationId = generalContextStore.use.organizationId();

	const createBotMutation = useMutation<
		CreateBotResponse,
		Error,
		CreateBotRequest
	>({
		mutationKey,

		mutationFn: async (body) => {
			const path = `/organizations/${organizationId}/bots`;

			const res = await clientAPI_V1.post<CreateBotResponse>(path, body);

			return res.data;
		},

		meta: {
			invalidateQuery: queryKeyFactory.get["bots-page"](organizationId),
			cancelQuery: queryKeyFactory.get["bots-page"](organizationId),
			errorTitle: "Failed to create bot!",
			successTitle: "Bot created!",
		},
	});

	return createBotMutation;
};
