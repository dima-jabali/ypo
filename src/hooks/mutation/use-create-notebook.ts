import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import {
  createISODate,
  isValidNumber,
  log,
  noop,
  OPTIMISTIC_NEW_NOTEBOOK_ID,
} from "#/helpers/utils";
import type {
  FetchNotebookListPageInfiniteData,
  FetchNotebookListPageResponse,
} from "#/hooks/fetch/use-fetch-notebook-list-page";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { BotConversationId, OrganizationId } from "#/types/general";
import {
  NotebookImportance,
  NotebookStatus,
  type Notebook,
  type NotebookBlock,
  type NotebookMetadata,
  type NotebookTagId,
  type NotebookUuid,
} from "#/types/notebook";
import { useFetchBetterbrainUser } from "../fetch/use-fetch-betterbrain-user";

const mutationKey = queryKeyFactory.post["notebook"].queryKey;

export type InifiteQueryResponseOfFetchNotebookListPageResponse = {
  pages: Array<FetchNotebookListPageResponse>;
  pageParams: unknown;
};

type CreateNotebookRequestBody = Partial<
  Omit<NotebookMetadata, "description" | "created_by" | "tags">
> & {
  tags: Array<NotebookTagId>;
  description: string | null;
  uuid: NotebookUuid;
};

export type NewCreateProjectRequestBody = {
  blocks: Array<Partial<NotebookBlock>>;
  metadata: CreateNotebookRequestBody;
  organizationId: OrganizationId;
};

type CreateNotebookResponse = Notebook;

