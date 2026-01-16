import { type SourceForUserType } from "#/types/chat";
import { useSourcesForUserCtx } from "../ctx";
import type { NormalizedSource } from "../get-top-n-sources";
import { HighlightStringWithFilterRegex } from "../highlight-string-with-filter-regex";

type Props = {
  normalizedSource: Extract<NormalizedSource, { source_type: SourceForUserType.DataSchema }>;
};

export function DataSchemaTable({ normalizedSource }: Props) {
  const sourcesForUserCtx = useSourcesForUserCtx();

  const { values } = normalizedSource;

  function remeasureHeight(e: React.ToggleEvent<HTMLDetailsElement>) {
    if (e.newState === "closed") {
      requestAnimationFrame(() => {
        sourcesForUserCtx.getState().measure();
      });
    }
  }

  return (
    <details onToggle={remeasureHeight}>
      <summary className="text-xs hover:underline underline-offset-2 cursor-pointer my-1">
        More info
      </summary>

      <section className="w-[95%] border border-border-smooth rounded-md bg-muted/20 flex gap-1 flex-col py-1 simple-scrollbar whitespace-nowrap text-xs">
        <table>
          <tbody className="[&_th]:px-2 [&_tr:nth-child(even)]:bg-muted/30">
            <tr>
              <th>Connection type</th>

              <td>
                <HighlightStringWithFilterRegex string={`${values.connection_type}`} />
              </td>
            </tr>

            <tr>
              <th>Connection ID</th>

              <td>
                <HighlightStringWithFilterRegex string={`${values.connection_id}`} />
              </td>
            </tr>

            <tr>
              <th>Database name</th>

              <td>
                <HighlightStringWithFilterRegex string={`${values.database_name}`} />
              </td>
            </tr>

            <tr>
              <th>Database ID</th>

              <td>
                <HighlightStringWithFilterRegex string={`${values.database_id}`} />
              </td>
            </tr>

            <tr>
              <th>Table ID</th>

              <td>
                <HighlightStringWithFilterRegex string={`${values.table_id}`} />
              </td>
            </tr>

            <tr>
              <th>Table Name</th>

              <td>
                <HighlightStringWithFilterRegex string={`${values.table_name}`} />
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </details>
  );
}

export function DataSchemaTitleLink({ normalizedSource }: Props) {
  // 	const setDatabasesSchemaData = useSetDatabasesSchemaData();
  //
  // 	const handleShowDataSchema = () => {
  // 		const pathToExpand: Array<TableName | TableID> = [
  // 			LOCAL_INDICATOR_THAT_TREE_SHOULD_EXPAND,
  // 			`${source.name}`, // Indicate active button.
  // 			source.connection_id,
  // 		];
  //
  // 		// 1° level:
  // 		if (source.database_name) {
  // 			// Top folder to open is 'Databases', 2° level: Database's name
  // 			pathToExpand.push(EntityType.DATABASE, `${source.database_name}`);
  //
  // 			// 3° level:
  // 			if (source.schemata_id > -1) {
  // 				pathToExpand.push(
  // 					EntityType.SCHEMATA,
  // 					`${source.schemata_name}`,
  // 					EntityType.TABLE, // 4° level:
  // 					`${source.table_name}`,
  // 				);
  // 			} else if (source.table_name) {
  // 				pathToExpand.push(EntityType.TABLE, `${source.table_name}`);
  // 			}
  // 		} else if (source.schemata_id > -1) {
  // 			// Top level to open is 'Schematas'
  // 			// 2° level: Schemata's name
  // 			pathToExpand.push(EntityType.SCHEMATA, `${source.name}`);
  //
  // 			// 3° level:
  // 			if (source.table_name) {
  // 				pathToExpand.push(EntityType.TABLE, `${source.table_name}`);
  // 			}
  // 		} else if (source.table_name) {
  // 			// Top level to open is 'Tables'
  // 			// 2° level: Table's name
  // 			pathToExpand.push(EntityType.TABLE, `${source.table_name}`);
  // 		}
  //
  // 		// Last level:
  // 		pathToExpand.push(source.entity_type, `${source.name}`);
  //
  // 		setDatabasesSchemaData({ searchResultItemsToExpand: pathToExpand });
  //
  // 		dispatch(
  // 			setSchemaToShow({
  // 				connectionType: source.connection_type,
  // 				id: source.connection_id,
  // 			}),
  // 		);
  //
  // 		console.log({ pathToExpand, source });
  // 	};

  const { values } = normalizedSource;

  return (
    <a
      className="max-h-full break-all truncate group-data-[is-drawer]/drawer:font-bold group-data-[is-drawer]/drawer:text-base group-data-[is-drawer]/drawer:link group-data-[is-drawer]/drawer:hover:underline"
      href={`#show-schema?conn-type=${values.connection_type}&conn-id=${values.connection_id}&name=${values.name}`}
      // onClick={handleShowDataSchema}
      title={values.name}
    >
      <HighlightStringWithFilterRegex string={`${values.name}`} />
    </a>
  );
}
