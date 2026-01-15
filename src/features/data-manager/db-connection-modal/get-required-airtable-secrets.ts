import { dataManagerStore } from "#/contexts/data-manager";

const AIRTABLE_CLIENT_ID = process.env.NEXT_PUBLIC_AIRTABLE_CLIENT_ID;
const ROUTE_ROOT_URL = process.env.NEXT_PUBLIC_ROUTE_ROOT_URL;

if (!AIRTABLE_CLIENT_ID) {
	throw new Error("Missing NEXT_PUBLIC_AIRTABLE_CLIENT_ID");
}

if (!ROUTE_ROOT_URL) {
	throw new Error("Missing NEXT_PUBLIC_ROUTE_ROOT_URL");
}

export const AIRTABLE_REDIRECT_URI = `${ROUTE_ROOT_URL}/integrations/airtable`;

const ALPHABET =
	"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._";
const CHARACTERS_LENGTH = ALPHABET.length;
const BASE_URL = "https://www.airtable.com/oauth2/v1/authorize";
const SCOPE = [
	"data.records:read",
	"data.records:write",
	"data.recordComments:read",
	"data.recordComments:write",
	"schema.bases:read",
	"schema.bases:write",
	"user.email:read",
	"webhook:manage",
].join(" ");
const GLOBAL_FORWARD_SLASH_CHARACTER_REGEX = /\//g;
const GLOBAL_EQUAL_SIGN_REGEX = /=/g;
const GLOBAL_PLUS_REGEX = /\+/g;

// Function to generate a cryptographically secure random string
function generateSecureString(length: number): string {
	// The characters allowed in the strings according to the image description
	let result = "";

	for (let i = 0; i < length; ++i) {
		result += ALPHABET.charAt(Math.floor(Math.random() * CHARACTERS_LENGTH));
	}

	return result;
}

// Function to generate code_challenge from code_verifier
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
	// Hash code_verifier
	const sha256Hash = window.crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(codeVerifier),
	);

	// Base64 URL encode the sha256 hash
	return new Promise((resolve, reject) => {
		sha256Hash
			.then((buffer) => {
				const hashArray = Array.from(new Uint8Array(buffer));

				const codeChallenge = btoa(String.fromCharCode(...hashArray))
					.replace(GLOBAL_FORWARD_SLASH_CHARACTER_REGEX, "_")
					.replace(GLOBAL_EQUAL_SIGN_REGEX, "")
					.replace(GLOBAL_PLUS_REGEX, "-");

				resolve(codeChallenge);
			})
			.catch(reject);
	});
}

async function getRequiredSecrets() {
	// Generate code_verifier
	const codeVerifier = generateSecureString(
		Math.floor(Math.random() * (129 - 43) + 43),
	);

	dataManagerStore.setState({
		airtableCodeVerifier: codeVerifier,
	});

	// Generate code_challenge
	const codeChallenge = await generateCodeChallenge(codeVerifier);

	// Generate state
	const state = generateSecureString(
		Math.floor(Math.random() * (1025 - 16) + 16),
	);

	return { codeChallenge, state };
}

export async function getAirtableUrl() {
	const { codeChallenge, state } = await getRequiredSecrets();

	const params = {
		redirect_uri: AIRTABLE_REDIRECT_URI,
		client_id: AIRTABLE_CLIENT_ID!,
		code_challenge: codeChallenge,
		code_challenge_method: "S256",
		response_type: "code",
		scope: SCOPE,
		state,
	};

	// get urlencoded params
	return `${BASE_URL}?${new URLSearchParams(params)}`;
}
