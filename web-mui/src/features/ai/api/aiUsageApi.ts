import { apiRequest } from "../../../shared/api/http";

const AI_USAGE_STORAGE_KEY = "smartFoodPlanMui.aiUsage";

export type AiUsageState = {
  subscriptionStatus: "FREE" | "TRIAL" | "ACTIVE" | "EXPIRED";
  currentPlan: {
    id: string;
    name: string;
    code: string;
    monthlyTokenLimit: number;
    monthlyAiActions: number | null;
    priceCents: number;
    currency: string;
    isActive: boolean;
  } | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  tokensUsed: number;
  tokensLimit: number;
  tokensRemaining: number;
  aiActionsUsed: number;
  aiActionsRemaining: number;
  availableFeatures: string[];
  trialStartedAt: string | null;
  trialEndsAt: string | null;
};

type AiResponseEnvelope<TResponse> = {
  response: TResponse;
  aiUsage: AiUsageState;
};

export type UploadedAiImage = {
  objectKey: string;
  imageUrl: string;
  expiresAt: string;
  contentType: string;
  size: number;
};

export function getCachedAiUsage(): AiUsageState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AI_USAGE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AiUsageState;
  } catch {
    return null;
  }
}

export function setCachedAiUsage(value: AiUsageState | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!value) {
    window.localStorage.removeItem(AI_USAGE_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AI_USAGE_STORAGE_KEY, JSON.stringify(value));
}

export async function getAiUsage(): Promise<AiUsageState> {
  const response = await apiRequest<AiUsageState>("/v1/me/ai-usage");
  setCachedAiUsage(response);
  return response;
}

export async function postAiResponse<TResponse>(payload: {
  model: string;
  input: unknown;
  previous_response_id?: string;
  reasoning?: { effort?: "low" | "medium" | "high" };
  tools?: unknown[];
}): Promise<AiResponseEnvelope<TResponse>> {
  const response = await apiRequest<AiResponseEnvelope<TResponse>>("/v1/ai/responses", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  setCachedAiUsage(response.aiUsage);
  return response;
}

export async function uploadAiImage(file: File): Promise<UploadedAiImage> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<UploadedAiImage>("/v1/ai/uploads/image", {
    method: "POST",
    body: formData
  });
}
