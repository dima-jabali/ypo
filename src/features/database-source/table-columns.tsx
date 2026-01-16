import { Columns3, X } from "lucide-react";

import { databasesSchemaStore } from "#/contexts/databases-schema";

export function TableColumns() {
  const columns = databasesSchemaStore.use.columns();
  const title = databasesSchemaStore.use.title();

  if (!columns) return null;

  function handleClose() {
    databasesSchemaStore.setState({
      columns: null,
      title: null,
    });
  }

  return (
    <div className="relative flex w-full overflow-hidden max-h-full flex-1 flex-col border-t border-border-smooth">
      <header className="mb-1 flex w-full items-center justify-between whitespace-nowrap p-2 font-bold">
        <div className="flex max-w-[90%] items-center gap-3">
          <Columns3 className="w-6 flex-none stroke-gray-500 stroke-[1px]" />

          <p
            className="overflow-clip truncate text-ellipsis font-mono tabular-nums"
            title={title || ""}
          >
            {title}
          </p>

          <span className="rounded-sm bg-green-300/50 px-1 font-mono text-sm tabular-nums">
            {columns.length} cols
          </span>
        </div>

        <button className="button-hover shrink-0 p-1" onPointerUp={handleClose} title="Close">
          <X className="w-5 stroke-gray-500 stroke-[1px]" />
        </button>
      </header>

      <div className="simple-scrollbar pb-2">
        <div className="flex flex-col">
          {columns.map((item, index) => {
            let dataType = "";

            if (item.extra_info && "data_type" in item.extra_info) {
              dataType = item.extra_info.data_type as string;
            }

            return (
              <li
                className="flex min-h-max items-center justify-between gap-3 px-3 py-1 text-sm leading-8 transition-none hover:bg-button-hover"
                key={index}
              >
                {item.name ? (
                  <p className="truncate font-mono font-bold" title={item.name}>
                    {item.name}
                  </p>
                ) : null}

                <p className="font-mono text-xs font-light text-primary" title={dataType}>
                  {dataType}
                </p>
              </li>
            );
          })}
        </div>
      </div>
    </div>
  );
}
