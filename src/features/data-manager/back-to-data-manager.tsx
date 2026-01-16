import { ChevronLeft } from "lucide-react";

import { dataManagerStore } from "#/contexts/data-manager";
import { databasesSchemaStore } from "#/contexts/databases-schema";

export function BackToDataManager() {
  function handleBackToDataManager() {
    databasesSchemaStore.setState(databasesSchemaStore.getInitialState());
    dataManagerStore.setState(dataManagerStore.getInitialState());
  }

  return (
    <button
      className="button-hover p-2 flex items-center justify-center rounded-full"
      type="button"
      onClick={handleBackToDataManager}
      title="Go back to Data Manager"
    >
      <ChevronLeft className="size-4 stroke-primary" />
    </button>
  );
}
