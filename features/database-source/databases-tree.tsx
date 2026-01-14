import { useRef } from "react";

import { useFetchAllDatabaseConnections } from "#/hooks/fetch/use-fetch-all-database-connections";
import type {
	GeneralEntityId,
	NormalDatabaseConnection,
} from "#/types/databases";
import type { TableName } from "../schema-tree/helpers/types";
import { SchemaTree, type ActiveItem } from "../schema-tree/schema-tree";

export function DatabasesTree({
	selectedDatabase,
}: {
	selectedDatabase: NormalDatabaseConnection | null;
}) {
	const allDatabaseConnections = useFetchAllDatabaseConnections();

	if (selectedDatabase) {
		return (
			<ExandableSchemaTree key={selectedDatabase.id} db={selectedDatabase} />
		);
	}

	return allDatabaseConnections.data.normalDatabases.map((db) => (
		<ExandableSchemaTree key={db.id} db={db} />
	));
}

const ExandableSchemaTree = ({ db }: { db: NormalDatabaseConnection }) => {
	const expandedItemsRef = useRef(new Set<GeneralEntityId | TableName>());
	const activeItemRef = useRef<ActiveItem>("");

	return (
		<SchemaTree
			expandedItemsRef={expandedItemsRef}
			activeItemRef={activeItemRef}
			key={db.id}
			db={db}
		/>
	);
};
