"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  generalContextStore,
  type PageLimit,
  type PageOffset,
} from "#/contexts/general-ctx/general-context";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { GoogleDriveDatabaseConnectionId } from "#/types/databases";
import type {
  GeneralFile,
  GeneralFileType,
  GoogleDriveFile,
  GoogleDriveFileId,
} from "#/types/notebook";
import {
  useOrganizationFilesStore,
  type VespaSourceId,
} from "../../features/organization-files/contexts/organizationFiles";

export type GetOrganizationFilesRequest = {
  google_drive_connection_id: GoogleDriveDatabaseConnectionId | null;
  google_drive_parent_id: GoogleDriveFileId | null;
  vespa_source_id: VespaSourceId | null;
  file_type: GeneralFileType | null;
  offset: PageOffset;
  limit: PageLimit;
};

export type GetOrganizationFilesResponse = {
  results: Array<GeneralFile | GoogleDriveFile>;
  num_results: number;
  offset: number;
  limit: number;
};

export function useFetchAllOrganizationFilesQueryKey() {
  if (typeof window === "undefined") {
    return null;
  }

  const googleDriveConnectionId = useOrganizationFilesStore().use.googleDriveConnectionId();
  const googleDriveParentId = useOrganizationFilesStore().use.googleDriveParentId();
  const vespaSourceId = useOrganizationFilesStore().use.vespaSourceId();
  const organizationId = generalContextStore.use.organizationId();
  const fileType = useOrganizationFilesStore().use.fileType();
  const pageOffset = generalContextStore.use.pageOffset();
  const pageLimit = generalContextStore.use.pageLimit();

  return useMemo(() => {
    const queryParams: GetOrganizationFilesRequest = {
      google_drive_connection_id: googleDriveConnectionId,
      google_drive_parent_id: googleDriveParentId,
      vespa_source_id: vespaSourceId,
      file_type: fileType,
      offset: pageOffset,
      limit: pageLimit,
    };

    const queryOptions = queryKeyFactory.get["all-organization-files"](organizationId, queryParams);

    return {
      queryOptions,
      queryParams,
    };
  }, [
    googleDriveConnectionId,
    googleDriveParentId,
    organizationId,
    vespaSourceId,
    pageOffset,
    pageLimit,
    fileType,
  ]);
}

export function useFetchAllOrganizationFilesPage() {
  if (typeof window === "undefined") {
    return null;
  }

  const { queryOptions } = useFetchAllOrganizationFilesQueryKey()!;

  return useSuspenseQuery({
    staleTime: 10 * 60 * 1_000, // 10 mins
    gcTime: 10 * 60 * 1_000, // 10 mins
    ...queryOptions,
  }).data;
}
