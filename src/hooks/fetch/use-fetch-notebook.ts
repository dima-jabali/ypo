import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import type { VariableToSelect } from "#/components/Blocks/table-block";
import { renderNotebookBlock } from "#/components/msgs/render-notebook-block";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { identity, isValidNumber } from "#/helpers/utils";
import type { NormalDatabaseConnection } from "#/types/databases";
import {
	SqlBlockSourceType,
	type BlockBase,
	type Notebook,
	type NotebookBlock,
	type NotebookBlockUuid,
} from "#/types/notebook";
import { queryKeyFactory } from "../query-keys";

export type FetchNotebookResponse = Notebook;

export function useFetchNotebook<SelectedData = FetchNotebookResponse>(
	select: (data: FetchNotebookResponse) => SelectedData = identity<
		FetchNotebookResponse,
		SelectedData
	>,
) {
	const notebookId = generalContextStore.use.notebookId();

	if (!isValidNumber(notebookId)) {
		// shouldNeverHappen(`"notebookId" from general context store is not valid! Got "${notebookId}"`);
		throw new Error(
			`"notebookId" from general context store is not valid! Got "${notebookId}"`,
		);
	}

	const queryOptions = useMemo(
		() => queryKeyFactory.get["notebook-by-id"](notebookId),
		[notebookId],
	);

	return useSuspenseQuery({
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		gcTime: Infinity, // Maintain on cache
		select,
		...queryOptions,
	}).data;
}

const selectNotebookBlocks = (data: FetchNotebookResponse) => data.blocks;
export function useNotebookBlocks() {
	return useFetchNotebook(selectNotebookBlocks);
}

const selectDownloadedNotebookId = (data: FetchNotebookResponse) =>
	data.metadata.id;
export function useDownloadedNotebookId() {
	return useFetchNotebook(selectDownloadedNotebookId);
}

const selectDownloadedNotebookUuid = (data: FetchNotebookResponse) =>
	data.metadata.uuid;
export function useDownloadedNotebookUuid() {
	return useFetchNotebook(selectDownloadedNotebookUuid);
}

const selectDownloadedNotebookOrganizationId = (data: FetchNotebookResponse) =>
	data.metadata.organization.id;
export function useDownloadedNotebookOrganizationId() {
	return useFetchNotebook(selectDownloadedNotebookOrganizationId);
}

const selectDownloadedNotebookBotConversationId = (
	data: FetchNotebookResponse,
) => data.metadata.bot_conversation?.id;
export function useDownloadedNotebookBotConversationId() {
	return useFetchNotebook(selectDownloadedNotebookBotConversationId);
}

const selectDownloadedNotebookMetadata = (data: FetchNotebookResponse) =>
	data.metadata;
export function useDownloadedNotebookMetadata() {
	return useFetchNotebook(selectDownloadedNotebookMetadata);
}

const selectDownloadedNotebookStatus = (data: FetchNotebookResponse) =>
	data.metadata.status;
export function useDownloadedNotebookStatus() {
	return useFetchNotebook(selectDownloadedNotebookStatus);
}

const selectDownloadedNotebookTags = (data: FetchNotebookResponse) =>
	data.metadata.tags;
export function useDownloadedNotebookTags() {
	return useFetchNotebook(selectDownloadedNotebookTags);
}

const selectDownloadedNotebookTitle = (data: FetchNotebookResponse) =>
	data.metadata.title;
export function useDownloadedNotebookTitle() {
	return useFetchNotebook(selectDownloadedNotebookTitle);
}

const selectDownloadedNotebookDescription = (data: FetchNotebookResponse) =>
	data.metadata.description;
export function useDownloadedNotebookDescription() {
	return useFetchNotebook(selectDownloadedNotebookDescription);
}

export function useNotebookBlock(uuid: NotebookBlockUuid) {
	const selectBlock = useCallback(
		(data: FetchNotebookResponse) =>
			data.blocks.find((block) => block.uuid === uuid),
		[uuid],
	);

	const notebookBlock = useFetchNotebook(selectBlock);

	return useMemo(
		() => ({
			render: notebookBlock ? renderNotebookBlock(notebookBlock) : null,
			notebookBlock,
		}),
		[notebookBlock],
	);
}

