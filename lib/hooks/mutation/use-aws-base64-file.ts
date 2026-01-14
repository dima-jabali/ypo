import { skipToken, useQuery } from "@tanstack/react-query";
import { invariant } from "es-toolkit";

import { GET_AWS_BASE64_FILE_ACTION } from "#/helpers/utils";
import type { Base64File } from "#/types/general";
import type { AwsBucket, AwsKey } from "../fetch/use-fetch-all-organizations";
import { queryKeyFactory } from "../query-keys";

export type FetchAwsBase64FileProps = {
	aws_bucket: AwsBucket | null | undefined;
	aws_key: AwsKey | null | undefined;
};

export function useAwsBase64File({
	aws_bucket,
	aws_key,
}: FetchAwsBase64FileProps) {
	const enabled = !!aws_bucket && !!aws_key;

	return useQuery({
		staleTime: Infinity,
		throwOnError: false,
		enabled,

		queryKey: [
			...queryKeyFactory.get["aws-base64-file"].queryKey,
			aws_bucket,
			aws_key,
		],

		queryFn: enabled
			? async () => {
					const formData = new FormData();
					formData.set("formId", GET_AWS_BASE64_FILE_ACTION);
					formData.set("aws_bucket", aws_bucket);
					formData.set("aws_key", aws_key);

					const res = await fetch("/actions", {
						body: formData,
						method: "POST",
					});

					const img = await res.text();

					invariant(img, "No fileAsBase64String!");

					return img as Base64File;
				}
			: skipToken,

		meta: {
			errorTitle: "Error downloading AWS base64 file!",
		},
	});
}
