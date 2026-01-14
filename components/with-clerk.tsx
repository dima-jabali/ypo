import { useAuth } from "@clerk/clerk-react";

export function WithClerk({ children }: React.PropsWithChildren) {
	const { isLoaded } = useAuth();

	return isLoaded ? children : null;
}
