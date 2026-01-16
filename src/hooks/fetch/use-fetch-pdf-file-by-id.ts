"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { isValidNumber } from "#/helpers/utils";
import type { FileId } from "#/types/general";
import type { PdfId } from "#/types/notebook";
import { queryKeyFactory } from "../query-keys";
import type { BotSourceType } from "#/types/bot-source";

export type GetPresignedUrlByFileIdResponse = {
  type: BotSourceType.PDF | BotSourceType.CSV;
  file_size_bytes: number;
  presigned_url: string;
  description: string;
  id: FileId | PdfId;
  file_name: string;
  indexed: boolean;
  summary: string;
  title: string;
  uuid: string;
};

export function useFetchPdfFileById(enabled: boolean, fileId?: FileId | PdfId) {
  if (typeof window === "undefined") {
    return null;
  }

  const canFetch = enabled && isValidNumber(fileId);

  const queryOptions = useMemo(() => queryKeyFactory.get["pdf-file-by-id"](fileId), [fileId]);

  return useQuery({
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity, // never stale
    enabled: canFetch,
    gcTime: Infinity, // never gc
    ...queryOptions,
  });
}
