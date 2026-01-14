import { useMutation } from "@tanstack/react-query";
import { invariant } from "es-toolkit";

import { GET_AWS_FILE_AS_STRING_BINARY_ACTION } from "#/helpers/utils";
import type { GoogleDriveVerboseSource } from "#/types/chat";
import type { GeneralFileType } from "#/types/notebook";
import type { AwsBucket, AwsKey } from "../fetch/use-fetch-all-organizations";
import { queryKeyFactory } from "../query-keys";

export type FileToDownload = {
	type: GeneralFileType.CSV;
	variable_name: string;
	aws_bucket: AwsBucket;
	executed: boolean;
	aws_key: AwsKey;
};

export type FetchAwsImageProps =
	GoogleDriveVerboseSource["content_list"][0]["image_url"] & {
		fileName: string;
	};

const mutationKey = queryKeyFactory.get["aws-csv-file"].queryKey;

export function useDownloadAwsCsvFile({
	variable_name,
	aws_bucket,
	aws_key,
}: FileToDownload) {
	return useMutation({
		mutationKey,

		mutationFn: async () => {
			const formData = new FormData();
			formData.set("formId", GET_AWS_FILE_AS_STRING_BINARY_ACTION);
			formData.set("fileMimeType", "text/csv");
			formData.set("aws_bucket", aws_bucket);
			formData.set("aws_key", aws_key);

			const res = await fetch("/actions", {
				body: formData,
				method: "POST",
			});

			const csvBase64String = await res.text();

			invariant(csvBase64String, "No fileAsBase64String!");

			const blob = await fetch(csvBase64String).then((res) => res.blob());

			const fileUrl = URL.createObjectURL(blob);

			const a = document.createElement("a");
			a.download = `${variable_name}.csv`;
			a.href = fileUrl;

			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);

			URL.revokeObjectURL(fileUrl);

			return null;
		},

		meta: {
			errorTitle: "Error downloading AWS CSV file!",
		},
	});
}
