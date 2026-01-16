import { ExternalLinkIcon } from "lucide-react";

import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { BetterBrainIcon } from "#/icons/betterbrain-icon";
import { BigQueryIcon } from "#/icons/big-query-icon";
import { MetabaseIcon } from "#/icons/metabase-icon";
import { PostgresDarkIcon } from "#/icons/postgres-dark-icon";
import { SnowflakeIcon } from "#/icons/snowflake-icon";
import { DatabaseConnectionType, type DatabaseConnection } from "#/types/databases";
import type { SimilarQuery } from "#/types/notebook";
import { QueryEntityType } from "#/types/post-block-update-types";

export const SEARCH_FOR_MATCHES_ON_ALL_BLOCKS = "search-for-matches-on-all-blocks";

export const handleCopyCodeToClipboard = async (query: SimilarQuery["query"]) => {
  try {
    await navigator.clipboard.writeText(query.answer);

    toast({
      title: "Code copied to clipboard",
      variant: ToastVariant.Success,
    });
  } catch (error) {
    console.error(error);
  }
};

export const matchQueryTag = (query: SimilarQuery["query"]) => {
  switch (query.entity_type) {
    case QueryEntityType.METABASE_CARD:
      return MetabaseTag;

    case QueryEntityType.MODE_DEFINITION:
      return ModeDefinitionTag;

    case QueryEntityType.MODE_QUERY:
      return ModeQueryTag;

    case QueryEntityType.SQL_QUERY:
      return BetterBrainTag;

    default:
      console.error("Query type not supported!", { query });
      return BetterBrainTag;
  }
};

export const getUserInfo = (query: SimilarQuery["query"]) => {
  const userInfo = {
    firstNameOrEmail: "",
    fullName: "",
    imgUrl: "",
    email: "",
  };

  switch (query.entity_type) {
    case QueryEntityType.METABASE_CARD: {
      const user = query.metabase_card.creator;

      if (!user) return;

      if (user.first_name) {
        userInfo.firstNameOrEmail += user.first_name;
        userInfo.fullName += user.first_name;
      }
      if (user.last_name) {
        userInfo.fullName += ` ${user.last_name}`;
      }

      if (!userInfo.firstNameOrEmail) {
        userInfo.firstNameOrEmail = user.email.toLocaleLowerCase();
      }

      userInfo.email = user.email.toLocaleLowerCase() ?? "";

      break;
    }

    case QueryEntityType.SQL_QUERY: {
      const user = query.user;

      if (!user) return;

      if (user.first_name) {
        userInfo.firstNameOrEmail += user.first_name;
        userInfo.fullName += user.first_name;
      }
      if (user.last_name) {
        userInfo.fullName += ` ${user.last_name}`;
      }

      if (!userInfo.firstNameOrEmail) {
        userInfo.firstNameOrEmail = user.email.toLocaleLowerCase();
      }

      userInfo.email = user.email.toLocaleLowerCase();
      userInfo.imgUrl = user.image_url ?? "";

      break;
    }

    case QueryEntityType.MODE_QUERY: {
      const user = query.mode_query.creator;

      if (!user) return;

      if (user.name) {
        userInfo.fullName += user.name;
      }
      if (user.username) {
        userInfo.firstNameOrEmail += user.username;
      }

      if (!userInfo.firstNameOrEmail) {
        userInfo.firstNameOrEmail = user.email.toLocaleLowerCase();
      }

      if (!userInfo.firstNameOrEmail) return;

      break;
    }

    case QueryEntityType.MODE_DEFINITION: {
      const user = query.mode_definition.creator;

      if (!user) return;

      if (user.name) {
        userInfo.fullName += user.name;
      }
      if (user.username) {
        userInfo.firstNameOrEmail += user.username;
      }

      if (!userInfo.firstNameOrEmail) {
        userInfo.firstNameOrEmail = user.email.toLocaleLowerCase();
      }

      if (!userInfo.firstNameOrEmail) return;

      break;
    }

    default:
      console.error("Query user info not supported:", { query });
      return;
  }

  return userInfo;
};

export const getQueryDescription = (query: SimilarQuery["query"]) => {
  switch (query.entity_type) {
    case QueryEntityType.METABASE_CARD:
      return query.metabase_card.description || query.metabase_card.name;

    case QueryEntityType.SQL_QUERY:
      return query.prompt;

    case QueryEntityType.MODE_QUERY:
      return query.mode_query.name;

    case QueryEntityType.MODE_DEFINITION:
      return query.mode_definition.description;

    default:
      console.error("Query description info not supported:", { query });
      return;
  }
};