function selectSortedNotebookBlocks(
	data: FetchNotebookResponse,
): NotebookBlock[] {
	const totalBlocks = data.blocks.length;

	if (totalBlocks === 0) {
		return [];
	}

	// A map to look up the actual block object by its UUID (O(1) access)
	const belowBlockUuidMap = new Map<NotebookBlockUuid, NotebookBlockUuid>();
	const blocksByUuid = new Map<NotebookBlockUuid, NotebookBlock>();
	let firstBlockUuid: NotebookBlockUuid | null = null;

	// 1. Build the Maps and find the first block (O(N))
	for (const block of data.blocks) {
		blocksByUuid.set(block.uuid, block);

		// Identify the start block (the one with no block_above_uuid)
		if (!block.block_above_uuid) {
			firstBlockUuid = block.uuid;
		} else {
			// Populate the map to find the block BELOW the current 'block_above_uuid'
			belowBlockUuidMap.set(block.block_above_uuid, block.uuid);
		}
	}

	// Error Check: Ensure the first block was found
	if (!firstBlockUuid) {
		throw new Error(
			"First block (block_above_uuid === null) not found in a non-empty notebook!",
		);
	}

	// 2. Traverse the list and build the sorted array (O(N))
	let currentBlockUuid: NotebookBlockUuid | undefined = firstBlockUuid;
	const sortedBlocks: NotebookBlock[] = [];

	while (currentBlockUuid) {
		const currentBlock = blocksByUuid.get(currentBlockUuid);
		if (!currentBlock) {
			// This shouldn't happen if the input is valid, but is a safe check.
			throw new Error(`Block with UUID ${currentBlockUuid} not found!`);
		}

		sortedBlocks.push(currentBlock);

		// Get the next block's UUID by looking up the current block's UUID in the reverse map
		currentBlockUuid = belowBlockUuidMap.get(currentBlockUuid);
	}

	// Final check: Ensure we traversed all blocks
	if (sortedBlocks.length !== totalBlocks) {
		throw new Error(
			`Only ${sortedBlocks.length} out of ${totalBlocks} blocks were sorted. The notebook list is fragmented or contains a loop!`,
		);
	}

	return sortedBlocks;
}
export function useSortedNotebookBlocks() {
	const sorted = useFetchNotebook(selectSortedNotebookBlocks);

	return sorted;
}

function selectAllDataframes(data: FetchNotebookResponse) {
	return Object.entries(data.metadata.variable_info ?? {})
		.filter(
			([, value]) =>
				value.type ===
				(SqlBlockSourceType.Dataframes as unknown as NormalDatabaseConnection["type"]),
		)
		.map(([key, variable]) => ({ name: key, ...variable }));
}
export function useAllDataframes() {
	return useFetchNotebook(selectAllDataframes);
}

function selectIsThereAnyBlock(data: FetchNotebookResponse) {
	return data.blocks.length > 0;
}
export function useIsThereAnyBlock() {
	return useFetchNotebook(selectIsThereAnyBlock);
}

export function useVariablesToSelect(
	blockWriteVariables: BlockBase["write_variables"],
) {
	const selectVariablesToSelect = useCallback(
		(data: FetchNotebookResponse) => {
			const projectVariableInfo = data.metadata.variable_info;

			if (!projectVariableInfo) return [];

			const projectVariables: Array<VariableToSelect> = [];

			for (const key in projectVariableInfo) {
				const variable = projectVariableInfo[key];

				if (
					!variable ||
					variable.type ===
						(SqlBlockSourceType.Dataframes as unknown as NormalDatabaseConnection["type"]) ||
					blockWriteVariables?.some(
						(tableBlockVariable) => tableBlockVariable.name === key,
					)
				) {
					continue;
				}

				projectVariables.push({
					id: variable.id,
					name: key,
					variable,
				});
			}

			return projectVariables;
		},
		[blockWriteVariables],
	);

	return useFetchNotebook(selectVariablesToSelect);
}
