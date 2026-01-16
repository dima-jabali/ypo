"use client";

import { useQuery } from "@tanstack/react-query";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { isValidNumber } from "#/helpers/utils";
import { useFetchAllOrganizations } from "./fetch/use-fetch-all-organizations";
import { useCreateOrganization } from "./mutation/use-create-organization";

export function useSetOrgToFirst() {
  if (typeof window === "undefined") {
    return null;
  }

  const urlOrgId = generalContextStore.use.organizationId();
  const allOrgs = useFetchAllOrganizations()!;
  const createOrg = useCreateOrganization()!;

  useQuery({
    enabled: allOrgs.length > 0 && !isValidNumber(urlOrgId),
    queryKey: ["set-org-to-first", urlOrgId],
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    queryFn: async () => {
      const firstOrganization = allOrgs[0];

      if (firstOrganization) {
        generalContextStore.setState({
          organizationId: firstOrganization.id,
        });
      }

      return null;
    },
  });

  useQuery({
    queryKey: ["create-org-if-no-orgs"],
    enabled: allOrgs.length === 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    queryFn: async () => {
      console.log("No organizations found, creating a new one.");

      await createOrg.mutateAsync({
        name: "My Organization",
      });

      return null;
    },
  });
}
