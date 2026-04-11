import { apiRequest } from "../../../shared/api/http";
import { getEffectiveCalorieDelta } from "../model/profileDefaults";

export type UserSex = "FEMALE" | "MALE" | "";
export type UserActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "VERY_ACTIVE" | "";
export type UserGoal = "MAINTAIN" | "LOSE" | "GAIN" | "";
export type UserMacroProfile = "BALANCED" | "HIGH_PROTEIN" | "LOW_CARB" | "HIGH_CARB";

export type TargetFormulaOption = {
  value: string;
  label: string;
  description: string;
  isDefault: boolean;
};

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
  macroProfile: UserMacroProfile;
  targetFormula: string;
  availableTargetFormulas: TargetFormulaOption[];
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
  macroProfile?: "BALANCED" | "HIGH_PROTEIN" | "LOW_CARB" | "HIGH_CARB" | null;
  targetFormula?: string | null;
  availableTargetFormulas?: Array<{
    value?: string | null;
    label?: string | null;
    description?: string | null;
    isDefault?: boolean | null;
  }> | null;
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
  const availableTargetFormulas: TargetFormulaOption[] = (input?.availableTargetFormulas ?? [])
    .filter((option): option is NonNullable<typeof option> => Boolean(option?.value))
    .map((option) => ({
      value: option.value ?? "",
      label: option.label ?? option.value ?? "",
      description: option.description ?? "",
      isDefault: Boolean(option.isDefault)
    }));
  const fallbackTargetFormula =
    availableTargetFormulas.find((option) => option.isDefault)?.value ??
    availableTargetFormulas[0]?.value ??
    "";

  const goal = input?.goal ?? "";

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
    goal,
    macroProfile: input?.macroProfile ?? "BALANCED",
    targetFormula: input?.targetFormula ?? fallbackTargetFormula,
    availableTargetFormulas,
    calorieDelta: getEffectiveCalorieDelta(goal, toNumber(input?.calorieDelta)),
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
    macroProfile: profile.macroProfile || undefined,
    targetFormula: profile.targetFormula || undefined,
    calorieDelta: profile.goal === "MAINTAIN" ? undefined : getEffectiveCalorieDelta(profile.goal, profile.calorieDelta) ?? undefined
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
