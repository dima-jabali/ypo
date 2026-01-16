import { ChevronRightIcon, CornerDownLeft, PlayIcon } from "lucide-react";
import { lazy, useMemo } from "react";

import { DEFAULT_FILTERS } from "#/components/Tables/TableMaker/filters/filters";
import { Table } from "#/components/Tables/TableMaker/Table";
import type { TableDataType } from "#/components/Tables/TableMaker/tableDataContext";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { NORMAL_EDITOR_PATH_FIRST_PART } from "#/helpers/monaco-editor";
import { useIsStreaming } from "#/hooks/fetch/use-fetch-bot-conversation";
import { useIsFixingSql } from "#/hooks/mutation/use-fix-sql";
import { useRunCsv } from "#/hooks/mutation/use-run-csv";
import { useRunPython } from "#/hooks/mutation/use-run-python";
import { useRunSql } from "#/hooks/mutation/use-run-sql";
import { ColorScheme } from "#/types/general";
import {
  BlockType,
  type BlockCsv,
  type BlockPython,
  type BlockSql,
  type NotebookBlock,
} from "#/types/notebook";
import { scrollBlockIntoView, SIMILAR_QUERY_EDITOR_OPTIONS } from "./helpers";
import { Loader } from "#/components/Loader";

const MonacoEditor = lazy(async () => ({
  default: (await import("@monaco-editor/react")).Editor,
}));

export type BlockProps = React.PropsWithChildren<{
  projectBlock: NotebookBlock;
  showSimilarQueries: (block: NotebookBlock) => void;
}>;

const MIN_NUMBER_OF_ROWS_FOR_OUTLINE = 4;

function getBlockJSX({
  projectBlock,
  colorScheme,
}: {
  colorScheme: keyof typeof ColorScheme;
  projectBlock: NotebookBlock;
}) {
  switch (projectBlock.type) {
    case "text" as BlockType:
    case BlockType.Chart:
    case BlockType.Text:
      return null;

    case BlockType.Python: {
      const pythonCode = (projectBlock as BlockPython).custom_block_info?.code;

      return pythonCode ? (
        <MonacoEditor
          theme={colorScheme === ColorScheme.dark ? "vs-dark" : "vs-light"}
          path={`${NORMAL_EDITOR_PATH_FIRST_PART}${projectBlock.uuid}`} // Using this to reuse the model that is already created on the notebook.
          className="h-24 w-full overflow-clip px-3 pt-2"
          options={SIMILAR_QUERY_EDITOR_OPTIONS}
          value={pythonCode}
          language="python"
          keepCurrentModel // Needed so Monaco does not disposes of the model when we close the tab.
        />
      ) : null;
    }

    // Casting here cause they might be these strings (lowercase):
    case "sql" as BlockType: // Workaround for legacy projects
    case BlockType.Sql:
    case BlockType.Csv: {
      const sqlCode = (projectBlock as BlockSql).custom_block_info?.query;

      const editor = sqlCode ? (
        <MonacoEditor
          theme={colorScheme === ColorScheme.dark ? "vs-dark" : "vs-light"}
          path={`${NORMAL_EDITOR_PATH_FIRST_PART}${projectBlock.uuid}`} // Using this to reuse the model that is already created on the notebook.
          options={SIMILAR_QUERY_EDITOR_OPTIONS}
          className="h-24 w-full"
          keepCurrentModel // Needed so Monaco does not disposes of the model when we close the tab.
          value={sqlCode}
          language="sql"
        />
      ) : null;

      const dataPreview = (projectBlock as BlockSql | BlockCsv).custom_block_info?.data_preview;

      const table =
        dataPreview &&
        !("error" in dataPreview) &&
        dataPreview.data &&
        Array.isArray(dataPreview.data) &&
        dataPreview.data.length > 0
          ? (() => {
              const dataToUse = (() => {
                if (dataPreview.data.length > MIN_NUMBER_OF_ROWS_FOR_OUTLINE) {
                  return dataPreview.data.slice(0, MIN_NUMBER_OF_ROWS_FOR_OUTLINE);
                }

                return dataPreview.data;
              })();

              const tableMapData = new Map(dataToUse.entries()) as TableDataType["allData"];

              return (
                <Table.Root
                  className="pointer-events-none! h-[100px] min-w-full overflow-hidden group-data-[is-outline-block-active=true]:border-blue-500/60 border border-border-smooth [&*]:overflow-hidden!"
                  numberOfRowsPerPage={MIN_NUMBER_OF_ROWS_FOR_OUTLINE}
                  totalNumberOfRows={MIN_NUMBER_OF_ROWS_FOR_OUTLINE}
                  dataComesFromDataPreview
                  allData={tableMapData}
                  isFetchingData={false}
                  initialPageNumber={1}
                  isNewSource={false}
                  canScroll={false}
                >
                  <Table.Data />
                </Table.Root>
              );
            })()
          : null;

      return table || editor ? (
        <div className="flex h-fit w-full flex-col gap-2 overflow-x-clip px-3 pt-1">
          {editor}

          {table && editor ? (
            <div className="flex h-[2px] w-full bg-white/10 px-3 group-data-[is-outline-block-active=true]:bg-blue-500/50" />
          ) : null}

          {table}
        </div>
      ) : null;
    }

    default:
      console.log("Block type without JSX switch case", { projectBlock });

      return null;
  }
}

