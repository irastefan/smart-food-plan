import { ensureDirectoryAccess } from "@/utils/vaultProducts";
import { apiRequest } from "@/utils/apiClient";

const USER_DIRECTORY_NAME = "user";
const PROFILE_FILE_NAME = "profile.md";
const SETTINGS_FILE_NAME = "settings.md";

export type Sex = "female" | "male" | "unspecified";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export type GoalMode = "cut" | "maintain" | "bulk";

export type UserProfile = {
  name: string;
  sex: Sex;
  birthdate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel;
  goal: {
    mode: GoalMode;
    deltaPercent: number;
  };
  notes: string;
};

export type MacroPresetName = "balanced" | "high_protein" | "low_fat";

export type UserSettings = {
  calc: {
    formula: "mifflin" | "katch" | "harris";
    bodyFatPercent: number | null;
    pal: ActivityLevel;
    goalDeltaPercent: number;
  };
  targets: {
    mode: "auto_percent" | "auto_per_kg" | "manual";
    kcal: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
    sugarG: number | null;
    fiberG: number | null;
    autoPresets: {
      name: MacroPresetName;
      proteinPercent: number;
      fatPercent: number;
      carbsPercent: number;
    };
    autoPerKg: {
      protein: number;
      fat: number;
    };
    manualUnits: "grams" | "percent";
    manual: {
      protein: number;
      fat: number;
      carbs: number;
      sugar: number;
      fiber: number;
    };
  };
  meals: {
    showSectionTotals: boolean;
    sections: { id: string; label: string; enabled: boolean }[];
  };
  shopping: {
    sortUnpurchasedFirst: boolean;
    categories: { id: string; name: string; builtin: boolean }[];
  };
  ui: {
    language: "en" | "ru";
    units: {
      mass: "g" | "kg";
      volume: "ml" | "l";
    };
    numberDecimals: 0 | 1 | 2;
    dateFormat: "YYYY-MM-DD" | "DD.MM.YYYY";
  };
  ai: {
    mode: "local" | "http" | "manual";
    baseUrl: string;
    apiKey: string;
    modelName: string;
    timeoutMs: number;
    responseTemplate: string;
  };
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: "",
  sex: "unspecified",
  birthdate: null,
  heightCm: null,
  weightKg: null,
  activityLevel: "moderate",
  goal: {
    mode: "maintain",
    deltaPercent: 0
  },
  notes: ""
};

const BUILTIN_SECTIONS: UserSettings["meals"]["sections"] = [
  { id: "breakfast", label: "Breakfast", enabled: true },
  { id: "lunch", label: "Lunch", enabled: true },
  { id: "dinner", label: "Dinner", enabled: true },
  { id: "snack", label: "Snack", enabled: true },
  { id: "flex", label: "Flex", enabled: false }
];

const BUILTIN_CATEGORIES: UserSettings["shopping"]["categories"] = [
  { id: "produce", name: "Produce", builtin: true },
  { id: "dairy", name: "Dairy", builtin: true },
  { id: "fish", name: "Fish", builtin: true },
  { id: "meat", name: "Meat", builtin: true },
  { id: "grains", name: "Grains", builtin: true },
  { id: "bakery", name: "Bakery", builtin: true },
  { id: "pantry", name: "Pantry", builtin: true },
  { id: "frozen", name: "Frozen", builtin: true },
  { id: "beverages", name: "Beverages", builtin: true },
  { id: "household", name: "Household", builtin: true }
];

export const DEFAULT_USER_SETTINGS: UserSettings = {
  calc: {
    formula: "mifflin",
    bodyFatPercent: null,
    pal: "moderate",
    goalDeltaPercent: 0
  },
  targets: {
    mode: "auto_percent",
    kcal: 2000,
    proteinG: 125,
    fatG: 67,
    carbsG: 225,
    sugarG: 30,
    fiberG: 25,
    autoPresets: {
      name: "balanced",
      proteinPercent: 25,
      fatPercent: 30,
      carbsPercent: 45
    },
    autoPerKg: {
      protein: 1.8,
      fat: 0.8
    },
    manualUnits: "grams",
    manual: {
      protein: 120,
      fat: 60,
      carbs: 180,
      sugar: 25,
      fiber: 25
    }
  },
  meals: {
    showSectionTotals: true,
    sections: BUILTIN_SECTIONS
  },
  shopping: {
    sortUnpurchasedFirst: true,
    categories: BUILTIN_CATEGORIES
  },
  ui: {
    language: "en",
    units: {
      mass: "g",
      volume: "ml"
    },
    numberDecimals: 0,
    dateFormat: "YYYY-MM-DD"
  },
  ai: {
    mode: "manual",
    baseUrl: "",
    apiKey: "",
    modelName: "",
    timeoutMs: 8000,
    responseTemplate: ""
  }
};

