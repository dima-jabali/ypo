import { Slider as SliderPrimitive } from "radix-ui";

import { classNames } from "#/helpers/class-names";

const Slider = ({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) => (
  <SliderPrimitive.Root
    className={classNames("relative flex w-full touch-none select-none items-center", className)}
    data-slider-root
    {...props}
  >
    <SliderPrimitive.Track
      className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted/20"
      data-slider-track
    >
      <SliderPrimitive.Range className="absolute h-full bg-primary" data-slider-range />
    </SliderPrimitive.Track>

    <SliderPrimitive.Thumb
      className="block h-5 w-5 rounded-full border-2 border-primary bg-popover transition-colorsdisabled:pointer-events-none disabled:opacity-50"
      data-slider-thumb
    />
  </SliderPrimitive.Root>
);

const SmallSlider = ({
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) => (
  <SliderPrimitive.Root
    className={classNames("relative flex w-full touch-none select-none items-center", className)}
    data-slider-root
    {...props}
  >
    <SliderPrimitive.Track
      className="relative h-1 w-full grow overflow-hidden rounded-full bg-muted/20"
      data-slider-track
    >
      <SliderPrimitive.Range className="absolute h-full bg-primary" data-slider-range />
    </SliderPrimitive.Track>

    <SliderPrimitive.Thumb className="block size-3 rounded-full border-2 border-primary bg-popover transition-colorsdisabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
);

export { Slider, SmallSlider };
