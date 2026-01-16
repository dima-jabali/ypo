import { classNames } from "#/helpers/class-names";

export function StyledTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={classNames(
        "flex max-h-[80vh] min-h-[80px] w-full overflow-auto rounded-md border border-border-smooth bg-popover px-3 py-2 text-sm disabled:cursor-text",
        className,
      )}
      {...props}
    />
  );
}
