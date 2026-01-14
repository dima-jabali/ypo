import { useState } from "react";

import { EntityType, type Schemata } from "#/types/databases";
import type { ChildTreeProps } from "./table-tree";
import type { FetchDatabaseDataParams } from "./schema-tree";
import { useFetchDatabaseData } from "#/hooks/fetch/use-fetch-database-data";
import { Tree } from "./Tree";
import { IconType } from "./helpers/types";
import { UNKNOWN_NAME } from "./utils";

export function SchemataTree({
	expandedItemsRef,
	activeItemRef,
	entity,
	db,
	renderEntityType,
}: ChildTreeProps<Schemata>) {
	const [dbParams, setDbParams] = useState<FetchDatabaseDataParams>();
	const [topLevelId] = useState(`${entity.name}`);

	const fetchDatabaseDataQuery = useFetchDatabaseData(dbParams);

	function handleOnClick() {
		if (fetchDatabaseDataQuery.isLoading) return;

		const needsToFetchData = !entity.tables;

		if (!needsToFetchData) return;

		setDbParams({
			entity_type: entity.entity_type,
			entity_id: entity.id,
			db,
		});
	}

	const children = [
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
			{entity.tables?.map(renderEntityType)}
		</Tree>,
	];

	if (entity.fields && entity.fields.length > 0) {
		children.push(
			<Tree
				expandedItemsRef={expandedItemsRef}
				type={IconType.TABLES_FOLDER}
				activeItemRef={activeItemRef}
				key={EntityType.FIELD}
				id={EntityType.FIELD}
				showNumberOfChildren
				name="Fields"
				isParent
			>
				{entity.fields.map(renderEntityType)}
			</Tree>,
		);
	}

	return (
		<Tree
			isLoading={fetchDatabaseDataQuery.isLoading}
			expandedItemsRef={expandedItemsRef}
			name={entity.name ?? UNKNOWN_NAME}
			activeItemRef={activeItemRef}
			onClick={handleOnClick}
			type={IconType.SCHEMA}
			key={topLevelId}
			id={topLevelId}
			isParent
		>
			{children}
		</Tree>
	);
}
