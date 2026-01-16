import { useRef, useState } from "react";
import { allExpanded, darkStyles, JsonView } from "react-json-view-lite";

import { Button } from "#/components/Button";
import { DialogDescription, DialogHeader, DialogTitle } from "#/components/Dialog";
import { Input } from "#/components/Input";

const JSON_VIEWER_STYLES: typeof darkStyles = {
  ...darkStyles,
  container: "bg-transparent max-w-[496px] overflow-hidden break-words",
};

export const GoogleDriveForm: React.FC<{
  formRef: React.Ref<HTMLFormElement>;
}> = ({ formRef }) => {
  const [serviceAccountInfoAsJson, setServiceAccountInfoAsJson] = useState({});
  const [hasError, setHasError] = useState(false);

  const timerToParseToJsonRef = useRef<NodeJS.Timeout>(undefined);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChooseFile = () => {
    if (!jsonFileInputRef.current) return;

    jsonFileInputRef.current.click();
  };

  const parseToJson = (value: string) => {
    clearTimeout(timerToParseToJsonRef.current);

    timerToParseToJsonRef.current = setTimeout(() => {
      try {
        setServiceAccountInfoAsJson(JSON.parse(value));

        setHasError(false);
      } catch (error) {
        setServiceAccountInfoAsJson({
          message: (error as Error).message,
          error: "Invalid JSON",
        });

        setHasError(true);
      }
    }, 500);
  };

  const handleTransformToJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    parseToJson(e.target.value);
  };

  const handleParseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const serviceAccountInfoAsString = e.target?.result as string;

      if (inputRef.current) {
        inputRef.current.value = serviceAccountInfoAsString;
      }

      parseToJson(serviceAccountInfoAsString);
    };

    reader.readAsText(file);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Google Drive Connection</DialogTitle>
      </DialogHeader>

      <DialogDescription>
        To add a Google Drive connection, you need to to authorize BetterBrain to connect to your
        desired Google Drive&apos;s workspace.
      </DialogDescription>

      <form className="flex flex-col gap-4 mt-4" ref={formRef}>
        <fieldset className="flex flex-col gap-1">
          <label className="text-sm" htmlFor="name">
            Connection name:
          </label>

          <Input type="text" name="name" id="name" required />
        </fieldset>

        <fieldset
          aria-describedby="description-service_account_info"
          className="flex flex-col gap-2"
        >
          <label htmlFor="service_account_info" className="text-sm">
            Service Account Info:
          </label>

          <p className="text-sm text-muted-foreground" id="description-service_account_info">
            Choose the JSON file you downloaded from Google or paste it in the input.
          </p>

          <div className="flex gap-2 mt-1">
            <input
              onChange={handleParseFile}
              ref={jsonFileInputRef}
              className="hidden"
              accept=".json"
              type="file"
            />

            <Button onClick={handleChooseFile}>Chose file</Button>

            <Input
              onChange={handleTransformToJson}
              name="service_account_info"
              id="service_account_info"
              ref={inputRef}
              type="text"
              required
            />
          </div>

          {hasError ? (
            <div className="rounded-md bg-red-800 p-2 text-sm my-2 font-semibold">
              Your input does not parse to a valid JSON.
            </div>
          ) : null}

          <pre className="whitespace-pre-wrap">
            <JsonView
              data={serviceAccountInfoAsJson}
              shouldExpandNode={allExpanded}
              style={JSON_VIEWER_STYLES}
            />
          </pre>
        </fieldset>
      </form>
    </>
  );
};
