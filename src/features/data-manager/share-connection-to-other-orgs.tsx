import { isEqual, uniqBy } from "es-toolkit";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { LOADER } from "#/components/Button";
import { Checkbox } from "#/components/Checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { noop, preventDefault } from "#/helpers/utils";
import {
	useFetchAllOrganizations,
	type Organization,
} from "#/hooks/fetch/use-fetch-all-organizations";
import { useUpdateIntegration } from "#/hooks/mutation/use-update-integration";
import type { DatabaseConnection } from "#/types/databases";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

type Props = {
	connection: DatabaseConnection;
};

export function ShareConnectionToOtherOrgs({ connection }: Props) {
	const [sharedWith, setSharedWith] = useState(
		new Set(connection.organizations_with_access.map((org) => org.id)),
	);
	const [isOpen, setIsOpen] = useState(false);

	const organizationId = generalContextStore.use.organizationId();
	const allFetchedOrs = useFetchAllOrganizations();
	const updateConnection = useUpdateIntegration();

	const allOrganizations = useMemo(
		() =>
			uniqBy(
				allFetchedOrs?.concat(connection.organizations_with_access) || [],
				(org) => org.id,
			),
		[allFetchedOrs, connection.organizations_with_access],
	);

	if (allOrganizations.length === 0) return null;

	function handleToggleShareWithOrg(org: Organization) {
		const nextSet = new Set(sharedWith);

		if (sharedWith.has(org.id)) {
			nextSet.delete(org.id);
		} else {
			nextSet.add(org.id);
		}

		setSharedWith(nextSet);
	}

	async function handleSave() {
		if (updateConnection.isPending) return;

		const hasNotChanged = isEqual(
			sharedWith,
			new Set(connection.organizations_with_access.map((org) => org.id)),
		);

		if (hasNotChanged) {
			return;
		}

		updateConnection.mutate({
			organization_ids_with_access: Array.from(sharedWith),
			connection_type: connection.type,
			connection_id: connection.id,
		});
	}

	function handleOpenChange(newIsOpen: boolean) {
		const isClosing = newIsOpen === false;

		if (isClosing) {
			handleSave().catch(noop);
		}

		setIsOpen(newIsOpen);
	}

	return (
		<Popover onOpenChange={handleOpenChange} open={isOpen}>
			<PopoverTrigger
				className="relative flex w-fit shrink-0 flex-nowrap items-center justify-between gap-2 truncate rounded-lg bg-secondary px-3 h-10 py-1 after:absolute after:inset-0 after:rounded-[8px] hover:after:bg-button-hover active:after:bg-button-active text-primary border-accent border tabular-nums"
				title="Set which organizations can access this connection"
			>
				{updateConnection.isPending ? LOADER : null}

				<i>
					Shar{updateConnection.isPending ? "ing" : "ed"} with {sharedWith.size}{" "}
					organizations
					{updateConnection.isPending ? "..." : ""}
				</i>

				<ChevronDown className="size-5 shrink-0 text-primary" />
			</PopoverTrigger>

			<PopoverContent
				className="flex max-h-80 min-w-[var(--radix-popover-trigger-width)] max-w-xl flex-col gap-1 rounded-lg overflow-hidden"
				onOpenAutoFocus={preventDefault}
				sideOffset={5}
				side="bottom"
				align="end"
			>
				<ol className="flex w-full flex-col simple-scrollbar m-0! pr-1 gap-1!">
					{allOrganizations.map((org) => {
						const isThisOrg = org.id === organizationId;

						if (isThisOrg) return null;

						const isSharedWithThisOrg = sharedWith.has(org.id);

						return (
							<div
								className="flex w-full items-center justify-between gap-3 rounded-[5px] p-2 transition-none data-[is-active=true]:bg-button-hover hover:bg-button-hover"
								data-is-active={isThisOrg || isSharedWithThisOrg}
								onClick={() => handleToggleShareWithOrg(org)}
								title={`${org.name} (${org.id})`}
								key={org.id}
							>
								<div className="flex items-center gap-2">
									<span className="truncate" title="Organization's name">
										{org.name}
									</span>

									<span
										className="text-xs text-muted"
										title="Organization's ID"
									>
										({org.id})
									</span>
								</div>

								<Checkbox
									onCheckedChange={() => handleToggleShareWithOrg(org)}
									checked={isSharedWithThisOrg}
								/>
							</div>
						);
					})}
				</ol>
			</PopoverContent>
		</Popover>
	);
}
