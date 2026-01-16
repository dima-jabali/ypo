import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Check } from "lucide-react";

import { classNames } from "#/helpers/class-names";

export function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={classNames(
        "peer size-4 shrink-0 rounded-sm border border-primary disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={classNames("flex items-center justify-center text-current")}
      >
        <Check className="size-4 stroke-secondary" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
