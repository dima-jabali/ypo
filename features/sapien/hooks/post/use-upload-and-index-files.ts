import { useMutation } from "@tanstack/react-query";

import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { useWebsocketStore } from "#/contexts/Websocket/context";
import { getErrorMessage, isValidNumber, noop } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { FileId } from "#/types/general";
import { postAndIndexFile } from "../../lib/post-and-index-file";

const mutationKey = queryKeyFactory.post["upload-and-index-files"].queryKey;

type UploadAndIndexFilesRequest = Array<File>;

type UploadAndIndexFilesResponse = {
	uploadedFileIds: Array<FileId>;
};

export function useUploadAndIndexFiles() {
	const organizationId = generalContextStore.use.organizationId();
	const websocketStore = useWebsocketStore();

	return useMutation<
		UploadAndIndexFilesResponse,
		Error,
		UploadAndIndexFilesRequest
	>({
		mutationKey,

		mutationFn: async (files) => {
			if (!isValidNumber(organizationId)) {
				throw new Error("No organization selected");
			}

			const responses = await Promise.allSettled(
				files.map((file) =>
					postAndIndexFile({
						tryToSubscribeToFileUpdates:
							websocketStore.tryToSubscribeToFileUpdates,
						onUploadProgress: noop,
						organizationId,
						file,
					}),
				),
			);

			const uploadedFileIds: Array<FileId> = [];

			responses.forEach((response) => {
				if (response.status === "rejected") {
					toast({
						description: getErrorMessage(response.reason),
						variant: ToastVariant.Destructive,
						title: "Error uploading file",
					});
				} else {
					const fileId = response.value.data.file.id;

					if (isValidNumber(fileId)) {
						uploadedFileIds.push(fileId);
					} else {
						console.error("Invalid file id", { fileId });
					}
				}
			});

			return { uploadedFileIds };
		},
	});
}
