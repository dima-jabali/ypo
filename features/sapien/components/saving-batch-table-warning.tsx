import { useIsMutating } from "@tanstack/react-query";
import { Cloud, CloudUpload } from "lucide-react";
import { isEqual } from "es-toolkit";

import { queryKeyFactory } from "#/hooks/query-keys";

const patchMutationKey = queryKeyFactory.patch["batch-table-by-id"].queryKey;
const putMutationKey = queryKeyFactory.put["batch-table-metadata"].queryKey;

export function SavingSapienTableWarning() {
	const isSavingSapienTable = useIsMutating({
		predicate(mutation) {
			return (
				isEqual(mutation.options.mutationKey, patchMutationKey) ||
				isEqual(mutation.options.mutationKey, putMutationKey)
			);
		},
	});

	return (
		<div
			className="flex flex-none items-center justify-center text-muted text-xs gap-2"
			title={`Status: sav${isSavingSapienTable ? "ing" : "ed"}`}
		>
			{isSavingSapienTable ? (
				<CloudUpload className="size-4" />
			) : (
				<Cloud className="size-4" />
			)}

			<span>{isSavingSapienTable ? "Saving..." : null}</span>
		</div>
	);
}
