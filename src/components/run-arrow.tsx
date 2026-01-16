import { type ComponentPropsWithRef, forwardRef, useState } from "react";

import { RunArrowIcon } from "#/icons/run-arrow-icon";
import { Button } from "./Button";
import { Loader } from "./Loader";

type Props = ComponentPropsWithRef<"button"> & {
  showLoader?: boolean;
  onClick: () => void;
};

export const RunArrow = forwardRef<HTMLButtonElement, Props>(
  ({ onClick, disabled, showLoader, children, ...rest }, ref) => {
    const [isAnimating, setIsAnimating] = useState(false);

    const isLoading = showLoader || isAnimating;
    const isDisabled = disabled || isLoading;

    const handleClick = async () => {
      if (isDisabled) return;

      setIsAnimating(true);
      await onClick();
      setIsAnimating(false);
    };

    let title = "";

    if (isDisabled) {
      if (isAnimating) {
        title = "Running block";
      } else {
        title = "This block is not executable";
      }
    } else {
      title = "Run block";
    }

    return (
      <Button
        className="flex items-center gap-2 p-1 px-2 text-white disabled:pointer-events-none disabled:bg-gray-500 data-[is-loading=true]:bg-green-700 data-[is-loading=true]:run-button-animation hover:opacity-80 active:brightness-125 not-disabled:bg-blue-500 disabled:opacity-50 data-[is-loading=true]:opacity-100 rounded-lg"
        data-is-loading={isLoading}
        onPointerUp={handleClick}
        disabled={isDisabled}
        title={title}
        ref={ref}
        size="xs"
        {...rest}
      >
        {isLoading ? <Loader className="border-t-white" /> : null}

        <span className="align-middle text-sm font-semibold text-white">
          {children || `Run${isLoading ? "ning..." : ""}`}
        </span>

        <RunArrowIcon />
      </Button>
    );
  },
);

RunArrow.displayName = "RunArrow";
