import { useMutation } from "@tanstack/react-query";

import { UPLOAD_FILE_STRING_TO_AWS_ACTION } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { Base64File } from "#/types/general";
import type { AwsBucket, AwsKey } from "../fetch/use-fetch-all-organizations";

type UploadToAwsRequest = {
  fileBase64: Base64File;
  aws_bucket: AwsBucket;
  fileMimeType: string;
  aws_key: AwsKey;
};

type UploadToAwsResponse = null;

const mutationKey = queryKeyFactory.post["upload-file-as-base64-to-aws"].queryKey;

export function useUploadFileAsBase64ToAws() {
  return useMutation<UploadToAwsResponse, Error, UploadToAwsRequest>({
    mutationKey,

    mutationFn: async (args) => {
      const formData = new FormData();
      formData.set("formId", UPLOAD_FILE_STRING_TO_AWS_ACTION);
      formData.set("fileAsBase64String", args.fileBase64);
      formData.set("fileMimeType", args.fileMimeType);
      formData.set("aws_bucket", args.aws_bucket);
      formData.set("aws_key", args.aws_key);

      await fetch("/actions", {
        body: formData,
        method: "POST",
      });

      return null;
    },

    meta: {
      errorTitle: "Error uploading file to AWS!",
    },
  });
}
