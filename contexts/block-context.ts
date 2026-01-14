import type { editor as MonacoEditorType } from "monaco-editor";

import { DEFAULT_FILTERS } from "#/components/Tables/TableMaker/filters/filters";
import {
	BlockType,
	type KernelResult,
	type NotebookBlockUuid,
} from "#/types/notebook";
import { createZustandProvider } from "./create-zustand-provider";

type BlockStore = {
	monacoDiffEditor: MonacoEditorType.IStandaloneDiffEditor | null;
	monacoEditor: MonacoEditorType.IStandaloneCodeEditor | null;
	blockFilterAndSort: typeof DEFAULT_FILTERS;
	kernelResults: Array<KernelResult>;
	blockUuid: NotebookBlockUuid;
	blockType: BlockType;
};

export const { Provider: BlockStoreProvider, useStore: useBlockStore } =
	createZustandProvider<BlockStore>(
		() => ({
			blockFilterAndSort: DEFAULT_FILTERS,
			blockUuid: "" as NotebookBlockUuid,
			blockType: BlockType.BatchTable,
			monacoDiffEditor: null,
			monacoEditor: null,
			kernelResults: [],
		}),
		{
			name: "BlockContext",
		},
	);
