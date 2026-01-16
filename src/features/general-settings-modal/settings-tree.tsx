import { useRef, type PropsWithChildren, useEffect } from "react";
import { ChevronRight } from "lucide-react";

import type { SettingsOptions } from "./common";

type TreeProps = {
  activeItem: SettingsOptions;
  name: SettingsOptions;
  onClick?: (name: SettingsOptions) => void;
};

export const SettingsTree: React.FC<PropsWithChildren<TreeProps>> = ({
  activeItem,
  children,
  name,
  onClick,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isActive = activeItem === name;

  const handleToggleIsOpen = () => {
    onClick?.(name);
  };

  useEffect(() => {
    if (!isActive) return;

    buttonRef.current?.scrollIntoView({ block: "center", inline: "center" });

    // We only want it to happen on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <button
        className="flex h-7 w-full min-w-fit flex-none items-center gap-1 whitespace-nowrap px-4 text-sm font-normal tracking-wide transition-none data-[is-active=true]:bg-button-active button-hover"
        onClick={handleToggleIsOpen}
        data-is-active={isActive}
        ref={buttonRef}
        type="button"
        title={name}
      >
        {children ? (
          <ChevronRight
            className="size-4 data-[is-open=true]:rotate-90 flex-none"
            data-is-open={isActive}
          />
        ) : (
          <span className="w-4 flex-none"></span>
        )}

        <span>{name}</span>
      </button>

      {isActive && children ? <div className="w-full [&_div]:pl-5">{children}</div> : null}
    </>
  );
};
