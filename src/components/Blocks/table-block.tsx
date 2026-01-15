import { isEqual } from "es-toolkit";
import { AtSign, Check } from "lucide-react";
import { memo, useEffect, useState } from "react";

import { LOADER } from "#/components/Button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "#/components/Command";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { Table } from "#/components/Tables/TableMaker/Table";
import { DEFAULT_FILTERS } from "#/components/Tables/TableMaker/filters/filters";
import { useTableHelper } from "#/components/Tables/TableMaker/useTableHelper";
import { DeleteBlockFloatingButton } from "#/components/delete-block-floating-button";
import { FallbackLoader } from "#/components/fallback-loader";
import { RunArrow } from "#/components/run-arrow";
import { BlockStoreProvider, useBlockStore } from "#/contexts/block-context";
import {
	generalContextStore,
	useWithBotConversationId,
	useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import { getVariableName, handleDataPreview } from "#/helpers/blocks";
import { createISODate, noop } from "#/helpers/utils";
import {
	useDownloadedNotebookId,
	useVariablesToSelect,
} from "#/hooks/fetch/use-fetch-notebook";
import { usePatchNotebookBlocks } from "#/hooks/mutation/use-patch-notebook-blocks";
import { useRunTableBlock } from "#/hooks/mutation/use-run-table-block";
import {
	NotebookActionType,
	UpdateBlockActionKey,
	type BlockTable,
	type Variable,
} from "#/types/notebook";
import { AddBlockBelowButton } from "./add-block-below-button";
import { WriteVariable } from "./write-variable";

type Props = {
	tableBlock: BlockTable;
};

export type VariableToSelect = {
	id: number | undefined;
	variable: Variable;
	name: string;
};

export const TableBlock = memo(function TableBlock(props: Props) {
	return (
		<BlockStoreProvider
			extraInitialParams={{
				blockFilterAndSort:
					props.tableBlock.custom_block_info?.filters || DEFAULT_FILTERS,
				blockUuid: props.tableBlock.uuid,
			}}
		>
			<TableBlockRoot {...props} />
		</BlockStoreProvider>
	);
});

function TableBlockRoot({ tableBlock }: Props) {
	const [isOpen, setIsOpen] = useState(false);

	const variablesToSelect = useVariablesToSelect(tableBlock.write_variables);
	const isNotebookMode = generalContextStore.use.isNotebookMode();
	const patchNotebookBlocks = usePatchNotebookBlocks();
	const botConversationId = useWithBotConversationId();
	const organizationId = useWithOrganizationId();
	const notebookId = useDownloadedNotebookId();
	const runTableBlock = useRunTableBlock();
	const blockStore = useBlockStore();

	const isBlockRunning =
		patchNotebookBlocks.isPending || runTableBlock.isPending;
	const selectedVariableName = getVariableName(tableBlock.read_variables);
	const dataPreview = tableBlock?.custom_block_info?.data_preview;
	const dataPreviewLength =
		dataPreview && "data" in dataPreview && Array.isArray(dataPreview.data)
			? dataPreview.data.length
			: 10;

	const {
		dataComesFromDataPreview,
		numberOfRowsPerPage,
		totalNumberOfRows,
		tableMapStorage,
		isFetchingData,
		initialPage,
		isNewSource,
		putNewDataInTableFromNewSource,
		putSavedDataInTheTable,
		setNumberOfRowsPerPage,
		setIsNewSource,
		paginate,
	} = useTableHelper(tableBlock.uuid, dataPreviewLength);

	useEffect(() => {
		handleDataPreview({ dataPreview, putSavedDataInTheTable });
	}, [dataPreview, putSavedDataInTheTable]);

	function handleRunBlock() {
		if (runTableBlock.isPending) return;

		runTableBlock
			.mutateAsync({
				action_info: {
					filters: blockStore.getState().blockFilterAndSort,
					limit: numberOfRowsPerPage,
					offset: initialPage,
				},
			})
			.then((res) => {
				putNewDataInTableFromNewSource(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					res.action_output.data as any,
					res.action_output.num_rows,
				);
			})
			.catch(noop);
	}

	function handleSelect(variable: VariableToSelect) {
		if (!variable.name || isBlockRunning) return;

		const nextVar = [{ name: variable.name }];

		if (isEqual(nextVar, tableBlock.read_variables)) return;

		setIsOpen(false);

		patchNotebookBlocks
			.mutateAsync({
				timestamp: createISODate(),
				botConversationId,
				organizationId,
				notebookId,
				updates: [
					{
						action_type: NotebookActionType.UpdateBlock,
						action_info: {
							key: UpdateBlockActionKey.ReadVariables,
							block_uuid: tableBlock.uuid,
							value: nextVar,
						},
					},
				],
			})
			.then(handleRunBlock)
			.catch(noop);
	}

	const shouldShowTable = totalNumberOfRows !== null && !isBlockRunning;

	return (
		<article
			className="w-full flex flex-col gap-1 group/block"
			data-delete-block-before={isNotebookMode}
			id={tableBlock.uuid}
			title="Table block"
		>
			<header className="flex justify-between items-center">
				<Popover onOpenChange={setIsOpen} open={isOpen}>
					<PopoverTrigger
						className="w-fit flex items-center justify-between bg-transparent rounded-lg button-hover text-primary hover:text-primary text-xs p-1 px-2 gap-1 h-fit data-[is-open=true]:bg-button-hover border border-border-smooth disabled:pointer-events-none disabled:opacity-80"
						disabled={isBlockRunning || !isNotebookMode}
						title="Select variable to show its data"
					>
						{isBlockRunning ? (
							LOADER
						) : (
							<AtSign className="size-3 flex-none text-accent" />
						)}

						<i>
							{selectedVariableName ? selectedVariableName : "Select variable"}
						</i>
					</PopoverTrigger>

					{isOpen ? (
						<PopoverContent
							className="w-[200px] p-0 z-10 border border-border-smooth rounded-lg"
							sideOffset={2}
							align="start"
						>
							<Command>
								<CommandInput placeholder="Search variable..." />

								<CommandList>
									<CommandEmpty className="py-6 text-center text-xs text-muted">
										No variables found
									</CommandEmpty>

									<CommandGroup>
										{variablesToSelect.map((variable) => (
											<CommandItem
												title={`Select variable "${variable.name}"`}
												onSelect={() => handleSelect(variable)}
												key={variable.id || variable.name}
												className="button-hover"
												value={variable.name}
											>
												<Check
													className="mr-2 size-4 opacity-0 data-[visible=true]:opacity-100 flex-none"
													data-visible={selectedVariableName === variable.name}
												/>

												<span className="truncate whitespace-nowrap">
													{variable.name}
												</span>
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					) : null}
				</Popover>

				<RunArrow
					showLoader={isBlockRunning}
					disabled={isBlockRunning}
					onClick={handleRunBlock}
				/>
			</header>

			{shouldShowTable ? (
				<Table.Root
					className="border border-border-smooth rounded-lg"
					dataComesFromDataPreview={dataComesFromDataPreview}
					setNumberOfRowsPerPage={setNumberOfRowsPerPage}
					numberOfRowsPerPage={numberOfRowsPerPage}
					totalNumberOfRows={totalNumberOfRows}
					initialPageNumber={initialPage}
					setIsNewSource={setIsNewSource}
					isFetchingData={isFetchingData}
					allData={tableMapStorage}
					isNewSource={isNewSource}
					fetchMore={paginate}
					block={tableBlock}
				>
					<Table.DefaultHeader />

					<Table.Data />

					<Table.DefaultFooter />
				</Table.Root>
			) : (
				<section className="flex h-80 mt-2 items-center justify-center rounded-md border-2 border-dashed border-border-smooth hover:border-accent text-primary font-semibold">
					{isBlockRunning ? (
						<FallbackLoader fallbackFor="table-block" />
					) : selectedVariableName ? (
						<p>Run block to see table!</p>
					) : (
						<p>Select a variable to display its data in a table!</p>
					)}
				</section>
			)}

			{isNotebookMode ? (
				<footer>
					<WriteVariable block={tableBlock} />
				</footer>
			) : null}

			<DeleteBlockFloatingButton blockUuid={tableBlock.uuid} />
			<AddBlockBelowButton blockAboveUuid={tableBlock.uuid} />
		</article>
	);
}
