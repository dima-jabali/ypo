import { useState } from "react";

import { databasesSchemaStore } from "#/contexts/databases-schema";
import { useFetchDatabaseData } from "#/hooks/fetch/use-fetch-database-data";
import { type Entity, type NormalDatabaseConnection, type Table } from "#/types/databases";
import { IconType } from "./helpers/types";
import type { ActiveItem, FetchDatabaseDataParams, SchemaTreeProps } from "./schema-tree";
import { Tree } from "./Tree";
import { UNKNOWN_NAME } from "./utils";

export type ChildTreeProps<Child extends Entity> = {
  expandedItemsRef: SchemaTreeProps["expandedItemsRef"];
  activeItemRef: React.RefObject<ActiveItem>;
  db: NormalDatabaseConnection;
  entity: Child;
  renderEntityType: (entity: Entity) => React.ReactNode | null;
};

export function TableTree({
  expandedItemsRef,
  activeItemRef,
  entity,
  db,
}: Omit<ChildTreeProps<Table>, "renderEntityType">) {
  const [dbParams, setDbParams] = useState<FetchDatabaseDataParams>();
  const [topLevelId] = useState(`${entity.name}`);

  const fetchDatabaseDataQuery = useFetchDatabaseData(dbParams);

  async function handleOnClick() {
    if (fetchDatabaseDataQuery.isLoading) return;

    const needsToFetchData = !entity.fields;

    if (needsToFetchData) {
      setDbParams({
        entity_type: entity.entity_type,
        entity_id: entity.id,
        db,
        onSuccess() {
          databasesSchemaStore.setState({
            columns: entity.fields,
            title: entity.name,
          });
        },
      });
    } else {
      databasesSchemaStore.setState({
        columns: entity.fields,
        title: entity.name,
      });
    }
  }

  return (
    <Tree
      isLoading={fetchDatabaseDataQuery.isLoading}
      expandedItemsRef={expandedItemsRef}
      name={entity.name ?? UNKNOWN_NAME}
      activeItemRef={activeItemRef}
      onClick={handleOnClick}
      type={IconType.TABLE}
      key={topLevelId}
      isParent={false}
      id={topLevelId}
    />
  );
}
