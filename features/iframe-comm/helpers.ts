import { object, string, enum as zenum } from "zod/mini";

export enum IframeCommType {
	OrganizationId = "organizationId",
	ClerkApiToken = "clerkApiToken",
	ParentOrigin = "parentOrigin",
	RequestData = "requestData",
	Token = "token",
}

export const validateIframeMessage = object({
	type: zenum(IframeCommType),
	value: string(),
});
