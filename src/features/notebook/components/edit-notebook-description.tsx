import { useMemo, useRef } from "react";

import {
  useDownloadedNotebookDescription,
  useDownloadedNotebookId,
} from "#/hooks/fetch/use-fetch-notebook";
import { useUpdateNotebookMetadata } from "#/hooks/mutation/use-update-notebook-metadata";
import { noop } from "#/helpers/utils";

const TIMEOUT_TO_UPDATE_DESCRIPTION = 1_000;

export function EditNotebookDescription() {
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);

  const updateNotebookMetadata = useUpdateNotebookMetadata();
  const descriptionBlock = useDownloadedNotebookDescription();
  const notebookId = useDownloadedNotebookId();

  const initialDescriptionText = useMemo(() => {
    if (!descriptionBlock) return "";

    const text =
      descriptionBlock.custom_block_info?.paragraph?.map((item) => item.text ?? "").join("") ?? "";

    return text;
  }, [descriptionBlock]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    clearTimeout(timeoutRef.current);

    async function handleUpdateDescription() {
      const newDescription = e.target.value.trim();

      if (!newDescription || newDescription === initialDescriptionText) {
        return;
      }

      await updateNotebookMetadata
        .mutateAsync({
          description: newDescription,
          notebookId,
        })
        .catch(noop);
    }

    timeoutRef.current = setTimeout(handleUpdateDescription, TIMEOUT_TO_UPDATE_DESCRIPTION);
  }

  return (
    <textarea
      className="bg-transparent rounded-lg resize-none focus:outline-hidden leading-8 field-sizing-content"
      defaultValue={initialDescriptionText}
      placeholder="Add description..."
      title="Notebook's Description"
      key={initialDescriptionText}
      onChange={handleChange}
    ></textarea>
  );
}
