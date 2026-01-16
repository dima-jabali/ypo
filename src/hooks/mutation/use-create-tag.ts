import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { clientAPI_V1 } from "#/api";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { isValidNumber } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { OrganizationId } from "#/types/general";
import type { NotebookTag, NotebookTagTheme } from "#/types/notebook";

export type CreateTagRequestBody = {
  name: string;
  color: NotebookTagTheme;
  organizationId: OrganizationId;
};

export type CreateTagResponse = NotebookTag;

const mutationKey = queryKeyFactory.post["create-tag"].queryKey;

export const useCreateTag = () => {
  const organizationId = generalContextStore.use.organizationId();

  return useMutation<CreateTagResponse | undefined, Error, CreateTagRequestBody>({
    mutationKey,

    mutationFn: async (body: CreateTagRequestBody) => {
      const canMutate = isValidNumber(body.organizationId);

      if (!canMutate) return;

      try {
        const path = `/organizations/${body.organizationId}/tags`;

        const res = await clientAPI_V1.post<CreateTagResponse>(path, body);

        return res.data;
      } catch (error) {
        // Workaround to show user duplicate tag error.

        handleAxiosError: if (error instanceof AxiosError) {
          const isString = typeof error.response?.data === "string";

          if (!isString) {
            if (error.response && "error" in error.response.data) {
              Reflect.set(error, "message", error.response.data.error);
            }

            break handleAxiosError;
          }

          const isErrorAboutDuplicateTag = error.response?.data.includes(
            "duplicate key value violates unique constraint ",
          );

          if (isErrorAboutDuplicateTag) {
            Reflect.set(error, "message", "Tag already exists!");
          }
        }

        throw error;
      }
    },

    meta: {
      invalidateQuery: queryKeyFactory.get["organization-tag-list"](organizationId),
      cancelQuery: queryKeyFactory.get["organization-tag-list"](organizationId),
    },
  });
};
