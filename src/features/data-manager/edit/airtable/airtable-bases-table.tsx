import { CheckIcon, Table } from "lucide-react";
import { memo, useMemo, useRef, useState } from "react";
import { titleCase } from "scule";

import { Button, ButtonVariant } from "#/components/Button";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "#/components/Dialog";
import { noop } from "#/helpers/utils";
import {
  AirtableConnectionFieldsUpdateEntityType,
  useSyncConnection,
  type SyncAirtableRequest,
} from "#/hooks/mutation/use-sync-connection";
import {
  DatabaseConnectionType,
  type AirtableCommonFields,
  type AirtableDatabaseConnection,
  type AirtableTable,
} from "#/types/databases";

type Props = {
  connection: AirtableDatabaseConnection;
};

type UpdatesToSend = NonNullable<SyncAirtableRequest["updates"]>;

export function AirtableBasesTable({ connection }: Props) {
  const [hasAnyUpdate, setHasAnyUpdate] = useState(false);

  const syncConnection = useSyncConnection<AirtableDatabaseConnection>();

  // Tables marked for indexing should show up first:
  const bases = useMemo(() => {
    const originalBases = structuredClone(connection.bases);

    const reorderedBases = originalBases.sort((a, b) => {
      if (a.include_in_indexing && !b.include_in_indexing) {
        return -1;
      } else if (!a.include_in_indexing && b.include_in_indexing) {
        return 1;
      } else {
        return 0;
      }
    });

    reorderedBases.forEach((base) => {
      base.tables.sort((a, b) => {
        if (a.include_in_indexing && !b.include_in_indexing) {
          return -1;
        } else if (!a.include_in_indexing && b.include_in_indexing) {
          return 1;
        } else {
          return 0;
        }
      });
    });

    return reorderedBases;
  }, [connection]);

  const updatesToReindexRef = useRef<UpdatesToSend>([]);

  function handleSyncAirtable() {
    if (syncConnection.isPending) return;

    syncConnection
      .mutateAsync({
        connection_type: DatabaseConnectionType.Airtable,
        updates: updatesToReindexRef.current,
        connection_id: connection.id,
        resync_models_only: false,
        reindex: false,
      })
      .then(() => {
        updatesToReindexRef.current = [];

        setHasAnyUpdate(false);
      })
      .catch(noop);
  }

  return (
    <div className="flex flex-col gap-10">
      <AirtableCommonTable
        type={AirtableConnectionFieldsUpdateEntityType.Base}
        updatesToReindexRef={updatesToReindexRef}
        setHasAnyUpdate={setHasAnyUpdate}
        array={bases}
      />

      <Button
        title={hasAnyUpdate ? "Save changes" : "No changes to save"}
        isLoading={syncConnection.isPending}
        variant={ButtonVariant.SUCCESS}
        onClick={handleSyncAirtable}
        disabled={!hasAnyUpdate}
        className="w-fit"
      >
        Sav{syncConnection.isPending ? "ing" : "e"} changes to tables
        {syncConnection.isPending ? "..." : ""}
      </Button>
    </div>
  );
}

export const AirtableCommonTable = memo(
  <T extends AirtableCommonFields>({
    updatesToReindexRef,
    array,
    type,
    setHasAnyUpdate,
  }: {
    updatesToReindexRef: React.RefObject<UpdatesToSend>;
    type: AirtableConnectionFieldsUpdateEntityType;
    array: Array<T>;
    setHasAnyUpdate: React.Dispatch<React.SetStateAction<boolean>>;
  }) => {
    if (array.length === 0) return null;

    const handleToggleIndexOfTable = (common: T) => {
      const alreadyExistingIndex = updatesToReindexRef.current.findIndex(
        (item) => item.entity_id === common.id,
      );

      if (alreadyExistingIndex === -1) {
        // Does not exist.

        const value = array.find((item) => item.id === common.id);

        if (!value) return;

        updatesToReindexRef.current.push({
          include_in_indexing: !value.include_in_indexing,
          entity_id: common.id,
          entity_type: type,
        });
      } else {
        // Already exists. Let's deleted it.

        updatesToReindexRef.current.splice(alreadyExistingIndex, 1);
      }

      setHasAnyUpdate(updatesToReindexRef.current.length > 0);
    };

    return (
      <div className="pr-0.5 group">
        <table className="w-full border-collapse border border-border-smooth h-1">
          <thead className="bg-transparent">
            <tr>
              {Object.keys(array[0] || {}).map((key) => (
                <th
                  className="border border-border-smooth py-2 px-6 text-primary whitespace-nowrap"
                  key={key}
                >
                  {titleCase(key)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {array.map((common) => (
              <tr
                className="transition-none odd:bg-gray-600/50 hover:bg-button-hover"
                key={common.airtable_id}
              >
                {Object.entries(common).map(([key, value]) => {
                  if (typeof value === "object") {
                    return (
                      <td className="border border-border-smooth" key={Math.random()}>
                        <HoverAirtableTable
                          updatesToReindexRef={updatesToReindexRef}
                          setHasAnyUpdate={setHasAnyUpdate}
                          name={common.airtable_name}
                          tables={value}
                        />
                      </td>
                    );
                  } else if (key === "include_in_indexing") {
                    const changedValue = updatesToReindexRef.current.find(
                      (item) => item.entity_id === common.id,
                    );

                    return (
                      <td className="border border-border-smooth" key={`${value}`}>
                        <label
                          className="flex relative items-center justify-center h-full cursor-pointer"
                          title="Include in indexing"
                        >
                          <input
                            className="cursor-pointer peer size-6 appearance-none border border-accent checked:bg-accent rounded-full text-primary"
                            onChange={() => handleToggleIndexOfTable(common)}
                            type="checkbox"
                            defaultChecked={
                              changedValue?.include_in_indexing ?? (value as boolean) // Casting here because it is a boolean
                            }
                          />

                          <CheckIcon className="absolute size-4 peer-checked:visible invisible" />
                        </label>
                      </td>
                    );
                  } else {
                    return (
                      <td className="border border-border-smooth" key={`${value}`}>
                        <p className="flex items-center justify-center px-4 py-2">{`${value}`}</p>
                      </td>
                    );
                  }
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
);

AirtableCommonTable.displayName = "AirtableCommonTable";

type HoverAirtableTable = {
  updatesToReindexRef: React.RefObject<UpdatesToSend>;
  tables: AirtableTable[];
  name: string;
  setHasAnyUpdate: React.Dispatch<React.SetStateAction<boolean>>;
};

const HoverAirtableTable: React.FC<HoverAirtableTable> = ({
  updatesToReindexRef,
  tables,
  name,
  setHasAnyUpdate,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center justify-center h-full w-full">
          <Table className="size-6" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-[90vw]! max-h-[90vh] border-border-smooth  shadow-lg shadow-black">
        <div className="p-6 overflow-auto flex flex-col gap-6">
          <DialogHeader className="text-lg">{name} Tables</DialogHeader>

          <AirtableCommonTable
            type={AirtableConnectionFieldsUpdateEntityType.Table}
            updatesToReindexRef={updatesToReindexRef}
            setHasAnyUpdate={setHasAnyUpdate}
            array={tables}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
