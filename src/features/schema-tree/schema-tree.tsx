import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

import { databasesSchemaStore } from "#/contexts/databases-schema";
import { useFetchDatabaseData } from "#/hooks/fetch/use-fetch-database-data";
import {
	EntityType,
	StandardSchemaKeys,
	type Entity,
	type GeneralEntityId,
	type NormalDatabaseConnection,
	type StandardSchemaIteration,
	type TableId,
} from "#/types/databases";
import { TableTree } from "./table-tree";
import { Tree } from "./Tree";
import {
	IconType,
	type FetchSchemaRequestParams,
	type TableName,
} from "./helpers/types";
import { LOCAL_INDICATOR_THAT_TREE_SHOULD_EXPAND } from "./utils";
import { SchemataTree } from "./schemata-tree";
import { DatabaseTree } from "./database-tree";

export type SchemaTreeProps = {
	expandedItemsRef: React.RefObject<Set<GeneralEntityId | TableName>>;
	activeItemRef: React.RefObject<ActiveItem>;
	db: NormalDatabaseConnection;
};

export type FetchDatabaseDataParams = FetchSchemaRequestParams & {
	onSuccess?: () => void;
};

export type ActiveItem = TableId | TableName;

const INDEX_OF_LOCAL_INDICATOR_THAT_TREE_SHOULD_EXPAND = 0;
const INDEX_OF_DATABASE_ID = 2;

export function SchemaTree({
	expandedItemsRef,
	activeItemRef,
	db,
}: SchemaTreeProps) {
	const [dbParams, setDbParams] = useState<FetchDatabaseDataParams>();

	const searchResultItemsToExpand =
		databasesSchemaStore.use.searchResultItemsToExpand();
	const databasesSchema = databasesSchemaStore.use.databasesSchema();
	const fetchDatabaseDataQuery = useFetchDatabaseData(dbParams);
	const schemaToShow = databasesSchemaStore.use.schemaToShow();

	const schema = useMemo(
		() =>
			databasesSchema.find(
				(item) => item.databaseId === db.id && db.type === item.connectionType,
			),
		[databasesSchema, db.id, db.type],
	);

	const handleOnClick = useCallback(() => setDbParams({ db }), [db]);

	useEffect(() => {
		// When `schemaToShow` changes, fetch and/or open it.

		if (
			fetchDatabaseDataQuery.isLoading ||
			fetchDatabaseDataQuery.isFetched ||
			!schemaToShow ||
			schema
		) {
			return;
		}

		if (schemaToShow.id !== db.id || schemaToShow.connectionType !== db.type) {
			return;
		}

		setDbParams({
			db,
			onSuccess: () => {
				databasesSchemaStore.setState({
					columns: null,
					title: null,
				});
				expandedItemsRef.current.clear();
				expandedItemsRef.current.add(db.id); // Open outer item once it's loaded.
			},
		});
	}, [
		fetchDatabaseDataQuery.isFetched,
		fetchDatabaseDataQuery.isLoading,
		expandedItemsRef,
		schemaToShow,
		schema,
		db,
	]);

	/** Expand the tree from the search results: */
	if (
		searchResultItemsToExpand[
			INDEX_OF_LOCAL_INDICATOR_THAT_TREE_SHOULD_EXPAND
		] === LOCAL_INDICATOR_THAT_TREE_SHOULD_EXPAND &&
		searchResultItemsToExpand[INDEX_OF_DATABASE_ID] === db.id
	) {
		for (let i = 0; i < 2; ++i) {
			const item = searchResultItemsToExpand[0]; // 0 because we deleted the first item.

			// The second item is the active item:
			if (i === 1) {
				activeItemRef.current = item;
			}

			// The first item is the `LOCAL_INDICATOR_THAT_TREE_SHOULD_EXPAND`, let's remove it from the list of items to expand:
			searchResultItemsToExpand.splice(0, 1);
		}

		expandedItemsRef.current = new Set(searchResultItemsToExpand);

		// Fetch the database schema to keep opening the tree:
		handleOnClick();
	}

	const renderEntityType = useCallback(
		(entity: Entity) => {
			switch (entity.entity_type) {
				case EntityType.SCHEMATA:
					return (
						<SchemataTree
							expandedItemsRef={expandedItemsRef}
							renderEntityType={renderEntityType}
							activeItemRef={activeItemRef}
							key={entity.id}
							entity={entity}
							db={db}
						/>
					);

				case EntityType.TABLE:
					return (
						<TableTree
							expandedItemsRef={expandedItemsRef}
							activeItemRef={activeItemRef}
							key={entity.id}
							entity={entity}
							db={db}
						/>
					);

				case EntityType.DATABASE:
					return (
						<DatabaseTree
							expandedItemsRef={expandedItemsRef}
							renderEntityType={renderEntityType}
							activeItemRef={activeItemRef}
							key={entity.id}
							entity={entity}
							db={db}
						/>
					);

				case EntityType.FIELD:
					return <Fragment key={entity.entity_type} />;

				default:
					console.error("No switch for entity!", { entity });
					return <Fragment key="No switch for entity!" />;
			}
		},
		[activeItemRef, db, expandedItemsRef],
	);

	const topLevelView = schema?.schema.schema_info;

	return (
		<Tree
			isLoading={fetchDatabaseDataQuery.isLoading}
			expandedItemsRef={expandedItemsRef}
			activeItemRef={activeItemRef}
			onClick={handleOnClick}
			name={db.name ?? ""}
			type={db.type}
			key={db.id}
			id={db.id}
			isParent
		>
			{topLevelView
				? Object.entries(topLevelView).map((item, index) =>
						getTopLevelView(
							// @ts-expect-error => `Object.entries` gives `string` instead of `keyof StandardSchema`:
							item,
							expandedItemsRef,
							renderEntityType,
							activeItemRef,
							index,
						),
					)
				: null}
		</Tree>
	);
}

