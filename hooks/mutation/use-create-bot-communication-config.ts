import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import type {
	BotCommunicationConfig,
	BotCommunicationType,
	BotId,
	ChannelConfigType,
} from "#/types/bot-source";
import { queryKeyFactory } from "../query-keys";

type CreateBotCommunicationConfigBase = {
	bot_id: BotId;
};

export type CreateBotCommunicationConfigRequest =
	CreateBotCommunicationConfigBase & {
		communication_type: BotCommunicationType;
		channel_config_type: ChannelConfigType;
		allowed_slack_channel_ids: number[];
		slack_connection_id: number;
	};

export type CreateBotCommunicationConfigResponse = BotCommunicationConfig;

const mutationKey =
	queryKeyFactory.post["create-bot-communication-config"].queryKey;

export const useCreateBotCommunicationConfig = () => {
	return useMutation<
		CreateBotCommunicationConfigResponse,
		Error,
		CreateBotCommunicationConfigRequest
	>({
		mutationKey,

		mutationFn: async (args) => {
			const path = `/bots/${args.bot_id}/communication-configs`;

			const res = await clientAPI_V1.post<CreateBotCommunicationConfigResponse>(
				path,
				args,
			);

			return res.data;
		},

		meta: {
			errorTitle: "Failed to create bot communication config!",
		},
	});
};