const DEFAULT_WRITE_VARS: NonNullable<BlockProps["projectBlock"]["write_variables"]> = [];

export function Block({ projectBlock, children, showSimilarQueries }: BlockProps) {
  const colorScheme = generalContextStore.use.colorScheme();
  const isFixingSql = useIsFixingSql(projectBlock.uuid);
  const runPython = useRunPython(projectBlock.uuid);
  const runSql = useRunSql(projectBlock.uuid);
  const runCsv = useRunCsv(projectBlock.uuid);
  const isStreaming = useIsStreaming();

  const isRunningBlock = runPython.isPending || runCsv.isPending || runSql.isPending;
  const hasSimilarQueries = projectBlock.similar_queries.length > 0;
  const jsx = getBlockJSX({ projectBlock, colorScheme });
  const isExecutable = !isStreaming && !isFixingSql;

  const variables = useMemo(() => {
    if (!jsx) return DEFAULT_WRITE_VARS;

    return projectBlock.write_variables || DEFAULT_WRITE_VARS;
  }, [jsx, projectBlock.write_variables]);

  if (!jsx) return null;

  function handleRunBlock(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();

    scrollBlockIntoView(projectBlock.uuid);

    if (isExecutable) {
      if (isRunningBlock) return;

      switch (projectBlock.type) {
        case BlockType.Sql: {
          runSql.mutate({
            action_info: {
              filters: projectBlock.custom_block_info?.filters || DEFAULT_FILTERS,
              sql: projectBlock.custom_block_info?.query || "",
              limit: 10,
              offset: 0,
            },
          });

          break;
        }

        case BlockType.Csv: {
          runCsv.mutate({
            action_info: {
              filters: projectBlock.custom_block_info?.filters || DEFAULT_FILTERS,
              limit: 10,
              offset: 0,
            },
          });

          break;
        }

        case BlockType.Python: {
          runPython.mutate({
            action_info: {
              code: projectBlock.custom_block_info?.code || "",
            },
          });

          break;
        }

        default: {
          toast({
            description: `We are not currently able to run blocks of type "${projectBlock.type}" through here.`,
            title: "Can't run this type of block",
            variant: ToastVariant.Destructive,
          });

          break;
        }
      }
    }
  }

  return (
    <div
      className="py-2 hover:bg-link/10 active:bg-link/20"
      onClick={() => scrollBlockIntoView(projectBlock.uuid)}
    >
      <div className="group flex h-max w-full cursor-pointer flex-col gap-1 outline-hidden">
        <div className="flex h-fit w-full flex-col items-center gap-1 truncate px-3 text-sm font-bold text-primary group-data-[is-outline-block-active=true]:text-link">
          <div className="flex w-full items-center justify-between">
            <button
              className="button-hover disabled:cursor-not-allowed flex items-center justify-center gap-1 rounded-sm p-1"
              onClick={handleRunBlock}
              disabled={!isExecutable}
              title="Run block"
            >
              {isRunningBlock ? (
                <Loader className="size-4" />
              ) : (
                <PlayIcon className="stroke-primary stroke-1 size-4" />
              )}
            </button>

            {hasSimilarQueries ? (
              <button
                className="button-hover flex items-center justify-center gap-1 rounded-full py-1 px-2 pr-0 text-xs"
                onClick={() => showSimilarQueries(projectBlock)}
                title="Similar queries to this one"
              >
                <p>Similar queries</p>

                <ChevronRightIcon className="size-4 stroke-primary stroke-1" />
              </button>
            ) : null}
          </div>

          <div className="flex h-[2px] w-full bg-white/10 px-3 group-data-[is-outline-block-active=true]:bg-blue-500/50" />

          {children ? (
            <div className="ml-4 flex items-center justify-between text-sm font-normal">
              {children}
            </div>
          ) : null}
        </div>

        {jsx}
      </div>

      <div className="ml-3 mt-3 flex flex-wrap gap-2">
        <CornerDownLeft className="size-4 transform-[scale(1,-1)] rotate-180 stroke-primary flex-none" />

        {variables.map(({ name }) => (
          <span
            className="h-full cursor-text select-text overflow-hidden text-ellipsis whitespace-nowrap rounded-xs bg-green-800 px-1 font-mono text-xs font-bold tabular-nums text-green-400 outline-hidden"
            title={name}
            key={name}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
