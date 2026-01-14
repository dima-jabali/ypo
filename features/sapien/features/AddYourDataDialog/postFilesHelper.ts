import type { AxiosProgressEvent } from "axios";

import type { OrganizationId } from "#/types/general";
import { getErrorMessage, isValidNumber, noop } from "#/helpers/utils";
import { postAndIndexFile } from "../../lib/post-and-index-file";
import type { GeneralFile } from "#/types/notebook";
import { toast } from "#/components/Toast/useToast";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import type { WebsocketContextType } from "#/contexts/Websocket/context";

export async function uploadFilesToBackend({
	organizationId,
	files,
	tryToSubscribeToFileUpdates,
	onUploadProgress,
}: {
	organizationId: OrganizationId | null;
	files: Array<File>;
	tryToSubscribeToFileUpdates:
		| WebsocketContextType["tryToSubscribeToFileUpdates"]
		| undefined;
	onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}) {
	if (!isValidNumber(organizationId)) {
		throw new Error("No organization selected");
	}

	const responses = await Promise.allSettled(
		files.map((file, index) =>
			postAndIndexFile({
				organizationId,
				file,
				onUploadProgress: index === 0 ? (onUploadProgress ?? noop) : noop,
				tryToSubscribeToFileUpdates,
			}),
		),
	);

	const uploadedFiles: Array<GeneralFile> = [];

	responses.forEach((response) => {
		if (response.status === "rejected") {
			toast({
				description: getErrorMessage(response.reason),
				variant: ToastVariant.Destructive,
				title: "Error uploading file",
			});
		} else {
			uploadedFiles.push(response.value.data.file);
		}
	});

	return uploadedFiles;
}
