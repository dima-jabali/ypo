import { type StoreApi, create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { TableName } from "#/features/schema-tree/helpers/types";
import type {
	DatabaseConnectionType,
	DatabaseSchema,
	Field,
	GeneralEntityId,
	NormalDatabaseConnectionId,
} from "#/types/databases";
import { createReactSelectors } from "./create-zustand-provider";

type TableColumn = Field;

export type DatabaseConnectionsSchema = {
	connectionType: DatabaseConnectionType;
	databaseId: NormalDatabaseConnectionId;
	schema: DatabaseSchema;
};

export type DatabaseSchemaState = {
	searchResultItemsToExpand: Array<TableName | GeneralEntityId>;
	databasesSchema: Array<DatabaseConnectionsSchema>;
	columns: Array<TableColumn> | null;
	title: string | null;
	schemaToShow: {
		connectionType: DatabaseConnectionType;
		id: unknown;
	} | null;
};

export enum OpenView {
	SearchResultExpandedDatabaseTree,
	SearchResults,
	DatabasesTree,
}

export type DatabasesSchemaContextType = {
	setDatabasesSchema: StoreApi<DatabaseSchemaState>["setState"];
	store: StoreApi<DatabaseSchemaState>;
};

const databasesSchemaBase = create(
	subscribeWithSelector<DatabaseSchemaState>(() => ({
		searchResultItemsToExpand: [],
		databasesSchema: [],
		schemaToShow: null,
		columns: null,
		title: null,
	})),
);

export const databasesSchemaStore = createReactSelectors(databasesSchemaBase);
