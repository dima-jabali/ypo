import { useState } from "react";

import type { BlockBase } from "#/types/notebook";
import { getVariableName } from "#/helpers/blocks";
import { useUpdateResultVariable } from "#/hooks/mutation/use-update-result-variable";
import { handleChangeWriteVariableName } from "./helpers";
import { noop } from "#/helpers/utils";

type Props = {
  block: BlockBase;
};

export function WriteVariable({ block }: Props) {
  const [prevWriteVariableName, setPrevWriteVariableName] = useState(
    getVariableName(block.write_variables),
  );
  const [nextWriteVariableName, setNextWriteVariableName] = useState(prevWriteVariableName);

  const updateResultVariable = useUpdateResultVariable(block.uuid);

  function handleWriteVariableNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleChangeWriteVariableName({
      newName: e.target.value,
      prevWriteVariableName,
      nextWriteVariableName,
      setPrevWriteVariableName,
      setNextWriteVariableName,
    });
  }

  function handleSaveNewWriteVariableName() {
    if (nextWriteVariableName === prevWriteVariableName) {
      return;
    }

    updateResultVariable
      .mutateAsync({
        old_name: prevWriteVariableName,
        new_name: nextWriteVariableName,
      })
      .then(() => {
        setPrevWriteVariableName(nextWriteVariableName);
      })
      .catch(noop);
  }

  return (
    <input /** Variable name */
      className="h-fit cursor-text select-text overflow-hidden text-ellipsis whitespace-nowrap rounded-xs bg-green-800 px-1 font-mono text-xs font-bold tabular-nums text-green-400 outline-hidden disabled:pointer-events-none disabled:opacity-50"
      disabled={updateResultVariable.isPending}
      onChange={handleWriteVariableNameChange}
      onBlur={handleSaveNewWriteVariableName}
      value={nextWriteVariableName}
      title="Write variable name"
    />
  );
}
