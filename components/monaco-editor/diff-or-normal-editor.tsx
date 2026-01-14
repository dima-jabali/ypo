import { type DiffOnMount, type OnMount } from "@monaco-editor/react";
import { Resizable } from "re-resizable";
import { memo, Suspense } from "react";

import { useBlockStore } from "#/contexts/block-context";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { cn } from "#/helpers/class-names";
import {
	HANDLE_CLASSES_CONTAINER,
	MONACO_EDITOR_RESIZER_ENABLE_CONTAINER,
} from "#/helpers/monaco-editor";
import { LOADER } from "../Button";
import { MonacoDiffEditor } from "./diff-monaco-editor";
import {
	NormalMonacoEditor,
	type NormalMonacoEditorProps,
} from "./normal-monaco-editor";

type Props = NormalMonacoEditorProps;

const shouldShowSideBySide = false;

export const DiffOrNormalEditor = memo(function DiffOrNormalEditor(
	props: Props,
) {
	const blockDiffEditor = generalContextStore.use.blockDiffEditor();
	const blockStore = useBlockStore();
	const monacoDiffEditor = blockStore.use.monacoDiffEditor();
	const normalMonacoEditor = blockStore.use.monacoEditor();
	const blockUuid = blockStore.use.blockUuid();

	const { defaultValue, resizable, className, onChange } = props;

	const handleEditorDidMount: OnMount = (normalMonacoEditor) => {
		blockStore.setState({ monacoEditor: normalMonacoEditor });
	};

	const handleDiffEditorDidMount: DiffOnMount = (monacoDiffEditor) => {
		blockStore.setState({ monacoDiffEditor });

		// Hack to make the diff editor actually fill the container
		// Without it, for some reason, its height goes to 0 or 5px.
		const domNode = monacoDiffEditor.getModifiedEditor().getDomNode();
		const parent = domNode?.closest("section");

		if (!parent) return;

		monacoDiffEditor.getModifiedEditor().onDidLayoutChange((e) => {
			if (e.height < parent.clientHeight) {
				monacoDiffEditor.layout({
					height: parent.clientHeight,
					width: parent.clientWidth,
				});
			}
		});
	};

	function handleUseSimilarQueryOnTheRight() {
		// Modified editor. Use the value of the modified editor and assign it to
		// the original editor.

		if (!monacoDiffEditor) {
			console.info(
				"handleUseRightSide: no monacoDiffEditor! This should not happen!",
				{
					blockDiffEditor,
					normalMonacoEditor,
					monacoDiffEditor,
				},
			);

			return;
		}

		const normalValue = monacoDiffEditor.getModifiedEditor().getValue();

		onChange(normalValue);

		generalContextStore.setState({
			blockDiffEditor: null,
		});
	}

	function handleUseSimilarQueryOnTheLeft() {
		// Original editor.

		if (!monacoDiffEditor) {
			console.info(
				"handleUseLeftSide: no monacoDiffEditor! This should not happen!",
				{
					blockDiffEditor,
					normalMonacoEditor,
					monacoDiffEditor,
				},
			);

			return;
		}

		const diffValue = monacoDiffEditor.getOriginalEditor().getValue();

		onChange(diffValue);

		generalContextStore.setState({
			blockDiffEditor: null,
		});
	}

	function handleUseCodeOnTheRight() {
		// Modified editor. Use the value of the modified editor and assign it to
		// the original editor.

		if (!monacoDiffEditor) {
			console.info(
				"handleUseCodeOnTheRight: no monacoDiffEditor! This should not happen!",
				{
					normalMonacoEditor,
					monacoDiffEditor,
					blockDiffEditor,
				},
			);

			return;
		}

		const diffValue = monacoDiffEditor.getModifiedEditor().getValue();

		onChange(diffValue);

		generalContextStore.setState({
			blockDiffEditor: null,
		});
	}

	function handleUseCodeOnTheLeft() {
		// Original editor.

		if (!monacoDiffEditor) {
			console.info(
				"handleUseCodeOnTheLeft: no monacoDiffEditor! This should not happen!",
				{
					blockDiffEditor,
					normalMonacoEditor,
					monacoDiffEditor,
				},
			);

			return;
		}

		const normalValue = monacoDiffEditor.getOriginalEditor().getValue();

		onChange(normalValue);

		generalContextStore.setState({
			blockDiffEditor: null,
		});
	}

	const shouldCompareSimilarQueries = Boolean(
		blockDiffEditor &&
			blockDiffEditor.blockUuid &&
			blockDiffEditor.value &&
			blockDiffEditor.blockUuid === blockUuid,
	);

	const editorNode = (
		<Suspense fallback={LOADER}>
			{shouldCompareSimilarQueries ? (
				// We want to show the diff editor of a selected similar query:
				<MonacoDiffEditor
					// Using `!` cause we know that `diffEditorToShow` is not `null` at this point:
					handleUseRightQuery={handleUseSimilarQueryOnTheRight}
					handleUseLeftQuery={handleUseSimilarQueryOnTheLeft}
					handleEditorDidMount={handleDiffEditorDidMount}
					modifiedValue={blockDiffEditor!.value}
					originalValue={defaultValue}
					{...props}
				/>
			) : shouldShowSideBySide ? (
				// We want to show the code the backend made in a diff side by side:
				<MonacoDiffEditor
					handleEditorDidMount={handleDiffEditorDidMount}
					handleUseRightQuery={handleUseCodeOnTheRight}
					handleUseLeftQuery={handleUseCodeOnTheLeft}
					modifiedValue={blockDiffEditor!.value}
					originalValue={defaultValue}
					{...props}
				/>
			) : (
				<NormalMonacoEditor onMount={handleEditorDidMount} {...props} />
			)}
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
