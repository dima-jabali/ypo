import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { filterUndefinedFromObject } from "#/helpers/utils";
import type {
  DatabaseConnection,
  DatabaseConnectionType,
  SearchSchemaResponse,
} from "#/types/databases";
import { queryKeyFactory } from "../query-keys";

type SearchSchemaRequestParams = {
  connection_id?: DatabaseConnection["id"] | undefined;
  connection_type?: DatabaseConnectionType | undefined;
  abortControllerSignal: AbortSignal;
  orgId: string | number;
  num_results?: string;
  prompt: string;
};

const mutationKey = queryKeyFactory.get["search-schema"].queryKey;

export function useSearchSchema() {
  return useMutation<SearchSchemaResponse, Error, SearchSchemaRequestParams>({
    mutationKey,

    meta: {
      skipToast: true,
    },

    mutationFn: async (args) => {
      const config = {};
      const { abortControllerSignal, orgId, ...paramsWithUndefined } = args;

      // Casting here because `paramsWithUndefined`'s return type is `Record<string, unknown>`
      // but `SearchSchemaRequestParams`'s corresponds to `Record<string, string>`:
      const params = filterUndefinedFromObject(paramsWithUndefined) as Record<string, string>;

      const queryParams = new URLSearchParams(params);

      const path = `/organizations/${orgId}/schema?${queryParams.toString()}`;

      (config as typeof config & { signal: AbortSignal }).signal = abortControllerSignal;

      const res = await clientAPI_V1.get<SearchSchemaResponse>(path, config);

      return res.data;
    },
  });
}
