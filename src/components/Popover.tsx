import { Popover as PopoverPrimitive } from "radix-ui";

import { classNames } from "#/helpers/class-names";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = ({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      align={align}
      sideOffset={sideOffset}
      className={classNames(
        "z-50 rounded-md border bg-popover p-1 shadow-lg shadow-black/40 border-border-smooth outline-hidden simple-scrollbar text-primary",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
);

export { Popover, PopoverContent, PopoverTrigger };
