import { Switch as SwitchPrimitive } from "radix-ui";

import { classNames } from "#/helpers/class-names";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={classNames(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent hover:opacity-70 active:brightness-150 active:opacity-100 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input data-[state=unchecked]:border-primary",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={classNames(
          "pointer-events-none block h-5 w-5 rounded-full bg-popover shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-primary",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
