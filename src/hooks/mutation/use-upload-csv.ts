import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import { clientAPI_V1 } from "#/api";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { createISODate, fileToTextString, isValidNumber, prettyBytes } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { ISODateString } from "#/types/general";
import type { NotebookBlockUuid } from "#/types/notebook";
import { PostBlockActionType, type PostBlockResponse } from "#/types/post-block-update-types";
import { useMemo } from "react";
import { useDownloadedNotebookId } from "../fetch/use-fetch-notebook";
import { applyNotebookResponseUpdates } from "#/helpers/apply-notebook-response-updates";

type GeneratePresignedUploadUrlActionInfo = {
  file_name: string;
};

type GeneratePresignedUploadUrlAction = {
  action_type: PostBlockActionType.GeneratePresignedUploadUrl;
  action_info: GeneratePresignedUploadUrlActionInfo;
  timestamp: ISODateString;
};

type GeneratePresignedUploadURLResponse = PostBlockResponse<{
  upload_url: string;
}>;

type UploadCsvRequest = {
  bytesParagraphRef: React.RefObject<HTMLParagraphElement | null>;
  progressRef: React.RefObject<HTMLProgressElement | null>;
  blockUuid: NotebookBlockUuid;
  file: File;
};

type UploadCsvResponse = {
  status: 201;
};

export function useUploadCsv(blockUuid: NotebookBlockUuid) {
  const botConversationId = generalContextStore.use.botConversationId();
  const notebookId = useDownloadedNotebookId();
  const organizationId = generalContextStore.use.organizationId();

  const mutationKey = useMemo(
    () => queryKeyFactory.post["block-request"]._ctx["upload-csv"](blockUuid).queryKey,
    [blockUuid],
  );

  return useMutation<UploadCsvResponse, Error, UploadCsvRequest>({
    mutationKey,

    meta: {
      errorTitle: "Error uploading CSV file!",
    },

    mutationFn: async (args) => {
      if (!isValidNumber(botConversationId)) {
        throw new Error("Bot conversation id is not valid");
      }

      const path = `/blocks/${args.blockUuid}/action`;

      const action: GeneratePresignedUploadUrlAction = {
        action_type: PostBlockActionType.GeneratePresignedUploadUrl,
        action_info: { file_name: args.file.name },
        timestamp: createISODate(),
      };

      const generateUploadUrlResponse = await clientAPI_V1.post<GeneratePresignedUploadURLResponse>(
        path,
        action,
      );

      if (generateUploadUrlResponse.data.action_output?.error) {
        throw new Error(generateUploadUrlResponse.data.action_output.error);
      }

      const uploadUrl = generateUploadUrlResponse.data.action_output.upload_url;

      if (!uploadUrl) {
        throw new Error("No upload url!");
      }

      const text = await fileToTextString(args.file);

      await axios.put(uploadUrl, text, {
        headers: {
          "Content-Type": "text/csv",
        },
        onUploadProgress(progressEvent) {
          if (
            !(args.bytesParagraphRef.current && args.progressRef.current && progressEvent.progress)
          )
            return;

          const percent = Math.round(progressEvent.progress * 100);

          args.bytesParagraphRef.current.textContent = `${prettyBytes(
            progressEvent.loaded,
          )} / ${prettyBytes(progressEvent.total ?? NaN)}  \u2014  (${percent}%)`;

          args.progressRef.current.value = percent;
        },
      });

      const actionOutput = generateUploadUrlResponse.data.action_output;

      if (actionOutput) {
        applyNotebookResponseUpdates({
          organizationId,
          response: {
            updates: actionOutput.notebook_updates ?? [],
            bot_conversation_id: botConversationId,
            timestamp: createISODate(),
            project_id: notebookId,
          },
        });
      } else {
        console.warn("CSV action output is not valid from response", {
          actionOutput,
        });
      }

      return { status: 201 };
    },
  });
}
