import type { ComponentProps, PropsWithChildren } from "react";

import { classNames } from "#/helpers/class-names";

export function MessageWrapper({
  className,
  ...rest
}: PropsWithChildren<ComponentProps<"li"> & { isParallelMessage?: boolean }>) {
  return (
    <li
      className={classNames(
        "@container chat-content flex w-full list-none max-h-fit flex-col items-center justify-start py-1 text-sm text-primary empty:hidden",
        className,
      )}
      {...rest}
    />
  );
}
