import { Resizable } from "re-resizable";
import { memo, useLayoutEffect, useRef, type PropsWithChildren } from "react";

import { classNames } from "#/helpers/class-names";
import { TABLE_MIN_HEIGHT_WITH_HEADER_AND_FOOTER } from "./TanStackTable/helpers";
import { TableDataProvider, type TableDataType } from "./tableDataContext";
import type { TableHelperStore } from "./useTableHelper";
import { useBlockAndFilters, useHandleResizeStop, useSetTableData } from "./tableDataContextUtils";
import type { BlockFilterAndSort } from "#/types/notebook";

type Props = {
  initialBlockFilterAndSort?: BlockFilterAndSort;
  allData: TableDataType["allData"];
  dataComesFromDataPreview: boolean;
  totalNumberOfRows: number | null;
  block?: TableDataType["block"];
  numberOfRowsPerPage: number;
  initialPageNumber: number;
  disableResize?: boolean;
  isFetchingData: boolean;
  isNewSource: boolean;
  canScroll?: boolean;
  className?: string;
  setNumberOfRowsPerPage?: TableDataType["setNumberOfRowsPerPage"];
  setBlockFilterAndSort?: TableDataType["setBlockFilterAndSort"];
  setIsNewSource?: TableDataType["setIsNewSource"];
  fetchMore?: TableHelperStore["paginate"];
  reload?: TableDataType["reload"];
};

const HANDLE_CLASSES_CONTAINER = {
  bottom: "button-hover z-0",
};
const ENABLE_CONTAINER = {
  bottomRight: false,
  bottomLeft: false,
  topRight: false,
  topLeft: false,
  right: false,
  left: false,
  top: false,

  bottom: true,
};

const TableRoot_: React.FC<PropsWithChildren<Props>> = ({
  dataComesFromDataPreview,
  numberOfRowsPerPage,
  totalNumberOfRows,
  initialPageNumber,
  canScroll = true,
  className = "",
  isFetchingData,
  disableResize,
  isNewSource,
  children,
  allData,
  block,
  setNumberOfRowsPerPage,
  setBlockFilterAndSort,
  setIsNewSource,
  fetchMore,
  reload,
}) => {
  const blockFilterAndSort = useBlockAndFilters();
  const handleResizeStop = useHandleResizeStop();
  const setTableData = useSetTableData();

  const tableWrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    setTableData({
      dataComesFromDataPreview,
      numberOfRowsPerPage,
      totalNumberOfRows,
      initialPageNumber,
      tableWrapperRef,
      isFetchingData,
      isNewSource,
      canScroll,
      allData,
      block,
      setNumberOfRowsPerPage,
      setIsNewSource,
      fetchMore,
      reload,
    });
  }, [
    dataComesFromDataPreview,
    numberOfRowsPerPage,
    totalNumberOfRows,
    initialPageNumber,
    isFetchingData,
    isNewSource,
    canScroll,
    allData,
    block,
    setNumberOfRowsPerPage,
    setIsNewSource,
    setTableData,
    fetchMore,
    reload,
  ]);

  useLayoutEffect(() => {
    setBlockFilterAndSort?.(blockFilterAndSort);
  }, [blockFilterAndSort, setBlockFilterAndSort]);

  return (
    <div
      className={classNames(
        "relative box-border flex min-h-[118px] w-full flex-col overflow-hidden whitespace-nowrap text-xs leading-7 [&_svg]:text-primary",
        className,
      )}
      ref={tableWrapperRef}
    >
      <Resizable
        minHeight={`${canScroll ? TABLE_MIN_HEIGHT_WITH_HEADER_AND_FOOTER : 117}px`}
        enable={canScroll && !disableResize ? ENABLE_CONTAINER : false}
        className={`${canScroll ? "flex flex-col" : ""}`}
        handleClasses={HANDLE_CLASSES_CONTAINER}
        onResizeStop={handleResizeStop}
        maxWidth="90vw"
      >
        {children}

        <div className="table-linear-gradient h-110 absolute inset-0 bottom-0 z-1 hidden w-full after:to-black/5 after:from-black/50 after:from-90% after:absolute after:inset-0 after:z-50 after:pointer-events-none after:bg-linear-to-t"></div>
      </Resizable>
    </div>
  );
};

function TableRoot(props: PropsWithChildren<Props>) {
  return (
    <TableDataProvider initialBlockFilterAndSort={props.initialBlockFilterAndSort}>
      <TableRoot_ {...props} />
    </TableDataProvider>
  );
}

export const MemoTableRoot = memo(TableRoot);