export function useCreateNotebook() {
  const user = useFetchBetterbrainUser();

  return useMutation<CreateNotebookResponse | null, Error, NewCreateProjectRequestBody>({
    mutationKey,

    mutationFn: async ({ organizationId, ...body }, ctx) => {
      const path = `/organizations/${organizationId}/projects`;

      const res = await clientAPI_V1.post<CreateNotebookResponse>(path, body);

      ctx.client
        .prefetchQuery(queryKeyFactory.get["settings"](organizationId, res.data.metadata.id))
        .catch(noop);

      return res.data;
    },

    onMutate: async (dataOfNotebookToBeCreated) => {
      const {
        setBotConversationMessageListPages,
        setNotebookListPages,
        setBotConversation,
        setSettings,
        setNotebook,
        setBotPlan,
      } = generalContextStore.getState();

      const notebookUuid = dataOfNotebookToBeCreated.metadata.uuid;
      const optimisticProject: Notebook = {
        metadata: {
          bot_conversation: {
            id: OPTIMISTIC_NEW_NOTEBOOK_ID as unknown as BotConversationId,
          },
          organization: { id: dataOfNotebookToBeCreated.organizationId },
          status: NotebookStatus.NotStarted,
          priority: NotebookImportance.Low,
          id: OPTIMISTIC_NEW_NOTEBOOK_ID,
          last_modified: createISODate(),
          created_at: createISODate(),
          last_modified_by: user,
          run_frequency: "",
          variable_info: {},
          created_by: user,
          favorited: false,
          modified_by: [],
          assigned_to: [],
          archived: false,
          permissions: [],
          run_every: 0,
          request: "",
          ...(dataOfNotebookToBeCreated.metadata as unknown as Pick<
            NotebookMetadata,
            "tags" | "title" | "description" | "uuid"
          >),
        },
        // @ts-expect-error => Optimistic doesn't have all data but it's fine
        blocks: dataOfNotebookToBeCreated.blocks,
      };

      // Optimistically set the new project:
      setNotebook(optimisticProject.metadata.id, optimisticProject);

      setBotPlan(
        optimisticProject.metadata.bot_conversation!.id,
        dataOfNotebookToBeCreated.organizationId,
        optimisticProject.metadata.id,
        undefined,
      );

      // Optimistically add the project to the list:
      setNotebookListPages(
        dataOfNotebookToBeCreated.organizationId,
        (cachedNotebookListPageInfiniteQueryResponse) => {
          log("[onMutate] inserting optimist project metadata in notebook list page.");

          if (!cachedNotebookListPageInfiniteQueryResponse) {
            log(
              "[onMutate] No cachedNotebookListPageInfiniteQueryResponse! Not inserting optimist project metadata in projects list at useCreateNotebook! Creating a new cache instead.",
              {
                organizationId: dataOfNotebookToBeCreated.organizationId,
                optimisticProject,
              },
            );

            const newCache: FetchNotebookListPageInfiniteData = {
              pageParams: [
                {
                  limit: 10,
                  offset: 0,
                },
              ],
              pages: [
                {
                  results: [optimisticProject.metadata],
                  num_results: 1,
                  limit: "10",
                  offset: "0",
                },
              ],
            };

            return newCache;
          } else {
            {
              // Assure that the new project is not already in the list:
              const cachedProjects = cachedNotebookListPageInfiniteQueryResponse.pages.flatMap(
                (page) => page.results,
              );

              if (cachedProjects.some(({ uuid }) => uuid === notebookUuid)) {
                log("[onMutate] The new project is already in the list. No need to add it again!", {
                  cachedNotebookListPageInfiniteQueryResponse,
                  optimisticProject,
                });

                return cachedNotebookListPageInfiniteQueryResponse;
              }
            }

            const oldFirstPage = cachedNotebookListPageInfiniteQueryResponse.pages[0];

            if (!oldFirstPage) {
              return cachedNotebookListPageInfiniteQueryResponse;
            }

            const newFirstPage: typeof oldFirstPage = {
              ...oldFirstPage,
              num_results: oldFirstPage.num_results + 1,
              results: [optimisticProject.metadata, ...oldFirstPage.results],
            };

            const newCachedProjectsInfiniteQueryResponse: typeof cachedNotebookListPageInfiniteQueryResponse =
              {
                pages: cachedNotebookListPageInfiniteQueryResponse.pages.with(0, newFirstPage),
                pageParams: cachedNotebookListPageInfiniteQueryResponse.pageParams,
              };

            log({
              newCachedProjectsInfiniteQueryResponse,
              optimisticProject,
            });

            return newCachedProjectsInfiniteQueryResponse;
          }
        },
      );

      // Optimistically set the new bot conversation and messages:
      const OPTIMISTIC_BOT_CONVERSATION_ID =
        OPTIMISTIC_NEW_NOTEBOOK_ID as unknown as BotConversationId;

      setBotConversationMessageListPages(OPTIMISTIC_BOT_CONVERSATION_ID, {
        pageParams: [
          {
            botConversationId: OPTIMISTIC_BOT_CONVERSATION_ID,
            visible_to_user: "true",
            limit: 100,
            offset: 0,
          },
        ],
        pages: [
          {
            num_results: 0,
            results: [],
            limit: 100,
            offset: 0,
          },
        ],
      });

      setBotConversation(OPTIMISTIC_BOT_CONVERSATION_ID, {
        corresponding_project: {
          id: OPTIMISTIC_NEW_NOTEBOOK_ID,
        },
        id: OPTIMISTIC_BOT_CONVERSATION_ID,
        created_as_conversation: false,
        created_at: createISODate(),
        updated_at: createISODate(),
        is_streaming: false,
        title: "New chat",
        bot: { id: null },
        created_by: user,
        archived: false,
      });

      setSettings(dataOfNotebookToBeCreated.organizationId, OPTIMISTIC_NEW_NOTEBOOK_ID, {
        organization_settings: [],
        project_settings: [],
        user_settings: [],
      });

      // We have to update these values here so that the new chat is focused:
      generalContextStore.setState({
        organizationId: dataOfNotebookToBeCreated.organizationId,
        botConversationId: OPTIMISTIC_BOT_CONVERSATION_ID,
        notebookId: OPTIMISTIC_NEW_NOTEBOOK_ID,
      });
    },

    async onSuccess(projectFromResponse, requestVariables, context, ctx) {
      if (!projectFromResponse) return;

      const notebookId = projectFromResponse.metadata.id;

      const {
        setBotConversationMessageListPages,
        setNotebookListPages,
        setBotConversation,
        setNotebook,
        setBotPlan,
      } = generalContextStore.getState();

      setNotebookListPages(
        requestVariables.organizationId,
        (cachedProjectsInfiniteQueryResponse) => {
          log("[onSuccess] replacing optimist project metadata in projects infinite list", {
            cachedProjectsInfiniteQueryResponse,
            projectFromResponse,
            requestVariables,
            context,
          });

          if (!cachedProjectsInfiniteQueryResponse) {
            log(
              "[onSuccess] No cachedProjectsPage or response! Not replacing optimist project metadata in projects infinite list!",
              {
                cachedProjectsInfiniteQueryResponse,
                projectFromResponse,
              },
            );

            return cachedProjectsInfiniteQueryResponse;
          }

          const path = { pagesIndex: -1, resultIndex: -1 };

          let pagesIndex = -1;
          for (const page of cachedProjectsInfiniteQueryResponse.pages) {
            ++pagesIndex;

            const index = page.results.findIndex(({ id }) => id === OPTIMISTIC_NEW_NOTEBOOK_ID);

            if (index === -1) continue;

            path.pagesIndex = pagesIndex;
            path.resultIndex = index;

            break;
          }

          if (path.pagesIndex === -1 || path.resultIndex === -1) {
            log(
              "[onSuccess] No optimistic project found in projects infinite list. Not replacing it.",
            );

            return cachedProjectsInfiniteQueryResponse;
          }

          const newResults = cachedProjectsInfiniteQueryResponse.pages[
            path.pagesIndex
          ]?.results.with(path.resultIndex, projectFromResponse.metadata);

          if (!newResults) {
            console.error(
              "[onSuccess] newResults is undefined inside infinite list! This should never happen!",
              {
                cachedProjectsInfiniteQueryResponse,
                projectFromResponse,
                context,
                path,
              },
            );

            return cachedProjectsInfiniteQueryResponse;
          }

          const oldPage = cachedProjectsInfiniteQueryResponse.pages[path.pagesIndex];
          if (!oldPage) {
            console.error(
              "[onSuccess] oldPage is undefined inside infinite list! This should never happen!",
              {
                cachedProjectsInfiniteQueryResponse,
                projectFromResponse,
                context,
                path,
              },
            );

            return cachedProjectsInfiniteQueryResponse;
          }

          const newPage: (typeof cachedProjectsInfiniteQueryResponse.pages)[number] = {
            ...oldPage,
            results: newResults,
          };

          const newPages: typeof cachedProjectsInfiniteQueryResponse.pages =
            cachedProjectsInfiniteQueryResponse.pages.with(path.pagesIndex, newPage);

          const newCachedProjectsInfiniteQueryResponse: typeof cachedProjectsInfiniteQueryResponse =
            {
              ...cachedProjectsInfiniteQueryResponse,
              pages: newPages,
            };

          log("[onSuccess] replaced optimist project metadata in projects infinite list", {
            newCachedProjectsInfiniteQueryResponse,
            projectFromResponse,
          });

          return newCachedProjectsInfiniteQueryResponse;
        },
      );

      setNotebook(notebookId, projectFromResponse);

      // Optimistically set the new bot conversation and messages:
      const botConversationId = projectFromResponse.metadata.bot_conversation?.id as
        | BotConversationId
        | undefined;

      if (isValidNumber(botConversationId)) {
        setBotPlan(botConversationId, requestVariables.organizationId, notebookId, undefined);

        ctx.client
          .prefetchQuery(
            queryKeyFactory.get["bot-plan"](
              botConversationId,
              requestVariables.organizationId,
              notebookId,
            ),
          )
          .catch(noop);

        setBotConversation(botConversationId, {
          corresponding_project: {
            id: notebookId,
          },
          created_as_conversation: false,
          created_at: createISODate(),
          updated_at: createISODate(),
          id: botConversationId,
          is_streaming: false,
          title: "New chat",
          bot: { id: null },
          created_by: user,
          archived: false,
        });

        setBotConversationMessageListPages(botConversationId, {
          pageParams: [
            {
              visible_to_user: "true",
              botConversationId,
              limit: 100,
              offset: 0,
            },
          ],
          pages: [
            {
              num_results: 0,
              results: [],
              limit: 100,
              offset: 0,
            },
          ],
        });
      }

      await ctx.client.prefetchQuery(
        queryKeyFactory.get["settings"](requestVariables.organizationId, notebookId),
      );

      generalContextStore.setState({
        organizationId: requestVariables.organizationId,
        botConversationId: botConversationId ?? null,
        notebookId: notebookId,
      });
    },

    meta: {
      errorTitle: "Failed to create new chat!",
    },

    onError() {
      // TODO: revert on error.
    },
  });
}
