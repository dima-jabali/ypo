import type { TImageElement } from "platejs";
import type { PlateElementProps } from "platejs/react";
import { Image, useMediaState } from "@platejs/media/react";
import { ResizableProvider } from "@platejs/resizable";
import { PlateElement, withHOC } from "platejs/react";

import { Resizable, ResizeHandle, mediaResizeHandleVariants } from "../plate-ui/resize-handle";
import { cn } from "#/helpers/class-names";

export const CustomImageElement = withHOC(
  ResizableProvider,
  function ImageElement(props: PlateElementProps<TImageElement>) {
    const { align = "center", focused, readOnly, selected } = useMediaState();

    return (
      <PlateElement {...props} className="py-2.5">
        <figure className="group relative m-0">
          <Resizable
            align={align}
            options={{
              align,
              readOnly,
            }}
          >
            <ResizeHandle
              className={mediaResizeHandleVariants({ direction: "left" })}
              options={{ direction: "left" }}
            />

            <Image
              className={cn(
                "block w-full max-w-[90%] cursor-pointer object-cover px-0",
                "rounded-sm",
                focused && selected && "ring-2 ring-ring ring-offset-2",
              )}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              alt={(props.attributes as any).alt}
            />
            <ResizeHandle
              className={mediaResizeHandleVariants({
                direction: "right",
              })}
              options={{ direction: "right" }}
            />
          </Resizable>
        </figure>

        {props.children}
      </PlateElement>
    );
  },
);
