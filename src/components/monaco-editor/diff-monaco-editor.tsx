import type { DiffOnMount } from "@monaco-editor/react";
import { lazy } from "react";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { MONACO_DIFF_EDITOR_OPTIONS } from "#/helpers/monaco-editor";
import { useIsStreaming } from "#/hooks/fetch/use-fetch-bot-conversation";
import { ColorScheme } from "#/types/general";

const DiffEditor = lazy(async () => ({
  default: (await import("@monaco-editor/react")).DiffEditor,
}));

type Props = {
  isBlockReadonly: boolean;
  isBlockRunning: boolean;
  modifiedValue: string;
  originalValue: string;
  language: string;
  handleEditorDidMount: DiffOnMount;
  handleUseRightQuery: () => void;
  handleUseLeftQuery: () => void;
};

const WRAPPER_CLASSNAME = {
  className: "h-[calc(100%-2rem)] min-h-[calc(13rem-2rem)]",
};

export function MonacoDiffEditor({
  isBlockReadonly,
  isBlockRunning,
  modifiedValue,
  originalValue,
  language,
  handleEditorDidMount,
  handleUseRightQuery,
  handleUseLeftQuery,
}: Props) {
  const colorScheme = generalContextStore.use.colorScheme();
  const isStreaming = useIsStreaming();

  let readonlyMessage = "";

  if (isBlockRunning) {
    readonlyMessage = "Cannot edit while running block";
  } else if (isStreaming) {
    readonlyMessage = "Cannot edit while streaming";
  } else if (isBlockReadonly) {
    readonlyMessage =
      "Blocks are readonly on Chat Mode.\nYou can change that in the settings modal.";
  }

  const diffEditorOptions: typeof MONACO_DIFF_EDITOR_OPTIONS = {
    ...MONACO_DIFF_EDITOR_OPTIONS,
    readOnly: isBlockRunning || isStreaming,
    readOnlyMessage: {
      value: readonlyMessage,
    },
  };

  return (
    <>
      <header className="flex h-8 w-full items-center justify-between p-1">
        <div className="flex items-center gap-2">
          <button
            className="rounded-sm px-2 py-1 border border-border-smooth  text-xs text-primary button-hover"
            onClick={handleUseLeftQuery}
          >
            Use left query
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-sm px-2 py-1 border border-border-smooth  text-xs text-primary button-hover"
            onClick={handleUseRightQuery}
          >
            Use right query
          </button>
        </div>
      </header>

      <style>
        {/*
					Make the diff editor only highlight the different,
					characters instead of the whole line:
				*/}
        {`
					.monaco-editor, .monaco-diff-editor {
						--vscode-diffEditor-insertedLineBackground: transparent;
						--vscode-diffEditor-removedLineBackground: transparent;
					}
			`}
      </style>

      <DiffEditor
        className="h-[calc(100%-2rem)] max-h-(--block-height) min-h-[calc(13rem-2rem)] w-full min-w-full"
        theme={colorScheme === ColorScheme.dark ? "vs-dark" : "vs-light"}
        wrapperProps={WRAPPER_CLASSNAME}
        onMount={handleEditorDidMount}
        options={diffEditorOptions}
        modified={modifiedValue}
        original={originalValue}
        language={language}
      />
    </>
  );
}
