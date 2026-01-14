import { ChevronLeft } from "lucide-react";

import { handleGoToSapien } from "#/components/layout/utils";
import { SavingSapienTableWarning } from "#/features/sapien/components/saving-batch-table-warning";
import { AddYourDataDialog } from "#/features/sapien/features/AddYourDataDialog/AddYourDataDialog";
import { useBatchTableName } from "#/features/sapien/hooks/get/use-fetch-batch-table-by-id";
import { AIIsThinkingWarning } from "./ai-is-thinking-warning";
import { ExportAs } from "./export-as";

export function PageHeader() {
	return (
		<header
			className="flex gap-2 w-screen h-[70px] border-b border-border-smooth overflow-hidden bg-secondary max-w-full select-none px-3"
			aria-label="Page header"
		>
			<div className="flex flex-col w-full h-full py-1 px-2 gap-0.5">
				<div className="flex items-center justify-between w-full gap-4">
					<div className="flex items-center gap-3">
						<button
							className="flex items-center justify-center size-6 button-hover rounded-full"
							title="Go back to Sapien projects"
							onClick={handleGoToSapien}
						>
							<ChevronLeft className="size-4" />
						</button>

						<BatchTableName />
					</div>

					<div className="flex items-center gap-3">
						<SavingSapienTableWarning />

						<AIIsThinkingWarning />
					</div>
				</div>

				<div className="flex gap-1 items-center">
					<AddYourDataDialog />

					<ExportAs />

					{/* <BatchTableHeaderOptions /> */}
				</div>
			</div>
		</header>
	);
}

function BatchTableName() {
	const batchTableName = useBatchTableName();

	if (!batchTableName) return null;

	return (
		<span
			className="truncate whitespace-nowrap text-lg font-semibold text-primary select-text"
			title={batchTableName}
		>
			{batchTableName}
		</span>
	);
}
