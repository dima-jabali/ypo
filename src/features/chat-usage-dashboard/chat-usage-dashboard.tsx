import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUp, ArrowUpDown, Download } from "lucide-react";
import { memo, useState } from "react";
import { titleCase } from "scule";
import { Popover as PopoverPrimitive } from "radix-ui";

import { Card, CardDescription, CardHeader, CardTitle } from "#/components/card";
import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { Input } from "#/components/Input";
import { Loader } from "#/components/Loader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#/components/table";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { fuzzyFilter } from "#/helpers/utils";
import { useDownloadAllUserConversations } from "#/hooks/mutation/use-download-all-user-conversations";
import type { BetterbrainUserId } from "#/types/notebook";
import { WithUsageDashboardData } from "./components/with-chat-usage-dashboard-data";
import {
  useFetchChatUsageData,
  useUsageStats,
  type ChatUsageData,
} from "./hooks/fetch/use-chat-fetch-usage-data";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";

export const ChatUsageDashboard = memo(function ChatUsageDashboard() {
  return (
    <DefaultSuspenseAndErrorBoundary
      fallbackFor="ChatUsageDashboard"
      failedText="Error on Chat Usage Dashboard!"
    >
      <WithUsageDashboardData>
        <Dashboard />
      </WithUsageDashboardData>
    </DefaultSuspenseAndErrorBoundary>
  );
});

function getRowId(originalRow: ChatUsageData) {
  return originalRow.user_id as unknown as string;
}

function DefaultHeader({ column }: { column: Column<ChatUsageData, string | number> }) {
  const isSorted = column.getIsSorted();
  const isAsc = isSorted === "asc";

  return (
    <div className="block">
      <button
        className="flex items-center justify-between w-full gap-4 button-hover px-4 py-2 h-full"
        onClick={() => column.toggleSorting(isAsc)}
        type="button"
      >
        <span>{titleCase((column.columnDef.id as string) || "?")}</span>

        {isAsc ? (
          <ArrowUp className="size-4" />
        ) : isSorted === "desc" ? (
          <ArrowUp className="size-4 rotate-180" />
        ) : (
          <ArrowUpDown className="size-4" />
        )}
      </button>
    </div>
  );
}

function DownloadAllConversationsButton({ userId }: { userId: BetterbrainUserId | undefined }) {
  const downloadAllUserConversations = useDownloadAllUserConversations();
  const organizationId = generalContextStore.use.organizationId();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="button-hover flex size-9 items-center justify-center p-2 rounded-lg"
          disabled={downloadAllUserConversations.isPending}
          title="Download all conversations"
        >
          {downloadAllUserConversations.isPending ? (
            <Loader className="size-4 border-t-primary" />
          ) : (
            <Download className="size-4 text-primary" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="flex flex-col text-xs" align="center" side="right">
        <PopoverPrimitive.Close asChild>
          <button
            className="button-hover p-2 rounded text-left"
            onClick={() =>
              downloadAllUserConversations.mutate({
                return_feedback_only: false,
                organizationId,
                userId,
              })
            }
          >
            Download messages
          </button>
        </PopoverPrimitive.Close>

        <PopoverPrimitive.Close asChild>
          <button
            className="button-hover p-2 rounded text-left"
            onClick={() =>
              downloadAllUserConversations.mutate({
                return_feedback_only: true,
                organizationId,
                userId,
              })
            }
          >
            Download feedback
          </button>
        </PopoverPrimitive.Close>
      </PopoverContent>
    </Popover>
  );
}

function DownloadCell({ row }: { row: Row<ChatUsageData> }) {
  return <DownloadAllConversationsButton userId={row.original.user_id} />;
}

function Dashboard() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const usageData = useFetchChatUsageData();
  const stats = useUsageStats();

  const [columns] = useState(() => {
    const columnHelper = createColumnHelper<ChatUsageData>();

    const columns = [
      // @ts-expect-error => ignore
      columnHelper.accessor("download_button", {
        id: "download_button",
        cell: DownloadCell,
        header: null,
      }),
      columnHelper.accessor("user_name", {
        cell: (info) => (
          <>
            {info.getValue()}{" "}
            <span className="text-muted text-xs">({info.row.original.user_id})</span>
          </>
        ),
        header: DefaultHeader,
        id: "user_name",
      }),
      columnHelper.accessor("email", {
        cell: (info) => info.getValue(),
        header: DefaultHeader,
        id: "email",
      }),
      columnHelper.accessor("num_messages_sent", {
        cell: (info) => info.getValue(),
        header: DefaultHeader,
        id: "num_messages_sent",
      }),
      columnHelper.accessor("num_messages_last_30_days", {
        header: DefaultHeader,
        id: "num_messages_last_30_days",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("num_projects_last_30_days", {
        header: DefaultHeader,
        id: "num_projects_last_30_days",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("num_projects_created", {
        cell: (info) => info.getValue(),
        header: DefaultHeader,
        id: "num_projects_created",
      }),
      columnHelper.accessor("user_id", {
        cell: (info) => info.getValue(),
        header: DefaultHeader,
        id: "user_id",
      }),
    ];

    return columns;
  });

  const table = useReactTable({
    enableColumnResizing: false,
    enableSortingRemoval: true,
    // @ts-expect-error => ignore
    globalFilterFn: "fuzzy", //apply fuzzy filter to the global filter (most common use case for fuzzy filter)
    data: usageData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      columnVisibility: {
        user_id: false,
      },
      sorting,
    },

    getFacetedUniqueValues: getFacetedUniqueValues(), // generate unique values for select filter/autocomplete
    getFacetedMinMaxValues: getFacetedMinMaxValues(), // generate min/max values for range filter
    getFilteredRowModel: getFilteredRowModel(), //client-side filtering
    getFacetedRowModel: getFacetedRowModel(), // client-side faceting
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getRowId,
  });

  return (
    <section className="@container flex flex-col gap-14 h-full w-full p-6 simple-scrollbar">
      <header className="flex w-full items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Chat Usage</h1>
      </header>

      <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-3 @7xl:grid-cols-4">
        {Object.entries(stats).map(([key, value]) => (
          <Card className="@container/card bg-aside border-border-smooth/50" key={key}>
            <CardHeader>
              <CardDescription>{titleCase(key)}</CardDescription>

              <CardTitle className="text-2xl flex items-center justify-between w-full font-semibold tabular-nums @[250px]/card:text-3xl">
                {value}

                {key === "totalMessagesSent" ? (
                  <DownloadAllConversationsButton userId={undefined} />
                ) : null}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center py-4">
          <Input
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            value={table.getState().globalFilter ?? ""}
            placeholder="Filter emails/names..."
            className="max-w-sm"
            type="search"
          />
        </div>

        <div className="overflow-hidden border rounded-lg border-border-smooth">
          <Table className="overflow-hidden rounded-lg">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow className="bg-aside hover:bg-aside font-bold" key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        className="not-last:border-r border-border-smooth p-0 m-0"
                        key={header.id}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow data-state={row.getIsSelected() && "selected"} key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        className="data-[is-download-button=true]:p-0 data-[is-download-button=true]:"
                        data-is-download-button={cell.column.getIndex() === 0}
                        key={cell.id}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-24 text-center" colSpan={columns.length}>
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="size-1 flex-none"></div>
    </section>
  );
}
