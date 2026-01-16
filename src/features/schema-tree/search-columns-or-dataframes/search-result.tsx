import {
  databasesSchemaStore,
  OpenView,
  type DatabaseSchemaState,
} from "#/contexts/databases-schema";
import { highlightString } from "#/helpers/highlight-string";
import { matchIcon } from "#/icons/match-icon";
import { EntityType, type SearchSchemaResponse } from "#/types/databases";
import { IconType } from "../helpers/types";
import { LOCAL_INDICATOR_THAT_TREE_SHOULD_EXPAND } from "../utils";

export const SearchResult: React.FC<{
  previousExpandedSearchResultRef: React.RefObject<string>;
  searchResult: SearchSchemaResponse["results"][number];
  searchStringRegExp: RegExp;
  id: string;
  setOpenView: React.Dispatch<React.SetStateAction<OpenView>>;
}> = ({ previousExpandedSearchResultRef, searchStringRegExp, searchResult, id, setOpenView }) => {
  const isPreviousExpanded = previousExpandedSearchResultRef.current === id;

  const scrollToViewIfPreviouslySelected = (ref: HTMLLIElement | null) => {
    if (isPreviousExpanded) {
      ref?.scrollIntoView({ block: "center" });
    }
  };

  const handleOnSelect = () => {
    const pathToExpand: DatabaseSchemaState["searchResultItemsToExpand"] = [
      LOCAL_INDICATOR_THAT_TREE_SHOULD_EXPAND,
      `${searchResult.result.name}`, // Indicate active button.
      searchResult.connection.id,
    ];

    // 1° level:
    if ("database_name" in searchResult.result) {
      // Top folder to open is 'Databases', 2° level: Database's name
      pathToExpand.push(EntityType.DATABASE, `${searchResult.result.database_name}`);

      // 3° level:
      if ("schemata_id" in searchResult.result) {
        pathToExpand.push(
          EntityType.SCHEMATA,
          `${searchResult.result.schemata_name}`,
          EntityType.TABLE, // 4° level:
          `${searchResult.result.table_name}`,
        );
      } else if ("table_name" in searchResult.result) {
        pathToExpand.push(EntityType.TABLE, `${searchResult.result.table_name}`);
      }
    } else if ("schemata_id" in searchResult.result) {
      // Top level to open is 'Schematas'
      // 2° level: Schemata's name
      pathToExpand.push(EntityType.SCHEMATA, `${searchResult.result.name}`);

      // 3° level:
      if ("table_name" in searchResult.result) {
        pathToExpand.push(EntityType.TABLE, `${searchResult.result.table_name}`);
      }
    } else if ("table_name" in searchResult.result) {
      // Top level to open is 'Tables'
      // 2° level: Table's name
      pathToExpand.push(EntityType.TABLE, `${searchResult.result.table_name}`);
    }

    // Last level:
    pathToExpand.push(searchResult.result.entity_type, `${searchResult.result.name}`);

    databasesSchemaStore.setState({
      searchResultItemsToExpand: pathToExpand,
    });
    setOpenView(OpenView.SearchResultExpandedDatabaseTree);

    previousExpandedSearchResultRef.current = id;
  };

  const relevance = (searchResult.relevance * 100).toFixed(0);
  const relevanceBadge = (
    <span
      className="flex items-center justify-center rounded-xs bg-accent/40 p-1 text-xs tabular-nums leading-none text-purple-300"
      title={`Relevance: ${relevance}%`}
    >
      {relevance}%
    </span>
  );

  const connName = searchResult.connection.name;
  const connType = searchResult.connection.type;
  const name = searchResult.result.name;

  switch (searchResult.result.entity_type) {
    case EntityType.FIELD: {
      const schemaName = searchResult.result.schemata_name;
      const tableName = searchResult.result.table_name;

      return (
        <li
          className="relative flex w-full flex-col items-center gap-2 border-b border-gray-800 p-2 pl-3 transition-none data-[is-previous-expanded=true]:bg-orange-400/20 button-hover"
          data-is-previous-expanded={isPreviousExpanded}
          ref={scrollToViewIfPreviouslySelected}
          onClick={handleOnSelect}
        >
          {name ? (
            <section
              className="flex h-7 w-full items-center justify-between gap-2"
              title={`Field name: ${name}`}
            >
              <span className="flex items-center gap-2">
                {matchIcon(IconType.FIELD)}

                <p className="truncate text-base">{highlightString(name, searchStringRegExp)}</p>
              </span>

              {relevanceBadge}
            </section>
          ) : null}

          {connType && connName ? (
            <section
              title={`Connection name: ${connName}\nConnection type: ${connType}`}
              className="flex h-6 w-full items-center gap-2 pl-6"
            >
              {matchIcon(connType)}

              <p className="truncate text-sm">{highlightString(connName, searchStringRegExp)}</p>
            </section>
          ) : null}

          {schemaName ? (
            <section
              className="flex h-6 w-full items-center gap-2 pl-6"
              title={`Schema name: ${schemaName}`}
            >
              {matchIcon(IconType.SCHEMA)}

              <p className="truncate text-sm">{highlightString(schemaName, searchStringRegExp)}</p>
            </section>
          ) : null}

          {tableName ? (
            <section
              className="flex h-6 w-full items-center gap-2 pl-6"
              title={`Table name: ${tableName}`}
            >
              {matchIcon(IconType.TABLE)}

              <i className="truncate text-sm">{highlightString(tableName, searchStringRegExp)}</i>
            </section>
          ) : null}
        </li>
      );
    }

    case EntityType.DATABASE:
      return (
        <li
          className="relative flex w-full flex-col gap-2 whitespace-nowrap border-b border-gray-800 p-2 pl-3 transition-none data-[is-previous-expanded=true]:bg-orange-400/20 button-hover"
          data-is-previous-expanded={isPreviousExpanded}
          ref={scrollToViewIfPreviouslySelected}
          onClick={handleOnSelect}
        >
          {name ? (
            <section
              className="flex h-7 items-center justify-between gap-2"
              title={`Database name: ${name}`}
            >
              <span className="flex items-center gap-2">
                {matchIcon(IconType.DATABASE)}

                <p className="truncate text-base">{highlightString(name, searchStringRegExp)}</p>
              </span>

              {relevanceBadge}
            </section>
          ) : null}

          {connType && connName ? (
            <section
              title={`Connection name: ${connName}\nConnection type: ${connType}`}
              className="flex h-6 items-center gap-2 pl-6"
            >
              {matchIcon(connType)}

              <p className="truncate text-sm">{highlightString(connName, searchStringRegExp)}</p>
            </section>
          ) : null}
        </li>
      );

    case EntityType.SCHEMATA: {
      const dbName = searchResult.result.database_name;

      return (
        <li
          className="relative flex w-full flex-col gap-2 whitespace-nowrap border-b border-gray-800 p-2 pl-3 transition-none data-[is-previous-expanded=true]:bg-orange-400/20 button-hover"
          data-is-previous-expanded={isPreviousExpanded}
          ref={scrollToViewIfPreviouslySelected}
          onClick={handleOnSelect}
        >
          {name ? (
            <section
              className="flex h-7 items-center justify-between gap-2"
              title={`Schemata name: ${name}`}
            >
              <span className="flex items-center gap-2">
                {matchIcon(IconType.SCHEMA)}

                <p className="truncate text-base">{highlightString(name, searchStringRegExp)}</p>
              </span>

              {relevanceBadge}
            </section>
          ) : null}

          {connType && connName ? (
            <section
              title={`Connection name: ${connName}\nConnection type: ${connType}`}
              className="flex h-6 items-center gap-2 pl-6"
            >
              {matchIcon(connType)}

              <p className="truncate text-sm">{highlightString(connName, searchStringRegExp)}</p>
            </section>
          ) : null}

          {dbName ? (
            <section
              className="flex h-6 items-center gap-2 pl-6"
              title={`Database name: ${dbName}`}
            >
              {matchIcon(IconType.DATABASE)}

              <p className="truncate text-sm">{highlightString(dbName, searchStringRegExp)}</p>
            </section>
          ) : null}
        </li>
      );
    }

    case EntityType.TABLE: {
      const tableCatalogName =
        searchResult.result.extra_info && "table_catalog" in searchResult.result.extra_info
          ? // Casting here because the types for extra_info are non-existent:
            (searchResult.result.extra_info.table_catalog as string)
          : "";
      const schemaName = searchResult.result.schemata_name;

      return (
        <li
          className="relative flex w-full flex-col gap-2 whitespace-nowrap border-b border-gray-800 p-2 pl-3 transition-none data-[is-previous-expanded=true]:bg-orange-400/20 button-hover"
          data-is-previous-expanded={isPreviousExpanded}
          ref={scrollToViewIfPreviouslySelected}
          onClick={handleOnSelect}
        >
          {name ? (
            <section
              className="flex h-7 items-center justify-between gap-2"
              title={`Table name: ${name}`}
            >
              <span className="flex items-center gap-2">
                {matchIcon(IconType.TABLE)}

                <p className="truncate text-base">{highlightString(name, searchStringRegExp)}</p>
              </span>

              {relevanceBadge}
            </section>
          ) : null}

          {connType && connName ? (
            <section
              title={`Connection name: ${connName}\nConnection type: ${connType}`}
              className="flex h-6 items-center gap-2 pl-6"
            >
              {matchIcon(connType)}

              <p className="truncate text-sm">{highlightString(connName, searchStringRegExp)}</p>
            </section>
          ) : null}

          {schemaName ? (
            <section
              className="flex h-6 items-center gap-2 pl-6"
              title={`Schema name: ${schemaName}`}
            >
              {matchIcon(IconType.SCHEMA)}

              <p className="truncate text-sm">{highlightString(schemaName, searchStringRegExp)}</p>
            </section>
          ) : null}

          {tableCatalogName ? (
            <section
              className="flex h-6 items-center gap-2 pl-6"
              title={`Table catalog name: ${tableCatalogName}`}
            >
              {matchIcon(IconType.TABLES_FOLDER)}

              <p className="truncate text-sm">
                {highlightString(tableCatalogName, searchStringRegExp)}
              </p>
            </section>
          ) : null}
        </li>
      );
    }

    default:
      console.log("Unhandled search result!", { searchResult });
      return null;
  }
};
