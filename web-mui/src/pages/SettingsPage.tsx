import { CircularProgress, Paper, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { getAiUsage, getCachedAiUsage, type AiUsageState } from "../features/ai/api/aiUsageApi";
import {
  getCurrentUserSettings,
  saveUserProfile,
  type UserProfile
} from "../features/settings/api/settingsApi";
import { getAiAgentSettings, setAiAgentSettings, type AiAgentSettings } from "../shared/config/aiAgent";
import { getAppPreferences, setAppPreferences, type AppPreferences } from "../shared/config/appPreferences";
import { AppFeedbackToast } from "../shared/ui/AppFeedbackToast";
import { PageTitle } from "../shared/ui/PageTitle";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { AiAgentSettingsCard } from "../widgets/settings/AiAgentSettingsCard";
import { AppPreferencesCard } from "../widgets/settings/AppPreferencesCard";
import { ProfilePreviewCard } from "../widgets/settings/ProfilePreviewCard";
import { SettingsSectionCard } from "../widgets/settings/SettingsSectionCard";
import { isSettingsSectionId } from "../widgets/settings/settingsSections";
import { UserProfileForm } from "../widgets/settings/UserProfileForm";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
  registerPageLoading: (value: boolean) => void;
  clearPageLoading: () => void;
};

export function SettingsPage() {
  const { t } = useLanguage();
  const { openSidebar, registerPageLoading, clearPageLoading } = useOutletContext<LayoutContext>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedProfile, setSavedProfile] = useState<UserProfile | null>(null);
  const [agentSettings, setAgentSettingsState] = useState<AiAgentSettings>(getAiAgentSettings());
  const [aiUsage, setAiUsage] = useState<AiUsageState | null>(getCachedAiUsage());
  const [appPreferences, setAppPreferencesState] = useState<AppPreferences>(getAppPreferences());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success" | "info"; message: string } | null>(null);
  const [searchParams] = useSearchParams();

  const activeSection = useMemo(() => {
    const rawSection = searchParams.get("section");
    return isSettingsSectionId(rawSection) ? rawSection : "profile";
  }, [searchParams]);

  function mergeProfileFormulas(nextProfile: UserProfile, fallbackProfile: UserProfile | null): UserProfile {
    if (nextProfile.availableTargetFormulas.length > 0) {
      return nextProfile;
    }

    return {
      ...nextProfile,
      targetFormula: nextProfile.targetFormula || fallbackProfile?.targetFormula || "",
      availableTargetFormulas: fallbackProfile?.availableTargetFormulas ?? []
    };
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setFeedback(null);
        const current = await getCurrentUserSettings();
        if (!cancelled) {
          const nextProfile = mergeProfileFormulas(current.profile, null);
          setProfile(nextProfile);
          setSavedProfile(nextProfile);
          setAgentSettingsState(getAiAgentSettings());
          setAppPreferencesState(getAppPreferences());
        }
        try {
          const nextUsage = await getAiUsage();
          if (!cancelled) {
            setAiUsage(nextUsage);
          }
        } catch (error) {
          console.error("Failed to load AI usage", error);
        }
      } catch (error) {
        console.error("Failed to load settings", error);
        if (!cancelled) {
          setFeedback({ type: "error", message: t("settings.status.loadError") });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    registerPageLoading(isLoading);
    return () => {
      clearPageLoading();
    };
  }, [clearPageLoading, isLoading, registerPageLoading]);

  async function handleSave() {
    if (!profile) {
      return;
    }
    try {
      setIsSubmitting(true);
      const saved = await saveUserProfile(profile);
      const nextProfile = mergeProfileFormulas(saved, profile);
      setProfile(nextProfile);
      setSavedProfile(nextProfile);
      setFeedback({ type: "success", message: t("settings.status.saved") });
    } catch (error) {
      console.error("Failed to save profile", error);
      setFeedback({ type: "error", message: t("settings.status.saveError") });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveAgentSettings(value: AiAgentSettings) {
    try {
      setIsSubmitting(true);
      setAiAgentSettings(value);
      await new Promise((resolve) => window.setTimeout(resolve, 280));
      setAgentSettingsState(value);
      setFeedback({ type: "success", message: t("settings.agent.saved") });
    } catch (error) {
      console.error("Failed to save AI agent settings", error);
      setFeedback({ type: "error", message: t("settings.status.saveError") });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSavePreferences(value: AppPreferences) {
    try {
      setIsSubmitting(true);
      setAppPreferences(value);
      await new Promise((resolve) => window.setTimeout(resolve, 280));
      setAppPreferencesState(value);
      setFeedback({ type: "success", message: t("settings.preferences.saved") });
    } catch (error) {
      console.error("Failed to save app preferences", error);
      setFeedback({ type: "error", message: t("settings.status.saveError") });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Paper sx={{ p: 8, borderRadius: 1.25, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      <DashboardTopbar onOpenSidebar={openSidebar} title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <PageTitle title={t("settings.title")} />

      {profile ? (
        <Stack spacing={3}>
          {activeSection === "profile" ? (
            <SettingsSectionCard title={t("settings.sections.profile.title")} subtitle={t("settings.sections.profile.subtitle")}>
              <Stack spacing={3.5}>
                <UserProfileForm
                  value={profile}
                  isSubmitting={isSubmitting}
                  status={null}
                  onChange={setProfile}
                  onSave={handleSave}
                />
                <ProfilePreviewCard profile={savedProfile ?? profile} />
              </Stack>
            </SettingsSectionCard>
          ) : null}

          {activeSection === "general" ? (
            <SettingsSectionCard title={t("settings.sections.general.title")} subtitle={t("settings.sections.general.subtitle")}>
              <AppPreferencesCard value={appPreferences} isSubmitting={isSubmitting} onSave={handleSavePreferences} />
            </SettingsSectionCard>
          ) : null}

          {activeSection === "openai" ? (
            <SettingsSectionCard title={t("settings.sections.openai.title")} subtitle={t("settings.sections.openai.subtitle")}>
              <AiAgentSettingsCard value={agentSettings} usage={aiUsage} isSubmitting={isSubmitting} onSave={handleSaveAgentSettings} />
            </SettingsSectionCard>
          ) : null}
        </Stack>
      ) : null}

      <AppFeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />
    </Stack>
  );
}
