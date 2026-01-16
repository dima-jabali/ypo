import { useState } from "react";

import { handleCopyTextToClipboard } from "../msgs/messageTypesHelpers";
import { CHECK_ICON, CLIPBOARD_ICON, X_ICON } from "../msgs/icons";

export function CopyButton({ text }: { text: string }) {
  const [wasCopiedSuccessfully, setWasCopiedSuccessfully] = useState<boolean>();

  return (
    <button
      className="flex items-center gap-2 whitespace-nowrap text-primary rounded-md py-1 px-2 button-hover"
      onClick={() => handleCopyTextToClipboard(text, setWasCopiedSuccessfully)}
      type="button"
    >
      {wasCopiedSuccessfully === true ? (
        <>
          {CHECK_ICON}

          <span>Copied to clipboard</span>
        </>
      ) : wasCopiedSuccessfully === false ? (
        <>
          {X_ICON}

          <span>Failed to copy to clipboard</span>
        </>
      ) : (
        <>
          {CLIPBOARD_ICON}

          <span>Copy to clipboard</span>
        </>
      )}
    </button>
  );
}
