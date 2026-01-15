import { useDeferredValue, useMemo, useReducer, useState } from "react";
import { Table } from "lucide-react";

import { useFetchAllDatabaseConnections } from "#/hooks/fetch/use-fetch-all-database-connections";
import {
	useAllDataframes,
	useDownloadedNotebookId,
} from "#/hooks/fetch/use-fetch-notebook";
import { matchIcon } from "#/icons/match-icon";
import type { NormalDatabaseConnection } from "#/types/databases";
import {
	DataFrameDatabaseConnection,
	NotebookActionType,
	SqlBlockSourceType,
	UpdateBlockActionKey,
	type BlockSql,
	type PatchNotebookAction,
	type Variable,
} from "#/types/notebook";
import { LOADER } from "./Button";
import { Input } from "./Input";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { createISODate } from "#/helpers/utils";
import { usePatchNotebookBlocks } from "#/hooks/mutation/use-patch-notebook-blocks";
import {
	useWithBotConversationId,
	useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";

type Props = {
	selectedDatabaseOrDataframe: NormalDatabaseConnection | Variable | undefined;
	sqlBlock: BlockSql;
	disabled: boolean;
};

export function DatabaseConnectionsModal({
	selectedDatabaseOrDataframe,
	sqlBlock,
	disabled,
}: Props) {
	const normalDatabases = useFetchAllDatabaseConnections().data.normalDatabases;
	const patchNotebookBlocks = usePatchNotebookBlocks();
	const botConversationId = useWithBotConversationId();
	const organizationId = useWithOrganizationId();
	const notebookId = useDownloadedNotebookId();
	const allDataframes = useAllDataframes();

	const [searchValue, setSearchValue] = useState("");

	const [isOpen, setIsOpen] = useReducer(
		(_prev: boolean, next: boolean): boolean => {
			if (next === true) {
				// return !handleTryingToEditVerifiedBlock();
			}

			return next;
		},
		false,
	);

	const deferredSearchValue = useDeferredValue(searchValue);

	const { filteredDatabases, filteredDataframes } = useMemo(() => {
		const searchString = deferredSearchValue.trim().toLowerCase();
		const ret = {
			filteredDatabases: normalDatabases,
			filteredDataframes: allDataframes,
		};

		if (searchString) {
			ret.filteredDataframes = allDataframes.filter(
				(df) =>
					df.name.toLowerCase().includes(searchString) ||
					df.type.toLowerCase().includes(searchString),
			);

			ret.filteredDatabases = normalDatabases.filter(
				(db) =>
					db.name?.toLowerCase().includes(searchString) ||
					db.type.toLowerCase().includes(searchString),
			);
		}

		return ret;
	}, [deferredSearchValue, normalDatabases, allDataframes]);

	function handleSetBlockDatabase(dbOrDataframe: NormalDatabaseConnection) {
		const isDataframe =
			dbOrDataframe.type ===
			(SqlBlockSourceType.Dataframes as unknown as NormalDatabaseConnection["type"]);

		const updates: Array<PatchNotebookAction> = [
			{
				action_type: NotebookActionType.UpdateBlock,
				action_info: {
					value: isDataframe
						? SqlBlockSourceType.Dataframes
						: SqlBlockSourceType.Integration,
					key: UpdateBlockActionKey.SourceType,
					block_uuid: sqlBlock.uuid,
				},
			},
		];

		if (!isDataframe) {
			updates.push({
				action_type: NotebookActionType.UpdateBlock,
				action_info: {
					key: UpdateBlockActionKey.SourceIntegration,
					block_uuid: sqlBlock.uuid,
					value: {
						name: dbOrDataframe.name || "?",
						type: dbOrDataframe.type,
						id: dbOrDataframe.id,
					},
				},
			});
		}

		patchNotebookBlocks.mutate({
			timestamp: createISODate(),
			botConversationId,
			organizationId,
			notebookId,
			updates,
		});
	}

	function handleSetSelectDataframe() {
		handleSetBlockDatabase(DataFrameDatabaseConnection);
		setIsOpen(false);
	}

	function handleSetSelectedDatabase(db: NormalDatabaseConnection) {
		handleSetBlockDatabase(db);
		setIsOpen(false);
	}

	function isActiveDatabase(db: NormalDatabaseConnection | "") {
		return db === selectedDatabaseOrDataframe;
	}

	const isDataframeActive =
		selectedDatabaseOrDataframe?.type ===
		(SqlBlockSourceType.Dataframes as unknown as NormalDatabaseConnection["type"]);

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger
				className="flex items-center justify-center gap-2 p-2 button-hover min-w-[20%] max-w-[25%] text-xs whitespace-nowrap bg-parallel-msg"
				disabled={disabled}
			>
				<span
					title={selectedDatabaseOrDataframe?.name || undefined}
					className="truncate"
				>
					{selectedDatabaseOrDataframe?.name}
				</span>

				{patchNotebookBlocks.isPending ? (
					<div className="flex h-full items-center justify-center px-2 pt-[2px]">
						{LOADER}
					</div>
				) : (
					getDatabaseOrDataframeTypeIcon(selectedDatabaseOrDataframe)
				)}
			</PopoverTrigger>

			<PopoverContent className="z-20 flex max-h-[40vh] flex-col gap-3 overflow-auto rounded-lg scrollbar-stable text-xs">
				{isOpen ? (
					<>
						<Input
							onChange={(e) => setSearchValue(e.target.value)}
							placeholder="Filter..."
							className="flex-none"
							value={searchValue}
							type="text"
							autoFocus
						/>

						<b className="pl-2 text-muted-foreground">Dataframes</b>

						<button
							className="flex flex-col gap-2 rounded-sm p-2 data-[is-active=true]:bg-blue-500/20 button-hover"
							data-is-active={isDataframeActive}
							onClick={handleSetSelectDataframe}
						>
							<p className="text-xs text-primary">
								Reference one of the dataframes in this notebook:
							</p>

							<ul className="flex flex-wrap gap-1">
								{filteredDataframes.map((df, index) => (
									<span
										className="rounded-xs bg-green-800 px-1 font-mono text-sm font-semibold tabular-nums text-green-400"
										key={index}
									>
										{df.name}
									</span>
								))}
							</ul>
						</button>

						<hr className="border-border-smooth" />

						<b className="pl-2 text-muted-foreground">Database Connections</b>

						<ul className="flex flex-col gap-1">
							{filteredDatabases.map((db, index) => (
								<button
									className="flex flex-col gap-1 rounded-sm p-2 text-primary data-[is-active=true]:bg-blue-500/20 button-hover items-start justify-start"
									onClick={() => handleSetSelectedDatabase(db)}
									data-is-active={isActiveDatabase(db)}
									key={index}
								>
									<span className="font-medium">{db.name}</span>

									<p className="flex gap-2 text-xs text-primary">
										{getDatabaseOrDataframeTypeIcon(db)}

										{db.type}
									</p>
								</button>
							))}
						</ul>
					</>
				) : null}
			</PopoverContent>
		</Popover>
	);
}

function getDatabaseOrDataframeTypeIcon(
	dbOrDf: NormalDatabaseConnection | Variable | undefined,
) {
	if (!dbOrDf) {
		return null;
	}

	if (
		dbOrDf?.type ===
		(SqlBlockSourceType.Dataframes as unknown as NormalDatabaseConnection["type"])
	) {
		return <Table className="size-4 flex-none" />;
	}

	return matchIcon(dbOrDf?.type);
}
