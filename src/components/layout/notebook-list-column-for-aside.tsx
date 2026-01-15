import { memo, useMemo } from "react";

import { LOADER } from "#/components/Button";
import { FakeAIStream } from "#/components/fake-ai-stream";
import { EditNotebookModal } from "#/components/layout/edit-notebook-modal";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { useRerenderTreeStore } from "#/contexts/use-rerender-tree";
import {
	handleGoToChat,
	handlePrefetchChat,
} from "#/helpers/handle-go-to-chat";
import { useFetchNotebookListPage } from "#/hooks/fetch/use-fetch-notebook-list-page";
import { useFetchOrganizationTags } from "#/hooks/fetch/use-fetch-organization-tags";
import { useSetNotebookToFirst } from "#/hooks/use-set-notebook-to-first";
import type { NotebookTag } from "#/types/notebook";

const DEFAULT_TAGS: Array<NotebookTag> = [];

export const NotebookListColumnForAside = memo(
	function NotebookListColumnForAside() {
		const organizationId = generalContextStore.use.organizationId();
		const rerenderTree = useRerenderTreeStore().use.rerenderTree();
		const fetchNotebookListPageQuery = useFetchNotebookListPage();
		const tags = useFetchOrganizationTags().data ?? DEFAULT_TAGS;
		const notebookId = generalContextStore.use.notebookId();

		useSetNotebookToFirst();

		const notebookMetadataList = useMemo(
			() =>
				fetchNotebookListPageQuery.data.pages.flatMap((page) => page.results),
			[fetchNotebookListPageQuery.data],
		);

		return (
			<ul className="flex flex-col @max-[15rem]:opacity-0 transition-[opacity] duration-75 max-h-full simple-scrollbar overflow-x-hidden">
				{notebookMetadataList.map((notebook, index) => {
					if (index === 0) {
						handlePrefetchChat(
							notebook.id,
							notebook.bot_conversation?.id ?? null,
							organizationId,
						);
					}

					const isActive = notebook.id === notebookId;

					return (
						<li
							className="cursor-pointer w-full max-w-full button-hover rounded-lg flex items-center gap-1 text-primary justify-between text-xs flex-none data-[is-active=true]:bg-button-hover select-none"
							title={`${notebook.title} (${notebook.id})`}
							data-is-active={isActive}
							key={notebook.id}
						>
							<button
								onClick={() => {
									handleGoToChat(
										notebook.id,
										notebook.bot_conversation?.id ?? null,
									);

									rerenderTree();
								}}
								onPointerDown={() =>
									handlePrefetchChat(
										notebook.id,
										notebook.bot_conversation?.id ?? null,
										organizationId,
									)
								}
								className="w-full max-w-[80%] h-full p-2 flex items-center gap-2"
								type="button"
							>
								<FakeAIStream
									className="truncate min-h-5 flex items-center"
									fullText={notebook.title}
									key={notebook.uuid}
								/>

								<span className="ml-auto text-xs text-muted-foreground sr-only">
									{notebook.id}
								</span>
							</button>

							<EditNotebookModal
								key={notebook.uuid}
								notebook={notebook}
								allTags={tags}
								chatMode
							/>
						</li>
					);
				})}

				{notebookMetadataList.length === 0 ? (
					<div className="flex flex-col gap-3 text-xs items-center justify-center w-full h-full text-muted">
						<span>No projects on this organization!</span>
					</div>
				) : (
					<li className="flex items-center justify-center w-full p-2">
						<button
							className="disabled:opacity-50 p-2 text-xs not-disabled:link not-disabled:hover:underline flex gap-2 items-center"
							onClick={() => fetchNotebookListPageQuery.fetchNextPage()}
							disabled={
								!fetchNotebookListPageQuery.hasNextPage ||
								fetchNotebookListPageQuery.isFetchingNextPage
							}
							type="button"
						>
							{fetchNotebookListPageQuery.isFetchingNextPage ? (
								<>
									{LOADER}

									<span>Loading more...</span>
								</>
							) : fetchNotebookListPageQuery.hasNextPage ? (
								"Load more"
							) : (
								"Nothing more to load"
							)}
						</button>
					</li>
				)}
			</ul>
		);
	},
);

NotebookListColumnForAside.whyDidYouRender = true;
