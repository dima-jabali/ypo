import type { Editor as MonacoEditor, useMonaco } from "@monaco-editor/react";
import type { editor as MonacoEditorType } from "monaco-editor";
import type { ComponentProps } from "react";

export type MonacoType = NonNullable<ReturnType<typeof useMonaco>>;

export const AUTOCOMPLETE_TRIGGER_TIMER = 300;
export const FONT_FAMILY = "JetBrains Mono";

type DiffEditorOptions = NonNullable<Parameters<MonacoType["editor"]["createDiffEditor"]>[1]>;

type EditorOptions = NonNullable<ComponentProps<typeof MonacoEditor>["options"]>;

export const MONACO_EDITOR_RESIZER_ENABLE_CONTAINER = {
  bottomRight: false,
  bottomLeft: false,
  topRight: false,
  topLeft: false,
  right: false,
  bottom: true,
  left: false,
  top: false,
};

export const NORMAL_EDITOR_PATH_FIRST_PART = "normal-";

export const HANDLE_CLASSES_CONTAINER = {
  bottom: "button-hover z-0 h-1.5!",
};

export const VERIFY_SQL_QUERY_EDITOR_OPTIONS: MonacoEditorType.IStandaloneEditorConstructionOptions =
  {
    lineDecorationsWidth: 1,
    lineNumbersMinChars: 0,
    readOnly: true,
    minimap: {
      enabled: false,
    },
  };

export const MONACO_EDITOR_OPTIONS: EditorOptions = {
  quickSuggestionsDelay: AUTOCOMPLETE_TRIGGER_TIMER,
  wordBasedSuggestionsOnlySameLanguage: false,
  acceptSuggestionOnCommitCharacter: false,
  wordBasedSuggestions: "currentDocument",
  renderLineHighlightOnlyWhenFocus: true,
  occurrencesHighlight: "singleFile",
  maxTokenizationLineLength: 2_000,
  acceptSuggestionOnEnter: "off",
  showFoldingControls: "always",
  stopRenderingLineAfter: 1_000,
  emptySelectionClipboard: true,
  fixedOverflowWidgets: true,
  quickSuggestions: false,
  fontFamily: FONT_FAMILY,
  roundedSelection: false,
  lineNumbersMinChars: 3,
  automaticLayout: true,
  showDeprecated: true,
  fontVariations: true,
  fontLigatures: true,
  tabCompletion: "on",
  showUnused: true,
  codeLens: false,
  wordWrap: "on",
  fontSize: 12,
  tabSize: 2,
  unicodeHighlight: {
    invisibleCharacters: true,
    ambiguousCharacters: true,
    includeComments: true,
    includeStrings: true,
  },
  suggest: {
    shareSuggestSelections: false,
    matchOnWordStartOnly: false,
    showStatusBar: true,
    showColors: true,
  },
  stickyScroll: {
    enabled: true,
  },
  minimap: {
    enabled: false,
  },
};

export const MONACO_DIFF_EDITOR_OPTIONS: DiffEditorOptions = {
  extraEditorClassName: "h-full min-h-52 w-full min-w-full",
  useInlineViewWhenSpaceIsLimited: false,
  renderSideBySideInlineBreakpoint: 0,
  onlyShowAccessibleDiffViewer: false, // This has to be false to render side by side.
  enableSplitViewResizing: false,
  fontFamily: FONT_FAMILY,
  renderWhitespace: "all",
  renderSideBySide: true,
  originalEditable: true,
  fontLigatures: true,

  acceptSuggestionOnCommitCharacter: false,
  renderLineHighlightOnlyWhenFocus: false,
  occurrencesHighlight: "singleFile",
  acceptSuggestionOnEnter: "off",
  showFoldingControls: "always",
  stopRenderingLineAfter: 1_000,
  emptySelectionClipboard: true,
  ignoreTrimWhitespace: true,
  fixedOverflowWidgets: true,
  quickSuggestions: false,
  roundedSelection: false,
  lineNumbersMinChars: 3,
  automaticLayout: true,
  showDeprecated: true,
  fontVariations: true,
  tabCompletion: "on",
  diffWordWrap: "on",
  showUnused: true,
  codeLens: false,
  wordWrap: "on",
  fontSize: 12,
  unicodeHighlight: {
    invisibleCharacters: true,
    ambiguousCharacters: true,
    includeComments: true,
    includeStrings: true,
  },
  stickyScroll: {
    enabled: true,
  },
  minimap: {
    enabled: false,
  },
};
