import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import type { BotId } from "#/types/bot-source";
import type { BotConversation } from "#/types/notebook";
import { queryKeyFactory } from "@/hooks/query-keys";

export type CreateBotConversationRequest = {
	title: string;
	uuid?: string;
	botId: BotId;
};

export type CreateBotConversationResponse = BotConversation;

const mutationKey = queryKeyFactory.post["create-bot-communication"].queryKey;

export const useCreateBotCommunication = () => {
	return useMutation<
		CreateBotConversationResponse,
		Error,
		CreateBotConversationRequest
	>({
		mutationKey,

		mutationFn: async (args) => {
			const { botId, ...body } = args;

			const path = `/bots/${botId}/conversations`;

			const res = await clientAPI_V1.post<CreateBotConversationResponse>(
				path,
				body,
			);

			return res.data;
		},

		meta: {
			errorTitle: "Failed to create bot conversation!",
		},
	});
};
