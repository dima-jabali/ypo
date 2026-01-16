import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import type { BotSource, BotSourceType, Website } from "#/types/bot-source";
import type { FileId, OrganizationId } from "#/types/general";
import { queryKeyFactory } from "../query-keys";
import type { GoogleDriveDatabaseConnectionId } from "#/types/databases";

export type CreateBotSourceRequest =
  | CreateGoogleDriveBotSourceRequest
  | CreateSlackBotSourceRequest
  | CreateWebBotSourceRequest
  | CreatePDFBotSourceRequest
  | CreateCSVBotSourceRequest;

export type CreateBotSourceRequestBase = {
  organizationId: OrganizationId;
  source_type: BotSourceType;
  add_to_bot_ids: number[];
  description: string;
  name: string;
};

export type CreateGoogleDriveBotSourceRequest = CreateBotSourceRequestBase & {
  google_drive_connection_id: GoogleDriveDatabaseConnectionId;
  google_drive_folder_ids: Array<FileId>;
  direct_children_only: boolean;
};

export type CreateSlackBotSourceRequest = CreateBotSourceRequestBase & {
  slack_channel_ids: number[];
  slack_connection_id: number;
};

export type CreateWebBotSourceRequest = CreateBotSourceRequestBase & {
  web_crawls: { id: number }[];
  websites: Website[];
};

export type CreatePDFBotSourceRequest = CreateBotSourceRequestBase & {
  pdfs: { id: number }[];
};

export type CreateCSVBotSourceRequest = CreateBotSourceRequestBase & {
  csvs: { id: number }[];
};

export type CreateBotSourceResponse = BotSource;

const mutationKey = queryKeyFactory.post["create-bot-source"].queryKey;

export function useCreateBotSource() {
  const organizationId = generalContextStore.use.organizationId();

  const createBotMutation = useMutation<CreateBotSourceResponse, Error, CreateBotSourceRequest>({
    mutationKey,

    mutationFn: async (args) => {
      const { organizationId, ...rest } = args;

      const path = `/organizations/${organizationId}/sources`;

      const res = await clientAPI_V1.post<CreateBotSourceResponse>(path, rest);

      return res.data;
    },

    meta: {
      invalidateQuery: [
        queryKeyFactory.get["bots-page"](organizationId),
        queryKeyFactory.get["bot-sources-page"](organizationId),
      ],
      cancelQuery: queryKeyFactory.get["bots-page"](organizationId),
      errorTitle: "Failed to create bot!",
    },
  });

  return createBotMutation;
}
