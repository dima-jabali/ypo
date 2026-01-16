import { memo } from "react";

import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { dataManagerStore } from "#/contexts/data-manager";
import { useFetchAllDatabaseConnections } from "#/hooks/fetch/use-fetch-all-database-connections";
import { matchIcon } from "#/icons/match-icon";
import { DatabaseConnectionType, type DatabaseConnection } from "#/types/databases";
import { AddNewDatabaseConnectionDialog } from "./add-new-database-connection-dialog";
import { isValidNumber } from "#/helpers/utils";
import { EditSomeDb } from "./edit/edit-some-db";

export const DataManager = memo(function DataManager() {
  return (
    <DefaultSuspenseAndErrorBoundary fallbackFor="DataManager" failedText="Failed on Data Manager">
      <WithDataManagerData>
        <Manager />
      </WithDataManagerData>
    </DefaultSuspenseAndErrorBoundary>
  );
});

function WithDataManagerData({ children }: React.PropsWithChildren) {
  // Destructure to not trigger a re-render when the value changes:
  const { isEnabled } = useFetchAllDatabaseConnections();

  // Just so it doesn't get compiled away:
  if (!isEnabled) {
    console.log({
      isEnabled,
    });
  }

  return children;
}

function Manager() {
  const { allDatabaseConnections } = useFetchAllDatabaseConnections().data;
  const dataManagerConnectionType = dataManagerStore.use.connectionType();
  const dataManagerConnectionId = dataManagerStore.use.connectionId();

  function editDbConn(conn: DatabaseConnection) {
    dataManagerStore.setState({
      ...dataManagerStore.getInitialState(),
      connectionType: conn.type,
      connectionId: conn.id,
    });
  }

  const isEditingSomeDb = isValidNumber(dataManagerConnectionId) && !!dataManagerConnectionType;

  return (
    <div className="flex flex-col gap-10 w-full h-full p-10 simple-scrollbar">
      {isEditingSomeDb ? (
        <EditSomeDb />
      ) : (
        <>
          <h1 className="text-3xl font-bold w-full">Data Manager</h1>

          <div className="flex items-center justify-between gap-10">
            <p className="text-primary">
              Connections to external databases for use by anyone in this organization.
            </p>

            <AddNewDatabaseConnectionDialog />
          </div>

          <div className="flex flex-col gap-4">
            {allDatabaseConnections
              .filter(
                (d) =>
                  d.type !== DatabaseConnectionType.YouTube &&
                  d.type !== DatabaseConnectionType.Spotify &&
                  d.type !== DatabaseConnectionType.Notion,
              )
              .map((conn) => (
                <button
                  className="flex w-fit select-none gap-2 text-sm link"
                  title={`${conn.type}: ${conn.name} (${conn.id})`}
                  onClick={() => editDbConn(conn)}
                  key={`${conn.id}-${conn.type}`}
                >
                  {matchIcon(conn.type)}

                  <p>{conn.name}</p>
                </button>
              ))}

            {/* {webBotSources.map((botSource) => (
							<button
								className="flex items-center w-fit select-none gap-2 text-sm"
								onClick={() => setBotSourceBeingEdited(botSource)}
								key={`${botSource.id}-bot_source`}
								title="Indexed web pages"
								type="button"
							>
								{matchIcon("web")}

								<span>{botSource.name}</span>
							</button>
						))} */}

            {/* {isEditingWebBotSource ? (
							<EditOrCreateBotSourceDialog
								setBotSourceBeingEditedOrAdded={setBotSourceBeingEdited}
								closeDialog={handleCloseEditBotSourceDialog}
								setNextBotSources={setNextBotSources}
								action={BotSourceFormAction.Edit}
								source={botSourceBeingEdited}
							/>
						) : null} */}
          </div>
        </>
      )}
    </div>
  );
}
