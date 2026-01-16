import type { EntityType, GeneralEntityId, NormalDatabaseConnection } from "#/types/databases";

export type TableName = string;

type FetchFirstLevelPartialSchemaParams = {
  localSetIsLoading: (value: boolean) => void;
  db: NormalDatabaseConnection;
};

export type FetchSchemaRequestParams =
  | { db: NormalDatabaseConnection }
  | {
      db: NormalDatabaseConnection;
      entity_id: GeneralEntityId;
      entity_type: EntityType;
    };

type FetchDeepLevelPartialSchemaParams = FetchSchemaRequestParams &
  FetchFirstLevelPartialSchemaParams;

export type HandleFetchDatabaseSchema = (
  args: FetchFirstLevelPartialSchemaParams | FetchDeepLevelPartialSchemaParams,
) => Promise<void>;

export enum IconType {
  DATABASES_FOLDER = "databases_folder",
  SCHEMAS_FOLDER = "schemas_folder",
  TABLES_FOLDER = "tables_folder",
  GOOGLE_DRIVE = "google_drive",
  POSTGRESQL = "postgresql",
  SNOWFLAKE = "snowflake",
  AIRTABLE = "airtable",
  METABASE = "metabase",
  DATABASE = "database",
  EXTERNAL = "external",
  ORACLE = "oracle",
  SCHEMA = "schema",
  SLACK = "slack",
  FIELD = "field",
  TABLE = "table",
  NONE = "none",
}
