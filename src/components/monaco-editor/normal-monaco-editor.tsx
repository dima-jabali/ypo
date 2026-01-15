import { type Monaco, type OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditorType } from "monaco-editor";
import { Resizable } from "re-resizable";
import { lazy, memo, Suspense } from "react";

import { useBlockStore } from "#/contexts/block-context";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { cn } from "#/helpers/class-names";
import {
	HANDLE_CLASSES_CONTAINER,
	MONACO_EDITOR_OPTIONS,
	MONACO_EDITOR_RESIZER_ENABLE_CONTAINER,
} from "#/helpers/monaco-editor";
import { noop } from "#/helpers/utils";
import { useIsStreaming } from "#/hooks/fetch/use-fetch-bot-conversation";
import type { NormalDatabaseConnection } from "#/types/databases";
import { ColorScheme } from "#/types/general";
import { HandleSetupAutocomplete } from "./handle-setup-autocomplete";
import type { NotebookBlockUuid } from "#/types/notebook";
import { LOADER } from "../Button";

const Editor = lazy(async () => ({
	default: (await import("@monaco-editor/react")).Editor,
}));

export type NormalMonacoEditorProps = {
	selectedDatabase: NormalDatabaseConnection | undefined;
	blockUuid: NotebookBlockUuid;
	isBlockReadonly: boolean;
	isBlockRunning: boolean;
	autocomplete: boolean;
	isFixingCode: boolean;
	defaultValue: string;
	className?: string;
	resizable: boolean;
	language: string;
	onChange: (e: string | undefined) => void;
	onMount?: OnMount;
};

// Apparently, this is a hack to make the extra details
// of the autosuggestion widget always appear:
const OVERRIDE_SERVICES = {
	onDidChangeStorage: noop,
	getBoolean: () => true,
	onWillSaveState: noop,
	remove: noop,
	store: noop,
	get: noop,
};

export const NormalMonacoEditor = memo(function NormalMonacoEditor(
	props: NormalMonacoEditorProps,
) {
	const colorScheme = generalContextStore.use.colorScheme();
	const isStreaming = useIsStreaming();
	const blockStore = useBlockStore();

	const {
		isBlockReadonly,
		isBlockRunning,
		defaultValue,
		isFixingCode,
		autocomplete,
		className,
		resizable,
		language,
		onChange,
		onMount,
	} = props;

	const readonlyWithCodeHighlight =
		isBlockReadonly || isBlockRunning || isFixingCode;
	const readonlyWithoutCodeHighlight = isFixingCode;
	const isReadonly = readonlyWithCodeHighlight || readonlyWithoutCodeHighlight;

	function localOnMount(
		monacoEditor: MonacoEditorType.IStandaloneCodeEditor,
		monaco: Monaco,
	) {
		blockStore.setState({ monacoEditor });

		onMount?.(monacoEditor, monaco);
	}

	let readonlyMessage = "";

	if (isBlockRunning) {
		readonlyMessage = "Cannot edit while running block";
	} else if (isStreaming) {
		readonlyMessage = "Cannot edit while streaming";
	} else if (isBlockReadonly) {
		readonlyMessage =
			"Blocks are readonly on Chat Mode.\nYou can change that in the settings modal.";
	} else if (isFixingCode) {
		readonlyMessage = "Cannot edit while fixing code";
	}

	const editorNode = (
		<Suspense fallback={LOADER}>
			<Editor
				className={`h-full min-h-52 w-full min-w-full max-h-(--block-height) ${
					readonlyWithoutCodeHighlight ? "**:text-primary!" : ""
				}`}
				options={{
					...MONACO_EDITOR_OPTIONS,
					"semanticHighlighting.enabled": !readonlyWithCodeHighlight,
					readOnly: isReadonly,
					readOnlyMessage: {
						value: readonlyMessage,
					},
				}}
				theme={colorScheme === ColorScheme.dark ? "vs-dark" : "vs-light"}
				overrideServices={OVERRIDE_SERVICES}
				defaultValue={defaultValue}
				onMount={localOnMount}
				onChange={onChange}
				language={language}
			/>

			{autocomplete ? <HandleSetupAutocomplete {...props} /> : null}
		</Suspense>
	);

	return resizable ? (
		<Resizable
			className={cn("mb-1.5 overflow-visible", className)}
			enable={MONACO_EDITOR_RESIZER_ENABLE_CONTAINER}
			handleClasses={HANDLE_CLASSES_CONTAINER}
			minHeight="208px"
			minWidth="100%"
		>
			{editorNode}
		</Resizable>
	) : (
		editorNode
	);
});
