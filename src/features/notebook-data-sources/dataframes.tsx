import { Columns3 } from "lucide-react";

import { Separator } from "#/components/separator";
import { databasesSchemaStore } from "#/contexts/databases-schema";
import { useFetchNotebook } from "#/hooks/fetch/use-fetch-notebook";
import type { Variable } from "#/types/notebook";

export function Dataframes() {
  const notebook = useFetchNotebook();

  const notebookVariables = notebook.metadata.variable_info;
  const dataframes: [string, Variable][] = [];

  if (notebookVariables && notebook.blocks) {
    // Sort according to position on notebook:
    for (const block of notebook.blocks) {
      if (block.write_variables) {
        for (const { name } of block.write_variables) {
          if (name) {
            const info = notebookVariables[name];

            if (info && "type" in info && info.type === "DataFrame") {
              dataframes.push([name as string, info]);
            }
          }
        }
      }
    }
  }

  return (
    <>
      <header className="mb-1 block w-full pl-2 pt-3 text-sm font-bold tabular-nums text-primary">
        All dataframes used in this project
        <span className="ml-1 font-light">({dataframes.length})</span>
      </header>

      <Separator />

      <div className="simple-scrollbar h-full">
        <div className="mt-2 flex w-full flex-col">
          {dataframes.map(([name, info]) => {
            const columns = info.columns?.map((col) => ({
              extra_info: { data_type: col.type },
              name: col.name,
            }));

            return (
              <button
                onClick={() => {
                  if (columns) {
                    databasesSchemaStore.setState({
                      title: name,
                      // @ts-expect-error => At this point, the only vars
                      // that will be used are name and extra_info.data_type:
                      columns,
                    });
                  } else {
                    console.error("No columns information available", {
                      name,
                      info,
                    });
                  }
                }}
                className="button-hover flex w-full items-center gap-2 px-4 py-1 font-mono text-sm"
                title={name}
                key={name}
              >
                <Columns3 className="w-6 stroke-gray-500 flex-none stroke-[1px]" />

                {name}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
