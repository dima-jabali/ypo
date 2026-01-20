"use client"

import type { ComponentProps, PropsWithChildren } from "react";

import { classNames } from "#/helpers/class-names";

export function MessageWrapper({
  className,
  ...rest
}: PropsWithChildren<ComponentProps<"li"> & { isParallelMessage?: boolean }>) {
			  if (typeof window === "undefined") {
    return null;
  }

  return (
    <li
      className={classNames(
        "@container relative chat-content flex w-full list-none max-h-fit flex-col items-center justify-start py-1 text-sm text-primary empty:hidden",
        className,
      )}
      {...rest}
    />
  );
}
