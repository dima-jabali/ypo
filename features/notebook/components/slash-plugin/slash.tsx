import { Popover as PopoverPrimitive } from "radix-ui";
import { startTransition, useLayoutEffect } from "react";

import { PopoverContent } from "#/components/Popover";
import {
	createISODate,
	createNotebookBlockUuid,
	getRandomSnakeCaseName,
} from "#/helpers/utils";
import { useFetchBetterbrainUser } from "#/hooks/fetch/use-fetch-betterbrain-user";
import { useIsStreaming } from "#/hooks/fetch/use-fetch-bot-conversation";
import {
	useDownloadedNotebookId,
	useSortedNotebookBlocks,
} from "#/hooks/fetch/use-fetch-notebook";
import { usePatchNotebookBlocks } from "#/hooks/mutation/use-patch-notebook-blocks";
import {
	BlockObjectType,
	NotebookActionType,
	type BlockLabel,
} from "#/types/notebook";
import { useListWithArrowKeysFocus } from "../../hooks/use-list-with-arrow-keys-focus";
import {
	COMMAND_POPOVER_STYLE_VARS,
	DEFAULT_FILTER_RESULTS,
} from "../../utils/utils";
import { useSlashStore, type FilterResult } from "./ctx";
import {
	useWithBotConversationId,
	useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";

export function Slash() {
	const slashStore = useSlashStore();
	const isOpen = slashStore.use.isOpen();
	const anchor = slashStore.use.anchor();
	const close = slashStore.use.close();

	return (
		<PopoverPrimitive.Root open={isOpen} onOpenChange={close}>
			<PopoverPrimitive.Anchor className="fixed size-1" style={anchor.style} />

			<CommandPopoverContent />
		</PopoverPrimitive.Root>
	);
}

function useCommandPopoverFilter() {
	const slashStore = useSlashStore();
	const filterRawString = slashStore.use.filterRawString();

	useLayoutEffect(() => {
		startTransition(() => {
			const filterString = filterRawString.trim().toLocaleLowerCase();

			if (!filterString) {
				slashStore.setState({ filterResults: DEFAULT_FILTER_RESULTS });

				return;
			}

			const filterResults = (
				DEFAULT_FILTER_RESULTS.map((item) => {
					const name = item.title.toLowerCase();
					let score = 0;

					if (name === filterString) {
						score += 3;
					} else if (name.startsWith(filterString)) {
						score += 2;
					} else if (name.includes(filterString)) {
						score += 1;
					}

					return score == 0 ? null : { item, score };
				}).filter(Boolean) as { item: FilterResult; score: number }[]
			)
				.sort((a, b) => {
					if (a.score > b.score) return -1;
					if (a.score < b.score) return 1;

					return 0;
				})
				.map(({ item }) => item);

			slashStore.setState({ filterResults });
		});
	}, [filterRawString, slashStore]);
}

function CommandPopoverContent() {
	const slashStore = useSlashStore();
	const filterRawString = slashStore.use.filterRawString();
	const filterResults = slashStore.use.filterResults();
	const patchNotebookBlocks = usePatchNotebookBlocks();
	const botConversationId = useWithBotConversationId();
	const sortedBlocks = useSortedNotebookBlocks();
	const organizationId = useWithOrganizationId();
	const notebookId = useDownloadedNotebookId();
	const user = useFetchBetterbrainUser();
	const anchor = slashStore.use.anchor();
	const close = slashStore.use.close();
	const isStreaming = useIsStreaming();

	useCommandPopoverFilter();

	function getNextBlockUuid() {
		if (!anchor.blockAboveUuid) return null;

		const blockAboveIndex = sortedBlocks.findIndex(
			(block) => block.uuid === anchor.blockAboveUuid,
		);

		return sortedBlocks[blockAboveIndex + 1]?.uuid ?? null;
	}

	function handleOnSelect(
		e:
			| React.KeyboardEvent<HTMLButtonElement>
			| React.PointerEvent<HTMLButtonElement>
			| KeyboardEvent,
		selectedButton?: HTMLButtonElement,
	) {
		const button = (() => {
			const target =
				selectedButton ||
				(e.target as
					| HTMLButtonElement
					| HTMLInputElement
					| HTMLImageElement
					| undefined);

			if (!target) return;

			if (target.localName === "img") return target.parentElement;

			return target;
		})();

		if (!button) return;

		const { type, label } = button.dataset;

		if (!type || !label) return;

		if (e.type !== "pointerup") {
			if (
				e.type === "keydown" &&
				(e as React.KeyboardEvent<HTMLButtonElement> | KeyboardEvent).code !==
					"Enter"
			) {
				return;
			}
		}

		const nextBlockUuid = getNextBlockUuid();

		const timestamp = createISODate();

		patchNotebookBlocks.mutate({
			botConversationId,
			organizationId,
			notebookId,
			timestamp,
			updates: [
				{
					action_type: NotebookActionType.CreateBlock,
					timestamp,
					action_info: {
						block: {
							write_variables: [{ name: getRandomSnakeCaseName() }],
							block_above_uuid: anchor.blockAboveUuid,
							uuid: createNotebookBlockUuid(),
							object: BlockObjectType.Block,
							last_modified_at: timestamp,
							label: label as BlockLabel,
							parent_block_uuid: null,
							last_modified_by: user,
							created_at: timestamp,
							similar_queries: [],
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							type: type as any,
							is_running: false,
							description: null,
							last_run_at: null,
							last_run_by: null,
							created_by: user,
							id: undefined,
						},
						order_by_timestamp_ms: new Date().getTime(),
						block_above_uuid: anchor.blockAboveUuid,
						block_below_uuid: nextBlockUuid,
						is_description_block: false,
						parent_block_uuid: null,
					},
				},
			],
		});

		close();
	}

	const { listRef, isAnyButtonFocused, inputRef } = useListWithArrowKeysFocus(
		filterRawString,
		handleOnSelect,
	);

	function handleClosePopoverOnBackspace(
		e: React.KeyboardEvent<HTMLInputElement>,
	) {
		if (e.key === "Backspace" && !filterRawString) {
			e.preventDefault();

			close();
		}
	}

	return (
		<PopoverContent
			className="z-10 flex flex-col gap-2 bg-secondary p-0 overflow-hidden outline-hidden w-[unset] data-[is-streaming=true]:bg-secondary data-[is-streaming=true]:rounded-full rounded-lg"
			data-is-streaming={isStreaming}
			avoidCollisions
			align="start"
			side="top"
		>
			{isStreaming ? (
				<p className="px-2 py-1 text-sm text-primary">
					Cannot add blocks while streaming
				</p>
			) : (
				<>
					<div className="border-white-gradient relative box-border flex gap-2 overflow-x-hidden px-2 py-1 tabular-nums text-primary">
						<span className="flex font-mono items-center">&gt;</span>

						<input
							className="flex w-full appearance-none items-center border-none bg-transparent leading-6 outline-hidden placeholder:text-sm no-ring"
							onChange={(e) =>
								slashStore.setState({ filterRawString: e.target.value })
							}
							onKeyDown={handleClosePopoverOnBackspace}
							placeholder="Keep typing to filter..."
							ref={inputRef}
							type="text"
							autoFocus
						/>
					</div>

					{filterResults.length === 0 ? (
						<p className="responsive-w scroll border-white-gradient box-border flex items-center justify-center overflow-x-hidden p-2">
							No results found
						</p>
					) : (
						<div
							className="responsive-w w-(--radix-popper-available-width) slash-grid border-white-gradient group simple-scrollbar relative box-border h-44 gap-2 overflow-hidden overflow-y-scroll p-2 scrollbar-stable"
							style={COMMAND_POPOVER_STYLE_VARS}
							ref={listRef}
						>
							{filterResults.map(
								({ icon, title, blockType, subtype }, index) => (
									<button
										className="z-40 flex items-center justify-start gap-3 h-11 whitespace-nowrap border border-[#664971a6] p-2 text-base tabular-nums outline-hidden hover:border-[#d46ee7] focus:border-[#eb81fe] data-[has-auto-focus=true]:border-[#eb81fe]/80  active:brightness-150 hover:not-focus:group-[.is-being-selected-by-keyboard]:border-[#664971a6]"
										data-has-auto-focus={index === 0 && !isAnyButtonFocused}
										onPointerUp={handleOnSelect}
										onKeyDown={handleOnSelect}
										value={filterRawString}
										data-type={blockType}
										data-label={subtype}
										key={subtype}
										type="button"
										tabIndex={0}
									>
										{icon}

										{title}
									</button>
								),
							)}
						</div>
					)}
				</>
			)}
		</PopoverContent>
	);
}
