import { apiRequest } from "../../../shared/api/http";

export type UserSex = "FEMALE" | "MALE" | "";
export type UserActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "VERY_ACTIVE" | "";
export type UserGoal = "MAINTAIN" | "LOSE" | "GAIN" | "";

export type UserProfile = {
  id?: string;
  userId?: string;
  firstName: string;
  lastName: string;
  sex: UserSex;
  birthDate: string;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: UserActivityLevel;
  goal: UserGoal;
  calorieDelta: number | null;
  targetCalories: number | null;
  targetProteinG: number | null;
  targetFatG: number | null;
  targetCarbsG: number | null;
};

type UserProfileResponseDto = {
  id?: string;
  userId?: string;
  firstName?: string | null;
  lastName?: string | null;
  sex?: "FEMALE" | "MALE" | null;
  birthDate?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  activityLevel?: "SEDENTARY" | "LIGHT" | "MODERATE" | "VERY_ACTIVE" | null;
  goal?: "MAINTAIN" | "LOSE" | "GAIN" | null;
  calorieDelta?: number | null;
  targetCalories?: number | null;
  targetProteinG?: number | null;
  targetFatG?: number | null;
  targetCarbsG?: number | null;
};

type UserMeResponseDto = {
  id: string;
  email: string;
  profile?: UserProfileResponseDto | null;
};

export type CurrentUserSettings = {
  id: string;
  email: string;
  profile: UserProfile;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeDate(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return value.slice(0, 10);
}

function mapProfile(input?: UserProfileResponseDto | null): UserProfile {
  return {
    id: input?.id,
    userId: input?.userId,
    firstName: input?.firstName ?? "",
    lastName: input?.lastName ?? "",
    sex: input?.sex ?? "",
    birthDate: normalizeDate(input?.birthDate),
    heightCm: toNumber(input?.heightCm),
    weightKg: toNumber(input?.weightKg),
    activityLevel: input?.activityLevel ?? "",
    goal: input?.goal ?? "",
    calorieDelta: toNumber(input?.calorieDelta),
    targetCalories: toNumber(input?.targetCalories),
    targetProteinG: toNumber(input?.targetProteinG),
    targetFatG: toNumber(input?.targetFatG),
    targetCarbsG: toNumber(input?.targetCarbsG)
  };
}

export async function getCurrentUserSettings(): Promise<CurrentUserSettings> {
  const response = await apiRequest<UserMeResponseDto>("/v1/me");
  return {
    id: response.id,
    email: response.email,
    profile: mapProfile(response.profile)
  };
}

function toProfilePayload(profile: UserProfile) {
  return {
    firstName: profile.firstName || undefined,
    lastName: profile.lastName || undefined,
    sex: profile.sex || undefined,
    birthDate: profile.birthDate || undefined,
    heightCm: profile.heightCm ?? undefined,
    weightKg: profile.weightKg ?? undefined,
    activityLevel: profile.activityLevel || undefined,
    goal: profile.goal || undefined,
    calorieDelta: profile.calorieDelta ?? undefined
  };
}

export async function saveUserProfile(profile: UserProfile): Promise<UserProfile> {
  const saved = await apiRequest<UserProfileResponseDto>("/v1/profile", {
    method: "PUT",
    body: JSON.stringify(toProfilePayload(profile))
  });
  return mapProfile(saved);
}

export async function recalculateUserProfile(): Promise<UserProfile> {
  const saved = await apiRequest<UserProfileResponseDto>("/v1/profile/recalculate", {
    method: "POST",
    body: JSON.stringify({})
  });
  return mapProfile(saved);
}
