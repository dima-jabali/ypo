import { useRef } from "react";

import {
  useDownloadedNotebookId,
  useDownloadedNotebookTitle,
} from "#/hooks/fetch/use-fetch-notebook";
import { useUpdateNotebookMetadata } from "#/hooks/mutation/use-update-notebook-metadata";
import { noop } from "#/helpers/utils";

const DONE_TYPING_INTERVAL = 1_000;

export function EditNotebookTitle() {
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const titleRef = useRef<HTMLInputElement>(null);

  const updateNotebookMetadata = useUpdateNotebookMetadata();
  const notebookTitle = useDownloadedNotebookTitle();
  const notebookId = useDownloadedNotebookId();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    clearTimeout(timeoutRef.current);

    async function handleUpdateTitle() {
      const newTitle = e.target.value.trim();

      if (!newTitle || newTitle === notebookTitle) {
        return;
      }

      await updateNotebookMetadata
        .mutateAsync({
          title: newTitle,
          notebookId,
        })
        .catch(noop);
    }

    timeoutRef.current = setTimeout(handleUpdateTitle, DONE_TYPING_INTERVAL);
  }

  return (
    <input
      className="resize-none focus:outline-hidden rounded-lg text-3xl max-w-full truncate font-bold"
      placeholder="Add a title to your notebook..."
      defaultValue={notebookTitle}
      onChange={handleChange}
      title={notebookTitle}
      key={notebookTitle}
      ref={titleRef}
    />
  );
}
