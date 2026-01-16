import { Editor as MonacoEditor, useMonaco } from "@monaco-editor/react";
import { ClipboardIcon, Expand, Minus } from "lucide-react";
import type { ISelection, editor as MonacoEditorType } from "monaco-editor";
import { useEffect, useLayoutEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/Avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "#/components/HoverCard";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { useFetchAllDatabaseConnections } from "#/hooks/fetch/use-fetch-all-database-connections";
import { ColorScheme } from "#/types/general";
import type { BlockSql, NotebookBlock, SimilarQuery } from "#/types/notebook";
import {
  getDbInfoJSX,
  getDbState,
  getQueryDescription,
  getQueryRunCount,
  getUserInfo,
  handleCopyCodeToClipboard,
  matchQueryTag,
  NICE_QUERY_ENTITY_NAME,
  QueryState,
  SEARCH_FOR_MATCHES_ON_ALL_BLOCKS,
} from "./helper-jsxs";
import { SIMILAR_QUERY_EDITOR_OPTIONS } from "./helpers";
import { ThreeDotsPopover } from "./three-dots-popover";
import { shortDateFormatter } from "#/helpers/utils";

const LANGS = {
  python_query: "python",
  python_code: "python",
  sql_query: "sql",
} as const;

type Props = {
  overlapValuesRef: React.RefObject<Map<string, number>>;
  shouldExpandAll: { shouldExpandAll: boolean };
  query: SimilarQuery["query"];
  block: NotebookBlock;
  relevance: number;
};

const SIMILAR_QUERY_EDITOR_PATH_FIRST_PART = "similar-query=";
const LIMIT_RESULT_COUNT: number | undefined = undefined;
const WORD_SEPARATORS: string | null = null;
const SEARCH_ONLY_EDITABLE_RANGE = false;
const SPACE_REGEX = /[ \t\n]/g;
const CAPTURE_MATCHES = false;
const MATCH_CASE = false;
const IS_REGEX = false;

export function RelevantQueryCard({
  overlapValuesRef,
  shouldExpandAll,
  relevance,
  block,
  query,
}: Props) {
  const [monacoEditor, setMonacoEditor] = useState<MonacoEditorType.IStandaloneCodeEditor>();
  const [isExpanded, setIsExpanded] = useState(shouldExpandAll.shouldExpandAll);
  const [numberOfMatches, setNumberOfMatches] = useState<number | null>(null);
  const [overlap, setOverlap] = useState<number | null>(null);

  const searchTextForSimilarQueries = generalContextStore.use.searchTextForSimilarQueries();
  const { allDatabaseConnections } = useFetchAllDatabaseConnections().data;
  const colorScheme = generalContextStore.use.colorScheme();
  const monaco = useMonaco();

  // Using useState without a setter because we only need to set
  // these values once on the first render. :)
  const [
    {
      threeDotsPopoverJSX,
      databaseInfoJSX,
      hasDescription,
      verifiedByJSX,
      description,
      runCountJSX,
      verifiedOn,
      stateJSX,
      tag,
      copyCodeToClipboard,
    },
    // eslint-disable-next-line react-hooks/refs
  ] = useState(() => {
    calcOverlap: {
      // Calc how much of the similar query overlaps against the original query:

      // Casting here because similar queries can only be on sql blocks for now:
      const blockQuery = (block as BlockSql).custom_block_info?.query;
      const similarQuery = query.answer;

      if (!(blockQuery && similarQuery)) {
        console.info("Either blockQuery or similarQuery is empty! Not calculating overlap.");

        break calcOverlap;
      }

      const wordsOnSimilarQuery = similarQuery
        .split(SPACE_REGEX)
        .filter((word) => word !== "")
        .map((str) => str.toLowerCase());
      const wordsOnOriginalQuery = blockQuery
        .split(SPACE_REGEX)
        .filter((word) => word !== "")
        .map((str) => str.toLowerCase());

      const theOneThatHasMoreWords =
        wordsOnOriginalQuery.length > wordsOnSimilarQuery.length
          ? wordsOnOriginalQuery
          : wordsOnSimilarQuery;
      const theOtherOne =
        theOneThatHasMoreWords === wordsOnOriginalQuery
          ? wordsOnSimilarQuery
          : wordsOnOriginalQuery;

      let overlap = 0;

      for (let i = 0; i < theOneThatHasMoreWords.length; ++i) {
        if (theOtherOne[i] === theOneThatHasMoreWords[i]) {
          overlap += 1;
        }
      }

      setOverlap((overlap / theOneThatHasMoreWords.length) * 100);

      overlapValuesRef.current.set(query.query_uuid, overlap);
    }

    const userInfo = getUserInfo(query);

    // Verified by:
    const verifiedByJSX = userInfo ? (
      <HoverCard>
        <HoverCardTrigger className="font-bold text-link onfocus:underline">
          {userInfo.firstNameOrEmail}
        </HoverCardTrigger>

        <HoverCardContent
          className="flex min-w-60 items-center justify-center gap-4 border-border-smooth"
          side="top"
        >
          <Avatar className="mr-1 size-10" title={userInfo.fullName}>
            <AvatarImage src={userInfo.imgUrl} />

            <AvatarFallback>{userInfo.fullName[0]}</AvatarFallback>
          </Avatar>

          <div className="flex items-end gap-4">
            <div className="flex flex-col items-start justify-between">
              <h4 className="text-sm font-bold">{userInfo.fullName}</h4>

              <p className="text-sm">{userInfo.email.toLocaleLowerCase()}</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    ) : null;

    // More options:
    const threeDotsPopoverJSX = (
      <ThreeDotsPopover blockUUID={block.uuid} userInfo={userInfo} query={query} />
    );

    // Description:
    const description = getQueryDescription(query);
    const hasDescription = Boolean(description);

    // Run count:
    let runCountJSX;
    {
      const runCount = getQueryRunCount(query);

      if (Number.isFinite(runCount)) {
        // Using `!` here cause the check above garantees it's a number:
        const plural = runCount! > 1 ? "s" : "";

        runCountJSX = (
          <span
            className="min-h-5 rounded-sm bg-accent/50 px-1 text-xs font-bold tabular-nums leading-5 tracking-wider text-purple-200"
            title={`This query was run ${runCount} time${plural}`}
          >
            {runCount} run
            {plural}
          </span>
        );
      }
    }

    // Query state:
    let stateJSX;
    {
      const dbState = getDbState(query);

      if (dbState) {
        stateJSX = (
          <span
            className="h-5 rounded-sm bg-red-700/60 px-2 text-xs font-bold tabular-nums leading-5 tracking-wider text-red-300 data-[is-active=true]:bg-green-700/60 data-[is-active=true]:text-green-300"
            title={`This query is marked as ${
              dbState === QueryState.ACTIVE ? "active" : "deleted"
            } on ${NICE_QUERY_ENTITY_NAME[query.entity_type]}`}
            data-is-active={dbState === QueryState.ACTIVE}
          >
            {dbState}
          </span>
        );
      }
    }

    // Verified on:
    const verifiedOn = query.updated_at
      ? shortDateFormatter.format(new Date(query.updated_at))
      : undefined;

    return {
      databaseInfoJSX: getDbInfoJSX(query, allDatabaseConnections),
      tag: matchQueryTag(query),
      threeDotsPopoverJSX,
      hasDescription,
      verifiedByJSX,
      runCountJSX,
      description,
      verifiedOn,
      stateJSX,
      copyCodeToClipboard: () => handleCopyCodeToClipboard(query),
    };
  });

  useLayoutEffect(() => {
    setIsExpanded(shouldExpandAll.shouldExpandAll);
  }, [shouldExpandAll]);

  /** Search for `searchTextForSimilarQueries.value` and highlight all instances. */
  useEffect(() => {
    if (
      !(
        searchTextForSimilarQueries?.blockUUID &&
        monacoEditor &&
        monaco &&
        (searchTextForSimilarQueries.blockUUID === SEARCH_FOR_MATCHES_ON_ALL_BLOCKS ||
          searchTextForSimilarQueries.blockUUID === block.uuid)
      )
    )
      return;

    if (searchTextForSimilarQueries.value === "") {
      // This means that we should clear possible previous selections:
      monacoEditor.setSelection(new monaco.Selection(0, 0, 0, 0));

      setNumberOfMatches(null);

      return;
    }

    const model = monacoEditor.getModel();

    if (!model) return;

    const ranges = model.findMatches(
      searchTextForSimilarQueries.value,
      SEARCH_ONLY_EDITABLE_RANGE,
      IS_REGEX,
      MATCH_CASE,
      WORD_SEPARATORS,
      CAPTURE_MATCHES,
      LIMIT_RESULT_COUNT,
    );

    setNumberOfMatches(ranges.length);

    if (ranges.length === 0) {
      // Clear possible previous selections:
      monacoEditor.setSelection(new monaco.Selection(0, 0, 0, 0));

      return;
    }

    const selections: ISelection[] = ranges.map((r) => {
      const endPosition = r.range.getEndPosition();

      return new monaco.Selection(
        r.range.startLineNumber,
        r.range.startColumn,
        endPosition.lineNumber,
        endPosition.column,
      );
    });

    monacoEditor.setSelections(selections);
  }, [monacoEditor, searchTextForSimilarQueries, monaco, block]);

  return (
    <article
      className="relative grid w-full overflow-hidden rounded-lg border border-transparent transition-all
				data-[is-expanded=false]:h-40 data-[is-expanded=false]:grid-rows-[auto_auto_1fr] 
				data-[is-expanded=true]:h-[500px] data-[is-expanded=true]:grid-rows-[1fr_1fr_auto]
				data-[has-matches=true]:border-accent data-[is-expanded=true]:data-[has-matches=false]:border-border-smooth data-[is-expanded=true]:bg-gray-900/20"
      data-has-matches={Boolean(numberOfMatches)}
      data-is-expanded={isExpanded}
    >
      {/* Top Cell: Header + Description */}
      <div className="flex flex-col overflow-hidden p-1">
        <header className="flex min-h-8 w-full items-start justify-between gap-2">
          <div className="flex items-center gap-3 p-0.5 pb-0 text-xs tabular-nums tracking-wide text-primary">
            {tag}
            <div className="flex flex-col">
              <p>Relevance: {Math.trunc(relevance * 100)}%</p>
              {overlap !== null ? <p>Overlap: {overlap.toFixed(0)}%</p> : null}
            </div>
            {numberOfMatches !== null && (
              <>
                <div className="h-5 w-[1px] flex-none bg-gray-500" />
                <p>{numberOfMatches} matches</p>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-3">
            {runCountJSX}
            <button
              className="flex aspect-square p-1 items-center justify-center rounded-sm button-hover"
              onClick={() => setIsExpanded((prev) => !prev)}
              title={isExpanded ? "Minimize" : "Expand"}
            >
              {isExpanded ? (
                <Minus className="size-3 stroke-1 fill-primary" />
              ) : (
                <Expand className="size-3 stroke-1 fill-primary" />
              )}
            </button>
          </div>
        </header>

        {hasDescription && (
          <div
            className={`shadow-on-scroll-y simple-scrollbar px-2 text-sm text-primary transition-all
						${isExpanded ? "mt-2 grow overflow-y-auto" : "line-clamp-3 max-h-[3.75rem]"}`}
          >
            {description}
          </div>
        )}
      </div>

      {/* Middle Cell: Monaco Editor */}
      <div className="min-h-10 overflow-hidden">
        <MonacoEditor
          theme={colorScheme === ColorScheme.dark ? "vs-dark" : "vs-light"}
          path={`${SIMILAR_QUERY_EDITOR_PATH_FIRST_PART}${query.id}`} // Using this to reuse the model that will be created.
          language={LANGS[query.collection_id] || LANGS.sql_query}
          onMount={(editor) => setMonacoEditor(editor)}
          className="flex min-h-[128px] flex-[1_1_33%]"
          options={SIMILAR_QUERY_EDITOR_OPTIONS}
          value={query.answer}
          keepCurrentModel // Needed so Monaco does not disposes of the model when we close the tab.
        />
      </div>

      {/* Bottom Cell: Metadata Section (Only visible when expanded) */}
      {isExpanded ? (
        <section className="flex flex-col gap-3 overflow-y-auto px-2 pb-3 pt-2 text-sm tracking-wider">
          <header className="flex w-full items-center justify-between">
            <button
              className="flex items-center justify-center rounded-sm p-1 button-hover"
              onClick={copyCodeToClipboard}
              title="Copy code"
            >
              <ClipboardIcon className="size-5" />
            </button>

            <div className="flex items-center justify-center gap-2">
              {stateJSX}
              {threeDotsPopoverJSX}
            </div>
          </header>

          <ul className="flex flex-col items-start justify-center gap-2 text-xs">
            {verifiedOn && (
              <li>
                Verified on: <span className="tabular-nums">{verifiedOn}</span>
                {verifiedByJSX && <>, by&nbsp;{verifiedByJSX}</>}
              </li>
            )}
            {databaseInfoJSX}
          </ul>
        </section>
      ) : (
        /* Empty div to satisfy the 3rd row of the grid when collapsed */
        <div className="h-0" />
      )}

      {/* Linear gradient overlay when minimized */}
      {!isExpanded && (
        <span className="pointer-events-none absolute inset-0 top-28 block bg-linear-to-b from-transparent to-black/50" />
      )}
    </article>
  );
}
