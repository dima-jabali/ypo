import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useState, useTransition } from "react";

import { LOADER } from "#/components/Button";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "#/components/Dialog";
import { StyledTextarea } from "#/components/styled-text-area";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { VERIFY_SQL_QUERY_EDITOR_OPTIONS } from "#/helpers/monaco-editor";
import type { SourceForUserType } from "#/types/chat";
import type { NormalizedSource } from "../get-top-n-sources";
import { HighlightStringWithFilterRegex } from "../highlight-string-with-filter-regex";
import { ColorScheme } from "#/types/general";

type Props = {
  normalizedSource: Extract<NormalizedSource, { source_type: SourceForUserType.SqlQuery }>;
  titleString: string;
};

export function SqlQueryTitleDialogTrigger({ normalizedSource, titleString }: Props) {
  const [monacoEditor, setMonacoEditor] = useState<React.ReactNode>();
  const [isOpen, setIsOpen] = useState(false);

  const [isLoadingEditor, startTransition] = useTransition();

  const colorScheme = generalContextStore.use.colorScheme();

  function handleCreateMonacoEditor() {
    if (monacoEditor) return;

    startTransition(() => {
      setMonacoEditor(
        <MonacoEditor
          theme={colorScheme === ColorScheme.dark ? "vs-dark" : "vs-light"}
          options={VERIFY_SQL_QUERY_EDITOR_OPTIONS}
          value={titleString}
          keepCurrentModel
          language="sql"
          height="15vh"
        />,
      );
    });
  }

  function handleEscapeKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.nativeEvent.stopImmediatePropagation();
      event.stopPropagation();
      event.preventDefault();

      setIsOpen(false);
    }
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <p
          className="max-h-full break-all truncate group-data-[is-drawer]/drawer:font-bold group-data-[is-drawer]/drawer:text-base group-data-[is-drawer]/drawer:link group-data-[is-drawer]/drawer:hover:underline"
          onClick={handleCreateMonacoEditor}
          title={titleString}
        >
          <HighlightStringWithFilterRegex string={titleString} />
        </p>
      </DialogTrigger>

      <DialogContent onKeyDown={handleEscapeKeyDown} className="z-110">
        <DialogHeader className="text-xl font-bold">Source info</DialogHeader>

        <dl className="flex flex-col gap-1 text-primary [&_dt]:after:content-[':']">
          <div className="flex gap-1">
            <dt>Connection type</dt>
            <dd>{normalizedSource.values.connection_type}</dd>
          </div>

          <div className="flex gap-1">
            <dt>Connection ID</dt>
            <dd>{normalizedSource.values.connection_id}</dd>
          </div>
        </dl>

        <StyledTextarea
          className="my-6 overflow-auto"
          value={normalizedSource.values.description}
          title="Source description"
          disabled
        />

        {isLoadingEditor ? (
          <div className="flex items-center justify-center h-[148px] w-full">{LOADER}</div>
        ) : (
          monacoEditor
        )}
      </DialogContent>
    </Dialog>
  );
}
