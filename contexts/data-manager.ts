import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type {
	DatabaseConnection,
	DatabaseConnectionType,
} from "#/types/databases";
import { createReactSelectors } from "./create-zustand-provider";

type DataManagerState = {
	connectionId: DatabaseConnection["id"] | null;
	connectionType: DatabaseConnectionType | null;
	airtableCodeVerifier: string | null;
};

const dataManagerStoreBase = create(
	subscribeWithSelector<DataManagerState>(() => ({
		airtableCodeVerifier: null,
		connectionType: null,
		connectionId: null,
	})),
);

export const dataManagerStore = createReactSelectors(dataManagerStoreBase);
