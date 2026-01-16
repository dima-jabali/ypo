import { ChevronDown, Forward } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";

import { Table } from "#/components/Tables/TableMaker/Table";
import { BlockStoreProvider, useBlockStore } from "#/contexts/block-context";
import {
  generalContextStore,
  useWithBotConversationId,
  useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import { handleDataPreview, ZERO_RESULTS_KERNEL_RESULTS } from "#/helpers/blocks";
import { createISODate, getErrorMessage, isValidNumber, noop } from "#/helpers/utils";
import { useFetchAllDatabaseConnections } from "#/hooks/fetch/use-fetch-all-database-connections";
import { useIsStreaming } from "#/hooks/fetch/use-fetch-bot-conversation";
import { useDownloadedNotebookId } from "#/hooks/fetch/use-fetch-notebook";
import { useAskToGenerateSqlCode } from "#/hooks/mutation/use-ask-to-generate-sql-code";
import { useIsFixingSql } from "#/hooks/mutation/use-fix-sql";
import { usePatchNotebookBlocks } from "#/hooks/mutation/use-patch-notebook-blocks";
import { useRunSql } from "#/hooks/mutation/use-run-sql";
import type { NormalDatabaseConnection } from "#/types/databases";
import {
  DataFrameDatabaseConnection,
  KernelResultsTypes,
  NotebookActionType,
  SqlBlockSourceType,
  UpdateBlockActionKey,
  type BlockSql,
  type KernelResult,
} from "#/types/notebook";
import { LOADER } from "../Button";
import { CodeOutput } from "../code-output";
import { DatabaseConnectionsModal } from "../database-connections-modal";
import { DeleteBlockFloatingButton } from "../delete-block-floating-button";
import { DiffOrNormalEditor } from "../monaco-editor/diff-or-normal-editor";
import { RunArrow } from "../run-arrow";
import { DEFAULT_FILTERS } from "../Tables/TableMaker/filters/filters";
import { useTableHelper } from "../Tables/TableMaker/useTableHelper";
import { TipsPopover } from "../tips-popover";
import { AddBlockBelowButton } from "./add-block-below-button";
import { WriteVariable } from "./write-variable";

type Props = {
  sqlBlock: BlockSql;
};

export const SqlBlock = memo(function SqlBlockWithProviders(props: Props) {
  return (
    <BlockStoreProvider
      extraInitialParams={{
        blockFilterAndSort: props.sqlBlock.custom_block_info?.filters || DEFAULT_FILTERS,
        blockUuid: props.sqlBlock.uuid,
        blockType: props.sqlBlock.type,
      }}
    >
      <SqlBlockWithContexts {...props} />
    </BlockStoreProvider>
  );
});

function SqlBlockWithContexts({ sqlBlock }: Props) {
  const query = sqlBlock.custom_block_info?.query ?? "";
  const blockUuid = sqlBlock.uuid;

  const [blockFilterAndSort, setBlockFilterAndSort] = useState(
    sqlBlock.custom_block_info?.filters ?? DEFAULT_FILTERS,
  );
  const [shouldShowCodeEditor, setShouldShowCodeEditor] = useState(false);
  const [hasAnyDataToShowUser, setHasAnyDataToShowUser] = useState(false);
  const [isEditorEmpty, setIsEditorEmpty] = useState(!query.trim());
  const [hasDataForTable, setHasDataForTable] = useState(false);

  const changeSqlCodeTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const commandTextareaValueRef = useRef(query);

  const canEditCodeInChatMode = generalContextStore.use.allowEditingCodeInChatMode();
  const shouldShowCodeInChatModeFromSettings = generalContextStore.use.showCodeInChatMode();
  const normalDatabases = useFetchAllDatabaseConnections().data.normalDatabases;
  const isNotebookMode = generalContextStore.use.isNotebookMode();
  const isChatMode = generalContextStore.use.isChatMode();
  const askToGenerateSqlCode = useAskToGenerateSqlCode();
  const botConversationId = useWithBotConversationId();
  const patchNotebookBlocks = usePatchNotebookBlocks();
  const organizationId = useWithOrganizationId();
  const isFixingSql = useIsFixingSql(blockUuid);
  const notebookId = useDownloadedNotebookId();
  const isStreaming = useIsStreaming();
  const runSql = useRunSql(blockUuid);
  const blockStore = useBlockStore();
  const monacoEditor = blockStore.use.monacoEditor();

  const isBlockRunning = runSql.isPending || sqlBlock.is_running;
  const errorFromDataPreview =
    sqlBlock?.custom_block_info?.data_preview && "error" in sqlBlock.custom_block_info.data_preview
      ? sqlBlock.custom_block_info.data_preview.error
      : null;
  const isDataPreviewStale = sqlBlock?.custom_block_info?.is_data_preview_stale || false;
  const dataPreview = sqlBlock.custom_block_info?.data_preview;
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
    setIsFetchingData,
    setIsNewSource,
    paginate,
  } = useTableHelper(sqlBlock.uuid, dataPreviewLength);

  // On first mount, we should show the data preview if available.
  // But if on chat mode, the data preview should show whenever it
  // is updated.
  useEffect(() => {
    if (errorFromDataPreview) {
      blockStore.setState({
        kernelResults: [{ type: KernelResultsTypes.ERROR, value: errorFromDataPreview }],
      });
      setHasAnyDataToShowUser(true);
      setHasDataForTable(false);
    } else if (dataPreview && !("error" in dataPreview)) {
      handleDataPreview({
        dataPreview,
        setKernelResults: (kernelResults: Array<KernelResult>) =>
          blockStore.setState({ kernelResults }),
        putSavedDataInTheTable,
      });

      setHasAnyDataToShowUser(true);
      setHasDataForTable(true);
    }
  }, [errorFromDataPreview, dataPreview, putSavedDataInTheTable, blockStore]);

  // Update the editor value when the block changes
  useEffect(() => {
    if (!monacoEditor) return;

    const editorValue = monacoEditor.getValue();

    if (typeof query === "string" && editorValue !== query) {
      monacoEditor.setValue(query);

      monacoEditor.revealLine(monacoEditor.getModel()?.getLineCount() ?? 0);
    }
  }, [query, monacoEditor]);

  async function handleExecuteSql() {
    if (isBlockRunning || !monacoEditor) return;

    blockStore.setState({ kernelResults: [] });
    setIsFetchingData(true);

    try {
      const sqlCode = monacoEditor.getValue();

      if (sqlCode === undefined) {
        throw new Error("SQL code is undefined. This should not happen.");
      }

      await patchNotebookBlocks.mutateAsync({
        timestamp: createISODate(),
        botConversationId,
        organizationId,
        notebookId,
        updates: [
          {
            action_type: NotebookActionType.UpdateBlock,
            action_info: {
              key: UpdateBlockActionKey.Query,
              block_uuid: sqlBlock.uuid,
              value: sqlCode,
            },
          },
        ],
      });

      const res = await runSql.mutateAsync({
        action_info: {
          filters: sqlBlock.custom_block_info?.filters || DEFAULT_FILTERS,
          limit: numberOfRowsPerPage > 1 ? numberOfRowsPerPage : 10,
          sql: sqlCode,
          offset: 0,
        },
      });

      const { data, num_rows } = res.action_output;

      // Workaround for when the data is missing, usually because of errors
      if (data) {
        const hasRows = data.length > 0 && num_rows > 0;

        setHasAnyDataToShowUser(true);
        setHasDataForTable(hasRows);

        if (hasRows) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          putNewDataInTableFromNewSource(data as any[], num_rows);
        } else {
          blockStore.setState({ kernelResults: ZERO_RESULTS_KERNEL_RESULTS });
        }
      }
    } catch (error) {
      setHasAnyDataToShowUser(true);
      setHasDataForTable(false);

      blockStore.setState({
        kernelResults: [
          {
            value: getErrorMessage(error) ?? "See console for more information.",
            type: KernelResultsTypes.ERROR,
          },
        ],
      });
    } finally {
      setIsFetchingData(false);
    }
  }

  function handleToggleShowCode() {
    setShouldShowCodeEditor((prev) => !prev);
  }

  function handleAskForBackendToGenerateSqlCode() {
    if (askToGenerateSqlCode.isPending || !monacoEditor) return;

    askToGenerateSqlCode
      .mutateAsync({
        blockUuid: sqlBlock.uuid,
        action_info: {
          old_query: monacoEditor.getValue() ?? query ?? "",
          prompt: commandTextareaValueRef.current,
        },
      })
      .then((res) => {
        patchNotebookBlocks.mutate({
          timestamp: createISODate(),
          botConversationId,
          organizationId,
          notebookId,
          updates: [
            {
              action_type: NotebookActionType.UpdateBlock,
              action_info: {
                key: UpdateBlockActionKey.Query,
                value: res.action_output.sql,
                block_uuid: sqlBlock.uuid,
              },
            },
          ],
        });
      })
      .catch(noop);
  }

  function handleChangeCommand(event: React.ChangeEvent<HTMLTextAreaElement>) {
    commandTextareaValueRef.current = event.target.value;
  }

  function handleAskAiOnEnter(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      handleAskForBackendToGenerateSqlCode();
    }
  }

  function handleSqlCodeChange(newString = "") {
    setIsEditorEmpty(!newString.trim());

    clearTimeout(changeSqlCodeTimerRef.current);

    changeSqlCodeTimerRef.current = setTimeout(() => {
      patchNotebookBlocks.mutate({
        timestamp: createISODate(),
        botConversationId,
        organizationId,
        notebookId,
        updates: [
          {
            action_type: NotebookActionType.UpdateBlock,
            action_info: {
              key: UpdateBlockActionKey.Query,
              block_uuid: sqlBlock.uuid,
              value: newString,
            },
          },
        ],
      });
    }, 2_000);
  }

  const blockSourceIntegrationId = sqlBlock.custom_block_info?.source_integration?.id;
  const selectedDatabase =
    sqlBlock.custom_block_info?.source_type === SqlBlockSourceType.Dataframes
      ? DataFrameDatabaseConnection
      : isValidNumber(blockSourceIntegrationId)
        ? (normalDatabases.find((db) => db.id === blockSourceIntegrationId) ?? normalDatabases[0])
        : normalDatabases[0];

  const canRunBlock = Boolean(
    (selectedDatabase?.is_executable ||
      selectedDatabase?.type ===
        (SqlBlockSourceType.Dataframes as unknown as NormalDatabaseConnection["type"])) &&
    !isFixingSql &&
    !isStreaming,
  );
  const shouldShowTable = hasAnyDataToShowUser && hasDataForTable && totalNumberOfRows !== null;
  const isEditorVisible =
    shouldShowCodeInChatModeFromSettings || shouldShowCodeEditor || isNotebookMode;
  const isReadonly = (!canEditCodeInChatMode && isChatMode) || isStreaming;
  const isAnythingLoading =
    askToGenerateSqlCode.isPending ||
    patchNotebookBlocks.isPending ||
    runSql.isPending ||
    isBlockRunning ||
    isFetchingData ||
    isFixingSql ||
    isStreaming;

  return (
    <article
      className="w-full flex flex-col gap-1 group/block"
      data-delete-block-before={isNotebookMode}
      id={sqlBlock.uuid}
      title="SQL block"
    >
      <header className="flex w-full gap-3 items-center justify-end">
        <RunArrow
          disabled={!canRunBlock || isReadonly || isEditorEmpty}
          showLoader={isBlockRunning || isFixingSql}
          onClick={handleExecuteSql}
        >
          {isFixingSql ? "Fixing..." : null}
        </RunArrow>

        <TipsPopover />
      </header>

      <section className="flex flex-col gap-0 border rounded-lg overflow-hidden border-border-smooth">
        {isNotebookMode || shouldShowCodeInChatModeFromSettings ? null : (
          <div
            className="flex items-center justify-between p-2 text-xs border-b border-border-smooth  data-[is-editor-visible=false]:border-none"
            data-is-editor-visible={isEditorVisible}
          >
            <p>{isStreaming ? "Analysing..." : null}</p>

            <button
              className="p-2 rounded-lg button-hover flex gap-2"
              onClick={handleToggleShowCode}
              type="button"
            >
              <ChevronDown
                className="size-4 data-[is-up=true]:rotate-180"
                data-is-up={isEditorVisible}
              />

              <span>{isEditorVisible ? "Hide" : "Show"} SQL code</span>
            </button>
          </div>
        )}

        {isNotebookMode ? (
          <div className="flex">
            <DatabaseConnectionsModal
              selectedDatabaseOrDataframe={selectedDatabase}
              disabled={isAnythingLoading}
              sqlBlock={sqlBlock}
            />

            <textarea
              className="no-ring resize-none simple-scrollbar p-2 w-full min-h-[1lh] field-sizing-content text-sm data-[loading=true]:text-loading text-muted"
              placeholder="Ask a question to this SQL block..."
              data-loading={askToGenerateSqlCode.isPending}
              onKeyDown={handleAskAiOnEnter}
              onChange={handleChangeCommand}
            />

            <button
              className="flex items-center justify-center button-hover aspect-square h-9"
              title="Ask question"
              onClick={handleAskForBackendToGenerateSqlCode}
            >
              {askToGenerateSqlCode.isPending ? LOADER : <Forward className="size-4" />}
            </button>
          </div>
        ) : null}

        {isEditorVisible ? (
          <DiffOrNormalEditor
            isBlockReadonly={isReadonly || (!canEditCodeInChatMode && !isNotebookMode)}
            selectedDatabase={selectedDatabase}
            isBlockRunning={isBlockRunning}
            onChange={handleSqlCodeChange}
            isFixingCode={isFixingSql}
            blockUuid={blockUuid}
            defaultValue={query}
            className="relative"
            language="sql"
            autocomplete
            resizable
          />
        ) : null}

        {shouldShowTable ? (
          <Table.Root
            dataComesFromDataPreview={dataComesFromDataPreview}
            setNumberOfRowsPerPage={setNumberOfRowsPerPage}
            initialBlockFilterAndSort={blockFilterAndSort}
            setBlockFilterAndSort={setBlockFilterAndSort}
            numberOfRowsPerPage={numberOfRowsPerPage}
            totalNumberOfRows={totalNumberOfRows}
            setIsNewSource={setIsNewSource}
            isFetchingData={isFetchingData}
            initialPageNumber={initialPage}
            allData={tableMapStorage}
            isNewSource={isNewSource}
            reload={handleExecuteSql}
            fetchMore={paginate}
            block={sqlBlock}
          >
            <Table.DefaultHeader className="border-t" />

            <Table.Data />

            <Table.DefaultFooter />
          </Table.Root>
        ) : null}

        <CodeOutput isDataPreviewStale={isDataPreviewStale} blockUuid={blockUuid} isSqlBlock />
      </section>

      {isNotebookMode ? (
        <footer>
          <WriteVariable block={sqlBlock} />

          <AddBlockBelowButton blockAboveUuid={sqlBlock.uuid} />
        </footer>
      ) : null}

      <DeleteBlockFloatingButton blockUuid={sqlBlock.uuid} />
    </article>
  );
}
