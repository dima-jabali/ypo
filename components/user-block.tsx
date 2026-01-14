import { useMemo } from "react";

import type { BetterbrainUser } from "#/types/notebook";
import { getUserNameOrEmail } from "./layout/projects-helper";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";

type Props = {
	user: BetterbrainUser;
};

export function UserBlock({ user }: Props) {
	const [name, initials] = useMemo(() => {
		const name = getUserNameOrEmail(user);

		const names = name.split(" ");

		let initials = "";
		if (names.length >= 2) {
			initials = (names[0]?.[0] ?? "") + (names[1]?.[0] ?? "");
		} else if (names.length === 1) {
			if (names[0]?.includes(".")) {
				const parts = names[0].split(".");
				initials = (parts[0]?.[0] ?? "") + (parts[1] ? parts[1][0] : "");
			} else {
				// If no dot, just take the first letter of the single element
				initials = names[0]?.[0] ?? "";
			}
		}

		return [name, initials];
	}, [user]);

	return (
		<div className="flex flex-nowrap items-center gap-3 p-3 ">
			<Avatar>
				<AvatarImage src={user?.image_url ?? undefined} />

				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>

			{name}
		</div>
	);
}