type ParsedFrontMatter = {
  data: Record<string, unknown>;
  body: string;
};

function parseScalar(value: string): string | number | boolean | null {
  if (value === "null" || value === "~" || value === "") {
    return null;
  }
  if (value === "true" || value === "True") {
    return true;
  }
  if (value === "false" || value === "False") {
    return false;
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  return value.replace(/^"|"$/g, "");
}

function parseYamlFrontMatter(source: string): ParsedFrontMatter {
  const lines = source.split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== "---") {
    return { data: {}, body: source.trim() };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { data: {}, body: source.trim() };
  }

  const frontMatterLines = lines.slice(1, endIndex);
  const body = lines.slice(endIndex + 1).join("\n").trim();

  const data: Record<string, unknown> = {};
  const stack: { depth: number; target: Record<string, unknown> }[] = [
    { depth: 0, target: data }
  ];

  for (const rawLine of frontMatterLines) {
    if (!rawLine.trim()) {
      continue;
    }
    const indentLength = rawLine.match(/^ */)?.[0].length ?? 0;
    const depth = Math.floor(indentLength / 2);
    const trimmed = rawLine.trim();
    const [keyPart, ...rest] = trimmed.split(":");
    const key = keyPart.trim();

    while (stack.length > depth + 1) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].target;

    if (!key) {
      continue;
    }

    if (rest.length === 0 || rest.join(":").trim() === "") {
      const child: Record<string, unknown> = {};
      parent[key] = child;
      stack.push({ depth: depth + 1, target: child });
      continue;
    }

    const valuePart = rest.join(":").trim();
    parent[key] = parseScalar(valuePart);
  }

  return { data, body };
}

function escapeYamlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function objectToYaml(value: Record<string, unknown>, indent = 0): string {
  const pad = "  ".repeat(indent);
  const lines: string[] = [];
  for (const [key, raw] of Object.entries(value)) {
    if (raw === undefined) {
      continue;
    }
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      lines.push(`${pad}${key}:`);
      lines.push(objectToYaml(raw as Record<string, unknown>, indent + 1));
      continue;
    }
    if (Array.isArray(raw)) {
      lines.push(`${pad}${key}:`);
      for (const item of raw) {
        if (item && typeof item === "object") {
          const nested = objectToYaml(item as Record<string, unknown>, indent + 2);
          lines.push(`${pad}  -`);
          lines.push(nested);
        } else {
          lines.push(`${pad}  - ${formatScalar(item)}`);
        }
      }
      continue;
    }
    lines.push(`${pad}${key}: ${formatScalar(raw)}`);
  }
  return lines.join("\n");
}

function formatScalar(raw: unknown): string {
  if (raw === null) {
    return "null";
  }
  if (raw === true) {
    return "true";
  }
  if (raw === false) {
    return "false";
  }
  if (typeof raw === "number") {
    return Number.isInteger(raw) ? String(raw) : String(Number(raw.toFixed(4)));
  }
  if (typeof raw === "string") {
    if (!raw) {
      return '""';
    }
    if (/^[A-Za-z0-9_\-:.]+$/.test(raw)) {
      return raw;
    }
    return `"${escapeYamlString(raw)}"`;
  }
  return '""';
}

async function ensureUserDirectory(
  vaultHandle: FileSystemDirectoryHandle
): Promise<FileSystemDirectoryHandle> {
  return vaultHandle.getDirectoryHandle(USER_DIRECTORY_NAME, { create: true });
}

function normalizeProfileFromData(data: Record<string, unknown>): UserProfile {
  const goalData = (data.goal as Record<string, unknown>) ?? {};
  return {
    name: typeof data.name === "string" ? data.name : "",
    sex: (data.sex as Sex) ?? "unspecified",
    birthdate: typeof data.birthdate === "string" && data.birthdate.length > 0 ? data.birthdate : null,
    heightCm:
      typeof data.height_cm === "number"
        ? data.height_cm
        : typeof data.height_cm === "string"
        ? Number.parseFloat(data.height_cm)
        : null,
    weightKg:
      typeof data.weight_kg === "number"
        ? data.weight_kg
        : typeof data.weight_kg === "string"
        ? Number.parseFloat(data.weight_kg)
        : null,
    activityLevel: (data.activity_level as ActivityLevel) ?? "moderate",
    goal: {
      mode: (goalData.mode as GoalMode) ?? "maintain",
      deltaPercent:
        typeof goalData.delta_percent === "number"
          ? goalData.delta_percent
          : typeof goalData.delta_percent === "string"
          ? Number.parseFloat(goalData.delta_percent)
          : 0
    },
    notes: typeof data.notes === "string" ? data.notes : ""
  };
}

