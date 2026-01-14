import { invariant } from "es-toolkit";

import {
	DELETE_AWS_FILE_ACTION,
	GET_AWS_BASE64_FILE_ACTION,
	GET_AWS_FILE_AS_STRING_BINARY_ACTION,
	isDev,
	UPLOAD_FILE_STRING_TO_AWS_ACTION,
} from "#/helpers/utils";
import type {
	AwsBucket,
	AwsKey,
} from "#/hooks/fetch/use-fetch-all-organizations";
import { getAwsFileAsStringBinaryAction } from "#/server-to-server-requests/get-aws-file-as-binary-string.server-action";
import { uploadFileToAws } from "#/server-to-server-requests/upload-file-to-aws.server-action";
import type { Base64File } from "#/types/general";
import type { Route } from "../+types/root";
import { getAwsBase64File } from "#/server-to-server-requests/get-aws-base64-file.server-action";
import { deleteAwsFile } from "#/server-to-server-requests/delete-aws-file.server-action";

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const formId = formData.get("formId");

	if (isDev) {
		console.log("Catchall action", {
			formData,
			request,
		});
	}

	try {
		switch (formId) {
			case GET_AWS_FILE_AS_STRING_BINARY_ACTION: {
				const fileMimeType = formData.get("fileMimeType") as string;

				invariant(fileMimeType, "Missing fileMimeType");

				const stringBinaryData = await getAwsFileAsStringBinaryAction({
					awsBucket: formData.get("aws_bucket") as AwsBucket,
					awsKey: formData.get("aws_key") as AwsKey,
				});

				const fileAsBase64String = `data:${fileMimeType};base64,${await stringBinaryData.text()}`;

				return fileAsBase64String;
			}

			case GET_AWS_BASE64_FILE_ACTION: {
				const stringBinaryData = await getAwsBase64File({
					awsBucket: formData.get("aws_bucket") as AwsBucket,
					awsKey: formData.get("aws_key") as AwsKey,
				});

				return (await stringBinaryData.text()) as Base64File;
			}

			case UPLOAD_FILE_STRING_TO_AWS_ACTION: {
				const fileMimeType = formData.get("fileMimeType") as string;

				invariant(fileMimeType, "Missing fileMimeType");

				const fileAsBase64String = formData.get("fileAsBase64String") as string;

				const keys = await uploadFileToAws({
					awsBucket: formData.get("aws_bucket") as AwsBucket,
					awsKey: formData.get("aws_key") as AwsKey,
					fileAsBase64String,
					fileMimeType,
				});

				return keys;
			}

			case DELETE_AWS_FILE_ACTION: {
				return await deleteAwsFile({
					awsBucket: formData.get("aws_bucket") as AwsBucket,
					awsKey: formData.get("aws_key") as AwsKey,
				});
			}

			default: {
				console.error("Unknown formId:", formId);

				return {
					error: "Unknown formId",
				};
			}
		}
	} catch (error) {
		console.error("Error in catchall action:", error);

		return { error: "Error in catchall action", status: 500 };
	}
}
