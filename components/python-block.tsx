import { ChevronDown, Download, Forward } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";

import { BlockStoreProvider, useBlockStore } from "#/contexts/block-context";
import {
	generalContextStore,
	useWithBotConversationId,
	useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import { PYTHON_DEFAULT_CODE } from "#/helpers/blocks";
import { createISODate, getErrorMessage, noop } from "#/helpers/utils";
import { useIsStreaming } from "#/hooks/fetch/use-fetch-bot-conversation";
import { useDownloadedNotebookId } from "#/hooks/fetch/use-fetch-notebook";
import { useAskToGeneratePythonCode } from "#/hooks/mutation/use-ask-to-generate-python-code";
import {
	useDownloadAwsCsvFile,
	type FileToDownload,
} from "#/hooks/mutation/use-download-aws-csv-file";
import { useIsFixingPython } from "#/hooks/mutation/use-fix-python";
import { usePatchNotebookBlocks } from "#/hooks/mutation/use-patch-notebook-blocks";
import { useRunPython } from "#/hooks/mutation/use-run-python";
import {
	KernelResultsTypes,
	NotebookActionType,
	UpdateBlockActionKey,
	type BlockPython,
} from "#/types/notebook";
import { LOADER } from "../Button";
import { CodeOutput } from "../code-output";
import { DeleteBlockFloatingButton } from "../delete-block-floating-button";
import { NormalMonacoEditor } from "../monaco-editor/normal-monaco-editor";
import { RunArrow } from "../run-arrow";
import { AddBlockBelowButton } from "./add-block-below-button";

export type VariableData = {
	name: string;
};

export type ParseErrorResult = {
	results: string | string[];
	superError?: boolean;
	error: boolean;
};

type Props = {
	pythonBlock: BlockPython;
};

export const PythonBlock = memo(function PythonBlockWithProviders(
	props: Props,
) {
	return (
		<BlockStoreProvider
			extraInitialParams={{
				blockUuid: props.pythonBlock.uuid,
				blockType: props.pythonBlock.type,
			}}
		>
			<PythonBlockWithContexts {...props} />
		</BlockStoreProvider>
	);
});

function PythonBlockWithContexts({ pythonBlock }: Props) {
	const code = pythonBlock.custom_block_info?.code ?? "";
	const blockUuid = pythonBlock.uuid;

	const [shouldShowCodeEditor, setShouldShowCodeEditor] = useState(false);
	const [isEditorEmpty, setIsEditorEmpty] = useState(!code.trim());

	const commandTextareaValueRef = useRef(
		pythonBlock.custom_block_info?.command ?? "",
	);
	const changeSqlCodeTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

	const canEditCodeInChatMode =
		generalContextStore.use.allowEditingCodeInChatMode();
	const shouldShowCodeInChatModeFromSettings =
		generalContextStore.use.showCodeInChatMode();
	const patchNotebookBlocks = usePatchNotebookBlocks().mutateAsync;
	const isNotebookMode = generalContextStore.use.isNotebookMode();
	const askToGeneratePythonCode = useAskToGeneratePythonCode();
	const isChatMode = generalContextStore.use.isChatMode();
	const botConversationId = useWithBotConversationId();
	const isFixingCode = useIsFixingPython(blockUuid);
	const organizationId = useWithOrganizationId();
	const notebookId = useDownloadedNotebookId();
	const runPython = useRunPython(blockUuid);
	const isStreaming = useIsStreaming();
	const blockStore = useBlockStore();
	const monacoEditor = blockStore.use.monacoEditor();

	const isBlockRunning = runPython.isPending || pythonBlock.is_running;

	function handleToggleShowCodeEditor() {
		setShouldShowCodeEditor((prev) => !prev);
	}

	async function handleRunPython() {
		if (isBlockRunning || !monacoEditor) return;

		blockStore.setState({ kernelResults: [] });

		try {
			const pythonCode = monacoEditor.getValue();

			if (pythonCode === undefined) {
				throw new Error("Python code is undefined. This should not happen.");
			}

			await patchNotebookBlocks({
				timestamp: createISODate(),
				botConversationId,
				organizationId,
				notebookId,
				updates: [
					{
						action_type: NotebookActionType.UpdateBlock,
						action_info: {
							key: UpdateBlockActionKey.Code,
							block_uuid: blockUuid,
							value: pythonCode,
						},
					},
				],
			});

			const res = await runPython.mutateAsync({
				action_info: {
					code: pythonCode,
				},
			});

			blockStore.setState({ kernelResults: res.action_output.data });
		} catch (error) {
			blockStore.setState({
				kernelResults: [
					{
						value:
							getErrorMessage(error) ?? "See console for more information.",
						type: KernelResultsTypes.ERROR,
					},
				],
			});
		}
	}

	async function handleAskForBackendToGeneratePythonCode() {
		const prompt = commandTextareaValueRef.current.trim();

		if (askToGeneratePythonCode.isPending || !prompt) return;

		const res = await askToGeneratePythonCode.mutateAsync({
			blockUuid: blockUuid,
			action_info: {
				old_code: monacoEditor?.getValue() ?? code ?? "",
				prompt: prompt,
			},
		});

		await patchNotebookBlocks({
			timestamp: createISODate(),
			botConversationId,
			organizationId,
			notebookId,
			updates: [
				{
					action_type: NotebookActionType.UpdateBlock,
					action_info: {
						key: UpdateBlockActionKey.Query,
						block_uuid: blockUuid,
						value: prompt,
					},
				},
				{
					action_type: NotebookActionType.UpdateBlock,
					action_info: {
						key: UpdateBlockActionKey.Code,
						value: res.action_output.code,
						block_uuid: blockUuid,
					},
				},
			],
		});
	}

	function handleChangeCommand(event: React.ChangeEvent<HTMLTextAreaElement>) {
		commandTextareaValueRef.current = event.target.value;
	}

	function handleAskAiOnMetaEnter(
		event: React.KeyboardEvent<HTMLTextAreaElement>,
	) {
		if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
			handleAskForBackendToGeneratePythonCode().catch(noop);
		}
	}

	function handleCodeChange(newString = "") {
		setIsEditorEmpty(!newString.trim());

		clearTimeout(changeSqlCodeTimerRef.current);

		changeSqlCodeTimerRef.current = setTimeout(() => {
			patchNotebookBlocks({
				timestamp: createISODate(),
				botConversationId,
				organizationId,
				notebookId,
				updates: [
					{
						action_type: NotebookActionType.UpdateBlock,
						action_info: {
							key: UpdateBlockActionKey.Query,
							block_uuid: blockUuid,
							value: newString,
						},
					},
				],
			}).catch(noop);
		}, 2_000);
	}

	const errorFromDataPreview =
		pythonBlock.custom_block_info?.data_preview &&
		"error" in pythonBlock.custom_block_info.data_preview
			? pythonBlock.custom_block_info.data_preview.error
			: null;
	const dataPreview = pythonBlock.custom_block_info?.data_preview;
	const isDataPreviewStale =
		pythonBlock.custom_block_info?.is_data_preview_stale || false;

	// The data preview should show whenever it is updated.
	useEffect(() => {
		if (errorFromDataPreview) {
			blockStore.setState({
				kernelResults: [
					{ type: KernelResultsTypes.ERROR, value: errorFromDataPreview },
				],
			});
		} else if (dataPreview && !("error" in dataPreview)) {
			blockStore.setState({ kernelResults: dataPreview });
		}
	}, [errorFromDataPreview, dataPreview, blockStore]);

	// Update the monaco editor value when the block changes
	useEffect(() => {
		if (!monacoEditor) return;

		const editorValue = monacoEditor.getValue();

		if (typeof code === "string" && editorValue !== code) {
			monacoEditor.setValue(code);

			monacoEditor.revealLine(monacoEditor.getModel()?.getLineCount() ?? 0);
		}
	}, [code, monacoEditor]);

	const canRunBlock = Boolean(
		monacoEditor?.getValue() !== PYTHON_DEFAULT_CODE &&
			monacoEditor?.getValue() !== "[]" &&
			!isFixingCode &&
			!isStreaming,
	);

	const isCodeEditorVisible =
		shouldShowCodeInChatModeFromSettings ||
		shouldShowCodeEditor ||
		isNotebookMode;
	const filesToDownload = pythonBlock.custom_block_info?.files_to_download;
	const isReadonly = (!canEditCodeInChatMode && isChatMode) || isStreaming;

	return (
		<article
			data-delete-block-before={isNotebookMode}
			className="w-full group/block"
			id={pythonBlock.uuid}
			title="Python block"
		>
			<section className="flex items-center justify-end w-full pb-1">
				<div className="flex items-center gap-3">
					<RunArrow
						disabled={!canRunBlock || isReadonly || isEditorEmpty}
						showLoader={isBlockRunning || isFixingCode}
						onClick={handleRunPython}
					>
						{isFixingCode ? "Fixing..." : null}
					</RunArrow>
				</div>
			</section>

			<section className="flex flex-col gap-0 border rounded-lg overflow-hidden border-border-smooth">
				{isNotebookMode || shouldShowCodeInChatModeFromSettings ? null : (
					<div
						className="flex items-center justify-between p-2 text-xs border-b border-border-smooth  data-[is-editor-visible=false]:border-none"
						data-is-editor-visible={isCodeEditorVisible}
					>
						<p>{isStreaming ? "Analysing..." : null}</p>

						<button
							className="p-2 rounded-lg button-hover flex gap-2"
							onClick={handleToggleShowCodeEditor}
							type="button"
						>
							<ChevronDown
								className="size-4 data-[is-up=true]:rotate-180"
								data-is-up={isCodeEditorVisible}
							/>

							<span>{isCodeEditorVisible ? "Hide" : "Show"} Python code</span>
						</button>
					</div>
				)}

				{isNotebookMode ? (
					<div className="flex items-center w-full">
						<textarea
							className="no-ring resize-none simple-scrollbar p-2 w-full min-h-[1lh] field-sizing-content text-sm data-[loading=true]:text-loading text-muted"
							defaultValue={pythonBlock.custom_block_info?.command}
							placeholder="Ask a question to this Python block..."
							data-loading={askToGeneratePythonCode.isPending}
							onKeyDown={handleAskAiOnMetaEnter}
							onChange={handleChangeCommand}
						/>

						<button
							className="flex items-center justify-center button-hover aspect-square h-9"
							title="Ask question"
							onClick={handleAskForBackendToGeneratePythonCode}
						>
							{askToGeneratePythonCode.isPending ? (
								LOADER
							) : (
								<Forward className="size-4" />
							)}
						</button>
					</div>
				) : null}

				{isCodeEditorVisible ? (
					<NormalMonacoEditor
						isBlockRunning={isBlockRunning}
						isBlockReadonly={isReadonly}
						selectedDatabase={undefined}
						onChange={handleCodeChange}
						isFixingCode={isFixingCode}
						className="relative inline"
						blockUuid={blockUuid}
						autocomplete={false}
						defaultValue={code}
						language="python"
						resizable
					/>
				) : null}

				<CodeOutput
					isDataPreviewStale={isDataPreviewStale}
					blockUuid={blockUuid}
					isSqlBlock={false}
				/>
			</section>

			<footer className="flex flex-col gap-2">
				<div className="flex flex-wrap gap-2">
					{filesToDownload?.map((file) => (
						<DownloadFileButton key={file.aws_key} file={file} />
					))}
				</div>

				<AddBlockBelowButton blockAboveUuid={blockUuid} />
			</footer>

			<DeleteBlockFloatingButton blockUuid={blockUuid} />
		</article>
	);
}

function DownloadFileButton({ file }: { file: FileToDownload }) {
	const downloadAwsCsvFile = useDownloadAwsCsvFile(file);

	if (!file.executed) return null;

	return (
		<div
			className="text-sm my-1 px-1.5 py-0.5 rounded-sm bg-accent flex items-center gap-1.5 text-accent-foreground"
			title="Download file"
		>
			<Download className="size-3.5 flex-none" />

			<button
				className="hover:underline font-semibold link underline-offset-2"
				onClick={() => downloadAwsCsvFile.mutate()}
				disabled={downloadAwsCsvFile.isPending}
				type="button"
			>
				{file.variable_name}.csv
			</button>

			{downloadAwsCsvFile.isPending ? LOADER : null}
		</div>
	);
}