function buildProfileContent(profile: UserProfile): string {
  const payload: Record<string, unknown> = {
    name: profile.name || "",
    sex: profile.sex,
    birthdate: profile.birthdate ?? null,
    height_cm: profile.heightCm ?? null,
    weight_kg: profile.weightKg ?? null,
    activity_level: profile.activityLevel,
    goal: {
      mode: profile.goal.mode,
      delta_percent: profile.goal.deltaPercent
    },
    notes: profile.notes ?? ""
  };
  const yaml = objectToYaml(payload);
  return `---\n${yaml}\n---\n`;
}

function normalizeSettingsFromData(body: string): UserSettings {
  if (!body) {
    return DEFAULT_USER_SETTINGS;
  }
  try {
    const parsed = JSON.parse(body) as Partial<UserSettings>;
    return {
      ...DEFAULT_USER_SETTINGS,
      ...parsed,
      calc: {
        ...DEFAULT_USER_SETTINGS.calc,
        ...parsed?.calc
      },
      targets: {
        ...DEFAULT_USER_SETTINGS.targets,
        ...parsed?.targets,
        autoPresets: {
          ...DEFAULT_USER_SETTINGS.targets.autoPresets,
          ...(parsed?.targets?.autoPresets ?? {})
        },
        autoPerKg: {
          ...DEFAULT_USER_SETTINGS.targets.autoPerKg,
          ...(parsed?.targets?.autoPerKg ?? {})
        },
        manual: {
          ...DEFAULT_USER_SETTINGS.targets.manual,
          ...(parsed?.targets?.manual ?? {})
        }
      },
      meals: {
        ...DEFAULT_USER_SETTINGS.meals,
        ...parsed?.meals,
        sections:
          parsed?.meals?.sections && parsed.meals.sections.length > 0
            ? parsed.meals.sections
            : DEFAULT_USER_SETTINGS.meals.sections
      },
      shopping: {
        ...DEFAULT_USER_SETTINGS.shopping,
        ...parsed?.shopping,
        categories:
          parsed?.shopping?.categories && parsed.shopping.categories.length > 0
            ? parsed.shopping.categories
            : DEFAULT_USER_SETTINGS.shopping.categories
      },
      ui: {
        ...DEFAULT_USER_SETTINGS.ui,
        ...parsed?.ui,
        units: {
          ...DEFAULT_USER_SETTINGS.ui.units,
          ...(parsed?.ui?.units ?? {})
        }
      },
      ai: {
        ...DEFAULT_USER_SETTINGS.ai,
        ...parsed?.ai
      }
    };
  } catch (error) {
    console.warn("Failed to parse settings JSON", error);
    return DEFAULT_USER_SETTINGS;
  }
}

function buildSettingsContent(settings: UserSettings): string {
  const payload = JSON.stringify(settings, null, 2);
  return `---\nformat: "json"\n---\n${payload}\n`;
}

const PROFILE_KEY = "smartFoodPlan.userProfile";
const SETTINGS_KEY = "smartFoodPlan.userSettings";

function readLocalJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocalJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

function mergeProfileWithDefaults(profile: Partial<UserProfile>): UserProfile {
  return {
    ...DEFAULT_USER_PROFILE,
    ...profile
  };
}

function mergeSettingsWithDefaults(settings: Partial<UserSettings>): UserSettings {
  return {
    ...DEFAULT_USER_SETTINGS,
    ...settings,
    meals: {
      ...DEFAULT_USER_SETTINGS.meals,
      ...(settings.meals ?? {})
    },
    calc: {
      ...DEFAULT_USER_SETTINGS.calc,
      ...(settings.calc ?? {})
    },
    targets: {
      ...DEFAULT_USER_SETTINGS.targets,
      ...(settings.targets ?? {}),
      manual: {
        ...DEFAULT_USER_SETTINGS.targets.manual,
        ...(settings.targets?.manual ?? {})
      },
      autoPerKg: {
        ...DEFAULT_USER_SETTINGS.targets.autoPerKg,
        ...(settings.targets?.autoPerKg ?? {})
      },
      autoPresets: {
        ...DEFAULT_USER_SETTINGS.targets.autoPresets,
        ...(settings.targets?.autoPresets ?? {})
      }
    },
    shopping: {
      ...DEFAULT_USER_SETTINGS.shopping,
      ...(settings.shopping ?? {}),
      categories:
        settings.shopping?.categories && settings.shopping.categories.length > 0
          ? settings.shopping.categories
          : DEFAULT_USER_SETTINGS.shopping.categories
    },
    ui: {
      ...DEFAULT_USER_SETTINGS.ui,
      ...(settings.ui ?? {}),
      units: {
        ...DEFAULT_USER_SETTINGS.ui.units,
        ...(settings.ui?.units ?? {})
      }
    },
    ai: {
      ...DEFAULT_USER_SETTINGS.ai,
      ...(settings.ai ?? {})
    }
  };
}

