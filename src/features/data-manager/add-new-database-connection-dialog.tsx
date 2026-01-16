import { useState } from "react";

import { Button, ButtonVariant } from "#/components/Button";
import { Dialog, DialogContent, DialogTrigger } from "#/components/Dialog";
import { DBConnectionModalContent } from "./db-connection-modal/db-connection-modal";
import { DialogToOpenWithError, useAttemptToConnectStatus } from "./use-attempt-to-connect-status";

export const AddNewDatabaseConnectionDialog: React.FC = () => {
  const attemptToConnectStatus = useAttemptToConnectStatus();

  const [isOpen, setIsOpen] = useState(
    attemptToConnectStatus.dialogToOpenWithError !== DialogToOpenWithError.none,
  );

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button variant={ButtonVariant.PURPLE}>Add Connection</Button>
      </DialogTrigger>

      <DialogContent
        overlayClassName="add-new-database-connection z-40"
        className="z-40 h-[90vh] simple-scrollbar"
        data-dialog-content
      >
        <DBConnectionModalContent
          attemptToConnectStatus={attemptToConnectStatus}
          setIsOpen={setIsOpen}
        />
      </DialogContent>
    </Dialog>
  );
};
