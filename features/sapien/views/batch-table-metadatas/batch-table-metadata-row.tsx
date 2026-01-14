import { Play } from "lucide-react";

import type { BatchTable } from "#/types/batch-table";
import { TimeBlock } from "./time-block";
import { UserBlock } from "./user-block";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { EditBatchTableMetadataModal } from "../../components/edit-batch-table-metadata-modal";
import { ProjectsTableCell } from "../../components/projects-table-cell";

type Props = {
	batchTable: BatchTable;
};

export function BatchTableMetadataRow({ batchTable }: Props) {
	function handlePlayClick() {
		generalContextStore.setState({ batchTableId: batchTable.id });
	}

	const rowContents = [
		<EditBatchTableMetadataModal batchTableMetadata={batchTable} key="Edit" />,

		<button
			className="ignore-table-row-click flex h-full w-full items-center justify-center transition-none button-hover"
			title={`Go to batch table: "${batchTable.name}"`}
			onClick={handlePlayClick}
			key="Play"
		>
			<Play className="size-5 fill-positive stroke-positive" />
		</button>,

		<div
			className="max-w-[20rem] truncate p-3"
			title={batchTable.name || ""}
			key="Name"
		>
			{batchTable.name}
		</div>,

		<span
			className="whitespace-nowrap p-3 text-xs"
			title={`${batchTable.id}`}
			key="Id"
		>
			{batchTable.id}
		</span>,

		<UserBlock user={batchTable.created_by!} key="Created by" />,

		<TimeBlock time={batchTable.created_at!} key="Created at" />,

		batchTable.last_modified_by ? (
			<UserBlock user={batchTable.last_modified_by} key="Last modified by" />
		) : (
			<span className="whitespace-nowrap p-3" key="Last modified by">
				Not modified
			</span>
		),

		<TimeBlock time={batchTable.last_modified_at} key="Last modified at" />,
	];

	return rowContents.map((content, i) => (
		<ProjectsTableCell key={i}>{content}</ProjectsTableCell>
	));
}
