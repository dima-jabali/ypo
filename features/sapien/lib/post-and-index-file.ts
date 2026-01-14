import type { AxiosProgressEvent, AxiosResponse } from "axios";

import { clientAPI_V1 } from "#/api";
import type { OrganizationId } from "#/types/general";
import type { GeneralFile } from "#/types/notebook";
import { matchMimeTypeToGeneralFileTypes } from "#/hooks/fetch/use-fetch-file-by-id";
import type { WebsocketContextType } from "#/contexts/Websocket/context";

export type UploadAndIndexFileResponse = {
	upload_url: string;
	file: GeneralFile;
};

export const postAndIndexFile = async ({
	organizationId,
	options,
	file,
	tryToSubscribeToFileUpdates,
	onUploadProgress,
}: {
	options?: {
		shouldIndex?: boolean;
	};
	organizationId: OrganizationId;
	file: File;
	tryToSubscribeToFileUpdates:
		| WebsocketContextType["tryToSubscribeToFileUpdates"]
		| undefined;
	onUploadProgress: (progressEvent: AxiosProgressEvent) => void;
}) => {
	const shouldIndex = `${options?.shouldIndex ?? true}`;

	const formData = new FormData();

	formData.append("file_type", matchMimeTypeToGeneralFileTypes(file.type));
	formData.append("file_size_bytes", `${file.size}`);
	formData.append("upload_file_to_s3", "true");
	formData.append("file_name", file.name);
	formData.append("index", shouldIndex);
	formData.append("file", file);

	// Request a url to upload the file:
	const response = await clientAPI_V1.post<
		UploadAndIndexFileResponse,
		AxiosResponse<UploadAndIndexFileResponse>
	>(`organizations/${organizationId}/files`, formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
		onUploadProgress,
	});

	if (shouldIndex) {
		tryToSubscribeToFileUpdates?.(response.data.file.id);
	}

	return response;
};
