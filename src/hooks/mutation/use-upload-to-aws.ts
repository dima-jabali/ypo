import { useMutation } from "@tanstack/react-query";

import { UPLOAD_FILE_TO_AWS } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { AwsBucket, AwsKey } from "../fetch/use-fetch-all-organizations";

type UploadToAwsRequest = {
	aws_bucket: AwsBucket;
	aws_key: AwsKey;
	file: File;
};

type UploadToAwsResponse = null;

const mutationKey = queryKeyFactory.post["upload-file-to-aws"].queryKey;

export function useUploadFileToAws() {
	return useMutation<UploadToAwsResponse, Error, UploadToAwsRequest>({
		mutationKey,

		mutationFn: async (args) => {
			const getPresignedUrlFormData = new FormData();
			getPresignedUrlFormData.set("fileMimeType", args.file.type);
			getPresignedUrlFormData.set("aws_bucket", args.aws_bucket);
			getPresignedUrlFormData.set("formId", UPLOAD_FILE_TO_AWS);
			getPresignedUrlFormData.set("aws_key", args.aws_key);
			getPresignedUrlFormData.set("file", args.file);

			await fetch(
				`/actions?form-id=${UPLOAD_FILE_TO_AWS}&aws-key=${args.aws_key}&aws-bucket=${args.aws_bucket}`,
				{
					body: getPresignedUrlFormData,
					method: "POST",
					headers: {
						// "Content-Type": args.file.type,
						"x-file-name": args.file.name, // Pass metadata in headers
					},
				},
			);

			return null;
		},

		meta: {
			errorTitle: "Error uploading file to AWS!",
		},
	});
}
