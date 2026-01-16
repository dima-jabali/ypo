import { useEffect, useRef } from "react";

import { useForceRender } from "#/hooks/use-force-render";
import type { DatabaseConnectionType, NormalDatabaseConnectionId } from "#/types/databases";
import type { ActiveItem, SchemaTreeProps } from "./schema-tree";
import { getSchemaTreeIcon } from "./helpers/get-schema-tree-icon";
import { IconType, type TableName } from "./helpers/types";
import { UNKNOWN_NAME } from "./utils";

type TreeProps = {
  children?: (React.ReactNode | null)[] | null | undefined;
  expandedItemsRef: SchemaTreeProps["expandedItemsRef"];
  id: NormalDatabaseConnectionId | TableName;
  activeItemRef: React.RefObject<ActiveItem>;
  type: DatabaseConnectionType | IconType;
  showNumberOfChildren?: boolean;
  isLoading?: boolean;
  isParent?: boolean;
  name: TableName;
  onClick?: () => void;
};

export function Tree({
  showNumberOfChildren = false,
  isLoading = false,
  isParent = false,
  expandedItemsRef,
  activeItemRef,
  children,
  type,
  name,
  id,
  onClick,
}: TreeProps) {
  const forceRender = useForceRender();

  const buttonRef = useRef<HTMLButtonElement>(null);

  const hasLength = Number.isFinite(children?.length);

  // Highlight active item and two of its parents
  // to indicate where the user is/should go to:
  const isOneOfTheParentsOfActiveItem = Boolean(
    expandedItemsRef.current.has(id) && activeItemRef.current !== id && activeItemRef.current,
  );
  const isExpandingFromSearchResults = Boolean(
    activeItemRef.current && expandedItemsRef.current.size > 0,
  );
  const shouldExpand = expandedItemsRef.current.has(id);
  const isActive = activeItemRef.current === id;

  const isOpen = expandedItemsRef.current.has(id) && hasLength;
  const isAParent = isParent || hasLength;
  const length =
    (showNumberOfChildren || hasLength || isAParent) && hasLength ? ` (${children!.length})` : null;

  const hasNoName = name === UNKNOWN_NAME;

  function handleToggleIsOpen() {
    console.log({
      expandedItemsRef: structuredClone(expandedItemsRef),
      onClick,
      children,
      isAParent,
      showNumberOfChildren,
      isLoading,
      isParent,
      activeItemRef,
      type,
      name,
      id,
    });

    expandedItemsRef.current[isOpen ? "delete" : "add"](id);

    onClick?.();

    forceRender();
  }

  useEffect(() => {
    if (isExpandingFromSearchResults) {
      const isTable = type === IconType.TABLE;

      if (shouldExpand) {
        onClick?.();
      }

      if (isActive || (isTable && shouldExpand)) {
        buttonRef.current?.scrollIntoView({
          inline: "center",
          block: "center",
        });
      }
    }

    // We only want it to happen on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <button
        className="flex h-7 button-hover cursor-pointer w-full min-w-fit flex-none items-center justify-start gap-2 whitespace-nowrap px-2 text-sm font-normal tracking-wide transition-none data-[is-active=true]:bg-blue-400/45 data-[is-one-of-the-parents-of-active-item=true]:bg-orange-400/20 data-[is-a-parent=true]:font-bold data-[has-no-name=true]:italic data-[has-no-name=true]:text-red-300 onfocus:bg-button-hover"
        data-is-one-of-the-parents-of-active-item={isOneOfTheParentsOfActiveItem}
        onClick={handleToggleIsOpen}
        data-has-no-name={hasNoName}
        data-is-a-parent={isAParent}
        data-is-active={isActive}
        aria-expanded={isOpen}
        ref={buttonRef}
        title={name}
      >
        {getSchemaTreeIcon(isOpen, isLoading, isAParent, type)}

        {name}

        {length ? <span className="font-mono font-light tabular-nums">{length}</span> : null}
      </button>

      {isOpen && isAParent && !isLoading ? (
        <div className="w-full [&_div]:pl-5">{children}</div>
      ) : null}
    </>
  );
}
