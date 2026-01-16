import axios, { type InternalAxiosRequestConfig } from "axios";

// Create centralized Axios instance
export const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});

axiosClient.interceptors.request.use(putAuthTokenOnHeader, putAuthTokenOnHeaderError);

async function putAuthTokenOnHeader(config: InternalAxiosRequestConfig<unknown>) {
  try {
    const headerAuth = await getHeaderAuth();

    Object.assign(config.headers, headerAuth);
  } catch (error) {
    console.error("Error getting token on clientAPI interceptor!", error);
  }

  return config;
}
function putAuthTokenOnHeaderError(error: unknown) {
  return Promise.reject(error);
}

export enum AuthTokenType {
  Bearer = "Bearer",
  ApiKey = "ApiKey",
}

export async function getHeaderAuth() {
  const headers: Record<string, string> = {};

  const token = await getAuthToken();

  switch (token.type) {
    case AuthTokenType.Bearer: {
      headers.Authorization = `Bearer ${token.token}`;

      break;
    }

    case AuthTokenType.ApiKey: {
      if (!token.token) {
        console.error("No token found for auth!", { token });

        throw new Error("No token found for auth!");
      }

      headers["API-KEY"] = token.token;

      break;
    }
  }

  return headers;
}

export async function getAuthToken() {
  if (!window?.Clerk) {
    throw new Error("Clerk is not defined on window.");
  }

  const start = performance.now();
  const clerkToken = await window.Clerk.session?.getToken({
    template: "basicToken",
  });
  const timeTaken = performance.now() - start;
  if (timeTaken > 700) {
    console.log("Got clerk token in");
  }

  return { token: clerkToken, type: AuthTokenType.Bearer };
}