function mapProfileToBackend(profile: UserProfile): Record<string, unknown> {
  const sex = profile.sex === "female" ? "FEMALE" : profile.sex === "male" ? "MALE" : undefined;
  const activityMap: Record<ActivityLevel, string> = {
    sedentary: "SEDENTARY",
    light: "LIGHT",
    moderate: "MODERATE",
    active: "VERY_ACTIVE",
    very_active: "VERY_ACTIVE"
  };
  const goalMap: Record<GoalMode, string> = {
    maintain: "MAINTAIN",
    cut: "LOSE",
    bulk: "GAIN"
  };

  return {
    firstName: profile.name?.trim() || undefined,
    lastName: undefined,
    sex,
    birthDate: profile.birthdate ?? undefined,
    heightCm: profile.heightCm ?? undefined,
    weightKg: profile.weightKg ?? undefined,
    activityLevel: activityMap[profile.activityLevel] ?? "MODERATE",
    goal: goalMap[profile.goal.mode] ?? "MAINTAIN",
    calorieDelta: profile.goal.deltaPercent ?? undefined
  };
}

function mapBackendToProfile(payload: Record<string, unknown> | null | undefined): Partial<UserProfile> {
  if (!payload) {
    return {};
  }

  const sexRaw = String(payload.sex ?? "").toUpperCase();
  const sex: Sex =
    sexRaw === "FEMALE" ? "female" : sexRaw === "MALE" ? "male" : "unspecified";

  const activityRaw = String(payload.activityLevel ?? "").toUpperCase();
  const activity: ActivityLevel =
    activityRaw === "SEDENTARY"
      ? "sedentary"
      : activityRaw === "LIGHT"
      ? "light"
      : activityRaw === "VERY_ACTIVE"
      ? "active"
      : "moderate";

  const goalRaw = String(payload.goal ?? "").toUpperCase();
  const goalMode: GoalMode =
    goalRaw === "LOSE" ? "cut" : goalRaw === "GAIN" ? "bulk" : "maintain";

  return {
    name: [toNullableString(payload.firstName), toNullableString(payload.lastName)]
      .filter((part) => Boolean(part))
      .join(" ")
      .trim(),
    sex,
    birthdate: toDateOnlyString(payload.birthDate),
    heightCm: toNullableNumber(payload.heightCm),
    weightKg: toNullableNumber(payload.weightKg),
    activityLevel: activity,
    goal: {
      mode: goalMode,
      deltaPercent: toNullableNumber(payload.calorieDelta) ?? 0
    }
  };
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toNullableString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return null;
}

function toDateOnlyString(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  return value.slice(0, 10);
}

export async function loadUserProfile(
  _vaultHandle: FileSystemDirectoryHandle
): Promise<UserProfile> {
  const localProfile = mergeProfileWithDefaults(readLocalJson<Partial<UserProfile>>(PROFILE_KEY, {}));
  try {
    const me = await apiRequest<{ profile?: Record<string, unknown> }>("/v1/me");
    const merged = mergeProfileWithDefaults({ ...localProfile, ...mapBackendToProfile(me.profile) });
    writeLocalJson(PROFILE_KEY, merged);
    return merged;
  } catch {
    return localProfile;
  }
}

export async function saveUserProfile(
  _vaultHandle: FileSystemDirectoryHandle,
  profile: UserProfile
): Promise<void> {
  writeLocalJson(PROFILE_KEY, profile);
  try {
    await apiRequest("/v1/profile", {
      method: "PUT",
      body: JSON.stringify(mapProfileToBackend(profile))
    });
  } catch {
    // Keep local data as fallback when backend profile endpoint is unavailable.
  }
}

export async function loadUserSettings(
  _vaultHandle: FileSystemDirectoryHandle
): Promise<UserSettings> {
  const localSettings = mergeSettingsWithDefaults(readLocalJson<Partial<UserSettings>>(SETTINGS_KEY, {}));
  return localSettings;
}

export async function saveUserSettings(
  _vaultHandle: FileSystemDirectoryHandle,
  settings: UserSettings
): Promise<void> {
  writeLocalJson(SETTINGS_KEY, settings);
}
