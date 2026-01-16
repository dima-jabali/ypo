import { useState } from "react";

import { Dialog, DialogContent } from "#/components/Dialog";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "#/components/resizable";
import type { NormalDatabaseConnection } from "#/types/databases";
import { DBConnectionModalContent } from "../data-manager/db-connection-modal/db-connection-modal";
import { SchemaSearcherOrDatabasesTree } from "./schema-searcher-or-databases-tree";
import { TableColumns } from "./table-columns";
import { databasesSchemaStore } from "#/contexts/databases-schema";

type Props = {
  conn: NormalDatabaseConnection | null;
};

export function DatabaseSource({ conn }: Props) {
  const [isNewDatabaseModalOpen, setIsNewDatabaseModalOpen] = useState(false);

  const columns = databasesSchemaStore.use.columns();

  const isShowingTableColumns = columns !== null;

  return (
    <div className="flex flex-1 h-full">
      <ResizablePanelGroup
        className="relative flex h-full grow flex-none flex-col overflow-hidden"
        direction="vertical"
      >
        <ResizablePanel className="flex flex-col h-full overflow-hidden">
          <SchemaSearcherOrDatabasesTree selectedDatabase={conn} />
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
        <DialogContent className="flex flex-col border-border-smooth  bg-popover p-9 pb-6 text-primary h-[90vh] simple-scrollbar">
          <DBConnectionModalContent setIsOpen={setIsNewDatabaseModalOpen} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
