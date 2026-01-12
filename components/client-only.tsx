"use client";

import { useEffect, useState } from "react";

export function ClientOnly({ children }: React.PropsWithChildren) {
	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() => {
		setHasMounted(true);
	}, []);

	return hasMounted ? children : null;
}
