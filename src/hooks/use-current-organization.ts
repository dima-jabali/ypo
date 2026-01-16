"use client";

import { useCallback } from "react";

import {
  useFetchAllOrganizations,
  type Organization,
} from "#/hooks/fetch/use-fetch-all-organizations";
import { useSetOrgToFirst } from "./use-set-org-to-first";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

export function useCurrentOrganization() {
  if (typeof window === "undefined") {
    return null;
  }

  const urlOrgId = generalContextStore.use.organizationId();

  useSetOrgToFirst();

  const selectCurrentOrganization = useCallback(
    (allOrgs: Array<Organization>) => allOrgs.find(({ id }) => id === urlOrgId),
    [urlOrgId],
  );

  const currentOrganization = useFetchAllOrganizations(selectCurrentOrganization);

  return currentOrganization;
}

export function useDownloadedOrganizationId() {
  if (typeof window === "undefined") {
    return null;
  }

  return useCurrentOrganization()?.id;
}

export function useWithCurrentOrg() {
  const currentOrg = useCurrentOrganization();

  if (!currentOrg) {
    throw new Error("No current organization");
  }

  return currentOrg;
}
