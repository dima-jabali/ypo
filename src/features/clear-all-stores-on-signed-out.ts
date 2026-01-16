import { dataManagerStore } from "#/contexts/data-manager";
import { databasesSchemaStore } from "#/contexts/databases-schema";
import { droppedFiles } from "#/contexts/dropped-files";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { allEditorsInfo } from "#/contexts/monaco-editors-info";
import { queryClient } from "#/contexts/query-client";

export function ClearAllStoresOnSignedOut() {
  databasesSchemaStore.setState(databasesSchemaStore.getInitialState());
  generalContextStore.setState(generalContextStore.getInitialState());
  dataManagerStore.setState(dataManagerStore.getInitialState());
  allEditorsInfo.clear();
  droppedFiles.clear();
  queryClient.clear();

  return null;
}
