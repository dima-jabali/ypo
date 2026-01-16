"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type { FetchDatabaseDataParams } from "#/features/schema-tree/schema-tree";
import { isValidNumber } from "#/helpers/utils";
import type {
  DatabaseAction,
  DatabaseConnectionType,
  EntityType,
  GeneralEntityId,
  NormalDatabaseConnectionId,
  SchemaId,
  SchemaType,
  StandardSchema,
} from "#/types/databases";
import type { ISODateString } from "#/types/general";
import { queryKeyFactory } from "../query-keys";

export type DatabaseDataRequest = {
  action_inputs: {
    /* In order to recieve a partial response (if the server deems needed), that is, the top level of entities, use `entity_type` and `entity_id`, otherwise, all of the entities will in one single response (for too big schemas, there will be an error) */
    entity_id?: GeneralEntityId;
    entity_type?: EntityType;
  };
  connection_id: NormalDatabaseConnectionId;
  connection_type: DatabaseConnectionType;
  metadata: Record<string, unknown>;
  action: DatabaseAction;
  webhook_url?: string;
};

type ActionOutputsForFetchSchema = {
  schema_type: SchemaType.STANDARD;
  schema_info: StandardSchema;
  id: SchemaId;
};

export type FetchSchemaResponse =
  | { status: "pending"; request_id: string }
  | {
      action_outputs: ActionOutputsForFetchSchema;
      connection_type: DatabaseConnectionType;
      action_inputs: Record<string, unknown>;
      user: { name: number; email: string };
      created_at: ISODateString;
      message_type: "Response";
      action: DatabaseAction;
      connection_id: number;
      error: string | null;
      status: "complete";
      message_id: number;
      request_id: string;
    };

export const useFetchDatabaseData = (dbParams?: FetchDatabaseDataParams) => {
  if (typeof window === "undefined") {
    return null;
  }

  const enabled = isValidNumber(dbParams?.db.id);

  // Using `!` here because the function won't run if `enabled` is `false`
  const queryOptions = useMemo(() => queryKeyFactory.get["database-data"](dbParams!), [dbParams]);

  return useQuery({
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity, // never stale
    gcTime: Infinity, // keep data in memory
    retry: false,
    enabled,
    ...queryOptions,
  });
};
