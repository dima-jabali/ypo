import type { DatabaseConnectionType } from "./databases";
import type { PermissionType } from "./notebook";

export type CreateConnectionBase = {
  workspaceEnabled: boolean;
  sqlFormatting: boolean;
  description: string;
  name: string;
};

export type CreateBigQueryConnectionType = CreateConnectionBase & {
  serviceAccountConfig: string;
  dbtFormatting: boolean;
  eDriveAccess: boolean;
  bqStorageAPI: boolean;
  projectId: string;
};

export type PostgressAuthOptions = "Password" | "Certificate";

export interface PostgressAuth {
  Password: {
    username: string;
    password: string;
  };

  Certificate: {
    SSLRootCertificate: string;
    SSLCertificate: string;
    SSLPassword: string;
    username: string;
    password: string;
    SSLKey: string;
  };
}

export type CreatePostgresConnectionType<T extends PostgressAuthOptions> = CreateConnectionBase & {
  auth: PostgressAuth[T];
  dbtFormatting: boolean;
  port: number | string;
  sshConnect: boolean;
  database: string;
  host: string;
};

export type SnowflakeAuthOptions = "UsernamePassword" | "KeyPair";

export interface SnowflakeAuth {
  UsernamePassword: {
    userRole?: string;
    username: string;
    password: string;
  };

  KeyPair: {
    privateKey: string;
    passphrase: string;
    userRole?: string;
    username: string;
  };
}

export type CreateSnowflakeConnectionType<T extends SnowflakeAuthOptions> = CreateConnectionBase & {
  auth: SnowflakeAuth[T];
  dbtFormatting: boolean;
  accountName: string;
  warehouse: string;
  snowPark: boolean;
  database: string;
};

export type AnyConnection =
  | CreateSnowflakeConnectionType<"KeyPair" | "UsernamePassword">
  | CreateBigQueryConnectionType
  | CreatePostgresConnectionType<"Certificate" | "Password">;

export type ConstrainedConnectionData = {
  [DatabaseConnectionType.Postgres]: {
    database: string;
    password: string;
    user: string;
    host: string;
    port: number;
  };
  [DatabaseConnectionType.BigQuery]: {
    description: string;
    name: string;
  };
  [DatabaseConnectionType.BigQuery]: {
    description: string;
    name: string;
  };
  [DatabaseConnectionType.Airtable]: {
    personal_access_token: string;
    client_id?: string;
    // code_verifier: string;
    // redirect_uri: string;
    // code: string;
  };
  [DatabaseConnectionType.GoogleDrive]: {
    service_account_info: JSON_String;
  };
  [DatabaseConnectionType.ExternalDatasource]: null;
  [DatabaseConnectionType.OracleDatabase]: null;
  [DatabaseConnectionType.Snowflake]: null;
  [DatabaseConnectionType.Polygon]: null;
  [DatabaseConnectionType.Spotify]: null;
  [DatabaseConnectionType.YouTube]: null;
  [DatabaseConnectionType.ClickUp]: null;
  [DatabaseConnectionType.Notion]: null;
  [DatabaseConnectionType.Slack]: null;
  [DatabaseConnectionType.Plaid]: null;
};

type JSON_String = string;

export type CreateConnectionObject<T extends DatabaseConnectionType> = {
  connection_info: ConstrainedConnectionData[T];
  connection_type: DatabaseConnectionType;
  permission_type: PermissionType;
  name: string;
};
