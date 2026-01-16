import { Bot } from "lucide-react";

import { SlackIcon } from "#/icons/slack-icon";
import { SnowflakeIcon } from "#/icons/snowflake-icon";
import { DatabaseConnectionType } from "#/types/databases";
import { PostgresDarkIcon } from "#/icons/postgres-dark-icon";
import { BigQueryIcon } from "#/icons/big-query-icon";
import { AirtableIcon } from "#/icons/airtable-icon";
import { GoogleDriveLogoIcon } from "#/icons/google-drive-logo-icon";
import { YoutubeIcon } from "#/icons/youtube-icon";

export const connectionsData = [
  {
    disabled: true,
    kind: DatabaseConnectionType.Snowflake,
    icon: <SnowflakeIcon className="size-[40px] flex-none" />,
    name: "Snowflake",
  },
  {
    disabled: false,
    kind: DatabaseConnectionType.Postgres,
    icon: <PostgresDarkIcon className="size-[40px] flex-none" />,
    name: "Postgres",
  },
  {
    disabled: true,
    kind: DatabaseConnectionType.BigQuery,
    icon: <BigQueryIcon className="size-[40px] flex-none" />,
    name: "BigQuery",
  },
  {
    disabled: false,
    kind: DatabaseConnectionType.Slack,
    icon: <SlackIcon className="size-[40px] flex-none" />,
    name: "Slack",
  },
  {
    disabled: false,
    kind: DatabaseConnectionType.Airtable,
    name: "Airtable",
    icon: <AirtableIcon className="size-[40px] flex-none" />,
  },
  {
    disabled: false,
    kind: DatabaseConnectionType.GoogleDrive,
    icon: <GoogleDriveLogoIcon className="size-[40px] flex-none" />,
    name: "Google Drive",
  },
  {
    disabled: false,
    icon: <Bot className="size-[40px] stroke-white" />,
    kind: DatabaseConnectionType.ExternalDatasource,
    name: "Website",
  },
  {
    disabled: false,
    kind: DatabaseConnectionType.YouTube,
    name: "YouTube",
    icon: <YoutubeIcon className="size-[40px] flex-none" />,
  },
] as const;
