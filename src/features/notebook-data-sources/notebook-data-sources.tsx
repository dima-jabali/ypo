import { ChevronLeftIcon, ChevronRightIcon, LinkIcon, PlusIcon } from "lucide-react";
import { useLayoutEffect, useState } from "react";

import { Dialog, DialogContent } from "#/components/Dialog";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "#/components/resizable";
import { Separator } from "#/components/separator";
import { databasesSchemaStore } from "#/contexts/databases-schema";
import type { NormalDatabaseConnection } from "#/types/databases";
import { DBConnectionModalContent } from "../data-manager/db-connection-modal/db-connection-modal";
import { SchemaSearcherOrDatabasesTree } from "../database-source/schema-searcher-or-databases-tree";
import { TableColumns } from "../database-source/table-columns";
import { Dataframes } from "./dataframes";

enum OpenView {
  ALL_DATABASES_AND_DATAFRAMES_AND_COLUMNS,
  BLOCKS_DATAFRAMES,
}

export function NotebookDataSources() {
  const [selectedDatabase, setSelectedDatabase] = useState<NormalDatabaseConnection | null>(null);
  const [openView, setOpenView] = useState(OpenView.ALL_DATABASES_AND_DATAFRAMES_AND_COLUMNS);
  const [isNewDatabaseModalOpen, setIsNewDatabaseModalOpen] = useState(false);

  const columns = databasesSchemaStore.use.columns();

  const isDataFramesInScopeTabOpen = openView === OpenView.BLOCKS_DATAFRAMES;
  const isShowingTableColumns = columns !== null;

  function closeTableColumns() {
    databasesSchemaStore.setState({
      columns: null,
      title: null,
    });
  }

  function goToAllSources() {
    setOpenView(OpenView.ALL_DATABASES_AND_DATAFRAMES_AND_COLUMNS);
    setSelectedDatabase(null);
    closeTableColumns();

    databasesSchemaStore.setState({
      columns: null,
      title: null,
    });
  }

  function goToDataframes() {
    setOpenView(OpenView.BLOCKS_DATAFRAMES);
    setSelectedDatabase(null);
    closeTableColumns();
  }

  useLayoutEffect(() => {
    if (isDataFramesInScopeTabOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpenView(OpenView.BLOCKS_DATAFRAMES);
      setSelectedDatabase(null);

      databasesSchemaStore.setState({
        columns: null,
        title: null,
      });
    }
  }, [isDataFramesInScopeTabOpen]);

  function renderContent() {
    switch (openView) {
      case OpenView.ALL_DATABASES_AND_DATAFRAMES_AND_COLUMNS:
        return (
          <>
            <div className="flex h-fit w-full flex-col gap-1">
              <header className="flex items-center justify-between gap-1 overflow-clip p-3 pb-0 text-sm font-bold">
                Used dataframes
                <div className="flex items-center gap-1 rounded-xs bg-purple-900 p-1">
                  <LinkIcon className="size-4 stroke-purple-200 stroke-[1px]" />
                </div>
              </header>

              <p className="flex w-[100%] items-center justify-between p-3 text-xs font-light text-primary">
                <span className="cursor-pointer onfocus:underline" onPointerUp={goToDataframes}>
                  See all dataframes used in this project
                </span>

                <button className="button-hover rounded-sm p-2" onPointerDown={goToDataframes}>
                  <ChevronRightIcon className="size-4 stroke-primary stroke-[1px]" />
                </button>
              </p>
            </div>

            <Separator />

            <div className="flex flex-col p-3">
              <div className="flex items-center justify-between gap-2 text-sm font-bold ">
                <p>Databases connections</p>

                <button
                  className="onfocus:bg-button-hover flex items-center justify-center gap-2 rounded-sm px-2 py-1 text-xs font-bold button-hover"
                  onPointerDown={() => setIsNewDatabaseModalOpen(true)}
                >
                  <PlusIcon className="size-4 stroke-primary stroke-[1px]" />

                  <p>Add</p>
                </button>
              </div>

              <p className="pt-1 text-xs text-primary">
                Connections to external databases for use by anyone in this project.
              </p>
            </div>

            <Separator className="mb-1" />

            <SchemaSearcherOrDatabasesTree selectedDatabase={selectedDatabase} />
          </>
        );

      case OpenView.BLOCKS_DATAFRAMES:
        return (
          <>
            <button
              className="onfocus:bg-button-hover ml-1 mt-3 flex h-7 min-h-7 w-fit items-center gap-1 rounded-sm pl-1 pr-2 text-xs font-light button-hover"
              onPointerDown={goToAllSources}
            >
              <ChevronLeftIcon className="h-3 w-3 stroke-primary stroke-[1px]" />

              <p>All sources</p>
            </button>

            <Dataframes />
          </>
        );
    }
  }

  return (
    <>
      <ResizablePanelGroup
        className="relative flex h-full grow flex-none flex-col overflow-hidden"
        direction="vertical"
      >
        <ResizablePanel className="flex flex-col h-full simple-scrollbar!">
          {renderContent()}
        </ResizablePanel>

        {isShowingTableColumns ? (
          <>
            <ResizableHandle withHandle />

            <ResizablePanel>
              <TableColumns />
            </ResizablePanel>
          </>
        ) : null}
      </ResizablePanelGroup>

      <Dialog onOpenChange={setIsNewDatabaseModalOpen} open={isNewDatabaseModalOpen}>
        <DialogContent className="flex flex-col border-border-smooth bg-popover p-9 pb-6 text-primary h-[90vh] simple-scrollbar z-500">
          <DBConnectionModalContent setIsOpen={setIsNewDatabaseModalOpen} />
        </DialogContent>
      </Dialog>
    </>
  );
}
