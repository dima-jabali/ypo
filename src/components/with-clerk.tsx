import { useAuth } from "@clerk/nextjs";

export function WithClerk({ children }: React.PropsWithChildren) {
	const { isLoaded } = useAuth();

	return isLoaded ? children : null;
}
