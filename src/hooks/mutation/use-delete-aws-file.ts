import { useMutation } from "@tanstack/react-query";

import { DELETE_AWS_FILE_ACTION } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { AwsBucket, AwsKey } from "../fetch/use-fetch-all-organizations";

type DeleteAwsFileRequest = {
	aws_bucket: AwsBucket;
	aws_key: AwsKey;
};

type DeleteAwsFileResponse = null;

const mutationKey = queryKeyFactory.delete["delete-aws-file"].queryKey;

export function useDeleteAwsFile() {
	return useMutation<DeleteAwsFileResponse, Error, DeleteAwsFileRequest>({
		mutationKey,

		mutationFn: async (args) => {
			const formData = new FormData();
			formData.set("formId", DELETE_AWS_FILE_ACTION);
			formData.set("aws_bucket", args.aws_bucket);
			formData.set("aws_key", args.aws_key);

			await fetch("/actions", {
				body: formData,
				method: "POST",
			});

			return null;
		},

		meta: {
			errorTitle: "Error deleting AWS file!",
		},
	});
}
