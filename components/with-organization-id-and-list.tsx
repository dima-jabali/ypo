import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { isValidNumber } from "#/helpers/utils";
import { useSetOrgToFirst } from "#/hooks/use-set-org-to-first";
import { LOADER } from "./Button";

export function WithOrganizationIdAndList({
	children,
}: React.PropsWithChildren) {
	const organizationId = generalContextStore.use.organizationId();

	useSetOrgToFirst();

	return isValidNumber(organizationId) ? children : LOADER;
}