export const getQueryUrl = (query: SimilarQuery["query"]) => {
  switch (query.entity_type) {
    case QueryEntityType.MODE_QUERY:
      return query.mode_query.url;

    case QueryEntityType.MODE_DEFINITION:
      return query.mode_definition.url;

    case QueryEntityType.SQL_QUERY:
      return;

    default:
      console.error("Query external url not supported:", query.entity_type, {
        query,
      });
      return;
  }
};

export const getConnectionInfo = (query: SimilarQuery["query"]) => {
  const connectionInfo = {
    name: "",
  };

  switch (query.entity_type) {
    case QueryEntityType.MODE_QUERY:
      connectionInfo.name = query.mode_query.mode_data_connection?.name || "";
      break;

    case QueryEntityType.MODE_DEFINITION:
      connectionInfo.name = query.mode_definition.mode_data_connection?.name || "";
      break;

    default:
      console.error("Query connection not supported:", query.entity_type, {
        query,
      });
      return;
  }

  return connectionInfo;
};

export const getQueryRunCount = (query: SimilarQuery["query"]) => {
  switch (query.entity_type) {
    case QueryEntityType.MODE_QUERY:
      return query.mode_query.run_count;

    case QueryEntityType.MODE_DEFINITION:
    case QueryEntityType.SQL_QUERY:
      return;

    default:
      console.error("Query run count not supported:", query.entity_type, {
        query,
      });
      return;
  }
};

export function getDbState(query: SimilarQuery["query"]): QueryState | undefined {
  switch (query.entity_type) {
    case QueryEntityType.MODE_QUERY:
      return query.mode_query.state;

    case QueryEntityType.MODE_DEFINITION:
      return query.mode_definition.state;

    case QueryEntityType.SQL_QUERY:
      return;

    default:
      console.error("Query database state not supported:", query.entity_type, {
        query,
      });
      return;
  }
}

export function getDbInfoJSX(
  query: SimilarQuery["query"],
  databases: DatabaseConnection[] | undefined,
) {
  let dbName;
  let ICON;

  const db = databases?.find(
    (db) => db.id === query.connection_id && db.type === query.connection_type,
  );

  switch (query.connection_type) {
    case DatabaseConnectionType.Snowflake:
      ICON = <SnowflakeIcon />;
      dbName = db?.name;
      break;

    case DatabaseConnectionType.Postgres:
      ICON = <PostgresDarkIcon />;
      dbName = db?.name;
      break;

    case DatabaseConnectionType.BigQuery:
      ICON = <BigQueryIcon />;
      dbName = db?.name;
      break;

    case DatabaseConnectionType.ExternalDatasource: {
      const connectionInfo = getConnectionInfo(query);

      dbName = connectionInfo?.name;
      ICON = <ExternalLinkIcon />;
      break;
    }

    default:
      console.error("Query database type not supported:", query.connection_type, { query });
      return null;
  }

  return (
    <li className="flex flex-wrap" title={`Database Name: ${dbName}`}>
      {ICON}&nbsp;{dbName}
    </li>
  );
}

const MetabaseTag = (
  <span className="flex flex-none items-center justify-center text-sm" title="Query from: Metabase">
    <MetabaseIcon className="size-5" />
  </span>
);

const BetterBrainTag = (
  <span
    className="flex flex-none items-center justify-center text-sm"
    title="Query from: BetterBrain"
  >
    <BetterBrainIcon className="size-5 fill-primary" />
  </span>
);

const ModeDefinitionTag = (
  <span
    className="flex flex-none items-center justify-center text-sm"
    title="Query from: Mode Analytics"
  >
    <img alt="Green capital letter 'm'" src="/mode-query.png" height={20} width={20} />
  </span>
);

const ModeQueryTag = (
  <span
    className="flex flex-none items-center justify-center text-sm"
    title="Query from: Mode Analytics"
  >
    <img alt="Green capital letter 'm'" src="/mode-query.png" height={20} width={20} />
  </span>
);

export const NICE_QUERY_ENTITY_NAME = {
  [QueryEntityType.MODE_DEFINITION]: "Mode Analytics",
  [QueryEntityType.MODE_QUERY]: "Mode Analytics",
  [QueryEntityType.METABASE_CARD]: "Metabase",
  [QueryEntityType.SQL_QUERY]: "BetterBrain",
};

export enum QueryState {
  DELETED = "DELETED",
  ACTIVE = "ACTIVE",
}
