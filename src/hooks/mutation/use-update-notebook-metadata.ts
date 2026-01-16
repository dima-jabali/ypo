import { useIsMutating, useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { NotebookId } from "#/types/general";
import type { Notebook, NotebookMetadata, NotebookTag, NotebookTagId } from "#/types/notebook";

export type UpdateNotebookRequestBody = Partial<
  Omit<NotebookMetadata, "description" | "tags"> & {
    tags: Array<NotebookTagId | NotebookTag>;
    description: string | null;
  }
>;

type UpdateNotebookResponse = Notebook;

const mutationKey = queryKeyFactory.put["notebook"].queryKey;

export function useUpdateNotebookMetadata() {
  const organizationId = generalContextStore.use.organizationId();

  return useMutation<
    UpdateNotebookResponse,
    Error,
    UpdateNotebookRequestBody & { notebookId: NotebookId }
  >({
    mutationKey,

    mutationFn: async (args) => {
      const { notebookId, ...body } = args;

      const path = `/projects/${notebookId}`;

      if (body.tags && body.tags.length && typeof body.tags[0] !== "number") {
        body.tags = body.tags.map((tag) => (typeof tag !== "number" ? tag.id : tag));
      }

      const res = await clientAPI_V1.put<UpdateNotebookResponse>(path, body);

      return res.data;
    },

    meta: {
      skipToast: true,
    },

    async onSuccess(updatedNotebookFromResponse, args) {
      const { setNotebookListPages, setNotebook } = generalContextStore.getState();

      const projectMetadataFromResponse = updatedNotebookFromResponse.metadata;
      const projectIdFromResponse = projectMetadataFromResponse.id;

      setNotebookListPages(organizationId, (cachedProjectsInfiniteQueryResponse) => {
        if (!(cachedProjectsInfiniteQueryResponse && updatedNotebookFromResponse)) {
          console.log(
            "No cachedProjectsInfiniteQueryResponse or updatedProjectFromResponse! There is no optimistic item to replace!",
            {
              cachedProjectsInfiniteQueryResponse,
              updatedNotebookFromResponse,
            },
          );

          return cachedProjectsInfiniteQueryResponse;
        }

        let shouldRemoveFromList = false;

        // If user is on chat view, and the project was just archived, then
        // let's remove it from the list of projects.
        if (args.archived === true) {
          shouldRemoveFromList = true;
        }

        const path = { pagesIndex: -1, resultIndex: -1 };

        let pagesIndex = -1;
        for (const page of cachedProjectsInfiniteQueryResponse.pages) {
          ++pagesIndex;

          const index = page.results.findIndex(({ id }) => id === projectIdFromResponse);

          if (index === -1) continue;

          path.pagesIndex = pagesIndex;
          path.resultIndex = index;

          break;
        }

        if (path.pagesIndex === -1 || path.resultIndex === -1) {
          console.log(
            "[onSuccess] No optimistic project found in projects infinite list. Not replacing it.",
          );

          return cachedProjectsInfiniteQueryResponse;
        }

        const prevResults = cachedProjectsInfiniteQueryResponse.pages[path.pagesIndex]?.results;

        if (!prevResults) {
          console.error(
            "[onSuccess] prevResults is undefined inside infinite list! This should never happen!",
            {
              cachedProjectsInfiniteQueryResponse,
              projectMetadataFromResponse,
              path,
            },
          );

          return cachedProjectsInfiniteQueryResponse;
        }

        const newResults: typeof prevResults = [...prevResults];

        if (shouldRemoveFromList) {
          newResults.splice(path.resultIndex, 1);
        } else {
          newResults[path.resultIndex] = projectMetadataFromResponse;
        }

        const oldPage = cachedProjectsInfiniteQueryResponse.pages[path.pagesIndex];

        if (!oldPage) {
          console.error(
            "[onSuccess] oldPage is undefined inside infinite list! This should never happen!",
            {
              cachedProjectsInfiniteQueryResponse,
              projectMetadataFromResponse,
              path,
            },
          );

          return cachedProjectsInfiniteQueryResponse;
        }

        const newPage: (typeof cachedProjectsInfiniteQueryResponse.pages)[number] = {
          ...oldPage,
          num_results: shouldRemoveFromList ? oldPage.num_results - 1 : oldPage.num_results,
          results: newResults,
        };

        const newPages: typeof cachedProjectsInfiniteQueryResponse.pages =
          cachedProjectsInfiniteQueryResponse.pages.with(path.pagesIndex, newPage);

        const newCachedProjectsInfiniteQueryResponse: typeof cachedProjectsInfiniteQueryResponse = {
          ...cachedProjectsInfiniteQueryResponse,
          pages: newPages,
        };

        console.log("[onSuccess] replaced optimist project metadata in projects infinite list", {
          newCachedProjectsInfiniteQueryResponse,
          projectMetadataFromResponse,
        });

        return newCachedProjectsInfiniteQueryResponse;
      });

      setNotebook(projectIdFromResponse, updatedNotebookFromResponse);
    },
  });
}

export function useIsUpdatingNotebookMetadata() {
  return useIsMutating({ mutationKey, exact: true }) > 0;
}
