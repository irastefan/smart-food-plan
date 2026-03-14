import { apiRequest, setAccessToken } from "../../../shared/api/http";

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type MeResponse = {
  id: string;
  email: string;
  profile?: unknown | null;
};

export async function login(payload: { email: string; password: string }): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>(
    "/v1/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    { auth: false }
  );

  setAccessToken(response.accessToken);
  return response;
}

export async function register(payload: { email: string; password: string }): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>(
    "/v1/auth/register",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    { auth: false }
  );

  setAccessToken(response.accessToken);
  return response;
}

export async function getMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>("/v1/me");
}
