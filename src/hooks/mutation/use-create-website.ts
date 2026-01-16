import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import type { Website } from "#/types/bot-source";
import type { OrganizationId } from "#/types/general";
import { queryKeyFactory } from "../query-keys";

export type CreateWebsiteRequest = {
  organizationId: OrganizationId;
  index_refresh: boolean;
  website_url: string;
  index: boolean;
};

export type CreateWebsiteResponse = Website;

const mutationKey = queryKeyFactory.post["create-website"].queryKey;

export function useCreateWebsite() {
  const organizationId = generalContextStore.use.organizationId();

  const createBotMutation = useMutation<CreateWebsiteResponse, Error, CreateWebsiteRequest>({
    mutationKey,

    mutationFn: async (args) => {
      const { organizationId, ...body } = args;

      const path = `/organizations/${organizationId}/websites`;

      const res = await clientAPI_V1.post<CreateWebsiteResponse>(path, body);

      return res.data;
    },

    meta: {
      invalidateQuery: queryKeyFactory.get["bots-page"](organizationId),
      cancelQuery: queryKeyFactory.get["bots-page"](organizationId),
      errorTitle: "Failed to create website!",
      successTitle: "Website created!",
    },
  });

  return createBotMutation;
}
