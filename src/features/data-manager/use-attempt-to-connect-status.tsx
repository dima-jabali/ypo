import { useState } from "react";

import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { dataManagerStore } from "#/contexts/data-manager";
import { isValidNumber } from "#/helpers/utils";
import { DatabaseConnectionType, type DatabaseConnection } from "#/types/databases";

export type AttemptToConnectStatus = {
  dialogToOpenWithError: DialogToOpenWithError;
  error: string;
};

export enum DialogToOpenWithError {
  notion = "notion",
  slack = "slack",
  none = "none",
}

export function useAttemptToConnectStatus(): AttemptToConnectStatus {
  const [dialogToOpenWithError, setDialogToOpenWithError] = useState<{
    dialogToOpenWithError: DialogToOpenWithError;
    error: string;
  }>();

  if (dialogToOpenWithError) {
    return dialogToOpenWithError;
  }

  const searchParams = new URLSearchParams(window.location.search);

  // Casting here because it will only be a string:
  const dataConnectionType = (searchParams.get("type") ||
    DialogToOpenWithError.none) as DialogToOpenWithError;
  const connectionId = Number(searchParams.get("connection_id") || undefined);
  const error = searchParams.get("error") ?? "";

  console.log({ dataConnectionType, connectionId, error });

  const hasAnyData = connectionId || (dataConnectionType && error);

  if (!hasAnyData || dataConnectionType === DialogToOpenWithError.none) {
    const nextDialogToOpenWithError = {
      dialogToOpenWithError: DialogToOpenWithError.none,
      error: "",
    };

    setDialogToOpenWithError(nextDialogToOpenWithError);

    return nextDialogToOpenWithError;
  }

  if (isValidNumber(connectionId)) {
    toast({
      title: (
        <p className="first-letter:uppercase">
          {dataConnectionType}&apos;s connection was successfully added
        </p>
      ),
      variant: ToastVariant.Success,
    });

    const nextDialogToOpenWithError = {
      dialogToOpenWithError: DialogToOpenWithError.none,
      error: "",
    };

    setDialogToOpenWithError(nextDialogToOpenWithError);

    if (dataConnectionType === DialogToOpenWithError.slack) {
      dataManagerStore.setState({
        connectionId: connectionId as DatabaseConnection["id"],
        connectionType: DatabaseConnectionType.Slack,
      });
    }

    return nextDialogToOpenWithError;
  } else {
    const nextDialogToOpenWithError = {
      dialogToOpenWithError: dataConnectionType,
      error,
    };

    setDialogToOpenWithError(nextDialogToOpenWithError);

    return nextDialogToOpenWithError;
  }
}
