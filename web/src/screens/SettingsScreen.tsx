import clsx from "clsx";
import { ChangeEvent, DragEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { useI18n, useTranslation } from "@/i18n/I18nProvider";
import { ensureDirectoryAccess } from "@/utils/vaultProducts";
import {
  ActivityLevel,
  DEFAULT_USER_PROFILE,
  DEFAULT_USER_SETTINGS,
  MacroPresetName,
  UserProfile,
  UserSettings,
  loadUserProfile,
  loadUserSettings,
  saveUserProfile,
  saveUserSettings
} from "@/utils/vaultUser";
import { createSlug } from "@/utils/vaultProducts";
import {
  clearVaultDirectoryHandle,
  loadVaultDirectoryHandle,
  saveVaultDirectoryHandle
} from "@/utils/vaultStorage";
import styles from "./SettingsScreen.module.css";

type SettingsTab =
  | "profile"
  | "macros"
  | "meals"
  | "shopping"
  | "interface"
  | "ai"
  | "vault";

type StatusState =
  | {
      type: "info" | "success" | "error";
      message: string;
    }
  | null;

type ProfileErrors = Partial<{
  heightCm: string;
  weightKg: string;
  birthdate: string;
  goalDelta: string;
}>;

type MacroErrors = Partial<{
  kcal: string;
  protein: string;
  fat: string;
  carbs: string;
  sugar: string;
  fiber: string;
  percentSum: string;
  perKg: string;
}>;

type MealsErrors = string | null;
type ShoppingErrors = string | null;

type MacroWarningKey = "percent_sum" | "perkg_weight_missing";

type MacroComputation = {
  bmr: number | null;
  tdee: number | null;
  adjusted: number | null;
  targets: {
    kcal: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
    sugar: number | null;
    fiber: number | null;
  };
  warnings: MacroWarningKey[];
};

const AUTO_SAVE_DELAY_MS = 650;

const TAB_ORDER: SettingsTab[] = ["profile", "macros", "meals", "shopping", "interface", "ai", "vault"];

const PAL_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

const MACRO_PRESET_MAP: Record<MacroPresetName, { protein: number; fat: number; carbs: number }> = {
  balanced: { protein: 25, fat: 30, carbs: 45 },
  high_protein: { protein: 30, fat: 25, carbs: 45 },
  low_fat: { protein: 30, fat: 20, carbs: 50 }
};

function calculateAge(birthdate: string | null): number | null {
  if (!birthdate) {
    return null;
  }
  const birth = new Date(birthdate);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function calculateBmr(profile: UserProfile, calc: UserSettings["calc"]): number | null {
  const weight = profile.weightKg;
  const height = profile.heightCm;
  const age = calculateAge(profile.birthdate);

  if (!weight || !height) {
    return null;
  }

  switch (calc.formula) {
    case "mifflin": {
      if (age === null) {
        return null;
      }
      const base = 10 * weight + 6.25 * height - 5 * age;
      if (profile.sex === "female") {
        return base - 161;
      }
      if (profile.sex === "male") {
        return base + 5;
      }
      return base - 78; // average between male/female when unspecified
    }
    case "harris": {
      if (age === null) {
        return null;
      }
      if (profile.sex === "female") {
        return 655.1 + 9.563 * weight + 1.85 * height - 4.676 * age;
      }
      if (profile.sex === "male") {
        return 66.5 + 13.75 * weight + 5.003 * height - 6.755 * age;
      }
      const female = 655.1 + 9.563 * weight + 1.85 * height - 4.676 * age;
      const male = 66.5 + 13.75 * weight + 5.003 * height - 6.755 * age;
      return (female + male) / 2;
    }
    case "katch": {
      if (calc.bodyFatPercent === null || calc.bodyFatPercent <= 0 || calc.bodyFatPercent >= 60) {
        return null;
      }
      const lbm = weight * (1 - calc.bodyFatPercent / 100);
      return 370 + 21.6 * lbm;
    }
    default:
      return null;
  }
}

function calculateMacroTargets(profile: UserProfile, settings: UserSettings): MacroComputation {
  const bmr = calculateBmr(profile, settings.calc);
  const palFactor = PAL_FACTORS[settings.calc.pal] ?? 1.4;
  const tdee = bmr ? bmr * palFactor : null;
  const adjusted = tdee ? tdee * (1 + settings.calc.goalDeltaPercent / 100) : null;

  let kcal: number | null = settings.targets.kcal;
  let protein: number | null = settings.targets.proteinG;
  let fat: number | null = settings.targets.fatG;
  let carbs: number | null = settings.targets.carbsG;
  let sugar: number | null = settings.targets.sugarG;
  let fiber: number | null = settings.targets.fiberG;
  const warnings: MacroWarningKey[] = [];

  const weight = profile.weightKg ?? null;

  if (settings.targets.mode === "auto_percent") {
    if (adjusted) {
      kcal = adjusted;
    }
    const preset = settings.targets.autoPresets;
    const sumPercent = preset.proteinPercent + preset.fatPercent + preset.carbsPercent;
    if (sumPercent !== 100) {
      warnings.push("percent_sum");
    }
    if (kcal) {
      protein = (kcal * preset.proteinPercent) / 100 / 4;
      fat = (kcal * preset.fatPercent) / 100 / 9;
      carbs = (kcal * preset.carbsPercent) / 100 / 4;
      sugar = settings.targets.sugarG ?? null;
      fiber = settings.targets.fiberG ?? null;
    }
  } else if (settings.targets.mode === "auto_per_kg") {
    if (adjusted) {
      kcal = adjusted;
    }
    if (!weight) {
      warnings.push("perkg_weight_missing");
      protein = null;
      fat = null;
      carbs = null;
    } else {
      protein = weight * settings.targets.autoPerKg.protein;
      fat = weight * settings.targets.autoPerKg.fat;
      if (kcal) {
        const kcalFromProtein = protein * 4;
        const kcalFromFat = fat * 9;
        const remainingKcal = Math.max(kcal - (kcalFromProtein + kcalFromFat), 0);
        carbs = remainingKcal / 4;
      } else {
        carbs = null;
      }
      sugar = settings.targets.sugarG ?? null;
      fiber = settings.targets.fiberG ?? null;
    }
  } else {
    kcal = settings.targets.kcal;
    const manual = settings.targets.manual;
    if (settings.targets.manualUnits === "percent") {
      if (kcal) {
        protein = (kcal * manual.protein) / 100 / 4;
        fat = (kcal * manual.fat) / 100 / 9;
        carbs = (kcal * manual.carbs) / 100 / 4;
        sugar = (kcal * manual.sugar) / 100 / 4;
        fiber = manual.fiber;
      }
    } else {
      protein = manual.protein;
      fat = manual.fat;
      carbs = manual.carbs;
      sugar = manual.sugar;
      fiber = manual.fiber;
    }
  }

  return {
    bmr,
    tdee,
    adjusted,
    targets: {
      kcal: kcal ? Math.round(kcal) : null,
      protein: protein ? Math.round(protein) : null,
      fat: fat ? Math.round(fat) : null,
      carbs: carbs ? Math.round(carbs) : null,
      sugar: sugar ? Math.round(sugar) : null,
      fiber: fiber ? Math.round(fiber) : null
    },
    warnings
  };
}

function hasErrorsObject(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some((value) => Boolean(value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function nearlyEqual(a: number | null, b: number | null, tolerance = 1): boolean {
  if (a === null || b === null) {
    return false;
  }
  return Math.abs(a - b) <= tolerance;
}

export function SettingsScreen(): JSX.Element {
  const { t } = useTranslation();
  const { language, setLanguage } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [status, setStatus] = useState<StatusState>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [macroErrors, setMacroErrors] = useState<MacroErrors>({});
  const [mealsErrors, setMealsErrors] = useState<MealsErrors>(null);
  const [shoppingErrors, setShoppingErrors] = useState<ShoppingErrors>(null);
  const [macroWarnings, setMacroWarnings] = useState<MacroWarningKey[]>([]);
  const [dragSectionId, setDragSectionId] = useState<string | null>(null);
  const [dragCategoryId, setDragCategoryId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<StatusState>(null);

  const autosaveTimer = useRef<number | null>(null);
  const dirtyRef = useRef(false);
  const profileRef = useRef<UserProfile>(profile);
  const settingsRef = useRef<UserSettings>(settings);
  const languageRef = useRef(language);
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const validateProfile = useCallback(
    (next: UserProfile): ProfileErrors => {
      const errors: ProfileErrors = {};
      if (next.heightCm !== null) {
        if (next.heightCm < 120 || next.heightCm > 230) {
          errors.heightCm = t("settings.profile.error.height");
        }
      }
      if (next.weightKg !== null) {
        if (next.weightKg < 30 || next.weightKg > 220) {
          errors.weightKg = t("settings.profile.error.weight");
        }
      }
      const age = calculateAge(next.birthdate);
      if (age !== null && (age < 14 || age > 90)) {
        errors.birthdate = t("settings.profile.error.birthdate");
      }
      if (next.goal.deltaPercent < -25 || next.goal.deltaPercent > 25) {
        errors.goalDelta = t("settings.profile.error.goalDelta");
      } else if (next.goal.mode === "maintain" && Math.abs(next.goal.deltaPercent) > 3) {
        errors.goalDelta = t("settings.profile.error.goalMaintain");
      } else if (next.goal.mode === "cut" && next.goal.deltaPercent > 0) {
        errors.goalDelta = t("settings.profile.error.goalCut");
      } else if (next.goal.mode === "bulk" && next.goal.deltaPercent < 0) {
        errors.goalDelta = t("settings.profile.error.goalBulk");
      }
      return errors;
    },
    [t]
  );

  const validateMacros = useCallback(
    (profileValue: UserProfile, settingsValue: UserSettings, preview: MacroComputation): MacroErrors => {
      const errors: MacroErrors = {};
      const kcal = settingsValue.targets.kcal;
      if (kcal < 900 || kcal > 4500) {
        errors.kcal = t("settings.macros.error.kcal");
      }
      if (settingsValue.targets.mode === "auto_percent") {
        const { proteinPercent, fatPercent, carbsPercent } = settingsValue.targets.autoPresets;
        const sum = proteinPercent + fatPercent + carbsPercent;
        if (sum !== 100) {
          errors.percentSum = t("settings.macros.error.percentSum", { value: String(sum) });
        }
      }
      if (settingsValue.targets.mode === "auto_per_kg") {
        if (!profileValue.weightKg || profileValue.weightKg <= 0) {
          errors.perKg = t("settings.macros.error.weightMissing");
        }
        if (settingsValue.targets.autoPerKg.protein < 0.8 || settingsValue.targets.autoPerKg.protein > 3) {
          errors.protein = t("settings.macros.error.perKgProtein");
        }
        if (settingsValue.targets.autoPerKg.fat < 0.5 || settingsValue.targets.autoPerKg.fat > 1.5) {
          errors.fat = t("settings.macros.error.perKgFat");
        }
      }
      if (settingsValue.targets.mode === "manual") {
        if (settingsValue.targets.manualUnits === "grams") {
          if (settingsValue.targets.manual.protein / Math.max(profileValue.weightKg ?? 1, 1) < 0.8) {
            errors.protein = t("settings.macros.warning.lowProtein");
          }
          if (settingsValue.targets.manual.fat / Math.max(profileValue.weightKg ?? 1, 1) < 0.5) {
            errors.fat = t("settings.macros.warning.lowFat");
          }
        } else {
          const sum =
            settingsValue.targets.manual.protein +
            settingsValue.targets.manual.fat +
            settingsValue.targets.manual.carbs;
          if (Math.abs(sum - 100) > 0.1) {
            errors.percentSum = t("settings.macros.error.percentSum", { value: sum.toFixed(1) });
          }
        }
      }
      if (preview.targets.fat && preview.targets.kcal) {
        const fatKcal = preview.targets.fat * 9;
        if (fatKcal / preview.targets.kcal < 0.2) {
          errors.fat = t("settings.macros.warning.lowFat");
        }
      }
      return errors;
    },
    [t]
  );

  const validateMeals = useCallback((settingsValue: UserSettings): MealsErrors => {
    if (!settingsValue.meals.sections || settingsValue.meals.sections.length === 0) {
      return t("settings.meals.error.empty");
    }
    if (settingsValue.meals.sections.length > 8) {
      return t("settings.meals.error.tooMany");
    }
    const identifiers = new Set<string>();
    for (const section of settingsValue.meals.sections) {
      if (!section.id || !/^[a-z0-9_-]+$/.test(section.id)) {
        return t("settings.meals.error.invalidId");
      }
      if (identifiers.has(section.id)) {
        return t("settings.meals.error.duplicate");
      }
      identifiers.add(section.id);
    }
    return null;
  }, [t]);

  const validateShopping = useCallback((settingsValue: UserSettings): ShoppingErrors => {
    if (!settingsValue.shopping.categories || settingsValue.shopping.categories.length === 0) {
      return t("settings.shopping.error.empty");
    }
    const ids = new Set<string>();
    for (const category of settingsValue.shopping.categories) {
      if (!category.id || !/^[a-z0-9_-]+$/.test(category.id)) {
        return t("settings.shopping.error.invalidId");
      }
      if (ids.has(category.id)) {
        return t("settings.shopping.error.duplicate");
      }
      ids.add(category.id);
    }
    return null;
  }, [t]);

  const scheduleAutosave = useCallback(() => {
    if (!vaultHandle) {
      return;
    }
    dirtyRef.current = true;
    if (autosaveTimer.current) {
      window.clearTimeout(autosaveTimer.current);
    }
    autosaveTimer.current = window.setTimeout(() => {
      void handleSave();
    }, AUTO_SAVE_DELAY_MS);
  }, [vaultHandle]);

  const handleSave = useCallback(async () => {
    if (!vaultHandle) {
      setStatus({ type: "error", message: t("settings.status.noVault") });
      return;
    }
    if (!dirtyRef.current) {
      return;
    }
    if (hasErrorsObject(profileErrors) || hasErrorsObject(macroErrors) || mealsErrors || shoppingErrors) {
      setStatus({ type: "error", message: t("settings.status.validationError") });
      setAutosaveState("error");
      return;
    }
    setAutosaveState("saving");
    setIsMutating(true);
    try {
      await saveUserProfile(vaultHandle, profileRef.current);
      await saveUserSettings(vaultHandle, settingsRef.current);
      dirtyRef.current = false;
      setAutosaveState("saved");
      setStatus({ type: "success", message: t("settings.status.saved") });
    } catch (error) {
      console.error("Failed to save settings", error);
      setAutosaveState("error");
      setStatus({ type: "error", message: t("settings.status.saveError") });
    } finally {
      setIsMutating(false);
    }
  }, [macroErrors, mealsErrors, profileErrors, shoppingErrors, t, vaultHandle]);

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) {
        window.clearTimeout(autosaveTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    setAutosaveState("idle");
  }, [activeTab]);

  const loadVaultData = useCallback(
    async (handle: FileSystemDirectoryHandle | null) => {
      if (!handle) {
        setProfile(DEFAULT_USER_PROFILE);
        setSettings(DEFAULT_USER_SETTINGS);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const loadedProfile = await loadUserProfile(handle);
        const loadedSettings = await loadUserSettings(handle);
        setProfile(loadedProfile);
        setSettings(loadedSettings);
        setProfileErrors(validateProfile(loadedProfile));
        const preview = calculateMacroTargets(loadedProfile, loadedSettings);
        setMacroWarnings(preview.warnings);
        setMacroErrors(validateMacros(loadedProfile, loadedSettings, preview));
        setMealsErrors(validateMeals(loadedSettings));
        setShoppingErrors(validateShopping(loadedSettings));
        const currentLanguage = languageRef.current;
        if (loadedSettings.ui.language && loadedSettings.ui.language !== currentLanguage) {
          setLanguage(loadedSettings.ui.language);
        }
      } catch (error) {
        console.error("Failed to load user settings", error);
        setStatus({ type: "error", message: t("settings.status.loadError") });
      } finally {
        setIsLoading(false);
      }
    },
    [setLanguage, t, validateMacros, validateMeals, validateProfile, validateShopping]
  );

  useEffect(() => {
    if (hasRestoredRef.current) {
      return;
    }

    if (typeof window === "undefined" || !("indexedDB" in window)) {
      setIsLoading(false);
      hasRestoredRef.current = true;
      return;
    }

    let cancelled = false;

    const restore = async () => {
      try {
        const handle = await loadVaultDirectoryHandle();
        if (cancelled) {
          return;
        }
        if (!handle) {
          setIsLoading(false);
          return;
        }
        const hasAccess = await ensureDirectoryAccess(handle);
        if (cancelled) {
          return;
        }
        if (!hasAccess) {
          await clearVaultDirectoryHandle();
          if (!cancelled) {
            setIsLoading(false);
          }
          return;
        }
        if (cancelled) {
          return;
        }
        setVaultHandle(handle);
        if (cancelled) {
          return;
        }
        await loadVaultData(handle);
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.error("Failed to restore vault handle", error);
        setStatus({ type: "error", message: t("settings.status.loadError") });
        setIsLoading(false);
      } finally {
        if (!cancelled) {
          hasRestoredRef.current = true;
        }
      }
    };

    void restore();

    return () => {
      cancelled = true;
    };
  }, [loadVaultData, t]);

  useEffect(() => {
    if (!settings.calc) {
      return;
    }
    if (settings.calc.goalDeltaPercent !== profile.goal.deltaPercent) {
      setSettings((prev) => ({
        ...prev,
        calc: {
          ...prev.calc,
          goalDeltaPercent: profile.goal.deltaPercent
        }
      }));
    }
  }, [profile.goal.deltaPercent, settings.calc]);

  useEffect(() => {
    const preview = calculateMacroTargets(profile, settings);
    setMacroWarnings(preview.warnings);
    setMacroErrors(validateMacros(profile, settings, preview));
    if (settings.targets.mode !== "manual") {
      setSettings((prev) => {
        const current = prev.targets;
        const nextTargets = {
          ...current,
          kcal: preview.targets.kcal ?? current.kcal,
          proteinG: preview.targets.protein ?? current.proteinG,
          fatG: preview.targets.fat ?? current.fatG,
          carbsG: preview.targets.carbs ?? current.carbsG,
          sugarG: preview.targets.sugar ?? current.sugarG,
          fiberG: preview.targets.fiber ?? current.fiberG
        };
        if (
          current.kcal === nextTargets.kcal &&
          nearlyEqual(current.proteinG, nextTargets.proteinG) &&
          nearlyEqual(current.fatG, nextTargets.fatG) &&
          nearlyEqual(current.carbsG, nextTargets.carbsG)
        ) {
          return prev;
        }
        const next = {
          ...prev,
          targets: nextTargets
        };
        settingsRef.current = next;
        return next;
      });
    }
    setMealsErrors(validateMeals(settings));
    setShoppingErrors(validateShopping(settings));
  }, [profile, settings, validateMacros, validateMeals, validateShopping]);

  const handleSelectVault = useCallback(async () => {
    if (typeof window === "undefined" || !window.showDirectoryPicker) {
      setStatus({ type: "error", message: t("settings.status.browserUnsupported") });
      return;
    }
    try {
      const handle = await window.showDirectoryPicker();
      if (!handle) {
        return;
      }
      const hasAccess = await ensureDirectoryAccess(handle);
      if (!hasAccess) {
        setStatus({ type: "error", message: t("settings.status.permissionError") });
        return;
      }
      setVaultHandle(handle);
      if ("indexedDB" in window) {
        await saveVaultDirectoryHandle(handle);
      }
      setStatus({ type: "success", message: t("settings.status.connected", { folder: handle.name }) });
      void loadVaultData(handle);
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") {
        return;
      }
      console.error("Failed to select vault", error);
      setStatus({ type: "error", message: t("settings.status.genericError") });
    }
  }, [loadVaultData, t]);

  const updateProfile = useCallback(
    (updater: (prev: UserProfile) => UserProfile) => {
      setProfile((prev) => {
        const next = updater(prev);
        setProfileErrors(validateProfile(next));
        scheduleAutosave();
        return next;
      });
    },
    [scheduleAutosave, validateProfile]
  );

  const updateSettings = useCallback(
    (updater: (prev: UserSettings) => UserSettings) => {
      setSettings((prev) => {
        const next = updater(prev);
        scheduleAutosave();
        return next;
      });
    },
    [scheduleAutosave]
  );

  const macroPreview = useMemo(() => calculateMacroTargets(profile, settings), [profile, settings]);

  const handleProfileInput =
    <K extends keyof UserProfile>(field: K) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      updateProfile((prev) => {
        if (field === "heightCm" || field === "weightKg") {
          const numeric = value === "" ? null : Number.parseFloat(value);
          return {
            ...prev,
            [field]: Number.isFinite(numeric) ? numeric : null
          };
        }
        if (field === "birthdate") {
          return { ...prev, birthdate: value || null };
        }
        if (field === "notes") {
          return { ...prev, notes: value };
        }
        return { ...prev, [field]: value };
      });
    };

  const handleGoalModeChange = (mode: UserProfile["goal"]["mode"]) => {
    updateProfile((prev) => ({
      ...prev,
      goal: {
        ...prev.goal,
        mode,
        deltaPercent:
          mode === "maintain"
            ? 0
            : clamp(prev.goal.deltaPercent, mode === "cut" ? -25 : 5, mode === "cut" ? -5 : 25)
      }
    }));
  };

  const handleGoalDeltaChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = Number.parseFloat(event.target.value);
    updateProfile((prev) => ({
      ...prev,
      goal: { ...prev.goal, deltaPercent: Number.isFinite(raw) ? raw : prev.goal.deltaPercent }
    }));
  };

  const handleActivityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as ActivityLevel;
    updateProfile((prev) => ({
      ...prev,
      activityLevel: value
    }));
    updateSettings((prev) => ({
      ...prev,
      calc: { ...prev.calc, pal: value }
    }));
  };

  const handleTargetModeChange = (mode: UserSettings["targets"]["mode"]) => {
    updateSettings((prev) => ({
      ...prev,
      targets: { ...prev.targets, mode }
    }));
  };

  const handlePresetChange = (name: MacroPresetName) => {
    const preset = MACRO_PRESET_MAP[name];
    updateSettings((prev) => ({
      ...prev,
      targets: {
        ...prev.targets,
        autoPresets: {
          name,
          proteinPercent: preset.protein,
          fatPercent: preset.fat,
          carbsPercent: preset.carbs
        }
      }
    }));
  };

  const handleAutoPercentChange =
    (field: "proteinPercent" | "fatPercent" | "carbsPercent") => (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseFloat(event.target.value);
      if (!Number.isFinite(value)) {
        return;
      }
      updateSettings((prev) => ({
        ...prev,
        targets: {
          ...prev.targets,
          autoPresets: {
            ...prev.targets.autoPresets,
            [field]: value
          }
        }
      }));
    };

  const handleAutoPerKgChange =
    (field: "protein" | "fat") => (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseFloat(event.target.value);
      if (!Number.isFinite(value)) {
        return;
      }
      updateSettings((prev) => ({
        ...prev,
        targets: {
          ...prev.targets,
          autoPerKg: {
            ...prev.targets.autoPerKg,
            [field]: value
          }
        }
      }));
    };

  const handleManualUnitsChange = (unit: UserSettings["targets"]["manualUnits"]) => {
    updateSettings((prev) => ({
      ...prev,
      targets: { ...prev.targets, manualUnits: unit }
    }));
  };

  const handleManualMacroChange =
    (field: keyof UserSettings["targets"]["manual"]) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseFloat(event.target.value);
      updateSettings((prev) => ({
        ...prev,
        targets: {
          ...prev.targets,
          manual: {
            ...prev.targets.manual,
            [field]: Number.isFinite(value) ? value : prev.targets.manual[field]
          }
        }
      }));
    };

  const handleTargetsKcalChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(event.target.value);
    if (!Number.isFinite(value)) {
      return;
    }
    updateSettings((prev) => ({
      ...prev,
      targets: { ...prev.targets, kcal: value }
    }));
  };

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLang = event.target.value as "en" | "ru";
    updateSettings((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        language: nextLang
      }
    }));
    setLanguage(nextLang);
  };

  const handleUnitsChange =
    (unit: "mass" | "volume") => (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value as "g" | "kg" | "ml" | "l";
      updateSettings((prev) => ({
        ...prev,
        ui: {
          ...prev.ui,
          units: {
            ...prev.ui.units,
            [unit]: value
          }
        }
      }));
    };

  const handleNumberDecimalsChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = Number.parseInt(event.target.value, 10) as 0 | 1 | 2;
    updateSettings((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        numberDecimals: value
      }
    }));
  };

  const handleDateFormatChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as "YYYY-MM-DD" | "DD.MM.YYYY";
    updateSettings((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        dateFormat: value
      }
    }));
  };

  const handleSectionToggle = (id: string, enabled: boolean) => {
    updateSettings((prev) => ({
      ...prev,
      meals: {
        ...prev.meals,
        sections: prev.meals.sections.map((section) =>
          section.id === id ? { ...section, enabled } : section
        )
      }
    }));
  };

  const handleSectionLabelChange = (id: string, value: string) => {
    updateSettings((prev) => ({
      ...prev,
      meals: {
        ...prev.meals,
        sections: prev.meals.sections.map((section) =>
          section.id === id ? { ...section, label: value } : section
        )
      }
    }));
  };

  const handleAddSection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const label = String(formData.get("sectionLabel") ?? "").trim();
    if (!label) {
      return;
    }
    const slug = createSlug(label) || `section-${Date.now()}`;
    updateSettings((prev) => ({
      ...prev,
      meals: {
        ...prev.meals,
        sections: [...prev.meals.sections, { id: slug, label, enabled: true }]
      }
    }));
    form.reset();
  };

  const reorderSections = (targetId: string) => {
    if (!dragSectionId || dragSectionId === targetId) {
      return;
    }
    updateSettings((prev) => {
      const current = [...prev.meals.sections];
      const fromIndex = current.findIndex((item) => item.id === dragSectionId);
      const toIndex = current.findIndex((item) => item.id === targetId);
      if (fromIndex === -1 || toIndex === -1) {
        return prev;
      }
      const [removed] = current.splice(fromIndex, 1);
      current.splice(toIndex, 0, removed);
      return {
        ...prev,
        meals: {
          ...prev.meals,
          sections: current
        }
      };
    });
  };

  const handleCategoryNameChange = (id: string, value: string) => {
    updateSettings((prev) => ({
      ...prev,
      shopping: {
        ...prev.shopping,
        categories: prev.shopping.categories.map((category) =>
          category.id === id ? { ...category, name: value } : category
        )
      }
    }));
  };

  const handleAddCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("categoryName") ?? "").trim();
    if (!name) {
      return;
    }
    const slug = createSlug(name) || `category-${Date.now()}`;
    updateSettings((prev) => ({
      ...prev,
      shopping: {
        ...prev.shopping,
        categories: [...prev.shopping.categories, { id: slug, name, builtin: false }]
      }
    }));
    form.reset();
  };

  const reorderCategories = (targetId: string) => {
    if (!dragCategoryId || dragCategoryId === targetId) {
      return;
    }
    updateSettings((prev) => {
      const current = [...prev.shopping.categories];
      const fromIndex = current.findIndex((item) => item.id === dragCategoryId);
      const toIndex = current.findIndex((item) => item.id === targetId);
      if (fromIndex === -1 || toIndex === -1) {
        return prev;
      }
      const [removed] = current.splice(fromIndex, 1);
      current.splice(toIndex, 0, removed);
      return {
        ...prev,
        shopping: {
          ...prev.shopping,
          categories: current
        }
      };
    });
  };

  const handleRemoveCategory = (id: string) => {
    updateSettings((prev) => ({
      ...prev,
      shopping: {
        ...prev.shopping,
        categories: prev.shopping.categories.filter((category) => category.id !== id)
      }
    }));
  };

  const handleAiModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const mode = event.target.value as UserSettings["ai"]["mode"];
    updateSettings((prev) => ({
      ...prev,
      ai: {
        ...prev.ai,
        mode
      }
    }));
  };

  const handleAiInputChange =
    (field: keyof UserSettings["ai"]) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      updateSettings((prev) => ({
        ...prev,
        ai: {
          ...prev.ai,
          [field]:
            field === "timeoutMs"
              ? Number.parseInt(value, 10) || prev.ai.timeoutMs
              : value
        }
      }));
    };

  const handleTestConnection = async () => {
    setConnectionStatus({ type: "info", message: t("settings.ai.testing") });
    const ai = settings.ai;
    if (ai.mode === "http") {
      if (!ai.baseUrl || !ai.modelName) {
        setConnectionStatus({ type: "error", message: t("settings.ai.error.missingFields") });
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
    setConnectionStatus({ type: "success", message: t("settings.ai.success") });
  };

  const hasErrors =
    hasErrorsObject(profileErrors) || hasErrorsObject(macroErrors) || Boolean(mealsErrors) || Boolean(shoppingErrors);

  const renderAutosaveState = () => {
    switch (autosaveState) {
      case "saving":
        return t("settings.autosave.saving");
      case "saved":
        return t("settings.autosave.saved");
      case "error":
        return t("settings.autosave.error");
      default:
        return dirtyRef.current ? t("settings.autosave.pending") : t("settings.autosave.idle");
    }
  };

  const renderProfileTab = () => (
    <div className={styles.tabGrid}>
      <section className={styles.cardLarge}>
        <h2>{t("settings.profile.title")}</h2>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>{t("settings.profile.name")}</span>
            <input value={profile.name} onChange={handleProfileInput("name")} />
          </label>
          <div className={styles.field}>
            <span>{t("settings.profile.sex")}</span>
            <div className={styles.inlineOptions}>
              {(["female", "male", "unspecified"] as const).map((value) => (
                <label key={value} className={styles.radio}>
                  <input
                    type="radio"
                    name="sex"
                    value={value}
                    checked={profile.sex === value}
                    onChange={() =>
                      updateProfile((prev) => ({
                        ...prev,
                        sex: value
                      }))
                    }
                  />
                  <span>{t(`settings.profile.sex.${value}` as const)}</span>
                </label>
              ))}
            </div>
          </div>
          <label className={styles.field}>
            <span>{t("settings.profile.birthdate")}</span>
            <input type="date" value={profile.birthdate ?? ""} onChange={handleProfileInput("birthdate")} />
            {profileErrors.birthdate && <span className={styles.error}>{profileErrors.birthdate}</span>}
          </label>
          <label className={styles.field}>
            <span>{t("settings.profile.height")}</span>
            <input
              type="number"
              value={profile.heightCm ?? ""}
              onChange={handleProfileInput("heightCm")}
              placeholder="170"
            />
            {profileErrors.heightCm && <span className={styles.error}>{profileErrors.heightCm}</span>}
          </label>
          <label className={styles.field}>
            <span>{t("settings.profile.weight")}</span>
            <input
              type="number"
              value={profile.weightKg ?? ""}
              onChange={handleProfileInput("weightKg")}
              placeholder="60"
            />
            {profileErrors.weightKg && <span className={styles.error}>{profileErrors.weightKg}</span>}
          </label>
          <label className={styles.field}>
            <span>{t("settings.profile.activity")}</span>
            <select value={profile.activityLevel} onChange={handleActivityChange}>
              {(["sedentary", "light", "moderate", "active", "very_active"] as const).map((value) => (
                <option key={value} value={value}>
                  {t(`settings.profile.activity.${value}` as const)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>{t("settings.profile.goal.mode")}</span>
            <select value={profile.goal.mode} onChange={(event) => handleGoalModeChange(event.target.value as UserProfile["goal"]["mode"])}>
              {(["cut", "maintain", "bulk"] as const).map((value) => (
                <option key={value} value={value}>
                  {t(`settings.profile.goal.${value}` as const)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>{t("settings.profile.goal.delta")}</span>
            <input
              type="number"
              value={profile.goal.deltaPercent}
              onChange={handleGoalDeltaChange}
              step={1}
            />
            {profileErrors.goalDelta && <span className={styles.error}>{profileErrors.goalDelta}</span>}
          </label>
          <label className={`${styles.field} ${styles.fieldFull}`}>
            <span>{t("settings.profile.notes")}</span>
            <textarea value={profile.notes} onChange={handleProfileInput("notes")} rows={4} />
          </label>
        </div>
      </section>
      <section className={styles.cardSmall}>
        <h3>{t("settings.profile.preview.title")}</h3>
        <dl className={styles.previewList}>
          <div>
            <dt>{t("settings.profile.preview.bmr")}</dt>
            <dd>{macroPreview.bmr ? `${Math.round(macroPreview.bmr)} ${t("settings.common.kcal")}` : "—"}</dd>
          </div>
          <div>
            <dt>{t("settings.profile.preview.tdee")}</dt>
            <dd>{macroPreview.tdee ? `${Math.round(macroPreview.tdee)} ${t("settings.common.kcal")}` : "—"}</dd>
          </div>
          <div>
            <dt>{t("settings.profile.preview.adjusted")}</dt>
            <dd>
              {macroPreview.adjusted ? `${Math.round(macroPreview.adjusted)} ${t("settings.common.kcal")}` : "—"}
            </dd>
          </div>
          <div>
            <dt>{t("settings.profile.preview.protein")}</dt>
            <dd>{macroPreview.targets.protein ? `${macroPreview.targets.protein} ${t("settings.common.grams")}` : "—"}</dd>
          </div>
          <div>
            <dt>{t("settings.profile.preview.fat")}</dt>
            <dd>{macroPreview.targets.fat ? `${macroPreview.targets.fat} ${t("settings.common.grams")}` : "—"}</dd>
          </div>
          <div>
            <dt>{t("settings.profile.preview.carbs")}</dt>
            <dd>{macroPreview.targets.carbs ? `${macroPreview.targets.carbs} ${t("settings.common.grams")}` : "—"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );

  const renderMacrosTab = () => (
    <div className={styles.tabStack}>
      <section className={styles.cardLarge}>
        <h2>{t("settings.macros.title")}</h2>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>{t("settings.macros.formula")}</span>
            <select
              value={settings.calc.formula}
              onChange={(event) =>
                updateSettings((prev) => ({
                  ...prev,
                  calc: { ...prev.calc, formula: event.target.value as UserSettings["calc"]["formula"] }
                }))
              }
            >
              {(["mifflin", "katch", "harris"] as const).map((value) => (
                <option key={value} value={value}>
                  {t(`settings.macros.formula.${value}` as const)}
                </option>
              ))}
            </select>
          </label>
          {settings.calc.formula === "katch" && (
            <label className={styles.field}>
              <span>{t("settings.macros.bodyFat")}</span>
              <input
                type="number"
                value={settings.calc.bodyFatPercent ?? ""}
                onChange={(event) =>
                  updateSettings((prev) => ({
                    ...prev,
                    calc: {
                      ...prev.calc,
                      bodyFatPercent: Number.parseFloat(event.target.value) || null
                    }
                  }))
                }
                placeholder="18"
              />
            </label>
          )}
          <label className={styles.field}>
            <span>{t("settings.macros.pal")}</span>
            <select
              value={settings.calc.pal}
              onChange={(event) =>
                updateSettings((prev) => ({
                  ...prev,
                  calc: {
                    ...prev.calc,
                    pal: event.target.value as ActivityLevel
                  }
                }))
              }
            >
              {(["sedentary", "light", "moderate", "active", "very_active"] as const).map((value) => (
                <option key={value} value={value}>
                  {t(`settings.profile.activity.${value}` as const)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>{t("settings.macros.goalDelta")}</span>
            <input
              type="number"
              value={settings.calc.goalDeltaPercent}
              onChange={(event) =>
                updateSettings((prev) => ({
                  ...prev,
                  calc: { ...prev.calc, goalDeltaPercent: Number.parseFloat(event.target.value) || 0 }
                }))
              }
            />
          </label>
          <label className={styles.field}>
            <span>{t("settings.macros.mode")}</span>
            <select value={settings.targets.mode} onChange={(event) => handleTargetModeChange(event.target.value as UserSettings["targets"]["mode"])}>
              {(["auto_percent", "auto_per_kg", "manual"] as const).map((value) => (
                <option key={value} value={value}>
                  {t(`settings.macros.mode.${value}` as const)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>{t("settings.macros.kcal")}</span>
            <input type="number" value={settings.targets.kcal} onChange={handleTargetsKcalChange} />
            {macroErrors.kcal && <span className={styles.error}>{macroErrors.kcal}</span>}
          </label>
        </div>

        {settings.targets.mode === "auto_percent" && (
          <div className={styles.subCard}>
            <div className={styles.subHeader}>
              <h3>{t("settings.macros.autoPercent.title")}</h3>
              <div className={styles.inlineOptions}>
                {(["balanced", "high_protein", "low_fat"] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={clsx(styles.pillButton, settings.targets.autoPresets.name === preset && styles.pillButtonActive)}
                    onClick={() => handlePresetChange(preset)}
                  >
                    {t(`settings.macros.preset.${preset}` as const)}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>{t("settings.macros.autoPercent.protein")}</span>
                <input
                  type="number"
                  value={settings.targets.autoPresets.proteinPercent}
                  onChange={handleAutoPercentChange("proteinPercent")}
                />
              </label>
              <label className={styles.field}>
                <span>{t("settings.macros.autoPercent.fat")}</span>
                <input
                  type="number"
                  value={settings.targets.autoPresets.fatPercent}
                  onChange={handleAutoPercentChange("fatPercent")}
                />
              </label>
              <label className={styles.field}>
                <span>{t("settings.macros.autoPercent.carbs")}</span>
                <input
                  type="number"
                  value={settings.targets.autoPresets.carbsPercent}
                  onChange={handleAutoPercentChange("carbsPercent")}
                />
              </label>
            </div>
            {macroErrors.percentSum && <div className={styles.error}>{macroErrors.percentSum}</div>}
          </div>
        )}

        {settings.targets.mode === "auto_per_kg" && (
          <div className={styles.subCard}>
            <h3>{t("settings.macros.autoKg.title")}</h3>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>{t("settings.macros.autoKg.protein")}</span>
                <input
                  type="number"
                  step="0.1"
                  value={settings.targets.autoPerKg.protein}
                  onChange={handleAutoPerKgChange("protein")}
                />
                {macroErrors.protein && <span className={styles.error}>{macroErrors.protein}</span>}
              </label>
              <label className={styles.field}>
                <span>{t("settings.macros.autoKg.fat")}</span>
                <input
                  type="number"
                  step="0.1"
                  value={settings.targets.autoPerKg.fat}
                  onChange={handleAutoPerKgChange("fat")}
                />
                {macroErrors.fat && <span className={styles.error}>{macroErrors.fat}</span>}
              </label>
            </div>
            {macroErrors.perKg && <div className={styles.error}>{macroErrors.perKg}</div>}
          </div>
        )}

        {settings.targets.mode === "manual" && (
          <div className={styles.subCard}>
            <h3>{t("settings.macros.manual.title")}</h3>
            <div className={styles.inlineOptions}>
              {(["grams", "percent"] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  className={clsx(styles.pillButton, settings.targets.manualUnits === unit && styles.pillButtonActive)}
                  onClick={() => handleManualUnitsChange(unit)}
                >
                  {t(`settings.macros.manual.units.${unit}` as const)}
                </button>
              ))}
            </div>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>{t("settings.macros.manual.protein")}</span>
                <input
                  type="number"
                  value={settings.targets.manual.protein}
                  onChange={handleManualMacroChange("protein")}
                />
              </label>
              <label className={styles.field}>
                <span>{t("settings.macros.manual.fat")}</span>
                <input type="number" value={settings.targets.manual.fat} onChange={handleManualMacroChange("fat")} />
              </label>
              <label className={styles.field}>
                <span>{t("settings.macros.manual.carbs")}</span>
                <input
                  type="number"
                  value={settings.targets.manual.carbs}
                  onChange={handleManualMacroChange("carbs")}
                />
              </label>
              <label className={styles.field}>
                <span>{t("settings.macros.manual.sugar")}</span>
                <input
                  type="number"
                  value={settings.targets.manual.sugar}
                  onChange={handleManualMacroChange("sugar")}
                />
              </label>
              <label className={styles.field}>
                <span>{t("settings.macros.manual.fiber")}</span>
                <input
                  type="number"
                  value={settings.targets.manual.fiber}
                  onChange={handleManualMacroChange("fiber")}
                />
              </label>
            </div>
          </div>
        )}
      </section>

      <section className={styles.cardSmall}>
        <h3>{t("settings.macros.preview.title")}</h3>
        <dl className={styles.previewList}>
          <div>
            <dt>{t("settings.profile.preview.adjusted")}</dt>
            <dd>
              {macroPreview.adjusted ? `${Math.round(macroPreview.adjusted)} ${t("settings.common.kcal")}` : "—"}
            </dd>
          </div>
          <div>
            <dt>{t("settings.profile.preview.protein")}</dt>
            <dd>{macroPreview.targets.protein ? `${macroPreview.targets.protein} ${t("settings.common.grams")}` : "—"}</dd>
          </div>
          <div>
            <dt>{t("settings.profile.preview.fat")}</dt>
            <dd>{macroPreview.targets.fat ? `${macroPreview.targets.fat} ${t("settings.common.grams")}` : "—"}</dd>
          </div>
          <div>
            <dt>{t("settings.profile.preview.carbs")}</dt>
            <dd>{macroPreview.targets.carbs ? `${macroPreview.targets.carbs} ${t("settings.common.grams")}` : "—"}</dd>
          </div>
        </dl>
        {macroWarnings.length > 0 && (
          <ul className={styles.warningList}>
            {macroWarnings.map((warning) => (
              <li key={warning}>{t(`settings.macros.warning.${warning}` as const)}</li>
            ))}
          </ul>
        )}
        {hasErrorsObject(macroErrors) && (
          <ul className={styles.warningList}>
            {Object.entries(macroErrors)
              .filter(([, message]) => message)
              .map(([key, message]) => (
                <li key={key}>{message}</li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );

  const renderMealsTab = () => (
    <div className={styles.tabStack}>
      <section className={styles.cardLarge}>
        <h2>{t("settings.meals.title")}</h2>
        <div className={styles.listHeader}>
          <Checkbox
            id="section-totals"
            label={t("settings.meals.showTotals")}
            checked={settings.meals.showSectionTotals}
            onChange={(checked) =>
              updateSettings((prev) => ({
                ...prev,
                meals: {
                  ...prev.meals,
                  showSectionTotals: checked
                }
              }))
            }
          />
        </div>
        <div className={styles.sortableList}>
          {settings.meals.sections.map((section) => (
            <div
              key={section.id}
              className={styles.sortableItem}
              draggable
              onDragStart={() => setDragSectionId(section.id)}
              onDragOver={(event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                if (dragSectionId && dragSectionId !== section.id) {
                  event.currentTarget.classList.add(styles.dragOver);
                }
              }}
              onDragLeave={(event: DragEvent<HTMLDivElement>) => {
                event.currentTarget.classList.remove(styles.dragOver);
              }}
              onDrop={(event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                event.currentTarget.classList.remove(styles.dragOver);
                reorderSections(section.id);
              }}
            >
              <div className={styles.sortableHandle}>⋮⋮</div>
              <Checkbox
                id={`meal-${section.id}`}
                label=""
                checked={section.enabled}
                onChange={(checked) => handleSectionToggle(section.id, checked)}
              />
              <div className={styles.sortableBody}>
                <input
                  value={section.label}
                  onChange={(event) => handleSectionLabelChange(section.id, event.target.value)}
                />
                <span className={styles.muted}>/{section.id}</span>
              </div>
            </div>
          ))}
        </div>
        {mealsErrors && <div className={styles.error}>{mealsErrors}</div>}
        <form className={styles.addInline} onSubmit={handleAddSection}>
          <input name="sectionLabel" placeholder={t("settings.meals.addPlaceholder")} />
          <Button type="submit" variant="outlined">
            {t("settings.meals.addSection")}
          </Button>
        </form>
      </section>
    </div>
  );

  const renderShoppingTab = () => (
    <div className={styles.tabStack}>
      <section className={styles.cardLarge}>
        <h2>{t("settings.shopping.title")}</h2>
        <div className={styles.listHeader}>
          <Checkbox
            id="shopping-sort"
            label={t("settings.shopping.sort")}
            checked={settings.shopping.sortUnpurchasedFirst}
            onChange={(checked) =>
              updateSettings((prev) => ({
                ...prev,
                shopping: {
                  ...prev.shopping,
                  sortUnpurchasedFirst: checked
                }
              }))
            }
          />
        </div>
        <div className={styles.sortableList}>
          {settings.shopping.categories.map((category) => (
            <div
              key={category.id}
              className={styles.sortableItem}
              draggable={!category.builtin}
              onDragStart={() => {
                if (!category.builtin) {
                  setDragCategoryId(category.id);
                }
              }}
              onDragEnd={() => {
                setDragCategoryId(null);
              }}
              onDragOver={(event: DragEvent<HTMLDivElement>) => {
                if (!category.builtin && dragCategoryId && dragCategoryId !== category.id) {
                  event.preventDefault();
                  event.currentTarget.classList.add(styles.dragOver);
                }
              }}
              onDragLeave={(event: DragEvent<HTMLDivElement>) => {
                event.currentTarget.classList.remove(styles.dragOver);
              }}
              onDrop={(event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                event.currentTarget.classList.remove(styles.dragOver);
                if (dragCategoryId && dragCategoryId !== category.id) {
                  reorderCategories(category.id);
                }
                setDragCategoryId(null);
              }}
            >
              <div className={styles.sortableHandle}>⋮⋮</div>
              <div className={styles.sortableBody}>
                <input
                  value={category.name}
                  onChange={(event) => handleCategoryNameChange(category.id, event.target.value)}
                  disabled={category.builtin}
                />
                <span className={styles.muted}>/{category.id}</span>
              </div>
              {!category.builtin && (
                <Button variant="ghost" onClick={() => handleRemoveCategory(category.id)}>
                  {t("settings.shopping.remove")}
                </Button>
              )}
            </div>
          ))}
        </div>
        {shoppingErrors && <div className={styles.error}>{shoppingErrors}</div>}
        <form className={styles.addInline} onSubmit={handleAddCategory}>
          <input name="categoryName" placeholder={t("settings.shopping.addPlaceholder")} />
          <Button type="submit" variant="outlined">
            {t("settings.shopping.addCategory")}
          </Button>
        </form>
      </section>
    </div>
  );

  const renderInterfaceTab = () => (
    <div className={styles.tabStack}>
      <section className={styles.cardLarge}>
        <h2>{t("settings.interface.title")}</h2>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>{t("settings.interface.language")}</span>
            <select value={settings.ui.language} onChange={handleLanguageChange}>
              <option value="en">{t("settings.interface.language.en")}</option>
              <option value="ru">{t("settings.interface.language.ru")}</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>{t("settings.interface.mass")}</span>
            <select value={settings.ui.units.mass} onChange={handleUnitsChange("mass")}>
              <option value="g">{t("settings.interface.mass.g")}</option>
              <option value="kg">{t("settings.interface.mass.kg")}</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>{t("settings.interface.volume")}</span>
            <select value={settings.ui.units.volume} onChange={handleUnitsChange("volume")}>
              <option value="ml">{t("settings.interface.volume.ml")}</option>
              <option value="l">{t("settings.interface.volume.l")}</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>{t("settings.interface.decimals")}</span>
            <select value={settings.ui.numberDecimals} onChange={handleNumberDecimalsChange}>
              <option value={0}>0</option>
              <option value={1}>0.0</option>
              <option value={2}>0.00</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>{t("settings.interface.dateFormat")}</span>
            <select value={settings.ui.dateFormat} onChange={handleDateFormatChange}>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD.MM.YYYY">DD.MM.YYYY</option>
            </select>
          </label>
        </div>
      </section>
    </div>
  );

  const renderAiTab = () => (
    <div className={styles.tabStack}>
      <section className={styles.cardLarge}>
        <h2>{t("settings.ai.title")}</h2>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>{t("settings.ai.mode")}</span>
            <select value={settings.ai.mode} onChange={handleAiModeChange}>
              <option value="local">{t("settings.ai.mode.local")}</option>
              <option value="http">{t("settings.ai.mode.http")}</option>
              <option value="manual">{t("settings.ai.mode.manual")}</option>
            </select>
          </label>
          {settings.ai.mode !== "manual" && (
            <>
              <label className={styles.field}>
                <span>{t("settings.ai.baseUrl")}</span>
                <input value={settings.ai.baseUrl} onChange={handleAiInputChange("baseUrl")} placeholder="https://..." />
              </label>
              <label className={styles.field}>
                <span>{t("settings.ai.apiKey")}</span>
                <input
                  type="password"
                  value={settings.ai.apiKey}
                  onChange={handleAiInputChange("apiKey")}
                  placeholder="••••••"
                />
              </label>
              <label className={styles.field}>
                <span>{t("settings.ai.modelName")}</span>
                <input value={settings.ai.modelName} onChange={handleAiInputChange("modelName")} />
              </label>
              <label className={styles.field}>
                <span>{t("settings.ai.timeout")}</span>
                <input type="number" value={settings.ai.timeoutMs} onChange={handleAiInputChange("timeoutMs")} />
              </label>
            </>
          )}
          <label className={`${styles.field} ${styles.fieldFull}`}>
            <span>{t("settings.ai.template")}</span>
            <textarea value={settings.ai.responseTemplate} onChange={handleAiInputChange("responseTemplate")} rows={6} />
          </label>
        </div>
        <div className={styles.aiActions}>
          <Button variant="outlined" onClick={handleTestConnection}>
            {t("settings.ai.test")}
          </Button>
          {connectionStatus && (
            <span
              className={clsx(
                styles.inlineStatus,
                connectionStatus.type === "success" && styles.statusSuccess,
                connectionStatus.type === "error" && styles.statusError,
                connectionStatus.type === "info" && styles.statusInfo
              )}
            >
              {connectionStatus.message}
            </span>
          )}
        </div>
      </section>
    </div>
  );

  const renderVaultTab = () => (
    <div className={styles.tabStack}>
      <section className={styles.cardLarge}>
        <h2>{t("settings.vault.title")}</h2>
        <p className={styles.muted}>{t("settings.vault.description")}</p>
        <div className={styles.vaultInfoCard}>
          <span className={styles.vaultLabel}>
            {vaultHandle ? t("settings.vault.current", { folder: vaultHandle.name }) : t("settings.vault.empty")}
          </span>
          <div className={styles.vaultActions}>
            <Button variant="outlined" onClick={handleSelectVault}>
              {t("settings.vault.select")}
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await clearVaultDirectoryHandle();
                setVaultHandle(null);
                setProfile(DEFAULT_USER_PROFILE);
                setSettings(DEFAULT_USER_SETTINGS);
              }}
            >
              {t("settings.vault.clear")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      case "macros":
        return renderMacrosTab();
      case "meals":
        return renderMealsTab();
      case "shopping":
        return renderShoppingTab();
      case "interface":
        return renderInterfaceTab();
      case "ai":
        return renderAiTab();
      case "vault":
        return renderVaultTab();
      default:
        return null;
    }
  };

  return (
    <div className={styles.root}>
      <header className={styles.topBar}>
        <div>
          <h1 className={styles.title}>{t("settings.title")}</h1>
          <p className={styles.subtitle}>{t("settings.subtitle")}</p>
        </div>
        <div className={styles.actions}>
          <span className={styles.autosaveState}>{renderAutosaveState()}</span>
          <Button variant="outlined" onClick={() => void handleSave()} disabled={isMutating || !vaultHandle || hasErrors}>
            {t("settings.saveNow")}
          </Button>
        </div>
      </header>

      <nav className={styles.tabBar}>
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            type="button"
            className={clsx(styles.tabButton, tab === activeTab && styles.tabButtonActive)}
            onClick={() => setActiveTab(tab)}
          >
            {t(`settings.tabs.${tab}` as const)}
          </button>
        ))}
      </nav>

      {status && (
        <div
          className={clsx(
            styles.statusBanner,
            status.type === "success" && styles.statusSuccess,
            status.type === "error" && styles.statusError,
            status.type === "info" && styles.statusInfo
          )}
        >
          {status.message}
        </div>
      )}
      {isLoading ? <div className={styles.loading}>{t("settings.loading")}</div> : renderTab()}
    </div>
  );
}
