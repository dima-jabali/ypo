import { useMemo, useState } from "react";

import { OpenView } from "#/contexts/databases-schema";
import type { NormalDatabaseConnection } from "#/types/databases";
import { SchemaSearcher } from "../schema-tree/search-columns-or-dataframes/schema-searcher";
import { DatabasesTree } from "./databases-tree";

export function SchemaSearcherOrDatabasesTree({
  selectedDatabase,
}: {
  selectedDatabase: NormalDatabaseConnection | null;
}) {
  const [openView, setOpenView] = useState(OpenView.DatabasesTree);

  const databasesTree = useMemo(
    () => (
      <div className="simple-scrollbar flex scrollbar-stable min-h-min h-full">
        <div className="w-full [&_div]:pl-5">
          <DatabasesTree selectedDatabase={selectedDatabase} />

          <div className="h-48" />
        </div>
      </div>
    ),
    [selectedDatabase],
  );

  return (
    <>
      <SchemaSearcher
        selectedDatabase={selectedDatabase}
        setOpenView={setOpenView}
        openView={openView}
      />

      {openView === OpenView.SearchResultExpandedDatabaseTree || openView === OpenView.DatabasesTree
        ? databasesTree
        : null}
    </>
  );
}