const getTopLevelView = (
	[name, entities]: StandardSchemaIteration,
	expandedItemsRef: SchemaTreeProps["expandedItemsRef"],
	renderEntityType: (entity: Entity) => React.ReactNode | null,
	activeItemRef: React.RefObject<ActiveItem>,
	index: number,
) => {
	switch (name) {
		case StandardSchemaKeys.SCHEMATA:
			return entities.length > 0 ? (
				<Tree
					expandedItemsRef={expandedItemsRef}
					type={IconType.SCHEMAS_FOLDER}
					activeItemRef={activeItemRef}
					key={EntityType.SCHEMATA}
					id={EntityType.SCHEMATA}
					showNumberOfChildren
					name="Schemas"
					isParent
				>
					{entities.map(renderEntityType)}
				</Tree>
			) : (
				<Fragment key={index} />
			);

		case StandardSchemaKeys.TABLES:
			return entities.length > 0 ? (
				<Tree
					expandedItemsRef={expandedItemsRef}
					type={IconType.TABLES_FOLDER}
					activeItemRef={activeItemRef}
					key={EntityType.TABLE}
					id={EntityType.TABLE}
					showNumberOfChildren
					name="Tables"
					isParent
				>
					{entities.map(renderEntityType)}
				</Tree>
			) : (
				<Fragment key={index} />
			);

		case StandardSchemaKeys.DATABASES:
			return (
				<Tree
					expandedItemsRef={expandedItemsRef}
					type={IconType.DATABASES_FOLDER}
					activeItemRef={activeItemRef}
					key={EntityType.DATABASE}
					id={EntityType.DATABASE}
					showNumberOfChildren
					name="Databases"
					isParent
				>
					{entities.map(renderEntityType)}
				</Tree>
			);

		case StandardSchemaKeys.PARENT_ENTITY:
		case StandardSchemaKeys.FIELDS:
			return <Fragment key={index} />;

		default:
			console.info("No switch for entity!", { name, entities });
			return <Fragment key={index} />;
	}
};
