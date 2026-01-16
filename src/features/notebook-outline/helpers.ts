import type { editor as MonacoEditorType } from "monaco-editor";

import type { SortOrder } from "#/components/Tables/TableMaker/filters/utilityTypes";
import type { NotebookBlock, NotebookBlockUuid, SimilarQuery } from "#/types/notebook";
import { QueryEntityType } from "#/types/post-block-update-types";

export type SortedSimilarQueryToShow = {
  similarQueries: SimilarQuery[];
  block: NotebookBlock;
} | null;

export const SIMILAR_QUERIES_FILTER = {
  "Mode Definition": QueryEntityType.MODE_DEFINITION,
  Metabase: QueryEntityType.METABASE_CARD,
  BetterBrain: QueryEntityType.SQL_QUERY,
  Mode: QueryEntityType.MODE_QUERY,
  All: "All",
};

export enum SortBy {
  Relevance = "Relevance",
  Overlap = "Overlap",
}

export type Sort = {
  order: SortOrder;
  sortBy: SortBy;
};

export type Filters = keyof typeof SIMILAR_QUERIES_FILTER;

export const SIMILAR_QUERIES_FILTERS = Object.keys(SIMILAR_QUERIES_FILTER) as Filters[];
export const TIME_TO_SEARCH_FOR_MATCHES = 500;

export const SIMILAR_QUERY_EDITOR_OPTIONS: MonacoEditorType.IStandaloneEditorConstructionOptions = {
  inlineSuggest: { enabled: false },
  maxTokenizationLineLength: 1_000,
  definitionLinkOpensInPeek: true,
  stickyScroll: { enabled: true },
  padding: { bottom: 0, top: 0 },
  // @ts-expect-error => This uses an enum that is not exported by the library:
  lightbulb: { enabled: "off" },
  emptySelectionClipboard: true,
  showFoldingControls: "never",
  fontFamily: "JetBrains Mono",
  minimap: { enabled: false },
  stopRenderingLineAfter: 500,
  overviewRulerBorder: false,
  selectOnLineNumbers: true,
  detectIndentation: false,
  cursorBlinking: "solid",
  quickSuggestions: false,
  roundedSelection: false,
  lineNumbersMinChars: 0,
  automaticLayout: true,
  showDeprecated: false,
  fontLigatures: true,
  tabFocusMode: false,
  glyphMargin: false,
  contextmenu: false,
  lineNumbers: "off",
  domReadOnly: true,
  codeLens: false,
  folding: false,
  readOnly: true,
  wordWrap: "on",
  fontSize: 11,
  tabSize: 2,
  scrollbar: {
    horizontalScrollbarSize: 5,
    verticalScrollbarSize: 5,
    useShadows: false,
  },
};

export function scrollBlockIntoView(blockUUID: NotebookBlockUuid) {
  const el = document.getElementById(blockUUID);

  el?.scrollIntoView({
    behavior: "instant",
    block: "start", // vertical align
    // inline: 'start', // horizontal align
  });
}
