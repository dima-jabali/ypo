"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import type { SelectedChannel } from "#/features/data-manager/edit/slack/channels-to-use-as-bot-source-selector";
import { identity } from "#/helpers/utils";
import {
  DatabaseConnectionType,
  type AirtableDatabaseConnection,
  type ClickUpConnectionType,
  type DatabaseConnection,
  type GoogleDriveDatabaseConnection,
  type NormalDatabaseConnection,
  type PlaidConnection,
  type SlackChannel,
  type SlackChannelWithName,
  type SlackConnectionDataWithDefinedChannels,
} from "#/types/databases";
import { queryKeyFactory } from "../query-keys";
import { dataManagerStore } from "#/contexts/data-manager";

export type AllDatabaseConnections = {
  botDatabaseConnections: Array<SlackConnectionDataWithDefinedChannels>;
  airtableDatabaseConnections: Array<AirtableDatabaseConnection>;
  googleDriveDatabases: Array<GoogleDriveDatabaseConnection>;
  allDatabaseConnections: Array<DatabaseConnection>;
  normalDatabases: Array<NormalDatabaseConnection>;
  clickUpConnections: Array<ClickUpConnectionType>;
  plaidConnections: Array<PlaidConnection>;
};

export const DEFAULT_DATABASE_CONNECTION: AllDatabaseConnections = {
  airtableDatabaseConnections: [],
  allDatabaseConnections: [],
  botDatabaseConnections: [],
  googleDriveDatabases: [],
  clickUpConnections: [],
  plaidConnections: [],
  normalDatabases: [],
};

export type FetchDatabasesConnectionsResponse = {
  results: DatabaseConnection[];
};

export function slackChannelWithName(
  channel: SlackChannel | undefined,
): channel is SlackChannelWithName {
  return typeof channel?.name === "string";
}

export function useFetchAllDatabaseConnections<SelectedData = AllDatabaseConnections>(
  select: (data: AllDatabaseConnections) => SelectedData = identity<
    AllDatabaseConnections,
    SelectedData
  >,
) {
  if (typeof window === "undefined") {
    return null;
  }

  const organizationId = generalContextStore.use.organizationId();

  const queryOptions = useMemo(
    () => queryKeyFactory.get["all-database-connections"](organizationId),
    [organizationId],
  );

  return useSuspenseQuery({
    staleTime: 5 * 60 * 1_000, // 5 minutes,
    refetchOnMount: false,
    gcTime: Infinity, // Maintain on cache
    ...queryOptions,
    select,
  });
}

export function useClickupConnection() {
  const connectionId = dataManagerStore.use.connectionId();

  const select = useCallback(
    (data: AllDatabaseConnections) => {
      return data.clickUpConnections.find((connection) => connection.id === connectionId);
    },
    [connectionId],
  );

  const clickupConnection = useFetchAllDatabaseConnections(select).data;

  if (!clickupConnection) {
    throw new Error("No Clickup connection found");
  }

  return clickupConnection;
}

export function useGoogleDriveConnection() {
  const connectionId = dataManagerStore.use.connectionId();

  const select = useCallback(
    (data: AllDatabaseConnections) => {
      return data.googleDriveDatabases.find((connection) => connection.id === connectionId);
    },
    [connectionId],
  );

  const googleDriveConnection = useFetchAllDatabaseConnections(select).data;

  if (!googleDriveConnection) {
    throw new Error("No Google Drive connection found");
  }

  return googleDriveConnection;
}

export function usePlaidConnection() {
  const connectionId = dataManagerStore.use.connectionId();

  const select = useCallback(
    (data: AllDatabaseConnections) => {
      return data.plaidConnections.find((connection) => connection.id === connectionId);
    },
    [connectionId],
  );

  const plaidConnection = useFetchAllDatabaseConnections(select).data;

  if (!plaidConnection) {
    throw new Error("No Plaid connection found");
  }

  return plaidConnection;
}

const isASelectedChannel = (
  channel: SlackConnectionDataWithDefinedChannels["channels"][number],
): channel is SelectedChannel => Boolean(channel.should_index && channel.name);
export function useSlackConnection() {
  const connectionId = dataManagerStore.use.connectionId();

  const select = useCallback(
    (data: AllDatabaseConnections) => {
      return data.botDatabaseConnections.find((connection) => connection.id === connectionId);
    },
    [connectionId],
  );

  const slackConnection = useFetchAllDatabaseConnections(select).data;

  if (!slackConnection) {
    throw new Error("No Slack connection found");
  }

  return useMemo(() => {
    return {
      alreadySelectedChannels: slackConnection.channels.filter(isASelectedChannel),
      slackConnection,
    };
  }, [slackConnection]);
}

export function useAirtableConnection() {
  const connectionId = dataManagerStore.use.connectionId();

  const select = useCallback(
    (data: AllDatabaseConnections) => {
      return data.airtableDatabaseConnections.find((connection) => connection.id === connectionId);
    },
    [connectionId],
  );

  const airtableConnection = useFetchAllDatabaseConnections(select).data;

  if (!airtableConnection) {
    throw new Error("No Airtable connection found");
  }

  return airtableConnection;
}

export function usePostgresConnection() {
  const connectionId = dataManagerStore.use.connectionId();

  const select = useCallback(
    (data: AllDatabaseConnections) => {
      return data.normalDatabases.find(
        (connection) =>
          connection.id === connectionId && connection.type === DatabaseConnectionType.Postgres,
      );
    },
    [connectionId],
  );

  const postgresConnection = useFetchAllDatabaseConnections(select).data;

  if (!postgresConnection) {
    throw new Error("No Postgres connection found");
  }

  return postgresConnection;
}

export function useSnowflakeConnection() {
  const connectionId = dataManagerStore.use.connectionId();

  const select = useCallback(
    (data: AllDatabaseConnections) => {
      return data.normalDatabases.find(
        (connection) =>
          connection.id === connectionId && connection.type === DatabaseConnectionType.Snowflake,
      );
    },
    [connectionId],
  );

  const snowflakeConnection = useFetchAllDatabaseConnections(select).data;

  if (!snowflakeConnection) {
    throw new Error("No Snowflake connection found");
  }

  return snowflakeConnection;
}
