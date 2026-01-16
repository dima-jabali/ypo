import { useMutation } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { clientAPI_V1 } from "#/api";
import { queryKeyFactory } from "../query-keys";

type RemoveMemberFromOrgRequest = {
  userId: string;
  orgId: string;
};

export type RemoveMemberFromOrgResponse = AxiosResponse<RemoveMemberFromOrgRequest, undefined>;

const mutationKey = queryKeyFactory.delete["user-from-org"].queryKey;

export const useRemoveUserFromOrganizationMutation = () => {
  return useMutation<RemoveMemberFromOrgResponse, Error, RemoveMemberFromOrgRequest>({
    mutationKey,

    mutationFn: async (arg: RemoveMemberFromOrgRequest) => {
      const path = `/organizations/${arg.orgId}/users/${arg.userId}`;

      return await clientAPI_V1.delete<RemoveMemberFromOrgRequest, RemoveMemberFromOrgResponse>(
        path,
      );
    },

    meta: {
      invalidateQuery: queryKeyFactory.get["all-organizations"],
      cancelQuery: queryKeyFactory.get["all-organizations"],
    },
  });
};
